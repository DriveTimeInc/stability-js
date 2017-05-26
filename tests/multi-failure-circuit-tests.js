import { assert } from 'chai';
import Circuit from '../src/circuit';
import MultiFailureCircuit from '../src/multi-failure-circuit';

describe('MultiFailureCircuit', function () {
	it('is enabled by default', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});

	it('does not move from enabled to disabled on the first error', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);

		// ACT
		sut.emit('error', { msg: 'test error' });

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});

	it('moves from enabled to disabled on the max number of consecutive errors', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);

		// ACT
		sut.emit('error', { msg: 'test error 1' });
		sut.emit('error', { msg: 'test error 2' });
		sut.emit('error', { msg: 'test error 3' });
		sut.emit('error', { msg: 'test error 4' });
		sut.emit('error', { msg: 'test error 5' });

		// ASSERT
		assert.equal(sut.state, Circuit.DISABLED);
	});

	it('does not move from enabled to disabled on the max number of non-consecutive errors', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);

		// ACT
		sut.emit('error', { msg: 'test error 1' });
		sut.emit('error', { msg: 'test error 2' });
		sut.emit('error', { msg: 'test error 3' });
		sut.emit('success', { msg: 'test success' });
		sut.emit('error', { msg: 'test error 4' });
		sut.emit('error', { msg: 'test error 5' });

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});

	it('moves from disabled to half-open after cooldown', function (done) {
		// ARRANGE
		const cooldown = 25;
		const sut = new MultiFailureCircuit('test circuit', 0, cooldown, 5);

		// ACT
		sut.emit('error', { msg: 'test error 1' });
		sut.emit('error', { msg: 'test error 2' });
		sut.emit('error', { msg: 'test error 3' });
		sut.emit('error', { msg: 'test error 4' });
		sut.emit('error', { msg: 'test error 5' });

		// ASSERT
		setTimeout(() => {
			assert.equal(sut.state, Circuit.HALFOPEN);
			done();
		}, cooldown + 10);
	});

	it('moves from half-open to enabled on the first success', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);
		sut.halfOpen('test setup');

		// ACT
		sut.emit('success', 0);

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});

	it('does nothing on subsequent successes', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);
		const expectedHistoryCount = sut.history.length;

		// ACT
		sut.emit('success', 0);

		// ASSERT
		assert.equal(sut.history.length, expectedHistoryCount);
	});
});
