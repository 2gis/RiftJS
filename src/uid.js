var KEY_UID = '__rt_uid__';
if (global.Symbol && typeof Symbol.iterator == 'symbol') {
	KEY_UID = Symbol(KEY_UID);
}

exports.KEY = KEY_UID;

var uidCounter = 0;

/**
 * Генерирует уникальный идентификатор.
 *
 * @example
 * nextUID(); // '1'
 * nextUID(); // '2'
 * nextUID('uid-'); // 'uid-3'
 *
 * @typesign (prefix: string = ''): string;
 */
function nextUID(prefix) {
	return (prefix || '') + (++uidCounter);
}

exports.next = nextUID;
