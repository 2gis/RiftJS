
describe('EventEmitter.js', function() {

	describe('EventEmitter', function() {

		describe('EventEmitter#emit', function() {

			it('Обработчик при эмите срабатывает 1 раз и получает только инстанс Rift.Event-а', function() {
				var ee = new Rift.EventEmitter();
				var onActionSpy = sinon.spy();

				ee.on('action', onActionSpy);

				ee.emit('action');

				expect(onActionSpy.calledOnce)
					.to.be.ok;

				expect(onActionSpy.firstCall.args.length)
					.to.equal(1);

				expect(onActionSpy.firstCall.args[0])
					.to.instanceof(Rift.Event);
			});

			it('Обработчик, добавленный без указания контекста, срабатывает в контексте излучателя', function() {
				var ee = new Rift.EventEmitter();
				var onActionSpy = sinon.spy();

				ee.on('action', onActionSpy);

				ee.emit('action');

				expect(onActionSpy.calledOn(ee))
					.to.be.ok;
			});

			it('Обработчик срабатывает в указанном контексте', function() {
				var ee = new Rift.EventEmitter();
				var onActionSpy = sinon.spy();
				var context = {};

				ee.on('action', onActionSpy, context);

				ee.emit('action');

				expect(onActionSpy.calledOn(context))
					.to.be.ok;
			});

			it('Бросает ошибку при повторном использовании эвента', function() {
				var ee = new Rift.EventEmitter();
				var evt = new Rift.Event('action');

				ee.emit(evt);

				expect(function() {
					ee.emit(evt);
				})
					.to.throw(TypeError);
			});

		});

	});

});
