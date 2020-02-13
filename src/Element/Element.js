
/**
 * @imports
 */
import {
	from as domFrom,
	find as domFind,
	domData,
	domAttr,
	domHtml,
	domText,
	domAppend,
	domPrepend,
	domAttrAsync,
	domHtmlAsync,
	domTextAsync,
	domAppendAsync,
	domPrependAsync,
} from './Dom.js';
import {
	css,
	cssAsync,
	cssComputeAsync,
	cssTransaction,
} from './Css/Css.js';
import {
	addListener,
	removeListener,
} from './Event/EventController.js';
import Anim from './Anim/Anim.js';
import Reflow from './Reflow.js';
import {
	translateTo,
	offsetTo,
	scrollTo,
} from './Geometry/Rect.js';
import _remove from '@onephrase/commons/arr/remove.js';
import _isUndefined from '@onephrase/commons/js/isUndefined.js';

/**
 * ---------------------------
 * Element manipulation library.
 * ---------------------------
 */
const Element = class {
	
	/**
	 * General element creator.
	 * Accepts any of markup, selector, HTMLElement.
	 *
	 * @param string 				input
	 *
	 * @return Element
	 */
	static from(input) {
		return new Element(domFrom(input));
	}

	// ----------------------------------------
	
	/**
	 * Creates an instance over an element.
	 *
	 * @param HTMLElement			el
	 *
	 * @return this
	 */
	constructor(el) {
		this.el = el;
	}
	
	/**
	 * Strategically returns a HTMLElement.
	 *
	 * @return HTMLElement
	 */
	_el() {
		return this.el || document.createElement('div');
	}
	
	/**
	 * Automatically returns the current instance in place
	 * of the element.
	 *
	 * @param mixed					ret
	 *
	 * @return mixed
	 */
	_ret(ret) {
		return this.el && ret === this.el ? this : ret;
	}

	// ----------------------------------------
	
	/**
	 * Queries the current element.
	 *
	 * @param string 				selector
	 *
	 * @return DOMNodeList
	 */
	find(selector) {
		return new Element(this.el ? domFind(selector, this.el) : undefined);
	}

	// ----------------------------------------
	
	/**
	 * @see domData
	 *
	 * @return mixed|this
	 */
	data(requestOrPayload, val = null) {
		// The ...arguments is important as the
		// domData function is sensitive to argument count
		return this._ret(domData(this._el(), ...arguments));
	}

	// ----------------------------------------
	
	/**
	 * @see css
	 *
	 * @return Promise
	 */
	css(...args) {
		// The ...arguments is important as the
		// css function is sensitive to argument count
		return this._ret(css(this._el(), ...arguments));
	}
	
	/**
	 * @see domAttr
	 *
	 * @return string|this
	 */
	attr(requestOrPayload, valOrMutation = null, subValMutation = null) {
		// The ...arguments is important as the
		// domAttr function is sensitive to argument count
		return this._ret(domAttr(this._el(), ...arguments));
	}
	
	/**
	 * @see domHtml
	 *
	 * @return string|this
	 */
	html(content = null) {
		// The ...arguments is important as the
		// domHtml function is sensitive to argument count
		return this._ret(domHtml(this._el(), ...arguments));
	}
	
	/**
	 * @see domText
	 *
	 * @return string|this
	 */
	text(content = null) {
		// The ...arguments is important as the
		// domText function is sensitive to argument count
		return this._ret(domText(this._el(), ...arguments));
	}
	
	/**
	 * @see domAppend
	 *
	 * @return string|this
	 */
	append(content) {
		return this._ret(domAppend(this._el(), content));
	}
	
	/**
	 * @see domPrepend
	 *
	 * @return string|this
	 */
	prepend(content) {
		return this._ret(domPrepend(this._el(), content));
	}

	// ----------------------------------------
	
	/**
	 * @see cssAsync
	 *
	 * @return Promise
	 */
	cssAsync(...args) {
		// The ...arguments is important as the
		// cssAsync function is sensitive to argument count
		return cssAsync(this._el(), ...arguments).then(ret => {
			return this.el && ret === this.el ? this : ret;
		});
	}
	
	/**
	 * @see domAttrAsync
	 *
	 * @return Promise
	 */
	attrAsync(requestOrPayload, valOrMutation = null, subValMutation = null) {
		// The ...arguments is important as the
		// domAttrAsync function is sensitive to argument count
		return domAttrAsync(this._el(), ...arguments).then(ret => {
			return this.el && ret === this.el ? this : ret;
		});
	}
	
	/**
	 * @see domHtmlAsync
	 *
	 * @return Promise
	 */
	htmlAsync(content) {
		// The ...arguments is important as the
		// domHtmlAsync function is sensitive to argument count
		return domHtmlAsync(this._el(), ...arguments).then(ret => {
			return this.el && ret === this.el ? this : ret;
		});
	}
	
	/**
	 * @see domTextAsync
	 *
	 * @return Promise
	 */
	textAsync(content) {
		// The ...arguments is important as the
		// domTextAsync function is sensitive to argument count
		return domTextAsync(this._el(), ...arguments).then(ret => {
			return this.el && ret === this.el ? this : ret;
		});
	}
	
	/**
	 * @see domAppendAsync
	 *
	 * @return Promise
	 */
	appendAsync(content) {
		return domAppendAsync(this._el(), ...arguments).then(() => {
			return this;
		});
	}
	
	/**
	 * @see domPrependAsync
	 *
	 * @return Promise
	 */
	prependAsync(content) {
		return domPrependAsync(this._el(), ...arguments).then(() => {
			return this;
		});
	}
	
	/**
	 * @see cssComputeAsync
	 *
	 * @return Promise
	 */
	cssComputeAsync(...args) {
		// The ...arguments is important as the
		// cssComputeAsync function is sensitive to argument count
		return cssComputeAsync(this._el(), ...arguments);
	}
	
	/**
	 * Establishes a CSS operatiom that can be rolledback without altering similar operation by other code.
	 * If a callback is provided, it synces the entire operation with Reflow's normal read/write cycles.
	 *
	 * @param string|array			props
	 *
	 * @return Transaction
	 */
	cssTransaction(props) {
		return cssTransaction(this._el(), props);
	}

	// ----------------------------------------
	
	/**
	 * @see addListener
	 */
	observe(...args) {
		// The ...arguments is important as the
		// addListener function is sensitive to argument count
		return addListener(this._el(), ...arguments);
	}
	
	/**
	 * @see removeListener
	 */
	unobserve(...args) {
		// The ...arguments is important as the
		// removeListener function is sensitive to argument count
		return removeListener(this._el(), ...arguments);
	}

	// ----------------------------------------
	
	/**
	 * Creates and plays an amiation.
	 * @see Animation
	 *
	 * @param array|object|string	effect
	 * @param object				params
	 *
	 * @return Promise
	 */
	play(effect, params = {}) {
		if (!('cancelForCss' in params)) {
			params.cancelForCss = true;
		}
		return (new Anim(this._el(), effect, params)).play();
	}

	// ----------------------------------------
	
	/**
	 * Translates an element to a reference point in the UI.
	 *
	 * @param HTMLElement|Event|window|Chtml 	reference
	 * @param object							options
	 *
	 * @return Promise
	 */
	translateTo(reference, options = {}) {
		var refPoint = reference instanceof Element ? reference.el : reference;
		return Reflow.onread((resolve, reject) => {
			if (!this.el) {
				return reject();
			}
			var trans = translateTo(this.el, refPoint, options);
			if (options.play) {
				resolve(this.play([
					{transform: trans.current.from},
					{transform: trans.to},
				], options.play));
			} else {
				resolve(this.css({transform: trans.to}));
			}
		}, true/*withPromise*/);
	}
	
	/**
	 * Offsets an element to a reference point in the UI.
	 *
	 * @param HTMLElement|Event|window|Chtml 	reference
	 * @param object							options
	 *
	 * @return Promise
	 */
	offsetTo(reference, options = {}) {
		var refPoint = reference instanceof Element ? reference.el : reference;
		return Reflow.onread((resolve, reject) => {
			if (!this.el) {
				return reject();
			}
			var trans = offsetTo(this.el, refPoint, options);
			if (options.play) {
				resolve(this.play([trans.current.from, trans.to], options.play));
			} else {
				resolve(this.css(trans.to));
			}
		}, true/*withPromise*/);
	}
	
	/**
	 * Scrolls an element to a reference point in the UI.
	 *
	 * @param HTMLElement|Event|window|Chtml 	reference
	 * @param object							options
	 *
	 * @return Promise
	 */
	scrollTo(reference, options = {}) {
		var refPoint = reference instanceof Element ? reference.el : reference;
		return Reflow.onread((resolve, reject) => {
			if (!this.el) {
				return reject();
			}
			var trans = scrollTo(this.el, refPoint, options);
			if (options.play) {
				console.log('scrollTo() does not currently support animation.');
			}
			resolve(trans.viewport.scrollTo(trans.to.scrollLeft, trans.to.scrollTop));
		}, true/*withPromise*/);
	}
};

/**
 * @exports
 */
export default Element;