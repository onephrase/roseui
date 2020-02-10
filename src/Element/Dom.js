
/**
 * @imports
 */
import {
	_isArray,
	_isBoolean,
	_isString,
	_isObject,
	_isUndefined
} from '@onephrase/commons/src/Js.js';
import {
	_remove,
	_from as _arr_from
} from '@onephrase/commons/src/Arr.js';
import {
	_each,
	_from as _obj_from
} from '@onephrase/commons/src/Obj.js';
import {
	_toCamel
} from '@onephrase/commons/src/Str.js';
import Reflow from './Reflow.js';

/**
 * ---------------------------
 * Element manipulation utilites.
 * ---------------------------
 */

/**
 * Creates a DOM element
 * from any of markup, selector, HTMLElement.
 *
 * @param mixed 				input
 *
 * @return bool
 */
const from = function(input) {
	if (_isString(input)) {
		var el;
		if (input.trim().startsWith('<')) {
			// Create a node from markup
			var temp = document.createElement('div');
			temp.innerHtml = input;
			el = temp.firstChild;
		} else {
			el = find(input);
		}
		return el;
	}
	return input;
};

/**
 * Queries a DOM context for the first element matching
 * the given selector.
 *
 * @param string 				selector
 * @param DOMElement 			context
 *
 * @return HTMLElement
 */
const find = function(selector, context = document) {
	return _find(selector, context, false/*all*/);
};

/**
 * Queries a DOM context for all elements matching
 * the given selector.
 *
 * @param string 				selector
 * @param DOMElement 			context
 *
 * @return DOMNodeList
 */
const findAll = function(selector, context = document) {
	return _find(selector, context);
};

/**
 * DOM query.
 *
 * @param string 				selector
 * @param DOMElement 			context
 * @param bool		 			all
 *
 * @return DOMNodeList|HTMLElement
 */
const _find = function(selector, context = document, all = true) {
	var matchedItems, method = all ? 'querySelectorAll' : 'querySelector';
	try {
		matchedItems = context[method](selector);
	} catch(e) {
		try {
			matchedItems = context[method](selector.replace(/\:is\(/g, ':matches('));
		} catch(e) {
			try {
				matchedItems = context[method](selector.replace(/\:is\(/g, ':-webkit-any('));
			} catch(e) {
				try {
					matchedItems = context[method](selector.replace(/\:is\(/g, ':-moz-any('));
				} catch(e) {
					throw e;
				}
			}
		}
	}
	return matchedItems;
};

/**
 * @polyfills
 */

if (!Element.prototype.matches) {
	Element.prototype.matches = 
	Element.prototype.matchesSelector || 
	Element.prototype.mozMatchesSelector ||
	Element.prototype.msMatchesSelector || 
	Element.prototype.oMatchesSelector || 
	Element.prototype.webkitMatchesSelector ||
	function(s) {
		var matches = (this.document || this.ownerDocument).querySelectorAll(s),
			i = matches.length;
		while (--i >= 0 && matches.item(i) !== this) {}
		return i > -1;            
	};
}

/**
 * Gets or sets custom data.
 *
 * @param DOMElement			el 
 * @param string|array|object	requestOrPayload
 * @param mixed|void			val
 *
 * @return mixed
 */
const domData = function(el, requestOrPayload, val = null) {
	if (!el.dataset.__customDatasetKey) {
		el.dataset.__customDatasetKey = customDatasets.length;
		customDatasets[el.dataset.__customDatasetKey] = {};
	}
	var customDataset = customDatasets[el.dataset.__customDatasetKey];
	if (arguments.length === 2) {
		if (_isString(requestOrPayload)) {
			return customDataset[_toCamel(requestOrPayload)];
		}
		if (_isArray(requestOrPayload)) {
			var vals = {};
			requestOrPayload.forEach(key => {
				vals[key] = customDataset[_toCamel(key)];
			});
			return vals;
		}
	}
	var payload = requestOrPayload;
	if (!_isObject(requestOrPayload)) {
		payload = _obj_from(requestOrPayload, val);
	}
	_each(payload, (key, val) => {
		customDataset[_toCamel(key)] = val;
	});
};
const customDatasets = [];
 
/**
 * ---------------------
 * MANIPULATION METHODS
 * ---------------------
 */

/**
 * Gets an attribute or a list of attributes,
 * or sets an attribute or a list of attributes.
 *
 * @param DOMElement			el 
 * @param string|array|object	requestOrPayload
 * @param string|bool|void		valOrMutation
 * @param bool|void				subValMutation
 *
 * @return mixed
 */
const domAttr = function(el, requestOrPayload, valOrMutation = null, subValMutation = null) {
	if (arguments.length === 2) {
		if (_isString(requestOrPayload)) {
			return el.getAttribute(requestOrPayload);
		}
		if (_isArray(requestOrPayload)) {
			var vals = {};
			requestOrPayload.forEach(request => {
				vals[request] = el.getAttribute(request);
			});
			return vals;
		}
	}
	var payload = requestOrPayload;
	if (!_isObject(payload)) {
		payload = _obj_from(requestOrPayload, valOrMutation);
	} else {
		subValMutation = valOrMutation;
	}
	_each(payload, (name, valOrMutation) => {
		if (arguments.length > 3 || (_isObject(payload) && arguments.length > 2)) {
			var substr = _isString(valOrMutation) ? valOrMutation.trim() : valOrMutation;
			var currentVal = el.getAttribute(name);
			var currentValArray = currentVal ? currentVal.split(' ').map(val => val.trim()) : [];
			if (!subValMutation && currentValArray.includes(substr)) {
				// Add...
				el.setAttribute(name, _remove(currentValArray, substr).join(' '));
			} else if (subValMutation && !currentValArray.includes(substr)) {
				// Remove...
				el.setAttribute(name, currentValArray.concat(substr).join(' '));
			}
		} else {
			if (valOrMutation === false) {
				el.removeAttribute(name);
			} else {
				el.setAttribute(name, valOrMutation === true ? 'true' : valOrMutation);
			}
		}
	});
	return el;
};

/**
 * Sets or gets HTML content.
 *
 * @param string|HTMLElement	content
 *
 * @return void|string
 */
const domHtml = function(el, content = null) {
	if (arguments.length > 1) {
		if (_isString(content)) {
			el.innerHTML = content;
		} else {
			el.innerHTML = '';
			if (!_isUndefined(content)) {
				el.append(content);
			}
		}
		return el;
	}
	return el.innerHTML;  
};

/**
 * Sets or gets text content.
 *
 * @param string 				content
 *
 * @return void|string
 */
const domText = function(el, content = null) {
	if (arguments.length > 1) {
		el.innerText = _isUndefined(content) ? '' : content;
		return el;
	}
	return el.innerText;  
};

/**
 * Appends new content.
 *
 * @param string 				content
 *
 * @return HTMLElement
 */
const domAppend = function(el, content) {
	el.append(_isUndefined(content) ? '' : content); 
	return el; 
};

/**
 * Prepends new content.
 *
 * @param string 				content
 *
 * @return HTMLElement
 */
const domPrepend = function(el, content) {
	el.prepend(_isUndefined(content) ? '' : content);  
	return el; 
};
 
/**
 * ---------------------
 * ASYNC METHODS
 * ---------------------
 */

/**
 * The async type of domAttr().
 *
 * @see domAttr()
 *
 * @return Promise
 */
const domAttrAsync = function(el, requestOrPayload, valOrMutation = null, subValMutation = null) {
	if (arguments.length === 2) {
		return Reflow.onwrite((resolve, reject) => {
			try {
				resolve(domAttr(...arguments));
			} catch(e) {
				reject(e);
			}
		}, true/*withPromise*/);
	}
	return Reflow.onread((resolve, reject) => {
		try {
			resolve(domAttr(...arguments));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};

/**
 * The async type of domHtml().
 *
 * @see domHtml()
 *
 * @return Promise
 */
const domHtmlAsync = function(el, write = null) {
	if (arguments.length > 1) {
		return Reflow.onwrite((resolve, reject) => {
			try {
				resolve(domHtml(...arguments));
			} catch(e) {
				reject(e);
			}
		}, true/*withPromise*/);
	}
	return Reflow.onread((resolve, reject) => {
		try {
			resolve(domHtml(...arguments));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};

/**
 * The async type of domText().
 *
 * @see domText()
 *
 * @return Promise
 */
const domTextAsync = function(el, write = null) {
	if (arguments.length > 1) {
		return Reflow.onwrite((resolve, reject) => {
			try {
				resolve(domText(...arguments));
			} catch(e) {
				reject(e);
			}
		}, true/*withPromise*/);
	}
	return Reflow.onread((resolve, reject) => {
		try {
			resolve(domText(...arguments));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};

/**
 * The async type of domAppend().
 *
 * @see domAppend()
 *
 * @return Promise
 */
const domAppendAsync = function(el, write) {
	return Reflow.onwrite((resolve, reject) => {
		try {
			resolve(domAppend(...arguments));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};

/**
 * The async type of domPrepend().
 *
 * @see domPrepend()
 *
 * @return Promise
 */
const domPrependAsync = function(el, write) {
	return Reflow.onwrite((resolve, reject) => {
		try {
			resolve(domPrepend(...arguments));
		} catch(e) {
			reject(e);
		}
	}, true/*withPromise*/);
};
 
/**
 * ---------------------
 * OTHER METHODS
 * ---------------------
 */

/**
 * Returns all, only text nodes.
 *
 * @param DOMElement 			el
 *
 * @return array
 */
const domTextNodes = function(el) {
	// Filter
	var rejectScriptTextFilter = {
		acceptNode: function(node) {
			if (node.parentNode.nodeName !== 'SCRIPT') {
				return NodeFilter.FILTER_ACCEPT;
			}
		}
	};
	// Walker
	var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, rejectScriptTextFilter, false);
	var node;
	var textNodes = [];
	while(node = walker.nextNode()) {
		textNodes.push(node.nodeValue);
	}
	return textNodes;
};

/**
 * Observes when the given elements or selectors are added or removed
 * from the given context.
 *
 * @param array|HTMLElement|string	els
 * @param function					callback
 * @param int						test
 * @param HTMLElement|string		context
 * @param bool						observeContext
 *
 * @return MutationObserver
 */
const domMutationCallback = function(els, callback, test = null, context = null, observeContext = true) {
	var search = (el, nodeListArray) => {
		if (_isString(el)) {
			// Is directly mutated...
			var matches = nodeListArray.filter(node => node.matches(el));
			if (matches.length) {
				return matches;
			}
			// Is contextly mutated...
			if (observeContext) {
				matches = nodeListArray
					.reduce((collection, node) => collection.concat(_arr_from(node.querySelectorAll(el))), []);
				if (matches.length) {
					return matches;
				}
			}
		} else {
			// Is directly mutated...
			if (nodeListArray.includes(el)) {
				return el;
			}
			// Is contextly mutated...
			if (observeContext && nodeListArray.length) {
				var parentNode = el;
				while(!success && (parentNode = parentNode.parentNode)) {
					if (nodeListArray.includes(parentNode)) {
						return el;
					}
				}
			}
		}
	};
	var mo = new MutationObserver(mutations => {
		if (test !== 0) {
			var matchedAddedNodes = [];
			_arr_from(els).forEach(el => {
				if (_isString(el)) {
					matchedAddedNodes = mutations
						.reduce((matches, mut) => matches.concat(search(el, _arr_from(mut.addedNodes)), matchedAddedNodes));
				} else {
					var matchedAsAddedNode = mutations
						.reduce((match, mut) => match || search(el, _arr_from(mut.addedNodes)), null);
					if (matchedAsAddedNode) {
						matchedAddedNodes.push(matchedAsAddedNode);
					}
				}
			});
			if (matchedAddedNodes.length) {
				callback(1, ...matchedAddedNodes);
			}
		}
		if (test !== 1) {
			var matchedRemovedNodes = [];
			_arr_from(els).forEach(el => {
				if (_isString(el)) {
					matchedRemovedNodes = mutations
						.reduce((matches, mut) => matches.concat(search(el, _arr_from(mut.removedNodes)), matchedRemovedNodes));
				} else {
					var matchedAsRemovedNode = mutations
						.reduce((match, mut) => match || search(el, _arr_from(mut.removedNodes)), null);
					if (matchedAsRemovedNode) {
						matchedRemovedNodes.push(matchedAsRemovedNode);
					}
				}
			});
			if (matchedRemovedNodes.length) {
				callback(0, ...matchedRemovedNodes);
			}
		}
	});
	mo.observe(context || document.body, {childList:true, subtree:true});
	return mo;
};

/**
 * Shortcut function to connectedCallback().
 *
 * Observes when the given elements or selectors are added
 * to the given context.
 *
 * @param array|HTMLElement|string	els
 * @param function					callback
 * @param HTMLElement|string		context
 * @param bool						observeContext
 *
 * @return MutationObserver
 */
const domConnectedCallback = function(els, callback, context = null, observeContext = true) {
	return connectedCallback(els, (test, ...els) => {
		callback(...els);
	}, 1/*test*/, context, observeContext);
};

/**
 * Shortcut function to connectedCallback().
 *
 * Observes when the given elements or selectors are removed
 * from the given context.
 *
 * @param array|HTMLElement|string	els
 * @param function					callback
 * @param HTMLElement|string		context
 * @param bool						observeContext
 *
 * @return MutationObserver
 */
const domDisconnectedCallback = function(els, callback, context = null, observeContext = true) {
	return connectedCallback(els, (test, ...els) => {
		callback(...els);
	}, 0/*test*/, context, observeContext);
};

/**
 * Observes changes in attributes of the given element.
 *
 * @param HTMLElement				el
 * @param function					callback
 * @param array						filter
 *
 * @return MutationObserver
 */
const domAttrChangeCallback = function(el, callback, filter = []) {
	var observer = new MutationObserver(mutations => {
		mutations.forEach(m => {
			callback(m);
		});
	});
	var params = {attributes:true, attributeOldValue:true};
	if (filter) {
		params.attributeFilter = filter;
	}
	observer.observe(el, params);
	return observer;
};

/**
 * @exports
 */
export {
	from,
	find,
	findAll,
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
	domTextNodes,
	domMutationCallback,
	domConnectedCallback,
	domDisconnectedCallback,
	domAttrChangeCallback,
};