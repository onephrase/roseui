
/**
 * @imports
 */
import _isClass from '@onephrase/commons/js/isClass.js';
import _inherit from '@onephrase/commons/obj/inherit.js';
import Observable from '@onephrase/observable';

/**
 * ---------------------------
 * The App class
 * ---------------------------
 *
 * This class provides window-like functionality as a component.
 */
			
const Component = class extends Observable {

	/**
	 * @inheritdoc
	 */
	constructor(state = {}, params = {}) {
		super(state, _inherit({}, params, Component.params));
	}
	
	// ----------------------------------------
	
	/**
	 * Finds and instantiates a registered component.
	 *
	 * @param string				name
	 * @param array					...args
	 *
	 * @return Component
	 */
	static use(name, ...args) {
		var construtor, instance;
		if (construtor = Component.registry[name]) {
			if (construtor.singletonInstance) {
				return construtor.singletonInstance;
			}
			if (_isClass(construtor.component)) {
				instance = new construtor.component(...args);
			} else {
				instance = construtor.component(...args);
			}
			if (construtor.singleton) {
				construtor.singletonInstance = instance;
			}
			return instance;
		}
		throw new Error('The "' + name + '" component is undefined!');
	}
	
	/**
	 * Registers a logical component.
	 *
	 * @param string				name
	 * @param Component|function	component
	 * @param bool					singleton
	 *
	 * @return void
	 */
	static register(name, component, singleton = false) {
		Component.registry[name] = {component:component, singleton:singleton};
	}
};

/**
 * @object
 */
Component.registry = {};

/**
 * @var object
 */
Component.params = {
}

/**
 * @exports
 */
export default Component;