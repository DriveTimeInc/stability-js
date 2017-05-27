import Circuit from './circuit';
import Metrics from './metrics';

/** Experimental metrics-based circuit */
export default class MetricsBasedCircuit extends Circuit {
	constructor(name, timeout) {
		super(name, timeout);

		this.metrics = new Metrics(1000, [1 * 60000, 5 * 60000]);
		this.metrics.subscribe(this);
		this.metrics.start(10000);

		this.on('error', err => {
			if (this.state == Circuit.HALFOPEN) {
				this.disable(`Circuit '${this.name}' was unsuccessfully used while half-open.`);
			} else {
				this.metrics.run();
			}
		});

		this.on('success', ms => {
			if (this.state == Circuit.HALFOPEN) {
				this.enable(`Circuit '${this.name}' was successfully used while half-open.`);
			}
		});

		this.metrics.on('metrics', metrics => {
			const oneMinuteErrors = metrics.successes[1 * 60000].count;

			if (oneMinuteErrors > 10) {
				this.disable(`Circuit '${this.name}' was disabled after 10 errors in one minute.`);
			}
		});
	}
}
