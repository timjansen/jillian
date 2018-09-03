'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({Fraction}));

describe('Fraction', function() {
	it('creates and serializes', function() {
		jelAssert.equal(new Fraction(1, 2), "Fraction(1, 2)");
		jelAssert.notEqual(new Fraction(1, 2), "Fraction(1, 3)");
	});
	
	it('supports fraction<->fraction arithmetic', function() {
		jelAssert.equal(new Fraction(1, 2), "Fraction(1, 4) + Fraction(1, 4)");
		jelAssert.equal(new Fraction(7, 16), "Fraction(4, 8) - Fraction(1, 16)");
		jelAssert.equal(new Fraction(1, 4), "Fraction(1, 2) * Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 1), "Fraction(1, 2) / Fraction(1, 2)");

		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(2, 4) == Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(2, 4) === Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(2, 4) != Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(2, 4) !== Fraction(1, 3)");

		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) > Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) > Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) < Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) < Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) <= Fraction(1, 3)");

		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >> Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >> Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) << Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) << Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >>= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >>= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >>= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <<= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <<= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) <<= Fraction(1, 3)");
	});

	it('supports fraction<->number arithmetic', function() {
		jelAssert.equal(new Fraction(9, 4), "Fraction(1, 4) + 2");
		jelAssert.equal(new Fraction(-1, 2), "Fraction(4, 8) - 1");
		jelAssert.equal(new Fraction(3, 2), "Fraction(1, 2) * 3");
		jelAssert.equal(new Fraction(1, 4), "Fraction(1, 2) / 2");

		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(4, 4) == 1");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(4, 4) === 1");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) != 1");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) !== 1");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) == 0.75");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) === 0.75");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) != 0.8");
		jelAssert.equal(FuzzyBoolean.TRUE, "Fraction(3, 4) !== 0.8");

		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) > 0");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) > 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(5, 3) < 2");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(3, 3) < 1");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) < 0");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >= 0");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(2, 1) >= 2");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >= 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <= 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(3, 3) <= 1");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) <= 0");

		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >> 0");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >> 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(-5, 3) << 0");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(3, 3) << 1");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) << 0");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 2) >>= 0");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(2, 1) >>= 2");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 3) >>= 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(1, 3) <<= 1");
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(3, 3) <<= 1");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(1, 2) <<= 0");
	});

	it('supports number<->fraction arithmetic', function() {
		jelAssert.equal(new Fraction(9, 4), "2 + Fraction(1, 4)");
		jelAssert.equal(new Fraction(5, 8), "1 - Fraction(3, 8)");
		jelAssert.equal(new Fraction(3, 2), "3 * Fraction(1, 2)");
		jelAssert.equal(new Fraction(10, 1), "5 / Fraction(1, 2)");

		jelAssert.equal(0.75, "0.5 + Fraction(1, 4)");
		jelAssert.equal(0.75, "1.5 - Fraction(3, 4)");
		jelAssert.equal(0.75, "1.5 * Fraction(1, 2)");
		jelAssert.equal(5, "2.5 / Fraction(1, 2)");

		jelAssert.equal(FuzzyBoolean.TRUE, "1 == Fraction(4, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 === Fraction(4, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 != Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 !== Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "0.75 == Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "0.75 === Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "0.8 != Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "0.8 !== Fraction(3, 4)");

		jelAssert.equal(FuzzyBoolean.TRUE, "1 == Fraction(4, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 === Fraction(4, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 != Fraction(3, 4)");
		jelAssert.equal(FuzzyBoolean.TRUE, "1 !== Fraction(3, 4)");

		jelAssert.equal(FuzzyBoolean.TRUE,  "0 < Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 < Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "2 > Fraction(5, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 > Fraction(3, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "0 > Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "0 <= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "2 <= Fraction(2, 1)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 <= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "1 >= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "1 >= Fraction(3, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "0 >= Fraction(1, 2)");

		jelAssert.equal(FuzzyBoolean.TRUE,  "0 << Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 << Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "2 >> Fraction(5, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 >> Fraction(3, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "0 >> Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "0 <<= Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "2 <<= Fraction(2, 1)");
		jelAssert.equal(FuzzyBoolean.FALSE, "1 <<= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "1 >>= Fraction(1, 3)");
		jelAssert.equal(FuzzyBoolean.TRUE,  "1 >>= Fraction(3, 3)");
		jelAssert.equal(FuzzyBoolean.FALSE, "0 >>= Fraction(1, 2)");
	});
	
	it('supports single-ops', function() {
		jelAssert.equal(FuzzyBoolean.FALSE, "!Fraction(1, 2)");
		jelAssert.equal(FuzzyBoolean.TRUE, "!Fraction(0, 2)");
		jelAssert.equal(new Fraction(-1, 2), "-Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 2), "+Fraction(1, 2)");
		jelAssert.equal(new Fraction(-1, 2), "-+-+-Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 2), "abs Fraction(-1, 2)");
	});
});