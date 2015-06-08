(function(undefined) {
'use strict';

var global = Function('return this;')();

/**
 * @namespace Rift
 */
var rt;

if (typeof exports != 'undefined') {
	rt = exports;
} else {
	rt = global.Rift = global.rt = {};
}

rt.global = global;

var KEY_INNER = rt.KEY_INNER = '_rt-inner';
var KEY_USED = rt.KEY_USED = '_rt-used';
var KEY_DATA_CELLS = '_rt-dataCells';
var KEY_VIEW = '_rt-view';
var KEY_VIEW_ELEMENT_NAME = '_rt-viewElementName';

var isServer = rt.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
var isClient = rt.isClient = !isServer;

var $ = rt.$ = isClient ? global.jQuery || global.Zepto || global.ender || global.$ : undefined;

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

/**
 * @memberOf Rift
 *
 * @param {*} err
 */
function logError(err) {
	console.error(err === Object(err) && err.stack || err);
}

rt.logError = logError;

/*!
 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
 */
function svz(a, b) {
	return a === b || (a != a && b != b);
}

function isEmpty(obj) {
	/* eslint-disable no-unused-vars */
	for (var any in obj) {
		return false;
	}
	/* eslint-enable no-unused-vars */

	return true;
}

/*!
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertySymbols
 */
if (!Object.getOwnPropertySymbols) {
	Object.getOwnPropertySymbols = function(obj) {
		return [];
	};
}

/*!
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if (!Object.assign) {
	Object.defineProperty(Object, 'assign', {
		configurable: true,
		writable: true,
		value: function(obj, source) {
			if (obj == null) {
				throw new TypeError('Can\'t convert ' + obj + ' to an object');
			}

			obj = Object(obj);

			for (var i = 1, l = arguments.length; i < l; i++) {
				var src = arguments[i];

				if (src == null) {
					throw new TypeError('Can\'t convert ' + src + ' to an object');
				}

				src = Object(src);

				var keys = Object.keys(src);

				for (var j = 0, m = keys.length; j < m; j++) {
					obj[keys[j]] = src[keys[j]];
				}

				var symbols = Object.getOwnPropertySymbols(src);

				for (var j = 0, m = symbols.length; j < m; j++) {
					obj[symbols[j]] = src[symbols[j]];
				}
			}

			return obj;
		}
	});
}

(function() {

	var uidCounter = 0;

	/**
	 * Генерирует уникальный идентификатор.
	 *
	 * @function next
	 * @memberOf Rift.uid
	 *
	 * @example
	 * nextUID(); // '1'
	 * nextUID(); // '2'
	 * nextUID(); // '3'
	 *
	 * @param {string} [prefix='']
	 * @returns {string}
	 */
	function nextUID(prefix) {
		if (uidCounter == 2176782335/* 'zzzzzz' */) {
			uidCounter = 0;
		}

		return (prefix || '') + (++uidCounter).toString(36);
	}

	/**
	 * @namespace Rift.uid
	 */
	rt.uid = {
		next: nextUID
	};

})();

(function() {

	var nextUID = rt.uid.next;

	/**
	 * Получает уникальный идентификатор объекта.
	 *
	 * @function
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {string} [prefix]
	 * @returns {string}
	 */
	var getUID;

	if (typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol') {
		var uidKey = Symbol('uid');

		getUID = function getUID(obj, prefix) {
			return obj[uidKey] || (obj[uidKey] = nextUID(prefix));
		};
	} else {
		var uidKey = '_rt-uid';

		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, uidKey)) {
				Object.defineProperty(obj, uidKey, {
					value: nextUID(prefix)
				});
			}

			return obj[uidKey];
		};
	}

	/**
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {Object} source
	 * @returns {Object}
	 */
	function mixin(obj, source) {
		var names = Object.getOwnPropertyNames(source);

		for (var i = names.length; i;) {
			Object.defineProperty(obj, names[--i], Object.getOwnPropertyDescriptor(source, names[i]));
		}

		return obj;
	}

	/**
	 * @function clone
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function cloneObject(obj) {
		return mixin(Object.create(Object.getPrototypeOf(obj)), obj);
	}

	/**
	 * @namespace Rift.object
	 */
	rt.object = {
		getUID: getUID,
		mixin: mixin,
		clone: cloneObject
	};

})();

(function() {

	/**
	 * Создаёт простанство имён или возвращает существующее.
	 *
	 * @function create
	 * @memberOf Rift.namespace
	 *
	 * @param {string|Array} id - Имена, разделённые точкой, или массив имён.
	 * @param {Object} [root=global]
	 * @returns {Object}
	 */
	function createNamespace(id, root) {
		if (typeof id == 'string') {
			id = id.split('.');
		}

		var ns = root || global;

		for (var i = 0, l = id.length; i < l; i++) {
			var value = ns[id[i]];

			if (value !== Object(value)) {
				do {
					ns = ns[id[i]] = {};
				} while (++i < l);

				break;
			}

			ns = value;
		}

		return ns;
	}

	/**
	 * @function exec
	 * @memberOf Rift.namespace
	 *
	 * @param {string} id
	 * @param {Object} [root=global]
	 * @returns {*}
	 */
	function execNamespace(id, root) {
		return Function('return this.' + id + ';').call(root || global);
	}

	/**
	 * @namespace Rift.namespace
	 */
	rt.namespace = {
		create: createNamespace,
		exec: execNamespace
	};

})();

(function() {

	var reEscapableChars = /([?+|$(){}[^.\-\]\/\\*])/g;

	/**
	 * Экранирует спецсимволы регулярного выражения.
	 *
	 * @function escape
	 * @memberOf Rift.regex
	 *
	 * @example
	 * var re = 'Hello?!*`~World+()[]';
	 * re = new RegExp(escapeRegExp(re));
	 * console.log(re);
	 * // => /Hello\?!\*`~World\+\(\)\[\]/
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeRegExp(str) {
		return str.replace(reEscapableChars, '\\$1');
	}

	/**
	 * Вызывает колбэк для каждого найденого в строке совпадения.
	 * Первым аргументом колбэк получает всё совпадение, остальными - запомненные подстроки.
	 *
	 * @function forEach
	 * @memberOf Rift.regex
	 *
	 * @example
	 * forEachMatch(/(\w+)\-(\d+)/g, 'a-1 b-2 c-3', function(pair, name, value) {
	 *     console.log(name + '=' + value);
	 * });
	 * // => a=1
	 * // => b=2
	 * // => c=3
	 *
	 * @param {RegExp} re - Регулярное выражение.
	 * @param {string} str - Строка, в которой будет происходить поиск совпадений.
	 * @param {Function} cb - Колбэк, который будет вызван для каждого найденного совпадения.
	 */
	function forEachMatch(re, str, cb) {
		if (re.global) {
			re.lastIndex = 0;

			for (var match; match = re.exec(str);) {
				if (cb.apply(global, match) === false) {
					break;
				}
			}
		} else {
			var match = re.exec(str);

			if (match) {
				cb.apply(global, match);
			}
		}
	}

	/**
	 * @namespace Rift.regex
	 */
	rt.regex = {
		escape: escapeRegExp,
		forEach: forEachMatch
	};

})();

(function() {

	var getUID = rt.object.getUID;

	/**
	 * @memberOf Rift.value
	 *
	 * @param {*} value
	 * @returns {string}
	 */
	function getStamp(value) {
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
			case 'boolean': {
				return '?' + value;
			}
			case 'number': {
				return '+' + value;
			}
			case 'string': {
				return ',' + value;
			}
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
					js[--i] = i in value ? stringify(value[i]) : '';
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

		if (type == 'string') {
			return '\'' + escapeString(value).replace(reScriptTagEnd, "</'+'$1>") + '\'';
		}

		if (type == 'number' && value && value % 1000 == 0) {
			return String(value).replace(reZeros, function(zeros) {
				return 'e' + zeros.length;
			});
		}

		return String(value);
	}

	/**
	 * @namespace Rift.value
	 */
	rt.value = {
		getStamp: getStamp,
		stringify: stringify
	};

})();

(function() {

	/**
	 * @function
	 * @memberOf Rift.process
	 *
	 * @example
	 * nextTick(function() {
	 *     console.log('nextTick');
	 * });
	 *
	 * @param {Function} cb - Колбэк, который запустится после освобождения потока выполнения.
	 */
	var nextTick;

	if (global.process && process.nextTick) {
		nextTick = process.nextTick;
	} else if (global.setImmediate) {
		nextTick = function(cb) {
			setImmediate(cb);
		};
	} else if (global.Promise) {
		var prm = Promise.resolve();

		nextTick = function(cb) {
			prm.then(function() {
				cb();
			});
		};
	} else if (global.postMessage && !global.ActiveXObject) {
		var queue;

		global.addEventListener('message', function() {
			if (queue) {
				var q = queue;

				queue = null;

				for (var i = 0, l = q.length; i < l; i++) {
					try {
						q[i]();
					} catch (err) {
						rt.logError(err);
					}
				}
			}
		}, false);

		nextTick = function(cb) {
			if (queue) {
				queue.push(cb);
			} else {
				queue = [cb];
				global.postMessage('__tic__', '*');
			}
		};
	} else {
		nextTick = function(cb) {
			setTimeout(cb, 1);
		};
	}

	/**
	 * @namespace Rift.process
	 */
	rt.process = {
		nextTick: nextTick
	};

})();

(function() {

	var mixin = rt.object.mixin;

	/**
	 * @namespace Rift.Class
	 */
	var Class;

	/**
	 * @property {Object<Function>}
	 * @memberOf Rift.Class
	 */
	var classes = Object.create(null);

	/**
	 * @function getOrError
	 * @memberOf Rift.Class
	 *
	 * @param {string} name
	 * @returns {Function}
	 */
	function getClassOrError(name) {
		if (!(name in classes)) {
			throw new TypeError('Class "' + name + '" is not defined');
		}

		return classes[name];
	}

	/**
	 * @function register
	 * @memberOf Rift.Class
	 *
	 * @param {string} name
	 * @param {Function} cl
	 * @returns {Function}
	 */
	function registerClass(name, cl) {
		if (name in classes) {
			throw new TypeError('Class "' + name + '" is already registered');
		}

		Object.defineProperty(cl, '__class', {
			value: name
		});

		classes[name] = cl;

		return cl;
	}

	/**
	 * @memberOf Rift.Class
	 *
	 * @this {Function} - Родительский класс.
	 * @param {string} [name] - Внутреннее имя.
	 * @param {Object} declaration - Объект-объявление.
	 * @param {Object} [declaration.static] - Статические свойства.
	 * @param {Function} [declaration.constructor] - Конструктор.
	 * @returns {Function}
	 */
	function extend(name, declaration) {
		if (typeof name == 'object') {
			declaration = name;
			name = undefined;
		}

		var parent = this == Class ? Object : this;
		var constr;

		if (hasOwn.call(declaration, 'constructor')) {
			constr = declaration.constructor;
			delete declaration.constructor;
		} else {
			constr = parent == Object ?
				function() {} :
				function() {
					return parent.apply(this, arguments);
				};
		}

		var proto = Object.create(parent.prototype);

		constr.prototype = proto;

		Object.defineProperty(constr, '$super', {
			writable: true,
			value: parent.prototype
		});

		Object.defineProperty(proto, 'constructor', {
			configurable: true,
			writable: true,
			value: constr
		});

		Object.keys(parent).forEach(function(name) {
			Object.defineProperty(constr, name, Object.getOwnPropertyDescriptor(parent, name));
		});

		if (hasOwn.call(declaration, 'static')) {
			mixin(constr, declaration.static);
			delete declaration.static;
		}

		if (constr.extend === undefined) {
			constr.extend = extend;
		}

		mixin(proto, declaration);

		if (name) {
			registerClass(name, constr);
		}

		return constr;
	}

	Class = {
		classes: classes,
		getOrError: getClassOrError,
		register: registerClass,
		extend: extend
	};

	rt.Class = Class;

})();

(function() {

	var getUID = rt.object.getUID;
	var stringify = rt.value.stringify;
	var classes = rt.Class.classes;
	var registerClass = rt.Class.register;

	registerClass('Array', Array);
	registerClass('Date', Date);

	Object.defineProperties(Date.prototype, {
		collectDumpObject: {
			configurable: true,
			writable: true,
			value: function(data) {
				data.utc = this.toString();
			}
		},

		expandFromDumpObject: {
			configurable: true,
			writable: true,
			value: function(data) {
				this.setTime(new Date(data.utc));
			}
		}
	});

	/**
	 * @private
	 *
	 * @param {Object} obj
	 * @param {Object} objects
	 * @returns {string}
	 */
	function collectDump(obj, objects) {
		var id = getUID(obj);

		if (objects.hasOwnProperty(id)) {
			return id;
		}

		var data = {};
		var opts = {};

		if (obj.constructor.hasOwnProperty('__class')) {
			if (obj.collectDumpObject) {
				obj.collectDumpObject(data, opts);
			} else {
				Object.assign(data, obj);
			}

			objects[id] = {
				c: obj.constructor.__class
			};
		} else {
			Object.assign(data, obj);
			objects[id] = {};
		}

		if (!isEmpty(data)) {
			for (var name in data) {
				var value = data[name];

				if (value === Object(value)) {
					data[name] = collectDump(value, objects);
				} else {
					data[name] = value === undefined ? {} : { v: value };
				}
			}

			objects[id].d = data;
		}

		if (!isEmpty(opts)) {
			objects[id].o = opts;
		}

		return id;
	}

	/**
	 * Сериализует объект в дамп.
	 *
	 * @memberOf Rift.dump
	 *
	 * @param {Object} obj
	 * @returns {string}
	 */
	function serialize(obj) {
		var objects = {};

		return stringify({
			s: objects,
			r: collectDump(obj, objects)
		});
	}

	/**
	 * Восстанавливает объект из дампа.
	 *
	 * @memberOf Rift.dump
	 *
	 * @param {string|Object} dump
	 * @returns {Object}
	 */
	function deserialize(dump) {
		if (typeof dump == 'string') {
			dump = Function('return ' + dump + ';')();
		}

		var objects = dump.s;

		for (var id in objects) {
			var obj = objects[id];

			if (obj.hasOwnProperty('c')) {
				var cl = classes[obj.c];
				obj.instance = obj.hasOwnProperty('o') ? new cl(undefined, obj.o) : new cl();
			} else {
				obj.instance = {};
			}
		}

		for (var id in objects) {
			var obj = objects[id];

			if (obj.hasOwnProperty('d')) {
				var data = obj.d;

				for (var name in data) {
					var item = data[name];

					if (typeof item == 'object') {
						data[name] = item.hasOwnProperty('v') ? item.v : undefined;
					} else {
						data[name] = objects[item].instance;
					}
				}

				if (obj.hasOwnProperty('c') && obj.instance.expandFromDumpObject) {
					obj.instance.expandFromDumpObject(data);
				} else {
					Object.assign(obj.instance, data);
				}
			}
		}

		return objects[dump.r].instance;
	}

	/**
	 * @namespace Rift.dump
	 */
	rt.dump = {
		serialize: serialize,
		deserialize: deserialize
	};

})();

if (!global.Map) {
	(function() {

		var getStamp = rt.value.getStamp;

		var entryStub = {
			value: undefined
		};

		function Map(arr) {
			this._entries = Object.create(null);

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.set(arr[i][0], arr[i][1]);
				}
			}
		}

		rt.object.mixin(Map.prototype, {
			_entries: null,

			_first: null,
			_last: null,

			size: 0,

			has: function(key) {
				return getStamp(key) in this._entries;
			},

			get: function(key) {
				return (this._entries[getStamp(key)] || entryStub).value;
			},

			set: function(key, value) {
				var entries = this._entries;
				var stamp = getStamp(key);

				if (stamp in entries) {
					entries[stamp].value = value;
				} else {
					var entry = entries[stamp] = {
						key: key,
						keyStamp: stamp,
						value: value,
						prev: this._last,
						next: null
					};

					if (this.size++) {
						this._last.next = entry;
					} else {
						this._first = entry;
					}

					this._last = entry;
				}

				return this;
			},

			delete: function(key) {
				var entries = this._entries;
				var stamp = getStamp(key);

				if (!(stamp in entries)) {
					return false;
				}

				if (--this.size) {
					var prev = entries[stamp].prev;
					var next = entries[stamp].next;

					if (prev) {
						prev.next = next;
					} else {
						this._first = next;
					}

					if (next) {
						next.prev = prev;
					} else {
						this._last = prev;
					}
				} else {
					this._first = null;
					this._last = null;
				}

				delete entries[stamp];

				return true;
			},

			forEach: function(cb, context) {
				if (context == null) {
					context = global;
				}

				var entry = this._first;

				while (entry) {
					cb.call(context, entry.value, entry.key, this);

					do {
						entry = entry.next;
					} while (entry && !(entry.keyStamp in this._entries));
				}
			},

			clear: function() {
				var entries = this._entries;

				for (var stamp in entries) {
					delete entries[stamp];
				}

				this._first = null;
				this._last = null;

				this.size = 0;
			}
		});

		[
			['keys', function(entry) {
				return entry.key;
			}],
			['values', function(entry) {
				return entry.value;
			}],
			['entries', function(entry) {
				return [entry.key, entry.value];
			}]
		].forEach(function(iterator) {
			Map.prototype[iterator[0]] = (function(getStepValue) {
				return function() {
					var entries = this._entries;
					var entry;
					var done = false;
					var map = this;

					return {
						next: function() {
							if (!done) {
								if (entry) {
									do {
										entry = entry.next;
									} while (entry && !(entry.keyStamp in entries));
								} else {
									entry = map._first;
								}

								if (entry) {
									return {
										value: getStepValue(entry),
										done: false
									};
								}

								done = true;
							}

							return {
								value: undefined,
								done: true
							};
						}
					};
				};
			})(iterator[1]);
		});

		global.Map = Map;

	})();
}

if (!global.Set) {
	(function() {

		function Set(arr) {
			this._entries = new Map();

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.add(arr[i]);
				}
			}
		}

		rt.object.mixin(Set.prototype, {
			_entries: null,

			get size() {
				return this._entries.size;
			},

			has: function(value) {
				return this._entries.has(value);
			},

			add: function(value) {
				this._entries.set(value, value);
				return this;
			},

			delete: function(value) {
				return this._entries.delete(value);
			},

			forEach: function(cb, context) {
				if (context == null) {
					context = global;
				}

				this._entries.forEach(function(value) {
					cb.call(context, value, value, this);
				}, this);
			},

			keys: function() {
				return this._entries.keys();
			},

			values: function() {
				return this._entries.values();
			},

			entries: function() {
				return this._entries.entries();
			},

			clear: function() {
				this._entries.clear();
			}
		});

		global.Set = Set;

	})();
}

(function() {

	/**
	 * @class Rift.Event
	 * @extends {Object}
	 *
	 * @param {string} type - Тип.
	 * @param {boolean} [canBubble=true] - Может всплывать.
	 */
	var Event = rt.Class.extend(/** @lends Rift.Event# */{
		/**
		 * Объект, к которому применено событие.
		 *
		 * @type {?Object}
		 * @writable
		 */
		target: null,

		/**
		 * Тип события.
		 *
		 * @type {string}
		 */
		type: undefined,

		/**
		 * @type {int|undefined}
		 * @writable
		 */
		timestamp: undefined,

		/**
		 * Дополнительная информация по событию.
		 *
		 * @type {?Object}
		 * @writable
		 */
		detail: null,

		/**
		 * Является ли событие всплывающим.
		 *
		 * @type {boolean}
		 */
		bubbles: true,

		/**
		 * Распространение события на другие объекты остановлено.
		 *
		 * @type {boolean}
		 */
		isPropagationStopped: false,

		/**
		 * Распространение события на другие объекты и его обработка на текущем остановлены.
		 *
		 * @type {boolean}
		 */
		isImmediatePropagationStopped: false,

		constructor: function(type, canBubble) {
			this.type = type;

			if (canBubble === false) {
				this.bubbles = false;
			}
		},

		/**
		 * Останавливает распространение события на другие объекты.
		 */
		stopPropagation: function() {
			this.isPropagationStopped = true;
		},

		/**
		 * Останавливает распространение события на другие объекты, а также его обработку на текущем.
		 */
		stopImmediatePropagation: function() {
			this.isPropagationStopped = true;
			this.isImmediatePropagationStopped = true;
		}
	});

	rt.Event = Event;

})();

(function() {

	var Event = rt.Event;

	/**
	 * @class Rift.EventEmitter
	 * @extends {Object}
	 */
	var EventEmitter = rt.Class.extend(/** @lends Rift.EventEmitter# */{
		_events: null,

		/**
		 * @type {?Rift.EventEmitter}
		 * @writable
		 */
		parent: null,

		/**
		 * @type {boolean}
		 * @writable
		 */
		silent: false,

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		on: function(type, listener, context) {
			if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					this._on(type, types[type], context);
				}
			} else {
				this._on(type, listener, context);
			}

			return this;
		},

		_on: function(type, listener, context) {
			var events = (this._events || (this._events = new Map())).get(type);

			if (!events) {
				events = [];
				this._events.set(type, events);
			}

			events.push({
				listener: listener,
				context: context || this
			});
		},

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		off: function(type, listener, context) {
			if (type === undefined) {
				this._events = null;
			} else if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					this._off(type, types[type], context);
				}
			} else {
				this._off(type, listener, context);
			}

			return this;
		},

		_off: function(type, listener, context) {
			var events = this._events || (this._events = new Map()).get(type);

			if (!events) {
				return;
			}

			if (!context) {
				context = this;
			}

			for (var i = events.length; i;) {
				if (events[--i].context == context) {
					var lst = events[i].listener;

					if (lst == listener || (lst.hasOwnProperty(KEY_INNER) && lst[KEY_INNER] == listener)) {
						events.splice(i, 1);
						break;
					}
				}
			}

			if (!events.length) {
				this._events.delete(type);
			}
		},

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		once: function(type, listener, context) {
			function outer() {
				this._off(type, outer, context);
				listener.apply(this, arguments);
			}
			outer[KEY_INNER] = listener;

			return this._on(type, outer, context);
		},

		/**
		 * @param {Rift.Event|string} evt
		 * @param {Object} [detail]
		 * @returns {Rift.Event}
		 */
		emit: function(evt, detail) {
			if (typeof evt == 'string') {
				evt = new Event(evt);
			} else if (evt.hasOwnProperty(KEY_USED)) {
				throw new TypeError('Attempt to use an object that is no longer usable');
			}

			evt[KEY_USED] = true;

			evt.target = this;
			evt.timestamp = Date.now();

			if (detail) {
				evt.detail = detail;
			}

			this._handleEvent(evt);

			return evt;
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_handleEvent: function(evt) {
			if (!this.silent || evt.target != this) {
				var type = evt.type;
				var events = (this._events && this._events.get(type) || []).slice(0);

				if (typeof this['on' + type] == 'function') {
					events.push({
						listener: this['on' + type],
						context: this
					});
				}

				for (var i = 0, l = events.length; i < l; i++) {
					if (evt.isImmediatePropagationStopped) {
						break;
					}

					try {
						if (events[i].listener.call(events[i].context, evt) === false) {
							evt.stopPropagation();
						}
					} catch (err) {
						this._logError(err);
					}
				}
			}

			if (this.parent && evt.bubbles && !evt.isPropagationStopped) {
				this.parent._handleEvent(evt);
			}
		},

		/**
		 * @protected
		 *
		 * @param {*} err
		 */
		_logError: function(err) {
			rt.logError(err);
		}
	});

	rt.EventEmitter = EventEmitter;

})();

(function() {

	var EventEmitter = rt.EventEmitter;

	/**
	 * @class Rift.ActiveDictionary
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Object|Rift.ActiveDictionary|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.adoptItemChanges=false]
	 */
	var ActiveDictionary = EventEmitter.extend('Rift.ActiveDictionary', /** @lends Rift.ActiveDictionary# */{
		_data: null,
		_valueCounts: null,

		_adoptItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			var thisData = new Map();
			var valueCounts = new Map();
			var adoptItemChanges = typeof opts == 'boolean' ? opts : !!opts && opts.adoptItemChanges;

			if (data) {
				if (data instanceof ActiveDictionary) {
					data = data._data;
				}

				for (var name in data) {
					var value = data[name];

					thisData.set(name, value);

					if (valueCounts.has(value)) {
						valueCounts.set(value, valueCounts.get(value) + 1);
					} else {
						valueCounts.set(value, 1);

						if (adoptItemChanges && value instanceof EventEmitter) {
							value.on('change', this._onItemChange, this);
						}
					}
				}
			}

			this._data = thisData;
			this._valueCounts = valueCounts;

			if (adoptItemChanges) {
				this._adoptItemChanges = true;
			}
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_onItemChange: function(evt) {
			this._handleEvent(evt);
		},

		/**
		 * Проверяет, имеет ли словарь запись с указанным именем.
		 *
		 * @param {string} name
		 * @returns {boolean}
		 */
		has: function(name) {
			return this._data.has(name);
		},

		/**
		 * Получает значение записи.
		 *
		 * @param {string} name
		 * @returns {*}
		 */
		get: function(name) {
			return this._data.get(name);
		},

		/**
		 * Устанавлиет значение записи.
		 *
		 * @param {string} name
		 * @param {*} value
		 * @returns {Rift.ActiveDictionary}
		 */
		set: function(name, value) {
			var values;

			if (typeof name == 'string') {
				values = {};
				values[name] = value;
			} else {
				values = name;
			}

			var data = this._data;
			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValueSet = new Set();
			var removedValues = [];
			var addedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: addedValues
			};

			for (name in values) {
				var hasName = data.has(name);
				var oldValue = data.get(name);
				var val = values[name];

				if (!hasName || !svz(oldValue, val)) {
					changed = true;

					if (hasName) {
						var oldValueCount = valueCounts.get(oldValue) - 1;

						if (oldValueCount) {
							valueCounts.set(oldValue, oldValueCount);
						} else {
							valueCounts.delete(oldValue);

							if (adoptItemChanges && oldValue instanceof EventEmitter) {
								oldValue.off('change', this._onItemChange, this);
							}

							removedValueSet.add(oldValue);
						}
					}

					if (valueCounts.has(val)) {
						valueCounts.set(val, valueCounts.get(val) + 1);
					} else {
						valueCounts.set(val, 1);

						if (adoptItemChanges && val instanceof EventEmitter) {
							val.on('change', this._onItemChange, this);
						}

						if (!removedValueSet.delete(val)) {
							addedValues.push(val);
						}
					}

					diff[name] = {
						type: hasName ? 'update' : 'add',
						oldValue: oldValue,
						value: val
					};

					data.set(name, val);
				}
			}

			if (changed) {
				removedValueSet.forEach(function(value) {
					removedValues.push(value);
				});

				this.emit('change', { diff: diff });
			}

			return this;
		},

		/**
		 * Удаляет записи.
		 *
		 * @param {...string} names
		 * @returns {Rift.ActiveDictionary}
		 */
		delete: function() {
			var data = this._data;
			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: []
			};

			for (var i = 0, l = arguments.length; i < l; i++) {
				var name = arguments[i];

				if (!data.has(name)) {
					continue;
				}

				changed = true;

				var value = data.get(name);
				var valueCount = valueCounts.get(value) - 1;

				if (valueCount) {
					valueCounts.set(value, valueCount);
				} else {
					valueCounts.delete(value);

					if (adoptItemChanges && value instanceof EventEmitter) {
						value.off('change', this._onItemChange, this);
					}

					removedValues.push(value);
				}

				diff[name] = {
					type: 'delete',
					oldValue: value,
					value: undefined
				};

				data.delete(name);
			}

			if (changed) {
				this.emit('change', { diff: diff });
			}

			return this;
		},

		/**
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains: function(value) {
			return this._valueCounts.has(value);
		},

		/**
		 * Создает копию словаря.
		 *
		 * @returns {Rift.ActiveDictionary}
		 */
		clone: function() {
			return new this.constructor(this, { adoptItemChanges: this._adoptItemChanges });
		},

		/**
		 * Преобразует в объект.
		 *
		 * @returns {Object}
		 */
		toObject: function() {
			var obj = {};

			this._data.forEach(function(value, name) {
				obj[name] = value;
			});

			return obj;
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			this._data.forEach(function(value, name) {
				data[name] = value;
			});

			if (this._adoptItemChanges) {
				opts.adoptItemChanges = true;
			}
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			this.set(data);
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			if (this._adoptItemChanges) {
				var onItemChange = this._onItemChange;

				this._valueCounts.forEach(function(value) {
					if (value instanceof EventEmitter) {
						value.off('change', onItemChange, this);
					}
				}, this);
			}
		}
	});

	rt.ActiveDictionary = ActiveDictionary;

})();

(function() {

	var EventEmitter = rt.EventEmitter;

	var arrayProto = Array.prototype;
	var push = arrayProto.push;
	var unshift = arrayProto.unshift;
	var concat = arrayProto.concat;
	var slice = arrayProto.slice;
	var splice = arrayProto.splice;
	var map = arrayProto.map;

	/**
	 * @private
	 *
	 * @param {Rift.ActiveArray} arr
	 * @param {Arguments} values
	 * @returns {Array}
	 */
	function addValues(arr, values) {
		var valueCounts = arr._valueCounts;
		var adoptItemChanges = arr._adoptItemChanges;
		var addedValues = [];

		for (var i = 0, l = values.length; i < l; i++) {
			var value = values[i];

			if (valueCounts.has(value)) {
				valueCounts.set(value, valueCounts.get(value) + 1);
			} else {
				valueCounts.set(value, 1);

				if (adoptItemChanges && value instanceof EventEmitter) {
					value.on('change', arr._onItemChange, arr);
				}

				addedValues.push(value);
			}
		}

		return addedValues;
	}

	/**
	 * @private
	 *
	 * @param {Rift.ActiveArray} arr
	 * @param {*} value
	 * @returns {Array}
	 */
	function removeValue(arr, value) {
		var valueCount = arr._valueCounts.get(value) - 1;

		if (valueCount) {
			arr._valueCounts.set(value, valueCount);
		} else {
			arr._valueCounts.delete(value);

			if (arr._adoptItemChanges && value instanceof EventEmitter) {
				value.off('change', arr._onItemChange, arr);
			}

			return [value];
		}

		return [];
	}

	/**
	 * @class Rift.ActiveArray
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Array|Rift.ActiveArray|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.adoptItemChanges=false]
	 */
	var ActiveArray = EventEmitter.extend('Rift.ActiveArray', /** @lends Rift.ActiveArray# */{
		_data: null,
		_valueCounts: null,

		_adoptItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			var thisData;
			var valueCounts = new Map();
			var adoptItemChanges = typeof opts == 'boolean' ? opts : !!opts && opts.adoptItemChanges;

			if (data) {
				thisData = (data instanceof ActiveArray ? data._data : data).slice(0);

				for (var i = thisData.length; i;) {
					if (--i in thisData) {
						var value = thisData[i];

						if (valueCounts.has(value)) {
							valueCounts.set(value, valueCounts.get(value) + 1);
						} else {
							valueCounts.set(value, 1);

							if (adoptItemChanges && value instanceof EventEmitter) {
								value.on('change', this._onItemChange, this);
							}
						}
					}
				}
			} else {
				thisData = [];
			}

			this._data = thisData;
			this._valueCounts = valueCounts;

			if (adoptItemChanges) {
				this._adoptItemChanges = adoptItemChanges;
			}
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_onItemChange: function(evt) {
			this._handleEvent(evt);
		},

		/**
		 * Получает значение индекса.
		 *
		 * @param {int} index
		 * @returns {*}
		 */
		get: function(index) {
			return this._data[index];
		},

		/**
		 * Устанавливает значение индекса.
		 *
		 * @param {int} index
		 * @param {*} value
		 * @returns {Rift.ActiveArray}
		 */
		set: function(index, value) {
			var data = this._data;
			var hasIndex = index in data;
			var oldValue = data[index];

			if (!hasIndex || !svz(oldValue, value)) {
				var valueCounts = this._valueCounts;
				var removedValues;
				var addedValues;

				if (hasIndex) {
					var oldValueCount = valueCounts.get(oldValue) - 1;

					if (oldValueCount) {
						valueCounts.set(oldValue, oldValueCount);
					} else {
						valueCounts.delete(oldValue);

						if (this._adoptItemChanges && oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onItemChange, this);
						}

						removedValues = [oldValue];
					}
				}

				if (valueCounts.has(value)) {
					valueCounts.set(value, valueCounts.get(value) + 1);
				} else {
					valueCounts.set(value, 1);

					if (this._adoptItemChanges && value instanceof EventEmitter) {
						value.on('change', this._onItemChange, this);
					}

					addedValues = [value];
				}

				data[index] = value;

				this.emit('change', {
					diff: {
						$removedValues: removedValues || [],
						$addedValues: addedValues || []
					}
				});
			}

			return this;
		},

		/**
		 * Удаляет значения индексов.
		 *
		 * @param {...int} indexes
		 * @returns {Rift.ActiveArray}
		 */
		delete: function() {
			var data = this._data;
			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValues = [];

			for (var i = 0, l = arguments.length; i < l; i++) {
				var index = arguments[i];

				if (index in data) {
					changed = true;

					var value = data[index];
					var valueCount = valueCounts.get(value) - 1;

					if (valueCount) {
						valueCounts.set(value, valueCount);
					} else {
						valueCounts.delete(value);

						if (adoptItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange, this);
						}

						removedValues.push(value);
					}

					delete data[index];
				}
			}

			if (changed) {
				this.emit('change', {
					diff: {
						$removedValues: removedValues,
						$addedValues: []
					}
				});
			}

			return this;
		},

		/**
		 * Длинна массива.
		 *
		 * @type {int}
		 * @writable
		 */
		get length() {
			return this._data.length;
		},
		set length(len) {
			var data = this._data;
			var oldLen = data.length;

			if (oldLen != len) {
				var changed = false;
				var removedValues = [];

				if (len < oldLen) {
					var valueCounts = this._valueCounts;
					var adoptItemChanges = this._adoptItemChanges;
					var i = len;

					do {
						if (i in data) {
							changed = true;

							var value = data[i];
							var valueCount = valueCounts.get(value) - 1;

							if (valueCount) {
								valueCounts.set(value, valueCount);
							} else {
								valueCounts.delete(value);

								if (adoptItemChanges && value instanceof EventEmitter) {
									value.off('change', this._onItemChange, this);
								}

								removedValues.push(value);
							}
						}
					} while (++i < oldLen);
				}

				data.length = len;

				if (changed) {
					this.emit('change', {
						diff: {
							$removedValues: removedValues,
							$addedValues: []
						}
					});
				}
			}
		},

		/**
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains: function(value) {
			return this._valueCounts.has(value);
		},

		/**
		 * @param {*} value
		 * @param {int} [fromIndex=0]
		 * @returns {int}
		 */
		indexOf: function(value, fromIndex) {
			return this._data.indexOf(value, fromIndex);
		},

		/**
		 * @param {*} value
		 * @param {int} [fromIndex=-1]
		 * @returns {int}
		 */
		lastIndexOf: function(value, fromIndex) {
			return this._data.lastIndexOf(value, fromIndex);
		},

		/**
		 * Добавляет один или более элементов в конец массива и возвращает новую длину массива.
		 *
		 * @param {...*} values - Элементы, добавляемые в конец массива.
		 * @returns {int}
		 */
		push: function() {
			if (!arguments.length) {
				return this._data.length;
			}

			push.apply(this._data, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: addValues(this, arguments)
				}
			});

			return this._data.length;
		},

		/**
		 * Удаляет первый элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		shift: function() {
			var data = this._data;

			if (!data.length) {
				return;
			}

			if (!this._valueCounts.size) {
				data.length--;
				return;
			}

			var hasFirst = '0' in data;
			var value;

			if (hasFirst) {
				value = data.shift();
			} else {
				data.shift();
			}

			this.emit('change', {
				diff: {
					$removedValues: hasFirst ? removeValue(this, value) : [],
					$addedValues: []
				}
			});

			return value;
		},

		/**
		 * Добавляет один или более элементов в начало массива и возвращает новую длину массива.
		 *
		 * @example
		 * var arr = [1, 2];
		 *
		 * arr.unshift(0); // 3
		 * concole.log(arr);
		 * // => [0, 1, 2]
		 *
		 * arr.unshift(-2, -1); // 5
		 * concole.log(arr);
		 * // => [-2, -1, 0, 1, 2]
		 *
		 * @param {...*} values - Элементы, добавляемые в начало массива.
		 * @returns {int}
		 */
		unshift: function() {
			if (!arguments.length) {
				return this._data.length;
			}

			unshift.apply(this._data, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: addValues(this, arguments)
				}
			});

			return this._data.length;
		},

		/**
		 * Удаляет последний элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		pop: function() {
			var data = this._data;

			if (!data.length) {
				return;
			}

			if (!(data.length - 1 in data)) {
				data.length--;
				return;
			}

			var value = data.pop();

			this.emit('change', {
				diff: {
					$removedValues: removeValue(this, value),
					$addedValues: []
				}
			});

			return value;
		},

		/**
		 * Объединяет все элементы массива в строку через разделитель.
		 *
		 * @param {string} [separator]
		 * @returns {string}
		 */
		join: function(separator) {
			return this._data.join(separator);
		},

		/**
		 * @param {...*} values - Массивы и/или значения, соединяемые в новый массив.
		 * @returns {Rift.ActiveArray}
		 */
		concat: function() {
			return new this.constructor(
				concat.apply(this._data, map.call(arguments, function(value) {
					return value instanceof ActiveArray ? value._data : value;
				}))
			);
		},

		/**
		 * Создаёт поверхностную копию части массива.
		 *
		 * @param {int} [startIndex=0]
		 * @param {int} [endIndex]
		 * @returns {Array}
		 */
		slice: function(startIndex, endIndex) {
			return this._data.slice(startIndex, endIndex);
		},

		/**
		 * Изменяет содержимое массива, добавляя новые и удаляя старые элементы.
		 *
		 * @param {int} startIndex
		 * @param {int} deleteCount
		 * @param {...*} [values]
		 * @returns {Array} - Удалённые элементы.
		 */
		splice: function(startIndex, deleteCount) {
			var data = this._data;
			var removedSlice = splice.apply(data, arguments);
			var addedSlice = slice.call(arguments, 2);
			var removedSliceLen = removedSlice.length;
			var addedSliceLen = addedSlice.length;

			if (!removedSliceLen && !addedSliceLen) {
				return removedSlice;
			}

			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValueSet = new Set();
			var addedValues = [];

			for (var i = 0, l = Math.max(removedSliceLen, addedSliceLen); i < l; i++) {
				var iInRemovedSlice = i in removedSlice;
				var iInAddedSlice = i in addedSlice;

				if (!iInRemovedSlice && !iInAddedSlice) {
					continue;
				}

				var removedValue = removedSlice[i];
				var addedValue = addedSlice[i];

				if (!iInRemovedSlice || !iInAddedSlice || !svz(removedValue, addedValue)) {
					changed = true;

					if (iInRemovedSlice) {
						var removedValueCount = valueCounts.get(removedValue) - 1;

						if (removedValueCount) {
							valueCounts.set(removedValue, removedValueCount);
						} else {
							valueCounts.delete(removedValue);

							if (adoptItemChanges && removedValue instanceof EventEmitter) {
								removedValue.off('change', this._onItemChange, this);
							}

							removedValueSet.add(removedValue);
						}
					}

					if (iInAddedSlice) {
						if (valueCounts.has(addedValue)) {
							valueCounts.set(addedValue, valueCounts.get(addedValue) + 1);
						} else {
							valueCounts.set(addedValue, 1);

							if (adoptItemChanges && addedValue instanceof EventEmitter) {
								addedValue.on('change', this._onItemChange, this);
							}

							if (!removedValueSet.delete(addedValue)) {
								addedValues.push(addedValue);
							}
						}
					}
				}
			}

			if (!changed && removedSliceLen > addedSliceLen) {
				for (var i = startIndex + addedSliceLen, l = data.length; i < l; i++) {
					if (i in data) {
						changed = true;
						break;
					}
				}
			}

			if (changed) {
				var removedValues = [];

				removedValueSet.forEach(function(value) {
					removedValues.push(value);
				});

				this.emit('change', {
					diff: {
						$removedValues: removedValues,
						$addedValues: addedValues
					}
				});
			}

			return removedSlice;
		},

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 */
		forEach: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {Array}
		 */
		map: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {Array}
		 */
		filter: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {boolean}
		 */
		every: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {boolean}
		 */
		some: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {*} [initialValue]
		 * @returns {*}
		 */
		reduce: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {*} [initialValue]
		 * @returns {*}
		 */
		reduceRight: null,

		/**
		 * Создает копию массива.
		 *
		 * @returns {Rift.ActiveArray}
		 */
		clone: function() {
			return new this.constructor(this, { adoptItemChanges: this._adoptItemChanges });
		},

		/**
		 * Преобразует в обычный массив.
		 *
		 * @returns {Array}
		 */
		toArray: function() {
			return this._data.slice(0);
		},

		/**
		 * Преобразует в строковое представление.
		 *
		 * @returns {string}
		 */
		toString: function() {
			return this._data.toString();
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			this._data.forEach(function(value, index) {
				data[index] = value;
			});

			if (this._adoptItemChanges) {
				opts.adoptItemChanges = true;
			}
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			for (var index in data) {
				this.set(index, data[index]);
			}
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			if (this._adoptItemChanges) {
				var onItemChange = this._onItemChange;

				this._valueCounts.forEach(function(value) {
					if (value instanceof EventEmitter) {
						value.off('change', onItemChange, this);
					}
				}, this);
			}
		}
	});

	['forEach', 'map', 'filter', 'every', 'some', 'reduce', 'reduceRight'].forEach(function(name) {
		this[name] = function() {
			return arrayProto[name].apply(this._data, arguments);
		};
	}, ActiveArray.prototype);

	rt.ActiveArray = ActiveArray;

})();

(function() {

	var nextTick = rt.process.nextTick;
	var Event = rt.Event;
	var EventEmitter = rt.EventEmitter;

	var STATE_CHANGES_ACCUMULATION = 0;
	var STATE_CHANGES_HANDLING = 1;
	var STATE_CHILDREN_RECALCULATION = 2;

	var state = STATE_CHANGES_ACCUMULATION;

	/**
	 * @type {Map<{ dataCell: Rift.DataCell, event: Rift.Event, cancellable: boolean }>}
	 * @private
	 */
	var changes = new Map();

	var changeCount = 0;

	/**
	 * @private
	 */
	var outdatedDataCells = Object.assign(Object.create(null), {
		first: null,
		last: null
	});

	var circularityDetectionCounter = new Map();

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @returns {boolean}
	 */
	function addOutdatedDataCell(dc) {
		var dcBundle = outdatedDataCells.last;
		var maxParentDepth = dc._maxParentDepth;

		if (dcBundle) {
			while (true) {
				if (maxParentDepth == dcBundle.maxParentDepth) {
					if (dcBundle.dataCells.has(dc)) {
						return false;
					}

					dcBundle.dataCells.add(dc);
					dcBundle.count++;

					return true;
				}

				if (maxParentDepth > dcBundle.maxParentDepth) {
					var next = dcBundle.next;

					dcBundle.next = (next || outdatedDataCells)[next ? 'prev' : 'last'] =
						outdatedDataCells[maxParentDepth] = {
							maxParentDepth: maxParentDepth,
							dataCells: new Set([dc]),
							count: 1,
							prev: dcBundle,
							next: next
						};

					return true;
				}

				if (!dcBundle.prev) {
					dcBundle.prev = outdatedDataCells.first = outdatedDataCells[maxParentDepth] = {
						maxParentDepth: maxParentDepth,
						dataCells: new Set([dc]),
						count: 1,
						prev: null,
						next: dcBundle
					};

					return true;
				}

				dcBundle = dcBundle.prev;
			}
		}

		outdatedDataCells.first = outdatedDataCells.last = outdatedDataCells[maxParentDepth] = {
			maxParentDepth: maxParentDepth,
			dataCells: new Set([dc]),
			count: 1,
			prev: null,
			next: null
		};

		return true;
	}

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @returns {boolean}
	 */
	function removeOutdatedDataCell(dc) {
		var dcBundle = outdatedDataCells[dc._maxParentDepth];

		if (dcBundle && dcBundle.dataCells.has(dc)) {
			if (--dcBundle.count) {
				delete dcBundle.dataCells.delete(dc);
			} else {
				var prev = dcBundle.prev;
				var next = dcBundle.next;

				if (prev) {
					prev.next = next;
				} else {
					outdatedDataCells.first = next;
				}

				if (next) {
					next.prev = prev;
				} else {
					outdatedDataCells.last = prev;
				}

				delete outdatedDataCells[dc._maxParentDepth];
			}

			return true;
		}

		return false;
	}

	/**
	 * @private
	 */
	function handleChanges() {
		state = STATE_CHANGES_HANDLING;

		do {
			for (
				var changesIterator = changes.values(), changesIteratorStep;
				!(changesIteratorStep = changesIterator.next()).done;
			) {
				var change = changesIteratorStep.value;
				var dc = change.dataCell;

				for (
					var childrenIterator = dc._children.values(), childrenIteratorStep;
					!(childrenIteratorStep = childrenIterator.next()).done;
				) {
					addOutdatedDataCell(childrenIteratorStep.value);
				}

				changes.delete(dc);
				changeCount--;

				dc._fixedValue = dc._value;
				dc._changed = true;

				dc._handleEvent(change.event);

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			}
		} while (changeCount);
	}

	/**
	 * @private
	 */
	function releaseChanges() {
		if (state == STATE_CHANGES_ACCUMULATION) {
			if (changeCount) {
				handleChanges();

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			} else {
				return;
			}
		} else if (state == STATE_CHANGES_HANDLING) {
			if (changeCount) {
				handleChanges();

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			}
		} else {
			handleChanges();

			if (state != STATE_CHANGES_HANDLING) {
				return;
			}
		}

		state = STATE_CHILDREN_RECALCULATION;

		for (var dcBundle; dcBundle = outdatedDataCells.first;) {
			var dcs = dcBundle.dataCells;

			for (var iterator = dcs.values(), step; !(step = iterator.next()).done;) {
				var dc = step.value;

				dc._recalc();

				if (state != STATE_CHILDREN_RECALCULATION) {
					return;
				}

				// кажется, что правильней поставить этот if-else над dc._recalc() , но подумай получше ;)
				if (--dcBundle.count) {
					delete dcs.delete(dc);
				} else {
					var prev = dcBundle.prev;
					var next = dcBundle.next;

					if (prev) {
						prev.next = next;
					} else {
						outdatedDataCells.first = next;
					}

					if (next) {
						next.prev = prev;
					} else {
						outdatedDataCells.last = prev;
					}

					delete outdatedDataCells[dc._maxParentDepth];
				}

				if (changeCount) {
					handleChanges();

					if (state != STATE_CHANGES_HANDLING) {
						return;
					}

					state = STATE_CHILDREN_RECALCULATION;

					break;
				}
			}
		}

		state = STATE_CHANGES_ACCUMULATION;
		circularityDetectionCounter.clear();
	}

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @param {Object|undefined} diff
	 * @param {Rift.Event|undefined} [evt]
	 * @param {boolean} [cancellable=true]
	 */
	function addChange(dc, diff, evt, cancellable) {
		if (!evt) {
			evt = new Event('change');
			evt.target = dc;
			evt.timestamp = Date.now();

			if (diff) {
				evt.detail = { diff: diff };
			}
		}

		if (changeCount) {
			if (changes.has(dc)) {
				var change = changes.get(dc);

				(evt.detail || (evt.detail = {})).prevEvent = change.event;
				change.event = evt;

				if (cancellable === false) {
					change.cancellable = false;
				}

				return;
			}
		} else {
			if (state == STATE_CHANGES_ACCUMULATION) {
				nextTick(releaseChanges);
			}
		}

		changes.set(dc, {
			dataCell: dc,
			event: evt,
			cancellable: cancellable !== false
		});

		changeCount++;
	}

	var detectedParents = [];

	/**
	 * @class Rift.DataCell
	 * @extends {Rift.EventEmitter}
	 *
	 * @example
	 * var a = new DataCell(1);
	 * var b = new DataCell(2);
	 *
	 * var c = new DateCell(function() {
	 *     return a.value + b.value;
	 * }, {
	 *     onchange: function() {
	 *         console.log('c.value: ' + c.value);
	 *     }
	 * });
	 *
	 * console.log(c.value);
	 * // => 3
	 *
	 * a.value = 5;
	 * b.value = 10;
	 * // => 'c.value: 15'
	 *
	 * @param {*|Function} [value] - Значение или функция для его вычисления.
	 * @param {Object} [opts] - Опции.
	 * @param {Function} [opts.get] - Будет использоваться при получении значения.
	 * @param {Function} [opts.set] - Будет использоваться при установке значения.
	 * @param {Object} [opts.owner]
	 * @param {boolean} [opts.computable]
	 * @param {Function} [opts.onchange] - Инлайновый обработчик изменения значения.
	 * @param {Function} [opts.onerror] - Инлайновый обработчик ошибки.
	 */
	var DataCell = EventEmitter.extend(/** @lends Rift.DataCell# */{
		/**
		 * @type {*}
		 */
		initialValue: undefined,

		_value: undefined,
		_fixedValue: undefined,

		_formula: null,

		_get: null,
		_set: null,

		/**
		 * @type {?Object}
		 */
		owner: null,

		/**
		 * Родительские ячейки.
		 *
		 * @type {Set<Rift.DataCell>}
		 * @protected
		 */
		_parents: null,

		/**
		 * Дочерние ячейки.
		 *
		 * @type {Set<Rift.DataCell>}
		 * @protected
		 */
		_children: null,

		/**
		 * @type {int}
		 * @protected
		 */
		_maxParentDepth: 0,

		/**
		 * @type {?Rift.Event}
		 * @protected
		 */
		_lastErrorEvent: null,

		/**
		 * Является ли ячейка вычисляемой.
		 *
		 * @type {boolean}
		 */
		computable: false,

		_changed: false,

		/**
		 * @type {boolean}
		 */
		get changed() {
			if (changeCount) {
				releaseChanges();
			}

			return this._changed;
		},

		/**
		 * @type {boolean}
		 */
		disposed: false,

		_onChange: null,

		/**
		 * Инлайновый обработчик изменения значения.
		 *
		 * @type {?Function}
		 * @writable
		 */
		get onchange() {
			return this._onChange;
		},
		set onchange(onChange) {
			if (changeCount) {
				releaseChanges();
			}

			this._onChange = onChange;
		},

		_onError: null,

		/**
		 * Инлайновый обработчик ошибки.
		 *
		 * @type {?Function}
		 * @writable
		 */
		get onerror() {
			return this._onError;
		},
		set onerror(onError) {
			if (changeCount) {
				releaseChanges();
			}

			this._onError = onError;
		},

		constructor: function(value, opts) {
			EventEmitter.call(this);

			if (!opts) {
				opts = {};
			}

			if (opts.get) { this._get = opts.get; }
			if (opts.set) { this._set = opts.set; }

			if (opts.owner) { this.owner = opts.owner; }

			if (opts.onchange) {
				this._onChange = this.owner ? opts.onchange.bind(this.owner) : opts.onchange;
			}
			if (opts.onerror) {
				this._onError = this.owner ? opts.onerror.bind(this.owner) : opts.onerror;
			}

			this._children = new Set();

			if (
				typeof value == 'function' &&
					(opts.computable !== undefined ? opts.computable : value.constructor == Function)
			) {
				this.computable = true;
			}

			if (this.computable) {
				this._formula = value;

				detectedParents.unshift(new Set());

				try {
					this._value = this._fixedValue = this._formula.call(this.owner || this);
				} catch (err) {
					this._handleError(err);
				}

				this._parents = detectedParents.shift();

				var maxParentDepth = 1;

				for (var iterator = this._parents.values(), step; !(step = iterator.next()).done;) {
					var parent = step.value;

					parent._children.add(this);

					if (maxParentDepth <= parent._maxParentDepth) {
						maxParentDepth = parent._maxParentDepth + 1;
					}
				}

				this._maxParentDepth = maxParentDepth;
			} else {
				this.initialValue = this._value = this._fixedValue = value;

				if (value instanceof EventEmitter) {
					value.on('change', this._onValueChange, this);
				}
			}
		},

		/**
		 * @type {*}
		 * @writable
		 */
		get value() {
			if (detectedParents.length) {
				detectedParents[0].add(this);
			}

			if (changeCount || state == STATE_CHANGES_HANDLING) {
				releaseChanges();
			}

			if (this._get) {
				return this.computable ? this._get.call(this.owner || this, this._value) : this._get(this._value);
			}

			return this._value;
		},
		set value(value) {
			if (this.computable) {
				if (!this._set) {
					throw new TypeError('Cannot write to read-only dataСell');
				}

				this._set.call(this.owner || this, value);
			} else {
				var oldValue = this._value;

				if (this._set) {
					var change = {};

					if (oldValue instanceof EventEmitter) {
						oldValue.off('change', this._onValueChange, this);
					}

					this._set(value, change);

					value = this._value;

					if (value instanceof EventEmitter) {
						value.on('change', this._onValueChange, this);
					}

					if (!svz(oldValue, value)) {
						change.type = 'update';
						change.oldValue = oldValue;
						change.value = value;

						addChange(this, { value: change });
					} else {
						if (!isEmpty(change)) {
							addChange(this, { value: change }, undefined, value !== this._fixedValue);
						}
					}
				} else {
					if (!svz(oldValue, value)) {
						this._value = value;

						if (svz(value, this._fixedValue) && changes.get(this).cancellable) {
							changes.delete(this);
							changeCount--;

							return;
						}

						if (oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onValueChange, this);
						}
						if (value instanceof EventEmitter) {
							value.on('change', this._onValueChange, this);
						}

						addChange(this, {
							value: {
								type: 'update',
								oldValue: oldValue,
								value: value
							}
						});
					}
				}
			}
		},

		/**
		 * Обработчик внутреннего изменения значения.
		 *
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 * @param {Object} [evt.detail.diff]
		 */
		_onValueChange: function(evt) {
			addChange(this, undefined, evt, this._value !== this._fixedValue);
		},

		/**
		 * @protected
		 */
		_recalc: function() {
			if (circularityDetectionCounter.has(this)) {
				if (circularityDetectionCounter.get(this) == 10) {
					this._handleError(new RangeError('Circular dependency detected'));
					return;
				}

				circularityDetectionCounter.set(this, circularityDetectionCounter.get(this) + 1);
			} else {
				circularityDetectionCounter.set(this, 1);
			}

			var oldValue = this._value;
			var oldParents = this._parents;

			var err;

			detectedParents.unshift(new Set());

			try {
				var value = this._formula.call(this.owner || this);
			} catch (error) {
				err = error;
			}

			if (state != STATE_CHILDREN_RECALCULATION) {
				detectedParents.shift();
				return;
			}

			var parents = this._parents = detectedParents.shift();
			var maxParentDepth = 1;

			for (var iterator = oldParents.values(), step; !(step = iterator.next()).done;) {
				if (!parents.has(step.value)) {
					step.value._children.delete(this);
				}
			}

			for (var iterator = parents.values(), step; !(step = iterator.next()).done;) {
				var parent = step.value;

				if (!oldParents.has(parent)) {
					parent._children.add(this);
				}

				if (maxParentDepth <= parent._maxParentDepth) {
					maxParentDepth = parent._maxParentDepth + 1;
				}
			}

			if (this._maxParentDepth != maxParentDepth) {
				if (this._maxParentDepth < maxParentDepth) {
					this._maxParentDepth = maxParentDepth;
					addOutdatedDataCell(this);

					return;
				} else {
					this._maxParentDepth = maxParentDepth;
				}
			}

			if (err) {
				this._handleError(err);
			} else if (!svz(oldValue, value)) {
				this._value = value;

				addChange(this, {
					value: {
						type: 'update',
						oldValue: oldValue,
						value: value
					}
				});
			}
		},

		/**
		 * @protected
		 *
		 * @param {*} err
		 */
		_handleError: function(err) {
			this._logError(err);

			var evt = this.emit('error', { error: err });
			this._handleErrorEvent(evt);
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_handleErrorEvent: function(evt) {
			if (this._lastErrorEvent !== evt) {
				this._lastErrorEvent = evt;

				if (evt.target != this) {
					this._handleEvent(evt);
				}

				for (var iterator = this._children.values(), step; !(step = iterator.next()).done;) {
					if (evt.isPropagationStopped) {
						break;
					}

					step.value._handleErrorEvent(evt);
				}
			}
		},

		on: function() {
			if (changeCount) {
				releaseChanges();
			}

			DataCell.$super.on.apply(this, arguments);
		},

		off: function() {
			if (changeCount) {
				releaseChanges();
			}

			DataCell.$super.off.apply(this, arguments);
		},

		/**
		 * Уничтожает ячейку данных освобождая занятые ей ресурсы.
		 */
		dispose: function() {
			if (this.disposed) {
				return;
			}

			if (changes.has(this)) {
				changes.delete(this);
				changeCount--;
			}

			removeOutdatedDataCell(this);

			if (this.computable) {
				for (var iterator = this._parents.values(), step; !(step = iterator.next()).done;) {
					step.value._children.delete(this);
				}
			} else {
				if (this._value instanceof EventEmitter) {
					this._value.off('change', this._onValueChange, this);
				}
			}

			for (var iterator = this._children.values(), step; !(step = iterator.next()).done;) {
				step.value.dispose();
			}

			this.disposed = true;
		}
	});

	rt.DataCell = DataCell;

})();

(function() {

	var cloneObject = rt.object.clone;
	var DataCell = rt.DataCell;

	/**
	 * Заменяет активные свойства на геттеры, которые при срабатывании будут подставлять в инстанс исходные свойства,
	 * но уже связанные с инстансом.
	 *
	 * @memberOf Rift.ActiveProperty
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function autoBind(obj) {
		Object.keys(obj).forEach(function(name) {
			var descr = Object.getOwnPropertyDescriptor(obj, name);
			var value = descr.value;

			if (typeof value == 'function' && value.constructor == ActiveProperty) {
				Object.defineProperty(obj, name, {
					configurable: true,
					enumerable: descr.enumerable,

					get: function() {
						descr.value = Object.defineProperty(value.bind(this), 'constructor', {
							configurable: true,
							writable: true,
							value: ActiveProperty
						});

						Object.defineProperty(this, name, descr);

						return this[name];
					}
				});
			}
		});

		return obj;
	}

	/**
	 * @memberOf Rift.ActiveProperty
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function disposeDataCells(obj) {
		if (obj._dataCells) {
			for (var iterator = obj._dataCells.values(), step; !(step = iterator.next()).done;) {
				step.value.dispose();
			}

			obj._dataCells = null;
		}

		return obj;
	}

	/**
	 * @private
	 */
	function applyProperty(prop, value, opts, args) {
		var dc = (this._dataCells || (this._dataCells = new Map())).get(prop);

		if (!dc) {
			if (value !== null && typeof value == 'object') {
				if (typeof value.clone == 'function') {
					value = value.clone();
				} else if (Array.isArray(value)) {
					value = value.slice(0);
				} else {
					var copy = new value.constructor(value);
					value = copy != value ? copy : cloneObject(value);
				}
			}

			opts = Object.create(opts);
			opts.owner = this;

			dc = new DataCell(value, opts);
			this._dataCells.set(prop, dc);
		}

		switch (args.length) {
			case 0: {
				return dc.value;
			}
			case 1: {
				dc.value = args[0];
				break;
			}
			default: {
				var methodName = args[0];
				args[0] = dc;
				return ActiveProperty.prototype[methodName].apply(this, args);
			}
		}

		return this;
	}

	/**
	 * @class Rift.ActiveProperty
	 * @extends {Function}
	 *
	 * @example
	 * function User() {}
	 *
	 * User.prototype = {
	 *     firstName: new ActiveProperty(''),
	 *     lastName: new ActiveProperty(''),
	 *
	 *     fullName: new ActiveProperty(function() {
	 *         return (this.firstName() + ' ' + this.lastName()).trim();
	 *     }, {
	 *         set: function(fullName) {
	 *             fullName = fullName.split(' ');
	 *
	 *             this.firstName(fullName[0]);
	 *             this.lastName(fullName[1]);
	 *         },
	 *
	 *         onchange: function(evt) {
	 *             console.log('evt.detail.diff: ' + JSON.stringify(evt.detail.diff));
	 *         }
	 *     }),
	 *
	 *     name: new ActiveProperty(function() {
	 *         return this.firstName() || this.lastName();
	 *     }, {
	 *         set: function(firstName) {
	 *             this.firstName(firstName);
	 *         }
	 *     })
	 * };
	 *
	 * var user = new User();
	 *
	 * console.log(user.fullName());
	 * // => ''
	 *
	 * console.log(user.name());
	 * // => ''
	 *
	 * user.firstName('Vasya');
	 * user.lastName('Pupkin');
	 * // => evt.detail.diff: {"value":{"oldValue":"","value":"Vasya Pupkin"}}
	 *
	 * console.log(user.fullName());
	 * // => 'Vasya Pupkin'
	 *
	 * console.log(user.name());
	 * // => 'Vasya'
	 *
	 * @param {*|Function} [value] - Значение или функция для его вычисления.
	 * @param {Object} [opts] - Опции.
	 * @param {Function} [opts.get] - Будет использоваться при получении значения.
	 * @param {Function} [opts.set] - Будет использоваться при установке значения.
	 * @param {Function} [opts.onchange] - Инлайновый обработчик изменения значения.
	 * @param {Function} [opts.onerror] - Инлайновый обработчик ошибки.
	 * @returns {Function}
	 */
	function ActiveProperty(value, opts) {
		if (!opts) {
			opts = {};
		}

		function prop() {
			return applyProperty.call(this, prop, value, opts, arguments);
		}

		Object.defineProperty(prop, 'constructor', {
			configurable: true,
			writable: true,
			value: ActiveProperty
		});

		return prop;
	}

	ActiveProperty.autoBind = autoBind;
	ActiveProperty.disposeDataCells = disposeDataCells;

	Object.assign(ActiveProperty.prototype, /** @lends Rift.ActiveProperty# */{
		/**
		 * @param {Rift.DataCell} dc
		 * @returns {Rift.DataCell}
		 */
		dataCell: function(dc) {
			return dc;
		},

		/**
		 * @param {Rift.DataCell} dc
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Object}
		 */
		subscribe: function(dc, listener, context) {
			dc.on('change', listener, context || this);
			return this;
		},

		/**
		 * @param {Rift.DataCell} dc
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Object}
		 */
		unsubscribe: function(dc, listener, context) {
			dc.off('change', listener, context || this);
			return this;
		}
	});

	rt.ActiveProperty = ActiveProperty;

	/**
	 * @memberOf Rift
	 *
	 * @param {Function} value
	 * @param {Object} [opts]
	 */
	rt.observable = function(value, opts) {
		if (typeof value == 'function' && value.constructor == Function) {
			if (!opts) {
				opts = {};
			}

			opts.computable = false;
		}

		return new ActiveProperty(value, opts);
	};

	/**
	 * @memberOf Rift
	 *
	 * @param {Function} formula
	 * @param {Object} [opts]
	 */
	rt.computable = function(formula, opts) {
		if (formula.constructor != Function) {
			if (!opts) {
				opts = {};
			}

			opts.computable = true;
		}

		return new ActiveProperty(formula, opts);
	};

})();

(function() {

	var getUID = rt.object.getUID;
	var getStamp = rt.value.getStamp;
	var EventEmitter = rt.EventEmitter;
	var ActiveProperty = rt.ActiveProperty;
	var autoBind = rt.ActiveProperty.autoBind;
	var disposeDataCells = rt.ActiveProperty.disposeDataCells;

	/**
	 * @private
	 *
	 * @param {Function} method
	 * @returns {Function}
	 */
	function wrapListeningMethod(method) {
		return function _(target, type, listener, context, meta) {
			if (Array.isArray(target) || (isClient && target instanceof $)) {
				for (var i = target.length; i;) {
					_.call(this, target[--i], type, listener, context, meta);
				}
			} else {
				if (typeof target == 'function' && target.constructor == ActiveProperty) {
					target = target('dataCell', 0);
				}

				if (typeof type == 'object') {
					meta = context;
					context = listener;

					var types = type;

					for (type in types) {
						_.call(this, target, type, types[type], context, meta);
					}
				} else if (Array.isArray(listener)) {
					var listeners = listener;

					for (var i = 0, l = listeners.length; i < l; i++) {
						_.call(this, target, type, listeners[i], context, meta);
					}
				} else if (typeof listener == 'object') {
					var props = listener;

					for (var name in props) {
						_.call(this, target[name]('dataCell', 0), type, props[name], context, meta);
					}
				} else {
					method.call(this, target, type, listener, context, meta);
				}
			}

			return this;
		};
	}

	/**
	 * @private
	 *
	 * @param {{ target: Object, type: string, listener: Function, context: Object }} listening
	 */
	function removeListener(listening) {
		if (listening.target instanceof EventEmitter) {
			listening.target.off(listening.type, listening.listener, listening.context);
		} else {
			listening.target.removeEventListener(listening.type, listening.listener, false);
		}
	}

	/**
	 * @class Rift.Disposable
	 * @extends {Rift.EventEmitter}
	 */
	var Disposable = EventEmitter.extend(/** @lends Rift.Disposable# */{
		_listening: null,
		_callbacks: null,
		_timeouts: null,
		_dataCells: null,

		constructor: function() {
			EventEmitter.call(this);

			if (!this.constructor._isActivePropertiesBound) {
				var cl = this.constructor;

				do {
					autoBind(cl.prototype);
					cl._isActivePropertiesBound = true;

					cl = cl.$super.constructor;
				} while (cl != Disposable && !cl._isActivePropertiesBound);
			}
		},

		/**
		 * Начинает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context]
		 * @param {*} [meta]
		 * @returns {Rift.Disposable}
		 */
		listen: wrapListeningMethod(function(target, type, listener, context, meta) {
			this._listen(target, type, listener, context, meta);
		}),

		/**
		 * @protected
		 */
		_listen: function(target, type, listener, context, meta) {
			if (!context) {
				context = this;
			}

			var listening = this._listening || (this._listening = new Map());
			var id = getUID(target) + '-' + type + '-' +
				getUID(listener.hasOwnProperty(KEY_INNER) ? listener[KEY_INNER] : listener) + '-' +
				getUID(context) + '-' + (meta !== undefined ? getStamp(meta) : '');

			if (listening.has(id)) {
				return;
			}

			if (target instanceof EventEmitter) {
				target.on(type, listener, context);
			} else if (typeof target.addEventListener == 'function') {
				if (target != context) {
					listener = listener.bind(context);
				}

				target.addEventListener(type, listener, false);
			} else {
				throw new TypeError('Unable to add a listener');
			}

			listening.set(id, {
				target: target,
				type: type,
				listener: listener,
				context: context,
				meta: meta
			});
		},

		/**
		 * Останавливает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context]
		 * @param {*} [meta]
		 * @returns {Rift.Disposable}
		 */
		stopListening: wrapListeningMethod(function(target, type, listener, context, meta) {
			this._stopListening(target, type, listener, context, meta);
		}),

		/**
		 * @protected
		 */
		_stopListening: function(target, type, listener, context, meta) {
			var listening = this._listening;

			if (!listening) {
				return;
			}

			if (!context) {
				context = this;
			}

			var id = getUID(target) + '-' + type + '-' +
				getUID(listener.hasOwnProperty(KEY_INNER) ? listener[KEY_INNER] : listener) + '-' +
				getUID(context) + '-' + (meta !== undefined ? getStamp(meta) : '');

			if (listening.has(id)) {
				removeListener(listening.get(id));
				listening.delete(id);
			}
		},

		/**
		 * Останавливает прослушивание всех событий.
		 *
		 * @returns {Rift.Disposable}
		 */
		stopAllListening: function() {
			var listening = this._listening;

			if (listening) {
				for (var id in listening) {
					removeListener(listening[id]);
				}

				this._listening = null;
			}

			return this;
		},

		/**
		 * Регистрирует колбэк.
		 * @typesign (cb: Function): Function;
		 */
		registerCallback: function(cb) {
			var callbacks = this._callbacks || (this._callbacks = new Map());

			if (callbacks.has(cb)) {
				callbacks.get(cb).canceled = true;
			}

			var disposable = this;

			function outer() {
				if (outer.hasOwnProperty('canceled') && outer.canceled) {
					return;
				}

				callbacks.delete(cb);

				return cb.apply(disposable, arguments);
			}

			callbacks.set(cb, outer);

			return outer;
		},

		/**
		 * Отменяет регистрацию колбэка.
		 * @typesign (cb: Function): Rift.Disposable;
		 */
		unregisterCallback: function(cb) {
			var callbacks = this._callbacks;

			if (callbacks && callbacks.has(cb)) {
				callbacks.get(cb).canceled = true;
				callbacks.delete(cb);
			}

			return this;
		},

		/**
		 * Отменяет все колбэки.
		 * @typesign (): Rift.Disposable;
		 */
		unregisterAllCallbacks: function() {
			var callbacks = this._callbacks;

			if (callbacks) {
				callbacks.forEach(function(outer) {
					outer.canceled = true;
				});

				this._callbacks = null;
			}

			return this;
		},

		/**
		 * Устанавливает таймер.
		 *
		 * @param {Function} fn
		 * @param {int} delay
		 * @returns {Rift.Disposable}
		 */
		setTimeout: function(fn, delay) {
			var timeouts = this._timeouts || (this._timeouts = new Map());

			if (timeouts.has(fn)) {
				clearTimeout(timeouts.get(fn));
			}

			var disposable = this;

			timeouts.set(fn, setTimeout(function() {
				timeouts.delete(fn);
				fn.call(disposable);
			}, delay));

			return this;
		},

		/**
		 * Отменяет установленный таймер.
		 *
		 * @param {Function} fn - Колбэк отменяемого таймера.
		 * @returns {Rift.Disposable}
		 */
		clearTimeout: function(fn) {
			var timeouts = this._timeouts;

			if (timeouts && timeouts.has(fn)) {
				clearTimeout(timeouts.get(fn));
				timeouts.delete(fn);
			}

			return this;
		},

		/**
		 * Отменяет все установленные таймеры.
		 *
		 * @returns {Rift.Disposable}
		 */
		clearAllTimeouts: function() {
			var timeouts = this._timeouts;

			if (timeouts) {
				timeouts.forEach(function(fn, id) {
					clearTimeout(id);
				});

				this._timeouts = null;
			}

			return this;
		},

		/**
		 * @param {Object} data
		 */
		collectDumpObject: function(data) {
			Object.keys(this).forEach(function(name) {
				var value = Object.getOwnPropertyDescriptor(this, name).value;

				if (typeof value == 'function' && value.constructor == ActiveProperty) {
					var dc = value('dataCell', 0);

					if (!dc.computable) {
						var dcValue = dc.value;

						if (dcValue === Object(dcValue) ? dc.changed : dc.initialValue !== dcValue) {
							data[name] = dcValue;
						}
					}
				}
			}, this);
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			for (var name in data) {
				this[name](data[name]);
			}
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			this
				.stopAllListening()
				.unregisterAllCallbacks()
				.clearAllTimeouts();

			disposeDataCells(this);
		}
	});

	rt.Disposable = Disposable;

})();

(function() {

	var ActiveProperty = rt.ActiveProperty;
	var Disposable = rt.Disposable;

	/**
	 * @class Rift.BaseModel
	 * @extends {Rift.Disposable}
	 * @abstract
	 *
	 * @param {?(Object|undefined)} [data] - Начальные данные.
	 * @param {Object} [opts]
	 */
	var BaseModel = Disposable.extend(/** @lends Rift.BaseModel# */{
		_options: null,

		constructor: function(data, opts) {
			Disposable.call(this);

			this._options = opts || {};

			if (data) {
				this.setData(data);
			}
		},

		/**
		 * @param {Object} data
		 */
		setData: function(data) {
			for (var name in data) {
				if (typeof this[name] == 'function' && this[name].constructor == ActiveProperty) {
					this[name](data[name]);
				}
			}
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			BaseModel.$super.collectDumpObject.call(this, data);
			Object.assign(opts, this._options);
		}
	});

	rt.BaseModel = BaseModel;

})();

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
	rt.html = {
		escape: escapeHTML
	};

})();

(function() {

	var nextUID = rt.uid.next;
	var ActiveDictionary = rt.ActiveDictionary;
	var ActiveArray = rt.ActiveArray;

	/**
	 * @typesign (viewClass: Function|string, viewParams?: Object): string;
	 */
	function include(viewClass, viewParams) {
		if (typeof viewClass == 'string') {
			viewClass = rt.BaseView.getViewClassOrError(viewClass);
		}

		if (viewParams) {
			viewParams.parent = this;
			viewParams.block = null;
		} else {
			viewParams = {
				parent: this,
				block: null
			};
		}

		var childRenderings = this._childRenderings;
		var index = childRenderings.count++;
		var mark = childRenderings.marks[index] = '{{_' + nextUID() + '}}';

		new viewClass(viewParams).render(function(html) {
			childRenderings.results[index] = html;

			if (childRenderings.count == ++childRenderings.readyCount && childRenderings.onallready) {
				childRenderings.onallready();
			}
		});

		return mark;
	}

	/**
	 * @param {Object|Array|Rift.ActiveDictionary|Rift.ActiveArray} [target]
	 * @param {Function} cb
	 * @param {Object} context
	 */
	function each(target, cb, context) {
		if (!target) {
			return;
		}

		if (target instanceof ActiveDictionary) {
			target = target.toObject();
		} else if (target instanceof ActiveArray) {
			target = target.toArray();
		}

		if (Array.isArray(target)) {
			for (var i = 0, l = target.length; i < l; i++) {
				if (i in target) {
					cb.call(context, target[i], i);
				}
			}
		} else {
			for (var name in target) {
				if (hasOwn.call(target, name)) {
					cb.call(context, target[name], name);
				}
			}
		}
	}

	/**
	 * @namespace Rift.template
	 */
	rt.template = {
		defaults: {
			include: include,
			each: each
		}
	};

})();

(function() {

	var createNamespace = rt.namespace.create;
	var forEachMatch = rt.regex.forEach;
	var DataCell = rt.DataCell;

	/**
	 * @namespace Rift.domBinding.helpers
	 */
	var helpers = {
		html: function(el, value) {
			el.innerHTML = value;
		},

		text: function(el, value, targetNode) {
			switch (targetNode) {
				case 'first': {
					var node = el.firstChild;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.insertBefore(document.createTextNode(value), node);
					}

					break;
				}
				case 'last': {
					var node = el.lastChild;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.appendChild(document.createTextNode(value));
					}

					break;
				}
				case 'prev': {
					var node = el.previousSibling;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.parentNode.insertBefore(document.createTextNode(value), el);
					}

					break;
				}
				case 'next': {
					var node = el.nextSibling;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.parentNode.insertBefore(document.createTextNode(value), node);
					}

					break;
				}
				default: {
					if (el.childNodes.length == 1 && el.firstChild.nodeType == 3) {
						el.firstChild.nodeValue = value;
					} else {
						while (el.lastChild) {
							el.removeChild(el.lastChild);
						}

						el.appendChild(document.createTextNode(value));
					}

					break;
				}
			}
		},

		prop: function(el, value, id) {
			id = id.split('.');
			var name = id.pop();
			createNamespace(id, el)[name] = value;
		},

		attr: function(el, value, name) {
			value = String(value);

			if (el.getAttribute(name) !== value) {
				el.setAttribute(name, value);
			}
		},

		value: function(el, value) {
			value = String(value);

			if (el.value != value) {
				el.value = value;
			}
		},

		checked: function(el, value) {
			value = !!value;

			if (el.checked != value) {
				el.checked = value;
			}
		},

		css: function(el, value, name) {
			value = String(value);

			if (!name) {
				name = 'cssText';
			}

			if (el.style[name] != value) {
				el.style[name] = value;
			}
		},

		show: function(el, value) {
			el.style.display = value ? '' : 'none';
		}
	};

	var reName = '[$_a-zA-Z][$\\w]*';
	var reBindingExpr = RegExp(
		'(' + reName + ')(?:\\(([^)]*)\\))?:\\s*(\\S[\\s\\S]*?)(?=\\s*(?:,\\s*' + reName +
			'(?:\\([^)]*\\))?:\\s*\\S|$))',
		'g'
	);

	/**
	 * Привязывает элемент к активным свойствам по атрибуту `rt-bind`.
	 *
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 * @param {Object} context
	 * @param {Object} [opts]
	 * @param {boolean} [opts.applyValues=true]
	 * @returns {Array<Rift.DataCell>}
	 */
	function bindElement(el, context, opts) {
		if (el.hasOwnProperty(KEY_DATA_CELLS) && el[KEY_DATA_CELLS]) {
			return el[KEY_DATA_CELLS];
		}

		var dcs = el[KEY_DATA_CELLS] = [];

		if (el.hasAttribute('rt-bind')) {
			var applyValues = !opts || opts.applyValues !== false;

			forEachMatch(reBindingExpr, el.getAttribute('rt-bind'), function(expr, helper, meta, js) {
				var dc = new DataCell(Function('return ' + js + ';').bind(context), {
					onchange: function() {
						helpers[helper](el, this.value, meta);
					}
				});

				dcs.push(dc);

				if (applyValues) {
					helpers[helper](el, dc.value, meta);
				}
			});
		}

		return dcs;
	}

	/**
	 * Отвязывает элемент от привязанных к нему активных свойств.
	 *
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 */
	function unbindElement(el) {
		if (el.hasOwnProperty(KEY_DATA_CELLS)) {
			var dcs = el[KEY_DATA_CELLS];

			if (dcs) {
				for (var i = dcs.length; i;) {
					dcs[--i].dispose();
				}

				el[KEY_DATA_CELLS] = null;
			}
		}
	}

	/**
	 * Привязывает элементы dom-дерева к активным свойствам по атрибуту `rt-bind`.
	 *
	 * @function bind
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 * @param {Object} context
	 * @param {Object} [opts]
	 * @param {boolean} [opts.bindRootElement=true]
	 * @param {boolean} [opts.applyValues=true]
	 * @param {boolean} [opts.removeAttr=false]
	 * @returns {Array<Rift.DataCell>}
	 */
	function bindDOM(el, context, opts) {
		if (!opts) {
			opts = {};
		}

		var removeAttr = opts.removeAttr === true;
		var elementBindingOptions = {
			applyValues: opts.applyValues !== false
		};
		var dcs = [];

		if (opts.bindRootElement !== false && el.hasAttribute('rt-bind')) {
			dcs.push.apply(dcs, bindElement(el, context, elementBindingOptions));

			if (removeAttr) {
				el.removeAttribute('rt-bind');
			}
		}

		var els = el.querySelectorAll('[rt-bind]');

		for (var i = 0, l = els.length; i < l; i++) {
			dcs.push.apply(dcs, bindElement(els[i], context, elementBindingOptions));

			if (removeAttr) {
				el.removeAttribute('rt-bind');
			}
		}

		return dcs;
	}

	/**
	 * @namespace Rift.domBinding
	 */
	rt.domBinding = {
		helpers: helpers,
		bindElement: bindElement,
		unbindElement: unbindElement,
		bind: bindDOM
	};

})();

(function() {

	var getUID = rt.object.getUID;
	var execNamespace = rt.namespace.exec;
	var getStamp = rt.value.getStamp;
	var stringify = rt.value.stringify;
	var extend = rt.Class.extend;
	var Disposable = rt.Disposable;
	var escapeHTML = rt.html.escape;
	var bindDOM = rt.domBinding.bind;

	var selfClosingTags = new Set([
		'area',
		'base',
		'basefont',
		'br',
		'col',
		'command',
		'embed',
		'frame',
		'hr',
		'img',
		'input',
		'isindex',
		'keygen',
		'link',
		'meta',
		'param',
		'source',
		'track',
		'wbr',

		// svg tags
		'circle',
		'ellipse',
		'line',
		'path',
		'polygone',
		'polyline',
		'rect',
		'stop',
		'use'
	]);

	var viewClasses = Object.create(null);

	function getViewClassOrError(name) {
		if (!(name in viewClasses)) {
			throw new TypeError('ViewClass "' + name + '" is not defined');
		}

		return viewClasses[name];
	}

	function registerViewClass(name, viewClass) {
		if (name in viewClasses) {
			throw new TypeError('ViewClass "' + name + '" is already registered');
		}

		Object.defineProperty(viewClass, '__viewClass', {
			value: name
		});

		viewClasses[name] = viewClass;

		return viewClass;
	}

	var reNameClass = /^(.+?):(.+)$/;
	var reViewData = /([^,]*),([^,]*),(.*)/;

	function emptyFn() {}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {Function} cb
	 */
	function receiveData(view, cb) {
		if (view._receiveData != emptyFn) {
			if (view._beforeDataReceiving != emptyFn) {
				try {
					view._beforeDataReceiving();
				} catch (err) {
					view._logError(err);
				}
			}

			try {
				if (view._receiveData.length) {
					view._receiveData(function(err) {
						if (err != null) {
							view.dataReceivingError = err;
							view._logError(err);
						}

						afterDataReceiving(view);
						cb.call(view);
					});
				} else {
					view._receiveData()
						.catch(function(err) {
							view.dataReceivingError = err;
							view._logError(err);
						})
						.then(function() {
							afterDataReceiving(view);
							cb.call(view);
						});
				}
			} catch (err) {
				view.dataReceivingError = err;
				view._logError(err);
				afterDataReceiving(view);
				cb.call(view);
			}
		} else {
			cb.call(view);
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 */
	function afterDataReceiving(view) {
		if (view._afterDataReceiving != emptyFn) {
			try {
				view._afterDataReceiving();
			} catch (err) {
				view._logError(err);
			}
		}
	}

	/**
	 * @private
	 *
	 * @param {Array<string>} cls
	 * @param {Object} mods
	 * @returns {Array<string>}
	 */
	function pushMods(cls, mods) {
		for (var name in mods) {
			var value = mods[name];

			if (value != null && value !== false) {
				cls.push('_' + name + (value === true ? '' : '_' + value));
			}
		}

		return cls;
	}

	/**
	 * @private
	 *
	 * @param {HTMLElement} el
	 * @param {Object} attrs
	 */
	function setAttributes(el, attrs) {
		for (var name in attrs) {
			el.setAttribute(name, attrs[name]);
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {string} blockName
	 * @param {string} name
	 * @returns {boolean}
	 */
	function initSimilarDescendantElements(view, blockName, name) {
		var children = view.children;
		var result = false;

		for (var i = children.length; i;) {
			var child = children[--i];

			if (child.blockName == blockName) {
				child.$(name);
				result = true;
			} else {
				if (initSimilarDescendantElements(child, blockName, name)) {
					result = true;
				}
			}
		}

		return result;
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {HTMLElement} el
	 */
	function removeElement(view, el) {
		if (!el.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) || !el[KEY_VIEW_ELEMENT_NAME] || el[KEY_VIEW] != view) {
			return;
		}

		var els = view.elements[el[KEY_VIEW_ELEMENT_NAME]];
		els.splice(els.indexOf(el), 1);

		el[KEY_VIEW] = null;
		el[KEY_VIEW_ELEMENT_NAME] = undefined;

		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}

	/**
	 * @class Rift.BaseView
	 * @extends {Rift.Disposable}
	 *
	 * @param {Object} [params]
	 * @param {Rift.BaseApp} [params.app]
	 * @param {Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty|string} [params.model]
	 * @param {string} [params.name]
	 * @param {string} [params.tagName]
	 * @param {Object<boolean|number|string>} [params.mods]
	 * @param {Object<string>} [params.attrs]
	 * @param {Rift.BaseView} [params.parent]
	 * @param {?(HTMLElement|$)} [params.block]
	 * @param {boolean} [params.onlyClient=false] - Рендерить только на клиенте.
	 */
	var BaseView = Disposable.extend(/** @lends Rift.BaseView# */{
		static: {
			viewClasses: viewClasses,

			getViewClassOrError: getViewClassOrError,
			registerViewClass: registerViewClass,

			extend: function(name, declaration) {
				return registerViewClass(name, extend.call(this, undefined, declaration));
			}
		},

		_params: null,

		_id: undefined,

		/**
		 * @type {?Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?(Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty)}
		 */
		model: null,

		/**
		 * @type {string|undefined}
		 */
		name: undefined,

		/**
		 * @type {string}
		 */
		tagName: 'div',

		/**
		 * @type {string}
		 */
		blockName: undefined,

		/**
		 * @type {Object}
		 */
		mods: null,

		/**
		 * @type {Object<string>}
		 */
		attrs: null,

		_parent: null,

		/**
		 * Родительская вьюшка.
		 *
		 * @type {?Rift.BaseView}
		 * @writable
		 */
		get parent() {
			return this._parent;
		},
		set parent(parent) {
			if (parent) {
				parent.registerChild(this);
			} else if (this._parent) {
				this._parent.unregisterChild(this);
			}
		},

		/**
		 * Дочерние вьюшки.
		 *
		 * @type {Array<Rift.BaseView>}
		 */
		children: null,

		/**
		 * Корневой элемент вьюшки.
		 *
		 * @type {?$}
		 */
		block: null,

		/**
		 * Элементы вьюшки.
		 *
		 * @type {Object<$>}
		 */
		elements: null,

		/**
		 * @type {*}
		 */
		dataReceivingError: null,

		_currentlyRendering: false,
		_childRenderings: null,

		/**
		 * @type {Function}
		 */
		template: function() {
			return '';
		},

		/**
		 * @type {boolean}
		 */
		onlyClient: false,

		isClientInited: false,

		constructor: function(params) {
			Disposable.call(this);

			if (!params) {
				params = {};
			}

			this._params = params;

			this.mods = Object.create(this.mods);
			this.attrs = Object.create(this.attrs);

			this.children = [];
			this.elements = {};

			if (!this.blockName) {
				var viewClass = this.constructor;

				while (viewClass.$super.constructor != BaseView) {
					viewClass = viewClass.$super.constructor;
				}

				viewClass.prototype.blockName = viewClass.__viewClass;
			}

			var block;

			if (isServer) {
				if (params.block) {
					throw new TypeError('Parameter "block" can\'t be used on the server side');
				}

				block = null;

				if (params.block === null) {
					delete params.block;
				}
			} else {
				if (params.block !== undefined) {
					block = params.block;
					delete params.block;
				}
			}

			if (block === null) {
				this._id = getUID(this, isServer ? 's' : 'c');
				this._parseParams();
			} else {
				var data;
				var rendered = false;

				if (block) {
					if (block instanceof $) {
						block = block[0];
					}

					if (block.hasOwnProperty(KEY_VIEW) && block[KEY_VIEW]) {
						throw new TypeError(
							'Element is already used as ' + (
								block.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) && block[KEY_VIEW_ELEMENT_NAME] ?
									'an element' : 'a block'
							) + ' of view'
						);
					}

					if (block.hasAttribute('rt-d')) {
						data = block.getAttribute('rt-d').match(reViewData);

						if (data[2]) {
							rendered = true;
						}

						if (data[3]) {
							Object.assign(params, Function('return {' + data[3] + '};')());
						}
					}
				}

				this._id = rendered ? data[2] : getUID(this, 'c');
				this._parseParams();

				if (!block) {
					block = document.createElement(this.tagName);
				}

				this.block = $(block);
				block[KEY_VIEW] = this;

				if (rendered) {
					var view = this;

					this.block
						.find('[rt-p=' + this._id + ']')
						.each(function() {
							new viewClasses[this.getAttribute('rt-d').match(reViewData)[1]]({
								parent: view,
								block: this
							});
						});
				} else {
					setAttributes(block, this.attrs);
					block.className = (pushMods([this.blockName], this.mods).join(' ') + ' ' + block.className).trim();

					this._currentlyRendering = true;

					receiveData(this, function() {
						this._renderInner(function(html) {
							this._currentlyRendering = true;

							block.innerHTML = html;

							var blocks = block.querySelectorAll('[rt-p]');
							var blockDict = {};

							for (var i = blocks.length; i;) {
								blockDict[blocks[--i].getAttribute('rt-d').match(reViewData)[2]] = blocks[i];
							}

							(function _(view) {
								var children = view.children;

								for (var i = children.length; i;) {
									var child = children[--i];
									var childBlock = blockDict[child._id];

									child.block = $(childBlock);
									childBlock[KEY_VIEW] = child;

									_(child);
								}
							})(this);
						});
					});
				}
			}
		},

		/**
		 * @protected
		 */
		_parseParams: function() {
			var params = this._params;

			if (params.name) {
				this.name = params.name;
			}

			if (params.tagName) {
				this.tagName = params.tagName;
				delete params.tagName;
			}

			if (params.blockName) {
				this.blockName = params.blockName;
			}

			if (params.mods) {
				Object.assign(this.mods, params.mods);
				delete params.mods;
			}

			if (params.attrs) {
				Object.assign(this.attrs, params.attrs);
				delete params.attrs;
			}

			if (params.parent) {
				this.parent = params.parent;
				delete params.parent;
			}

			if (params.app) {
				this.app = params.app;
				delete params.app;
			} else {
				var parent = this._parent;

				if (parent && parent.app) {
					this.app = parent.app;
				}
			}

			var model = params.model;

			if (model) {
				if (typeof model == 'string') {
					this.model = execNamespace(model, this._parent || this);
				} else {
					this.model = model;
					delete params.model;
				}
			} else {
				var parent = this._parent;

				if (parent && parent.model) {
					this.model = parent.model;
				} else {
					var app = this.app;

					if (app && app.model) {
						this.model = app.model;
					}
				}
			}

			if (params.onlyClient !== undefined) {
				this.onlyClient = params.onlyClient;
			}
		},

		/**
		 * @protected
		 *
		 * @param {Function} [cb]
		 * @returns {Promise|undefined}
		 */
		_receiveData: emptyFn,

		/**
		 * @protected
		 */
		_beforeDataReceiving: emptyFn,

		/**
		 * @protected
		 */
		_afterDataReceiving: emptyFn,

		/**
		 * @protected
		 */
		_beforeRendering: emptyFn,

		/**
		 * @param {Function} cb
		 */
		render: function(cb) {
			if (this._currentlyRendering) {
				throw new TypeError('Cannot run the rendering when it is in process');
			}

			if (this._beforeRendering != emptyFn) {
				try {
					this._beforeRendering();
				} catch (err) {
					this._logError(err);
				}
			}

			if (isServer && this.onlyClient) {
				cb(this._renderOpenTag() + (selfClosingTags.has(this.tagName) ? '' : '</' + this.tagName + '>'));
				return;
			}

			this._currentlyRendering = true;

			receiveData(this, function() {
				if (selfClosingTags.has(this.tagName)) {
					this._currentlyRendering = false;
					cb(this._renderOpenTag());
				} else {
					this._renderInner(function(html) {
						this._currentlyRendering = false;
						cb(this._renderOpenTag() + html + '</' + this.tagName + '>');
					});
				}
			});
		},

		/**
		 * @protected
		 *
		 * @param {boolean} billet
		 * @returns {string}
		 */
		_renderOpenTag: function(billet) {
			var attrs = this.attrs;
			var attribs = [
				'class="' + (pushMods([this.blockName], this.mods).join(' ') + ' ' + (attrs.class || '')).trim() + '"'
			];

			for (var name in attrs) {
				if (name != 'class') {
					attribs.push(name + '="' + attrs[name] + '"');
				}
			}

			return '<' + this.tagName +
				' ' + attribs.join(' ') +
				' rt-d="' + [
					this.constructor.__viewClass,
					isServer && this.onlyClient ? '' : this._id,
					isEmpty(this._params) ? '' : escapeHTML(stringify(this._params).slice(1, -1))
				] + '"' +
				(this._parent ? ' rt-p="' + this._parent._id + '"' : '') +
				'>';
		},

		/**
		 * @param {Function} cb
		 */
		_renderInner: function(cb) {
			var childRenderings = this._childRenderings = {
				count: 0,
				readyCount: 0,

				marks: [],
				results: [],

				onallready: null
			};
			var html;

			try {
				html = this.template.call(this);
			} catch (err) {
				this._childRenderings = null;
				this._logError(err);
				cb.call(this, '');
				return;
			}

			var view = this;

			childRenderings.onallready = function() {
				view._childRenderings = null;

				var marks = childRenderings.marks;
				var results = childRenderings.results;

				for (var i = marks.length; i;) {
					html = html.replace(marks[--i], function() {
						return results[i];
					});
				}

				cb.call(view, html);
			};

			if (childRenderings.count == childRenderings.readyCount) {
				childRenderings.onallready();
			}
		},

		/**
		 * @typesign (): Rift.BaseView;
		 */
		initClient: function() {
			if (this.isClientInited) {
				throw new TypeError('Client is already initialized');
			}

			this.isClientInited = true;

			var children = this.children.slice(0);

			for (var i = 0, l = children.length; i < l; i++) {
				children[i].initClient();
			}

			try {
				var dcs = this._dataCells || (this._dataCells = new Map());
				var domBindingDCs = bindDOM(this.block[0], this, {
					applyValues: false,
					removeAttr: true
				});

				for (var i = domBindingDCs.length; i;) {
					dcs.set(domBindingDCs[--i], domBindingDCs[i]);
				}

				if (this._initClient != emptyFn) {
					this._initClient();
				}
				if (this._bindEvents != emptyFn) {
					this._bindEvents();
				}
			} catch (err) {
				this._logError(err);
			}

			return this;
		},

		/**
		 * @protected
		 */
		_initClient: emptyFn,

		/**
		 * @protected
		 */
		_bindEvents: emptyFn,

		/**
		 * Регистрирует дочернюю вьюшку.
		 *
		 * @param {Rift.BaseView} child
		 * @returns {Rift.BaseView}
		 */
		registerChild: function(child) {
			if (child._parent) {
				if (child._parent == this) {
					return this;
				}

				throw new TypeError('View is already used as a child of view');
			}

			child._parent = this;

			var children = this.children;
			var childName = child.name;

			children.push(child);

			if (childName) {
				(hasOwn.call(children, childName) ? children[childName] : (children[childName] = [])).push(child);
			}

			return this;
		},

		/**
		 * Отменяет регистрацию дочерней вьюшки.
		 *
		 * @param {Rift.BaseView} child
		 * @returns {Rift.BaseView}
		 */
		unregisterChild: function(child) {
			if (child._parent !== this) {
				return this;
			}

			child._parent = null;

			var children = this.children;
			var childName = child.name;

			children.splice(children.indexOf(child), 1);

			if (childName) {
				var namedChildren = children[childName];
				namedChildren.splice(namedChildren.indexOf(child), 1);
			}

			return this;
		},

		/**
		 * Создаёт и регистрирует элемент(ы) и/или возвращает именованную $-коллекцию.
		 *
		 * @example
		 * this.$('btnSend'); // получение элемента(ов) по имени
		 *
		 * @example
		 * // создаёт новый элемент `<li class="Module_element _selected">Hi!</li>`,
		 * // добавляет его в коллекцию `element` и возвращает коллекцию с новым элементом
		 * this.$('item', '<li class="_selected">Hi!</li>');
		 *
		 * @example
		 * // то же, что и в предыдущем примере, но описание элемента в виде объекта
		 * this.$('item', { tagName: 'li', mods: { selected: true }, html: 'Hi!' });
		 *
		 * @param {string} name
		 * @param {...(HTMLElement|string|{ tagName: string, mods: Object, attrs: Object<string>, html: string })} [el]
		 * @returns {$}
		 */
		$: function(name) {
			var els;

			if (hasOwn.call(this.elements, name)) {
				els = this.elements[name];
			} else {
				els = $('.' + this.blockName + '_' + name, this.block);

				if (initSimilarDescendantElements(this, this.blockName, name)) {
					els = els.filter(function() {
						return !this.hasOwnProperty(KEY_VIEW) || !this[KEY_VIEW];
					});
				}

				this.elements[name] = els;
			}

			var argCount = arguments.length;

			if (argCount > 1) {
				var i = 1;

				do {
					var el = arguments[i];
					var isString = typeof el == 'string';

					if (isString || el instanceof HTMLElement) {
						if (isString) {
							var outer = document.createElement('div');
							outer.innerHTML = el;

							el = outer.childNodes.length == 1 && outer.firstChild.nodeType == 1 ?
								outer.firstChild :
								outer;
						} else {
							if (el.hasOwnProperty(KEY_VIEW) && el[KEY_VIEW]) {
								if (!el.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) || !el[KEY_VIEW_ELEMENT_NAME]) {
									throw new TypeError('Element is already used as a block of view');
								}

								if (el[KEY_VIEW] != this || el[KEY_VIEW_ELEMENT_NAME] != name) {
									throw new TypeError('Element is already used as an element of view');
								}

								continue;
							}
						}

						el.className = (this.blockName + '_' + name + ' ' + el.className).trim();
					} else {
						var elSettings = el;

						el = document.createElement(elSettings.tagName || 'div');

						if (elSettings.attrs) {
							setAttributes(el, elSettings.attrs);
						}

						var cls = [this.blockName + '_' + name];

						if (elSettings.mods) {
							pushMods(cls, elSettings.mods);
						}

						el.className = (cls.join(' ') + ' ' + el.className).trim();

						if (elSettings.html) {
							el.innerHTML = elSettings.html;
						}
					}

					el[KEY_VIEW] = this;
					el[KEY_VIEW_ELEMENT_NAME] = name;

					els.push(el);
				} while (++i < argCount);
			}

			return els;
		},

		/**
		 * Удаляет элемент(ы) из dom-дерева и отменяет его(их) регистрацию.
		 *
		 * @param {...($|HTMLElement|string)} els
		 * @returns {Rift.BaseView}
		 */
		$rm: function() {
			for (var i = arguments.length; i;) {
				var el = arguments[--i];

				if (typeof el == 'string') {
					if (!hasOwn.call(this.elements, el)) {
						continue;
					}

					el = this.elements[el];
				}

				if (el instanceof $) {
					var view = this;

					el.each(function() {
						removeElement(view, this);
					});
				} else {
					removeElement(this, el);
				}
			}

			return this;
		},

		/**
		 * @param {string} children
		 * @param {string} method
		 * @param {...*} [args]
		 * @returns {Array}
		 */
		broadcast: function(children, method) {
			var name;
			var cl;

			if (reNameClass.test(children)) {
				name = RegExp.$1;
				cl = RegExp.$2;
			} else {
				name = children;
				cl = '*';
			}

			var descendants = [];

			(function _(children) {
				if (name != '*') {
					if (!hasOwn.call(children, name)) {
						return;
					}

					children = children[name];
				}

				for (var i = 0, l = children.length; i < l; i++) {
					descendants.push(children[i]);
					_(children[i].children);
				}
			})(this.children);

			if (cl != '*') {
				cl = getViewClassOrError(cl);

				descendants = descendants.filter(function(descendant) {
					return descendant instanceof cl;
				});
			}

			var args = slice.call(arguments, 2);

			return descendants.map(function(descendant) {
				return descendant[method].apply(descendant, args);
			});
		},

		_listen: function(target, evt, listener, context, meta) {
			var type;
			var cl;

			if (target instanceof BaseView) {
				if (reNameClass.test(evt)) {
					type = RegExp.$1;
					cl = RegExp.$2;

					if (cl != '*') {
						cl = getViewClassOrError(cl);

						var inner = listener;
						var outer = function(evt) {
							if (evt.target instanceof cl) {
								return inner.call(this, evt);
							}
						};
						outer[KEY_INNER] = inner;

						listener = outer;
					}
				} else {
					type = evt;

					var view = this;
					var inner = listener;
					var outer = function(evt) {
						if (evt.target == view) {
							return inner.call(this, evt);
						}
					};
					outer[KEY_INNER] = inner;

					listener = outer;
				}
			} else {
				type = evt;
			}

			BaseView.$super._listen.call(
				this,
				target,
				type,
				listener,
				context,
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getStamp(meta)
			);
		},

		_stopListening: function(target, evt, listener, context, meta) {
			var type;
			var cl;

			if (target instanceof BaseView) {
				if (reNameClass.test(evt)) {
					type = RegExp.$1;
					cl = RegExp.$2;

					if (cl != '*') {
						cl = getViewClassOrError(cl);
					}
				} else {
					type = evt;
				}
			} else {
				type = evt;
			}

			BaseView.$super._stopListening.call(
				this,
				target,
				type,
				listener,
				context,
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getStamp(meta)
			);
		},

		/**
		 * Уничтожает вьюшку освобождая занятые ей ресурсы.
		 */
		dispose: function() {
			var block;

			if (isClient) {
				block = this.block[0];

				if (block.parentNode) {
					block.parentNode.removeChild(block);
				}
			}

			var children = this.children;

			for (var i = children.length; i;) {
				children[--i].dispose();
			}

			if (this._parent) {
				var parentChildren = this._parent.children;

				parentChildren.splice(parentChildren.indexOf(this), 1);

				if (this.name) {
					var namedParentChildren = parentChildren[this.name];
					namedParentChildren.splice(namedParentChildren.indexOf(this), 1);
				}
			}

			if (isClient) {
				block[KEY_VIEW] = null;
			}

			BaseView.$super.dispose.call(this);
		}
	});

	rt.BaseView = BaseView;

})();

(function() {

	var serialize = rt.dump.serialize;
	var deserialize = rt.dump.deserialize;
	var ActiveProperty = rt.ActiveProperty;
	var Disposable = rt.Disposable;

	/**
	 * @class Rift.ViewState
	 * @extends {Rift.Disposable}
	 * @typesign new (props: Object): Rift.ViewState;
	 */
	var ViewState = Disposable.extend('Rift.ViewState', /** @lends Rift.ViewState# */{
		/**
		 * @type {Array<string>}
		 */
		propertyList: null,

		constructor: function(props) {
			Disposable.call(this);

			this.propertyList = Object.keys(props);

			for (var name in props) {
				var prop = (typeof props[name] == 'function' ? props[name] : new ActiveProperty(props[name]))
					.bind(this);

				Object.defineProperty(prop, 'constructor', {
					configurable: true,
					writable: true,
					value: ActiveProperty
				});

				this[name] = prop;
			}
		},

		/**
		 * @typesign (): Object<string>;
		 */
		serializeData: function() {
			var propList = this.propertyList;
			var data = {};

			for (var i = propList.length; i;) {
				var dc = this[propList[--i]]('dataCell', 0);

				if (!dc.computable) {
					var value = dc.value;

					if (value === Object(value) ? dc.changed : dc.initialValue !== value) {
						data[propList[i]] = serialize({ v: value });
					}
				}
			}

			return data;
		},

		/**
		 * @typesign (data: Object<string>): Rift.ViewState;
		 */
		updateFromSerializedData: function(data) {
			var deserialized = {};

			for (var name in data) {
				deserialized[name] = deserialize(data[name]).v;
			}

			this.update(deserialized);

			return this;
		},

		/**
		 * @typesign (data: Object): Rift.ViewState;
		 */
		update: function(data) {
			var propList = this.propertyList;
			var oldData = {};

			for (var i = propList.length; i;) {
				oldData[propList[--i]] = this[propList[i]]();
			}

			for (var i = propList.length; i;) {
				var name = propList[--i];

				if (oldData[name] === this[name]()) {
					this[name](hasOwn.call(data, name) ? data[name] : this[name]('dataCell', 0).initialValue);
				}
			}

			return this;
		}
	});

	rt.ViewState = ViewState;

})();

(function() {

	var escapeRegExp = rt.regex.escape;
	var nextTick = rt.process.nextTick;
	var Disposable = rt.Disposable;

	var reNotLocal = /^(?:\w+:)?\/\//;
	var reSlashes = /[\/\\]+/g;
	var reInsert = /\{([^}]+)\}/g;
	var reOption = /\((?:\?(\S+)\s+)?([^)]+)\)/g;

	/**
	 * @private
	 *
	 * @param {string} str
	 * @returns {number|string}
	 */
	function tryStringAsNumber(str) {
		if (str != '') {
			if (str == 'NaN') {
				return NaN;
			}

			var num = Number(str);

			if (num == num) {
				return num;
			}
		}

		return str;
	}

	/**
	 * Кодирует путь. Символы те же, что и у encodeURIComponent, кроме слеша `/`.
	 * В отличии от encodeURI и encodeURIComponent не трогает уже закодированное:
	 *     encodeURIComponent(' %20'); // '%20%2520'
	 *     encodePath(' %20'); // '%20%20'
	 *
	 * @example
	 * encodeURIComponent(' %20/%2F'); // '%20%2520%2F%252F'
	 * encodePath(' %20/%2F'); // '%20%20/%2F'
	 *
	 * @private
	 *
	 * @param {string} path
	 * @returns {string}
	 */
	function encodePath(path) {
		path = path.split('/');

		for (var i = path.length; i;) {
			path[--i] = encodeURIComponent(decodeURIComponent(path[i]));
		}

		return path.join('/');
	}

	/**
	 * @private
	 *
	 * @param {string} path
	 * @returns {string}
	 */
	function slashifyPath(path) {
		if (path[0] != '/') {
			path = '/' + path;
		}
		if (path[path.length - 1] != '/') {
			path += '/';
		}

		return path;
	}

	/**
	 * @typedef {{
	 *     rePath: RegExp,
	 *     properties: Array<{ type: int, name: string }>,
	 *     requiredProperties: Array<string>,
	 *     pathMap: Array<{ requiredProperties: Array<string>, pathPart: string|undefined, prop: string|undefined }>,
	 *     state: string,
	 *     callback: Function
	 * }} Router~Route
	 */

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {string} path
	 * @returns {?{ route: Router~Route, state: Object }}
	 */
	function tryPath(router, path) {
		var routes = router.routes;

		for (var i = 0, l = routes.length; i < l; i++) {
			var route = routes[i];
			var match = path.match(route.rePath);

			if (match) {
				return {
					route: route,

					state: route.properties.reduce(function(state, prop, index) {
						state[prop.name] = prop.type == 1 ?
							!!match[index + 1] :
							tryStringAsNumber(decodeURIComponent(match[index + 1]));

						return state;
					}, {})
				};
			}
		}

		return null;
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {?Router~Route} [preferredRoute]
	 * @returns {?{ route: Router~Route, path: string }}
	 */
	function tryViewState(router, preferredRoute) {
		var viewState = router.app.viewState;
		var routes = router.routes;
		var resultRoute = null;

		for (var i = 0, l = routes.length; i < l; i++) {
			var route = routes[i];
			var requiredProps = route.requiredProperties;
			var j = requiredProps.length;

			while (j--) {
				var value = viewState[requiredProps[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				if (requiredProps.length) {
					resultRoute = route;
					break;
				} else if (!resultRoute || route === preferredRoute) {
					resultRoute = route;
				}
			}
		}

		return resultRoute && {
			route: resultRoute,
			path: buildPath(router, resultRoute)
		};
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {Router~Route} route
	 * @returns {string}
	 */
	function buildPath(router, route) {
		var viewState = router.app.viewState;
		var pathMap = route.pathMap;
		var path = [];

		for (var i = 0, l = pathMap.length; i < l; i++) {
			var pathMapItem = pathMap[i];
			var requiredProps = pathMapItem.requiredProperties;
			var j = requiredProps.length;

			while (j--) {
				var value = viewState[requiredProps[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				path.push(pathMapItem.pathPart !== undefined ? pathMapItem.pathPart : viewState[pathMapItem.prop]());
			}
		}

		return slashifyPath(path.join(''));
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {Router~Route} route
	 * @param {string} path
	 * @param {Object} viewStateData
	 * @param {int} [mode=0]
	 */
	function setState(router, route, path, viewStateData, mode) {
		router.currentRoute = route;
		router.currentPath = path;

		if (isClient) {
			if (mode) {
				history[mode == 1 ? 'replaceState' : 'pushState']({
					'_rt-state': {
						routeIndex: router.routes.indexOf(route),
						path: path,
						viewStateData: viewStateData
					}
				}, null, path);
			} else {
				var state = history.state || {};

				state['_rt-state'] = {
					routeIndex: router.routes.indexOf(route),
					path: path,
					viewStateData: viewStateData
				};

				history.replaceState(state, null, path);
			}
		}

		router.currentState(route.state);

		if (route.callback) {
			route.callback.call(router.app, path);
		}
	}

	/**
	 * @class Rift.Router
	 * @extends {Object}
	 *
	 * @param {Rift.BaseApp} app
	 * @param {Array<{ path: string, callback: Function= }|string>} [routes]
	 */
	var Router = Disposable.extend(/** @lends Rift.Router# */{
		/**
		 * Ссылка на приложение.
		 *
		 * @type {Rift.App}
		 */
		app: null,

		/**
		 * Ссылка на корневой элемент вьюшки.
		 *
		 * @type {?HTMLElement}
		 */
		viewBlock: null,

		/**
		 * @type {Array<Router~Route>}
		 * @protected
		 */
		routes: null,

		/**
		 * @type {?Router~Route}
		 */
		currentRoute: null,

		/**
		 * @type {string|undefined}
		 */
		currentPath: undefined,

		/**
		 * @type {string|undefined}
		 */
		currentState: rt.observable(),

		/**
		 * @type {boolean}
		 */
		started: false,

		_isViewStateChangeHandlingRequired: false,

		constructor: function(app, routes) {
			Disposable.call(this);

			this.app = app;
			this.routes = [];

			if (routes) {
				this.addRoutes(routes);
			}
		},

		/**
		 * @param {Array<{ path: string, callback: Function }|string>} routes
		 * @returns {Rift.Router}
		 */
		addRoutes: function(routes) {
			routes.forEach(function(route) {
				if (typeof route == 'string') {
					route = { path: route };
				}

				this.addRoute(route.path, route.state, route.callback);
			}, this);

			return this;
		},

		/**
		 * @param {string} path
		 * @param {string|undefined} [state]
		 * @param {Function|undefined} [callback]
		 * @returns {Rift.Router}
		 */
		addRoute: function(path, state, callback) {
			if (this.started) {
				throw new TypeError('Router is already started');
			}

			path = path.split(reOption);

			var rePath = [];
			var props = [];
			var requiredProps = [];
			var pathMap = [];

			for (var i = 0, l = path.length; i < l;) {
				if (i % 3) {
					rePath.push('(');

					var pathMapItemRequiredProps = [];

					if (path[i]) {
						pathMapItemRequiredProps.push(path[i]);

						props.push({
							type: 1,
							name: path[i]
						});
					}

					var pathPart = path[i + 1].split(reInsert);

					for (var j = 0, m = pathPart.length; j < m; j++) {
						if (j % 2) {
							var prop = pathPart[j];

							pathMapItemRequiredProps.push(prop);

							rePath.push('([^\\/]+)');

							props.push({
								type: 2,
								name: prop
							});

							pathMap.push({
								requiredProperties: pathMapItemRequiredProps,
								pathPart: undefined,
								prop: prop
							});
						} else {
							if (pathPart[j]) {
								var encodedPathPart = encodePath(pathPart[j]);

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

								pathMap.push({
									requiredProperties: pathMapItemRequiredProps,
									pathPart: encodedPathPart.split('*').join(''),
									prop: undefined
								});
							}
						}
					}

					rePath.push(')?');

					i += 2;
				} else {
					if (path[i]) {
						var pathPart = path[i].split(reInsert);

						for (var j = 0, m = pathPart.length; j < m; j++) {
							if (j % 2) {
								var prop = pathPart[j];

								rePath.push('([^\\/]+)');

								props.push({
									type: 0,
									name: prop
								});

								requiredProps.push(prop);

								pathMap.push({
									requiredProperties: [prop],
									pathPart: undefined,
									prop: prop
								});
							} else {
								if (pathPart[j]) {
									var encodedPathPart = encodePath(pathPart[j]);

									rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

									pathMap.push({
										requiredProperties: [],
										pathPart: encodedPathPart.split('*').join(''),
										prop: undefined
									});
								}
							}
						}
					}

					i++;
				}
			}

			this.routes.push({
				rePath: RegExp('^\\/?' + rePath.join('') + '\\/?$'),
				properties: props,
				requiredProperties: requiredProps,
				pathMap: pathMap,
				state: state,
				callback: callback
			});

			return this;
		},

		/**
		 * @returns {Rift.Router}
		 */
		start: function() {
			if (this.started) {
				return this;
			}

			this.started = true;

			if (isClient) {
				this.viewBlock = this.app.view.block[0];
			}

			this._bindEvents();

			if (isServer) {
				var match = tryViewState(this, this.currentPath == '/' ? null : this.currentRoute);

				if (match) {
					setState(this, match.route, match.path, this.app.viewState.serializeData());
				}
			}

			return this;
		},

		/**
		 * @protected
		 */
		_bindEvents: function() {
			if (isClient) {
				this
					.listen(window, 'popstate', this._onWindowPopState)
					.listen(this.viewBlock, 'click', this._onViewBlockClick);
			}

			var viewState = this.app.viewState;
			var onViewStatePropertyChange = this._onViewStatePropertyChange;
			var propList = viewState.propertyList;

			for (var i = propList.length; i;) {
				this.listen(viewState[propList[--i]], 'change', onViewStatePropertyChange);
			}
		},

		/**
		 * @protected
		 */
		_onWindowPopState: function() {
			var state = history.state && history.state['_rt-state'];

			if (state) {
				var route = this.currentRoute = this.routes[state.routeIndex];
				var path = this.currentPath = state.path;

				this.currentState(route.state);

				this.app.viewState.updateFromSerializedData(state.viewStateData);

				if (route.callback) {
					route.callback.call(this.app, path);
				}
			} else {
				this.app.viewState.update({});

				var match = tryViewState(this);

				if (match) {
					setState(this, match.route, match.path, {}, 1);
				} else {
					this.currentRoute = null;
					this.currentPath = undefined;
					this.currentState(undefined);
				}
			}
		},

		/**
		 * Обработчик клика по корневому элементу вьюшки.
		 *
		 * @protected
		 *
		 * @param {MouseEvent} evt
		 */
		_onViewBlockClick: function(evt) {
			var viewBlock = this.viewBlock;
			var el = evt.target;

			while (el.tagName != 'A') {
				if (el == viewBlock) {
					return;
				}

				el = el.parentNode;

				if (!el) {
					return;
				}
			}

			var href = el.getAttribute('href');

			if (!reNotLocal.test(href) && this.route(href, true)) {
				evt.preventDefault();
			}
		},

		/**
		 * @protected
		 */
		_onViewStatePropertyChange: function() {
			if (this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = true;

			nextTick(this.registerCallback(this._onViewStateChange));
		},

		/**
		 * Обработчик изменения состояния представления.
		 *
		 * @protected
		 */
		_onViewStateChange: function() {
			if (!this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = false;

			var match = tryViewState(this, this.currentRoute);

			if (!match) {
				return;
			}

			var path = match.path;

			if (path === this.currentPath) {
				if (isClient) {
					var state = history.state || {};

					if (!state['_rt-state']) {
						state['_rt-state'] = {
							routeIndex: this.routes.indexOf(this.currentRoute),
							path: path
						};
					}

					state['_rt-state'].viewStateData = this.app.viewState.serializeData();

					history.replaceState(state, null, path);
				}
			} else {
				setState(this, match.route, path, this.app.viewState.serializeData(), 2);
			}
		},

		/**
		 * Редиректит по указанному пути.
		 * Если нет подходящего маршрута - возвращает false, редиректа не происходит.
		 *
		 * @param {string} path
		 * @param {boolean} [pushHistory=false]
		 * @returns {boolean}
		 */
		route: function(path, pushHistory) {
			path = encodePath(path.replace(reSlashes, '/'));

			if (path[0] != '/') {
				var locationPath = location.pathname;
				path = locationPath + (locationPath[locationPath.length - 1] == '/' ? '' : '/') + path;
			}

			if (path[path.length - 1] != '/') {
				path += '/';
			}

			if (path === this.currentPath) {
				return true;
			}

			var match = tryPath(this, path);

			if (!match) {
				return false;
			}

			this.app.viewState.update(match.state);
			setState(this, match.route, path, this.app.viewState.serializeData(), pushHistory ? 2 : 1);

			return true;
		}
	});

	rt.Router = Router;

})();

(function() {

	var deserialize = rt.dump.deserialize;
	var ViewState = rt.ViewState;
	var Router = rt.Router;

	/**
	 * @private
	 */
	function collectViewStateProperties(viewState, routes) {
		var props = Object.assign({}, viewState);

		for (var i = routes.length; i;) {
			var routeProps = routes[--i].properties;

			for (var j = routeProps.length; j;) {
				var name = routeProps[--j].name;

				if (!hasOwn.call(props, name)) {
					props[name] = undefined;
				}
			}
		}

		return props;
	}

	/**
	 * @class Rift.BaseApp
	 * @extends {Object}
	 */
	var BaseApp = rt.Class.extend(/** @lends Rift.BaseApp# */{
		/**
		 * @type {Rift.BaseModel}
		 */
		model: null,

		/**
		 * @type {Rift.BaseView}
		 */
		view: null,

		/**
		 * @type {Rift.ViewState}
		 */
		viewState: null,

		/**
		 * @type {Rift.Router}
		 */
		router: null,

		/**
		 * @protected
		 *
		 * @param {Function|Object} model
		 * @param {Function} viewClass
		 * @param {?HTMLElement} viewBlock
		 * @param {Object} viewState
		 * @param {?Object} viewStateData
		 * @param {Rift.Router} routes
		 * @param {string} path
		 */
		_init: function(model, viewClass, viewBlock, viewState, viewStateData, routes, path) {
			this.model = typeof model == 'function' ? new model() : deserialize(model);

			var router = this.router = new Router(this, routes);
			var viewState = this.viewState = new ViewState(collectViewStateProperties(viewState, router.routes));

			router.route(path);

			if (isClient) {
				for (var name in viewStateData) {
					viewState[name](deserialize(viewStateData[name]).v);
				}
			}

			var view = this.view = new viewClass({ app: this, block: viewBlock });

			router.start();

			if (isClient) {
				view.initClient();
			}
		},

		dispose: function() {
			this.router.dispose();
			this.view.dispose();
			this.viewState.dispose();
			this.model.dispose();
		}
	});

	rt.BaseApp = BaseApp;

})();

})();
