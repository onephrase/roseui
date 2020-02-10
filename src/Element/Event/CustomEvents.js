
/**
 * @imports
 */
import {
	_from as _obj_from
} from '@onephrase/commons/src/Obj.js';

/**
 * ---------------------------
 * Custom events
 * ---------------------------
 *
 * @var object
 */				
const CustomEvents = {};

/**
 * Multitap events
 */
const Multitap = {
	
	/**
	 * Binds all multitap events.
	 */
	setup(fireCallback, el, hammertime, eventName) {
		var allSetup = true;
		var recognizers = Multitap.events.map((tapType, i) => {
			var recognizer = hammertime.get(tapType);
			if (!recognizer) {
				allSetup = false;
				recognizer = new Hammer.Tap({
					event: tapType,
					taps: Multitap.events.length - i,
				});
				hammertime.add(recognizer);
			}
			return recognizer;
		});
		if (!allSetup) {
			// From left to right, recognizeWith all others ahead
			var recgzr, recgzrs = recognizers.slice();
			while((recgzr = recgzrs.shift()) && recgzrs.length) {
				recgzr.recognizeWith(recgzrs);
			}
			// From right to left, recognizeWith all others behind
			var recgzr2, recgzrs2 = recognizers.slice();
			while((recgzr2 = recgzrs2.pop()) && recgzrs2.length) {
				recgzr2.requireFailure(recgzrs2);
			}
		}
		hammertime.on(eventName, e => fireCallback(e.type, {
			context:_obj_from(e.type, e)
		}));
	},
	
	/**
	 * Unbinds all multitap events.
	 */
	teardown(el, hammertime, eventName) {
		hammertime.off(eventName);
	},
	
	/**
	 * Now additional taps is achieved by
	 * simply prepending to this array.
	 */
	events: ['tripletap', 'doubletap', 'singletap'],
};
// Add all to CustomEvents
Multitap.events.forEach(event => {
	CustomEvents[event] = Multitap;
});

/**
 * @exports
 */
export {
	Multitap
};
export default CustomEvents;