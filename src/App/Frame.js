
/**
 * @imports
 */
import _isObject from '@onephrase/commons/js/isObject.js';
import _isNumeric from '@onephrase/commons/js/isNumeric.js';
import _copy from '@onephrase/commons/obj/copy.js';
import _objFirst from '@onephrase/commons/obj/first.js';
import Component from '../Component.js';
import Frameset from './Frameset.js';

/**
 * ---------------------------
 * The Frame class
 * ---------------------------
 *
 * This class represents a given route and manages
 * its sub-route.
 */
			
const Frame = class extends Component {

	/**
	 * Constructs a new Frame instance.
	 * Sub-views may also be listed.
	 *
	 * Its content could either be static or remote.
	 *
	 * @param object				state
	 * @param object				params
	 *
	 * @return void
	 */
	constructor(state = {}, params = {}) {
		if (state.children && !(state.children instanceof Frameset)) {
			state = _copy(0, state);
			state.children = Frameset.create(state.children);
		}
		super(state, params);
		// -----------------------
		// Observe the Frame's route-slot
		var routerInstance = Component.use('router');
		var routePathSlot = this.get('routePathSlot') || 0;
		const select = (children, path) => {
			if (children && path) {
				var routePathSlotVal = _isNumeric(routePathSlot) ? path.arr[routePathSlot] : path.obj[routePathSlot];
				var activeChild = _objFirst(children.select(routePathSlotVal));
				return this.set({
					activeChild: activeChild,
					hasActiveChild: activeChild ? true : false,
				});
			} else {
				return this.set({
					activeChild: undefined,
					hasActiveChild: false,
				});
			}
		};
		// -----------------------
		routerInstance.observe('path', path => {
			return select(this.get('children'), path);
		}, {diff:true});
		// -----------------------
		this.observe('children', (children, _children, e) => {
			// Immediate children that are entering and leaving...
			if ((!e.bubbling || !e.bubbling.filter(path => path.split('.').length > 2).length)
			&& (e.entries.length || e.exits.length)) {
				return select(children, routerInstance.get('path'));
			}
		}, {allowBubbling:true, diff:true});
		// -----------------------
		this.observe(['activeChild', 'active'], states => {
			if (states[0]) {
				return states[0].active(state[1]);
			}
		}, {diff:true});
	}

	/**
	 * Controls the Frame's active state.
	 *
	 * @param bool				state
	 *
	 * @return mixed
	 */
	active(state = true) {
		return this.set('active', state);
	}
}

/**
 * @exports
 */
export default Frame;