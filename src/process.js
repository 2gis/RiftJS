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
