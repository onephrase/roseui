
/**
 * @imports
 */
import _inherit from '@onephrase/commons/obj/inherit.js';
import _Chtml from '@onephrase/chtml';
import Element from './Element/Element.js';
import Component from './Component.js';

/**
 * ---------------------------
 * A reactive Element library.
 * ---------------------------
 */

/**
 * Tells if an object is a DOM element.
 *
 * @param mixed 				input
 *
 * @return bool
 */
const Chtml = class extends _Chtml {
	
	/**
	 * Overrides the Static paramter in super.from() with self.
	 *
	 * @see super.from()
	 */
	static from(input, params = {}, resolveInheritance = true, Static = Chtml) {
		return super.from(input, params, resolveInheritance, Static);
	}

	// ----------------------------------------

	/**
	 * @inheritdoc
	 */
	constructor(el, params = {}) {
		super(el, _inherit({}, params, Chtml.params));
	}
	
	/**
	 * Adds a component to the instance;
	 * saves it at an automatically-derived name.
	 *
	 * @param string 		name	
	 * @param array 		...args	
	 *
	 * @inheritdoc
	 */
	use(name, ...args) {
		return this.useAs(name, '$' + name, ...args);
	}
	
	/**
	 * Adds a component to the instance;
	 * saves it at the given key.
	 *
	 * @param string 		name	
	 * @param string 		key	
	 * @param array 		...args	
	 *
	 * @return object
	 */
	useAs(name, key, ...args) {
		var componentInstance = Component.use(name, ...args);
		this.set(key, componentInstance);
		return componentInstance;
	}
};

/**
 * Deep override the default factory method.
 */
Chtml.params.drilldown = true;
Chtml.params.observeOnly = false;
Chtml.params.nodeCallback = el => new Element(el);
Chtml.params.componentCallback = Chtml.from;

/**
 * @exports
 */
export default Chtml;