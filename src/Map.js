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

		Map = function Map() {
			this._inner = Object.create(null);
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
