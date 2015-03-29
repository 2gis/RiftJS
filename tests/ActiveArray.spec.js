
describe('ActiveArray.js', function() {

	describe('ActiveArray', function() {

		it('Генерирует правильный addedValues', function() {
			var arr = new rt.ActiveArray([1, 2, 3]);
			var onChangeSpy = sinon.spy();

			arr.on('change', onChangeSpy);

			arr.push(2, 3, 4, 5, undefined, null);

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

		it('Понимает дырки при удалении', function() {
			var arr = new rt.ActiveArray(new Array(5));
			var onChangeSpy = sinon.spy();

			arr.on('change', onChangeSpy);

			arr.delete(0);

			expect(onChangeSpy.called)
				.to.not.be.ok;
		});

		it('Понимает дырки при уменьшении длинны', function() {
			var arr = new rt.ActiveArray(new Array(5));
			var onChangeSpy = sinon.spy();

			arr.on('change', onChangeSpy);

			arr.length = 1;

			expect(onChangeSpy.called)
				.to.not.be.ok;
		});

		it('Понимает дырки при shift и pop', function() {
			var arr = new rt.ActiveArray(new Array(5));
			var onChangeSpy = sinon.spy();

			arr.on('change', onChangeSpy);

			arr.shift();
			arr.pop();

			expect(onChangeSpy.called)
				.to.not.be.ok;
		});

		describe('ActiveArray#splice', function() {

			it('Сплайсит и понимает дырки', function() {
				var arr = new rt.ActiveArray([1, 2, 3, 4, 5, 6, 7, 8]);
				var onChangeSpy = sinon.spy();

				arr.delete(3);

				arr.on('change', onChangeSpy);

				arr.splice(1, 7, 2, 3, undefined);

				var eventMatch = sinon.match({
					detail: {
						diff: {
							$addedValues: [undefined],
							$removedValues: [5, 6, 7, 8]
						}
					}
				});

				expect(onChangeSpy.calledWithExactly(eventMatch))
					.to.be.ok;
			});

			it('Не изменяется при бесполезном splice', function() {
				var arr = new rt.ActiveArray([1, 2, 3, 4, 5]);
				var onChangeSpy = sinon.spy();

				arr.on('change', onChangeSpy);

				arr.splice(1, 2, 2, 3);

				expect(onChangeSpy.called)
					.to.not.be.ok;
			});

			it('Не изменяется при бесполезном splice 2', function() {
				var arr1 = new rt.ActiveArray([1, 2, , , , , , , 9]);
				var arr2 = new rt.ActiveArray([1, 2, , , , , , , ,]);
				var onChangeSpy1 = sinon.spy();
				var onChangeSpy2 = sinon.spy();

				arr1.on('change', onChangeSpy1);
				arr2.on('change', onChangeSpy2);

				arr1.splice(1, 5, 2);
				arr2.splice(1, 5, 2);

				expect(onChangeSpy1.called)
					.to.be.ok;

				expect(onChangeSpy2.called)
					.to.not.be.ok;
			});

		});

	});

});
