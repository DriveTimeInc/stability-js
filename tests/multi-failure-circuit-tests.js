import { assert } from 'chai';
import Circuit from '../src/circuit';
import MultiFailureCircuit from '../src/multi-failure-circuit';

describe('MultiFailureCircuit', function () {
	it('does not move from enabled to disabled on the first error', function () {
		// ARRANGE
		const sut = new MultiFailureCircuit('test circuit', 0, 60000, 5);

		// ACT
		sut.emit('error', { msg: 'test error' });

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});

	it('moves from enabled to disabled on the max number of errors', function () {
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
		assert.equal(sut.state, Circuit.DISABLED);
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
		assert.equal(sut.state, Circuit.ENABLED);
		const expectedHistoryCount = sut.history.length;

		// ACT
		sut.emit('success', 0);

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
		assert.equal(sut.history.length, expectedHistoryCount);
	});
});
