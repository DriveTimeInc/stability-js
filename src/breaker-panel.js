import Circuit from './circuit';

class BreakerPanel {
	constructor() {
		this.circuits = {};
	}

	add(circuit) {
		this.circuits[circuit.name] = circuit;
	}

	canUseCircuit(name) {
		return this.circuits[name].state != Circuit.DISABLED;
	}

	/**
	 * @param {string} name
	 * @returns {Circuit} the circuit
	 */
	get(name) {
		return this.circuits[name];
	}

	/**
	 * @returns {Array<Circuit>}
	 */
	list() {
		var circuits = [];

		for (let circuit in this.circuits) {
			circuits.push(this.circuits[circuit]);
		}

		return circuits;
	}

	static get instance() {
		return instance;
	}
}

const instance = new BreakerPanel();

export default BreakerPanel;
