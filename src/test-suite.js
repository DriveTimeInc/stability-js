import EventEmitter from 'events';
import SmokeTest from './smoke-test';

class TestSuite extends EventEmitter {
	constructor() {
		super();
		this.smokeTests = [];
	}

	/**
	 * @param {SmokeTest} smokeTest
	 */
	add(smokeTest) {
		this.smokeTests[smokeTest.id] = smokeTest;

		smokeTest.on('run', result => this.onRun(smokeTest.id, result));

		smokeTest.on('error', result => this.onError(smokeTest.id, result));
	}

	onRun(testId, result) {
		this.emit('run', testId, result);
	}

	onError(testId, result) {
		this.emit('error', testId, result);
	}

	/**
	 * @param {string} id
	 * @returns {Circuit} the circuit
	 */
	get(id) {
		return this.smokeTests[id];
	}

	/**
	 * @returns {Array<SmokeTest>}
	 */
	list() {
		var smokeTests = [];
		for (let smokeTest in this.smokeTests) {
			smokeTests.push(this.smokeTests[smokeTest]);
		}
		return smokeTests;
	}

	static get instance() {
		return instance;
	}
}

const instance = new TestSuite();

export default TestSuite;
