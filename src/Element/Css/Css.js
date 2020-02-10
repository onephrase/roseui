
/**
 * @imports
 */
import {
	_fromCamel,
	_toCamel
} from '@onephrase/commons/src/Str.js';
import {
	_isArray,
	_isObject,
	_isFunction,
	_isString,
	_isNumeric,
	_isUndefined
} from '@onephrase/commons/src/Js.js';
import {
	_flatten,
	_replace,
	_from as _arr_from
} from '@onephrase/commons/src/Arr.js';
import {
	_copyPlain,
	_each,
	_from as _obj_from
} from '@onephrase/commons/src/Obj.js';
import {
	vendorPrefix
} from '../../App/Client.js';
import Transaction from '../Transaction.js';
import Reflow from '../Reflow.js';
import TransformRule from './TransformRule.js';

/**
 * ---------------------------
 * The Element utility class
 * ---------------------------
 */

/**
 * Returns computed CSS properties.
 *
 * @param HTMLElement		el
 * @param string|array		props
 * @param string			psuedo
 *
 * @return object|string
 */
const cssRead = function(el, props, psuedo = null) {
	var style = window.getComputedStyle(el, psuedo), rect;
	return ruleCallback(props, (prop, rawProp) => {
		var val = style.getPropertyValue(vendorize(prop) || prop);
		if ((prop === 'width' || prop === 'height') && val === '') {
			val = '0px';
		}
		// -----------------------------
		// We return an object for the "transform" property
		// -----------------------------
		if (prop === 'transform') {
			val = TransformRule.parse(val);
		}
		return val;
	}, false/*withVendorVersion*/);
};

/**
 * Sets new CSS properties.
 *
 * @param HTMLElement		el
 * @param string|object		nameOrProps
 * @param string|number		val
 *
 * @return HTMLElement
 */
const cssWrite = function(el, nameOrProps, val = null) {
	nameOrProps = typeof nameOrProps === 'string' 
		? _obj_from(nameOrProps, val)
		: nameOrProps;
	var destructables = {
		inset: ['top', 'right', 'bottom', 'left'],
		margin: ['top', 'right', 'bottom', 'left'],
		padding: ['top', 'right', 'bottom', 'left'],
	};
	ruleCallback(Object.keys(nameOrProps), (prop, rawProp) => {
		var val = nameOrProps[rawProp];
		// -----------------------------
		// We can destucture things like "inset"("left", "top", "right", "bottom"), etc
		// -----------------------------
		_each(destructables, (destructableProp, meaning) => {
			if (prop === destructableProp) {
				if (_isObject(val)) {
					val = meaning.map(key => val[key]).filter(val => !_isUndefined(val));
				}
				if (_isArray(val)) {
					val = val.join(' ');
				}
			}
		});
		// -----------------------------
		// We accept an object for the "transform" property
		// -----------------------------
		if (prop === 'transform' && _isObject(val) && !(val instanceof TransformRule)) {
			val = (new TransformRule(val)).toString();
		}
		el.style[prop] = autopx.includes(prop) && _isNumeric(val)
			? val + 'px'
			: val;
	}, 'auto'/*withVendorVersion*/);
	return el;
};
 
/**
 * The cssRead() and cssWrite() function in one signature.
 *
 * @param HTMLElement		el
 * @param array				...args
 *
 * @return mixed
 */
const css = function(el, ...args) {
	if ((args.length > 1 && _isString(args[0])) || _isObject(args[0])) {
		return cssWrite(el, ...args);
	}
	return cssRead(el, ...args);
};
 
/**
 * ---------------------
 * ASYNC METHODS
 * ---------------------
 */

/**
 * The async type of cssRead().
 *
 * @see cssRead()
 *
 * @return Promise
 */
const cssReadAsync = function(el, props, psuedo = null) {
	return Reflow.onread((resolve, reject) => {
		try {
			resolve(_isFunction(props) ? props(el) : cssRead(el, props, psuedo));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};

/**
 * The async type of cssWrite().
 *
 * @see cssWrite()
 *
 * @return Promise
 */
const cssWriteAsync = function(el, nameOrProps, val = null) {
	return Reflow.onwrite((resolve, reject) => {
		try {
			resolve(cssWrite(el, nameOrProps, val));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};
 
/**
 * The async type of css().
 *
 * @see css()
 *
 * @return Promise
 */
const cssAsync = function(el, ...args) {
	if ((args.length > 1 && _isString(args[0])) || _isObject(args[0])) {
		return cssWriteAsync(el, ...args);
	}
	return cssReadAsync(el, ...args);
};

/**
 * Applies some CSS within a transaction, gets computed values for use before rolling back.
 * If a callback is provided, it synces the entire operation with Reflow's normal read/write cycles.
 *
 * @param HTMLElement		el 
 * @param string|object		nameOrProps
 * @param string|number		val
 * @param function			readCallback
 *
 * @return Promise
 */
const cssComputeAsync = function(el, nameOrProps, val = null, readCallback = null) {
	var propsToRead = _isObject(nameOrProps) ? Object.keys(nameOrProps) : nameOrProps;
	readCallback = _isObject(nameOrProps) ? val : readCallback;
	// -------------
	var inlineSavepoint = cssReadInline(el, propsToRead);
	return cssWriteAsync(el, nameOrProps, val).then(() => {
		return cssReadAsync(el, readCallback || propsToRead).then(computedValues => {
			// We return the computedValues in a promise
			return cssWriteAsync(el, inlineSavepoint).then(() => {
				return computedValues;
			});
		});
	});
};

/**
 * Establishes a CSS operatiom that can be rolledback without altering similar operation by other code.
 * If a callback is provided, it synces the entire operation with Reflow's normal read/write cycles.
 *
 * @param HTMLElement			el 
 * @param string|array			props
 *
 * @return Transaction
 */
const cssTransaction = function(el, props) {
	return new Transaction(el, props, (el, props) => {
		return cssReadInline(el, props);
	}, (el, data) => {
		return cssWriteAsync(el, data);
	});
};

/**
 * ------------------------------
 * Stylesheet functions.
 * ------------------------------
 */

/**
 * Returns inline-only CSS properties.
 *
 * @param HTMLElement		el
 * @param string|object		prop
 * @param bool|string		withVendorVersions
 *
 * @return mixed
 */
const cssReadInline = function(el, props, withVendorVersion = 'auto') {
	var style = el.getAttribute('style');
	if (props === 'all') {
		props = style.split(';').map(str => str.split(':')[0]);
	}
	return ruleCallback(props, prop => {
		var regex = new RegExp(';[ ]*?' + prop + ':([^;]+);?', 'g');
		return (regex.exec(';' + style) || ['', ''])[1].trim();
	}, withVendorVersion);
};

/**
 * Returns inline-only CSS properties.
 *
 * @param HTMLElement		el
 * @param string|object		prop
 * @param bool				noCache
 * @param bool				withVendorVersions
 *
 * @return jQuery|object|string
 */
const cssReadStylesheet = function(el, props, noCache, withVendorVersion = 'auto') {
	// Ask cache first...
	var cacheKey = _isArray(props) ? props.join('|') : props;
	if (!noCache && stylesheetCache[cacheKey] && stylesheetCache[cacheKey].el === el) {
		return stylesheetCache[cacheKey]._remove(el);
	}
	// Find rules
	var allRules = [];
	stylesheetRuleCallback(ruleDefinition => {
		if (ruleDefinition.type === window.CSSRule.STYLE_RULE && el.matches(ruleDefinition.selectorText)) {
			var propsList = props;
			if (!props/*original*/) {
				propsList = [];
				for (var i = 0; i < ruleDefinition.style.length; i ++) {
					propsList.push(ruleDefinition.style[i]);
				}
			}
			allRules.push(ruleCallback(propsList, prop => {
				return ruleDefinition.style[prop];
			}, withVendorVersion));
		}
	});
	// Handle priority
	allRules.forEach(rules => {});
	// Save
	if (!stylesheetCache) {
		stylesheetCache = {};
	}
	stylesheetCache[cacheKey] = allRules.slice();
	stylesheetCache[cacheKey].el = el;
	return allRules;
};
		
/**
 * FInds the keyframes of the given animation name(s) across all stylesheets.
 *
 * @param string|array		name
 * @param bool				noCache
 * @param bool				normalize
 *
 * @return NULL|bool
 */
const cssReadKeyframes = function(name, noCache, normalize = true) {
	// Ask cache first...
	var cacheKey = _isArray(name) ? name.join('|') : name;
	if (!noCache && stylesheetKeyframesCache[cacheKey]) {
		return stylesheetKeyframesCache[cacheKey];
	}
	// Parse keyframes rule
	var parseKeyframes = function(ruleDefinition) {
		var keyframes = [];
		for (var i = 0; i < ruleDefinition.cssRules.length; i ++) {
			var keyframeRule = ruleDefinition.cssRules[i];
			var keyframe = parseRules(keyframeRule.cssText
				.replace(keyframeRule.keyText, '').replace('{', '').replace('}', '').trim()
			);
			var offsets = (keyframeRule.keyText || ' ').split(',').map(key => key === 'from' ? 0 : (key === 'to' ? 1 : (parseInt(key) / 100)));
			if (normalize) {
				normalizeToWAAPI(keyframe, ['animation-', 'transition-']);
				while(offsets.length) {
					var _keyframe = _copyPlain(keyframe);
					_keyframe.offset = offsets.shift();
					keyframes.push(_keyframe);
				}
			} else {
				keyframe.offset = offsets.length > 1 ? offsets : offsets[0];
				keyframes.push(keyframe);
			}
		}
		return keyframes.sort((a, b) => a.offset === b.offset ? 0 : a.offset > b.offset ? 1 : -1);
	};
	// Find keyframes
	var allKeyframes = [];
	stylesheetRuleCallback(ruleDefinition => {
		if ((ruleDefinition.type === window.CSSRule.KEYFRAMES_RULE || ruleDefinition.type === window.CSSRule[vendorPrefix.api.toUpperCase() + '_KEYFRAMES_RULE'])
		&& (_isArray(name) ? name : [name]).indexOf(ruleDefinition.name) > -1) {
			allKeyframes = allKeyframes.concat(allKeyframes, parseKeyframes(ruleDefinition));
			return true;
		}
	}, true/*reversed*/);
	// Save
	stylesheetKeyframesCache[cacheKey] = allKeyframes;
	return allKeyframes;
};

/**
 * ------------------------------
 * Other utils.
 * ------------------------------
 */

/**
 * Tells if the element's width is defined as auto.
 *
 * @param HTMLElement el
 *
 * @return bool
 */
const isAutoWidth = function(el) {
};

/**
 * Tells if the element's height is defined as auto.
 *
 * @param HTMLElement el
 *
 * @return bool
 */
const isAutoHeight = function(el) {
};

/**
 * Parses/decodes the element's transform rule
 *
 * @param HTMLElement el
 *
 * @return object
 */
const transformRule = function(el) {
};
		
/**
 * Returns preset easing functions from CSS variables.
 *
 * @param string 	name
 *
 * @return string|NULL
 */
const cssVarRead = function(name) {
	 var name = !name.indexOf('-') ? _fromCamel(name, '-') : name;
	return window.getComputedStyle(document.body).getPropertyValue('--' + name);
};

// -----------------------------------------
// -----------------------------------------

/**
 * Normalizes CSS animation properties to WAAPI compatible properties
 *
 * @param object			animationProps
 * @param string|arrau		prefix
 * @param string|arrau		offset
 *
 * @return null
 */
const normalizeToWAAPI = function(animationProps, offset, prefix = '') {
	if (_isArray(prefix)) {
		prefix.forEach(pref => {normalizeToWAAPI(animationProps, pref)});
		return;
	}
	if (animationProps[prefix + 'timing-function']) {
		animationProps.easing = animationProps[prefix + 'timing-function'];
		delete animationProps[prefix + 'timing-function'];
	}
	if (animationProps[prefix + 'fill-mode']) {
		animationProps.fill = animationProps[prefix + 'fill-mode'];
		delete animationProps[prefix + 'fill-mode'];
	}
	if (animationProps[prefix + 'iteration-count']) {
		animationProps.iterations = animationProps[prefix + 'iteration-count'];
		delete animationProps[prefix + 'iteration-count'];
		if (animationProps.iterations === 'infinite') {
			animationProps.iterations = Infinity;
		}
	}
};

/**
 * Loops thru all keys in props calls callback to obtain their value.
 *
 * @param string|array		props
 * @param function			callback
 * @param bool				withVendorVersion
 *
 * @return NULL|bool
 */
const ruleCallback = function(props, callback, withVendorVersion) {
	var valsList = {};
	var propsList = _arr_from(props);
	var callCallback = (i, prop) => {
		// We use the key as given, but we obtain value with
		// We support camel cases, but return their normalized versions
		var normalProp = _fromCamel(prop, '-').toLowerCase();
		// With vendor verison?
		// We set the vendor version first if support for this property
		if (withVendorVersion === 'auto') {
			valsList[normalProp] = callback(vendorize(normalProp) || normalProp, propsList[i]);
		} else {
			if (withVendorVersion) {
				var vendorizedProp = vendorize(normalProp);
				if (vendorizedProp) {
					valsList[vendorizedProp] = callback(vendorizedProp, propsList[i]);
				}
			}
			valsList[normalProp] = callback(normalProp, propsList[i]);
		}
	};
	_each(propsList, (i, prop) => {
		callCallback(i, prop);
	});
	return _isArray(props) || withVendorVersion || props === 'size' || props === 'offsets' 
		? valsList 
		: valsList[props];
};

/**
 * Loops thru all rules in all stylesheets (in reverse order possible).
 *
 * @param function			callback
 * @param bool				reversed
 *
 * @return NULL|bool
 */
const stylesheetRuleCallback = function(callback, reversed) {
	var stylesheets = document.styleSheets;
	var stylesheetCallback = function(stylesheet) {
		try {
			for (var k = 0; k < stylesheet.cssRules.length; k ++) {
				var ruleDefinition = stylesheet.cssRules[k];
				if (callback(ruleDefinition) === true) {
					return true;
				}
			}
		} catch (e) {}
	}
	if (reversed) {
		for (var i = stylesheets.length - 1; i >= 0; i --) {
			if (stylesheetCallback(stylesheets[i]) === true) {
				return true;
			}
		}
	} else {
		for (var i = 0; i < stylesheets.length; i ++) {
			if (stylesheetCallback(stylesheets[i]) === true) {
				return true;
			}
		}
	}
};

/**
 * Parses/decodes transform rule
 *
 * @param string str
 *
 * @return object
 */
const stylesheetTransformRuleParse = function(str) {
	var transform = {};
	var regex = /(\w+)\((.+?)\)/g;
	var match = null;
	while(match = regex.exec(str)) {
		transform[match[1]] = (match[2].indexOf(',') > -1 ? match[2].replace(' ', '').split(',') : match[2]);
	}
	return transform;
};
		
/**
 * Helper method: parses a CSS string into an associative array.
 *
 * @param string	 	css
 *
 * @return object
 */
const parseRules = function(css) {
	var split = {};
	_each(css.split(';'), (i, rule) => {
		rule = rule.split(':');
		split[rule[0].trim()] = rule[1].trim();
	});
	return split;
};

/**
 * Helper method: stringifies an associative array into a CSS string.
 *
 * @param object	 	css
 *
 * @return string
 */
const stringifyRules = function(css) {
	var str = [];
	_each(css, (propName, value) => {
		str.push(propName + ': ' + value);
	});
	return str.join('; ');
};
		
/**
 * Gets an accurate width of the device scrollbar by running a test.
 * (Adapted from bootstrap.js)
 *
 * @return int
 */
const standardScrollbarWidth = function() {
	var style = 'position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll';
	var d = $('<div style="' + style + '"></div>');
	document.body.appendChild(d);
	// Answer 2
	c = d[0].offsetWidth - d[0].clientWidth;
	document.body.removeChild(d);
	return c;
};

/**
 * Returns the vendor-specific css property if supported. NULL if not.
 *
 * @param string 	prop
 *
 * @return string|NULL
 */
const vendorize = function(prop) {
	var camelCasedProp = _toCamel(prop, true);
	if (vendorPrefix.api + camelCasedProp in document.body.style) {
		return vendorPrefix.css + _fromCamel(prop, '-');
	}
};

/**
 * CSS properties that must have a default pixel unit.
 *
 * @var array
 */
const autopx = ['width', 'height', 'top', 'left', 'right', 'bottom',
	'padding', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom',
	'margin', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom',
	'border-width', 'border-top-width', 'border-left-width', 'border-right-width', 'border-bottom-width',
	'outline-width', 'outline-top-width', 'outline-left-width', 'outline-right-width', 'outline-bottom-width',
];
	
/**
 * @var object
 */
const stylesheetCache = {};

/**
 * @var object
 */
const stylesheetKeyframesCache = {};

/**
 * @exports
 */
export {
	cssRead,
	cssWrite,
	css,
	cssReadAsync,
	cssWriteAsync,
	cssAsync,
	cssReadInline,
	cssComputeAsync,
	cssTransaction,
	cssReadStylesheet,
	cssReadKeyframes,
	isAutoWidth,
	isAutoHeight,
	transformRule,
	cssVarRead,
	standardScrollbarWidth,
	vendorize,
	autopx,
};
export default css;
