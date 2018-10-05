'use strict';

require('source-map-support').install();
const assert = require('assert');
const JEL = require('../../build/jel/JEL.js').default;
const JelType = require('../../build/jel/JelType.js').default;
const JelMath = require('../../build/jel/types/Math.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Context = require('../../build/jel/Context.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const ctx = new Context().setAll({Math: JelMath, Fraction, ApproximateNumber, FuzzyBoolean, UnitValue, JelPromise, JelConsole});
jelAssert.setCtx(ctx);

describe('jelMath', function() {
	it('has some basic constants', function() {
		jelAssert.equal('Math.PI', Math.PI);
		jelAssert.equal('Math.E', Math.E);
		jelAssert.equal('Math.LN2', Math.LN2);
		jelAssert.equal('Math.LN10', Math.LN10);
		jelAssert.equal('Math.LOG2E', Math.LOG2E);
		jelAssert.equal('Math.LOG10E', Math.LOG10E);
		jelAssert.equal('Math.SQRT1_2', Math.SQRT1_2);
		jelAssert.equal('Math.SQRT2', Math.SQRT2);
	});
});

