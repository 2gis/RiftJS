var reEscapableChars = /([?+|$(){}[^.\-\]\/\\*])/g;

/**
 * Экранирует спецсимволы регулярного выражения.
 *
 * @example
 * var re = 'Hello?!*`~World+()[]';
 * re = new RegExp(escapeRegExp(re));
 * console.log(re);
 * // => /Hello\?!\*`~World\+\(\)\[\]/
 *
 * @typesign (str: string): string;
 */
function escapeRegExp(str) {
	return str.replace(reEscapableChars, '\\$1');
}

exports.escape = escapeRegExp;
