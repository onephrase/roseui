
/**
 * @imports
 */
import Obj from '../vendor/PhrasingEngine/Expr';
import Comparison from '../vendor/PhrasingEngine/Comparison';
import Arr from '../vendor/PhrasingEngine/Arr';
import Obj from '../vendor/PhrasingEngine/Obj';

/**
 * ---------------------------
 * Storage utilities.
 * ---------------------------
 */
const Storage = class {
	
	/**
	 * Initializes a new storage object.
	 *
	 * @param string 	key
	 * @param string 	category
	 *
	 * @return object
	 */
	constructor(key, category) {
		this.key = key;
		this.category = category;
	}
	
	/**
	 * Sets the value property on the instance
	 *
	 * @param string 	value
	 *
	 * @return this
	 */
	setVal(value) {
		this.value = value;
		return this;
	}
	
	// Session storage
	// ---------------
	
	/**
	 * Sets the value to the browser's session storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	setToSession() {
		if (this.category) {
			var main_value = storageGet('session', this.key);
			var whole_value = jsonCategory(main_value, this.category, this.value);
			if (storageSet('session', this.key, whole_value)) {
				return this;
			}
		} else {
			if (storageSet('session', this.key, whole_value)) {
				return this;
			}
		}
	}
	
	/**
	 * Gets the value from the browser's session storage
	 * using the instance key and catetory.
	 *
	 * @return mixed
	 */
	getFromSession() {
		if (this.category) {
			var main_value = storageGet('session', this.key);
			var category_value = jsonCategory(main_value, this.category);
			return category_value;
		} else {
			return storageGet('session', this.key)
		}
	}
	
	/**
	 * Removes the value from the browser's session storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	removeFromSession() {
		if (this.category) {
			var main_value = storageGet('session', this.key);
			var remainder = jsonCategory(main_value, this.category, null/*category_value*/, true/*remove_category*/);
			if (storageSet('session', this.key, remainder)) {
				return this;
			}
		} else {
			storageRemove('session', this.key);
		}
		return this;
	}
	
	// Local storage
	// ---------------

	/**
	 * Sets the value to the browser's local storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	setToLocal() {
		if (this.category) {
			var main_value = storageGet('local', this.key);
			var whole_value = jsonCategory(main_value, this.category, this.value);
			if (storageSet('local', this.key, whole_value)) {
				return this;
			}
		} else {
			if (storageSet('local', this.key, whole_value)) {
				return this;
			}
		}
	}
	
	/**
	 * Gets the value from the browser's local storage
	 * using the instance key and catetory.
	 *
	 * @return mixed
	 */
	getFromLocal() {
		if (this.category) {
			var main_value = storageGet('local', this.key);
			var category_value = jsonCategory(main_value, this.category);
			return category_value;
		} else {
			return storageGet('local', this.key);
		}
	}
	
	/**
	 * Removes the value from the browser's local storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	removeFromLocal() {
		if (this.category) {
			var main_value = storageGet('local', this.key);
			var remainder = jsonCategory(main_value, this.category, null/*category_value*/, true/*remove_category*/);
			if (storageSet('local', this.key, remainder)) {
				return this;
			}
		} else {
			storageRemove('local', this.key);
		}
		return this;
	}
	
	// Cookies
	// ---------------

	/**
	 * Sets the value to the browser's cookie storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	setToCookie(exdays) {
		if (!this.key) {
			return false;
		}
		var date = new Date();
		date.setTime(d.Datetime.strToTime('+' + exdays + 'days'));
		var expires = 'expires=' + date.toUTCString();
		document.cookie = this.key + '=' + this.value + '; ' + expires;
	}

	/**
	 * Gets the value from the browser's cookie storage
	 * using the instance key and catetory.
	 *
	 * @return mixed
	 */
	getFromCookie(cname) {
		if (!this.key) {
			return false;
		}
		var name = this.key + '=';
		var ca = document.cookie.split(';');
		for(var i = 0; i < ca.length; i ++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	}
	
	/**
	 * Removes the value from the browser's cookie storage
	 * using the instance key and catetory.
	 *
	 * @return this
	 */
	removeFromCookie(cname) {
		if (!this.key) {
			return false;
		}
		document.cookie = this.key + '=1; expires=Thu, 01 Jan 1970 00:00:00 UTC';
	}
	
	// -----------------------------------------
	
	var storageSet = function(type, key, value) {
		if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key) {
			return;
		}
		window[type + 'Storage'].setItem(key, value);
		return true;
	};
	var storageGet = function(type, key) {
		if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key) {
			return;
		}
		return window[type + 'Storage'].getItem(key);
	};
	var storageRemove = function(type, key) {
		if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key) {
			return;
		}
		window[type + 'Storage'].removeItem(key);
		return true;
	};
	var jsonCategory = function(main_value, category_name, category_value, remove_category) {
		// Work with category
		if (main_value) {
			parent_json = typeof main_value == 'object' ? main_value : JSON.parse(main_value);
		} else {
			parent_json = {};
		}
		if (typeof category_value == 'undefined' || remove_category) {
			if (remove_category) {
				// Delete category from parent
				if (parent_json[category_name]) {
					delete parent_json[category_name];
				}
				// Return value is everything back - the remainder
				return_value = parent_json;
			} else {
				// Return value from category
				return_value = parent_json[category_name];
			}
		} else {
			// Set value to category in parent
			parent_json[category_name] = category_value;
			// Return value is everything back
			return_value = parent_json;
		}
		return typeof return_value == 'object' ? JSON.stringify(return_value)/*Set is always object*/ : return_value;
	};
	
	// -----------------------------------------
};

(function(d) {

	
	// -----------------------------------------
	
	/**
	 * Tells if the current browser supports the Storage API.
	 *
	 * @return bool
	 */
	d.storage.isSupported = function() {
		return typeof window.localStorage !== 'undefined';
	};
	
	// -----------------------------------------
	
	/**
	 * Manages a global state.
	 *
	 * @params string key
	 *
	 * @return object
	 */
	d.storage.ask = function(key) {
		var storage = d.storage('questions', key);
		// The one asked before nko?
		var question = JSON.parse(storage.getFromLocal()) || {};
		if ((question.validity === 'session' && !storage.getFromSession())
		|| (parseInt(question.validity) && Date.now() > question.validity)) {
			// Expired!
			delete question.answer;
			delete question.validity;
		}
		question.save = function(answer, validity) {
			if (arguments.length > 0) {
				question.answer = answer;
				if (arguments.length > 1) {
					question.validity = validity;
				}
			}
			storage.setVal({
				answer: question.answer, 
				validity: parseInt(question.validity) ? d.datetime.strToTime(question.validity) : question.validity,
			}).setToLocal();
		};
		question.always = function() {
			question.validity = true;
			question.save();
		};
		question.session = function() {
			question.validity = 'session';
			question.save();
		};
		storage.setVal(1).setToSession();
		return question;
	};
})(Dramatic);
