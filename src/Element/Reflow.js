
/**
 * @imports
 */
import _each from '@onephrase/commons/obj/each.js';

/**
 * ---------------------------
 * Binds callbacks to requestAnimationFrame()
 * to create a central "read/write" phases for DOM access.
 * ---------------------------
 */
			
const Reflow = {
	
	/**
	 * Holds all callbacks bound to the "read" phase.
	 *
	 * @var array
	 */
	readCallbacks: [],
	
	/**
	 * Holds all callbacks bound to the "write" phase.
	 *
	 * @var array
	 */
	writeCallbacks: [],

	/**
	 * Starts the loop.
	 *
	 * @return this
	 */
	_run: function() {
		requestAnimationFrame(() => {
			Reflow.readCallbacks.forEach((callback, i) => {
				if (callback && !callback()) {
					Reflow.readCallbacks[i] = null;
				}
			});
			Reflow.writeCallbacks.forEach((callback, i) => {
				if (callback && !callback()) {
					Reflow.writeCallbacks[i] = null;
				}
			});
			Reflow._run();
		});
	},
	
	/**
	 * Binds a callback to the "read" phase.
	 *
	 * @param function 	callback
	 * @param bool		withPromise
	 *
	 * @return void
	 */
	onread: function(callback, withPromise = false) {
		if (withPromise) {
			return new Promise((resolve, reject) => {
				Reflow.readCallbacks.push(() => {
					callback(resolve, reject);
				});
			});
		}
		Reflow.readCallbacks.push(callback);
	},
	
	/**
	 * Binds a callback to the "write" phase.
	 *
	 * @param function 	callback
	 * @param bool		withPromise
	 *
	 * @return void
	 */
	onwrite: function(callback, withPromise = false) {
		if (withPromise) {
			return new Promise((resolve, reject) => {
				Reflow.writeCallbacks.push(() => {
					callback(resolve, reject);
				});
			});
		}
		Reflow.writeCallbacks.push(callback);
	},
	
	/**
	 * A special construct for DOM manipulations that span
	 * one or more read/write cycles.
	 *
	 * @param function 	read
	 * @param function 	write
	 * @param mixed		prevTransaction
	 *
	 * @return void|mixed
	 */
	cycle: function(read, write, prevTransaction) {
		Reflow.onread(() => {
			// Record initial values
			var readReturn = read(prevTransaction);
			if (readReturn) {
				// Call erite, the transation
				var callWrite = (readReturn) => {
					Reflow.onwrite(() => {
						var writeReturn = write(readReturn, prevTransaction);
						if (writeReturn) {
							// Repeat transaction
							var repeatTransaction = (writeReturn) => {
								Reflow.cycle(read, write, writeReturn);
							};
							// ---------------------------------------
							// If "write" returns a promise, we wait until it is resolved
							// ---------------------------------------
							if (writeReturn instanceof window.Promise) {
								writeReturn.then(repeatTransaction);
							} else {
								repeatTransaction();
							}
						}
					});
				};
				// ---------------------------------------
				// If "read" returns a promise, we wait until it is resolved
				// ---------------------------------------
				if (readReturn instanceof window.Promise) {
					readReturn.then(callWrite);
				} else {
					callWrite();
				}
			}
		});
	},
};
Reflow._run();

/**
 * @exports
 */
export default Reflow;