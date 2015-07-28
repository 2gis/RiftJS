(function() {
	/**
	 * @typesign (obj: Object): Object;
	 */
	function bindCells(obj) {
		Object.keys(obj).forEach(function(name) {
			var descr = Object.getOwnPropertyDescriptor(obj, name);
			var value = descr.value;

			if (typeof value == 'function' && value.constructor == cellx) {
				obj[name] = value.bind(obj);
				obj[name].constructor = cellx;
			}
		});

		return obj;
	}

	rt.bindCells = bindCells;
})();
