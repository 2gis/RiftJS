if (!global.Map) {
	(function() {

		var getHash = rt.value.getHash;

		var entryStub = {
			key: undefined,
			value: undefined,
			prev: null,
			next: null
		};

		function Map(arr) {
			this._inner = Object.create(null);

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.set(arr[i][0], arr[i][1]);
				}
			}
		}

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

			keys: function() {
				var entry = this._first;

				return {
					next: function() {
						if (entry) {
							var step = { value: entry.key, done: false };
							entry = entry.next;
							return step;
						}

						return { value: undefined, done: true };
					}
				};
			},

			values: function() {
				var entry = this._first;

				return {
					next: function() {
						if (entry) {
							var step = { value: entry.value, done: false };
							entry = entry.next;
							return step;
						}

						return { value: undefined, done: true };
					}
				};
			},

			entries: function() {
				var entry = this._first;

				return {
					next: function() {
						if (entry) {
							var step = { value: [entry.key, entry.value], done: false };
							entry = entry.next;
							return step;
						}

						return { value: undefined, done: true };
					}
				};
			},

			clear: function() {
				var inner = this._inner;

				for (var hash in inner) {
					delete inner[hash];
				}

				this._first = null;
				this._last = null;

				this._size = 0;
			}
		});

		global.Map = Map;

	})();
}

if (!global.Set) {
	(function() {

		function Set(arr) {
			this._inner = new Map();

			if (arr) {
				for (var i = 0, l = arr.length; i < l; i++) {
					this.add(arr[i]);
				}
			}
		}

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

			keys: function() {
				return this._inner.keys();
			},

			values: function() {
				return this._inner.values();
			},

			entries: function() {
				return this._inner.entries();
			},

			clear: function() {
				this._inner.clear();
			}
		});

		global.Set = Set;

	})();
}
