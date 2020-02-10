
/**
 * @imports
 */
import Router from './Router.js';
import Component from '../Component.js';

/**
 * ---------------------------
 * The App class
 * ---------------------------
 *
 * This class provides window-like functionality as a component.
 */
			
const App = class extends Component {

	/**
	 * Initializes the App instance with default components.
	 *
	 * @param object				state
	 * @param object				params
	 *
	 * @return void
	 */
	constructor(state = {}, params = {}) {
		super(state, params);
		if (!this.get('router')) {
			// App router
			this.set('router', new Router);
		}
		/**
		if (!this.get('session')) {
			// App session
			this.set('session', new Session);
		}
		if (!this.get('storage')) {
			// App storage
			this.set('storage', new Storage);
		}
		*/
		if (!this.get('components')) {
			// App-wide components
			this.set('components', new Component([]/*list-type state*/));
		}
	}
};

/**
 * @exports
 */
export default App;