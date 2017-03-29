/**
 * Represents the results of a test
 */
export default class TestResult {
	/**
	 * @param {boolean} passed
	 * @param {object} message
	 */
	constructor(passed, message) {
		this.passed = (passed == true);
		this.message = message;
	}
}
