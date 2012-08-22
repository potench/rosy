define([
	"test/lib/chai",
	"test/lib/mocha/mocha"
], function (chai, _mocha) {
	mocha.setup("bdd");
	expect = chai.expect;

	return {
		tests : {
			core : [],
			modules : []
		},

		addCoreTests : function (tests) {
			this.tests.core.push(tests);
		},

		addModuleTests : function (tests) {
			this.tests.modules.push(tests);
		},

		registerTests : function () {
			var tests = this.tests;
			var key, test, i, j;

			for (key in tests) {
				test = tests[key].sort();

				for (i = 0, j = test.length; i < j; i++) {
					test[i]();
				}
			}
		}
	};
});
