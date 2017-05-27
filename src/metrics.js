import EventEmitter from 'events';

import Circuit from './circuit';

export default class Metrics extends EventEmitter {
	/**
	 * Creates a new Metrics object for computing circuit performance
	 * @param {number} buckets the number of buckets in the each of the event buffers
	 * @param {number[]} intervals the spans of time (in ms) over which metrics will be computed (eg, 1 * 60000ms, 5 * 60000ms, etc)
	 */
	constructor(buckets, intervals) {
		super();
		this.successes = [];
		this.failures = [];

		this._successIndex = 0;
		this._failureIndex = 0;
		this._buckets = buckets;
		this._intervals = intervals;

		this._isRunning = true;
	}

	/**
	 * Starts re-computing metrics at the specified interval until stop() is called.
	 * @param {Number} interval The interval at which metrics are re-computed.
	 */
	start(interval) {
		if (this._isRunning) {
			const tick = () => {
				this.run();
				setTimeout(tick, interval);
			};

			tick();
		}
	}

	/**
	 * Stops all computation of metrics.
	 * @param {Number} interval The interval at which metrics are re-computed.
	 */
	stop() {
		this._isRunning = false;
	}

	run() {
		const newMetrics = {
			success: {},
			failure: {}
		};

		for (let span in this._intervals) {
			newMetrics.success['' + span] = Metrics.computeMetrics(span, this.successes, this._buckets, this._successIndex);
			newMetrics.failure['' + span] = Metrics.computeMetrics(span, this.failures, this._buckets, this._failureIndex);
		}

		this.metrics = newMetrics;
		onMetrics(newMetrics);
	}

	/**
	 * @param {circuit} circuit
	 */
	subscribe(circuit) {
		circuit.on('success', this.handleSuccess.bind(this));
		circuit.on('error', this.handleFailure.bind(this));
	}

	handleSuccess(duration) {
		this.successes[this._successIndex++] = { ts: new Date().getTime(), ms: duration };
		this._successIndex %= this._buckets;
	}

	handleFailure() {
		this.failures[this._failureIndex++] = { ts: new Date().getTime() };
		this._failureIndex %= this._buckets;
	}

	onMetrics(metrics) {
		this.emit('metrics', metrics);
	}

	/**
	 * Computes metrics for the specified array.  The returned object contains:
	 * `count`: the number of events which occurred withing the timespan,
	 * `mean`: the arithmetic mean of the event durations, and
	 * `stdev`: the standard deviation of the event durations
	 * @param {number} span timespan in milliseconds
	 * @param {Array<{ts: number, ms: number}>} array array from which to compute metrics.
	 * `ts` represents the timestamp of the event.
	 * `ms` represents the duration of the event.
	 * @param {number} buckets total number of buckets
	 * @param {number} startIndex index at which to start computing
	 */
	static computeMetrics(span, array, buckets, startIndex) {
		const s = startIndex;
		const n = buckets;
		const now = new Date().getTime();

		let count = 0;
		let average = 0;
		let stdev = 0;
		let sum = 0;
		let ssv = 0;

		// Count and sum
		for (let i = n; i > 0; i--) {
			const element = array[(s + i) % n];
			if (element && element.ts >= now - span) {
				count++;
				sum += element.ms;
			} else {
				break;
			}
		}

		// Average
		if (count) {
			average = sum / count;
		}

		// Sum Square Varience
		for (let i = n; i > 0; i--) {
			const element = array[(s + i) % n];
			if (span && element && element.ts >= now - span) {
				const varience = Math.abs(element.ms - average);
				ssv += varience * varience;
			} else {
				break;
			}
		}

		// Standard Deviation
		if (span && count) {
			stdev = Math.sqrt(ssv / count);
		}

		return {
			count,
			mean: average,
			stdev
		};
	}
}
