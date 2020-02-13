
/**
 * @imports
 */
import _isArray from '@onephrase/commons/js/isArray.js';
import _isFunction from '@onephrase/commons/js/isFunction.js';
import Anim from './Anim.js';

/**
 * -----------------------------
 * The timeline class
 * for working with multiple animations.
 * -----------------------------
 */
 
Timeline = class {
	
	/**
	 * Creates an amiation from keyframes.
	 *
	 * @param array					animations
	 * @param object				params
	 *
	 * @return this
	 */
	constructor(animations, params = {}) {
		// Private properties
		if (!_isArray(animations)) {
			throw new Error('Timeline accespt only a list of animations. Object of type "' + typeof animations + '" given!');
		}
		this.$ = {
			animations: [],
			readyCallbacks: [],
			finishCallbacks: [],
			cancelCallbacks: [],
			params: params,
		};
		animations.forEach(anim => {
			this.add(anim);
		});
	}

	/**
	 * Adds an animation instance.
	 *
	 * @param Anim			 anim
	 *
	 * @return this
	 */
	add(anim) {
		if (!(anim instanceof Anim)) {
			throw new Error('Argument#1 must be an Anim instance!');
		}
		this.$.animations.push(anim);
		return this;
	}

	/**
	 * Clears all animations.
	 *
	 * @return this
	 */
	clear() {
		this.$.animations.splice(1);
		return this;
	}
	
	/**
	 * Binds a function to the "onfinish" event.
	 *
	 * @param function callback
	 *
	 * @return this
	 *
	 */
	onfinish(callback) {
		if (!_isFunction(callback)) {
			throw new Error("Onfinish() accepts only a function.");
		}
		this.$.finishCallbacks.push(callback);
		return this;
	}
	
	/**
	 * Binds a function to the "oncancel" event.
	 *
	 * @param function callback
	 *
	 * @return this
	 *
	 */
	oncancel(callback) {
		if (!_isFunction(callback)) {
			throw new Error("Oncancel() accepts only a function.");
		}
		this.$.cancelCallbacks.push(callback);
		return this;
	}
	
	/**
	 * Seeks all animations to a time.
	 *
	 * @param int to
	 *
	 * @return this
	 */
	seek(to) {
		// The validity of the "to" input is handled by each anim...
		this.$.animations.forEach(anim => anim.seek(to));
		return this;
	}
	
	/**
	 * Returns the average of all animation's progress.
	 *
	 * @return number
	 */
	progress() {
		return this.$.animations.reduce((a, b) => a.progress() + b.progress(), 0) /= this.$.animations.length;
	}
	
	/**
	 * Plays all animations.
	 * Returns an "onfinish" promise.
	 *
	 * @return Promise
	 */
	play() {
		return Promise.all(this.$.animations.map(anim => anim.play()));
	}
	
	/**
	 * Pauses all animations.
	 *
	 * @return this
	 */
	pause() {
		this.$.animations.forEach(anim => anim.pause());
		return this;
	}
	
	/**
	 * Finishes all animations.
	 *
	 * @return this
	 */
	finish() {
		this.$.animations.forEach(anim => anim.finish());
		return this;
	}

	/**
	 * Cancels all animations.
	 *
	 * @return this
	 */
	cancel() {
		this.$.animations.forEach(anim => anim.cancel());
		return this;
	}

	/**
	 * Binds an observer to the timeline.
	 *
	 * @return this
	 */
	observe() {
		this.$.animations.splice(1);
		return this;
	}
};

/**
 * @export
 */
export default Timeline;