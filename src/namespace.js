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
	_.namespace = {
		create: createNamespace,
		exec: execNamespace
	};

})();
