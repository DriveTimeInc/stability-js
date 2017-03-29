import { assert } from 'chai';
import Circuit from '../src/circuit';

describe('Circuit', function () {
	it('constructs with initial state', function () {
		// ARRANGE
		// ACT
		const sut = new Circuit('test circuit');

		// ASSERT
		assert.ok(sut.state);
		assert.ok(sut.reason);
		assert.ok(sut.since);
	});

	it('emits change event', function (done) {
		// ARRANGE
		const sut = new Circuit('test circuit');

		const expectedState = Circuit.DISABLED;
		const expectedReason = 'test';

		sut.on('change', (state, reason) => {
			// ASSERT
			assert.equal(state, expectedState);
			assert.equal(reason, expectedReason);

			done();
		});

		// ACT
		sut.changeState(expectedState, expectedReason);
	});

	describe('run', function () {
		describe('happy path', function () {
			it('emits success', function (done) {
				// ARRANGE
				const sut = new Circuit('test circuit', 10);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						resolve();
					}, 5);
				});

				sut.on('success', ms => {
					// ASSERT
					assert.ok(ms);
					assert.ok(hasRun);
					done();
				});

				// ACT
				sut.run(fn);
			});
		});

		describe('when DISABLED', function () {
			it('emits reject', function (done) {
				// ARRANGE
				const sut = new Circuit('test circuit');
				sut.disable('test', new Date(1234567890));

				const fn = () => new Promise(() => assert.fail());

				sut.on('reject', () => {
					// ASSERT
					done();
				});

				// ACT
				sut.run(fn);
			});
		});

		describe('with isError parameter', function () {
			it('always emits error on timeout', function (done) {
				// ARRANGE
				const sut = new Circuit('test circuit', 5);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						resolve();
					}, 1000);
				});

				sut.on('error', ex => {
					// ASSERT
					assert.ok(ex);
					assert.notOk(hasRun);
					done();
				});

				// ACT
				sut.run(fn, err => false);
			});

			it('emits error on ex matching isError', function (done) {
				// ARRANGE
				const sut = new Circuit('test circuit', 1000);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						reject('reason');
					}, 5);
				});

				sut.on('error', ex => {
					// ASSERT
					assert.ok(ex);
					assert.ok(hasRun);
					done();
				});

				// ACT
				sut.run(fn, err => true);
			});

			it('emits success on ex not matching isError', function () {
				// ARRANGE
				const sut = new Circuit('test circuit', 1000);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						reject('reason');
					}, 5);
				});

				sut.on('success', ms => {
					// ASSERT
					assert.ok(ms);
					assert.ok(hasRun);
					done();
				});

				// ACT
				sut.run(fn, err => false);
			});

			it('emits error even when ex is undefined', function () {
				// ARRANGE
				const sut = new Circuit('test circuit', 1000);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						reject(undefined);
					}, 5);
				});

				sut.on('error', ex => {
					// ASSERT
					assert.notOk(ex);
					assert.ok(hasRun);
					done();
				});

				// ACT
				sut.run(fn, err => true);
			});
		});

		describe('without isError parameter', function () {
			it('emits error on timeout', function () {
				// ARRANGE
				const sut = new Circuit('test circuit', 5);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						resolve();
					}, 1000);
				});

				sut.on('error', ex => {
					// ASSERT
					assert.ok(ex);
					assert.notOk(hasRun);
					done();
				});

				// ACT
				sut.run(fn);
			});

			it('emits error on ex', function () {
				// ARRANGE
				const sut = new Circuit('test circuit', 1000);

				let hasRun = false;

				const fn = () => new Promise((resolve, reject) => {
					setTimeout(() => {
						hasRun = true;
						reject('reason');
					}, 5);
				});

				sut.on('error', ex => {
					// ASSERT
					assert.ok(ex);
					assert.ok(hasRun);
					done();
				});

				// ACT
				sut.run(fn);
			});
		});
	});

	describe('state changes', function () {
		it('enabled => enabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');

			assert.equal(sut.state, Circuit.ENABLED);

			const reason = 'test';
			const expectedEndState = Circuit.ENABLED;
			const expectedEndHistoryCount = sut.history.length;

			// ACT
			sut.enable(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.notEqual(sut.reason, reason);
			assert.equal(sut.history.length, expectedEndHistoryCount);
		});

		it('enabled => halfopen', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');

			assert.equal(sut.state, Circuit.ENABLED);

			const reason = 'test';
			const expectedEndState = Circuit.HALFOPEN;

			// ACT
			sut.halfOpen(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.equal(sut.reason, reason);
		});

		it('enabled => disabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');
			const retryAfter = new Date(1234567890);

			assert.equal(sut.state, Circuit.ENABLED);

			const reason = 'test';
			const expectedEndState = Circuit.DISABLED;
			const expectedEndHistoryCount = sut.history.length + 1;

			// ACT
			sut.disable(reason, retryAfter);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.equal(sut.retryAfter, retryAfter);
			assert.equal(sut.reason, reason);
			assert.equal(sut.history.length, expectedEndHistoryCount);
		});

		it('halfopen => enabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');

			sut.halfOpen('initial test state');
			assert.equal(sut.state, Circuit.HALFOPEN);

			const reason = 'test';
			const expectedEndState = Circuit.ENABLED;

			// ACT
			sut.enable(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.equal(sut.reason, reason);
		});

		it('halfopen => halfopen', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');

			sut.halfOpen('initial test state');
			assert.equal(sut.state, Circuit.HALFOPEN);

			const reason = 'test';
			const expectedEndState = Circuit.HALFOPEN;
			const expectedEndHistoryCount = sut.history.length;

			// ACT
			sut.halfOpen(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.notEqual(sut.reason, reason);
			assert.equal(sut.history.length, expectedEndHistoryCount);
		});

		it('halfopen => disabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');
			const retryAfter = new Date(1234567890);

			sut.halfOpen('initial test state');
			assert.equal(sut.state, Circuit.HALFOPEN);

			const reason = 'test';
			const expectedEndState = Circuit.DISABLED;

			// ACT
			sut.disable(reason, retryAfter);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.equal(sut.retryAfter, retryAfter);
			assert.equal(sut.reason, reason);
		});

		it('disabled => enabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');
			const retryAfter = new Date(1234567890);

			sut.disable('initial test state', retryAfter);
			assert.equal(sut.state, Circuit.DISABLED);

			const reason = 'test';
			const expectedEndState = Circuit.ENABLED;

			// ACT
			sut.enable(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.equal(sut.reason, reason);
		});

		it('disabled => halfopen', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');
			const retryAfter = new Date(1234567890);

			sut.disable('initial test state', retryAfter);
			assert.equal(sut.state, Circuit.DISABLED);

			const reason = 'test';
			const expectedEndState = Circuit.HALFOPEN;

			// ACT
			sut.halfOpen(reason);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.notOk(sut.retryAfter);
			assert.equal(sut.reason, reason);
		});

		it('disabled => disabled', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');
			const originalRetryAfter = new Date(1234567890);

			sut.disable('initial test state', originalRetryAfter);
			assert.equal(sut.state, Circuit.DISABLED);

			const reason = 'test';
			const expectedEndState = Circuit.DISABLED;
			const expectedEndHistoryCount = sut.history.length;

			// ACT
			sut.disable(reason, new Date());

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.equal(sut.retryAfter, originalRetryAfter);
			assert.notEqual(sut.reason, reason);
			assert.equal(sut.history.length, expectedEndHistoryCount);
		});

		it('supplies default reason', function () {
			// ARRANGE
			const sut = new Circuit('test circuit');

			assert.equal(sut.state, Circuit.ENABLED);

			const expectedEndState = Circuit.DISABLED;
			const expectedEndHistoryCount = sut.history.length + 1;

			// ACT
			sut.changeState(Circuit.DISABLED /* no reason given */);

			// ASSERT
			assert.equal(sut.state, expectedEndState);
			assert.equal(sut.history.length, expectedEndHistoryCount);
			assert.ok(sut.reason);
		});
	});
});
