import EventEmitter from 'events';
import TestResult from './test-result';

export default class SmokeTest extends EventEmitter {
	constructor(id, description, test, interval) {
		super();

		this.id = id;
		this.description = description;
		this.test = test;
		this.interval = interval;
		this.history = [];

		if (this.interval) {
			const tick = () => {
				this.run();
				setTimeout(tick, this.interval);
			};

			tick();
		}
	}

	/** Gets valued indicating whether the last test result passed.
	 * @returns {boolean}
	 */
	get passing() {
		return this.history[0] ? this.history[0].passed : undefined;
	}

	run() {
		{
			const addResult = result => {
				this.history.unshift({ passed: result.passed, date: new Date(), message: result.message });
				this.history = this.history.slice(0, 10);
			};

			this.test()
				.then(result => {
					addResult(result);
					this.onRun(result);
				})
				.catch(reason => {
					const result = new TestResult(false, `Error while running smoke test: ${reason}`);
					addResult(result);
					this.onError(result);
				});
		}
	}

	/**
	 * Emits a 'run' event indicating that this test was successfully run resulting in either a test pass or fail. Refer to the 'error' event for unhandled errors which occurr while running the test.
	 * @param {TestResult} result
	 * @returns {void}
	 */
	onRun(result) {
		if (result instanceof TestResult) {
			if (this.listenerCount('run') > 0) {
				this.emit('run', result);
			}
		} else {
			throw new Error('result is not an instance of TestResult');
		}
	}

	/**
	 * Emits an 'error' event indicating that an unhandled error occurred while running the test. If the test successfully ran, but resulted in a failure, the 'run' event will be emitted instead.
	 * @param {TestResult} result
	 * @returns {void}
	 */
	onError(result) {
		if (result instanceof TestResult) {
			if (this.listenerCount('error') > 0) {
				this.emit('error', result);
			}
		} else {
			throw new Error('result is not an instance of TestResult');
		}
	}
}
