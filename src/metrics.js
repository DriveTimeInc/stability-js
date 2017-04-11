import EventEmitter from 'events';

import Circuit from './circuit';

export default class Metrics extends EventEmitter {
	constructor() {
		super();
		this.successes = [];
		this.failures = [];

		this._successIndex = 0;
		this._failureIndex = 0;
		this._buckets = 10;
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

	/**
	 * Computes metrics for the specified array
	 * @param {Number} span timespan in milliseconds
	 * @param {Array} array array from which to compute metrics
	 * @param {Number} buckets total number of buckets
	 * @param {Number} startIndex index at which to start computing
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
