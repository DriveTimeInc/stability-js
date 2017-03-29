// export default class CircuitError extends Error {
// 	constructor(message, circuit) {
// 		super(message);
// 		this.name = this.constructor.name;
// 		this.circuit = circuit;
// 		if (typeof Error.captureStackTrace === 'function') {
// 			Error.captureStackTrace(this, this.constructor);
// 		} else {
// 			this.stack = (new Error(message)).stack;
// 		}
// 	}
// }
