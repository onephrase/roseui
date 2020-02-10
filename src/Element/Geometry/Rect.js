
/**
 * @imports
 */
import {
	_isArray,
	_isObject,
	_isString,
	_isNumeric
} from '@onephrase/commons/src/Js.js';
import {
	_any,
	_intersect,
	_from as _arr_from
} from '@onephrase/commons/src/Arr.js';
import {
	_each,
	_copy,
	_merge,
	_with
} from '@onephrase/commons/src/Obj.js';
import {
	cssRead
} from '../Css/Css.js';
import TransformRule from '../Css/TransformRule.js';

/**
 * ---------------------------
 * The Element utility class
 * ---------------------------
 */
			
/**
 * Gets the element's width/height values or left/top offsets or both.
 *
 * A context can be specified from which to resolve left/top distances.
 * document origins are used by default.
 *
 * This function can calculate the rect of 3 different types of object:
 * - DOM element: offsets are calculated from el.getBoundingClientRect() and resolved relative to the specified offsetOrigin.
 *		width and height are calculated from el.getBoundingClientRect().
 * - Event object: offsets are calculated as the event's (client|offset|page) x/y, depending on the specified offsetOrigin.
 *		width and height are always 0, 0.
 * - Window object: offsets are calculated as the current left/top scroll, as determined by the value of offsetOrigin.
 *		width and height are always the window's inner width/height values.
 *
 * @param DOMElement|Event|window 	el
 * @param bool	 					size
 * @param DOMElement|window	 		offsetOrigin
 *
 * @return object
 */
const rect = function(el, size = true, offsetOrigin = null) {
	var rectProps = ['width', 'height', 'top', 'right', 'bottom', 'left'];
	var eventProps = ['clientX', 'clientY', 'offsetX', 'offsetY', 'pageX', 'pageY', 'screenX', 'screenY'];
	var _isElement = obj => obj instanceof HTMLElement || obj instanceof HTMLDocument;
	var _rect = {};
	if (_isObject(el) && _any(eventProps, prop => prop in el)) {
		_rect = size !== false ? {width:0, height:0,} : {};
		if (offsetOrigin === window || _isElement(offsetOrigin)) {
			_rect.left = el.clientX;
			_rect.top = el.clientY;
		} else if (offsetOrigin === true) {
			_rect.left = el.offsetX;
			_rect.top = el.offsetY;
		} else if (offsetOrigin !== false) {
			_rect.left = el.pageX;
			_rect.top = el.pageY;
		}
	} else if (el === window) {
		_rect = size !== false ? {width:window.innerWidth, height:window.innerHeight,} : {};
		if (offsetOrigin === window || offsetOrigin === true || _isElement(offsetOrigin)) {
			_rect.left = 0;
			_rect.top = 0;
		} else if (offsetOrigin !== false) {
			_rect.left = window.pageXOffset || document.documentElement.scrollLeft;
			_rect.top = window.pageYOffset || document.documentElement.scrollTop;
		}
	} else if (_isElement(el)) {
		_rect = el.getBoundingClientRect().toJSON();
		delete _rect.x;
		delete _rect.y;
		delete _rect.right;
		delete _rect.bottom;
		if (size === false) {
			delete _rect.width;
			delete _rect.height;
		}
		if (offsetOrigin === true) {
			offsetOrigin = el.offsetParent;
		} else if (offsetOrigin === false) {
			delete _rect.left;
			delete _rect.top;
		} else if (offsetOrigin !== window && !_isElement(offsetOrigin)) {
			_rect.left += (window.pageXOffset || document.documentElement.scrollLeft);
			_rect.top += (window.pageYOffset || document.documentElement.scrollTop);
		}
	} else if (_isObject(el) && _any(rectProps, prop => prop in el)) {
		_rect = _copy(el, rectProps);
	} else {
		throw new Error('Unknown object type!');
	}
	if (_isElement(offsetOrigin)) {
		var contextOffset = rect(offsetOrigin, false, window);
		_rect.left -= contextOffset.left;
		_rect.top -= contextOffset.top;
	}
	return _rect;
};

/**
 * Returns an object containing the element's width or height or both.
 *
 * @param DOMElement		el 
 * @param object			axis 
 *
 * @return object
 */
const size = function(el, axis) {
	var _size = rect(el, true, false);
	var axes = axis ? _arr_from(axis) : ['x', 'y'];
	if (!axes.includes('x')) {
		delete _size.width;
	}
	if (!axes.includes('y')) {
		delete _size.height;
	}
	return _size;
};

/**
 * Returns an object containing the element's left/top.
 *
 * @param DOMElement		el 
 * @param object			axis 
 * @param string|bool		offsetOrigin 
 *
 * @return object
 */
const offsets = function(el, axis, origin = null) {
	var _offsets = rect(el, false, origin);
	var axes = axis ? _arr_from(axis) : ['x', 'y'];
	if (!axes.includes('x')) {
		delete _offsets.left;
	}
	if (!axes.includes('y')) {
		delete _offsets.top;
	}
	return _offsets;
};

/**
 * Simulates, does not actually effect, a DOMElement to a some CSS position and
 * uses rect() to calculate its rects at that virtual position.
 *
 * @param DOMElement				el 
 * @param object 					offsets
 *
 * @return object
 */
const rectAtOffsets = function(el, offsets) {
	var _rect = rect(el);
	var positionType = cssRead(el, 'position');
	if (positionType !== 'static') {
		if (positionType === 'absolute') {
			var offsetParentRect = rect(el.offsetParent);
			_rect.top = offsetParentRect.top;
			_rect.left = offsetParentRect.left;
		} else if (positionType === 'fixed') {
			var offsetParentRect = rect(window);
			_rect.top = 0;
			_rect.left = 0;
		}
		_rect.top = _isNumeric(offsets.top) ? _rect.top + parseFloat(offsets.top) 
			: (_isNumeric(offsets.bottom) ? (offsetParentRect 
				? (offsetParentRect.top + offsetParentRect.height) - (_rect.height + offsets.bottom)
				: _rect.top - offsets.bottom
			) : 0);
		_rect.left = _isNumeric(offsets.left) ? _rect.left + parseFloat(offsets.left) 
			: (_isNumeric(offsets.right) ? (offsetParentRect 
				? (offsetParentRect.left + offsetParentRect.width) - (_rect.width + offsets.right)
				: _rect.left - offsets.right
			) : 0);
	}
	return _rect;
};

/**
 * Calculates the length on an axis of an intersection.
 *
 * @param HTMLElement|Event|window 	el
 * @param object		 			_rect
 * @param object		 			options
 *
 * @return object
 */
const coordsAtRect = function(el, _rect, options = {}) {
	var _intersection = intersection(rect(options.using || el), _rect);
	var length = {x:'width', y:'height'};
	var start = {x:'left', y:'top'};
	var end = {x:'right', y:'bottom'};
	var coords = {};
	var _alignment = {};
	['x', 'y'].forEach(axis => {
		if (options[axis] === false) {
			return;
		}
		var rect1Length = _intersection.rect1[length[axis]/*height*/];
		// Distinguish and predicate
		_alignment[axis] = parsePlacement(options[axis] || '');
		switch(_alignment[axis].keyword) {
			case 'before':
				// Pull beyond start
				coords[axis] = - (_intersection[start[axis]/*top*/] + rect1Length);
			break;
			case 'after':
				// Push beyond end
				coords[axis] = _intersection[end[axis]/*bottom*/] + rect1Length;
			break;
			case 'start':
				// Pull to start
				coords[axis] = - _intersection[start[axis]/*top*/];
			break;
			case 'end':
				// Push to end
				coords[axis] = _intersection[end[axis]/*bottom*/];
			break;
			default:
				// Align to center
				coords[axis] = _intersection.delta[axis];
		}
		// Apply predicates
		if (_alignment[axis].predicates) {
			coords[axis] += evalPredicates(_alignment[axis].predicates, rect1Length);
		}
	});
	coords.alignment = _alignment;
	coords.intersection = _intersection;
	return coords;
};

/**
 * Manipulates an element's translate.translate to place it with another element.
 *
 * @param HTMLElement|Event|window 	el
 * @param HTMLElement|Event|window	el2
 * @param object 					options
 *
 * @return object
 */
const translateTo = function(el, el2, options = {}) {
	// -----------
	var _coords = coordsAtRect(el, rect(el2), options);
	// -----------
	var _coordsFormatted = {
		from: new TransformRule({translate: [],}),
		to: new TransformRule({translate: [],}),
		current: {
			from: new TransformRule({translate: [],}),
			to: new TransformRule({translate: [],}),
			progress: {},
		},
	};
	// -----------
	var activeTransform = cssRead(el, 'transform');
	['x', 'y'].forEach((axis, i) => {
		if (axis in _coords) {
			_coordsFormatted.from.translate[i] = 0;
			_coordsFormatted.to.translate[i] = _coords[axis] + activeTransform.translate[i];
			// ----------------
			_coordsFormatted.current.from.translate[i] = activeTransform.translate[i];
			_coordsFormatted.current.to.translate[i] = _coords[axis];
			// ----------------
			_coordsFormatted.current.progress[axis] = Math.abs(activeTransform.translate[i] / (_coords[axis] + activeTransform.translate[i]));
		} else {
			_coordsFormatted.from.translate[i] = activeTransform.translate[i];
			_coordsFormatted.to.translate[i] = activeTransform.translate[i];
			// ----------------
			_coordsFormatted.current.from.translate[i] = activeTransform.translate[i];
			_coordsFormatted.current.to.translate[i] = activeTransform.translate[i];
			// ----------------
			_coordsFormatted.current.progress[axis] = 0;
		}
	});
	return _coordsFormatted;
};

/**
 * Calculates an element's offset where it to be at the given rect.
 *
 * @param HTMLElement|Event|window 	el
 * @param HTMLElement|Event|window	el2
 * @param object 					options
 *
 * @return object
 */
const offsetTo = function(el, el2, options = {}) {
	// -----------
	var _coords = coordsAtRect(el, rect(el2), options);
	// -----------
	var start = {x:'left', y:'top'};
	var end = {x:'right', y:'bottom'};
	var _offsets = _intersect(['x', 'y'], Object.keys(_coords)).reduce((obj, axis) => {
		switch(_coords.alignment[axis].keyword) {
			case 'before':
				return options.alternateAnchors ? _with(obj, start[axis], _coords[axis]) : _with(obj, end[axis], - _coords[axis]);
			case 'after':
				return options.alternateAnchors ? _with(obj, end[axis], - _coords[axis]) : _with(obj, start[axis], _coords[axis]);
			case 'end':
				return _with(obj, end[axis], - _coords[axis]);
			default: // center,start
				return _with(obj, start[axis], _coords[axis]);
		}
	}, {});
	// -----------
	var _offsetsFormatted = {from: {}, to: {}, current: {
			from: {}, to: {}, progress: {},
		},
	};
	// -----------
	var currentOffsets = positioningOffsets(el, Object.keys(_offsets));
	['left', 'right', 'top', 'bottom'].forEach(name => {
		if (name in _offsets) {
			_offsetsFormatted.from[name] = 0;
			_offsetsFormatted.to[name] = _offsets[name] + currentOffsets[name];
			// ----------------
			_offsetsFormatted.current.from[name] = currentOffsets[name];
			_offsetsFormatted.current.to[name] = _offsets[name];
			// ----------------
			_offsetsFormatted.current.progress[name] = Math.abs(currentOffsets[name] / (_offsets[name] + currentOffsets[name]));
		} else {
			_offsetsFormatted.from[name] = 'auto';
			_offsetsFormatted.to[name] = 'auto';
			// ----------------
			_offsetsFormatted.current.from[name] = 'auto';
			_offsetsFormatted.current.to[name] = 'auto';
		}
	});
	return _offsetsFormatted;
};

/**
 * Scrolls an element to the position of another element
 * within its scrollable parent.
 *
 * @param HTMLElement|Event|window 	el
 * @param HTMLElement|Event|window	el2
 * @param object 					options
 *
 * @return object
 */
const scrollTo = function(el, el2, options = {}) {
	var viewport = options.scrollAnchor || scrollParent(el);
	viewport = viewport === document.body ? window : viewport;
	if (!scrolls(viewport)) {
		return;
	}
	// -----------
	var _coords = coordsAtRect(el, rect(el2), options);
	// -----------
	var _offsetsFormatted = {from: {}, to: {}, current: {
			from: {}, to: {}, progress: {},
		},
		viewport: viewport,
	};
	// -----------
	var currentScroll = {
		scrollLeft: viewport[viewport === window ? 'pageXOffset' : 'scrollLeft'],
		scrollTop: viewport[viewport === window ? 'pageYOffset' : 'scrollTop'],
	};
	['x', 'y'].forEach((axis, i) => {
		var axisProp = axis === 'x' ? 'scrollLeft' : 'scrollTop';
		if (axis in _coords) {
			_coordsFormatted.from[axisProp] = 0;
			_coordsFormatted.to[axisProp] = _coords[axis] + currentScroll[axisProp];
			// ----------------
			_coordsFormatted.current.from[axisProp] = currentScroll[axisProp];
			_coordsFormatted.current.to[axisProp] = _coords[axis];
			// ----------------
			_coordsFormatted.current.progress[axis] = Math.abs(currentScroll[axisProp] / (_coords[axis] + currentScroll[axisProp]));
		} else {
			_coordsFormatted.from[axisProp] = currentScroll[axisProp];
			_coordsFormatted.to[axisProp] = currentScroll[axisProp];
			// ----------------
			_coordsFormatted.current.from[axisProp] = currentScroll[axisProp];
			_coordsFormatted.current.to[axisProp] = currentScroll[axisProp];
			// ----------------
			_coordsFormatted.current.progress[axis] = 0;
		}
	});
	return _coordsFormatted;
};

/**
 * Observes when any of the given elements
 * changes in size.
 *
 * @param [HTMLElement]			 	els
 * @param function					callback
 *
 * @return ResizeObserver
 */
const resizeCallback = function(els, callback) {
	var sizings = Object.keys(els);
	var ro = new ResizeObserver(entries => {
		for (let entry of entries) {
			sizings[els.indexOf(entry.target)] = {
				width: entry.contentRect.left + entry.contentRect.right, 
				height: entry.contentRect.top + entry.contentRect.bottom,
			};
		}
		sizings = sizings.map((sizing, i) => !_isObject(sizing) ? _copyPlain(rect(els[i]), ['width', 'height',]) : sizing);
		callback.call(...sizings);
	});
	els.forEach(el => {
		ro.observe(el);
	});
	return ro;
};

/**
 * ------------------------------
 * A set of utilities for processing rects.
 * ------------------------------
 */

/**
 * Computes the percentage proximity between two rects.
 *
 * @param object		rect1
 * @param object		rect2
 * @param string|array	axis
 * @param object		previousProximity
 *
 * @return object
 */
const proximity = function(rect1, rect2, axis, previousProximity) {
	var _proximity = {intersection: intersection(rect1, rect2)};				
	_proximity.x = _proximity.x || {};
	_proximity.y = _proximity.y || {};
	previousProximity = _copy(previousProximity);
	// X,Y processing...
	(axis ? _arr_from(axis) : ['x', 'y']).forEach(axis => {
		// In the context of the given axis...
		var distanceBefore = axis === 'x' ? 'left' : 'top';
		var distanceAfter = axis === 'x' ? 'right' : 'bottom';
		var rect1Length = rect1[axis === 'x' ? 'width' : 'height'];
		var rect2Length = rect2[axis === 'x' ? 'width' : 'height'];
		// ----- In which direction are we moving
		_proximity[axis].moving = 'positive';
		if (previousProximity.intersection) {
			_proximity[axis].moving = previousProximity.intersection[distanceBefore] > _proximity.intersection[distanceBefore] 
				? 'negative' : (previousProximity.intersection[distanceBefore] < _proximity.intersection[distanceBefore] 
					? 'positive' : previousProximity[axis].moving);
		}
		// ----- Cross-in percentage
		var percentageIn = 0;
		// Element topline touches or passes Anchor bottom line
		if (_proximity.intersection[distanceBefore] <= rect2Length
		// Element bottom line is yet to touch, or is just touches Anchor bottom line
		&& _proximity.intersection[distanceAfter] <= 0) {
			percentageIn = (rect1Length - Math.abs(_proximity.intersection[distanceAfter])) / rect1Length;
		} else if (_proximity.intersection[distanceAfter] > 0) {
			percentageIn = 1;
		}
		// ----- Cross-out percentage
		var percentageOut = 0;
		// Element topline touches or passes Anchor top line
		if (_proximity.intersection[distanceBefore] <= 0
		// Element bottom line is yet to touch, or is just touches Anchor top line
		&& _proximity.intersection[distanceAfter] <= rect2Length) {
			percentageOut = Math.abs(_proximity.intersection[distanceBefore]) / rect1Length;
		} else if (_proximity.intersection[distanceAfter] > rect2Length) {
			percentageOut = 1;
		}
		// ----- Cross-pass percentage
		var percentagePass = 0;
		// Element topline touches or passes Anchor bottom line
		if (_proximity.intersection[distanceBefore] <= rect2Length
		// Element bottom line is yet to touch, or is just touches Anchor top line
		&& _proximity.intersection[distanceAfter] <= rect2Length) {
			var totalDistance = rect2Length + rect1Length;
			var currentPass = proximity.intersection[distanceBefore] + rect1Length;
			percentagePass = (totalDistance - currentPass) / totalDistance;
		} else if (_proximity.intersection[distanceAfter] > rect2Length) {
			percentagePass = 1;
		}
		// ----- Cross-overflow percentage
		var percentageContained = 0;
		if (rect1Length > rect2Length) {
			// Element is larger than, and covering Anchor top/bottom lines
			if (_proximity.intersection[distanceBefore] <= 0
			&& _proximity.intersection[distanceAfter] <= 0) {
				var lengthDifference = rect1Length - rect2Length;
				percentageContained = Math.abs(_proximity.intersection[distanceBefore]) / lengthDifference;
			} else if (_proximity.intersection[distanceAfter] > 0) {
				percentageContained = 1;
			}
		} else {
			// Element is smaller than, and within Anchor top/bottom lines
			if (_proximity.intersection[distanceBefore] >= 0
			&& _proximity.intersection[distanceAfter] >= 0) {
				var lengthDifference = rect2Length - rect1Length;
				percentageContained = _proximity.intersection[distanceAfter] / lengthDifference;
			} else if (_proximity.intersection[distanceBefore] < 0) {
				percentageContained = 1;
			}
		}
		// ------ Bind the values to the instance object
		if (_proximity[axis].moving === 'negative') {
			_proximity[axis].percentageIn = percentageIn;
			_proximity[axis].percentageOut = percentageOut;
			_proximity[axis].percentagePass = percentagePass;
			_proximity[axis].percentageContained = percentageContained;
		} else {
			_proximity[axis].percentageIn = 1 - percentageOut;
			_proximity[axis].percentageOut = 1 - percentageIn;
			_proximity[axis].percentagePass = 1 - percentagePass;
			_proximity[axis].percentageContained = 1 - percentageContained;
		}
		if (rect1Length > rect2Length) {
			_proximity[axis].percentageContained *= -1;
		}
	});
	return _proximity;
};

/**
 * Returns coordinates of the intersection between two rects.
 *
 * @param object		rect1
 * @param object		rect2
 *
 * @return object
 */
const intersection = function(rect1, rect2) {
	var _intersection = {
		left: rect1.left - rect2.left,
		top: rect1.top - rect2.top,
		right: (rect2.left + rect2.width) - (rect1.left + rect1.width),
		bottom: (rect2.top + rect2.height) - (rect1.top + rect1.height),
	};
	// More offsets
	var leftline = Math.max(rect1.left, rect2.left);
	var rightline = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);
	var topline = Math.max(rect1.top, rect2.top);
	var bottomline = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);
	_intersection.width = rightline > leftline ? rightline - leftline : 0;
	_intersection.height = bottomline > topline ? bottomline - topline : 0;
	// The raw values
	_intersection.rect1 = rect1;
	_intersection.rect2 = rect2;
	_intersection.delta = delta(rect1, rect2);
	return _intersection;
};

/**
 * Returns coordinates of two rects as one.
 *
 * @param object		rect1
 * @param object		rect2
 *
 * @return object
 */
const union = function(rect1, rect2) {
	var _union = {
		left: Math.min(rect1.left, rect2.left),
		top: Math.min(rect1.top, rect2.top),
		right: Math.max((rect1.left + rect1.width), (rect2.left + rect2.width)),
		bottom: Math.max((rect1.top + rect1.height), (rect2.top + rect2.height)),
	};
	// More offsets
	_union.width = _union.right - _union.left;
	_union.height = _union.bottom - _union.top;
	// The raw values
	_union.rect1 = rect1;
	_union.rect2 = rect2;
	_union.delta = delta(rect1, rect2);
	return _union;
};

/**
 * Returns distances in x, y, and z between the centers of two rects.
 *
 * @param object		rect1
 * @param object		rect2
 * @param bool			withAngle
 *
 * @return object
 */
const delta = function(rect1, rect2, withAngle = false) {
	var _delta = {};
	_delta.x = (rect2.left + (rect2.width / 2)) - (rect1.left + (rect1.width / 2));
	_delta.y = (rect2.top + (rect2.height / 2)) - (rect1.top + (rect1.height / 2));
	_delta.z = Math.sqrt(Math.pow(_delta.x, 2) + Math.pow(_delta.y, 2));
	if (withAngle) {
		_delta = _merge(_delta, deltaAngle(_delta));
	}
	return _delta;
};

/**
 * Returns distances in x, y, and z between the centers of two rects.
 *
 * @param object		delta
 *
 * @return object
 */
const deltaAngle = function(delta) {
	if (_isNumeric(delta.y) && _isNumeric(delta.x)) {
		var angleOfElevation = Math.atan(delta.y/delta.x);
	} else if (_isNumeric(delta.x) && _isNumeric(delta.z)) {
		var angleOfElevation = Math.acos(delta.x/delta.z);
	} else if (_isNumeric(delta.y) && _isNumeric(delta.z)) {
		var angleOfElevation = Math.asin(delta.y/delta.z);
	}
	var angleOfDepression = 180 - 90 - angleOfElevation;
	return {
		angle:angleOfElevation, 
		angle2:angleOfDepression, 
		isHorizontal:angleOfElevation < 45, 
		isVertical:angleOfDepression < 45,
	};
};

/**
 * ------------------------------
 * Other Utils.
 * ------------------------------
 */

/**
 * Gets the element's left,top,bottom,right values
 * with "auto"s resolved.
 *
 * @param HTMLElement			el 
 * @param array					anchors 
 *
 * @return object
 */
const positioningOffsets = function(el, anchors = ['left', 'top', 'right', 'bottom']) {
	var inverses = {right:'left', left:'right', bottom:'top', top:'bottom'};
	var currentOffsets = cssRead(el, anchors.concat('position'));
	var intersectionWithAnchor = null;
	anchors.forEach(name => {
		if (currentOffsets[name] === 'auto') {
			// Get what anchor value would be...
			// on current position type
			if (currentOffsets.position === 'relative') {
				currentOffsets[name] = - parseFloat(currentOffsets[inverses[name]]);
			} else if (currentOffsets.position === 'fixed') {
				intersectionWithAnchor = intersectionWithAnchor || intersection(rect(el), rect(window));
				currentOffsets[name] = intersectionWithAnchor[name];
			} else if (currentOffsets.position === 'absolute') {
				intersectionWithAnchor = intersectionWithAnchor || intersection(rect(el), rect(el.offsetParent));
				currentOffsets[name] = intersectionWithAnchor[name];
			}
		} else {
			currentOffsets[name] = parseFloat(currentOffsets[name]);
		}
	});
	delete currentOffsets.position;
	return currentOffsets;
};

/**
 * Returns the heighest z-index attained by any of its descendants,
 * starting from its stacking context.
 *
 * @param DOMElement		el 
 *
 * @return int
 */
const zHeight = function(el) {
	var zIndex = 0;
	_arr_from(el.children).forEach((el, i) => {
		zIndex = Math.max(zIndex, parseInt(cssRead(el, 'z-index')) || 0);
	});
	return zIndex;
};

/**
 * Parses the total width of the element's vertical borders.
 *
 * @param DOMElement 		el
 *
 * @return int
 */
const yBorders = function(el) {
	var borderWidth = 0;
	borderWidth += parseInt(cssRead(el, 'border-left-width'));
	borderWidth += parseInt(cssRead(el, 'border-right-width'));
	return borderWidth;
};

/**
 * Parses the total height of the element's horizontal borders.
 *
 * @param DOMElement 		el
 *
 * @return int
 */
const xBorders = function(el) {
	var borderHeight = 0;
	borderHeight += parseInt(cssRead(el, 'border-top-width'));
	borderHeight += parseInt(cssRead(el, 'border-bottom-width'));
	return borderHeight;
};

/**
 * Gets an element's nearest scrollable parent.
 *
 * @param DOMNode		el
 *
 * @return jQuery
 */
const scrollParent = function(el) {
	var style = window.getComputedStyle(el);
	var excludeStaticParent = style.position === 'absolute';
	var overflowRegex = false/*includeHidden*/ ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
	if (style.position !== 'fixed') {
		for (var parent = el; (parent = parent.parentElement);) {
			style = window.getComputedStyle(parent);
			if (excludeStaticParent && style.position === 'static') {
				continue;
			}
			if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
				return parent;
			}
		}
	}
	return document.body;
};

/**
 * Tells if an element is scrollable due to overflowing content.
 *
 * @param DOMNode		el
 *
 * @return bool
 */
const scrolls = function(el) {
	return el === window 
		? (el.pageYOffset || el.pageYOffset) 
		: (el.scrollHeight > el.clientHeight);
};

/**
 * ------------------------------
 * Still other Utils.
 * ------------------------------
 */

/**
 * Parses a directive to obtain a placement keyword and modifiers.
 *
 * @param string			 	expr
 *
 * @return object
 */
const parsePlacement = function(expr) {
	var regPlacement = new RegExp('(before|after|start|end|center)', 'g');
	var regModifiers = new RegExp('[\-\+][0-9]+(%)?', 'g');
	return {
		keyword: (expr.match(regPlacement) || [])[0],
		predicates: expr.match(regModifiers),
	};
};

/**
 * Sums a list of Mathematical expressions.
 *
 * @param array				 	modifiers
 * @param number 				percentageContext
 *
 * @return number
 */
const evalPredicates = function(modifiers, percentageContext) {
	return modifiers.reduce((total, modifier) => total + (modifier.endsWith('%') 
		? parseFloat(modifier) / 100 * percentageContext
		: parseFloat(modifier)
	), 0);
};

/**
 * @exports
 */
export {
	rect,
	size,
	offsets,
	rectAtOffsets,
	coordsAtRect,
	translateTo,
	offsetTo,
	scrollTo,
	resizeCallback,
	proximity,
	union,
	intersection,
	delta,
	deltaAngle,
	zHeight,
	yBorders,
	xBorders,
	scrollParent,
	scrolls,
};
export default rect;
