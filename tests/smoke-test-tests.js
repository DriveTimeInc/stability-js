import { assert } from 'chai';
import SmokeTest from '../src/smoke-test';
import TestResult from '../src/test-result';

describe('SmokeTest', function () {
	it('throws when onRun is passed an object other than TestResult', function () {
		// ARRANGE
		const testResult = 'not a TestResult';

		const fnTest = () => new Promise((resolve, reject) => {
			assert.fail();
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		try {
			// ACT
			sut.onRun(testResult);
			assert.fail();
		} catch (ex) {
			// ASSERT
		}
	});

	it('throws when onError is passed an object other than TestResult', function () {
		// ARRANGE
		const testResult = 'not a TestResult';

		const fnTest = () => new Promise((resolve, reject) => {
			assert.fail();
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		try {
			// ACT
			sut.onError(testResult);
			assert.fail();
		} catch (ex) {
			// ASSERT
		}
	});

	it('emits run on test pass', function (done) {
		// ARRANGE
		const expectedResult = new TestResult(true, 'test');

		const fnTest = () => new Promise((resolve, reject) => {
			resolve(expectedResult);
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		const expectedHistoryCount = sut.history.length + 1;

		sut.on('run', result => {
			// ASSERT
			assert.equal(result, expectedResult);
			assert.equal(sut.history.length, expectedHistoryCount);
			done();
		});

		// ACT
		sut.run();
	});

	it('emits error on test failure', function (done) {
		// ARRANGE
		const expectedResult = new TestResult(true, 'test');

		const fnTest = () => new Promise((resolve, reject) => {
			reject('some error');
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		const expectedHistoryCount = sut.history.length + 1;

		sut.on('error', result => {
			// ASSERT
			assert.strictEqual(result.passed, false);
			assert.equal(sut.history.length, expectedHistoryCount);
			done();
		});

		// ACT
		sut.run();
	});

	it('indicates that the last test run passed', function (done) {
		// ARRANGE
		const testResult = new TestResult(true, 'test');

		const fnTest = () => new Promise((resolve, reject) => {
			resolve(testResult);
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		sut.on('run', result => {
			// ASSERT
			assert.strictEqual(sut.passing, true);
			done();
		});

		// ACT
		sut.run();
	});

	it('indicates that the last test run did not pass', function (done) {
		// ARRANGE
		const testResult = new TestResult(false, 'test');

		const fnTest = () => new Promise((resolve, reject) => {
			resolve(testResult);
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		sut.on('run', result => {
			// ASSERT
			assert.strictEqual(sut.passing, false);
			done();
		});

		// ACT
		sut.run();
	});

	it('indicates that this test has not yet run', function () {
		// ARRANGE
		const fnTest = () => new Promise((resolve, reject) => {
			assert.fail();
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest);

		// ACT

		// ASSERT
		assert.equal(typeof (sut.passing), 'undefined');
	});

	it('runs on an interval', function (done) {
		// ARRANGE
		const interval = 20;
		const duration = interval * 1.5;
		const expectedHistoryCount = 2;

		const expectedResult = new TestResult(true, 'test');

		const fnTest = () => new Promise((resolve, reject) => {
			resolve(expectedResult);
		});

		const sut = new SmokeTest('test', 'for unit test', fnTest, interval);

		// ACT

		// ASSERT
		setTimeout(() => {
			assert.equal(sut.history.length, expectedHistoryCount);
			done();
		}, duration);
	});
});
