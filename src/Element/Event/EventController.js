
/**
 * @imports
 */
import {
	_toTitle
} from '@onephrase/commons/src/Str.js';
import {
	_from as _arr_from
} from '@onephrase/commons/src/Arr.js';
import {
	_find,
	_from as _obj_from
} from '@onephrase/commons/src/Obj.js';
import {
	_isString,
	_isFunction,
	_isArray
} from '@onephrase/commons/src/Js.js';
import {
	EventController as _EventController,
	Event
} from '@onephrase/observable';
import {
	domData
} from '../Dom.js';
import CustomEvents from './CustomEvents.js';

/**
 * ---------------------------
 * The Router class
 * ---------------------------
 *
 * This class provides additional functionality over native events.
 * 
 * The EventController.fire() method has support for a listener's "return false"
 * and the consolidated Promise of "sync" listeners.
 *
 * EventController.addListener() can also be used to observe other "events" that the native addEventListener() does not support:
 * customEvents, @ownMutationEvents, @attributeMutationEvents, #childTreeMutationEvents, :states, ~gestures.
 *
 * EventController.unobserve() goes with a decision to use EventController.observe().
 */				
const EventController = class extends _EventController {

	/**
	 * Constructs a new observable and returns a proxy wrapper.
	 *
	 * @param HTMLElement			el
	 * @param object				params
	 *
	 * @return this
	 */
	constructor(el, params = {}) {
		super();
		this.el = el;
		this.$.params = params;
		this.$.activeHooks = {};
		this.$.hammertime = new Hammer.Manager(this.el);
	}

	/**
	 * Sets up an event type when its first listener is added.
	 *
	 * @param string NAME 
	 * @param object params 
	 *
	 * @return void
	 */
	_setup(NAME, params) {
		// We register an event only once.
		if (this.$.activeHooks[NAME]) {
			return;
		}
		if (CustomEvents[NAME]) {
			if (_isString(CustomEvents[NAME])) {
				this.$.activeHooks[NAME] = e => this.fire(NAME, {context:_obj_from(NAME, e)});
				// Setup: we'll observe CustomEvents[NAME] to process and push the CUSTOM event/state.
				this.addListener(CustomEvents[NAME], this.$.activeHooks[NAME]);
			} else if (_isFunction(CustomEvents[NAME].setup)) {
				this.$.activeHooks[NAME] = true;
				// Custom setup. We supply the this.observe, this.trigger methods incase they'll be needed.
				CustomEvents[NAME].setup((firedEvents, firedEventsDetails) => {
					if (!_isFunction(CustomEvents[NAME].validate) 
					|| CustomEvents[NAME].validate(firedEvents, firedEventsDetails, NAME, params)) {
						this.fire(firedEvents, firedEventsDetails)
					}
				}, this.el, this.$.hammertime, NAME);
			} else {
				throw new Error('The "' + NAME + '" event hook must have a "setup" function!');
			}
		} else if (recognizeGesture(NAME.split('+')[0])) {
			// Lets work as if if always a list
			var recognizers = NAME.split('+').map(gestureName => {
				var mainGestureName = recognizeGesture(gestureName);
				var recognizer = this.$.hammertime.get(mainGestureName);
				if (!recognizer) {
					recognizer = new Hammer[_toTitle(mainGestureName)];
					this.$.hammertime.add(recognizer);
				}
				return recognizer;
			});
			// From right to left, recognizeWith all others ahead
			recognizers.forEach((recognizer, i) => {
				recognizer.recognizeWith(recognizers.slice(i + 1));
			});
			// Listen now...
			this.$.activeHooks[NAME] = e => this.fire(NAME, {context:_obj_from(NAME, e)});
			this.$.hammertime.on(NAME.split('+').join(' '), this.$.activeHooks[NAME]);
		} else {
			this.$.activeHooks[NAME] = e => this.fire(NAME, {context:_obj_from(NAME, e)});
			// Setup: we'll observe a native event to process and push ours.
			this.el.addEventListener(NAME, this.$.activeHooks[NAME]);
		}
		
	}

	/**
	 * Tears down an event type when its last listener is removed.
	 *
	 * @param string NAME 
	 *
	 * @return void
	 */
	_teardown(NAME) {
		// We register an event only once.
		if (!this.$.activeHooks[NAME]) {
			return;
		}
		if (CustomEvents[NAME]) {
			if (_isString(CustomEvents[NAME])) {
				// Level1 custom event
				this.removeListener(CustomEvents[NAME], this.$.activeHooks[NAME]);
			} else if (_isFunction(CustomEvents[NAME].teardown)) {
				// Level2 custom event. We supply the this.unobserve method incase it'll be needed.
				CustomEvents[NAME].teardown(this.el, this.$.hammertime, NAME);
			} else {
				throw new Error('The "' + NAME + '" event hook must have a "teardown" function!');
			}
		} else if (recognizeGesture(NAME.split('+')[0])) {
			this.$.hammertime.off(NAME.split('+').join(' '), this.$.activeHooks[NAME]);
		} else {
			// Native event
			this.el.removeEventListener(NAME, this.$.activeHooks[NAME]);
		}
		delete this.$.activeHooks[NAME];
	}
	
	/**
	 * @see super.observe()
	 *
	 * Captures the params being observed and sets up their hooks
	 * when their first listener just gets added.
	 */
	addListener(...args) {
		var listener = super.addListener(...args);
		_arr_from(listener.eventNames).forEach(NAME => {
			this._setup(NAME, listener.params);
		});
		listener.removeCallback = () => {
			_arr_from(listener.eventNames).forEach(NAME => {
				this._teardown(NAME);
			});
		};
		return listener;
	}
};

/**
 * Gesture reference.
 */
const gestureIndex = {
	press: 	['press', 'pressup',], 
	rotate:	['rotate', 'rotatestart', 'rotatemove', 'rotateend', 'rotatecancel',],
	pinch: 	['pinch', 'pinchstart', 'pinchmove', 'pinchend', 'pinchcancel', 'pinchin', 'pinchout',], 
	pan: 	['pan', 'panstart', 'panmove', 'panend', 'pancancel', 'panleft', 'panright', 'panup', 'pandown',],
	swipe: 	['swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown',],
	tap: 	['tap',],
};

/**
 * Finds the recognizer for a gestureName.
 *
 * @param string	gestureName
 *
 * @return string
 */
const recognizeGesture = function(gestureName) {
	return _find(gestureIndex, list => list.includes(gestureName), false/*deep*/);
};

/**
 * Binds listeners to an element's event controller.
 *
 * @param DOMElement 			el
 * @param array		 			...args
 *
 * @return object
 */
const addListener = function(el, ...args) {
	if (!domData(el, 'eventController')) {
		domData(el, 'eventController', new EventController(el));
	}
	return domData(el, 'eventController').addListener(...args);
};

/**
 * Unbinds listeners from an element's event controller.
 *
 * @param DOMElement 			el
 * @param array		 			...args
 *
 * @return bool
 */
const removeListener = function(el, ...args) {
	if (domData(el, 'eventController')) {
		return domData(el, 'eventController').removeListener(...args);
	}
	return false;
};

/**
 * @exports
 */
export {
	addListener,
	removeListener,
};
export default EventController;