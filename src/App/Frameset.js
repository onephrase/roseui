
/**
 * @imports
 */
import {
	_sort
} from '@onephrase/commons/src/Arr.js';
import {
	_each
} from '@onephrase/commons/src/Obj.js';
import {
	_isArray,
	_isFunction,
	_isClass
} from '@onephrase/commons/src/Js.js';
import Component from '../Component.js';
import Frame from './Frame.js';

/**
 * ---------------------------
 * The Frameset class
 * ---------------------------
 *
 * This class manages multiple Frame instances.
 */
			
const Frameset = class extends Component {

	/**
	 * Matches and activates frames;
	 * deactivates unmacthed frames.
	 *
	 * @param string				keyExpr
	 *
	 * @return int
	 */
	select(selectExpr) {
		return this.filterCallback(
			(name, frame) => (new RegExp(name)).test(selectExpr),
			(name, frame) => frame.active(true),
			(name, frame) => frame.active(false),
		);
	}

	/**
	 * Passes each item through a filter into
	 * success and failure callbacks.
	 *
	 * @param function				filterCallback
	 * @param function				successCallback
	 * @param function				failureCallback
	 *
	 * @return array
	 */
	filterCallback(filterCallback, successCallback, failureCallback) {
		var passes = {}, failures = {};
		_each(this.getFrames(), (name, frame) => {
			if (filterCallback(name, frame)) {
				passes[name] = frame;
			} else {
				failures[name] = frame;
			}
		});
		_each(passes, successCallback);
		_each(failures, failureCallback);
		return passes;
	}

	/**
	 * Returns items.
	 *
	 * @return object
	 */
	getFrames() {
		var frames = {};
		this.keys().forEach(name => {
			if (this.get(name) instanceof Frame) {
				frames[name] = this.get(name);
			}
		});
		return frames;
	}

	/**
	 * Creates Frames from declarations.
	 *
	 * @param array			framesList
	 *
	 * @return Frameset
	 */
	static create(framesList) {
		var frames = {};
		_each(framesList, (name, frameConstructor) => {
			frames[name] = frameConstructor instanceof Frame ? frameConstructor
				: (_isClass(frameConstructor) ? new frameConstructor 
					: (_isFunction(frameConstructor) ? frameConstructor(match) 
						: new Frame(frameConstructor || {})));
		});
		return new Frameset(frames);
	}
}

/**
 * @exports
 */
export default Frameset;