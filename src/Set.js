(function() {

	var Set = global.Set;

	if (!Set || Set.toString().indexOf('[native code]') == -1) {
		var Map = rt.Map;

		Set = function Set() {
			this._inner = new Map();
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
				this._inner.delete(value);
				this._inner.set(value, null);

				return this;
			},

			delete: function(value) {
				return this._inner.delete(value);
			},

			forEach: function(cb, context) {
				if (context == null) {
					context = global;
				}

				this._inner.forEach(function(value, key) {
					cb.call(context, key, key, this);
				}, this);
			},

			clear: function() {
				this._inner = new Map();
			}
		});
	}

	rt.Set = Set;

})();
