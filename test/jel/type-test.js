'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const Range = require('../../build/jel/types/Range.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({Fraction, FuzzyBoolean, Range}));

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

		jelAssert.equal(true, "Fraction(2, 4) == Fraction(1, 2)");
		jelAssert.equal(true, "Fraction(2, 4) === Fraction(1, 2)");
		jelAssert.equal(true, "Fraction(2, 4) != Fraction(1, 3)");
		jelAssert.equal(true, "Fraction(2, 4) !== Fraction(1, 3)");

		jelAssert.equal(true,  "Fraction(1, 2) > Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 3) > Fraction(1, 2)");
		jelAssert.equal(false, "Fraction(1, 3) < Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 2) < Fraction(1, 3)");
		jelAssert.equal(true,  "Fraction(1, 2) >= Fraction(1, 3)");
		jelAssert.equal(true,  "Fraction(1, 2) >= Fraction(1, 2)");
		jelAssert.equal(false, "Fraction(1, 3) >= Fraction(1, 2)");
		jelAssert.equal(true,  "Fraction(1, 3) <= Fraction(1, 2)");
		jelAssert.equal(true,  "Fraction(1, 3) <= Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 2) <= Fraction(1, 3)");

		jelAssert.equal(true,  "Fraction(1, 2) >> Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 3) >> Fraction(1, 2)");
		jelAssert.equal(false, "Fraction(1, 3) << Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 2) << Fraction(1, 3)");
		jelAssert.equal(true,  "Fraction(1, 2) >>= Fraction(1, 3)");
		jelAssert.equal(true,  "Fraction(1, 2) >>= Fraction(1, 2)");
		jelAssert.equal(false, "Fraction(1, 3) >>= Fraction(1, 2)");
		jelAssert.equal(true,  "Fraction(1, 3) <<= Fraction(1, 2)");
		jelAssert.equal(true,  "Fraction(1, 3) <<= Fraction(1, 3)");
		jelAssert.equal(false, "Fraction(1, 2) <<= Fraction(1, 3)");
	});

	it('supports fraction<->number arithmetic', function() {
		jelAssert.equal(new Fraction(9, 4), "Fraction(1, 4) + 2");
		jelAssert.equal(new Fraction(-1, 2), "Fraction(4, 8) - 1");
		jelAssert.equal(new Fraction(3, 2), "Fraction(1, 2) * 3");
		jelAssert.equal(new Fraction(1, 4), "Fraction(1, 2) / 2");

		jelAssert.equal(true, "Fraction(4, 4) == 1");
		jelAssert.equal(true, "Fraction(4, 4) === 1");
		jelAssert.equal(true, "Fraction(3, 4) != 1");
		jelAssert.equal(true, "Fraction(3, 4) !== 1");
		jelAssert.equal(true, "Fraction(3, 4) == 0.75");
		jelAssert.equal(true, "Fraction(3, 4) === 0.75");
		jelAssert.equal(true, "Fraction(3, 4) != 0.8");
		jelAssert.equal(true, "Fraction(3, 4) !== 0.8");

		jelAssert.equal(true,  "Fraction(1, 2) > 0");
		jelAssert.equal(false, "Fraction(1, 3) > 1");
		jelAssert.equal(true,  "Fraction(5, 3) < 2");
		jelAssert.equal(false, "Fraction(3, 3) < 1");
		jelAssert.equal(false, "Fraction(1, 2) < 0");
		jelAssert.equal(true,  "Fraction(1, 2) >= 0");
		jelAssert.equal(true,  "Fraction(2, 1) >= 2");
		jelAssert.equal(false, "Fraction(1, 3) >= 1");
		jelAssert.equal(true,  "Fraction(1, 3) <= 1");
		jelAssert.equal(true,  "Fraction(3, 3) <= 1");
		jelAssert.equal(false, "Fraction(1, 2) <= 0");

		jelAssert.equal(true,  "Fraction(1, 2) >> 0");
		jelAssert.equal(false, "Fraction(1, 3) >> 1");
		jelAssert.equal(true,  "Fraction(-5, 3) << 0");
		jelAssert.equal(false, "Fraction(3, 3) << 1");
		jelAssert.equal(false, "Fraction(1, 2) << 0");
		jelAssert.equal(true,  "Fraction(1, 2) >>= 0");
		jelAssert.equal(true,  "Fraction(2, 1) >>= 2");
		jelAssert.equal(false, "Fraction(1, 3) >>= 1");
		jelAssert.equal(true,  "Fraction(1, 3) <<= 1");
		jelAssert.equal(true,  "Fraction(3, 3) <<= 1");
		jelAssert.equal(false, "Fraction(1, 2) <<= 0");
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

		jelAssert.equal(true, "1 == Fraction(4, 4)");
		jelAssert.equal(true, "1 === Fraction(4, 4)");
		jelAssert.equal(true, "1 != Fraction(3, 4)");
		jelAssert.equal(true, "1 !== Fraction(3, 4)");
		jelAssert.equal(true, "0.75 == Fraction(3, 4)");
		jelAssert.equal(true, "0.75 === Fraction(3, 4)");
		jelAssert.equal(true, "0.8 != Fraction(3, 4)");
		jelAssert.equal(true, "0.8 !== Fraction(3, 4)");

		jelAssert.equal(true, "1 == Fraction(4, 4)");
		jelAssert.equal(true, "1 === Fraction(4, 4)");
		jelAssert.equal(true, "1 != Fraction(3, 4)");
		jelAssert.equal(true, "1 !== Fraction(3, 4)");

		jelAssert.equal(true,  "0 < Fraction(1, 2)");
		jelAssert.equal(false, "1 < Fraction(1, 3)");
		jelAssert.equal(true,  "2 > Fraction(5, 3)");
		jelAssert.equal(false, "1 > Fraction(3, 3)");
		jelAssert.equal(false, "0 > Fraction(1, 2)");
		jelAssert.equal(true,  "0 <= Fraction(1, 2)");
		jelAssert.equal(true,  "2 <= Fraction(2, 1)");
		jelAssert.equal(false, "1 <= Fraction(1, 3)");
		jelAssert.equal(true,  "1 >= Fraction(1, 3)");
		jelAssert.equal(true,  "1 >= Fraction(3, 3)");
		jelAssert.equal(false, "0 >= Fraction(1, 2)");

		jelAssert.equal(true,  "0 << Fraction(1, 2)");
		jelAssert.equal(false, "1 << Fraction(1, 3)");
		jelAssert.equal(true,  "2 >> Fraction(5, 3)");
		jelAssert.equal(false, "1 >> Fraction(3, 3)");
		jelAssert.equal(false, "0 >> Fraction(1, 2)");
		jelAssert.equal(true,  "0 <<= Fraction(1, 2)");
		jelAssert.equal(true,  "2 <<= Fraction(2, 1)");
		jelAssert.equal(false, "1 <<= Fraction(1, 3)");
		jelAssert.equal(true,  "1 >>= Fraction(1, 3)");
		jelAssert.equal(true,  "1 >>= Fraction(3, 3)");
		jelAssert.equal(false, "0 >>= Fraction(1, 2)");
	});
	
	it('supports single-ops', function() {
		jelAssert.equal(false, "!Fraction(1, 2)");
		jelAssert.equal(true, "!Fraction(0, 2)");
		jelAssert.equal(new Fraction(-1, 2), "-Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 2), "+Fraction(1, 2)");
		jelAssert.equal(new Fraction(-1, 2), "-+-+-Fraction(1, 2)");
		jelAssert.equal(new Fraction(1, 2), "abs Fraction(-1, 2)");
	});
});

describe('Range', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new Range(1, 2), "Range(1, 2)");
			jelAssert.equal(new Range(1, 2), "Range(2, 1)");
			jelAssert.equal(new Range(new Fraction(1, 2), 2), "Range(Fraction(1, 2), 2)");
			jelAssert.equal(new Range(2, new Fraction(1, 2)), "Range(Fraction(1, 2), 2)");
			jelAssert.equal(new Range(undefined, 5), "Range(null, 5)");
			jelAssert.equal(new Range(-1, undefined), "Range(-1, null)");
			jelAssert.notEqual(new Range(1, 2), "Range(1, 3)");
		});

		it('supports Range<->Range comparisons', function() {
			jelAssert.equal(true, "Range(1, 4) == Range(1, 4)");
			jelAssert.equal(true, "Range(1, 4) === Range(1, 4)");
			jelAssert.equal(true, "Range(1, null) == Range(1, null)");
			jelAssert.equal(true, "Range(null, null) == Range(null, null)");
			jelAssert.equal(true, "Range(Fraction(2, 3), Fraction(8, 10)) == Range(Fraction(2, 3), Fraction(4, 5))");

			jelAssert.equal(false, "Range(5, 8) == Range(5, 9)");
			jelAssert.equal(false, "Range(3, 10) === Range(2, 10)");
			jelAssert.equal(false, "Range(5, null) == Range(6, null)");
			jelAssert.equal(false, "Range(6, null) === Range(5, null)");
			jelAssert.equal(false, "Range(1, 6) == Range(2, 3)");

			jelAssert.equal(false, "Range(1, 4) != Range(1, 4)");
			jelAssert.equal(false, "Range(1, 4) !== Range(1, 4)");
			jelAssert.equal(false, "Range(1, null) != Range(1, null)");
			jelAssert.equal(false, "Range(null, null) != Range(null, null)");
			jelAssert.equal(true, "Range(5, null) != Range(6, null)");
			jelAssert.equal(true, "Range(6, null) !== Range(5, null)");
			jelAssert.equal(true, "Range(1, 6) != Range(2, 3)");
			
			jelAssert.equal(true, "Range(1, 4) << Range(6, 9)");
			jelAssert.equal(true, "Range(19, 34) >> Range(6, 9)");
			jelAssert.equal(false, "Range(3, 4) << Range(1, 2)");
			jelAssert.equal(false, "Range(6, 9) >> Range(10, 20)");
			jelAssert.equal(false, "Range(3, 5) << Range(4, 6)");
			jelAssert.equal(false, "Range(20, 30) >> Range(10, 25)");
			jelAssert.equal(false, "Range(3, 4) << Range(4, 5)");
			jelAssert.equal(false, "Range(20, 30) >> Range(10, 20)");
			jelAssert.equal(true, "Range(null, 4) << Range(6, 9)");
			jelAssert.equal(true, "Range(19, null) >> Range(6, 9)");
			jelAssert.equal(false, "Range(1, null) << Range(6, 9)");
			jelAssert.equal(false, "Range(null, 34) >> Range(6, 9)");
			jelAssert.equal(true, "Range(3, 4) << Range(6, null)");
			jelAssert.equal(false, "Range(19, 20) >> Range(6, null)");
			jelAssert.equal(false, "Range(3, 4) << Range(null, 9)");
			jelAssert.equal(true, "Range(19, 20) >> Range(null, 9)");

			jelAssert.equal(true, "Range(1, 4) <<= Range(6, 9)");
			jelAssert.equal(true, "Range(19, 34) >>= Range(6, 9)");
			jelAssert.equal(false, "Range(3, 4) <<= Range(1, 2)");
			jelAssert.equal(false, "Range(6, 9) >>= Range(10, 20)");
			jelAssert.equal(false, "Range(3, 5) <<= Range(4, 6)");
			jelAssert.equal(false, "Range(20, 30) >>= Range(10, 25)");
			jelAssert.equal(true, "Range(3, 4) <<= Range(4, 5)");
			jelAssert.equal(true, "Range(20, 30) >>= Range(10, 20)");
			jelAssert.equal(true, "Range(null, 4) <<= Range(6, 9)");
			jelAssert.equal(true, "Range(19, null) >>= Range(6, 9)");
			jelAssert.equal(false, "Range(1, null) <<= Range(6, 9)");
			jelAssert.equal(false, "Range(null, 34) >>= Range(6, 9)");
			jelAssert.equal(true, "Range(3, 4) <<= Range(6, null)");
			jelAssert.equal(false, "Range(19, 20) >>= Range(6, null)");
			jelAssert.equal(false, "Range(3, 4) <<= Range(null, 9)");
			jelAssert.equal(true, "Range(19, 20) >>= Range(null, 9)");

			jelAssert.equal(true, "Range(1, 4) < Range(6, 9)");
			jelAssert.equal(true, "Range(19, 34) > Range(6, 9)");
			jelAssert.equal(false, "Range(3, 4) < Range(1, 2)");
			jelAssert.equal(false, "Range(6, 9) > Range(10, 20)");
			jelAssert.equal(true, "Range(3, 5) < Range(4, 6)");
			jelAssert.equal(true, "Range(20, 30) > Range(10, 25)");
			jelAssert.equal(true, "Range(3, 4) < Range(4, 5)");
			jelAssert.equal(true, "Range(20, 30) > Range(10, 20)");
			jelAssert.equal(true, "Range(null, 4) < Range(6, 9)");
			jelAssert.equal(true, "Range(19, null) > Range(6, 9)");
			jelAssert.equal(true, "Range(1, null) < Range(6, 9)");
			jelAssert.equal(true, "Range(null, 34) > Range(6, 9)");
			jelAssert.equal(true, "Range(3, 4) < Range(6, null)");
			jelAssert.equal(false, "Range(19, 20) > Range(6, null)");
			jelAssert.equal(false, "Range(3, 4) < Range(null, 9)");
			jelAssert.equal(true, "Range(19, 20) > Range(null, 9)");

			jelAssert.equal(true, "Range(1, 4) <= Range(6, 9)");
			jelAssert.equal(true, "Range(19, 34) >= Range(6, 9)");
			jelAssert.equal(false, "Range(3, 4) <= Range(1, 2)");
			jelAssert.equal(false, "Range(6, 9) >= Range(10, 20)");
			jelAssert.equal(true, "Range(3, 5) <= Range(4, 6)");
			jelAssert.equal(true, "Range(20, 30) >= Range(10, 25)");
			jelAssert.equal(true, "Range(3, 4) <= Range(4, 5)");
			jelAssert.equal(true, "Range(20, 30) >= Range(10, 20)");
			jelAssert.equal(true, "Range(null, 4) <= Range(6, 9)");
			jelAssert.equal(true, "Range(19, null) >= Range(6, 9)");
			jelAssert.equal(true, "Range(1, null) <= Range(6, 9)");
			jelAssert.equal(true, "Range(null, 34) >= Range(6, 9)");
			jelAssert.equal(true, "Range(3, 4) <= Range(6, null)");
			jelAssert.equal(false, "Range(19, 20) >= Range(6, null)");
			jelAssert.equal(false, "Range(3, 4) <= Range(null, 9)");
			jelAssert.equal(true, "Range(19, 20) >= Range(null, 9)");
		});
	
		it('supports Range<->number comparisons', function() {
			jelAssert.equal(true, "Range(1, 4) == 1");
			jelAssert.equal(true, "Range(1, 4) == 2");
			jelAssert.equal(true, "Range(1, 4) == 4");
			jelAssert.equal(false, "Range(1, 4) == 0");
			jelAssert.equal(false, "Range(1, 4) == 5");
			jelAssert.equal(true, "Range(null, 4) == 2");
			jelAssert.equal(true, "Range(1, null) == 5");
			jelAssert.equal(true, "Range(1, 2) == Fraction(3, 2)");

			jelAssert.equal(false, "Range(1, 4) != 1");
			jelAssert.equal(false, "Range(1, 4) != 2");
			jelAssert.equal(false, "Range(1, 4) != 4");
			jelAssert.equal(true, "Range(1, 4) != 5");
			jelAssert.equal(false, "Range(null, 4) != 2");
			jelAssert.equal(false, "Range(1, null) != 5");
			jelAssert.equal(false, "Range(1, 2) != Fraction(3, 2)");

			jelAssert.equal(true, "Range(1, 4) >> 0");
			jelAssert.equal(false, "Range(1, 4) >> 1");
			jelAssert.equal(false, "Range(1, 4) >> 3");
			jelAssert.equal(false, "Range(1, 4) >> 4");
			jelAssert.equal(false, "Range(1, 4) >> 5");
			jelAssert.equal(false, "Range(1, 4) << 0");
			jelAssert.equal(false, "Range(1, 4) << 1");
			jelAssert.equal(false, "Range(1, 4) << 3");
			jelAssert.equal(false, "Range(1, 4) << 4");
			jelAssert.equal(true, "Range(1, 4) << 5");
			jelAssert.equal(true, "Range(null, 4) << 5");
			jelAssert.equal(false, "Range(null, 4) << 4");
			jelAssert.equal(false, "Range(null, 4) << 1");
			jelAssert.equal(true, "Range(9, null) >> 5");
			jelAssert.equal(false, "Range(9, null) >> 9");
			jelAssert.equal(false, "Range(9, null) >> 10");
			jelAssert.equal(true, "Range(1, 4) >> Fraction(1, 2)");
			jelAssert.equal(false, "Range(1, 4) >> Fraction(3, 2)");
			jelAssert.equal(true, "Range(1, 4) << Fraction(20, 3)");
			jelAssert.equal(false, "Range(1, 4) << Fraction(5, 3)");

			jelAssert.equal(true, "Range(1, 4) >>= 0");
			jelAssert.equal(true, "Range(1, 4) >>= 1");
			jelAssert.equal(true, "Range(1, 4) >>= 3");
			jelAssert.equal(true, "Range(1, 4) >>= 4");
			jelAssert.equal(false, "Range(1, 4) >>= 5");
			jelAssert.equal(false, "Range(1, 4) <<= 0");
			jelAssert.equal(true, "Range(1, 4) <<= 1");
			jelAssert.equal(true, "Range(1, 4) <<= 3");
			jelAssert.equal(true, "Range(1, 4) <<= 4");
			jelAssert.equal(true, "Range(1, 4) <<= 5");
			jelAssert.equal(true, "Range(null, 4) <<= 5");
			jelAssert.equal(true, "Range(null, 4) <<= 4");
			jelAssert.equal(true, "Range(null, 4) <<= 1");
			jelAssert.equal(true, "Range(9, null) >>= 5");
			jelAssert.equal(true, "Range(9, null) >>= 9");
			jelAssert.equal(true, "Range(9, null) >>= 10");
			jelAssert.equal(true, "Range(1, 4) >>= Fraction(1, 2)");
			jelAssert.equal(true, "Range(1, 4) >>= Fraction(3, 2)");
			jelAssert.equal(false, "Range(1, 4) >>= Fraction(11, 2)");
			jelAssert.equal(true, "Range(1, 4) <<= Fraction(20, 3)");
			jelAssert.equal(true, "Range(1, 4) <<= Fraction(5, 3)");
			jelAssert.equal(false, "Range(1, 4) <<= Fraction(1, 2)");

			jelAssert.equal(new Range(2, 8), "Range(1, 4) * 2");
			jelAssert.equal(new Range(1, 2), "Range(4, 8) / 4");
			jelAssert.equal(new Range(3, 5), "Range(1, 3) + 2");
			jelAssert.equal(new Range(3, 5), "Range(5, 7) - 2");
			jelAssert.equal(new Range(new Fraction(1, 2), new Fraction(5, 2)), "Range(1, 3) - Fraction(1, 2)");
			jelAssert.equal(new Range(4, 16), "2 * Range(1, 4) * 2");
			jelAssert.equal(new Range(3, 5), "2 + Range(1, 3)");
		});
	});

	describe('FuzzyBoolean', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new FuzzyBoolean(1), "FuzzyBoolean(true)");
			jelAssert.equal(new FuzzyBoolean(0), "FuzzyBoolean(false)");
			jelAssert.equal(new FuzzyBoolean(1), "FuzzyBoolean(1)");
			jelAssert.equal(new FuzzyBoolean(0.34), "FuzzyBoolean(0.34)");
			jelAssert.equal(new FuzzyBoolean(0, 500), "FuzzyBoolean(0, 500)");
			jelAssert.notEqual(new FuzzyBoolean(1, 2), "FuzzyBoolean(1, 3)");
			jelAssert.equal(new FuzzyBoolean(0.4, 2), "FuzzyBoolean(0.4, 2)");
		});

		it('supports FuzzyBoolean<->FuzzyBoolean comparisons', function() {
			jelAssert.equal(true, "FuzzyBoolean(true) == FuzzyBoolean(true)");
			jelAssert.equal(true, "FuzzyBoolean(false) == FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.6) == FuzzyBoolean(0.6)");
			jelAssert.equal(true, "FuzzyBoolean(0.75) != FuzzyBoolean(0.25)");
			jelAssert.equal(true, "FuzzyBoolean(true) != FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(true) != FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(false) != FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(0.6) != FuzzyBoolean(0.6)");
			jelAssert.equal(false, "FuzzyBoolean(0.75) == FuzzyBoolean(0.25)");
			jelAssert.equal(false, "FuzzyBoolean(true) == FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(true, 15) == FuzzyBoolean(true, 33)");
			jelAssert.equal(true, "FuzzyBoolean(false, 5) == FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.2, 10) == FuzzyBoolean(0.2, 10)");

			jelAssert.equal(true, "FuzzyBoolean(true) === FuzzyBoolean(true)");
			jelAssert.equal(true, "FuzzyBoolean(false) === FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.6) === FuzzyBoolean(0.6)");
			jelAssert.equal(true, "FuzzyBoolean(0.75) !== FuzzyBoolean(0.25)");
			jelAssert.equal(true, "FuzzyBoolean(true) !== FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(true) !== FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(true, 15) === FuzzyBoolean(true, 33)");
			jelAssert.equal(false, "FuzzyBoolean(false, 5) === FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.2, 10) === FuzzyBoolean(0.2, 10)");
			
			jelAssert.equal(true, "FuzzyBoolean(true) > FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.7) > FuzzyBoolean(0.3)");
			jelAssert.equal(false, "FuzzyBoolean(true) > FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(0.5) > FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(true) < FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0) >= FuzzyBoolean(0)");
			jelAssert.equal(true, "FuzzyBoolean(0) <= FuzzyBoolean(0.1)");
			jelAssert.equal(true, "FuzzyBoolean(true) >> FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(0.5) >> FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(true) << FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0) >>= FuzzyBoolean(0)");
			jelAssert.equal(true, "FuzzyBoolean(0) <<= FuzzyBoolean(0.1)");
		});

		it('supports FuzzyBoolean<->boolean comparisons', function() {
			jelAssert.equal(true, "FuzzyBoolean(true) == true");
			jelAssert.equal(true, "true == FuzzyBoolean(true)");
			jelAssert.equal(true, "FuzzyBoolean(false) === FuzzyBoolean(false)");
			jelAssert.equal(true, "FuzzyBoolean(0.6) == true");
			jelAssert.equal(true, "FuzzyBoolean(0.5) == true");
			jelAssert.equal(true, "FuzzyBoolean(0.4) == false");
			jelAssert.equal(false, "true == FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(true) != true");
			jelAssert.equal(false, "true != FuzzyBoolean(true)");
			jelAssert.equal(false, "FuzzyBoolean(false) !== FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(0.6) != true");
			jelAssert.equal(false, "FuzzyBoolean(0.4) != false");
		});

		it('supports FuzzyBoolean<->number comparisons', function() {
			jelAssert.equal(true, "FuzzyBoolean(true) == 1");
			jelAssert.equal(true, "1 == FuzzyBoolean(true)");
			jelAssert.equal(true, "FuzzyBoolean(false) == 0");
			jelAssert.equal(true, "FuzzyBoolean(0.6) == 0.6");
			jelAssert.equal(true, "FuzzyBoolean(false) != 0.2");
			jelAssert.equal(false, "1 == FuzzyBoolean(false)");
			jelAssert.equal(false, "FuzzyBoolean(true) != 1");
			jelAssert.equal(false, "FuzzyBoolean(false) != 0");
			jelAssert.equal(false, "FuzzyBoolean(0.6) != 0.6");

			jelAssert.equal(true, "FuzzyBoolean(true) === 1");
			jelAssert.equal(true, "FuzzyBoolean(0.5) === 0.5");
			jelAssert.equal(true, "FuzzyBoolean(0.75) !== 0.25");
			
			jelAssert.equal(true, "FuzzyBoolean(true) > 0.2");
			jelAssert.equal(true, "0.7 > FuzzyBoolean(0.3)");
			jelAssert.equal(false, "FuzzyBoolean(true) > 1");
			jelAssert.equal(false, "FuzzyBoolean(true) > 5");
			jelAssert.equal(false, "FuzzyBoolean(0.5) > 1");
			jelAssert.equal(false, "FuzzyBoolean(true) < 0");
			jelAssert.equal(true, "FuzzyBoolean(0) >= 0");
			jelAssert.equal(true, "FuzzyBoolean(0) <= 0.1");
			jelAssert.equal(true, "FuzzyBoolean(true) >> 0");
			jelAssert.equal(false, "FuzzyBoolean(0.5) >> 1");
			jelAssert.equal(false, "FuzzyBoolean(true) << 0");
			jelAssert.equal(true, "FuzzyBoolean(0) >>= 0");
			jelAssert.equal(true, "FuzzyBoolean(0) <<= 0.1");
		});
	});

