describe('namespace.js', function() {

	describe('namespace.create', function() {

		after(function() {
			delete window.a;
		});

		it('Создаёт в window', function() {
			var ns = rt.namespace.create('a.b.c');

			expect(window)
				.to.have.deep.property('a.b.c', ns);
		});

		it('Создаёт в указанном объекте', function() {
			var root = {};
			var ns = rt.namespace.create('a.b.c', root);

			expect(root)
				.to.have.deep.property('a.b.c', ns);
		});

		it('Возвращает существующее, если уже есть', function() {
			var root = {};
			var ns = rt.namespace.create('a.b.c', root);

			expect(ns)
				.to.equal(rt.namespace.create('a.b.c', root));
		});

	});

});
