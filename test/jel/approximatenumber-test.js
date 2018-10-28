'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.get());

describe('ApproximateNumber', function() {
	it('creates and serializes', function() {
		jelAssert.equal("ApproximateNumber(1, 2)", new ApproximateNumber(1, 2));
		jelAssert.equal("ApproximateNumber(1, 0)", new ApproximateNumber(1));
		jelAssert.equal("1 +- 2", new ApproximateNumber(1, 2));
		jelAssert.equal("1 +- 0", new ApproximateNumber(1));
		jelAssert.equal("1/2+-1/4", new ApproximateNumber(new Fraction(1, 2), new Fraction(1, 4)));
		jelAssert.equal("4+-1/4", new ApproximateNumber(4, new Fraction(1, 4)));
		jelAssert.equal("1/2+-5", new ApproximateNumber(new Fraction(1, 2), 5));
		jelAssert.notEqual("ApproximateNumber(1, 3)", new ApproximateNumber(1, 2));
	});
	
	it('supports approxnumber<->approxnumber arithmetic', function() {
		jelAssert.equal("ApproximateNumber(1, 4) + ApproximateNumber(1, 4)", new ApproximateNumber(2, 8));
		jelAssert.equal("ApproximateNumber(1, 6) + ApproximateNumber(1, 4)", new ApproximateNumber(2, 10));
		jelAssert.equal("ApproximateNumber(4, 8) - ApproximateNumber(1, 16)", new ApproximateNumber(3, 24));
		jelAssert.equal("ApproximateNumber(1, 2) * ApproximateNumber(1, 2)", new ApproximateNumber(1, 4));
		jelAssert.equal("ApproximateNumber(2, 2) * ApproximateNumber(3, 2)", new ApproximateNumber(6, 10));
		jelAssert.equal("ApproximateNumber(1, 2) / ApproximateNumber(1, 2)", new ApproximateNumber(1, 4));
		jelAssert.equal("ApproximateNumber(4, 2) ^ ApproximateNumber(3, 1)", new ApproximateNumber(64,8));

		jelAssert.equal("ApproximateNumber(1, 0) == ApproximateNumber(1, 0)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(1, 4) == ApproximateNumber(1, 2)", FuzzyBoolean.TRUE);
		jelAssert.fuzzy("ApproximateNumber(2, 4) == ApproximateNumber(1, 2)", 0.8, 0.99);
		jelAssert.fuzzy("ApproximateNumber(1, 4) == ApproximateNumber(6.5, 2)", 0.5001, 0.6);
		jelAssert.fuzzy("ApproximateNumber(-1, 2) == ApproximateNumber(-3, 2)", 0.72, 0.78);
		jelAssert.fuzzy("ApproximateNumber(-1, 2) == ApproximateNumber(1, 2)", 0.72, 0.78);
		jelAssert.fuzzy("ApproximateNumber(7, 4) == ApproximateNumber(1, 2)", 0.4, 0.4999999);
		jelAssert.fuzzy("ApproximateNumber(12, 4) == ApproximateNumber(1, 2)", 0.0001, 0.1);
		jelAssert.fuzzy("ApproximateNumber(0, 0) == ApproximateNumber(3, 2)", 0.2, 0.4);
		jelAssert.equal("ApproximateNumber(0, 1) == ApproximateNumber(4, 1)", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(1, 2) == ApproximateNumber(20, 2)", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(1, 4) === ApproximateNumber(1, 2)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(1, 4) === ApproximateNumber(1, 4)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(1, 4) === ApproximateNumber(2, 4)", FuzzyBoolean.FALSE);
		jelAssert.fuzzy("ApproximateNumber(2, 4) != ApproximateNumber(1, 3)", 0.00001, 0.2);
		jelAssert.fuzzy("ApproximateNumber(7, 4) != ApproximateNumber(1, 2)", 0.50000001, 0.6);
		jelAssert.fuzzy("ApproximateNumber(10, 4) != ApproximateNumber(1, 2)", 0.7, 0.8);
		jelAssert.equal("ApproximateNumber(1, 4) != ApproximateNumber(100, 3)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(2, 4) != ApproximateNumber(2, 3)", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(2, 4) !== ApproximateNumber(1, 3)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(2, 4) !== ApproximateNumber(2, 3)", FuzzyBoolean.FALSE);

		jelAssert.fuzzy("ApproximateNumber(1, 2) > ApproximateNumber(1, 3)", 0.4, 0.49999999);
		jelAssert.fuzzy("ApproximateNumber(2, 2) > ApproximateNumber(1, 3)", 0.59, 0.61);
		jelAssert.fuzzy("ApproximateNumber(1, 0) > ApproximateNumber(1, 2)", 0.4, 0.49999999);
		jelAssert.fuzzy("ApproximateNumber(100, 0) > ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 0) > ApproximateNumber(100, 2)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 3) < ApproximateNumber(1, 0)", 0.4, 0.49999999);
		jelAssert.fuzzy("ApproximateNumber(1, 2) < ApproximateNumber(1, 3)", 0.4, 0.49999999);
		jelAssert.fuzzy("ApproximateNumber(1, 2) >= ApproximateNumber(1, 3)", 0.5, 0.51);
		jelAssert.fuzzy("ApproximateNumber(1, 2) >= ApproximateNumber(1, 2)", 0.5, 0.51);
		jelAssert.fuzzy("ApproximateNumber(-1, 3) >= ApproximateNumber(-1, 2)", 0.5, 0.51);
		jelAssert.fuzzy("ApproximateNumber(1, 3) <= ApproximateNumber(1, 2)", 0.5, 0.51);
		jelAssert.fuzzy("ApproximateNumber(2, 3) <= ApproximateNumber(1, 3)", 0.4, 0.42);
		jelAssert.fuzzy("ApproximateNumber(2, 2) >= ApproximateNumber(1, 0)", 0.74, 0.76);
		jelAssert.fuzzy("ApproximateNumber(1, 2) <= ApproximateNumber(1, 3)", 0.5, 0.51);

		jelAssert.fuzzy("ApproximateNumber(1, 2) >> ApproximateNumber(1, 3)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 3) >> ApproximateNumber(1, 2)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 3) << ApproximateNumber(1, 3)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 2) << ApproximateNumber(1, 3)", 0);
		jelAssert.fuzzy("ApproximateNumber(2, 2) >> ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(-1, 2) << ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) >>= ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) >>= ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 3) >>= ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 3) <<= ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 3) <<= ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) <<= ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(-1, 3) <<= ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) <<= ApproximateNumber(-1, 3)", 0);
	});

	it('supports approxnumber<->number arithmetic', function() {
		jelAssert.equal("ApproximateNumber(1, 4) + 2", new ApproximateNumber(3, 4));
		jelAssert.equal("ApproximateNumber(4, 8) - 1", new ApproximateNumber(3, 8));
		jelAssert.equal("ApproximateNumber(1, 2) * 3", new ApproximateNumber(3, 6));
		jelAssert.equal("ApproximateNumber(8, 2) / 2", new ApproximateNumber(4, 4));
		jelAssert.equal("ApproximateNumber(4, 2) ^ 3", new ApproximateNumber(64, 8));


		jelAssert.equal("2 + ApproximateNumber(1, 4)", new ApproximateNumber(3, 4));
		jelAssert.equal("5 - ApproximateNumber(4, 8)", new ApproximateNumber(1, 8));
		jelAssert.equal("3 * ApproximateNumber(1, 2)", new ApproximateNumber(3, 6));
		jelAssert.equal("16 / ApproximateNumber(8, 2)", new ApproximateNumber(2, 32));
		
		jelAssert.equal("1 == ApproximateNumber(1, 0)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(1, 0) == 1", FuzzyBoolean.TRUE);
		jelAssert.equal("1 == ApproximateNumber(2, 0)", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(2, 0) == 1", FuzzyBoolean.FALSE);
		jelAssert.equal("1 == ApproximateNumber(1, 2)", FuzzyBoolean.TRUE);
		jelAssert.fuzzy("2 == ApproximateNumber(1, 6)", 0.8, 0.99);
		jelAssert.fuzzy("1 == ApproximateNumber(5.5, 5)", 0.5001, 0.6);
		jelAssert.fuzzy("1 == ApproximateNumber(6.5, 5)", 0.4, 0.49999);
		jelAssert.fuzzy("ApproximateNumber(5.5, 5) == 1", 0.5001, 0.6);
		jelAssert.fuzzy("-1 == ApproximateNumber(-3, 6)", 0.8, 0.9);
		jelAssert.fuzzy("-1 == ApproximateNumber(-3, 4)", 0.72, 0.78);
		jelAssert.fuzzy("-1 == ApproximateNumber(1, 4)", 0.72, 0.78);
		jelAssert.fuzzy("ApproximateNumber(1, 4) == -1", 0.72, 0.78);
		jelAssert.fuzzy("7 == ApproximateNumber(1, 5)", 0.4, 0.4999999);
		jelAssert.fuzzy("0 == ApproximateNumber(3, 2)", 0.2, 0.4);
		jelAssert.equal("0 == ApproximateNumber(4, 1)", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(4, 1) == 0", FuzzyBoolean.FALSE);
		jelAssert.equal("ApproximateNumber(20, 2) == 1", FuzzyBoolean.FALSE);
		jelAssert.equal("1 === ApproximateNumber(1, 2)", FuzzyBoolean.TRUE);
		jelAssert.fuzzy("2 != ApproximateNumber(1, 7)", 0.00001, 0.2);
		jelAssert.fuzzy("7 != ApproximateNumber(1, 5)", 0.50000001, 0.6);
		jelAssert.fuzzy("10 != ApproximateNumber(1, 5)", 0.85, 0.95);
		jelAssert.equal("4 != ApproximateNumber(100, 3)", FuzzyBoolean.TRUE);
		jelAssert.equal("ApproximateNumber(100, 3) != 5", FuzzyBoolean.TRUE);
		jelAssert.equal("2 != ApproximateNumber(2, 3)", FuzzyBoolean.FALSE);
		jelAssert.equal("2 !== ApproximateNumber(1, 3)", FuzzyBoolean.TRUE);
		jelAssert.equal("2 !== ApproximateNumber(2, 3)", FuzzyBoolean.FALSE);

		jelAssert.fuzzy("1 > ApproximateNumber(1, 5)", 0.4, 0.49999999);
		jelAssert.fuzzy("2 > ApproximateNumber(1, 5)", 0.55, 0.65);
		jelAssert.fuzzy("1 > ApproximateNumber(1, 2)", 0.4, 0.49999999);
		jelAssert.fuzzy("100 > ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) > 100", 0);
		jelAssert.fuzzy("1 < ApproximateNumber(1, 0)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 3) < 1", 0.4, 0.49999999);
		jelAssert.fuzzy("ApproximateNumber(1, 2) < 1", 0.4, 0.49999999);
		jelAssert.fuzzy("1 >= ApproximateNumber(1, 5)", 0.5, 0.51);
		jelAssert.fuzzy("ApproximateNumber(1, 5) >= 1", 0.5, 0.51);
		jelAssert.fuzzy("-1 >= ApproximateNumber(-1, 2)", 0.5, 0.51);
		jelAssert.fuzzy("1 <= ApproximateNumber(1, 5)", 0.5, 0.51);
		jelAssert.fuzzy("2 <= ApproximateNumber(1, 5)", 0.37, 0.42);
		jelAssert.fuzzy("ApproximateNumber(2, 2) >= 1", 0.74, 0.76);
		jelAssert.fuzzy("ApproximateNumber(1, 5) <= 1", 0.5, 0.51);

		jelAssert.fuzzy("1 >> ApproximateNumber(1, 3)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 3) >> 1", 0);
		jelAssert.fuzzy("1 << ApproximateNumber(1, 3)", 0);
		jelAssert.fuzzy("ApproximateNumber(1, 2) << 1", 0);
		jelAssert.fuzzy("2 >> ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(2, 2) >> 1", 1);
		jelAssert.fuzzy("-1 << ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) >>= 1", 1);
		jelAssert.fuzzy("1 >>= ApproximateNumber(1, 2)", 1);
		jelAssert.fuzzy("ApproximateNumber(1, 2) <<= 1", 1);
		jelAssert.fuzzy("-1 <<= ApproximateNumber(1, 3)", 1);
		jelAssert.fuzzy("1 <<= ApproximateNumber(-1, 3)", 0);

	});
	
	it('support single-ops', function() {
		jelAssert.fuzzy("!ApproximateNumber(1, 4)", 0);
		jelAssert.fuzzy("!ApproximateNumber(-1, 6)", 0);
		jelAssert.fuzzy("!ApproximateNumber(0, 8)", 1);
	});
});
