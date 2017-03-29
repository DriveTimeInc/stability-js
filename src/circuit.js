import EventEmitter from 'events';
//import CircuitError from './circuit-error';

export default class Circuit extends EventEmitter {
	constructor(name, timeout) {
		super();
		this.name = name;
		this.timeout = timeout;
		this.history = [];
		this.runs = [];
		this.enable('Initial state');
	}

	/** Gets the current state of this circuit */
	get state() {
		return this.history[0] ? this.history[0].state : undefined;
	}

	/** Gets the reason for the current state of this circuit */
	get reason() {
		return this.history[0] ? this.history[0].reason : undefined;
	}

	/** Gets the time that the current state of this circuit was set */
	get since() {
		return this.history[0] ? this.history[0].date : undefined;
	}

	enable(reason) {
		delete this.retryAfter;
		this.changeState(Circuit.ENABLED, reason);
	}

	disable(reason, retryAfter) {
		if (this.state != Circuit.DISABLED) {
			this.retryAfter = retryAfter;
		}
		this.changeState(Circuit.DISABLED, reason);
	}

	halfOpen(reason) {
		delete this.retryAfter;
		this.changeState(Circuit.HALFOPEN, reason);
	}

	changeState(state, reason) {
		if (state != this.state && (state == Circuit.ENABLED || state == Circuit.DISABLED || state == Circuit.HALFOPEN)) {
			reason = reason || 'Unspecified reason';
			this.history.unshift({
				state,
				reason,
				date: new Date()
			});

			this.history = this.history.slice(0, 10);

			if (this.listeners('change').length > 0) {
				this.emit('change', state, reason);
			}
		}
	}

	/**
	 * Performs an action and then emits a success, error, or reject event based on the outcome.
	 *  - success: the action was successful.
	 *  - error: the action threw an Error that was considered by the circuit to be an error.
	 *  - reject: the action was not run because of the current state of the circuit.
	 * @param {function():Promise<object>} fnPromiseCreator function that constructs and returns a Promise
	 * @param {function(Error):boolean} isError function that accpets an Error and returns value indicating
	 * whether this circuit should count it as an error.  Note that all Errors are throw regardless of whether
	 * or not they are counted as errors.
	 * @return {Promise<object>}
	 */
	async run(fnPromiseCreator, isError) {
		if (this.state == Circuit.DISABLED) {
			if (this.listeners('reject').length > 0) {
				const e = new Date();
				this.emit('reject');
			}
			const err = new Error(`Circuit '${this.name}' cannot be accessed at this time (state: ${this.state})`);
			err.circuit = this;
			throw err;
		} else {
			const s = new Date();
			try {
				const result = await Promise.race([
					fnPromiseCreator(),
					new Promise((_, reject) => setTimeout(() => {
						const err = new Error(`Circuit '${this.name}' timed out after ${this.timeout}ms`);
						err.circuit = this;
						reject(err);
					}, this.timeout))
				]);
				if (this.listenerCount('success') > 0) {
					const e = new Date();
					this.emit('success', e - s);
				}

				return result;
			} catch (ex) {
				if (typeof isError != 'function' || (ex && ex.circuit)) {
					if (this.listenerCount('error') > 0) {
						this.emit('error', ex);
					}
				} else if (isError) {
					if (isError(ex)) {
						if (this.listeners('error').length > 0) {
							this.emit('error', ex);
						}
					} else {
						if (this.listeners('success').length > 0) {
							const e = new Date();
							this.emit('success', e - s);
						}
					}
				}
				throw ex;
			}
		}
	}

	static get ENABLED() {
		return 'ENABLED';
	}

	static get DISABLED() {
		return 'DISABLED';
	}

	static get HALFOPEN() {
		return 'HALFOPEN';
	}
}
