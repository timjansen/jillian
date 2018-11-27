'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const NativeTypeDefinition = require('../../build/jel/NativeTypeDefinition.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.plus({JelBoolean: new NativeTypeDefinition(JelBoolean)}));


	describe('JelBoolean', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new JelBoolean(0), "JelBoolean(0)");
			jelAssert.equal(new JelBoolean(1), "JelBoolean(1)");
			jelAssert.equal(new JelBoolean(0.34), "JelBoolean(0.34)");
			jelAssert.notEqual(new JelBoolean(1), "JelBoolean(3)");
		});

		it('supports JelBoolean<->JelBoolean comparisons', function() {
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) == JelBoolean(1)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) == JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.6) == JelBoolean(0.6)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.75) != JelBoolean(0.25)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) != JelBoolean(0)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) != JelBoolean(1)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(0) != JelBoolean(0)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(0.6) != JelBoolean(0.6)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(0.75) == JelBoolean(0.25)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) == JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1, 15) == JelBoolean(1, 33)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0, 5) == JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.2, 10) == JelBoolean(0.2, 10)");

			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) === JelBoolean(1)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) === JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.6) === JelBoolean(0.6)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.75) !== JelBoolean(0.25)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) !== JelBoolean(0)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) !== JelBoolean(1)");
			
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) > JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.7) > JelBoolean(0.3)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) > JelBoolean(1)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(0.5) > JelBoolean(1)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) < JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) >= JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) <= JelBoolean(0.1)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1) >> JelBoolean(0)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(0.5) >> JelBoolean(1)");
			jelAssert.equal(JelBoolean.FALSE, "JelBoolean(1) << JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) >>= JelBoolean(0)");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0) <<= JelBoolean(0.1)");
		});

		it('supports state property', function() {
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(1).state == 1");
			jelAssert.equal(JelBoolean.TRUE, "1 == JelBoolean(1).state");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0).state == 0");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0.6).state == 0.6");
			jelAssert.equal(JelBoolean.TRUE, "JelBoolean(0).state != 0.2");
			jelAssert.equal(JelBoolean.FALSE, "1 == JelBoolean(0).state");
		});
		
		it('supports and and or', function() {
			jelAssert.equal("JelBoolean.and(true, true, true, true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.and(true, true, false, true)", JelBoolean.FALSE);
			jelAssert.equal("JelBoolean.and(false, false, false, true)", JelBoolean.FALSE);
			jelAssert.equal("JelBoolean.and(false, false, false, false)", JelBoolean.FALSE);

			jelAssert.equal("JelBoolean.or(true, true, true, true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.or(true, true, false, true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.or(false, false, false, true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.or(false, false, false, false)", JelBoolean.FALSE);

			jelAssert.equal("JelBoolean.TRUE.and(true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.TRUE.and(false)", JelBoolean.FALSE);
			jelAssert.equal("JelBoolean.FALSE.and(true)", JelBoolean.FALSE);
			jelAssert.equal("JelBoolean.FALSE.and(false)", JelBoolean.FALSE);

			jelAssert.equal("JelBoolean.TRUE.or(true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.TRUE.or(false)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.FALSE.or(true)", JelBoolean.TRUE);
			jelAssert.equal("JelBoolean.FALSE.or(false)", JelBoolean.FALSE);

		});
	});

