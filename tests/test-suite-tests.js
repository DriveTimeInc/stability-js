import { assert } from 'chai';
import SmokeTest from '../src/smoke-test';
import TestResult from '../src/test-result';
import TestSuite from '../src/test-suite';

describe('TestSuite', function () {
	it('adds and gets tests', function () {
		// ARRANGE
		const sut = new TestSuite();
		const testId = 'my smoke test';
		const test = new SmokeTest(testId);

		// ACT
		sut.add(test);
		const result = sut.get(testId);

		// ASSERT
		assert.equal(result, test);
	});

	it('lists tests', function () {
		// ARRANGE
		const sut = new TestSuite();
		const testA = new SmokeTest('test A');
		const testB = new SmokeTest('test B');
		const testC = new SmokeTest('test C');

		sut.add(testA);
		sut.add(testB);
		sut.add(testC);

		// ACT
		const tests = sut.list();

		// ASSERT
		assert.sameMembers(tests, [testA, testB, testC]);
	});

	it('supplies a singleton instance', function () {
		// ARRANGE

		// ACT
		const resultA = TestSuite.instance;
		const resultB = TestSuite.instance;

		// ASSERT
		assert.equal(resultA, resultB);
		assert.ok(resultA instanceof TestSuite);
	});

	it('proxies run event', function (done) {
		// ARRANGE
		const sut = new TestSuite();
		const testId = 'my smoke test';
		const test = new SmokeTest(testId);
		sut.add(test);

		const testResult = new TestResult(true, 'some result');

		sut.on('run', (id, result) => {
			// ASSERT
			assert.equal(id, testId);
			assert.equal(result, testResult);
			done();
		});

		// ACT
		test.emit('run', testResult);
	});

	it('proxies error event', function (done) {
		// ARRANGE
		const sut = new TestSuite();
		const testId = 'my smoke test';
		const test = new SmokeTest(testId);
		sut.add(test);

		const testResult = new TestResult(false, 'some error');

		sut.on('error', (id, result) => {
			// ASSERT
			assert.equal(id, testId);
			assert.equal(result, testResult);
			done();
		});

		// ACT
		test.emit('error', testResult);
	});
});
