import { assert } from 'chai';
import Circuit from '../src/circuit';
import Metrics from '../src/metrics';

describe('Metrics', function () {
	it('records success', function () {
		// ARRANGE
		const sut = new Metrics();
		const circuit = new Circuit('test');

		sut.subscribe(circuit);

		// ACT
		circuit.onSuccess(500);

		// ASSERT
		assert.equal(sut.successes.length, 1);
		assert.equal(sut._successIndex, 1);
	});

	it('records failure', function () {
		// ARRANGE
		const sut = new Metrics();
		const circuit = new Circuit('test');

		sut.subscribe(circuit);

		// ACT
		circuit.onError({});

		// ASSERT
		assert.equal(sut.failures.length, 1);
		assert.equal(sut._failureIndex, 1);
	});

	it('rolls over success buckets', function () {
		// ARRANGE
		const sut = new Metrics();
		const circuit = new Circuit('test');

		sut.subscribe(circuit);

		const iterations = sut._buckets * 5;

		// ACT
		for (let i = 0; i < iterations; i++) {
			circuit.onSuccess(500);
		}

		// ASSERT
		assert.equal(sut.successes.length, sut._buckets);
	});

	it('rolls over failure buckets', function () {
		// ARRANGE
		const sut = new Metrics();
		const circuit = new Circuit('test');

		sut.subscribe(circuit);

		const iterations = sut._buckets * 5;

		// ACT
		for (let i = 0; i < iterations; i++) {
			circuit.onError({});
		}

		// ASSERT
		assert.equal(sut.failures.length, sut._buckets);
	});

	describe('computeMetrics', function () {
		it('computes from middle of full array', function () {
			// ARRANGE
			const buckets = 5;
			const startIndex = 2;
			const now = new Date().getTime();

			// TODO: fix this
			const array = [];
			array[2] = { ts: now - 10, ms: 300 };
			array[1] = { ts: now - 20, ms: 200 };
			array[0] = { ts: now - 30, ms: 100 };
			array[4] = { ts: now - 40, ms: 500 };
			array[3] = { ts: now - 50, ms: 400 };

			const span = 45;
			const expectedCount = 4;
			const expectedMean = mean([300, 200, 100, 500]);
			const expectedStDev = standardDeviation([300, 200, 100, 500]);

			// ACT
			const result = Metrics.computeMetrics(span, array, buckets, startIndex);

			// ASSERT
			assert.equal(result.count, expectedCount);
			assert.equal(result.mean, expectedMean, 'unexpected mean');
			assert.equal(result.stdev, expectedStDev, 'unexpected standard deviation');
		});

		it('computes from start of full array', function () {
			// ARRANGE
			const buckets = 5;
			const startIndex = 0;
			const now = new Date().getTime();

			// TODO: fix this
			const array = [];
			array[0] = { ts: now - 10, ms: 100 };
			array[4] = { ts: now - 20, ms: 500 };
			array[3] = { ts: now - 30, ms: 400 };
			array[2] = { ts: now - 40, ms: 300 };
			array[1] = { ts: now - 50, ms: 200 };

			const span = 45;
			const expectedCount = 4;
			const expectedMean = mean([100, 500, 400, 300]);
			const expectedStDev = standardDeviation([100, 500, 400, 300]);

			// ACT
			const result = Metrics.computeMetrics(span, array, buckets, startIndex);

			// ASSERT
			assert.equal(result.count, expectedCount);
			assert.equal(result.mean, expectedMean, 'unexpected mean');
			assert.equal(result.stdev, expectedStDev, 'unexpected standard deviation');
		});

		it('computes from end of full array', function () {
			// ARRANGE
			const buckets = 5;
			const startIndex = 4;
			const now = new Date().getTime();

			// TODO: fix this
			const array = [];
			array[4] = { ts: now - 10, ms: 500 };
			array[3] = { ts: now - 20, ms: 400 };
			array[2] = { ts: now - 30, ms: 300 };
			array[1] = { ts: now - 40, ms: 200 };
			array[0] = { ts: now - 50, ms: 100 };

			const span = 45;
			const expectedCount = 4;
			const expectedMean = mean([500, 400, 300, 200]);
			const expectedStDev = standardDeviation([500, 400, 300, 200]);

			// ACT
			const result = Metrics.computeMetrics(span, array, buckets, startIndex);

			// ASSERT
			assert.equal(result.count, expectedCount);
			assert.equal(result.mean, expectedMean, 'unexpected mean');
			assert.equal(result.stdev, expectedStDev, 'unexpected standard deviation');
		});

		it('computes from middle of partial array', function () {
			// ARRANGE
			const buckets = 5;
			const startIndex = 2;
			const now = new Date().getTime();

			// TODO: fix this
			const array = [];
			array[2] = { ts: now - 10, ms: 300 };
			array[1] = { ts: now - 20, ms: 200 };
			array[0] = { ts: now - 30, ms: 100 };

			const span = 45;
			const expectedCount = 3;
			const expectedMean = mean([300, 200, 100]);
			const expectedStDev = standardDeviation([300, 200, 100]);

			// ACT
			const result = Metrics.computeMetrics(span, array, buckets, startIndex);

			// ASSERT
			assert.equal(result.count, expectedCount);
			assert.equal(result.mean, expectedMean, 'unexpected mean');
			assert.equal(result.stdev, expectedStDev, 'unexpected standard deviation');
		});

		it('computes from empty array', function () {
			// ARRANGE
			const buckets = 5;
			const startIndex = 0;
			const now = new Date().getTime();

			// TODO: fix this
			const array = [];

			const span = 45;
			const expectedCount = 0;
			const expectedMean = 0;
			const expectedStDev = 0;

			// ACT
			const result = Metrics.computeMetrics(span, array, buckets, startIndex);

			// ASSERT
			assert.equal(result.count, expectedCount);
			assert.equal(result.mean, expectedMean, 'unexpected mean');
			assert.equal(result.stdev, expectedStDev, 'unexpected standard deviation');
		});
	});
});

function standardDeviation(values) {
	var avg = mean(values);

	var squareDiffs = values.map(function (value) {
		var diff = value - avg;
		var sqrDiff = diff * diff;
		return sqrDiff;
	});

	var avgSquareDiff = mean(squareDiffs);

	var stdDev = Math.sqrt(avgSquareDiff);
	return stdDev;
}

function mean(data) {
	var sum = data.reduce(function (sum, value) {
		return sum + value;
	}, 0);

	var avg = sum / data.length;
	return avg;
}
