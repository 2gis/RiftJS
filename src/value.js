(function() {

	var getUID = rt.object.getUID;

	/**
	 * @memberOf Rift.value
	 *
	 * @param {*} value
	 * @returns {string}
	 */
	function getHash(value) {
		if (value === undef) {
			return 'undefined';
		}
		if (value === null) {
			return 'null';
		}

		switch (typeof value) {
			case 'boolean': { return '?' + value; }
			case 'number': { return '+' + value; }
			case 'string': { return ';' + value; }
		}

		return '#' + getUID(value);
	}

	var reEscapableChars = RegExp(
		'[' +
			'\\\\' +
			'\'' +
			'\\x00-\\x1f' +
			'\\x7f-\\x9f' +
			'\\u00ad' +
			'\\u0600-\\u0604' +
			'\\u070f\\u17b4\\u17b5' +
			'\\u200c-\\u200f' +
			'\\u2028-\\u202f' +
			'\\u2060-\\u206f' +
			'\\ufeff' +
			'\\ufff0-\\uffff' +
		']',
		'g'
	);
	var conversionDict = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'\'': '\\\'',
		'\\': '\\\\'
	};

	/**
	 * @private
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeString(str) {
		return str.replace(reEscapableChars, function(chr) {
			return hasOwn.call(conversionDict, chr) ?
				conversionDict[chr] :
				'\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
		});
	}

	var reUnquotablePropName = /^[$_a-zA-Z][$\w]*$/;
	var reScriptTagEnd = /<\/(script\b[^>]*)>/gi;

	/**
	 * @memberOf Rift.value
	 *
	 * @param {*} value
	 * @returns {string}
	 */
	function toString(value) {
		if (value === undef) {
			return 'void 0';
		}
		if (value === null) {
			return 'null';
		}

		var type = typeof value;

		if (type != 'object') {
			return type == 'string' ?
				'\'' + escapeString(value).replace(reScriptTagEnd, "</'+'$1>") + '\'' :
				String(value);
		}

		var js = [];

		if (Array.isArray(value)) {
			for (var i = value.length; i;) {
				js.unshift(--i in value ? toString(value[i]) : '');
			}

			js = '[' + js + (js[js.length - 1] == '' ? ',]' : ']');
		} else {
			for (var name in value) {
				if (hasOwn.call(value, name)) {
					js.push(
						(reUnquotablePropName.test(name) ? name : '\'' + escapeString(name) + '\'') + ':' +
							toString(value[name])
					);
				}
			}

			js = '{' + js + '}';
		}

		return js.replace(reScriptTagEnd, "</'+'$1>");
	}

	/**
	 * @namespace Rift.value
	 */
	rt.value = {
		getHash: getHash,
		toString: toString
	};

})();
