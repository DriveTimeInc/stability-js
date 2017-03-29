import { assert } from 'chai';
import Circuit from '../src/circuit';
import BreakerPanel from '../src/breaker-panel';

describe('BreakerPanel', function () {
	it('adds and gets circuit', function () {
		// ARRANGE
		const sut = new BreakerPanel();
		const circuitName = 'test circuit';
		const circuit = new Circuit(circuitName);

		// ACT
		sut.add(circuit);
		const result = sut.get(circuitName);

		// ASSERT
		assert.equal(result, circuit);
	});

	it('lists circuits', function () {
		// ARRANGE
		const sut = new BreakerPanel();
		const circuitA = new Circuit('circuit A');
		const circuitB = new Circuit('circuit B');
		const circuitC = new Circuit('circuit C');

		sut.add(circuitA);
		sut.add(circuitB);
		sut.add(circuitC);

		// ACT
		const circuits = sut.list();

		// ASSERT
		assert.sameMembers(circuits, [circuitA, circuitB, circuitC]);
	});

	it('gets usability of ENABLED circuit', function () {
		// ARRANGE
		const sut = new BreakerPanel();
		const circuitName = 'test circuit';
		const circuit = new Circuit(circuitName);
		sut.add(circuit);

		assert.equal(sut.get(circuitName).state, Circuit.ENABLED);
		const expectedResult = true;

		// ACT
		const result = sut.canUseCircuit(circuitName);

		// ASSERT
		assert.equal(result, expectedResult);
	});

	it('gets usability of HALFOPEN circuit', function () {
		// ARRANGE
		const sut = new BreakerPanel();
		const circuitName = 'test circuit';
		const circuit = new Circuit(circuitName);
		sut.add(circuit);
		sut.get(circuitName).halfOpen('test');

		assert.equal(sut.get(circuitName).state, Circuit.HALFOPEN);
		const expectedResult = true;

		// ACT
		const result = sut.canUseCircuit(circuitName);

		// ASSERT
		assert.equal(result, expectedResult);
	});

	it('gets usability of DISABLED circuit', function () {
		// ARRANGE
		const sut = new BreakerPanel();
		const circuitName = 'test circuit';
		const circuit = new Circuit(circuitName);
		sut.add(circuit);
		sut.get(circuitName).disable('test', new Date(1234567890));

		assert.equal(sut.get(circuitName).state, Circuit.DISABLED);
		const expectedResult = false;

		// ACT
		const result = sut.canUseCircuit(circuitName);

		// ASSERT
		assert.equal(result, expectedResult);
	});

	it('supplies a singleton instance', function () {
		// ARRANGE

		// ACT
		const resultA = BreakerPanel.instance;
		const resultB = BreakerPanel.instance;

		// ASSERT
		assert.equal(resultA, resultB);
		assert.ok(resultA instanceof BreakerPanel);
	});
});
