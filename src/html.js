(function() {

	var reAmpersand = /&/g;
	var reLessThan = /</g;
	var reGreaterThan = />/g;
	var reQuote = /"/g;

	/**
	 * @function escape
	 * @memberOf Rift.html
	 *
	 * @param {*} str
	 * @returns {string}
	 */
	function escapeHTML(str) {
		return str
			.replace(reAmpersand, '&amp;')
			.replace(reLessThan, '&lt;')
			.replace(reGreaterThan, '&gt;')
			.replace(reQuote, '&quot;');
	}

	/**
	 * @namespace Rift.html
	 */
	_.html = {
		escape: escapeHTML
	};

})();
