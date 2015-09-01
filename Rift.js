(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("superagent"));
	else if(typeof define === 'function' && define.amd)
		define(["superagent"], factory);
	else if(typeof exports === 'object')
		exports["Rift"] = factory(require("superagent"));
	else
		root["Rift"] = factory(root["superagent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_8__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var cellx = __webpack_require__(1);

	exports.nextTick = cellx.nextTick;
	exports.EventEmitter = cellx.EventEmitter;
	exports.ActiveMap = cellx.ActiveMap;
	exports.map = cellx.map;
	exports.ActiveList = cellx.ActiveList;
	exports.list = cellx.list;
	exports.Cell = cellx.Cell;
	exports.cellx = exports.cell = cellx;

	exports.env = __webpack_require__(2);
	exports.uid = __webpack_require__(3);
	exports.object = __webpack_require__(4);
	exports.regex = __webpack_require__(5);

	var Class = exports.Class = __webpack_require__(6);
	cellx.EventEmitter.extend = Class.extend;

	exports.proxy = __webpack_require__(7);

	exports.Disposable = __webpack_require__(9);
	exports.BaseModel = __webpack_require__(10);

	exports.domBinding = __webpack_require__(11);

	var BaseView = __webpack_require__(12);

	exports.viewClasses = BaseView.viewClasses;
	exports.registerViewClass = BaseView.registerViewClass;
	exports.BaseView = BaseView;

	exports.templateRuntime = __webpack_require__(13);

	exports.ViewList = __webpack_require__(14);
	exports.ViewSwitch = __webpack_require__(15);

	exports.Router = __webpack_require__(16);
	exports.BaseApp = __webpack_require__(17);

	exports.d = __webpack_require__(18);

	exports.rt = exports;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function(undefined) {
		'use strict';

		var hasOwn = Object.prototype.hasOwnProperty;
		var toString = Object.prototype.toString;
		var push = Array.prototype.push;
		var slice = Array.prototype.slice;
		var splice = Array.prototype.splice;

		var global = Function('return this;')();

		var invokeCell;

		/**
		 * @typesign (value?, opts?: {
		 *     read?: (value): *,
		 *     validate?: (value): *,
		 *     computed?: false
		 * }): cellx;
		 *
		 * @typesign (formula: (): *, opts?: {
		 *     read?: (value): *,
		 *     write?: (value),
		 *     validate?: (value): *,
		 *     computed?: true
		 * }): cellx;
		 */
		function cellx(value, opts) {
			if (!opts) {
				opts = {};
			}

			var initialValue = value;

			function cell(value) {
				return invokeCell(cell, initialValue, opts, this, value, slice.call(arguments, 1), arguments.length);
			}
			cell.constructor = cellx;

			return cell;
		}

		if (true) {
			if (true) {
				module.exports = cellx;
			} else {
				exports.cellx = cellx;
			}
		} else {
			global.cellx = cellx;
		}

		var KEY_UID = '__cellx_uid__';
		var KEY_CELLS = '__cellx_cells__';

		if (global.Symbol && typeof Symbol.iterator == 'symbol') {
			KEY_UID = Symbol(KEY_UID);
			KEY_CELLS = Symbol(KEY_CELLS);
		}

		cellx.KEY_UID = KEY_UID;
		cellx.KEY_CELLS = KEY_CELLS;

		var uidCounter = 0;

		/**
		 * @typesign (fn: Function): boolean;
		 */
		function isNative(fn) {
			return fn.toString().indexOf('[native code]') != -1;
		}

		/**
		 * @typesign (err);
		 */
		var logError;

		if (global.console) {
			if (console.error) {
				logError = function(err) {
					console.error(err === Object(err) && err.stack || err);
				};
			} else {
				logError = function(err) {
					console.log('!!! ' + (err === Object(err) && err.stack || err));
				};
			}
		} else {
			logError = function() {};
		}

		cellx.logError = logError;

		/**
		 * @typesign (child: Function, parent: Function): Function;
		 */
		function extend(child, parent) {
			function F() {
				this.constructor = child;
			}
			F.prototype = parent.prototype;

			child.prototype = new F();
			return child;
		}

		/**
		 * @typesign (proto: Object): Object;
		 */
		var create = Object.create || function(proto) {
			function F() {}
			F.prototype = proto;
			return new F();
		};

		/**
		 * @typesign (target: Object, source: Object): Object;
		 */
		var assign = Object.assign || function assign(target, source) {
			for (var name in source) {
				if (hasOwn.call(source, name)) {
					target[name] = source[name];
				}
			}

			return target;
		};

		/**
		 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
		 * @typesign (a, b): boolean;
		 */
		var is = Object.is || function(a, b) {
			return a === b || (a != a && b != b);
		};

		/**
		 * @typesign (value): boolean;
		 */
		var isArray = Array.isArray || function(value) {
			return toString.call(value) == '[object Array]';
		};

		// gulp-include
		(function() {
			/**
			 * @class cellx.Dictionary
			 * @typesign new (): cellx.Dictionary;
			 */
			var Dictionary;
		
			if (isNative(create)) {
				Dictionary = function() {
					return create(null);
				};
			} else {
				// IE8
				Dictionary = function() {
					var iframe = document.createElement('iframe');
					var container = document.body || document.documentElement;
		
					iframe.style.display = 'none';
					container.appendChild(iframe);
					iframe.src = 'javascript:';
		
					var empty = iframe.contentWindow.Object.prototype;
		
					container.removeChild(iframe);
					iframe = null;
		
					delete empty.constructor;
					delete empty.isPrototypeOf;
					delete empty.hasOwnProperty;
					delete empty.propertyIsEnumerable;
					delete empty.valueOf;
					delete empty.toString;
					delete empty.toLocaleString;
		
					Dictionary = function() {};
					Dictionary.prototype = empty;
		
					return new Dictionary();
				};
			}
		
			cellx.Dictionary = Dictionary;
		})();
		
		(function() {
			var Map = global.Map;
		
			if (!Map) {
				var Dictionary = cellx.Dictionary;
		
				var entryStub = { value: undefined };
		
				Map = function Map(entries) {
					this._entries = new Dictionary();
					this._objectStamps = {};
		
					this._first = null;
					this._last = null;
		
					this.size = 0;
		
					if (entries) {
						for (var i = 0, l = entries.length; i < l; i++) {
							this.set(entries[i][0], entries[i][1]);
						}
					}
				};
		
				assign(Map.prototype, {
					has: function(key) {
						return !!this._entries[this._getValueStamp(key)];
					},
		
					get: function(key) {
						return (this._entries[this._getValueStamp(key)] || entryStub).value;
					},
		
					set: function(key, value) {
						var entries = this._entries;
						var keyStamp = this._getValueStamp(key);
		
						if (entries[keyStamp]) {
							entries[keyStamp].value = value;
						} else {
							var entry = entries[keyStamp] = {
								key: key,
								keyStamp: keyStamp,
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
		
					'delete': function(key) {
						var keyStamp = this._getValueStamp(key);
						var entry = this._entries[keyStamp];
		
						if (!entry) {
							return false;
						}
		
						if (--this.size) {
							var prev = entry.prev;
							var next = entry.next;
		
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
		
						delete this._entries[keyStamp];
						delete this._objectStamps[keyStamp];
		
						return true;
					},
		
					clear: function() {
						var entries = this._entries;
		
						for (var stamp in entries) {
							delete entries[stamp];
						}
		
						this._objectStamps = {};
		
						this._first = null;
						this._last = null;
		
						this.size = 0;
					},
		
					_getValueStamp: function(value) {
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
		
						return this._getObjectStamp(value);
					},
		
					_getObjectStamp: (function() {
						// for non-extensible objects and IE8
						function getObjectStamp(obj) {
							var stamps = this._objectStamps;
							var stamp;
		
							for (stamp in stamps) {
								if (stamps[stamp] == obj) {
									return stamp;
								}
							}
		
							stamp = String(++uidCounter);
							stamps[stamp] = obj;
							return stamp;
						}
		
						if (
							Object.defineProperty && isNative(Object.defineProperty) &&
								Object.isExtensible && isNative(Object.isExtensible)
						) {
							return function(obj) {
								if (!hasOwn.call(obj, KEY_UID)) {
									if (!Object.isExtensible(obj)) {
										return getObjectStamp.call(this, obj);
									}
		
									Object.defineProperty(obj, KEY_UID, {
										value: String(++uidCounter)
									});
								}
		
								return obj[KEY_UID];
							};
						}
		
						return getObjectStamp;
					})(),
		
					forEach: function(cb, context) {
						if (context == null) {
							context = global;
						}
		
						var entry = this._first;
		
						while (entry) {
							cb.call(context, entry.value, entry.key, this);
		
							do {
								entry = entry.next;
							} while (entry && !this._entries[entry.keyStamp]);
						}
					},
		
					toString: function() {
						return '[object Map]';
					}
				});
		
				var iterators = [
					['keys', function(entry) {
						return entry.key;
					}],
					['values', function(entry) {
						return entry.value;
					}],
					['entries', function(entry) {
						return [entry.key, entry.value];
					}]
				];
		
				for (var i = 0, l = iterators.length; i < l; i++) {
					Map.prototype[iterators[i][0]] = (function(getStepValue) {
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
											} while (entry && !entries[entry.keyStamp]);
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
					})(iterators[i][1]);
				}
			}
		
			cellx.Map = Map;
		})();
		
		(function() {
			/**
			 * @example
			 * nextTick(function() {
			 *     console.log('nextTick');
			 * });
			 *
			 * @typesign (cb: ());
			 */
			var nextTick;
		
			if (global.process && process.toString() == '[object process]' && process.nextTick) {
				nextTick = process.nextTick;
			} else if (global.setImmediate) {
				nextTick = function(cb) {
					setImmediate(cb);
				};
			} else if (global.Promise && isNative(Promise)) {
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
								cellx.logError(err);
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
		
			cellx.nextTick = nextTick;
		})();
		
		/**
		 * @typedef {{ target?: Object, type: string }} cellx~Event
		 */
		
		(function() {
			var Dictionary = cellx.Dictionary;
		
			var KEY_INNER = '__cellx_EventEmitter_inner__';
		
			if (global.Symbol && typeof Symbol.iterator == 'symbol') {
				KEY_INNER = Symbol(KEY_INNER);
			}
		
			/**
			 * @class cellx.EventEmitter
			 * @extends {Object}
			 * @typesign new (): cellx.EventEmitter;
			 */
			function EventEmitter() {
				/**
				 * @type {cellx.EventEmitter}
				 */
				this.parent = null;
		
				/**
				 * @type {cellx.Dictionary<Array<{ listener: (evt: cellx~Event): boolean|undefined, context: Object }>>}
				 */
				this._events = new Dictionary();
			}
		
			EventEmitter.KEY_INNER = KEY_INNER;
		
			assign(EventEmitter.prototype, {
				/**
				 * @typesign (
				 *     type: string,
				 *     listener: (evt: cellx~Event): boolean|undefined,
				 *     context?: Object
				 * ): cellx.EventEmitter;
				 *
				 * @typesign (
				 *     listeners: Object<(evt: cellx~Event): boolean|undefined>,
				 *     context?: Object
				 * ): cellx.EventEmitter;
				 */
				on: function(type, listener, context) {
					if (typeof type == 'object') {
						context = listener;
		
						var listeners = type;
		
						for (type in listeners) {
							this._on(type, listeners[type], context);
						}
					} else {
						this._on(type, listener, context);
					}
		
					return this;
				},
				/**
				 * @typesign (
				 *     type: string,
				 *     listener: (evt: cellx~Event): boolean|undefined,
				 *     context?: Object
				 * ): cellx.EventEmitter;
				 *
				 * @typesign (
				 *     listeners: Object<(evt: cellx~Event): boolean|undefined>,
				 *     context?: Object
				 * ): cellx.EventEmitter;
				 *
				 * @typesign (): cellx.EventEmitter;
				 */
				off: function(type, listener, context) {
					if (type) {
						if (typeof type == 'object') {
							context = listener;
		
							var listeners = type;
		
							for (type in listeners) {
								this._off(type, listeners[type], context);
							}
						} else {
							this._off(type, listener, context);
						}
					} else if (this._events) {
						this._events = new Dictionary();
					}
		
					return this;
				},
		
				/**
				 * @typesign (
				 *     type: string,
				 *     listener: (evt: cellx~Event): boolean|undefined,
				 *     context?: Object
				 * );
				 */
				_on: function(type, listener, context) {
					var events = (this._events || (this._events = new Dictionary()))[type];
		
					if (!events) {
						events = this._events[type] = [];
					}
		
					events.push({
						listener: listener,
						context: context || this
					});
				},
				/**
				 * @typesign (
				 *     type: string,
				 *     listener: (evt: cellx~Event): boolean|undefined,
				 *     context?: Object
				 * );
				 */
				_off: function(type, listener, context) {
					var events = this._events && this._events[type];
		
					if (!events) {
						return;
					}
		
					if (!context) {
						context = this;
					}
		
					for (var i = events.length; i;) {
						if (events[--i].context == context) {
							var lst = events[i].listener;
		
							if (lst == listener || lst[KEY_INNER] === listener) {
								events.splice(i, 1);
								break;
							}
						}
					}
		
					if (!events.length) {
						delete this._events[type];
					}
				},
		
				/**
				 * @typesign (
				 *     type: string,
				 *     listener: (evt: cellx~Event): boolean|undefined,
				 *     context?: Object
				 * ): cellx.EventEmitter;
				 */
				once: function(type, listener, context) {
					function wrapper() {
						this._off(type, wrapper, context);
						return listener.apply(this, arguments);
					}
					wrapper[KEY_INNER] = listener;
		
					this._on(type, wrapper, context);
		
					return this;
				},
		
				/**
				 * @typesign (evt: { type: string }): cellx~Event;
				 * @typesign (type: string): cellx~Event;
				 */
				emit: function(evt) {
					if (typeof evt == 'string') {
						evt = {
							target: this,
							type: evt
						};
					} else if (evt.target === undefined) {
						evt.target = this;
					}
		
					this._handleEvent(evt);
		
					return evt;
				},
		
				/**
				 * @typesign (evt: { target: cellx.EventEmitter, type: string });
				 */
				_handleEvent: function(evt) {
					var events = this._events && this._events[evt.type];
		
					if (events) {
						events = events.slice();
		
						for (var i = 0, l = events.length; i < l; i++) {
							try {
								if (events[i].listener.call(events[i].context, evt) === false) {
									evt.isPropagationStopped = true;
								}
							} catch (err) {
								this._logError(err);
							}
						}
					}
		
					if (this.parent && evt.bubbles !== false && !evt.isPropagationStopped) {
						this.parent._handleEvent(evt);
					}
				},
		
				/**
				 * @typesign (err);
				 */
				_logError: function(err) {
					cellx.logError(err);
				}
			});
		
			cellx.EventEmitter = EventEmitter;
		})();
		
		var MActiveCollection;
		
		(function() {
			var EventEmitter = cellx.EventEmitter;
		
			MActiveCollection = {
				/**
				 * @typesign (evt: cellx~Event);
				 */
				_onItemChange: function(evt) {
					this._handleEvent(evt);
				},
		
				/**
				 * @typesign (value);
				 */
				_registerValue: function(value) {
					var valueCounts = this._valueCounts;
					var valueCount = valueCounts.get(value);
		
					if (valueCount) {
						valueCounts.set(value, valueCount + 1);
					} else {
						valueCounts.set(value, 1);
		
						if (this.adoptsItemChanges && value instanceof EventEmitter) {
							value.on('change', this._onItemChange, this);
						}
					}
				},
		
				/**
				 * @typesign (value);
				 */
				_unregisterValue: function(value) {
					var valueCounts = this._valueCounts;
					var valueCount = valueCounts.get(value);
		
					if (valueCount > 1) {
						valueCounts.set(value, valueCount - 1);
					} else {
						valueCounts['delete'](value);
		
						if (this.adoptsItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange, this);
						}
					}
				},
		
				/**
				 * Уничтожает инстанс освобождая занятые им ресурсы.
				 * @typesign ();
				 */
				dispose: function() {
					if (this.adoptsItemChanges) {
						var onItemChange = this._onItemChange;
		
						this._valueCounts.forEach(function(value) {
							if (value instanceof EventEmitter) {
								value.off('change', onItemChange, this);
							}
						}, this);
					}
				}
			};
		})();
		
		(function() {
			var Map = cellx.Map;
		
			/**
			 * @class cellx.ActiveMap
			 * @extends {cellx.EventEmitter}
			 *
			 * @typesign new (entries?: Object|Array<{ 0, 1 }>|cellx.ActiveMap, opts?: {
			 *     adoptsItemChanges: boolean = true
			 * }): cellx.ActiveMap;
			 */
			function ActiveMap(entries, opts) {
				this._entries = new Map();
				/**
				 * @type {Map<*, uint>}
				 */
				this._valueCounts = new Map();
		
				this.size = 0;
		
				/**
				 * @type {boolean}
				 */
				this.adoptsItemChanges = !opts || opts.adoptsItemChanges !== false;
		
				if (entries) {
					var thisEntries = this._entries;
		
					if (entries instanceof ActiveMap) {
						entries._entries.forEach(function(value, key) {
							thisEntries.set(key, value);
							this._registerValue(value);
						}, this);
					} else if (isArray(entries)) {
						for (var i = 0, l = entries.length; i < l; i++) {
							var entry = entries[i];
		
							thisEntries.set(entry[0], entry[1]);
							this._registerValue(entry[1]);
						}
					} else {
						for (var key in entries) {
							thisEntries.set(key, entries[key]);
							this._registerValue(entries[key]);
						}
					}
		
					this.size = thisEntries.size;
				}
			}
			extend(ActiveMap, cellx.EventEmitter);
		
			assign(ActiveMap.prototype, MActiveCollection);
			assign(ActiveMap.prototype, {
				/**
				 * @typesign (key): boolean;
				 */
				has: function(key) {
					return this._entries.has(key);
				},
		
				/**
				 * @typesign (value): boolean;
				 */
				contains: function(value) {
					return this._valueCounts.has(value);
				},
		
				/**
				 * @typesign (key): *;
				 */
				get: function(key) {
					return this._entries.get(key);
				},
		
				/**
				 * @typesign (key, value): cellx.ActiveMap;
				 */
				set: function(key, value) {
					var entries = this._entries;
					var hasKey = entries.has(key);
					var oldValue;
		
					if (hasKey) {
						oldValue = entries.get(key);
		
						if (is(oldValue, value)) {
							return this;
						}
		
						this._unregisterValue(oldValue);
					}
		
					entries.set(key, value);
					this._registerValue(value);
		
					if (!hasKey) {
						this.size++;
					}
		
					this.emit({
						type: 'change',
						subtype: hasKey ? 'update' : 'add',
						key: key,
						oldValue: oldValue,
						value: value
					});
		
					return this;
				},
		
				/**
				 * @typesign (key): boolean;
				 */
				'delete': function(key) {
					var entries = this._entries;
		
					if (!entries.has(key)) {
						return false;
					}
		
					var value = entries.get(key);
		
					entries['delete'](key);
					this._unregisterValue(value);
		
					this.size--;
		
					this.emit({
						type: 'change',
						subtype: 'delete',
						key: key,
						oldValue: value,
						value: undefined
					});
		
					return true;
				},
		
				/**
				 * @typesign (): cellx.ActiveMap;
				 */
				clear: function() {
					if (!this.size) {
						return this;
					}
		
					this._entries.clear();
					this._valueCounts.clear();
					this.size = 0;
		
					this.emit({
						type: 'change',
						subtype: 'clear'
					});
		
					return this;
				},
		
				/**
				 * @typesign (cb: (value, key, map: cellx.ActiveMap), context?: Object);
				 */
				forEach: function(cb, context) {
					if (context == null) {
						context = global;
					}
		
					this._entries.forEach(function(value, key) {
						cb.call(context, value, key, this);
					}, this);
				},
		
				/**
				 * @typesign (): { next: (): { value, done: boolean } };
				 */
				keys: function() {
					return this._entries.keys();
				},
		
				/**
				 * @typesign (): { next: (): { value, done: boolean } };
				 */
				values: function() {
					return this._entries.values();
				},
		
				/**
				 * @typesign (): { next: (): { value: { 0, 1 }, done: boolean } };
				 */
				entries: function() {
					return this._entries.entries();
				},
		
				/**
				 * @typesign (): cellx.ActiveMap;
				 */
				clone: function() {
					return new this.constructor(this, {
						adoptsItemChanges: this.adoptsItemChanges
					});
				}
			});
		
			cellx.ActiveMap = ActiveMap;
		
			/**
			 * @typesign (entries?: Object|Array<{ 0, 1 }>|cellx.ActiveMap, opts?: {
			 *     adoptsItemChanges: boolean = true
			 * }): cellx.ActiveMap;
			 *
			 * @typesign (entries?: Object|Array<{ 0, 1 }>|cellx.ActiveMap, adoptsItemChanges: boolean = true): cellx.ActiveMap;
			 */
			function map(entries, opts) {
				return new ActiveMap(entries, typeof opts == 'boolean' ? { adoptsItemChanges: opts } : opts);
			}
		
			cellx.map = map;
		})();
		
		(function() {
			var Map = cellx.Map;
		
			var arrayProto = Array.prototype;
		
			/**
			 * @typesign (a, b): enum[-1, 1, 0];
			 */
			function defaultComparator(a, b) {
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			}
		
			/**
			 * @typesign (list: cellx.ActiveList, items: Array);
			 */
			function addRange(list, items) {
				var listItems = list._items;
		
				if (list.sorted) {
					var comparator = list.comparator;
		
					for (var i = 0, l = items.length; i < l; i++) {
						var item = items[i];
						var low = 0;
						var high = listItems.length;
		
						while (low != high) {
							var mid = (low + high) >> 1;
		
							if (comparator(item, listItems[mid]) < 0) {
								high = mid;
							} else {
								low = mid + 1;
							}
						}
		
						listItems.splice(low, 0, item);
						list._registerValue(item);
					}
				} else {
					push.apply(listItems, items);
		
					for (var j = items.length; j;) {
						list._registerValue(items[--j]);
					}
				}
		
				list.length = listItems.length;
			}
		
			/**
			 * @class cellx.ActiveList
			 * @extends {cellx.EventEmitter}
			 *
			 * @typesign new (items?: Array|cellx.ActiveList, opts?: {
			 *     adoptsItemChanges: boolean = true,
			 *     comparator?: (a, b): int,
			 *     sorted?: boolean
			 * }): cellx.ActiveList;
			 */
			function ActiveList(items, opts) {
				if (!opts) {
					opts = {};
				}
		
				this._items = [];
				/**
				 * @type {Map<*, uint>}
				 */
				this._valueCounts = new Map();
		
				this.length = 0;
		
				/**
				 * @type {boolean}
				 */
				this.adoptsItemChanges = opts.adoptsItemChanges !== false;
		
				/**
				 * @type {?Function}
				 */
				this.comparator = null;
		
				this.sorted = false;
		
				if (opts.sorted || (opts.comparator && opts.sorted !== false)) {
					this.comparator = opts.comparator || defaultComparator;
					this.sorted = true;
				}
		
				if (items) {
					addRange(this, items instanceof ActiveList ? items._items : items);
				}
			}
			extend(ActiveList, cellx.EventEmitter);
		
			assign(ActiveList.prototype, MActiveCollection);
			assign(ActiveList.prototype, {
				/**
				 * @typesign (index: int, endIndex: boolean = false): uint|undefined;
				 */
				_validateIndex: function(index, endIndex) {
					if (index === undefined) {
						return index;
					}
		
					if (index < 0) {
						index += this.length;
		
						if (index < 0) {
							throw new RangeError('Index out of range');
						}
					} else if (index >= (this.length + (endIndex ? 1 : 0))) {
						throw new RangeError('Index out of range');
					}
		
					return index;
				},
		
				/**
				 * @typesign (value): boolean;
				 */
				contains: function(value) {
					return this._valueCounts.has(value);
				},
		
				/**
				 * @typesign (value, fromIndex: int = 0): int;
				 */
				indexOf: function(value, fromIndex) {
					return this._items.indexOf(value, this._validateIndex(fromIndex));
				},
		
				/**
				 * @typesign (value, fromIndex: int = -1): int;
				 */
				lastIndexOf: function(value, fromIndex) {
					return this._items.lastIndexOf(value, this._validateIndex(fromIndex));
				},
		
				/**
				 * @typesign (index: int): *;
				 */
				get: function(index) {
					return this._items[this._validateIndex(index)];
				},
		
				/**
				 * @typesign (index: int = 0, count?: uint): Array;
				 */
				getRange: function(index, count) {
					index = this._validateIndex(index || 0, true);
		
					var items = this._items;
		
					if (count === undefined) {
						return items.slice(index);
					}
		
					if (index + count > items.length) {
						throw new RangeError('"index" and "count" do not denote a valid range');
					}
		
					return items.slice(index, index + count);
				},
		
				/**
				 * @typesign (index: int, value): cellx.ActiveList;
				 */
				set: function(index, value) {
					if (this.sorted) {
						throw new TypeError('Can\'t set to sorted list');
					}
		
					index = this._validateIndex(index);
		
					var items = this._items;
		
					if (is(items[index], value)) {
						return this;
					}
		
					this._unregisterValue(items[index]);
		
					items[index] = value;
					this._registerValue(value);
		
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (index: int, items: Array): cellx.ActiveList;
				 */
				setRange: function(index, items) {
					if (this.sorted) {
						throw new TypeError('Can\'t set to sorted list');
					}
		
					index = this._validateIndex(index);
		
					var itemCount = items.length;
		
					if (!itemCount) {
						return this;
					}
		
					if (index + itemCount > this.length) {
						throw new RangeError('"index" and length of "items" do not denote a valid range');
					}
		
					var thisItems = this._items;
					var changed = false;
		
					for (var i = index + itemCount; i > index;) {
						var item = items[--i];
		
						if (!is(thisItems[i], item)) {
							this._unregisterValue(thisItems[i]);
		
							thisItems[i] = item;
							this._registerValue(item);
		
							changed = true;
						}
					}
		
					if (changed) {
						this.emit('change');
					}
		
					return this;
				},
		
				/**
				 * @typesign (item): cellx.ActiveList;
				 */
				add: function(item) {
					this.addRange([item]);
					return this;
				},
		
				/**
				 * @typesign (items: Array): cellx.ActiveList;
				 */
				addRange: function(items) {
					if (!items.length) {
						return this;
					}
		
					addRange(this, items);
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (index: int, item): cellx.ActiveList;
				 */
				insert: function(index, item) {
					this.insertRange(index, [item]);
					return this;
				},
		
				/**
				 * @typesign (index: int, items: Array): cellx.ActiveList;
				 */
				insertRange: function(index, items) {
					if (this.sorted) {
						throw new TypeError('Can\'t insert to sorted list');
					}
		
					index = this._validateIndex(index, true);
		
					var itemCount = items.length;
		
					if (!itemCount) {
						return this;
					}
		
					splice.apply(this._items, [].concat(index, 0, items));
		
					for (var i = itemCount; i;) {
						this._registerValue(items[--i]);
					}
		
					this.length += itemCount;
		
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (item, fromIndex: int = 0): cellx.ActiveList;
				 */
				remove: function(item, fromIndex) {
					var index = this._items.indexOf(item, this._validateIndex(fromIndex));
		
					if (index == -1) {
						return this;
					}
		
					this._items.splice(index, 1);
					this._unregisterValue(item);
		
					this.length--;
		
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (item, fromIndex: int = 0): cellx.ActiveList;
				 */
				removeAll: function(item, fromIndex) {
					var items = this._items;
					var index = this._validateIndex(fromIndex);
					var changed = false;
		
					while ((index = items.indexOf(item, index)) != -1) {
						items.splice(index, 1);
						this._unregisterValue(item);
		
						changed = true;
					}
		
					if (changed) {
						this.length = items.length;
						this.emit('change');
					}
		
					return this;
				},
		
				/**
				 * @typesign (index: int): cellx.ActiveList;
				 */
				removeAt: function(index) {
					this._unregisterValue(this._items.splice(this._validateIndex(index), 1)[0]);
					this.length--;
		
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (index: int = 0, count?: uint): cellx.ActiveList;
				 */
				removeRange: function(index, count) {
					index = this._validateIndex(index || 0, true);
		
					var items = this._items;
		
					if (count === undefined) {
						count = items.length - index;
					} else if (index + count > items.length) {
						throw new RangeError('"index" and "count" do not denote a valid range');
					}
		
					if (!count) {
						return this;
					}
		
					for (var i = index + count; i > index;) {
						this._unregisterValue(items[--i]);
					}
					items.splice(index, count);
		
					this.length -= count;
		
					this.emit('change');
		
					return this;
				},
		
				/**
				 * @typesign (): cellx.ActiveList;
				 */
				clear: function() {
					if (this.length) {
						this._items.length = 0;
						this._valueCounts.clear();
		
						this.length = 0;
		
						this.emit('change');
					}
		
					return this;
				},
		
				/**
				 * @typesign (separator: string = ','): string;
				 */
				join: function(separator) {
					return this._items.join(separator);
				},
		
				/**
				 * @typesign (cb: (item, index: uint, arr: cellx.ActiveList), context: Object = global);
				 */
				forEach: null,
		
				/**
				 * @typesign (cb: (item, index: uint, arr: cellx.ActiveList): *, context: Object = global): Array;
				 */
				map: null,
		
				/**
				 * @typesign (cb: (item, index: uint, arr: cellx.ActiveList): boolean, context: Object = global): Array;
				 */
				filter: null,
		
				/**
				 * @typesign (cb: (item, index: uint, arr: cellx.ActiveList): boolean, context: Object = global): boolean;
				 */
				every: null,
		
				/**
				 * @typesign (cb: (item, index: uint, arr: cellx.ActiveList): boolean, context: Object = global): boolean;
				 */
				some: null,
		
				/**
				 * @typesign (cb: (accumulator: *, item, index: uint, arr: cellx.ActiveList): *, initialValue?): *;
				 */
				reduce: null,
		
				/**
				 * @typesign (cb: (accumulator: *, item, index: uint, arr: cellx.ActiveList): *, initialValue?): *;
				 */
				reduceRight: null,
		
				/**
				 * @typesign (): cellx.ActiveList;
				 */
				clone: function() {
					return new this.constructor(this, {
						adoptsItemChanges: this.adoptsItemChanges,
						comparator: this.comparator,
						sorted: this.sorted
					});
				},
		
				/**
				 * @typesign (): Array;
				 */
				toArray: function() {
					return this._items.slice();
				},
		
				/**
				 * @typesign (): string;
				 */
				toString: function() {
					return this._items.join();
				}
			});
		
			var methods = ['forEach', 'map', 'filter', 'every', 'some', 'reduce', 'reduceRight'];
		
			for (var i = methods.length; i;) {
				(function(name) {
					ActiveList.prototype[name] = function() {
						return arrayProto[name].apply(this._items, arguments);
					};
				})(methods[--i]);
			}
		
			cellx.ActiveList = ActiveList;
		
			/**
			 * @typesign (items?: Array|cellx.ActiveList, opts?: {
			 *     adoptsItemChanges: boolean = true,
			 *     comparator?: (a, b): int,
			 *     sorted?: boolean
			 * }): cellx.ActiveList;
			 *
			 * @typesign (items?: Array|cellx.ActiveList, adoptsItemChanges: boolean = true): cellx.ActiveList;
			 */
			function list(items, opts) {
				return new ActiveList(items, typeof opts == 'boolean' ? { adoptsItemChanges: opts } : opts);
			}
		
			cellx.list = list;
		})();
		
		(function() {
			var nextTick = cellx.nextTick;
			var EventEmitter = cellx.EventEmitter;
		
			var KEY_INNER = EventEmitter.KEY_INNER;
		
			var error = {
				original: null
			};
		
			var currentlyRelease = false;
		
			/**
			 * @type {Array<Array<cellx.Cell>|null>}
			 */
			var releasePlan = [[]];
		
			var releasePlanIndex = 0;
			var maxLevel = -1;
		
			var calculatedCell = null;
		
			var releaseVersion = 1;
		
			function release() {
				if (releasePlanIndex > maxLevel) {
					return;
				}
		
				currentlyRelease = true;
		
				do {
					var bundle = releasePlan[releasePlanIndex];
		
					if (bundle) {
						var cell = bundle.shift();
		
						if (releasePlanIndex) {
							var index = releasePlanIndex;
		
							cell._recalc();
		
							if (!releasePlan[index].length) {
								releasePlan[index] = null;
		
								if (releasePlanIndex) {
									releasePlanIndex++;
								}
							}
						} else {
							var changeEvent = cell._changeEvent;
		
							cell._fixedValue = cell._value;
							cell._changeEvent = null;
		
							cell._changed = true;
		
							if (cell._events.change) {
								cell._handleEvent(changeEvent);
							}
		
							var slaves = cell._slaves;
		
							for (var i = slaves.length; i;) {
								var slave = slaves[--i];
		
								if (slave._fixed) {
									(releasePlan[1] || (releasePlan[1] = [])).push(slave);
		
									if (!maxLevel) {
										maxLevel = 1;
									}
		
									slave._fixed = false;
								}
							}
		
							if (!releasePlan[0].length) {
								releasePlanIndex++;
							}
						}
					} else {
						releasePlanIndex++;
					}
				} while (releasePlanIndex <= maxLevel);
		
				maxLevel = -1;
		
				releaseVersion++;
		
				currentlyRelease = false;
			}
		
			/**
			 * @class cellx.Cell
			 * @extends {cellx.EventEmitter}
			 *
			 * @example
			 * var a = new Cell(1);
			 * var b = new Cell(2);
			 * var c = new Cell(function() {
			 *     return a.read() + b.read();
			 * });
			 *
			 * c.on('change', function() {
			 *     console.log('c = ' + c.read());
			 * });
			 *
			 * console.log(c.read());
			 * // => 3
			 *
			 * a.write(5);
			 * b.write(10);
			 * // => 'c = 15'
			 *
			 * @typesign new (value?, opts?: {
			 *     owner?: Object,
			 *     read?: (value): *,
			 *     validate?: (value): *,
			 *     onchange?: (evt: cellx~Event): boolean|undefined,
			 *     onerror?: (evt: cellx~Event): boolean|undefined,
			 *     computed?: false
			 * }): cellx.Cell;
			 *
			 * @typesign new (formula: (): *, opts?: {
			 *     owner?: Object,
			 *     read?: (value): *,
			 *     write?: (value),
			 *     validate?: (value): *,
			 *     onchange?: (evt: cellx~Event): boolean|undefined,
			 *     onerror?: (evt: cellx~Event): boolean|undefined,
			 *     computed?: true
			 * }): cellx.Cell;
			 */
			function Cell(value, opts) {
				EventEmitter.call(this);
		
				if (!opts) {
					opts = {};
				}
		
				this.owner = opts.owner || null;
		
				this.computed = typeof value == 'function' &&
					(opts.computed !== undefined ? opts.computed : value.constructor == Function);
		
				this._value = undefined;
				this._fixedValue = undefined;
				this.initialValue = undefined;
				this._formula = null;
		
				this._read = opts.read || null;
				this._write = opts.write || null;
		
				this._validate = opts.validate || null;
		
				/**
				 * Ведущие ячейки.
				 * @type {?Array<cellx.Cell>}
				 */
				this._masters = null;
				/**
				 * Ведомые ячейки.
				 * @type {Array<cellx.Cell>}
				 */
				this._slaves = [];
		
				/**
				 * @type {uint|undefined}
				 */
				this._level = 0;
		
				this._active = !this.computed;
		
				this._changeEvent = null;
				this._isChangeCancellable = true;
		
				this._lastErrorEvent = null;
		
				this._fixed = true;
		
				this._version = 0;
		
				this._changed = false;
		
				this._circularityCounter = 0;
		
				if (this.computed) {
					this._formula = value;
				} else {
					if (this._validate) {
						this._validate.call(this.owner || this, value);
					}
		
					this._value = this._fixedValue = this.initialValue = value;
		
					if (value instanceof EventEmitter) {
						value.on('change', this._onValueChange, this);
					}
				}
		
				if (opts.onchange) {
					this.on('change', opts.onchange);
				}
				if (opts.onerror) {
					this.on('error', opts.onerror);
				}
			}
			extend(Cell, EventEmitter);
		
			assign(Cell.prototype, {
				/**
				 * @typesign (): boolean;
				 */
				changed: function() {
					if (!currentlyRelease) {
						release();
					}
		
					return this._changed;
				},
		
				/**
				 * @override cellx.EventEmitter#on
				 */
				on: function(type, listener, context) {
					if (!currentlyRelease) {
						release();
					}
		
					if (this.computed && !this._events.change && !this._slaves.length) {
						this._activate();
					}
		
					EventEmitter.prototype.on.call(this, type, listener, context);
		
					return this;
				},
				/**
				 * @override cellx.EventEmitter#off
				 */
				off: function(type, listener, context) {
					if (!currentlyRelease) {
						release();
					}
		
					EventEmitter.prototype.off.call(this, type, listener, context);
		
					if (this.computed && !this._events.change && !this._slaves.length) {
						this._deactivate();
					}
		
					return this;
				},
		
				/**
				 * @override cellx.EventEmitter#_on
				 */
				_on: function(type, listener, context) {
					EventEmitter.prototype._on.call(this, type, listener, context || this.owner);
				},
				/**
				 * @override cellx.EventEmitter#_off
				 */
				_off: function(type, listener, context) {
					EventEmitter.prototype._off.call(this, type, listener, context || this.owner);
				},
		
				/**
				 * @typesign (listener: (err: Error, evt: cellx~Event): boolean|undefined): cellx.Cell;
				 */
				subscribe: function(listener) {
					function wrapper(evt) {
						return listener.call(this, evt.error || null, evt);
					}
					wrapper[KEY_INNER] = listener;
		
					this
						.on('change', wrapper)
						.on('error', wrapper);
		
					return this;
				},
				/**
				 * @typesign (listener: (err: Error, evt: cellx~Event): boolean|undefined): cellx.Cell;
				 */
				unsubscribe: function(listener) {
					this
						.off('change', listener)
						.off('error', listener);
		
					return this;
				},
		
				/**
				 * @typesign (slave: cellx.Cell);
				 */
				_registerSlave: function(slave) {
					if (this.computed && !this._events.change && !this._slaves.length) {
						this._activate();
					}
		
					this._slaves.push(slave);
				},
				/**
				 * @typesign (slave: cellx.Cell);
				 */
				_unregisterSlave: function(slave) {
					this._slaves.splice(this._slaves.indexOf(slave), 1);
		
					if (this.computed && !this._events.change && !this._slaves.length) {
						this._deactivate();
					}
				},
		
				/**
				 * @typesign ();
				 */
				_activate: function() {
					if (this._version != releaseVersion) {
						this._masters = null;
						this._level = 0;
		
						var value = this._tryFormula();
		
						if (value === error) {
							this._handleError(error.original);
						} else if (!is(this._value, value)) {
							this._value = value;
							this._changed = true;
						}
		
						this._version = releaseVersion;
					}
		
					var masters = this._masters || [];
		
					for (var i = masters.length; i;) {
						masters[--i]._registerSlave(this);
					}
		
					this._active = true;
				},
				/**
				 * @typesign ();
				 */
				_deactivate: function() {
					var masters = this._masters || [];
		
					for (var i = masters.length; i;) {
						masters[--i]._unregisterSlave(this);
					}
		
					this._active = false;
				},
		
				/**
				 * @typesign (evt: cellx~Event);
				 */
				_onValueChange: function(evt) {
					if (this._changeEvent) {
						evt.prev = this._changeEvent;
		
						this._changeEvent = evt;
		
						if (this._value === this._fixedValue) {
							this._isChangeCancellable = false;
						}
					} else {
						releasePlan[0].push(this);
		
						releasePlanIndex = 0;
		
						if (maxLevel == -1) {
							maxLevel = 0;
						}
		
						evt.prev = null;
		
						this._changeEvent = evt;
						this._isChangeCancellable = false;
		
						if (!currentlyRelease) {
							nextTick(release);
						}
					}
				},
		
				/**
				 * @typesign (): *;
				 */
				read: function() {
					if (calculatedCell) {
						if (calculatedCell._masters) {
							if (calculatedCell._masters.indexOf(this) == -1) {
								calculatedCell._masters.push(this);
		
								if (calculatedCell._level <= this._level) {
									calculatedCell._level = this._level + 1;
								}
							}
						} else {
							calculatedCell._masters = [this];
							calculatedCell._level = this._level + 1;
						}
					}
		
					if (!currentlyRelease) {
						release();
					}
		
					if (this.computed && !this._active && this._version != releaseVersion) {
						this._masters = null;
						this._level = 0;
		
						var value = this._tryFormula();
		
						if (value === error) {
							this._handleError(error.original);
						} else {
							var oldValue = this._value;
		
							if (!is(oldValue, value)) {
								this._value = value;
								this._changed = true;
							}
						}
		
						this._version = releaseVersion;
					}
		
					return this._read ? this._read.call(this.owner || this, this._value) : this._value;
				},
		
				/**
				 * @typesign (value): boolean;
				 */
				write: function(value) {
					if (this.computed && !this._write) {
						throw new TypeError('Cannot write to read-only cell');
					}
		
					var oldValue = this._value;
		
					if (is(oldValue, value)) {
						return false;
					}
		
					if (this._validate) {
						this._validate.call(this.owner || this, value);
					}
		
					if (this.computed) {
						this._write.call(this.owner || this, value);
					} else {
						this._value = value;
		
						if (oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onValueChange, this);
						}
						if (value instanceof EventEmitter) {
							value.on('change', this._onValueChange, this);
						}
		
						if (this._changeEvent) {
							if (is(value, this._fixedValue) && this._isChangeCancellable) {
								if (releasePlan[0].length == 1) {
									releasePlan[0].pop();
		
									if (!maxLevel) {
										maxLevel = -1;
									}
								} else {
									releasePlan[0].splice(releasePlan[0].indexOf(this), 1);
								}
		
								this._changeEvent = null;
							} else {
								this._changeEvent = {
									target: this,
									type: 'change',
									oldValue: oldValue,
									value: value,
									prev: this._changeEvent
								};
							}
						} else {
							releasePlan[0].push(this);
		
							releasePlanIndex = 0;
		
							if (maxLevel == -1) {
								maxLevel = 0;
							}
		
							this._changeEvent = {
								target: this,
								type: 'change',
								oldValue: oldValue,
								value: value,
								prev: null
							};
							this._isChangeCancellable = true;
		
							if (!currentlyRelease) {
								nextTick(release);
							}
						}
					}
		
					return true;
				},
		
				/**
				 * @typesign ();
				 */
				_recalc: function() {
					if (this._version == releaseVersion + 1) {
						if (++this._circularityCounter == 10) {
							this._fixed = true;
							this._version = releaseVersion + 1;
		
							this._handleError(new RangeError('Circular dependency detected'));
		
							return;
						}
					} else {
						this._circularityCounter = 1;
					}
		
					var oldMasters = this._masters;
					this._masters = null;
		
					var oldLevel = this._level;
					this._level = 0;
		
					var value = this._tryFormula();
		
					var masters = this._masters || [];
					var haveRemovedMasters = false;
		
					for (var i = oldMasters.length; i;) {
						var oldMaster = oldMasters[--i];
		
						if (masters.indexOf(oldMaster) == -1) {
							oldMaster._unregisterSlave(this);
							haveRemovedMasters = true;
						}
					}
		
					if (haveRemovedMasters || oldMasters.length < masters.length) {
						for (var j = masters.length; j;) {
							var master = masters[--j];
		
							if (oldMasters.indexOf(master) == -1) {
								master._registerSlave(this);
							}
						}
		
						var level = this._level;
		
						if (level > oldLevel) {
							(releasePlan[level] || (releasePlan[level] = [])).push(this);
		
							if (maxLevel < level) {
								maxLevel = level;
							}
		
							return;
						}
					}
		
					this._fixed = true;
					this._version = releaseVersion + 1;
		
					if (value === error) {
						this._handleError(error.original);
					} else {
						var oldValue = this._value;
		
						if (!is(oldValue, value) || value instanceof EventEmitter) {
							this._value = value;
							this._changed = true;
		
							if (this._events.change) {
								this.emit({
									type: 'change',
									oldValue: oldValue,
									value: value,
									prev: null
								});
							}
		
							var slaves = this._slaves;
		
							for (var k = slaves.length; k;) {
								var slave = slaves[--k];
		
								if (slave._fixed) {
									var slaveLevel = slave._level;
		
									(releasePlan[slaveLevel] || (releasePlan[slaveLevel] = [])).push(slave);
		
									if (maxLevel < slaveLevel) {
										maxLevel = slaveLevel;
									}
		
									slave._fixed = false;
								}
							}
						}
					}
				},
		
				/**
				 * @typesign (): *;
				 */
				_tryFormula: function() {
					var prevCalculatedCell = calculatedCell;
					calculatedCell = this;
		
					try {
						var value = this._formula.call(this.owner || this);
		
						if (this._validate) {
							this._validate.call(this.owner || this, value);
						}
		
						return value;
					} catch (err) {
						error.original = err;
						return error;
					} finally {
						calculatedCell = prevCalculatedCell;
					}
				},
		
				/**
				 * @typesign (err: Error);
				 */
				_handleError: function(err) {
					this._logError(err);
		
					this._handleErrorEvent({
						type: 'error',
						error: err
					});
				},
		
				/**
				 * @typesign (evt: cellx~Event);
				 */
				_handleErrorEvent: function(evt) {
					if (this._lastErrorEvent === evt) {
						return;
					}
		
					this._lastErrorEvent = evt;
		
					this._handleEvent(evt);
		
					var slaves = this._slaves;
		
					for (var i = slaves.length; i;) {
						if (evt.isPropagationStopped) {
							break;
						}
		
						slaves[--i]._handleErrorEvent(evt);
					}
				},
		
				/**
				 * @typesign (): cellx.Cell;
				 */
				dispose: function() {
					if (!currentlyRelease) {
						release();
					}
		
					this._dispose();
		
					return this;
				},
		
				/**
				 * @typesign ();
				 */
				_dispose: function() {
					this.off();
		
					if (this._active) {
						var slaves = this._slaves;
		
						for (var i = slaves.length; i;) {
							slaves[--i]._dispose();
						}
					}
				}
			});
		
			cellx.Cell = Cell;
		})();
		
		(function() {
			var Map = cellx.Map;
			var Cell = cellx.Cell;
		
			var cellProto = Cell.prototype;
		
			invokeCell = function(wrapper, initialValue, opts, owner, firstArg, otherArgs, argCount) {
				if (!owner || owner == global) {
					owner = wrapper;
				}
		
				if (!hasOwn.call(owner, KEY_CELLS)) {
					Object.defineProperty(owner, KEY_CELLS, {
						value: new Map()
					});
				}
		
				var cell = owner[KEY_CELLS].get(wrapper);
		
				if (!cell) {
					if (initialValue != null && typeof initialValue == 'object') {
						if (typeof initialValue.clone == 'function') {
							initialValue = initialValue.clone();
						} else if (isArray(initialValue)) {
							initialValue = initialValue.slice();
						} else if (initialValue.constructor === Object) {
							initialValue = assign({}, initialValue);
						} else {
							switch (toString.call(initialValue)) {
								case '[object Date]': {
									initialValue = new Date(initialValue);
									break;
								}
								case '[object RegExp]': {
									initialValue = new RegExp(initialValue);
									break;
								}
							}
						}
					}
		
					opts = create(opts);
					opts.owner = owner;
		
					cell = new Cell(initialValue, opts);
					owner[KEY_CELLS].set(wrapper, cell);
				}
		
				switch (argCount) {
					case 0: {
						return cell.read();
					}
					case 1: {
						return cell.write(firstArg);
					}
					default: {
						if (firstArg === 'bind') {
							wrapper = wrapper.bind(owner);
							wrapper.constructor = cellx;
							return wrapper;
						}
						if (firstArg === 'unwrap') {
							return cell;
						}
		
						return cellProto[firstArg].apply(cell, otherArgs);
					}
				}
			};
		})();
		
	})();


/***/ },
/* 2 */
/***/ function(module, exports) {

	var isServer = typeof window == 'undefined' && typeof navigator == 'undefined';

	exports.isServer = isServer;
	exports.isClient = !isServer;


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {var KEY_UID = '__rt_uid__';
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

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var uid = __webpack_require__(3);

	var KEY_UID = uid.KEY;
	var nextUID = uid.next;

	/**
	 * Получает уникальный идентификатор объекта.
	 * @typesign (obj: Object, prefix: string = ''): string;
	 */
	var getUID;

	if (typeof KEY_UID == 'symbol') {
		getUID = function getUID(obj, prefix) {
			return obj[KEY_UID] || (obj[KEY_UID] = nextUID(prefix));
		};
	} else {
		var hasOwn = Object.prototype.hasOwnProperty;

		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, KEY_UID)) {
				Object.defineProperty(obj, KEY_UID, {
					value: nextUID(prefix)
				});
			}

			return obj[KEY_UID];
		};
	}

	exports.getUID = getUID;

	/**
	 * @typesign (obj: Object, source: Object): Object;
	 */
	var assign = Object.assign || function assign(obj, source) {
		var keys = Object.keys(source);

		for (var i = keys.length; i;) {
			obj[keys[--i]] = source[keys[i]];
		}

		return obj;
	};

	exports.assign = assign;

	/**
	 * @typesign (obj: Object, source: Object): Object;
	 */
	function mixin(obj, source) {
		var names = Object.getOwnPropertyNames(source);

		for (var i = names.length; i;) {
			Object.defineProperty(obj, names[--i], Object.getOwnPropertyDescriptor(source, names[i]));
		}

		return obj;
	}

	exports.mixin = mixin;


/***/ },
/* 5 */
/***/ function(module, exports) {

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


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var object = __webpack_require__(4);

	var mixin = object.mixin;

	var hasOwn = Object.prototype.hasOwnProperty;

	/**
	 * @typesign (declaration: { static?: Object, constructor?: Function }): Function;
	 * 
	 * @typesign (
	 *     name?: string,
	 *     declaration: { static?: Object, constructor?: Function }
	 * ): Function;
	 */
	function extend(name, declaration) {
		if (typeof name == 'object') {
			declaration = name;
			name = undefined;
		}

		var parent = this == exports ? Object : this;
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

		Object.defineProperty(proto, 'constructor', {
			configurable: true,
			writable: true,
			value: constr
		});

		Object.keys(parent).forEach(function(name) {
			Object.defineProperty(constr, name, Object.getOwnPropertyDescriptor(parent, name));
		});

		if (declaration.static) {
			mixin(constr, declaration.static);
			delete declaration.static;
		}

		if (!constr.extend) {
			constr.extend = extend;
		}

		mixin(proto, declaration);

		return constr;
	}

	exports.extend = extend;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var request = __webpack_require__(8);

	var cache = {};

	/**
	 * @typesign (): string;
	 */
	function serializeCache() {
		return JSON.stringify(cache);
	}

	exports.serializeCache = serializeCache;

	/**
	 * @typesign (cacheDump: string);
	 */
	function deserializeCache(cacheDump) {
		cache = JSON.parse(cacheDump);
	}

	exports.deserializeCache = deserializeCache;

	/**
	 * @typesign ();
	 */
	function clearCache() {
		cache = {};
	}

	exports.clearCache = clearCache;

	['get', 'head', 'del', 'patch', 'post', 'put'].forEach(function(method) {
		exports[method] = function(url, opts) {
			if (!opts) {
				opts = {};
			}

			var args = [].slice.call(arguments);
			var key = JSON.stringify(args);

			if (opts.noCache !== true && cache.hasOwnProperty(key)) {
				var res = JSON.parse(cache[key]);
				return res.error ? Promise.reject(res) : Promise.resolve(res);
			}

			return new Promise(function(resolve, reject) {
				var req = request[method](url);

				var headers = opts.headers;

				if (headers) {
					Object.keys(headers).forEach(function(name) {
						req.set(name, headers[name]);
					});
				}

				if (opts.withCredentials) {
					req.withCredentials();
				}

				if (method == 'get') {
					if (opts.query) {
						req.query(opts.query);
					}
				} else {
					if (opts.data) {
						req.send(typeof opts.data == 'object' ? JSON.stringify(opts.data) : opts.data);
					}
				}

				return req.end(function(err, res) {
					if (!res) {
						res = {};
					}

					res = {
						headers: res.headers || null,
						status: res.status,
						error: err ? { name: err.name, message: err.message } : null,
						body: res.body || null
					};

					cache[key] = JSON.stringify(res);

					if (res.error) {
						reject(res);
					} else {
						resolve(res);
					}
				});
			});
		};
	});


/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var cellx = __webpack_require__(1);
	var uid = __webpack_require__(3);

	var EventEmitter = cellx.EventEmitter;
	var nextUID = uid.next;

	/**
	 * @class Rift.Disposable
	 * @extends {Rift.EventEmitter}
	 * @typesign new (): Rift.Disposable;
	 */
	var Disposable = EventEmitter.extend({
		_disposables: null,

		disposed: false,

		constructor: function() {
			EventEmitter.call(this);
			this._disposables = Object.create(null);
		},

		listenTo: function(target, type, listener, context) {
			var listeners;
			var listenings;

			if (Array.isArray(target) || (target.addClass && target.append)) {
				listenings = [];

				for (var i = target.length; i;) {
					listenings.push(this.listenTo(target[--i], type, listener, context));
				}
			} else if (typeof type == 'object') {
				context = listener;
				listeners = type;
				listenings = [];

				for (type in listeners) {
					listenings.push(this.listenTo(target, type, listeners[type], context));
				}
			} else if (Array.isArray(listener)) {
				listeners = listener;
				listenings = [];

				for (var j = 0, m = listeners.length; j < m; j++) {
					listenings.push(this.listenTo(target, type, listeners[j], context));
				}
			} else if (typeof listener == 'object') {
				listeners = listener;
				listenings = [];

				for (var name in listeners) {
					listenings.push(this.listenTo(target[name]('unwrap', 0), type, listeners[name], context));
				}
			} else {
				return this._listenTo(target, type, listener, context);
			}

			var id = nextUID();
			var _this = this;

			function stopListening() {
				for (var i = listenings.length; i;) {
					listenings[--i].stop();
				}

				delete _this._disposables[id];
			}

			var listening = this._disposables[id] = {
				stop: stopListening,
				dispose: stopListening
			};

			return listening;
		},

		/**
		 * @typesign (
		 *     target: Rift.EventEmitter|EventTarget,
		 *     type: string,
		 *     listener: (evt: cellx~Event): boolean|undefined,
		 *     context?: Object
		 * );
		 */
		_listenTo: function(target, type, listener, context) {
			if (!context) {
				context = this;
			}

			var id = nextUID();
			var _this = this;

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

			function stopListening() {
				if (id in _this._disposables) {
					if (target instanceof EventEmitter) {
						target.off(type, listener, context);
					} else {
						target.removeEventListener(type, listener, false);
					}

					delete _this._disposables[id];
				}
			}

			var listening = this._disposables[id] = {
				stop: stopListening,
				dispose: stopListening
			};

			return listening;
		},

		/**
		 * Регистрирует колбэк.
		 * @typesign (cb: Function): Function{ cancel: (), dispose: () };
		 */
		registerCallback: function(cb) {
			var id = nextUID();
			var _this = this;

			function callback() {
				if (id in _this._disposables) {
					delete _this._disposables[id];
					return cb.apply(_this, arguments);
				}
			}

			function cancelCallback() {
				delete _this._disposables[id];
			}

			callback.cancel = cancelCallback;
			callback.dispose = cancelCallback;

			this._disposables[id] = callback;

			return callback;
		},

		/**
		 * Устанавливает таймер.
		 * @typesign (fn: Function, delay: uint): { clear: (), dispose: () };
		 */
		setTimeout: function(fn, delay) {
			var id = nextUID();
			var _this = this;

			var timeoutId = setTimeout(function() {
				delete _this._disposables[id];
				fn.call(_this);
			}, delay);

			function clearTimeout() {
				if (id in _this._disposables) {
					clearTimeout(timeoutId);
					delete _this._disposables[id];
				}
			}

			var timeout = this._disposables[id] = {
				clear: clearTimeout,
				dispose: clearTimeout
			};

			return timeout;
		},

		/**
		 * @typesign ();
		 */
		dispose: function() {
			if (this.disposed) {
				return;
			}

			var disposables = this._disposables;

			for (var id in disposables) {
				disposables[id].dispose();
			}

			this.disposed = true;
		}
	});

	module.exports = Disposable;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var Disposable = __webpack_require__(9);

	/**
	 * @class Rift.BaseModel
	 * @extends {Rift.Disposable}
	 * @abstract
	 * @typesign new (data?: Object): Rift.BaseModel;
	 */
	var BaseModel = Disposable.extend({
		/**
		 * @typesign (data: Object, nameMap?: Object<string>): Rift.BaseModel;
		 */
		setData: function(data, nameMap) {
			if (!nameMap) {
				nameMap = {};
			}

			for (var name in data) {
				if (name in this) {
					var value = data[nameMap[name] || name];

					if (typeof this[name] == 'function') {
						this[name](value);
					} else {
						this[name] = value;
					}
				}
			}

			return this;
		}
	});

	module.exports = BaseModel;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var cellx = __webpack_require__(1);

	var Cell = cellx.Cell;

	var KEY_DATA_CELLS = '__rt_dataCells__';
	if (global.Symbol && typeof Symbol.iterator == 'symbol') {
		KEY_DATA_CELLS = Symbol(KEY_DATA_CELLS);
	}

	exports.KEY_DATA_CELLS = KEY_DATA_CELLS;

	var directiveHandlers = {
		prop: function(el, value, name) {
			if (el[name] !== value) {
				el[name] = value;
			}
		},

		attr: function(el, value, name) {
			if (value != null && value !== false) {
				if (value === true) {
					value = name;
				} else {
					value = value.toString();
				}

				if (el.getAttribute(name) !== value) {
					el.setAttribute(name, value);
				}
			} else {
				if (el.hasAttribute(name)) {
					el.removeAttribute(name);
				}
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

		disabled: function(el, value) {
			if (el.disabled != !!value) {
				el.disabled = !!value;
			}
		},

		class: function(el, value, name) {
			$(el).toggleClass(name, !!value);
		},

		mod: function(el, value, name) {
			var mods = {};
			mods[name] = !!value;
			$(el).mods(mods);
		},

		show: function(el, value) {
			value = value ? '' : 'none';

			if (el.style.display != value) {
				el.style.display = value;
			}
		},

		html: function(el, value) {
			el.innerHTML = value;
		},

		text: function(el, value, target) {
			value = String(value);

			var node;

			switch (target) {
				case 'first': {
					node = el.firstChild;

					if (!node || node.nodeType != 3) {
						el.insertBefore(document.createTextNode(value), node);
						return;
					}

					break;
				}
				case 'last': {
					node = el.lastChild;

					if (!node || node.nodeType != 3) {
						el.appendChild(document.createTextNode(value));
						return;
					}

					break;
				}
				case 'prev': {
					node = el.previousSibling;

					if (!node || node.nodeType != 3) {
						el.parentNode.insertBefore(document.createTextNode(value), el);
						return;
					}

					break;
				}
				case 'next': {
					node = el.nextSibling;

					if (!node || node.nodeType != 3) {
						el.parentNode.insertBefore(document.createTextNode(value), node);
						return;
					}

					break;
				}
				default: {
					if (el.childNodes.length == 1 && el.firstChild.nodeType == 3) {
						node = el.firstChild;
					} else {
						while (el.lastChild) {
							el.removeChild(el.lastChild);
						}

						el.appendChild(document.createTextNode(value));

						return;
					}

					break;
				}
			}

			if (node.nodeValue != value) {
				node.nodeValue = value;
			}
		}
	};

	exports.directiveHandlers = directiveHandlers;

	var reName = Object.keys(directiveHandlers).join('|');
	var reDirective = RegExp(
		'\\s*(' + reName + ')(?:\\(([^)]*)\\))?:\\s*(\\S[\\s\\S]*?)(?=\\s*(?:,\\s*(?:' + reName +
			')(?:\\([^)]*\\))?:\\s*\\S|$))',
		'g'
	);

	/**
	 * @typesign (
	 *     el: HTMLElement,
	 *     context: Object,
	 *     opts?: { applyValues: boolean = true }
	 * );
	 */
	function bindElement(el, context, opts) {
		if (el.hasOwnProperty(KEY_DATA_CELLS) && el[KEY_DATA_CELLS]) {
			return;
		}

		var applyValues = !opts || opts.applyValues !== false;
		var directives = el.getAttribute('rt-bind');
		var cells = el[KEY_DATA_CELLS] = [];

		reDirective.lastIndex = 0;

		for (var directive; directive = reDirective.exec(directives);) {
			(function(name, meta, expr) {
				var cell = new Cell(Function('var _ = this; return ' + expr + ';').bind(context), {
					onchange: function() {
						directiveHandlers[name](el, this.read(), meta);
					}
				});

				cells.push(cell);

				if (applyValues) {
					directiveHandlers[name](el, cell.read(), meta);
				}
			})(directive[1], directive[2], directive[3]);
		}

		el.removeAttribute('rt-bind');
		el.setAttribute('rt-binding', directives);
	}

	/**
	 * @typesign (el: HTMLElement);
	 */
	function unbindElement(el) {
		if (!el.hasOwnProperty(KEY_DATA_CELLS)) {
			return;
		}

		var cells = el[KEY_DATA_CELLS];

		if (!cells) {
			return;
		}

		for (var i = cells.length; i;) {
			cells[--i].dispose();
		}

		el[KEY_DATA_CELLS] = null;

		el.setAttribute('rt-bind', el.getAttribute('rt-binding'));
		el.removeAttribute('rt-binding');
	}

	/**
	 * @typesign (
	 *     el: HTMLElement,
	 *     opts?: { bindRootElement: boolean = true, applyValues: boolean = true }
	 * ): HTMLElement;
	 */
	function bindDOM(el, context, opts) {
		if (!opts) {
			opts = {};
		}

		var applyValues = opts.applyValues;

		if (opts.bindRootElement !== false && el.hasAttribute('rt-bind')) {
			bindElement(el, context, { applyValues: applyValues });
		}

		var els = el.querySelectorAll('[rt-bind]');

		for (var i = els.length; i;) {
			bindElement(els[--i], context, { applyValues: applyValues });
		}

		return el;
	}

	exports.bind = bindDOM;

	/**
	 * @typesign (
	 *     el: HTMLElement,
	 *     opts?: { bindRootElement: boolean = true }
	 * ): HTMLElement;
	 */
	function unbindDOM(el, opts) {
		if ((!opts || opts.bindRootElement !== false) && el.hasAttribute('rt-binding')) {
			unbindElement(el);
		}

		var els = el.querySelectorAll('[rt-binding]');

		for (var i = els.length; i;) {
			unbindElement(els[--i]);
		}

		return el;
	}

	exports.unbind = unbindDOM;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var env = __webpack_require__(2);
	var object = __webpack_require__(4);
	var Class = __webpack_require__(6);
	var Disposable = __webpack_require__(9);
	var domBinding = __webpack_require__(11);

	var isServer = env.isServer;
	var assign = object.assign;
	var extend = Class.extend;
	var bindDOM = domBinding.bind;
	var unbindDOM = domBinding.unbind;

	var hasOwn = Object.prototype.hasOwnProperty;
	var slice = Array.prototype.slice;
	var reduce = Array.prototype.reduce;

	var KEY_VIEW = '__rt_BaseView_view__';
	var KEY_VIEW_ELEMENT_NAME = '__rt_BaseView_viewElementName__';

	if (global.Symbol && typeof Symbol.iterator == 'symbol') {
		KEY_VIEW = Symbol(KEY_VIEW);
		KEY_VIEW_ELEMENT_NAME = Symbol(KEY_VIEW_ELEMENT_NAME);
	}

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

	function emptyFn() {}

	/**
	 * @type {Object<Function>}
	 */
	var viewClasses = Object.create(null);

	/**
	 * @typesign (name: string): Function;
	 */
	function getViewClass(name) {
		if (!(name in viewClasses)) {
			throw new TypeError('ViewClass "' + name + '" is not defined');
		}

		return viewClasses[name];
	}

	/**
	 * @typesign (name: string, viewClass: Function): Function;
	 */
	function registerViewClass(name, viewClass) {
		if (name in viewClasses) {
			throw new TypeError('ViewClass "' + name + '" is already registered');
		}

		Object.defineProperty(viewClass, '$viewClass', {
			value: name
		});

		viewClasses[name] = viewClass;

		return viewClass;
	}

	/**
	 * @typesign (str: string): string;
	 */
	function toCamelCase(str) {
		return str.replace(/[^$0-9a-zA-Z]([$0-9a-zA-Z])/g, function(match, firstWordChar) {
			return firstWordChar.toUpperCase();
		});
	}

	/**
	 * @typesign (cls: Array<string>, mods: Object): Array<string>;
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
	 * @typesign (el: HTMLElement, attrs: Object);
	 */
	function setAttributes(el, attrs) {
		for (var name in attrs) {
			el.setAttribute(name, attrs[name]);
		}
	}

	/**
	 * @typesign (view: Rift.BaseView, blockName: string, name: string): boolean;
	 */
	function initDescendantElements(view, blockName, name) {
		var children = view.children;
		var result = false;

		for (var i = children.length; i;) {
			var child = children[--i];

			if (child.blockName == blockName) {
				child.$(name);
				result = true;
			} else {
				if (initDescendantElements(child, blockName, name)) {
					result = true;
				}
			}
		}

		return result;
	}

	/**
	 * @typesign (view: Rift.BaseView, el: HTMLElement);
	 */
	function removeElement(view, el) {
		if (!el[KEY_VIEW_ELEMENT_NAME] || el[KEY_VIEW] != view) {
			return;
		}

		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}

		unbindDOM(el);

		var els = view.elements[el[KEY_VIEW_ELEMENT_NAME]];
		els.splice(els.indexOf(el), 1);

		el[KEY_VIEW] = null;
		el[KEY_VIEW_ELEMENT_NAME] = undefined;
	}

	/**
	 * @typesign (view: Rift.BaseView);
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
	 * @typesign (view: Rift.BaseView, cb: ());
	 */
	function receiveData(view, cb) {
		if (view._receiveData == emptyFn) {
			cb.call(view);
		} else {
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
						if (view.disposed) {
							return;
						}

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
							if (!view.disposed) {
								view.dataReceivingError = err;
								view._logError(err);
							}
						})
						.then(function() {
							if (!view.disposed) {
								afterDataReceiving(view);
								cb.call(view);
							}
						});
				}
			} catch (err) {
				view.dataReceivingError = err;
				view._logError(err);
				afterDataReceiving(view);
				cb.call(view);
			}
		}
	}

	/**
	 * @typesign (view: Rift.BaseView, dom: HTMLElement);
	 */
	function linkToDOM(view, dom) {
		var blocks = reduce.call(dom.querySelectorAll('[rt-id]'), function(blocks, block) {
			blocks[block.getAttribute('rt-id')] = block;
			return blocks;
		}, {});

		(function _(view) {
			var children = view.children;

			for (var i = children.length; i;) {
				var child = children[--i];
				var childBlock = blocks[child._id];

				childBlock[KEY_VIEW] = child;
				child.block = $(childBlock);

				_(child);
			}

			view.isDOMReady = true;

			view.emit({
				type: 'domready',
				bubbles: false
			});
		})(view);
	}

	/**
	 * @class Rift.BaseView
	 * @extends {Rift.Disposable}
	 * @abstract
	 *
	 * @typesign new (params?: {
	 *     tagName?: string,
	 *     blockName?: string,
	 *     mods?: Object<boolean|number|string>,
	 *     attrs?: Object<string>,
	 *     name?: string,
	 *     owner?: Rift.BaseView,
	 *     app?: Rift.BaseApp,
	 *     model?: Rift.BaseModel|Rift.ActiveMap|Rift.ActiveList|Rift.Cell|Rift.cellx,
	 *     parent?: Rift.BaseView,
	 *     block?: HTMLElement|$
	 * }): Rift.BaseView;
	 */
	var BaseView = Disposable.extend({
		static: {
			KEY_VIEW: KEY_VIEW,
			KEY_VIEW_ELEMENT_NAME: KEY_VIEW_ELEMENT_NAME,

			viewClasses: viewClasses,

			getViewClass: getViewClass,
			registerViewClass: registerViewClass,

			/**
			 * @typesign (
			 *     name: string,
			 *     declaration: { static?: Object, constructor?: Function }
			 * ): Function;
			 */
			extend: function(name, declaration) {
				return registerViewClass(name, extend.call(this, undefined, declaration));
			}
		},

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

		_idCounter: 0,

		_id: undefined,

		/**
		 * @type {string|undefined}
		 */
		name: undefined,

		/**
		 * @type {?Rift.BaseView}
		 */
		owner: null,

		/**
		 * @type {?Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?(Rift.BaseModel|Rift.ActiveMap|Rift.ActiveList|Rift.Cell|Rift.cellx)}
		 */
		model: null,

		_parent: null,

		/**
		 * Родительская вьюшка.
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
		 * @type {Array<Rift.BaseView>}
		 */
		children: null,

		/**
		 * Корневой элемент вьюшки.
		 * @type {?$}
		 */
		block: null,

		/**
		 * Элементы вьюшки.
		 * @type {Object<$>}
		 */
		elements: null,

		isDOMReady: false,

		/**
		 * @typesign (cb: ());
		 * @typesign (): Promise;
		 */
		_receiveData: emptyFn,

		/**
		 * @typesign ();
		 */
		_beforeDataReceiving: emptyFn,
		/**
		 * @typesign ();
		 */
		_afterDataReceiving: emptyFn,

		dataReceivingError: null,

		_currentlyRendering: false,
		_childRenderings: null,

		/**
		 * @typesign ();
		 */
		_beforeRendering: emptyFn,

		/**
		 * @typesign (): string;
		 */
		template: function() {
			return '';
		},

		isClientInited: false,

		/**
		 * @typesign ();
		 */
		_initClient: emptyFn,

		constructor: function(params) {
			Disposable.call(this);

			if (!params) {
				params = {};
			}

			if (params.tagName) {
				this.tagName = params.tagName;
			}

			if (params.blockName) {
				this.blockName = params.blockName;
			} else if (!this.blockName) {
				var proto = Object.getPrototypeOf(this);

				while (Object.getPrototypeOf(proto).constructor != BaseView) {
					proto = Object.getPrototypeOf(proto);
				}

				proto.blockName = toCamelCase(proto.constructor.$viewClass);
			}

			this.mods = Object.create(this.mods);

			if (params.mods) {
				assign(this.mods, params.mods);
			}

			this.attrs = Object.create(this.attrs);

			if (params.attrs) {
				assign(this.attrs, params.attrs);
			}

			if (params.name) {
				this.name = params.name;
			}

			if (params.owner) {
				this.owner = params.owner;
			}

			var parent = params.parent;

			if (params.app) {
				this.app = params.app;
			} else {
				if (parent && parent.app) {
					this.app = parent.app;
				}
			}

			if (params.model) {
				this.model = params.model;
			} else {
				if (parent && parent.model) {
					this.model = parent.model;
				} else if (this.app) {
					this.model = this.app.model;
				}
			}

			if (parent) {
				this.parent = parent;
			}

			this._id = this._nextID();

			this.children = [];

			var block = isServer ? null : params.block;

			if (block !== null) {
				if (block) {
					if (block.addClass && block.append) {
						block = block[0];
					}

					if (block[KEY_VIEW]) {
						throw new TypeError(
							'Element is already used as ' +
								(block[KEY_VIEW_ELEMENT_NAME] ? 'an element' : 'a block') + ' of view'
						);
					}
				} else {
					block = document.createElement(this.tagName);
				}

				block[KEY_VIEW] = this;
				this.block = $(block);
			}

			this.elements = {};
		},

		/**
		 * @typesign (): string;
		 */
		_nextID: function() {
			if (this._parent) {
				return this._parent._nextID();
			}

			return String(++this._idCounter);
		},

		/**
		 * @typesign (cb: (html: string));
		 */
		render: function(cb) {
			if (this._currentlyRendering) {
				throw new TypeError('Can\'t run rendering when it is in process');
			}

			if (this._beforeRendering != emptyFn) {
				try {
					this._beforeRendering();
				} catch (err) {
					this._logError(err);
				}
			}

			this._currentlyRendering = true;

			receiveData(this, function() {
				if (selfClosingTags.hasOwnProperty(this.tagName)) {
					this._currentlyRendering = false;
					cb.call(this, this._renderOpenTag());
				} else {
					this._renderInner(function(html) {
						this._currentlyRendering = false;
						cb.call(this, this._renderOpenTag() + html + '</' + this.tagName + '>');
					});
				}
			});
		},

		/**
		 * @typesign (): string;
		 */
		_renderOpenTag: function() {
			var attrs = this.attrs;
			var attributes = [
				'class="' + (pushMods([this.blockName], this.mods).join(' ') + ' ' + (attrs.class || '')).trim() + '"'
			];

			for (var name in attrs) {
				if (name != 'class') {
					attributes.push(name + '="' + attrs[name] + '"');
				}
			}

			return '<' + this.tagName + ' ' + attributes.join(' ') + ' rt-id="' + this._id + '">';
		},

		/**
		 * @typesign (cb: (html: string));
		 */
		_renderInner: function(cb) {
			var childRenderings = this._childRenderings = {
				count: 0,
				readyCount: 0,

				childTraces: [],
				results: [],

				onallready: null
			};
			var html;

			try {
				html = this.template.call(this.owner || this);
			} catch (err) {
				this._childRenderings = null;
				this._logError(err);
				cb.call(this, '');
				return;
			}

			var _this = this;

			childRenderings.onallready = function() {
				_this._childRenderings = null;

				var childTraces = childRenderings.childTraces;
				var results = childRenderings.results;

				for (var i = childTraces.length; i;) {
					html = html.replace(childTraces[--i], function() {
						return results[i];
					});
				}

				cb.call(_this, html);
			};

			if (childRenderings.count == childRenderings.readyCount) {
				childRenderings.onallready();
			}
		},

		/**
		 * @typesign (cb?: ()): Rift.BaseView;
		 */
		initClient: function(cb) {
			var block = this.block[0];

			if (!this.isDOMReady) {
				if (block.hasAttribute('rt-id')) {
					this.render(function() {
						linkToDOM(this, block);
					});
				} else {
					setAttributes(block, this.attrs);
					block.className = (pushMods([this.blockName], this.mods).join(' ') + ' ' + block.className).trim();

					this._currentlyRendering = true;

					receiveData(this, function() {
						this._renderInner(function(html) {
							this._currentlyRendering = false;
							block.innerHTML = html;
							linkToDOM(this, block);
						});
					});
				}
			}

			function domReady() {
				if (!this.isClientInited) {
					this.isClientInited = true;

					var children = this.children.slice();

					for (var i = 0, l = children.length; i < l; i++) {
						children[i].initClient();
					}

					try {
						if (this._initClient != emptyFn) {
							this._initClient();
						}

						bindDOM(block, this.owner || this);
					} catch (err) {
						this._logError(err);
					}
				}

				if (cb) {
					cb.call(this);
				}
			}

			if (this.isDOMReady) {
				domReady.call(this);
			} else {
				this.once('domready', domReady);
			}

			return this;
		},

		/**
		 * Регистрирует дочернюю вьюшку.
		 * @typesign (child: Rift.BaseView): Rift.BaseView;
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
		 * @typesign (child: Rift.BaseView): Rift.BaseView;
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
		 * @typesign (childName: string, method: string, ...args?: Array): Array;
		 */
		broadcast: function(childName, method) {
			var cl;
			var name;

			if (/^<([^>]+)>(.+)$/.test(childName)) {
				cl = RegExp.$1;
				name = RegExp.$2;
			} else {
				cl = childName;
				name = '*';
			}

			cl = getViewClass(cl);

			var descendants = [];

			(function _(children) {
				for (var i = 0, l = children.length; i < l; i++) {
					var child = children[i];

					if ((cl === '*' || child instanceof cl) && (name == '*' || child.name === name)) {
						descendants.push(child);
					}

					_(child.children);
				}
			})(this.children);

			var args = slice.call(arguments, 2);

			return descendants.map(function(descendant) {
				if (!descendant.disposed && typeof descendant[method] == 'function') {
					return descendant[method].apply(descendant, args);
				}
			});
		},

		/**
		 * Создаёт и регистрирует элемент(ы) и/или возвращает именованную $-коллекцию.
		 *
		 * @example
		 * this.$('btnSend'); // получение элемента(ов) по имени
		 *
		 * @example
		 * // создаёт новый элемент `<li class="Module_item _selected">Hi!</li>`,
		 * // добавляет его в коллекцию `item` и возвращает коллекцию с новым элементом
		 * this.$('item', '<li class="_selected">Hi!</li>');
		 *
		 * @typesign (
		 *     name: string,
		 *     ...els?: Array<HTMLElement|string|{ tagName: string, mods: Object, attrs: Object<string>, html: string }>
		 * ): $;
		 */
		$: function(name) {
			var els;

			if (hasOwn.call(this.elements, name)) {
				els = this.elements[name];
			} else {
				els = this.block.find('.' + this.blockName + '_' + name);

				if (initDescendantElements(this, this.blockName, name)) {
					els = els.filter(function() { return !this[KEY_VIEW]; });
				}

				var _this = this;

				els.each(function() {
					this[KEY_VIEW] = _this;
					this[KEY_VIEW_ELEMENT_NAME] = name;
				});

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
							var container = document.createElement('div');
							container.innerHTML = el;

							el = container.childNodes.length == 1 && container.firstChild.nodeType == 1 ?
								container.firstChild :
								container;
						} else {
							if (el[KEY_VIEW]) {
								if (!el[KEY_VIEW_ELEMENT_NAME]) {
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
						var params = el;

						el = document.createElement(params.tagName || 'div');

						if (params.attrs) {
							setAttributes(el, params.attrs);
						}

						var cls = [this.blockName + '_' + name];

						if (params.mods) {
							pushMods(cls, params.mods);
						}

						el.className = (cls.join(' ') + ' ' + el.className).trim();

						if (params.html) {
							el.innerHTML = params.html;
						}
					}

					el[KEY_VIEW] = this;
					el[KEY_VIEW_ELEMENT_NAME] = name;

					els.push(el);

					bindDOM(el, this.owner || this);
				} while (++i < argCount);
			}

			return els;
		},

		/**
		 * @typesign (...els: $|HTMLElement|string): Rift.BaseView;
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

				if (el.addClass && el.append) {
					var _this = this;

					el.each(function() {
						removeElement(_this, this);
					});
				} else {
					removeElement(this, el);
				}
			}

			return this;
		},

		/**
		 * @override Rift.Disposable#_listenTo
		 */
		_listenTo: function(target, evt, listener, context) {
			var type;

			if (target instanceof BaseView) {
				var inner;

				if (/^<([^>]+)>(.+)$/.test(evt)) {
					var cl = RegExp.$1;
					type = RegExp.$2;

					if (cl != '*') {
						cl = getViewClass(cl);
						inner = listener;

						listener = function(evt) {
							if (evt.target instanceof cl) {
								return inner.call(this, evt);
							}
						};
					}
				} else {
					type = evt;
					inner = listener;

					var _this = this;

					listener = function(evt) {
						if (evt.target == _this) {
							return inner.call(this, evt);
						}
					};
				}
			} else {
				type = evt;
			}

			return Disposable.prototype._listenTo.call(this, target, type, listener, context);
		},

		/**
		 * @typesign ();
		 */
		dispose: function() {
			var block = this.block && this.block[0];

			if (block) {
				if (block.parentNode) {
					block.parentNode.removeChild(block);
				}

				unbindDOM(block);
			}

			var children = this.children;

			for (var i = children.length; i;) {
				children[--i].dispose();
			}

			this.parent = null;

			if (block) {
				block[KEY_VIEW] = null;
			}

			Disposable.prototype.dispose.call(this);
		}
	});

	module.exports = BaseView;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var cellx = __webpack_require__(1);
	var uid = __webpack_require__(3);
	var BaseView = __webpack_require__(12);

	var ActiveMap = cellx.ActiveMap;
	var ActiveList = cellx.ActiveList;
	var nextUID = uid.next;
	var getViewClass = BaseView.getViewClass;

	var hasOwn = Object.prototype.hasOwnProperty;

	/**
	 * @typesign (viewClass: Function|string, viewParams?: Object): string;
	 */
	function include(viewClass, viewParams) {
		if (typeof viewClass == 'string') {
			viewClass = getViewClass(viewClass);
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
		var childTrace = childRenderings.childTraces[index] = '{{' + nextUID() + '}}';

		new viewClass(viewParams).render(function(html) {
			childRenderings.results[index] = html;

			if (childRenderings.count == ++childRenderings.readyCount && childRenderings.onallready) {
				childRenderings.onallready();
			}
		});

		return childTrace;
	}

	/**
	 * @typesign (obj?: Object|Array|Rift.ActiveMap|Rift.ActiveList, cb: (value, key), context: Object);
	 */
	function each(obj, cb, context) {
		if (!obj) {
			return;
		}

		if (obj instanceof ActiveMap) {
			obj = obj.toObject();
		} else if (obj instanceof ActiveList) {
			obj = obj.toArray();
		}

		if (Array.isArray(obj)) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (i in obj) {
					cb.call(context, obj[i], i);
				}
			}
		} else {
			for (var name in obj) {
				if (hasOwn.call(obj, name)) {
					cb.call(context, obj[name], name);
				}
			}
		}
	}

	exports.defaults = {
		include: include,
		helpers: {},
		each: each
	};


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var BaseView = __webpack_require__(12);
	var templateRuntime = __webpack_require__(13);

	var getViewClass = BaseView.getViewClass;
	var include = templateRuntime.defaults.include;

	BaseView.extend('ViewList', {
		tagName: 'ul',

		/**
		 * @override Rift.BaseView#model
		 * @type {Rift.cellx<Array|Rift.ActiveList>|Rift.ActiveList}
		 */
		model: null,

		itemViewClass: null,

		getItemParams: null,

		constructor: function(params) {
			BaseView.call(this, params);

			this.itemViewClass = getViewClass(params.itemViewClass);

			if (params.getItemParams) {
				this.getItemParams = params.getItemParams;
			}
		},

		template: function() {
			var model = this.model;

			if (typeof model == 'function') {
				model = model();

				if (!model) {
					return '';
				}
			}

			var itemViewClass = this.itemViewClass;
			var getItemParams = this.getItemParams;

			return model.map(function(itemModel, index) {
				var params = getItemParams ? getItemParams(itemModel, index, model) : {};

				params.name = 'item';
				params.model = itemModel;
				params.$index = index;

				return '<li class="ViewList_item">' + include.call(this, itemViewClass, params) + '</li>';
			}, this).join('');
		},

		_initClient: function() {
			if (typeof this.model == 'function') {
				this.listenTo(this, 'change', { model: this._onModelChange });
			} else {
				this.listenTo(this.model, 'change', this._onModelChange);
			}
		},

		_onModelChange: function() {
			var model = this.model;

			if (typeof model == 'function') {
				model = model();

				if (!model) {
					model = [];
				}
			}

			var itemViewClass = this.itemViewClass;
			var getItemParams = this.getItemParams;
			var items = this.children.item || (this.children.item = []);
			var block = this.block[0];

			var currentItemModels = items.map(function(item) {
				return item.model;
			});
			var newItemModels = Array.isArray(model) ? model.slice() : model.toArray();

			newItemModels.forEach(function(itemModel, index) {
				if (itemModel === currentItemModels[index]) {
					return;
				}

				var itemModelIndex = currentItemModels.indexOf(itemModel, index + 1);

				if (itemModelIndex == -1) {
					var params = getItemParams ? getItemParams(itemModel, index, model) : {};

					params.name = 'item';
					params.model = itemModel;
					params.parent = this;
					params.$index = index;

					new itemViewClass(params);

					var item = items.pop();
					var li = document.createElement('li');

					li.className = 'ViewList_item';
					li.appendChild(item.block[0]);

					if (index < items.length) {
						block.insertBefore(li, items[index].block[0].parentNode);
					} else {
						block.appendChild(li);
					}

					items.splice(index, 0, item);
					currentItemModels.splice(index, 0, item.model);

					item.initClient();
				} else {
					block.insertBefore(items[itemModelIndex].block[0].parentNode, items[index].block[0].parentNode);

					items.splice(index, 0, items.splice(itemModelIndex, 1)[0]);
					currentItemModels.splice(index, 0, currentItemModels.splice(itemModelIndex, 1)[0]);
				}
			}, this);

			items.slice(newItemModels.length).forEach(function(item) {
				var li = item.block[0].parentNode;
				li.parentNode.removeChild(li);

				item.dispose();
			});
		}
	});


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var BaseView = __webpack_require__(12);
	var templateRuntime = __webpack_require__(13);

	var getViewClass = BaseView.getViewClass;
	var include = templateRuntime.defaults.include;

	BaseView.extend('ViewSwitch', {
		states: null,
		stateSource: null,

		initialState: undefined,

		_currentState: undefined,

		constructor: function(params) {
			BaseView.call(this, params);

			this.states = params.states;

			if (params.stateSource) {
				this.stateSource = params.stateSource;
			}

			var initialState;

			if (params.initialState) {
				initialState = this.initialState = params.initialState;
			}

			var currentState = initialState || (this.stateSource ? this.stateSource() : undefined);

			if ((!currentState || !this.states[currentState]) && this.states.default) {
				currentState = 'default';
			}

			if (currentState && this.states[currentState]) {
				this._currentState = currentState;
			}
		},

		/**
		 * @type {string|undefined}
		 */
		get currentState() {
			return this._currentState;
		},
		set currentState(newState) {
			if ((!newState || !this.states[newState]) && this.states.default) {
				newState = 'default';
			}

			if (this._currentState === newState) {
				return;
			}

			if (this._currentState) {
				this.children[0].dispose();
			}

			if (newState && this.states[newState]) {
				var state = this.states[newState];
				var params = Object.create(state.viewParams || null);

				params.parent = this;

				var view = new (getViewClass(state.viewClass))(params);
				view.block.appendTo(this.block);
				view.initClient();

				this._currentState = newState;
			} else {
				this._currentState = undefined;
			}
		},

		template: function() {
			var currentState = this._currentState;

			if (currentState && this.states[currentState]) {
				var state = this.states[currentState];
				return include.call(this, state.viewClass, state.viewParams || null);
			}

			return '';
		},

		_initClient: function() {
			if (this.stateSource) {
				this.listenTo(this, 'change', { stateSource: this._onStateSourceChange });
			}
		},

		_onStateSourceChange: function() {
			this.currentState = this.stateSource();
		}
	});


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var cellx = __webpack_require__(1);
	var env = __webpack_require__(2);
	var regex = __webpack_require__(5);
	var Disposable = __webpack_require__(9);

	var Map = cellx.Map;
	var isServer = env.isServer;
	var isClient = env.isClient;
	var escapeRegExp = regex.escape;

	/**
	 * @typesign (str: string): number|string;
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
	 * @typesign (path: string): string;
	 */
	function encodePath(path) {
		path = path.split('/');

		for (var i = path.length; i;) {
			path[--i] = encodeURIComponent(decodeURIComponent(path[i]));
		}

		return path.join('/');
	}

	/**
	 * @typesign (path: string): string;
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
	 *     name: string,
	 *     pathModel: Array<{ requiredProperties: Array<string>, value?: string, property?: string }>,
	 *     requiredProperties: Array<string>,
	 *     properties: Array<{ type: int, name: string }>,
	 *     rePath: RegExp,
	 *     callback: (path: string)
	 * }} Rift.Router~Node
	 */

	/**
	 * @typesign (node: Rift.Router~Node, state: Object): string;
	 */
	function buildPath(node, state) {
		var path = [];

		node.pathModel.forEach(function(pathPart) {
			var requiredProperties = pathPart.requiredProperties;
			var i = requiredProperties.length;

			while (i--) {
				var value = state[requiredProperties[i]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (i == -1) {
				path.push(pathPart.value !== undefined ? pathPart.value : state[pathPart.property]());
			}
		});

		return slashifyPath(path.join(''));
	}

	/**
	 * @typesign (
	 *     state: Object,
	 *     nodes: Array<Rift.Router~Node>,
	 *     preferredNode?: Rift.Router~Node
	 * ): { node: Rift.Router~Node, path: string }|null;
	 */
	function tryState(state, nodes, preferredNode) {
		var resultNode = null;

		for (var iterator = nodes.values(), step; !(step = iterator.next()).done;) {
			var node = step.value;
			var requiredProperties = node.requiredProperties;
			var j = requiredProperties.length;

			while (j--) {
				var value = state[requiredProperties[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				if (resultNode) {
					if (resultNode.requiredProperties.length) {
						if (requiredProperties.length && node === preferredNode) {
							resultNode = node;
							break;
						}
					} else {
						if (requiredProperties.length) {
							resultNode = node;

							if (node === preferredNode) {
								break;
							}
						} else {
							if (node === preferredNode) {
								resultNode = node;
							}
						}
					}
				} else {
					resultNode = node;
				}
			}
		}

		return resultNode && {
			node: resultNode,
			path: buildPath(resultNode, state)
		};
	}

	/**
	 * @typesign (path: string, nodes: Array<Rift.Router~Node>): { node: Rift.Router~Node, state: Object }|null;
	 */
	function tryPath(path, nodes) {
		for (var iterator = nodes.values(), step; !(step = iterator.next()).done;) {
			var node = step.value;
			var match = path.match(node.rePath);

			if (match) {
				return {
					node: node,

					state: node.properties.reduce(function(state, prop, index) {
						state[prop.name] = prop.type == 1 ?
							!!match[index + 1] :
							match[index + 1] && tryStringAsNumber(decodeURIComponent(match[index + 1]));

						return state;
					}, {})
				};
			}
		}

		return null;
	}

	/**
	 * @class Rift.Router
	 * @extends {Rift.Disposable}
	 *
	 * @typesign new (
	 *     app: Rift.BaseApp,
	 *     nodes?: Array<{ name?: string, path: string, callback?: (path: string) }>
	 * ): Rift.Router;
	 */
	var Router = Disposable.extend({
		/**
		 * @type {Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?HTMLElement}
		 */
		viewBlock: null,

		/**
		 * @type {cellx.Map<Rift.Router~Node>}
		 */
		nodes: null,

		started: false,

		/**
		 * @type {?Rift.Router~Node}
		 */
		currentNode: null,
		/**
		 * @type {string}
		 */
		currentNodeName: cellx(''),

		/**
		 * @type {string|undefined}
		 */
		currentPath: undefined,

		constructor: function(app, nodes) {
			Disposable.call(this);

			this.app = app;
			this.nodes = new Map();

			if (nodes) {
				nodes.forEach(function(node) {
					this.addNode(node);
				}, this);
			}

			this.currentNodeName = this.currentNodeName.bind(this);
			this.currentNodeName.constructor = cellx;
		},

		/**
		 * @typesign (node: { name?: string, path: string, callback?: (path: string) }): Rift.Router;
		 */
		addNode: function(node) {
			if (this.started) {
				throw new TypeError('Can\'t add node to started router');
			}

			var name = node.name;

			if (this.nodes.has(name)) {
				throw new TypeError('Node "' + name + '" is already exist');
			}

			var path = node.path;
			var cb = node.callback;

			var reInsert = /\{([^}]+)\}/g;

			var pathPart;
			var encodedPathPart;

			var prop;

			var pathModel = [];
			var requiredProperties = [];
			var props = [];
			var rePath = [];

			path = path.split(/\((?:\?([^\s)]+)\s+)?([^)]+)\)/g);

			for (var i = 0, l = path.length; i < l;) {
				if (i % 3) {
					rePath.push('(' + (path[i] ? '' : '?:'));

					var pathPartRequiredProperties = [];

					if (path[i]) {
						props.push({
							type: 1,
							name: path[i]
						});

						pathPartRequiredProperties.push(path[i]);
					}

					pathPart = path[i + 1].split(reInsert);

					for (var j = 0, m = pathPart.length; j < m; j++) {
						if (j % 2) {
							prop = pathPart[j];

							pathModel.push({
								requiredProperties: pathPartRequiredProperties,
								value: undefined,
								property: prop
							});

							props.push({
								type: 2,
								name: prop
							});

							rePath.push('([^\\/]+)');

							pathPartRequiredProperties.push(prop);
						} else {
							if (pathPart[j]) {
								encodedPathPart = encodePath(pathPart[j]);

								pathModel.push({
									requiredProperties: pathPartRequiredProperties,
									value: encodedPathPart.split('*').join(''),
									property: undefined
								});

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));
							}
						}
					}

					rePath.push(')?');

					i += 2;
				} else {
					if (path[i]) {
						pathPart = path[i].split(reInsert);

						for (var k = 0, n = pathPart.length; k < n; k++) {
							if (k % 2) {
								prop = pathPart[k];

								pathModel.push({
									requiredProperties: [prop],
									value: undefined,
									property: prop
								});

								requiredProperties.push(prop);

								props.push({
									type: 0,
									name: prop
								});

								rePath.push('([^\\/]+)');
							} else {
								if (pathPart[k]) {
									encodedPathPart = encodePath(pathPart[k]);

									pathModel.push({
										requiredProperties: [],
										value: encodedPathPart.split('*').join(''),
										property: undefined
									});

									rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));
								}
							}
						}
					}

					i++;
				}
			}

			this.nodes.set(name, {
				name: name,

				// Для составления пути.
				pathModel: pathModel,

				// Для проверки соответствия стейта данному узлу.
				requiredProperties: requiredProperties,

				// Для вытаскивания данных из совпадения по регулярке,
				// индексы будут на 1 меньше соответствующих индексов в совпадении.
				properties: props,

				rePath: RegExp('^\\/?' + rePath.join('') + '\\/?$'),

				callback: cb
			});

			return this;
		},

		/**
		 * @typesign (): Rift.Router;
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
				var match = tryState(this.app.model, this.nodes, this.currentPath == '/' ? null : this.currentNode);

				if (match) {
					var node = match.node;

					this.currentNode = node;
					this.currentNodeName(node.name);

					this.currentPath = match.path;

					if (node.callback) {
						node.callback.call(this.app, match.path);
					}
				}
			}

			return this;
		},

		_bindEvents: function() {
			if (isClient) {
				this.listenTo(window, 'popstate', this._onWindowPopState);
				this.listenTo(this.viewBlock, 'click', this._onViewBlockClick);
			}
		},

		_onWindowPopState: function() {
			this.route(location.pathname, false);
		},

		/**
		 * @typesign (evt: MouseEvent);
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

			if (!/^(?:\w+:)?\/\//.test(href) && href.indexOf('#') == -1 && this.route(href)) {
				evt.preventDefault();
			}
		},

		/**
		 * Редиректит по указанному пути.
		 * Если нет подходящего маршрута - возвращает false, редиректа не происходит.
		 *
		 * @typesign (path: string, newHistoryStep: boolean = true): boolean;
		 */
		route: function(path, newHistoryStep) {
			var model = this.app.model;
			var match;

			if (this.nodes.has(path)) {
				match = tryState(model, this.nodes, this.nodes.get(path));

				if (!match) {
					return false;
				}

				path = match.path;

				if (path === this.currentPath) {
					return true;
				}
			} else {
				path = encodePath(path.replace(/[\/\\]+/g, '/'));

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

				match = tryPath(path, this.nodes);

				if (!match) {
					return false;
				}

				var state = match.state;

				for (var name in state) {
					model[name](state[name]);
				}
			}

			var node = match.node;

			this.currentNode = node;
			this.currentNodeName(node.name);

			this.currentPath = path;

			if (isClient) {
				if (newHistoryStep !== false) {
					history.pushState({}, null, path);
				} else {
					history.replaceState(history.state, null, path);
				}
			}

			if (node.callback) {
				node.callback.call(this.app, path);
			}

			return true;
		}
	});

	module.exports = Router;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var env = __webpack_require__(2);
	var Class = __webpack_require__(6);
	var Router = __webpack_require__(16);

	var isClient = env.isClient;

	/**
	 * @class Rift.BaseApp
	 * @extends {Object}
	 * @abstract
	 */
	var BaseApp = Class.extend({
		/**
		 * @type {Rift.BaseModel}
		 */
		model: null,

		/**
		 * @type {Rift.BaseView}
		 */
		view: null,

		/**
		 * @type {Rift.Router}
		 */
		router: null,

		/**
		 * @typesign (params: {
		 *     modelClass: Function,
		 *     viewClass: Function,
		 *     nodes: Array<{ name?: string, path: string, callback?: (path: string) }>,
		 *     path: string
		 * });
		 *
		 * @typesign (params: {
		 *     modelClass: Function,
		 *     viewClass: Function,
		 *     viewBlock: HTMLElement,
		 *     nodes: Array<{ name?: string, path: string, callback?: (path: string) }>,
		 *     path: string
		 * });
		 */
		_init: function(params) {
			this.model = new params.modelClass();

			var router = this.router = new Router(this, params.nodes);

			router.route(params.path, false);

			var view = this.view = new params.viewClass({
				app: this,
				block: isClient ? params.viewBlock : null
			});

			router.start();

			if (isClient) {
				view.initClient();
			}
		},

		dispose: function() {
			this.router.dispose();
			this.view.dispose();
			this.model.dispose();
		}
	});

	module.exports = BaseApp;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var cellx = __webpack_require__(1);

	var EventEmitter = cellx.EventEmitter;

	function autobind(target, name, descr) {
		var fn = descr.initializer ? descr.initializer() : descr.value;

		return {
			configurable: false,
			enumerable: descr.enumerable,

			get: function() {
				var bound = descr.value = fn.bind(this);

				for (var prop in fn) {
					if (fn.hasOwnProperty(prop)) {
						bound[prop] = fn[prop];
					}
				}

				if (bound.constructor != fn.constructor) {
					Object.defineProperty(bound, 'constructor', {
						configurable: true,
						writable: true,
						value: fn.constructor
					});
				}

				Object.defineProperty(this, name, descr);

				return this[name];
			}
		};
	}

	exports.autobind = autobind;

	['on', 'off'].forEach(function(name) {
		var _name = '_' + name;
		var origMethod = EventEmitter.prototype[_name];

		EventEmitter.prototype[_name] = function(type, listener, context) {
			if (type.slice(0, 7) == 'change:') {
				this['_' + type.slice(7)](name, 'change', listener, context);
			} else {
				origMethod.call(this, type, listener, context);
			}
		};
	});

	function observable(target, name, descr, opts) {
		if (arguments.length == 1) {
			opts = target;

			return function(target, name, descr) {
				return observable(target, name, descr, opts);
			};
		}

		if (!opts) {
			opts = {};
		}

		opts.computed = false;

		var _name = '_' + name;

		target[_name] = cellx(descr.initializer(), opts);

		return {
			configurable: descr.configurable,
			enumerable: descr.enumerable,

			get: function() {
				return this[_name]();
			},

			set: function(value) {
				this[_name](value);
			}
		};
	}

	exports.observable = observable;

	function computed(target, name, descr, opts) {
		if (arguments.length == 1) {
			opts = target;

			return function(target, name, descr) {
				return computed(target, name, descr, opts);
			};
		}

		var value = descr.initializer();

		if (typeof value != 'function') {
			throw new TypeError('Property value must be a function');
		}

		if (!opts) {
			opts = {};
		}

		opts.computed = true;

		var _name = '_' + name;

		target[_name] = cellx(value, opts);

		var descr = {
			configurable: descr.configurable,
			enumerable: descr.enumerable,

			get: function() {
				return this[_name]();
			}
		};
		
		if (opts.write) {
			descr.set = function(value) {
				this[_name](value);
			};
		}

		return descr;
	}

	exports.computed = computed;


/***/ }
/******/ ])
});
;