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
