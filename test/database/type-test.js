'use strict';

const jelAssert = require('../jel-assert.js');
const Context = require('../../src/jel/context.js');
const Fraction = require('../../src/database/types/fraction.js');

jelAssert.setCtx(new Context().setAll({Fraction}));

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
	});
});


