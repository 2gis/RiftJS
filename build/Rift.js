(function(undef) {
'use strict';

var global = Function('return this;')();

/*!
 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
 */
function svz(a, b) {
	return a === b || (a != a && b != b);
}

/* eslint-disable no-unused-vars */
function isEmpty(obj) {
	for (var any in obj) {
		return false;
	}
	return true;
}
/* eslint-enable no-unused-vars */

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

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

var isServer = rt.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
var isClient = rt.isClient = !isServer;

/**
 * @memberOf Rift
 *
 * @param {*} err
 */
function logError(err) {
	console.error(err === Object(err) && err.stack || err);
}

rt.logError = logError;

var $;

if (isClient) {
	$ = rt.$ = global.jQuery || global.Zepto || global.ender || global.$;
}

var keyListenerInner = '_rt-listenerInner';


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
				var nextSource = arguments[i];

				if (nextSource == null) {
					throw new TypeError('Can\'t convert ' + nextSource + ' to an object');
				}

				nextSource = Object(nextSource);

				var keys = Object.keys(nextSource);

				for (var j = 0, m = keys.length; j < m; j++) {
					obj[keys[j]] = nextSource[keys[j]];
				}

				var symbols = Object.getOwnPropertySymbols(nextSource);

				for (var j = 0, m = symbols.length; j < m; j++) {
					obj[symbols[j]] = nextSource[symbols[j]];
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
		var smbUID = Symbol('uid');

		getUID = function getUID(obj, prefix) {
			return obj[smbUID] || (obj[smbUID] = nextUID(prefix));
		};
	} else {
		var keyUID = '_rt-uid';

		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, keyUID)) {
				Object.defineProperty(obj, keyUID, {
					value: nextUID(prefix)
				});
			}

			return obj[keyUID];
		};
	}

	/**
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {Object} source
	 * @param {boolean} [skipDontEnums=false]
	 * @returns {Object}
	 */
	function mixin(obj, source, skipDontEnums) {
		var names = skipDontEnums ? Object.keys(source) : Object.getOwnPropertyNames(source);

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
	 * forEachMatch(/(\w+)\-(\d+)/g, 'a-1 b-2 c-3', function(match, name, value) {
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
			default: {
				return (typeof value) + '-' + value;
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

			js = '[' + js.join(',') + (js[js.length - 1] == '' ? ',]' : ']');
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

	if (global.process && global.process.nextTick) {
		nextTick = global.process.nextTick;
	} else if (global.setImmediate) {
		nextTick = function(cb) {
			setImmediate(cb);
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
	 * @property {Object<Function>}
	 * @memberOf Rift.Class
	 */
	var classes = {};

	/**
	 * @function getOrError
	 * @memberOf Rift.Class
	 *
	 * @param {string} name
	 * @returns {Function}
	 */
	function getClassOrError(name) {
		if (!hasOwn.call(classes, name)) {
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
		if (hasOwn.call(classes, name)) {
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
			name = undef;
		}

		var parent = this;
		var constr;

		if (hasOwn.call(declaration, 'constructor')) {
			constr = declaration.constructor;
			delete declaration.constructor;
		} else {
			constr = function() {
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

		mixin(constr, parent, true);

		if (hasOwn.call(declaration, 'static')) {
			mixin(constr, declaration.static);
			delete declaration.static;
		}

		if (!constr.extend) {
			constr.extend = extend;
		}

		mixin(proto, declaration);

		if (name) {
			registerClass(name, constr);
		}

		return constr;
	}

	/**
	 * @namespace Rift.Class
	 */
	rt.Class = {
		classes: classes,
		getOrError: getClassOrError,
		register: registerClass,
		extend: extend
	};

})();

(function() {

	var getUID = rt.object.getUID;
	var toString = rt.value.toString;
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

		if (hasOwn.call(objects, id)) {
			return id;
		}

		var data = {};
		var opts = {};

		if (hasOwn.call(obj.constructor, '__class')) {
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
					data[name] = value === undef ? {} : { v: value };
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

		return toString({
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

			if (hasOwn.call(obj, 'c')) {
				var cl = classes[obj.c];
				obj.instance = hasOwn.call(obj, 'o') ? new cl(undef, obj.o) : new cl();
			} else {
				obj.instance = {};
			}
		}

		for (var id in objects) {
			var obj = objects[id];

			if (hasOwn.call(obj, 'd')) {
				var data = obj.d;

				for (var name in data) {
					var item = data[name];

					if (typeof item == 'object') {
						data[name] = hasOwn.call(item, 'v') ? item.v : undef;
					} else {
						data[name] = objects[item].instance;
					}
				}

				if (hasOwn.call(obj, 'c') && obj.instance.expandFromDumpObject) {
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

(function() {

	var Map = global.Map;

	if (!Map || Map.toString().indexOf('[native code]') == -1) {
		var getHash = rt.value.getHash;

		var entryStub = {
			key: undef,
			value: undef,
			prev: null,
			next: null
		};

		Map = function Map(arr) {
			this._inner = Object.create(null);

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.set(arr[i][0], arr[i][1]);
				}
			}
		};

		rt.object.mixin(Map.prototype, {
			_inner: null,
			_first: null,
			_last: null,

			_size: 0,
			get size() {
				return this._size;
			},

			has: function(key) {
				return getHash(key) in this._inner;
			},

			get: function(key) {
				return (this._inner[getHash(key)] || entryStub).value;
			},

			set: function(key, value) {
				var hash = getHash(key);

				if (hash in this._inner) {
					this._inner[hash].value = value;
				} else {
					var entry = this._inner[hash] = {
						key: key,
						value: value,
						prev: this._last,
						next: null
					};

					if (this._size++) {
						this._last.next = entry;
					} else {
						this._first = entry;
					}

					this._last = entry;
				}

				return this;
			},

			delete: function(key) {
				var inner = this._inner;
				var hash = getHash(key);

				if (!(hash in inner)) {
					return false;
				}

				if (--this._size) {
					var prev = inner[hash].prev;
					var next = inner[hash].next;

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

				delete inner[hash];

				return true;
			},

			forEach: function(cb, context) {
				if (context == null) {
					context = global;
				}

				var entry = this._first;

				while (entry) {
					cb.call(context, entry.value, entry.key, this);
					entry = entry.next;
				}
			},

			clear: function() {
				this._inner = Object.create(null);
				this._first = null;
				this._last = null;
				this._size = 0;
			}
		});
	}

	rt.Map = Map;

})();

(function() {

	var Set = global.Set;

	if (!Set || Set.toString().indexOf('[native code]') == -1) {
		var Map = rt.Map;

		Set = function Set(arr) {
			this._inner = new Map();

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.add(arr[i]);
				}
			}
		};

		rt.object.mixin(Set.prototype, {
			_inner: null,

			get size() {
				return this._inner.size;
			},

			has: function(value) {
				return this._inner.has(value);
			},

			add: function(value) {
				this._inner.set(value, value);
				return this;
			},

			delete: function(value) {
				return this._inner.delete(value);
			},

			forEach: function(cb, context) {
				if (context == null) {
					context = global;
				}

				this._inner.forEach(function(value) {
					cb.call(context, value, value, this);
				}, this);
			},

			clear: function() {
				this._inner = new Map();
			}
		});
	}

	rt.Set = Set;

})();

(function() {

	/**
	 * @class Rift.Event
	 * @extends {Object}
	 *
	 * @param {string} type - Тип.
	 * @param {boolean} [canBubble=false] - Может ли событие всплывать.
	 */
	function Event(type, canBubble) {
		this.type = type;

		if (canBubble) {
			this.bubbles = true;
		}
	}

	Event.extend = rt.Class.extend;

	Object.assign(Event.prototype, /** @lends Rift.Event# */{
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
		type: undef,

		/**
		 * @type {int|undefined}
		 * @writable
		 */
		timestamp: undef,

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

	var keyUsed = '_emt-used';

	/**
	 * @private
	 *
	 * @param {Function} method
	 * @returns {Function}
	 */
	function wrapOnOff(method) {
		return function _(type, listener, context) {
			if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					_.call(this, type, types[type], context);
				}
			} else {
				method.call(this, type, listener, context);
			}

			return this;
		};
	}

	/**
	 * @class Rift.EventEmitter
	 * @extends {Object}
	 */
	function EventEmitter() {}

	EventEmitter.extend = rt.Class.extend;

	Object.assign(EventEmitter.prototype, /** @lends Rift.EventEmitter# */{
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
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		on: wrapOnOff(function(type, listener, context) {
			var events = this._events || (this._events = Object.create(null));

			(events[type] || (events[type] = [])).push({
				listener: listener,
				context: context || this
			});
		}),

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		off: wrapOnOff(function(type, listener, context) {
			var events = (this._events || (this._events = Object.create(null)))[type];

			if (!events) {
				return;
			}

			if (!context) {
				context = this;
			}

			for (var i = events.length; i;) {
				var evt = events[--i];

				if (evt.context == context && (
					evt.listener == listener ||
						(hasOwn.call(evt.listener, keyListenerInner) && evt.listener[keyListenerInner] == listener)
				)) {
					events.splice(i, 1);
				}
			}

			if (!events.length) {
				delete this._events[type];
			}
		}),

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		once: function(type, listener, context) {
			function outer() {
				this.off(type, outer);
				listener.apply(this, arguments);
			}
			outer[keyListenerInner] = listener;

			return this.on(type, outer, context);
		},

		/**
		 * @param {Rift.Event|string} evt
		 * @param {Object} [detail]
		 * @returns {Rift.Event}
		 */
		emit: function(evt, detail) {
			if (typeof evt == 'string') {
				evt = new Event(evt);
			} else if (hasOwn.call(evt, keyUsed)) {
				throw new TypeError('Attempt to use an object that is no longer usable');
			}

			evt[keyUsed] = true;

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
				var events = this._events || (this._events = Object.create(null));

				events = type in events ? events[type].slice(0) : [];

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
							evt.isPropagationStopped = true;
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

	var Map = rt.Map;
	var Set = rt.Set;
	var EventEmitter = rt.EventEmitter;

	/**
	 * @class Rift.ActiveDictionary
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Object|Rift.ActiveDictionary|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.handleItemChanges=false]
	 */
	var ActiveDictionary = EventEmitter.extend('Rift.ActiveDictionary', /** @lends Rift.ActiveDictionary# */{
		_inner: null,
		_valueCounts: null,

		_handleItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			this._valueCounts = new Map();

			if (typeof opts == 'boolean') {
				opts = { handleItemChanges: opts };
			} else if (!opts) {
				opts = {};
			}

			var handleItemChanges = opts.handleItemChanges === true;

			if (handleItemChanges) {
				this._handleItemChanges = true;
			}

			if (data) {
				var inner = this._inner = Object.assign(
					Object.create(null),
					data instanceof ActiveDictionary ? data._inner : data
				);
				var valueCounts = this._valueCounts;

				for (var name in inner) {
					var value = inner[name];

					if (valueCounts.has(value)) {
						valueCounts.set(value, valueCounts.get(value) + 1);
					} else {
						valueCounts.set(value, 1);

						if (handleItemChanges && value instanceof EventEmitter) {
							value.on('change', this._onItemChange, this);
						}
					}
				}
			} else {
				this._inner = {};
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
			return name in this._inner;
		},

		/**
		 * Получает значение записи.
		 *
		 * @param {string} name
		 * @returns {*}
		 */
		get: function(name) {
			return this._inner[name];
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

			var inner = this._inner;
			var valueCounts = this._valueCounts;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValueSet = new Set();
			var removedValues = [];
			var addedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: addedValues
			};

			for (name in values) {
				var hasName = name in inner;
				var oldValue = inner[name];
				var val = values[name];

				if (!hasName || !svz(oldValue, val)) {
					changed = true;

					if (hasName) {
						var oldValueCount = valueCounts.get(oldValue) - 1;

						if (oldValueCount) {
							valueCounts.set(oldValue, oldValueCount);
						} else {
							valueCounts.delete(oldValue);

							if (handleItemChanges && oldValue instanceof EventEmitter) {
								oldValue.off('change', this._onItemChange);
							}

							removedValueSet.add(oldValue);
						}
					}

					if (valueCounts.has(val)) {
						valueCounts.set(val, valueCounts.get(val) + 1);
					} else {
						valueCounts.set(val, 1);

						if (handleItemChanges && val instanceof EventEmitter) {
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

					inner[name] = val;
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
			var inner = this._inner;
			var valueCounts = this._valueCounts;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: []
			};

			for (var i = 0, l = arguments.length; i < l; i++) {
				var name = arguments[i];

				if (name in inner) {
					changed = true;

					var value = inner[name];
					var valueCount = valueCounts.get(value) - 1;

					if (valueCount) {
						valueCounts.set(value, valueCount);
					} else {
						valueCounts.delete(value);

						if (handleItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange);
						}

						removedValues.push(value);
					}

					diff[name] = {
						type: 'delete',
						oldValue: value,
						value: undef
					};

					delete inner[name];
				}
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
			return new this.constructor(this, { handleItemChanges: this._handleItemChanges });
		},

		/**
		 * Преобразует в объект.
		 *
		 * @returns {Object}
		 */
		toObject: function() {
			return Object.assign({}, this._inner);
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			var inner = this._inner;

			for (var name in inner) {
				data[name] = inner[name];
			}

			if (this._handleItemChanges) {
				opts.handleItemChanges = true;
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
			if (this._handleItemChanges) {
				var onItemChange = this._onItemChange;

				this._valueCounts.forEach(function(value) {
					if (value instanceof EventEmitter) {
						value.off('change', onItemChange);
					}
				});
			}
		}
	});

	rt.ActiveDictionary = ActiveDictionary;

})();

(function() {

	var Map = rt.Map;
	var Set = rt.Set;
	var EventEmitter = rt.EventEmitter;

	var arrayProto = Array.prototype;
	var push = arrayProto.push;
	var unshift = arrayProto.unshift;
	var concat = arrayProto.concat;
	var slice = arrayProto.slice;
	var splice = arrayProto.splice;
	var map = arrayProto.map;
	var reduce = arrayProto.reduce;

	/**
	 * @private
	 *
	 * @param {Rift.ActiveArray} arr
	 * @param {Arguments} values
	 * @returns {Array}
	 */
	function addValues(arr, values) {
		var valueCounts = arr._valueCounts;
		var handleItemChanges = arr._handleItemChanges;
		var addedValues = [];

		for (var i = 0, l = values.length; i < l; i++) {
			var value = values[i];

			if (valueCounts.has(value)) {
				valueCounts.set(value, valueCounts.get(value) + 1);
			} else {
				valueCounts.set(value, 1);

				if (handleItemChanges && value instanceof EventEmitter) {
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

			if (arr._handleItemChanges && value instanceof EventEmitter) {
				value.off('change', arr._onItemChange);
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
	 * @param {boolean} [opts.handleItemChanges=false]
	 */
	var ActiveArray = EventEmitter.extend('Rift.ActiveArray', /** @lends Rift.ActiveArray# */{
		_inner: null,
		_valueCounts: null,

		_handleItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			this._valueCounts = new Map();

			if (typeof opts == 'boolean') {
				opts = { handleItemChanges: opts };
			} else if (!opts) {
				opts = {};
			}

			var handleItemChanges = opts.handleItemChanges === true;

			if (handleItemChanges) {
				this._handleItemChanges = true;
			}

			if (data) {
				var inner = this._inner = (data instanceof ActiveArray ? data._inner : data).slice(0);
				var valueCounts = this._valueCounts;

				for (var i = inner.length; i;) {
					if (--i in inner) {
						var value = inner[i];

						if (valueCounts.has(value)) {
							valueCounts.set(value, valueCounts.get(value) + 1);
						} else {
							valueCounts.set(value, 1);

							if (handleItemChanges && value instanceof EventEmitter) {
								value.on('change', this._onItemChange, this);
							}
						}
					}
				}
			} else {
				this._inner = [];
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
			return this._inner[index];
		},

		/**
		 * Устанавливает значение индекса.
		 *
		 * @param {int} index
		 * @param {*} value
		 * @returns {Rift.ActiveArray}
		 */
		set: function(index, value) {
			var inner = this._inner;
			var hasIndex = index in inner;
			var oldValue = inner[index];

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

						if (this._handleItemChanges && oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onItemChange);
						}

						removedValues = [oldValue];
					}
				}

				if (valueCounts.has(value)) {
					valueCounts.set(value, valueCounts.get(value) + 1);
				} else {
					valueCounts.set(value, 1);

					if (this._handleItemChanges && value instanceof EventEmitter) {
						value.on('change', this._onItemChange, this);
					}

					addedValues = [value];
				}

				inner[index] = value;

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
			var inner = this._inner;
			var valueCounts = this._valueCounts;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValues = [];

			for (var i = 0, l = arguments.length; i < l; i++) {
				var index = arguments[i];

				if (index in inner) {
					changed = true;

					var value = inner[index];
					var valueCount = valueCounts.get(value) - 1;

					if (valueCount) {
						valueCounts.set(value, valueCount);
					} else {
						valueCounts.delete(value);

						if (handleItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange);
						}

						removedValues.push(value);
					}

					delete inner[index];
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
			return this._inner.length;
		},
		set length(len) {
			var inner = this._inner;
			var oldLen = inner.length;

			if (oldLen != len) {
				var changed = false;
				var removedValues = [];

				if (len < oldLen) {
					var valueCounts = this._valueCounts;
					var handleItemChanges = this._handleItemChanges;
					var i = len;

					do {
						if (i in inner) {
							changed = true;

							var value = inner[i];
							var valueCount = valueCounts.get(value) - 1;

							if (valueCount) {
								valueCounts.set(value, valueCount);
							} else {
								valueCounts.delete(value);

								if (handleItemChanges && value instanceof EventEmitter) {
									value.off('change', this._onItemChange);
								}

								removedValues.push(value);
							}
						}
					} while (++i < oldLen);
				}

				inner.length = len;

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
			return this._inner.indexOf(value, fromIndex);
		},

		/**
		 * @param {*} value
		 * @param {int} [fromIndex=-1]
		 * @returns {int}
		 */
		lastIndexOf: function(value, fromIndex) {
			return this._inner.lastIndexOf(value, fromIndex);
		},

		/**
		 * Добавляет один или более элементов в конец массива и возвращает новую длину массива.
		 *
		 * @param {...*} values - Элементы, добавляемые в конец массива.
		 * @returns {int}
		 */
		push: function() {
			if (!arguments.length) {
				return this._inner.length;
			}

			push.apply(this._inner, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: addValues(this, arguments)
				}
			});

			return this._inner.length;
		},

		/**
		 * Добавляет один или более элементов в конец массива и возвращает новую длину массива.
		 * Элементы, уже присутствующие в массиве, добавлены не будут. Повторяющиеся элементы, отсутствующие в массиве,
		 * будут добавлены один раз.
		 *
		 * @param {...*} values - Элементы, добавляемые в конец массива.
		 * @returns {int}
		 */
		pushUnique: function() {
			var valueCounts = this._valueCounts;

			return this.push.apply(this, reduce.call(arguments, function(values, value) {
				if (!valueCounts.has(value) && values.indexOf(value) == -1) {
					values.push(value);
				}

				return values;
			}, []));
		},

		/**
		 * Удаляет первый элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		shift: function() {
			var inner = this._inner;

			if (!inner.length) {
				return;
			}

			if (!this._valueCounts.size) {
				inner.length--;
				return;
			}

			var hasFirst = '0' in inner;
			var value;

			if (hasFirst) {
				value = inner.shift();
			} else {
				inner.shift();
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
				return this._inner.length;
			}

			unshift.apply(this._inner, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: addValues(this, arguments)
				}
			});

			return this._inner.length;
		},

		/**
		 * Удаляет последний элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		pop: function() {
			var inner = this._inner;

			if (!inner.length) {
				return;
			}

			if (!(inner.length - 1 in inner)) {
				inner.length--;
				return;
			}

			var value = inner.pop();

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
			return this._inner.join(separator);
		},

		/**
		 * @param {...*} values - Массивы и/или значения, соединяемые в новый массив.
		 * @returns {Rift.ActiveArray}
		 */
		concat: function() {
			return new this.constructor(
				concat.apply(this._inner, map.call(arguments, function(value) {
					return value instanceof ActiveArray ? value._inner : value;
				}))
			);
		},

		/**
		 * Создаёт поверхностную копию части массива.
		 *
		 * @param {int} [startIndex=0]
		 * @param {int} [endIndex=this.length]
		 * @returns {Array}
		 */
		slice: function(startIndex, endIndex) {
			return this._inner.slice(startIndex, endIndex);
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
			var inner = this._inner;
			var removedSlice = splice.apply(inner, arguments);
			var addedSlice = slice.call(arguments, 2);
			var removedSliceLen = removedSlice.length;
			var addedSliceLen = addedSlice.length;

			if (!removedSliceLen && !addedSliceLen) {
				return removedSlice;
			}

			var valueCounts = this._valueCounts;
			var handleItemChanges = this._handleItemChanges;
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

							if (handleItemChanges && removedValue instanceof EventEmitter) {
								removedValue.off('change', this._onItemChange);
							}

							removedValueSet.add(removedValue);
						}
					}

					if (iInAddedSlice) {
						if (valueCounts.has(addedValue)) {
							valueCounts.set(addedValue, valueCounts.get(addedValue) + 1);
						} else {
							valueCounts.set(addedValue, 1);

							if (handleItemChanges && addedValue instanceof EventEmitter) {
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
				for (var i = startIndex + addedSliceLen, l = inner.length; i < l; i++) {
					if (i in inner) {
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
			return new this.constructor(this, { handleItemChanges: this._handleItemChanges });
		},

		/**
		 * Преобразует в обычный массив.
		 *
		 * @returns {Array}
		 */
		toArray: function() {
			return this._inner.slice(0);
		},

		/**
		 * Преобразует в строковое представление.
		 *
		 * @returns {string}
		 */
		toString: function() {
			return this._inner.toString();
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			var inner = this._inner;

			for (var i = inner.length; i;) {
				if (--i in inner) {
					data[i] = inner[i];
				}
			}

			if (this._handleItemChanges) {
				opts.handleItemChanges = true;
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
			if (this._handleItemChanges) {
				var onItemChange = this._onItemChange;

				this._valueCounts.forEach(function(value) {
					if (value instanceof EventEmitter) {
						value.off('change', onItemChange);
					}
				});
			}
		}
	});

	['forEach', 'map', 'filter', 'every', 'some', 'reduce', 'reduceRight'].forEach(function(name) {
		this[name] = function() {
			return arrayProto[name].apply(this._inner, arguments);
		};
	}, ActiveArray.prototype);

	rt.ActiveArray = ActiveArray;

})();

(function() {

	var getUID = rt.object.getUID;
	var nextTick = rt.process.nextTick;
	var Event = rt.Event;
	var EventEmitter = rt.EventEmitter;

	var STATE_CHANGES_ACCUMULATION = 0;
	var STATE_CHANGES_HANDLING = 1;
	var STATE_CHILDREN_RECALCULATION = 2;

	var state = STATE_CHANGES_ACCUMULATION;

	/**
	 * @type {Object<{ dataCell: Rift.DataCell, event: Rift.Event, cancellable: boolean }>}
	 * @private
	 */
	var changes = {};

	var changeCount = 0;

	/**
	 * @private
	 */
	var outdatedDataCells = Object.assign(Object.create(null), {
		first: null,
		last: null
	});

	var circularityDetectionCounter = {};

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
					var id = getUID(dc);

					if (hasOwn.call(dcBundle.dataCells, id)) {
						return false;
					}

					dcBundle.dataCells[id] = dc;
					dcBundle.count++;

					return true;
				}

				if (maxParentDepth > dcBundle.maxParentDepth) {
					var next = dcBundle.next;

					(dcBundle.next = (next || outdatedDataCells)[next ? 'prev' : 'last'] =
						outdatedDataCells[maxParentDepth] = {
							maxParentDepth: maxParentDepth,
							dataCells: {},
							count: 1,
							prev: dcBundle,
							next: next
						}
					).dataCells[getUID(dc)] = dc;

					return true;
				}

				if (!dcBundle.prev) {
					(dcBundle.prev = outdatedDataCells.first = outdatedDataCells[maxParentDepth] = {
						maxParentDepth: maxParentDepth,
						dataCells: {},
						count: 1,
						prev: null,
						next: dcBundle
					}).dataCells[getUID(dc)] = dc;

					return true;
				}

				dcBundle = dcBundle.prev;
			}
		}

		(outdatedDataCells.first = outdatedDataCells.last = outdatedDataCells[maxParentDepth] = {
			maxParentDepth: maxParentDepth,
			dataCells: {},
			count: 1,
			prev: null,
			next: null
		}).dataCells[getUID(dc)] = dc;

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

		if (dcBundle) {
			var id = getUID(dc);

			if (hasOwn.call(dcBundle.dataCells, id)) {
				if (--dcBundle.count) {
					delete dcBundle.dataCells[id];
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
		}

		return false;
	}

	/**
	 * @private
	 */
	function handleChanges() {
		state = STATE_CHANGES_HANDLING;

		do {
			for (var changeId in changes) {
				var change = changes[changeId];
				var dc = change.dataCell;
				var children = dc._children;

				for (var childId in children) {
					addOutdatedDataCell(children[childId]);
				}

				delete changes[changeId];
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

			for (var id in dcs) {
				var dc = dcs[id];

				dc._recalc();

				if (state != STATE_CHILDREN_RECALCULATION) {
					return;
				}

				// кажется, что правильней поставить этот if-else над dc._recalc() , но подумай получше ;)
				if (--dcBundle.count) {
					delete dcs[id];
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
		circularityDetectionCounter = {};
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

		var id = getUID(dc);

		if (changeCount) {
			if (hasOwn.call(changes, id)) {
				var change = changes[id];

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

		changes[id] = {
			dataCell: dc,
			event: evt,
			cancellable: cancellable !== false
		};

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
		initialValue: undef,

		_value: undef,
		_fixedValue: undef,

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
		 * @type {Object<Rift.DataCell>}
		 * @protected
		 */
		_parents: null,

		/**
		 * Дочерние ячейки.
		 *
		 * @type {Object<Rift.DataCell>}
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

			this._children = {};

			if (
				typeof value == 'function' &&
					(opts.computable !== undef ? opts.computable : value.constructor == Function)
			) {
				this.computable = true;
			}

			if (this.computable) {
				this._formula = value;

				detectedParents.unshift({});

				try {
					this._value = this._fixedValue = this._formula.call(this.owner || this);
				} catch (err) {
					this._handleError(err);
				}

				var parents = this._parents = detectedParents.shift();
				var maxParentDepth = 1;

				for (var id in parents) {
					var parent = parents[id];

					parent._children[getUID(this)] = this;

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
				detectedParents[0][getUID(this)] = this;
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
							addChange(this, { value: change }, undef, value !== this._fixedValue);
						}
					}
				} else {
					if (!svz(oldValue, value)) {
						this._value = value;

						if (svz(value, this._fixedValue)) {
							var id = getUID(this);

							if (changes[id].cancellable) {
								delete changes[id];
								changeCount--;

								return;
							}
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
			addChange(this, undef, evt, this._value !== this._fixedValue);
		},

		/**
		 * @protected
		 */
		_recalc: function() {
			var id = getUID(this);

			if (hasOwn.call(circularityDetectionCounter, id)) {
				if (++circularityDetectionCounter[id] == 10) {
					this._handleError(new RangeError('Circular dependency detected'));
					return;
				}
			} else {
				circularityDetectionCounter[id] = 1;
			}

			var oldValue = this._value;
			var oldParents = this._parents;

			var err;

			detectedParents.unshift({});

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

			for (var parentId in oldParents) {
				if (!hasOwn.call(parents, parentId)) {
					delete oldParents[parentId]._children[id];
				}
			}

			for (var parentId in parents) {
				var parent = parents[parentId];

				if (!hasOwn.call(oldParents, parentId)) {
					parent._children[id] = this;
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

				var children = this._children;

				for (var id in children) {
					if (evt.isPropagationStopped) {
						break;
					}

					children[id]._handleErrorEvent(evt);
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

			var id = getUID(this);

			if (id in changes) {
				delete changes[id];
				changeCount--;
			}

			removeOutdatedDataCell(this);

			if (this.computable) {
				var parents = this._parents;

				for (var parentId in parents) {
					delete parents[parentId]._children[id];
				}
			} else {
				if (this._value instanceof EventEmitter) {
					this._value.off('change', this._onValueChange, this);
				}
			}

			var children = this._children;

			for (var childId in children) {
				children[childId].dispose();
			}

			this.disposed = true;
		}
	});

	rt.DataCell = DataCell;

})();

(function() {

	var cloneObject = rt.object.clone;
	var Map = rt.Map;
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
			obj._dataCells.forEach(function(dc) {
				dc.dispose();
			});

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
	var getHash = rt.value.getHash;
	var Map = rt.Map;
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
			} else if (typeof target == 'function' && target.constructor == ActiveProperty) {
				target = target('dataCell', 0);
			} else if (typeof type == 'object') {
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
		 * @param {Object|undefined} [context=this]
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

			var listening = this._listening || (this._listening = {});
			var id = getUID(target) + '-' + type + '-' +
				getUID(hasOwn.call(listener, keyListenerInner) ? listener[keyListenerInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undef ? getHash(meta) : '');

			if (hasOwn.call(listening, id)) {
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

			listening[id] = {
				target: target,
				type: type,
				listener: listener,
				context: context,
				meta: meta
			};
		},

		/**
		 * Останавливает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context=this]
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
				getUID(hasOwn.call(listener, keyListenerInner) ? listener[keyListenerInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undef ? getHash(meta) : '');

			if (hasOwn.call(listening, id)) {
				removeListener(listening[id]);
				delete listening[id];
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
		 *
		 * @param {Function} cb
		 * @returns {Function}
		 */
		registerCallback: function(cb) {
			var callbacks = this._callbacks || (this._callbacks = new Map());

			if (callbacks.has(cb)) {
				callbacks.get(cb).canceled = true;
			}

			var disposable = this;

			function outer() {
				if (hasOwn.call(outer, 'canceled') && outer.canceled) {
					return;
				}

				callbacks.delete(cb);
				cb.apply(disposable, arguments);
			}

			callbacks.set(cb, outer);

			return outer;
		},

		/**
		 * Отменяет регистрацию колбэка.
		 *
		 * @param {Function} cb
		 * @returns {Rift.Disposable}
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
		 *
		 * @returns {Rift.Disposable}
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
				if (name in this) {
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
	var getClassOrError = rt.Class.getOrError;
	var ActiveDictionary = rt.ActiveDictionary;
	var ActiveArray = rt.ActiveArray;

	/**
	 * @param {string} viewClass
	 * @param {Object} [opts]
	 * @returns {string}
	 */
	function include(viewClass, opts) {
		viewClass = getClassOrError(viewClass);

		if (opts) {
			opts.parent = this;
			opts.block = null;
		} else {
			opts = {
				parent: this,
				block: null
			};
		}

		var childRenderings = this._childRenderings;
		var index = childRenderings.count++;
		var mark = childRenderings.marks[index] = '{{_' + nextUID() + '}}';

		new viewClass(opts).render(function(html) {
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
			value = Boolean(value);

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
	var keyDataCells = '_rt-dataCells';

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
		if (hasOwn.call(el, keyDataCells) && el[keyDataCells]) {
			return el[keyDataCells];
		}

		var dcs = el[keyDataCells] = [];

		if (el.hasAttribute('rt-bind')) {
			var applyValues = !opts || opts.applyValues !== false;

			forEachMatch(reBindingExpr, el.getAttribute('rt-bind'), function(match, helper, meta, js) {
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
		if (hasOwn.call(el, keyDataCells)) {
			var dcs = el[keyDataCells];

			if (dcs) {
				for (var i = dcs.length; i;) {
					dcs[--i].dispose();
				}

				el[keyDataCells] = null;
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
	var getHash = rt.value.getHash;
	var toString = rt.value.toString;
	var classes = rt.Class.classes;
	var getClassOrError = rt.Class.getOrError;
	var Map = rt.Map;
	var Disposable = rt.Disposable;
	var escapeHTML = rt.html.escape;
	var bindDOM = rt.domBinding.bind;

	var selfClosingTags = {
		area: 1,
		base: 1,
		basefont: 1,
		br: 1,
		col: 1,
		command: 1,
		embed: 1,
		frame: 1,
		hr: 1,
		img: 1,
		input: 1,
		isindex: 1,
		keygen: 1,
		link: 1,
		meta: 1,
		param: 1,
		source: 1,
		track: 1,
		wbr: 1,

		// svg tags
		circle: 1,
		ellipse: 1,
		line: 1,
		path: 1,
		polygone: 1,
		polyline: 1,
		rect: 1,
		stop: 1,
		use: 1
	};

	var reNameClass = /^(.+?):(.+)$/;
	var reViewData = /([^,]*),([^,]*),(.*)/;
	var keyView = '_rt-view';
	var keyViewElementName = '_rt-viewElementName';

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
				cls.push('__' + name + (value === true ? '' : '_' + value));
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
		if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName] || el[keyView] != view) {
			return;
		}

		var els = view.elements[el[keyViewElementName]];
		els.splice(els.indexOf(el), 1);

		el[keyView] = null;
		el[keyViewElementName] = undef;

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
		_params: null,

		_id: undef,

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
		name: undef,

		/**
		 * @type {string}
		 */
		tagName: 'div',

		/**
		 * @type {string}
		 */
		blockName: undef,

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

				viewClass.prototype.blockName = viewClass.__class;
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
				if (params.block !== undef) {
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

					if (hasOwn.call(block, keyView) && block[keyView]) {
						throw new TypeError(
							'Element is already used as ' + (
								hasOwn.call(block, keyViewElementName) && block[keyViewElementName] ?
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
				block[keyView] = this;

				if (rendered) {
					var view = this;

					this.block
						.find('[rt-p=' + this._id + ']')
						.each(function() {
							new classes[this.getAttribute('rt-d').match(reViewData)[1]]({
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
									childBlock[keyView] = child;

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

				this.model = this.app.model;
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
				}
			}

			if (params.onlyClient !== undef) {
				this.onlyClient = params.onlyClient;
			}
		},

		/**
		 * @param {Function} cb
		 */
		render: function(cb) {
			if (this._currentlyRendering) {
				throw new TypeError('Cannot run the rendering when it is in process');
			}

			if (isServer && this.onlyClient) {
				cb(
					this._renderOpenTag(true) +
						(hasOwn.call(selfClosingTags, this.tagName) ? '' : '</' + this.tagName + '>')
				);

				return;
			}

			this._currentlyRendering = true;

			receiveData(this, function() {
				if (hasOwn.call(selfClosingTags, this.tagName)) {
					this._currentlyRendering = false;
					cb(this._renderOpenTag(false));
				} else {
					this._renderInner(function(html) {
						this._currentlyRendering = false;
						cb(this._renderOpenTag(false) + html + '</' + this.tagName + '>');
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
			var attribs;

			if (billet) {
				attribs = '';
			} else {
				var attrs = this.attrs;

				attribs = [
					'class="' +
						(pushMods([this.blockName], this.mods).join(' ') + ' ' + (attrs.class || '')).trim() + '"'
				];

				for (var name in attrs) {
					if (name != 'class') {
						attribs.push(name + '="' + attrs[name] + '"');
					}
				}
			}

			return '<' + this.tagName +
				' ' + attribs.join(' ') +
				' rt-d="' + [
					this.constructor.__class,
					billet ? '' : this._id,
					isEmpty(this._params) ? '' : escapeHTML(toString(this._params).slice(1, -1))
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
		 * //
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
		 * // создаёт новый элемент `<li class="Module_element __selected">Hi!</li>`,
		 * // добавляет его в коллекцию `element` и возвращает коллекцию с новым элементом
		 * this.$('item', '<li class="__selected">Hi!</li>');
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
						return !hasOwn.call(this, keyView) || !this[keyView];
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
							if (hasOwn.call(el, keyView) && el[keyView]) {
								if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName]) {
									throw new TypeError('Element is already used as a block of view');
								}

								if (el[keyView] != this || el[keyViewElementName] != name) {
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

					el[keyView] = this;
					el[keyViewElementName] = name;

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

			if (name == '*') {
				children = this.children;
			} else {
				if (!hasOwn.call(this.children, name)) {
					return [];
				}

				children = this.children[name];
			}

			if (cl == '*') {
				children = children.slice(0);
			} else {
				cl = getClassOrError(cl);

				children = children.filter(function(child) {
					return child instanceof cl;
				});
			}

			var args = slice.call(arguments, 2);

			return children.map(function(child) {
				return child[method].apply(child, args);
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
						cl = getClassOrError(cl);

						var inner = listener;
						var outer = function(evt) {
							if (evt.target instanceof cl) {
								return inner.call(this, evt);
							}
						};
						outer[keyListenerInner] = inner;

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
					outer[keyListenerInner] = inner;

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
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getHash(meta)
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
						cl = getClassOrError(cl);
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
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getHash(meta)
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
				block[keyView] = null;
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
	 *
	 * @param {Object} props
	 */
	var ViewState = Disposable.extend('Rift.ViewState', /** @lends Rift.ViewState# */{
		/**
		 * @type {Array<string>}
		 */
		properties: null,

		constructor: function(props) {
			Disposable.call(this);

			this.properties = Object.keys(props);

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
		 * @returns {Object<string>}
		 */
		serializeData: function() {
			var props = this.properties;
			var data = {};

			for (var i = props.length; i;) {
				var dc = this[props[--i]]('dataCell', 0);

				if (!dc.computable) {
					var value = dc.value;

					if (value === Object(value) ? dc.changed : dc.initialValue !== value) {
						data[props[i]] = serialize({ v: value });
					}
				}
			}

			return data;
		},

		/**
		 * @param {Object<string>} data
		 * @returns {Rift.ViewState}
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
		 * @param {Object} data
		 * @returns {Rift.ViewState}
		 */
		update: function(data) {
			var props = this.properties;

			for (var i = props.length; i;) {
				var name = props[--i];
				this[name](hasOwn.call(data, name) ? data[name] : this[name]('dataCell', 0).initialValue);
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
	 *     properties: { type: int, id: string },
	 *     requiredProperties: Array<string>,
	 *     pathMap: { requiredProperties: Array<string>, pathPart: string=, prop: string= },
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
						state[prop.id] = prop.type == 1 ?
							Boolean(match[index + 1]) :
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
	 * @param {Router~Route} [preferredRoute]
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
				path.push(
					hasOwn.call(pathMapItem, 'pathPart') ? pathMapItem.pathPart : viewState[pathMapItem.prop]()
				);
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
		currentPath: undef,

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

				this.addRoute(route.path, route.callback);
			}, this);

			return this;
		},

		/**
		 * @param {string} path
		 * @param {Function|undefined} [callback]
		 * @returns {Rift.Router}
		 */
		addRoute: function(path, callback) {
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
							id: path[i]
						});
					}

					var pathPart = path[i + 1].split(reInsert);

					for (var j = 0, m = pathPart.length; j < m; j++) {
						if (j % 2) {
							var id = pathPart[j];

							pathMapItemRequiredProps.push(id);

							rePath.push('([^\\/]+)');

							props.push({
								type: 2,
								id: id
							});

							pathMap.push({
								requiredProperties: pathMapItemRequiredProps,
								prop: id
							});
						} else {
							if (pathPart[j]) {
								var encodedPathPart = encodePath(pathPart[j]);

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

								pathMap.push({
									requiredProperties: pathMapItemRequiredProps,
									pathPart: encodedPathPart.split('*').join('')
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
								var id = pathPart[j];

								rePath.push('([^\\/]+)');

								props.push({
									type: 0,
									id: id
								});

								requiredProps.push(id);

								pathMap.push({
									requiredProperties: [id],
									prop: id
								});
							} else {
								if (pathPart[j]) {
									var encodedPathPart = encodePath(pathPart[j]);

									rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

									pathMap.push({
										requiredProperties: [],
										pathPart: encodedPathPart.split('*').join('')
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
			var props = viewState.properties;

			for (var i = props.length; i;) {
				this.listen(viewState[props[--i]], 'change', onViewStatePropertyChange);
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
					this.currentPath = undef;
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
				var id = routeProps[--j].id;

				if (!hasOwn.call(props, id)) {
					props[id] = undef;
				}
			}
		}

		return props;
	}

	/**
	 * @class Rift.BaseApp
	 * @extends {Object}
	 */
	function BaseApp() {}

	BaseApp.extend = rt.Class.extend;

	Object.assign(BaseApp.prototype, /** @lends Rift.BaseApp# */{
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

			this.viewState = new ViewState(collectViewStateProperties(viewState, router.routes));

			router.route(path);

			if (isClient) {
				this.viewState.updateFromSerializedData(viewStateData);
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
