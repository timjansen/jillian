'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const JelMath = require('../../build/jel/types/Math.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.get());

describe('Fraction', function() {
	it('creates and serializes', function() {
		jelAssert.equal(new Fraction(1, 2), "Fraction(1, 2)");
		jelAssert.notEqual(new Fraction(1, 2), "Fraction(1, 3)");
		jelAssert.equal(new Fraction(1, 2), "1/2");
		jelAssert.equal(new Fraction(50, 20), "50/20");
	});
	
	it('supports fraction<->fraction arithmetic', function() {
		jelAssert.equal(new Fraction(1, 2), "Fraction(1, 4) + Fraction(1, 4)");
		jelAssert.equal(new Fraction(7, 16), "Fraction(4, 8) - Fraction(1, 16)");
		jelAssert.equal(new Fraction(1, 4), "Fraction(1, 2) * Fraction(1, 2)");
		jelAssert.equal(1, "Fraction(1, 2) / Fraction(1, 2)");
		jelAssert.equal(new Fraction(5, 2), "Fraction(15, 3) / Fraction(4, 2)");
		jelAssert.equal(5, "Fraction(5, 5) + 16/4");
		jelAssert.equal(new Fraction(1, 4), "Fraction(1, 2) ^ Fraction(4, 2)");
		jelAssert.equal(Math.round(10000/Math.sqrt(2)), "Math.round(10000 * (Fraction(1, 2) ^ Fraction(1, 2)))");

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
		jelAssert.equal(FuzzyBoolean.TRUE,  "Fraction(6, 3) <= Fraction(50, 5)");
		jelAssert.equal(FuzzyBoolean.FALSE, "Fraction(2, 1) <= Fraction(5, 5)");
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
		jelAssert.equal(2, "Fraction(1, 2) ^ -1");
		jelAssert.equal(1, "Fraction(1, 2) ^ 0");
		jelAssert.equal(new Fraction(1, 8), "Fraction(1, 2) ^ 3");
		jelAssert.equal(new Fraction(9, 4), "Fraction(3, 2) ^ 2");

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
		jelAssert.equal(10, "5 / Fraction(1, 2)");
		jelAssert.equal(new Fraction(14, 3), "7 / Fraction(3, 2)");

		jelAssert.equal(0.75, "0.5 + Fraction(1, 4)");
		jelAssert.equal(0.75, "1.5 - Fraction(3, 4)");
		jelAssert.equal(0.75, "1.5 * Fraction(1, 2)");
		jelAssert.equal(63, "35 * Fraction(9, 5)");
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
		jelAssert.equal(new Fraction(-1, 2), "- + - + -Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 2), "abs Fraction(-1, 2)");
	});
	
	it('supports simplify()', function() {
		jelAssert.equal(new Fraction(1, 2), "Fraction(1, 2).simplify()");
		jelAssert.equal(2, "Fraction(2, 1).simplify()");
		jelAssert.equal(5, "Fraction(10, 2).simplify()");
		jelAssert.equal(new Fraction(1, 2), "Fraction(10, 20).simplify()");
		jelAssert.equal(new Fraction(11, 13), "Fraction(11*7, 13*7).simplify()");
	});
});
