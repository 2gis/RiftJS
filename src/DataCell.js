(function() {

	var nextTick = rt.process.nextTick;
	var Map = rt.Map;
	var Set = rt.Set;
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
