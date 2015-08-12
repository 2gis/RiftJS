var request = require('superagent');

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
				res = {
					status: res.status,
					headers: res.headers,
					error: err ? { name: err.name, message: err.message } : null,
					body: res.body
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
