
describe('DataCell.js', function() {

	describe('DataCell', function() {

		it('Нет изменения, если установить значение равное текущему', function(done) {
			var onChangeSpy = sinon.spy();

			var a = new rt.DataCell(1, { onchange: onChangeSpy });

			a.value = 1;

			setTimeout(function() {
				expect(onChangeSpy.called)
					.to.not.be.ok;

				done();
			}, 1);
		});

		it('Нет изменения, если NaN заменяется на NaN', function(done) {
			var onChangeSpy = sinon.spy();

			var a = new rt.DataCell(NaN, { onchange: onChangeSpy });

			a.value = NaN;

			setTimeout(function() {
				expect(onChangeSpy.called)
					.to.not.be.ok;

				done();
			}, 1);
		});

		it('Нет изменения, если вычесляемое значение меняется с NaN на NaN', function(done) {
			var onChangeSpy = sinon.spy();

			var a = new rt.DataCell(1);
			var b = new rt.DataCell(function() {
				return a.value + NaN;
			}, { onchange: onChangeSpy });

			a.value = 2;

			setTimeout(function() {
				expect(onChangeSpy.called)
					.to.not.be.ok;

				done();
			}, 1);
		});

		it(
			'Изменение не эмитится, если установить значение не равное текущему и сразу вернуть исходное значение',
			function(done) {
				var onChangeSpy = sinon.spy();

				var a = new rt.DataCell(1, { onchange: onChangeSpy });

				a.value = 5;
				a.value = 1;

				setTimeout(function() {
					expect(onChangeSpy.called)
						.to.not.be.ok;

					expect(a.value)
						.to.equal(1);

					done();
				}, 1);
			}
		);

		it(
			'Изменение не эмитится, если установить значение не равное текущему и сразу вернуть исходное значению (2)',
			function(done) {
				var ee1 = new rt.EventEmitter();
				var ee2 = new rt.EventEmitter();

				var onChangeSpy = sinon.spy();

				var a = new rt.DataCell(ee1, { onchange: onChangeSpy });

				a.value = ee2;
				a.value = ee1;

				setTimeout(function() {
					expect(onChangeSpy.called)
						.to.not.be.ok;

					done();
				}, 1);
			}
		);

		it(
			'Изменение не эмитится, если установить значение не равное текущему, сделать в нём внутреннее изменение' +
				' и вернуть исходное значение',
			function(done) {
				var ee1 = new rt.EventEmitter();
				var ee2 = new rt.EventEmitter();

				var onChangeSpy = sinon.spy();

				var a = new rt.DataCell(ee1, { onchange: onChangeSpy });

				a.value = ee2;

				ee2.emit('change');

				a.value = ee1;

				setTimeout(function() {
					expect(onChangeSpy.called)
						.to.not.be.ok;

					done();
				}, 1);
			}
		);

		it(
			'Изменение эмитится, если сделать внутреннее изменение в текущем значении,' +
				' установить значение не равное текущему и вернуть исходное значение',
			function(done) {
				var ee1 = new rt.EventEmitter();
				var ee2 = new rt.EventEmitter();

				var onChangeSpy = sinon.spy();

				var a = new rt.DataCell(ee1, { onchange: onChangeSpy });

				ee1.emit('change');

				a.value = ee2;
				a.value = ee1;

				setTimeout(function() {
					expect(onChangeSpy.called)
						.to.be.ok;

					done();
				}, 1);
			}
		);

		it('При инициализации дочерний вычисляется 1 раз, даже если родителей больше одного', function(done) {
			var a = new rt.DataCell(1);
			var b = new rt.DataCell(2);

			var cFormulaSpy = sinon.spy(function() {
				return a.value + b.value;
			});

			var c = new rt.DataCell(cFormulaSpy);

			setTimeout(function() {
				expect(cFormulaSpy.calledOnce)
					.to.be.ok;

				expect(cFormulaSpy.firstCall.args.length)
					.to.equal(0);

				expect(cFormulaSpy.firstCall.returnValue)
					.to.equal(3);

				done();
			}, 1);
		});

		it('При изменении нескольких родителей дочерний пересчитывается 1 раз', function(done) {
			var a = new rt.DataCell(1);
			var b = new rt.DataCell(2);

			var cFormulaSpy = sinon.spy(function() {
				return a.value + b.value;
			});

			var c = new rt.DataCell(cFormulaSpy);

			setTimeout(function() {
				cFormulaSpy.reset();

				a.value = 5;
				b.value = 10;

				setTimeout(function() {
					expect(cFormulaSpy.calledOnce)
						.to.be.ok;

					expect(cFormulaSpy.firstCall.args.length)
						.to.equal(0);

					expect(cFormulaSpy.firstCall.returnValue)
						.to.equal(15);

					done();
				}, 1);
			}, 1);
		});

		it('При изменении нескольких родителей дочерний пересчитывается 1 раз (2)', function(done) {
			var a = new rt.DataCell(1);
			var b = new rt.DataCell(2);
			var aa = new rt.DataCell(function() { return a.value + 1; });
			var bb = new rt.DataCell(function() { return b.value + 1; });

			var cFormulaSpy = sinon.spy(function() {
				return aa.value + bb.value;
			});

			var c = new rt.DataCell(cFormulaSpy);

			setTimeout(function() {
				cFormulaSpy.reset();

				a.value = 5;
				b.value = 10;

				setTimeout(function() {
					expect(cFormulaSpy.calledOnce)
						.to.be.ok;

					expect(cFormulaSpy.firstCall.args.length)
						.to.equal(0);

					expect(cFormulaSpy.firstCall.returnValue)
						.to.equal(17);

					done();
				}, 1);
			}, 1);
		});

		it('Срабатывают все обработчики изменения, даже если в них запрашивать значения ячеек других', function(done) {
			var aChangeSpy = sinon.spy(function() {
				var bValue = b.value;
			});
			var bChangeSpy = sinon.spy(function() {
				var cValue = c.value;
			});
			var cChangeSpy = sinon.spy(function() {
				var aValue = a.value;
			});

			var a = new rt.DataCell(1, { onchange: aChangeSpy });
			var b = new rt.DataCell(2, { onchange: bChangeSpy });
			var c = new rt.DataCell(3, { onchange: cChangeSpy });

			setTimeout(function() {
				a.value = 5;
				b.value = 10;
				c.value = 15;

				setTimeout(function() {
					expect(aChangeSpy.calledOnce)
						.to.be.ok;

					expect(bChangeSpy.calledOnce)
						.to.be.ok;

					expect(cChangeSpy.calledOnce)
						.to.be.ok;

					done();
				}, 1);
			}, 1);
		});

		it('Второй поток не портит жизнь первому', function() {
			var a = new rt.DataCell(1);
			var b = new rt.DataCell(2);

			var t = 0;
			var aa = new rt.DataCell(function() {
				if (t++) {
					b.value = 10;
				}

				return a.value + 1;
			});

			var bb = new rt.DataCell(function() {
				return b.value + 1;
			});

			a.value = 5;

			expect(aa.value)
				.to.equal(6);
		});

		it('Правильно считается, если в формуле делаем set и сразу get', function() {
			var a = new rt.DataCell(1);
			var b = new rt.DataCell(function() {
				return a.value + 1;
			});
			var c = new rt.DataCell(function() {
				if (b.value == 3) {
					a.value = 10;
				}

				return b.value + 1;
			});
			var d = new rt.DataCell(function() {
				return c.value + 1;
			});

			a.value = 2;

			expect(d.value)
				.to.equal(13);
		});

		it('Обработчик изменения не срабатывает, если добавить его после изменения', function(done) {
			var onChangeSpy = sinon.spy();

			var a = new rt.DataCell(1);

			a.value = 2;

			a.on('change', onChangeSpy);

			setTimeout(function() {
				expect(onChangeSpy.called)
					.to.not.be.ok;

				done();
			}, 1);
		});

		it('Инлайновый обработчик изменения не срабатывает, если добавить его после изменения', function(done) {
			var onChangeSpy = sinon.spy();

			var a = new rt.DataCell(1);

			a.value = 2;

			a.onchange = onChangeSpy;

			setTimeout(function() {
				expect(onChangeSpy.called)
					.to.not.be.ok;

				done();
			}, 1);
		});

		it('Ошибка распространяется правильно', function(done) {
			var bOnErrorSpy = sinon.spy();
			var c1OnErrorSpy = sinon.spy();
			var c2OnErrorSpy = sinon.spy();
			var dOnErrorSpy = sinon.spy();

			var a = new rt.DataCell(1);

			var t = 0;
			var b = new rt.DataCell(function() {
				if (t++) {
					throw 1;
				}

				return a.value + 1;
			}, { onerror: bOnErrorSpy });

			var c1 = new rt.DataCell(function() { return b.value + 1; }, { onerror: c1OnErrorSpy });
			var c2 = new rt.DataCell(function() { return b.value + 1; }, { onerror: c2OnErrorSpy });
			var d = new rt.DataCell(function() { return c1.value + c2.value; }, { onerror: dOnErrorSpy });

			a.value = 2;

			setTimeout(function() {
				expect(bOnErrorSpy.calledOnce)
					.to.be.ok;

				expect(c1OnErrorSpy.calledOnce)
					.to.be.ok;

				expect(c2OnErrorSpy.calledOnce)
					.to.be.ok;

				expect(dOnErrorSpy.calledOnce)
					.to.be.ok;

				done();
			}, 1);
		});

	});

});
