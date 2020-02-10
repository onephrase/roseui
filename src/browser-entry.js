
/**
 * @imports
 */
import Chtml from './Chtml.js';
import Component from './Component.js';
import Element from './Element/Element.js';
import Router from './App/Router.js';
import Frame from './App/Frame.js';

Component.register('router', Router, true);

// As globals
if (!window.OnePhrase) {
	window.OnePhrase = {};
}
window.OnePhrase.Rosewell = {
	Chtml,
	Component,
	Element,
	Router,
	Frame,
};
