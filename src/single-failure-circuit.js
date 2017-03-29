import Circuit from './circuit';

/** Circuit which trips on the first error */
export default class SingleFailureCircit extends Circuit {
	constructor(name, timeout, cooldown) {
		super(name, timeout);
		this.cooldown = cooldown;

		this.on('error', err => {
			this.disable(`Tripped by error: ${err}`, new Date(new Date().getTime() + this.cooldown));
			setTimeout(() => {
				this.halfOpen(`Reset after configured cooldown of ${this.cooldown}ms`);
			}, this.cooldown);
		});

		this.on('success', ms => {
			if (this.state == Circuit.HALFOPEN) {
				this.enable(`Circuit '${this.name}' was successfully used while half-open.`);
			}
		});
	}
}
