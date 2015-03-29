
describe('regex.js', function() {

	describe('regex.escape', function() {

		it('Экранирует', function() {
			var re = 'Hello?!*`~World()[]';

			expect(rt.regex.escape(re))
				.to.equal('Hello\\?!\\*`~World\\(\\)\\[\\]');
		});

	});

	describe('regex.forEach', function() {

		it('Находит 3 совпадения', function() {
			var cbSpy = sinon.spy();

			rt.regex.forEach(/([a-z]+)\-(\d+)/g, 'a-1 b-2 c-3', cbSpy);

			expect(cbSpy.calledThrice)
				.to.be.ok;

			expect(cbSpy.firstCall.args)
				.to.deep.equal(['a-1', 'a', '1']);

			expect(cbSpy.secondCall.args)
				.to.deep.equal(['b-2', 'b', '2']);

			expect(cbSpy.thirdCall.args)
				.to.deep.equal(['c-3', 'c', '3']);
		});

		it('Ищет с lastIndex == 0, даже если lastIndex != 0, и после поиска устанавливает lastIndex в 0', function() {
			var cbSpy = sinon.spy();
			var re = /([a-z]+)\-(\d+)/g;

			re.lastIndex = 1;

			rt.regex.forEach(re, 'a-1', cbSpy);

			expect(cbSpy.calledOnce)
				.to.be.ok;

			expect(re.lastIndex)
				.to.equal(0);
		});

		it('Отменяет дальнейший поиск совпадений при возвращении false', function() {
			var cbSpy = sinon.spy(function(match) {
				if (match == 'b-2') {
					return false;
				}
			});

			rt.regex.forEach(/([a-z]+)\-(\d+)/g, 'a-1 b-2 c-3', cbSpy);

			expect(cbSpy.calledTwice)
				.to.be.ok;
		});

	});

});
