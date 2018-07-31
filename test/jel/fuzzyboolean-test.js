'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({FuzzyBoolean}));


	describe('FuzzyBoolean', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new FuzzyBoolean(0), "FuzzyBoolean(0)");
			jelAssert.equal(new FuzzyBoolean(1), "FuzzyBoolean(1)");
			jelAssert.equal(new FuzzyBoolean(0.34), "FuzzyBoolean(0.34)");
			jelAssert.notEqual(new FuzzyBoolean(1), "FuzzyBoolean(3)");
		});

		it('supports FuzzyBoolean<->FuzzyBoolean comparisons', function() {
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) == FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) == FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.6) == FuzzyBoolean(0.6)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.75) != FuzzyBoolean(0.25)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) != FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) != FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0) != FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.6) != FuzzyBoolean(0.6)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.75) == FuzzyBoolean(0.25)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) == FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1, 15) == FuzzyBoolean(1, 33)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0, 5) == FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.2, 10) == FuzzyBoolean(0.2, 10)");

			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) === FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) === FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.6) === FuzzyBoolean(0.6)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.75) !== FuzzyBoolean(0.25)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) !== FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) !== FuzzyBoolean(1)");
			
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) > FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.7) > FuzzyBoolean(0.3)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) > FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.5) > FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) < FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) >= FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) <= FuzzyBoolean(0.1)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) >> FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.5) >> FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) << FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) >>= FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) <<= FuzzyBoolean(0.1)");
		});

		it('supports FuzzyBoolean<->number comparisons', function() {
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) == 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "1 == FuzzyBoolean(1)");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) == 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.6) == 0.6");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) != 0.2");
			jelAssert.equal(FuzzyBoolean.FALSE, "1 == FuzzyBoolean(0)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) != 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0) != 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.6) != 0.6");

			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) === 1");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.5) === 0.5");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0.75) !== 0.25");
			
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) > 0.2");
			jelAssert.equal(FuzzyBoolean.TRUE, "0.7 > FuzzyBoolean(0.3)");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) > 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) > 5");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.5) > 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) < 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) >= 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) <= 0.1");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(1) >> 0");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(0.5) >> 1");
			jelAssert.equal(FuzzyBoolean.FALSE, "FuzzyBoolean(1) << 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) >>= 0");
			jelAssert.equal(FuzzyBoolean.TRUE, "FuzzyBoolean(0) <<= 0.1");
		});
	});

