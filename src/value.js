(function() {

	var getUID = rt.object.getUID;

	/**
	 * @memberOf Rift.value
	 *
	 * @param {*} value
	 * @returns {string}
	 */
	function getHash(value) {
		switch (typeof value) {
			case 'undefined': {
				return 'undefined';
			}
			case 'object': {
				if (value === null) {
					return 'null';
				}

				break;
			}
			case 'boolean': { return '?' + value; }
			case 'number': { return '+' + value; }
			case 'string': { return ',' + value; }
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
	var conversionDict = Object.assign(Object.create(null), {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'\'': '\\\'',
		'\\': '\\\\'
	});

	/**
	 * @private
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeString(str) {
		return str.replace(reEscapableChars, function(chr) {
			return conversionDict[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
		});
	}

	var reUnquotableProp = /^[$_a-zA-Z][$\w]*$/;
	var reZeros = /0+$/;
	var reScriptTagEnd = /<\/(script\b[^>]*)>/gi;

	/**
	 * @memberOf Rift.value
	 *
	 * @param {*} value
	 * @returns {string}
	 */
	function stringify(value) {
		if (value === undefined) {
			return 'void 0';
		}
		if (value === null) {
			return 'null';
		}

		var type = typeof value;

		if (type == 'object') {
			var js = [];

			if (Array.isArray(value)) {
				for (var i = value.length; i;) {
					js.unshift(--i in value ? stringify(value[i]) : '');
				}

				js = '[' + js.join(',') + (js[js.length - 1] == '' ? ',]' : ']');
			} else {
				for (var name in value) {
					if (hasOwn.call(value, name)) {
						js.push(
							(reUnquotableProp.test(name) ? name : '\'' + escapeString(name) + '\'') + ':' +
								stringify(value[name])
						);
					}
				}

				js = '{' + js + '}';
			}

			return js.replace(reScriptTagEnd, "</'+'$1>");
		}

		if (type == 'number') {
			if (value && value % 1000 == 0) {
				return String(value).replace(reZeros, function(zeros) {
					return 'e' + zeros.length;
				});
			}
		} else if (type == 'string') {
			return '\'' + escapeString(value).replace(reScriptTagEnd, "</'+'$1>") + '\'';
		}

		return String(value);
	}

	/**
	 * @namespace Rift.value
	 */
	rt.value = {
		getHash: getHash,
		stringify: stringify
	};

})();
