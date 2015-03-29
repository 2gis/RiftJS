
describe('object.js', function() {

	describe('object.getUID', function() {

		//

	});

	describe('object.mixin', function() {

		var obj = rt.object.mixin({}, Object.create({
			inheritedProperty: 1
		}, {
			simpleProperty: {
				configurable: true,
				enumerable: true,
				writable: true,
				value: 1
			},

			notEnumerableProperty: {
				configurable: true,
				enumerable: false,
				writable: true,
				value: 1
			},

			simpleAccessor: {
				configurable: true,
				enumerable: true,
				get: function() { return 1; }
			},

			notEnumerableAccessor: {
				configurable: true,
				enumerable: false,
				get: function() { return 1; }
			}
		}));

		it('Не переписывает унаследованные свойства', function() {
			expect(obj)
				.to.not.have.ownProperty('inheritedProperty');
		});

		it('Переписывает по дескрипторам а не по значениям', function() {
			expect(Object.getOwnPropertyDescriptor(obj, 'simpleAccessor'))
				.to.have.property('get');
		});

		it('Переписывает notEnumerable свойства', function() {
			expect(obj)
				.to.have.property('notEnumerableProperty');

			expect(obj)
				.to.have.property('notEnumerableAccessor');
		});

	});

	describe('object.clone', function() {

		var proto = {};
		var obj = { __proto__: proto };
		var copy = rt.object.clone(obj);

		it('Копирует __proto__', function() {
			expect(Object.getPrototypeOf(copy))
				.to.equal(proto);
		});

	});

});
