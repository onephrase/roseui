
/**
 * @imports
 */
import Chtml from './Chtml.js';
import Component from './Component.js';
import Element from './Element/Element.js';
import Bundler from './Bundler.js';
import Router from './App/Router.js';
import Frame from './App/Frame.js';

Component.register('router', Router, true);

/**
 * @exports
 */
export {
	Chtml,
	Component,
	Element,
	Bundler,
	Router,
	Frame
};
