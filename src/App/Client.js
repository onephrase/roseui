
/**
 * ---------------------------
 * A collection of Vendor utilities.
 * ---------------------------
 */
 	
/**
* The vendor prefix in different format.
*
* @param object
*/
const vendorPrefix = (function() {
	var styles = window.getComputedStyle(document.documentElement, '');
	var prefix = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || styles.Olink === '' && ['', 'o'])[1];
	var api = ('WebKit|Moz|Ms|O').match(new RegExp('(' + prefix + ')', 'i'))[1];
	return {prefix:prefix, css:'-' + prefix + '-', api:api,};
})();

/**
 * @exports
 */
export {
	vendorPrefix,
}