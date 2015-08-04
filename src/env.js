var isServer = typeof window == 'undefined' && typeof navigator == 'undefined';

exports.isServer = isServer;
exports.isClient = !isServer;
