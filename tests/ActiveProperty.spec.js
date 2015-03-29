
describe('ActiveProperty.js', function() {

	describe('ActiveProperty', function() {

		it('ActiveProperty#dataCell', function() {
			function User() {}

			User.prototype.name = new rt.ActiveProperty('Мурзик');

			User.prototype.dispose = function() {
				rt.ActiveProperty.disposeDataCells(this);
			};

			var user = new User();
			var dc = user.name('dataCell', 0);

			expect(dc)
				.to.be.instanceof(rt.DataCell);

			expect(dc.value)
				.to.equal('Мурзик');

			user.dispose();
		});

	});

});
