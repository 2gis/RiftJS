
describe('ActiveDictionary.js', function() {

	describe('ActiveDictionary', function() {

		it('Генерирует правильный diff при добавлении нового свойства и изменении существующего', function() {
			var dict = new rt.ActiveDictionary({ a: 1 });
			var onChangeSpy = sinon.spy();

			dict.on('change', onChangeSpy);

			dict.set({ a: 2, b: 1, c: undefined });

			var eventMatch = sinon.match({
				detail: {
					diff: {
						a: {
							type: 'update',
							oldValue: 1,
							value: 2
						},
						b: {
							type: 'add',
							oldValue: undefined,
							value: 1
						},
						c: {
							type: 'add',
							oldValue: undefined,
							value: undefined
						}
					}
				}
			});

			expect(onChangeSpy.calledWithExactly(eventMatch))
				.to.be.ok;
		});

		it('Генерирует правильный diff при удалении свойства', function() {
			var dict = new rt.ActiveDictionary({ a: 1, b: undefined });
			var onChangeSpy = sinon.spy();

			dict.on('change', onChangeSpy);

			dict.delete('a', 'b', 'c');

			var eventMatch = sinon.match({
				detail: {
					diff: {
						a: {
							type: 'delete',
							oldValue: 1,
							value: undefined
						},
						b: {
							type: 'delete',
							oldValue: undefined,
							value: undefined
						}
					}
				}
			});

			expect(onChangeSpy.calledWithExactly(eventMatch))
				.to.be.ok;
		});

		it('Генерирует правильный addedValues', function() {
			var dict = new rt.ActiveDictionary({ a: 1, b: 2, c: 3 });
			var onChangeSpy = sinon.spy();

			dict.on('change', onChangeSpy);

			dict.set({ b: 2, c: 3, e: 4, f: 5, g: undefined, h: null });

			var eventMatch = sinon.match({
				detail: {
					diff: {
						$addedValues: [4, 5, undefined, null],
						$removedValues: []
					}
				}
			});

			expect(onChangeSpy.calledWithExactly(eventMatch))
				.to.be.ok;
		});

		it('Генерирует правильный addedValues (2) и removedValues', function() {
			var dict = new rt.ActiveDictionary({ a: 1, b: 2, c: 3 });
			var onChangeSpy = sinon.spy();

			dict.on('change', onChangeSpy);

			dict.set({ b: 1, c: 2 });

			var eventMatch = sinon.match({
				detail: {
					diff: {
						$addedValues: [],
						$removedValues: [3]
					}
				}
			});

			expect(onChangeSpy.calledWithExactly(eventMatch))
				.to.be.ok;
		});

		it('Рабочий handleItemChanges', function() {
			var dict1 = new rt.ActiveDictionary({ a: 1 });
			var dict2 = new rt.ActiveDictionary({ a: dict1 }, true);

			var onChangeSpy = sinon.spy();

			dict2.on('change', onChangeSpy);

			dict1.set({ b: 2 });

			var eventMatch = sinon.match({
				detail: {
					diff: {
						$addedValues: [2],
						$removedValues: [],

						b: {
							type: 'add',
							oldValue: undefined,
							value: 2
						}
					}
				}
			});

			expect(onChangeSpy.calledWithExactly(eventMatch))
				.to.be.ok;
		});

	});

});
