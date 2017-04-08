import Circuit from './circuit';

/** Circuit which trips after a configured amount of errors have occurred */
export default class MultiFailureCircuit extends Circuit {
	constructor(name, timeout, cooldown, maxFailures) {
		super(name, timeout);
		this.errorCount = 0;
		this.cooldown = cooldown;
		this.maxFailures = maxFailures;

		this.on('error', err => {
			if (++this.errorCount >= this.maxFailures) {
				this.disable(`Tripped after the maximum limit of ${this.maxFailures} errors were met. Latest error: ${err}`, new Date(new Date().getTime() + this.cooldown));
				setTimeout(() => {
					this.halfOpen(`Reset after configured cooldown of ${this.cooldown}ms`);
					this.errorCount = 0;
				}, this.cooldown);
			}
		});

		this.on('success', ms => {
			if (this.state == Circuit.HALFOPEN) {
				this.enable(`Circuit '${this.name}' was successfully used while half-open.`);
				this.errorCount = 0;
			}
		});
	}
}
