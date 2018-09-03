'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const Range = require('../../build/jel/types/Range.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({Fraction, FuzzyBoolean, Range}));

describe('Range', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new Range(1, 2), "Range(1, 2)");
			jelAssert.equal(new Range(new Fraction(1, 2), 2), "Range(Fraction(1, 2), 2)");
			jelAssert.equal(new Range(undefined, 5), "Range(null, 5)");
			jelAssert.equal(new Range(-1, undefined), "Range(-1, null)");
			jelAssert.notEqual(new Range(1, 2), "Range(1, 3)");
		});

		it('supports Range<->Range comparisons', function() {
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) == Range(1, 4)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) === Range(1, 4)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, null) == Range(1, null)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, null) == Range(null, null)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(Fraction(2, 3), Fraction(8, 10)) == Range(Fraction(2, 3), Fraction(4, 5))");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(5, 8) == Range(5, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 10) === Range(2, 10)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(5, null) == Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(6, null) === Range(5, null)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 6) == Range(2, 3)");

			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) != Range(1, 4)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) !== Range(1, 4)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, null) != Range(1, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, null) != Range(null, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(5, null) != Range(6, null)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(6, null) !== Range(5, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 6) != Range(2, 3)");
			
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) << Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 34) >> Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) << Range(1, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(6, 9) >> Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 5) << Range(4, 6)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(20, 30) >> Range(10, 25)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) << Range(4, 5)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(20, 30) >> Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) << Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, null) >> Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, null) << Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 34) >> Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) << Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(19, 20) >> Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) << Range(null, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 20) >> Range(null, 9)");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 34) >>= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) <<= Range(1, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(6, 9) >>= Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 5) <<= Range(4, 6)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(20, 30) >>= Range(10, 25)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) <<= Range(4, 5)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(20, 30) >>= Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) <<= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, null) >>= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, null) <<= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 34) >>= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) <<= Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(19, 20) >>= Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) <<= Range(null, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 20) >>= Range(null, 9)");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) < Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 34) > Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) < Range(1, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(6, 9) > Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 5) < Range(4, 6)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(20, 30) > Range(10, 25)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) < Range(4, 5)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(20, 30) > Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) < Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, null) > Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, null) < Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 34) > Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) < Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(19, 20) > Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) < Range(null, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 20) > Range(null, 9)");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 34) >= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) <= Range(1, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(6, 9) >= Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 5) <= Range(4, 6)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(20, 30) >= Range(10, 25)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) <= Range(4, 5)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(20, 30) >= Range(10, 20)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) <= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, null) >= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, null) <= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 34) >= Range(6, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(3, 4) <= Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(19, 20) >= Range(6, null)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(3, 4) <= Range(null, 9)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(19, 20) >= Range(null, 9)");
		});
	
		it('supports Range<->number comparisons', function() {
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) == 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) == 2");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) == 4");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) == 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) == 5");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) == 2");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, null) == 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 4) == 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, null) == 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(2, null) == 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 2) == Fraction(3, 2)");

			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) != 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) != 2");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) != 4");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) != 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 4) != 2");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, null) != 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 2) != Fraction(3, 2)");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >> 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >> 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >> 3");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >> 4");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >> 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) << 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) << 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) << 3");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) << 4");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) << 5");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) << 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 4) << 4");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(null, 4) << 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(9, null) >> 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(9, null) >> 9");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(9, null) >> 10");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >> Fraction(1, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >> Fraction(3, 2)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) << Fraction(20, 3)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) << Fraction(5, 3)");

			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= 3");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= 4");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >>= 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) <<= 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= 3");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= 4");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= 5");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) <<= 5");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) <<= 4");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(null, 4) <<= 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(9, null) >>= 5");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(9, null) >>= 9");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(9, null) >>= 10");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= Fraction(1, 2)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) >>= Fraction(3, 2)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) >>= Fraction(11, 2)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= Fraction(20, 3)");
			jelAssert.equal(FuzzyBoolean.TRUE, "Range(1, 4) <<= Fraction(5, 3)");
			jelAssert.equal(FuzzyBoolean.FALSE, "Range(1, 4) <<= Fraction(1, 2)");

			jelAssert.equal(new Range(2, 8), "Range(1, 4) * 2");
			jelAssert.equal(new Range(1, 2), "Range(4, 8) / 4");
			jelAssert.equal(new Range(3, 5), "Range(1, 3) + 2");
			jelAssert.equal(new Range(3, 5), "Range(5, 7) - 2");
			jelAssert.equal(new Range(new Fraction(1, 2), new Fraction(5, 2)), "Range(1, 3) - Fraction(1, 2)");
			jelAssert.equal(new Range(4, 16), "2 * Range(1, 4) * 2");
			jelAssert.equal(new Range(3, 5), "2 + Range(1, 3)");
		});
	});