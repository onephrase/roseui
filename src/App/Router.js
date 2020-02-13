
/**
 * @imports
 */
import _sort from '@onephrase/commons/arr/sort.js';
import _isObject from '@onephrase/commons/js/isObject.js';
import _copy from '@onephrase/commons/obj/copy.js';
import _with from '@onephrase/commons/obj/with.js';
import Component from '../Component.js';

/**
 * ---------------------------
 * The Router class
 * ---------------------------
 *
 * This class provides additional functionality over
 * the native document.history object and the "onpopstate" event.
 */
			
const Router = class extends Component {

	/**
	 * Constructs a new Router instance. Typically,
	 * only one instance would be needed app-wide. So an should
	 * be used as a singleton.
	 *
	 * @param object				state
	 * @param object				params
	 *
	 * @return void
	 */
	constructor(state = {}, params = {}) {
		super(state, params);
		// -----------------------
		// This event is triggered by
		// either the browser back button,
		// the window.history.back(),
		// the window.history.forward(),
		// or the window.history.go() action.
		var getProps = (urlObj, state = null) => {
			urlObj = _copy(urlObj, urlProperties);
			urlObj.path = Router.parsePath(urlObj.pathname);
			urlObj.query = Router.parseQuery(urlObj.search);
			return state ? _with(urlObj, 'state', state) : urlObj;
		};
		window.addEventListener('popstate', e => {
			// Needed to alow document.location
			// to update to window.location
			setTimeout(() => {
				this.set(getProps(document.location, window.history.state));
			}, 0);
		});
		if (!this.get('href')) {
			// Startup route
			this.set(getProps(document.location));
		}
		if (!this.get('state') && window.history) {
			// Startup state
			this.set('state', window.history.state);
		}
		// -----------------------
		// Capture all link-clicks
		// and fire to this router.
		window.addEventListener('click', e => {
			// TODO: remove without issues
			e.preventDefault();
			var anchor, href, target;
			if ((anchor = e.target.closest('a')) 
			&& (href = anchor.getAttribute('href'))) {
				var e2 = this.route(href, null, anchor.getAttribute('target'));
				if (e2.defaultPrevented) {
					e.preventDefault();
				}
			}
		});
	}

	/**
	 * Sets new URL and state data and fires the change.
	 *
	 * For the benefit of calling observers and accessing listeners' disposition,
	 * this function should be used instead of window.history.pushState() and window.history.replaceState().
	 *
	 * @param string 	href
	 * @param object 	state
	 * @param string 	target
	 *
	 * @return void|false|Promise
	 */
	route(href, state = null, target = null) {
		var urlObj = Router.parseUrl(href);
		if (!_isObject(state)) {
			state = window.history.state;
		}
		// -----------------
		var listenersDisposition = this.set(_with(_with(urlObj, 'state', state), 'target', target));
		if (urlObj.href === document.location.href) {
			window.history.replaceState(state, '', href);
		} else {
			window.history.pushState(state, '', href);
		}
		if (listenersDisposition instanceof Promise) {
			listenersDisposition.catch(() => {
				this.back();
			});
		}
		// -----------------
		return listenersDisposition;
	}
	
	/**
	 * Updates the current url with new state data.
	 *
	 * For the benefit of calling observers and accessing listeners' disposition,
	 * this function should be used instead of window.history.replaceState().
	 *
	 * @param object 	state
	 *
	 * @return void|false|Promise
	 */
	update(state) {
		window.history.replaceState(state, '', document.location);
		return this.set('data', state);
	}

	/**
	 * Forwards to a visited route using window.history.forward()
	 *
	 * This function eventually calls observers via "popstate" event bound in the constructor.
	 * But this won't return a Promise as Router.route() would.
	 *
	 * @return void
	 */
	forward() {
		window.history.forward();
	}

	/**
	 * Returns to a previous route using window.history.back()
	 *
	 * This function eventually calls observers via "popstate" event bound in the constructor.
	 * But this won't return a Promise as Router.route() would.
	 *
	 * @return void
	 */
	back() {
		window.history.back();
	}

	/**
	 * Goes to a specific history entry using window.history.go()
	 *
	 * This function eventually calls observers via "popstate" event bound in the constructor.
	 * But this won't return a Promise as Router.route() would.
	 *
	 * @param int key
	 *
	 * @return void
	 */
	go(key) {
		window.history.go(key);
	}

	/**
	 * Tells if the given URL matches the router's current URL
	 *
	 * @param string			href
	 *
	 * @return bool
	 */
	matches(href) {
		var urlObj = Router.parseUrl(href);
		return (this.get('href') + '/').startsWith(!urlObj.href.endsWith('/') ? urlObj.href + '/' : urlObj.href);
	}

	/**
	 * Parses an URL and returns its properties
	 *
	 * @param string			href
	 *
	 * @return object
	 */
	static parseUrl(href) {
		var a = document.createElement('a');
		a.href = href;
		var urlObj = urlProperties.reduce((obj, prop) => _with(obj, prop, a[prop]), {});
		urlObj.path = Router.parsePath(urlObj.pathname);
		urlObj.query = Router.parseQuery(urlObj.search);
		return urlObj;
	}

	/**
	 * Parses the input path and returns its parts named
	 *
	 * @param string			path
	 *
	 * @return object
	 */
	static parsePath(path) {
		var pathArr = path.split('/').filter(k => k);
		var pathStr = path === '/' ? path : '/' + pathArr.join('/') + '/';
		var pathnaming = _sort(Object.keys(Router.pathnaming), 'desc').reduce((_pathnames, _path) => {
			return _pathnames || (pathStr.startsWith(_path === '/' ? _path : '/' + _path.split('/').filter(k => k).join('/') + '/') ? Router.pathnaming[_path] : null);
		}, null);
		var pathObj = pathArr.reduce((obj, pathItem, i) => pathnaming[i] ? _with(obj, pathnaming[i], pathItem) : obj, {});
		return {
			str:pathStr,
			arr:pathArr,
			obj:pathObj,
		};
	}

	/**
	 * Parses the input query string and returns its parts named
	 *
	 * @param string			query
	 *
	 * @return object
	 */
	static parseQuery(query) {
		var queryArr = (query.startsWith('?') ? query.substr(1) : query)
			.split('&').map(q => q.split('=').map(str => str.trim()));
		return queryArr.reduce((obj, q) => _with(obj, q[0], q[1]), {});
	}
};

/**
 * These are standard
 * and shouldnt'/can't be modified
 *
 * @array
 */
const urlProperties = [
	'hash',
	'host',
	'hostname',
	'href',
	'origin',
	'pathname',
	'port',
	'protocol',
	'search',
];

/**
 * @array
 */
Router.pathnaming = {
	'/': ['controller', 'resourceType', 'resourceId', 'action',],
};

/**
 * @exports
 */
export default Router;