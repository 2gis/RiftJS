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
	}

	rt.Set = Set;

})();
