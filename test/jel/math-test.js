'use strict';

require('source-map-support').install();
const assert = require('assert');
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const NativeClass = require('../../build/jel/NativeClass.js').default;
const JelMath = require('../../build/jel/types/Math.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const {JelAssert, JelPromise, JelConsole, MockSession} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('Math', function() {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      ctx = defaultContext.plus({JelPromise: new NativeClass(JelPromise), JelConsole: new NativeClass(JelConsole)}).plus(new MockSession());
      jelAssert.setCtx(ctx);
    });
  });
  
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

	it('has trigonometric functions', function() {
		jelAssert.equal('Math.sin(0)', 0);
		jelAssert.equal('Math.sin(1)', Math.sin(1));
		jelAssert.equal('Math.cos(Math.PI)', -1);
		jelAssert.equal('Math.cos(2)', Math.cos(2));
		jelAssert.equal('Math.tan(3)', Math.tan(3));
		
		jelAssert.equal('Math.asin(0.5)', Math.asin(0.5));
		jelAssert.equal('Math.acos(1)', Math.acos(1));
		jelAssert.equal('Math.acos(0.44)', Math.acos(0.44));
		jelAssert.equal('Math.atan(0.2)', Math.atan(0.2));
	});
	
	it('has misc functions', function() {
		jelAssert.equal('Math.cbrt(64)', 4);
		jelAssert.equal('Math.cbrt(128/2)', 4);
		jelAssert.equal('Math.ceil(5.2)', 6);
		jelAssert.equal('Math.ceil(52/10)', 6);
		jelAssert.equal('Math.ceil(52/10 @Meter)', '6 @Meter');
		jelAssert.equal('Math.exp(1)', Math.E);
		jelAssert.equal('Math.expm1(1)', Math.E-1);
		jelAssert.equal('Math.floor(7.7)', 7);
		jelAssert.equal('Math.floor(7.7 @Second)', '7 @Second');
		jelAssert.equal('Math.floor(77/10)', 7);
//		jelAssert.equal('Math.hypot(5, 12)', 13);
//		jelAssert.equal('Math.hypot(5/1, 12)', 13);
		jelAssert.equal('Math.log(5)', Math.log(5));
		jelAssert.equal('Math.log1p(5)', Math.log1p(5));
		jelAssert.equal('Math.log10(5)', Math.log10(5));
		jelAssert.equal('Math.log2(5)', Math.log2(5));
		jelAssert.equal('Math.pow(3, 2)', 9);
		jelAssert.equal('Math.ceil(Math.random())', 1);
		jelAssert.equal('Math.ceil(Math.random(4, 5))', 5);
		jelAssert.equal('Math.round(7.1)', 7);
		jelAssert.equal('Math.sign(7.5)', 1);
		jelAssert.equal('Math.sign(-7.5)', -1);
		jelAssert.equal('Math.sign(0)', 0);
		jelAssert.equal('Math.sqrt(144)', 12);
		jelAssert.equal('Math.trunc(1.44)', 1);
		jelAssert.equal('Math.trunc(2.77 @KilometerPerHour)', '2 @KilometerPerHour');
		jelAssert.equal('Math.trunc(-1.44)', -1);
		jelAssert.equal('Math.trunc(-10.77)', -10);
	});
/** TODO" with varargs
	it('has min/max functions', function() {
		jelAssert.equal('Math.min()', 0);
		jelAssert.equal('Math.min(2)', 2);
		jelAssert.equal('Math.min(1, 2)', 1);
		jelAssert.equal('Math.min(2, 1)', 1);
		jelAssert.equal('Math.min(2, -5, 4)', -5);
		jelAssert.equal('Math.min(-5, 2, 2, -5, 4, 4, -5)', -5);
		jelAssert.equal('Math.min(2, -5, -17, 4)', -17);
		jelAssert.equal('Math.max(2, -5, -17, 4)', 4);
		jelAssert.equal('Math.max(66, 55, -17, 4)', 66);
	});
*/
});

