import { assert } from 'chai';
import Circuit from '../src/circuit';
import SingleFailureCircuit from '../src/single-failure-circuit';

describe('SingleFailureCircuit', function () {
	it('moves from enabled to disabled on the first error', function () {
		// ARRANGE
		const sut = new SingleFailureCircuit('test circuit', 0, 60000);

		// ACT
		sut.emit('error', { msg: 'test error' });

		// ASSERT
		assert.equal(sut.state, Circuit.DISABLED);
	});

	it('moves from disabled to half-open after cooldown', function (done) {
		// ARRANGE
		const cooldown = 25;
		const sut = new SingleFailureCircuit('test circuit', 0, cooldown);

		// ACT
		sut.emit('error', { msg: 'test error' });

		// ASSERT
		assert.equal(sut.state, Circuit.DISABLED);
		setTimeout(() => {
			assert.equal(sut.state, Circuit.HALFOPEN);
			done();
		}, cooldown + 10);
	});

	it('moves from half-open to enabled on the first success', function () {
		// ARRANGE
		const sut = new SingleFailureCircuit('test circuit', 0, 60000);
		sut.halfOpen('test setup');

		// ACT
		sut.emit('success', 0);

		// ASSERT
		assert.equal(sut.state, Circuit.ENABLED);
	});
});
