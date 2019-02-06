'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const Range = require('../../build/jel/types/Range.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('Range', function() {
  let ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      ctx = dc;
      jelAssert.setCtx(ctx);
    });
  });

  it('creates and serializes', function() {
    jelAssert.equal(new Range(1, 2), "Range(1, 2)");
    jelAssert.equal("1...2", "Range(1, 2)");
    jelAssert.equal(new Range(new Fraction(1, 2), 2), "Range(Fraction(1, 2), 2)");
    jelAssert.equal("1/2...2", "Range(Fraction(1, 2), 2)");
    jelAssert.equal(new Range(undefined, 5), "Range(null, 5)");
    jelAssert.equal(new Range(-1, undefined), "Range(-1, null)");
    jelAssert.notEqual(new Range(1, 2), "Range(1, 3)");

    jelAssert.equal("<=2", "Range(null, 2)");
    jelAssert.equal(">=1", "Range(1, null)");
    jelAssert.equal("<2", "Range(null, 2, false, true)");
    jelAssert.equal(">1", "Range(1, null, true, false)");

    jelAssert.equal(">=2...<10", "Range(2, 10, false, true)");
    jelAssert.equal("2...<10", "Range(2, 10, false, true)");
    jelAssert.equal(">2...<10", "Range(2, 10, true, true)");
    jelAssert.equal(">2...<=10", "Range(2, 10, true, false)");
    jelAssert.equal(">=2...<=10", "2...10");
    jelAssert.equal(">2...10", "Range(2, 10, true, false)");
    
    jelAssert.equal("Range(0, 2)", "Range(Range(0, 4), 2)");
    jelAssert.equal("Range(3, 4)", "Range(3, Range(0, 4))");
    jelAssert.equal("Range(3, 4, true, false)", "Range(3, Range(0, 4), true, false)");
    jelAssert.equal("Range(3, 4, true, true)", "Range(3, Range(0, 4, false, true), true, false)");
    jelAssert.equal("Range(0, 7, true, false)", "Range(Range(0, 4, true, true), 7, false, false)");
    jelAssert.equal("Range(0, 9, true, true)", "Range(Range(0, 4, true, true), Range(1, 9, true, true))");
  });

  it('supports Range<->Range comparisons (inclusive)', function() {
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) == Range(1, 4)");
    jelAssert.equal(JelBoolean.TRUE, "1...4 == Range(1, 4)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) === Range(1, 4)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, null) == Range(1, null)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, null) == Range(null, null)");
    jelAssert.equal(JelBoolean.TRUE, "Range(Fraction(2, 3), Fraction(8, 10)) == Range(Fraction(2, 3), Fraction(4, 5))");

    jelAssert.equal(JelBoolean.TRUE, "Range(5, 8) == Range(5, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 10) === Range(2, 10)");
    jelAssert.equal(JelBoolean.TRUE, "Range(5, null) == Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(6, null) === Range(5, null)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 6) == Range(2, 3)");

    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) != Range(1, 4)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) !== Range(1, 4)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, null) != Range(1, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, null) != Range(null, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(5, null) != Range(6, null)");
    jelAssert.equal(JelBoolean.TRUE, "Range(6, null) !== Range(5, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 6) != Range(2, 3)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) << Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 34) >> Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) << Range(1, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(6, 9) >> Range(10, 20)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 5) << Range(4, 6)");
    jelAssert.equal(JelBoolean.FALSE, "Range(20, 30) >> Range(10, 25)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) << Range(4, 5)");
    jelAssert.equal(JelBoolean.FALSE, "Range(20, 30) >> Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) << Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, null) >> Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, null) << Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 34) >> Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) << Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(19, 20) >> Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) << Range(null, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 20) >> Range(null, 9)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 34) >>= Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) <<= Range(1, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(6, 9) >>= Range(10, 20)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 5) <<= Range(4, 6)");
    jelAssert.equal(JelBoolean.FALSE, "Range(20, 30) >>= Range(10, 25)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) <<= Range(4, 5)");
    jelAssert.equal(JelBoolean.TRUE, "Range(20, 30) >>= Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) <<= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, null) >>= Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, null) <<= Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 34) >>= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) <<= Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(19, 20) >>= Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) <<= Range(null, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 20) >>= Range(null, 9)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) < Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 34) > Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) < Range(1, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(6, 9) > Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 5) < Range(4, 6)");
    jelAssert.equal(JelBoolean.TRUE, "Range(20, 30) > Range(10, 25)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) < Range(4, 5)");
    jelAssert.equal(JelBoolean.TRUE, "Range(20, 30) > Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) < Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, null) > Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, null) < Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 34) > Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) < Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(19, 20) > Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) < Range(null, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 20) > Range(null, 9)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 34) >= Range(6, 9)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) <= Range(1, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(6, 9) >= Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 5) <= Range(4, 6)");
    jelAssert.equal(JelBoolean.TRUE, "Range(20, 30) >= Range(10, 25)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) <= Range(4, 5)");
    jelAssert.equal(JelBoolean.TRUE, "Range(20, 30) >= Range(10, 20)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) <= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, null) >= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, null) <= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 34) >= Range(6, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(3, 4) <= Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(19, 20) >= Range(6, null)");
    jelAssert.equal(JelBoolean.FALSE, "Range(3, 4) <= Range(null, 9)");
    jelAssert.equal(JelBoolean.TRUE, "Range(19, 20) >= Range(null, 9)");
  });

  it('supports Range<->number comparisons', function() {
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) == 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) == 2");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) == 4");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) == 0");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) == 5");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) == 2");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, null) == 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 4) == 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, null) == 0");
    jelAssert.equal(JelBoolean.FALSE, "Range(2, null) == 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 2) == Fraction(3, 2)");

    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) != 1");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) != 2");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) != 4");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) != 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 4) != 2");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, null) != 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 2) != Fraction(3, 2)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >> 0");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >> 1");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >> 3");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >> 4");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >> 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) << 0");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) << 1");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) << 3");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) << 4");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) << 5");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) << 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 4) << 4");
    jelAssert.equal(JelBoolean.FALSE, "Range(null, 4) << 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(9, null) >> 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(9, null) >> 9");
    jelAssert.equal(JelBoolean.FALSE, "Range(9, null) >> 10");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >> Fraction(1, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >> Fraction(3, 2)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) << Fraction(20, 3)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) << Fraction(5, 3)");

    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= 0");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= 3");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= 4");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >>= 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) <<= 0");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= 3");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= 4");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= 5");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) <<= 5");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) <<= 4");
    jelAssert.equal(JelBoolean.TRUE, "Range(null, 4) <<= 1");
    jelAssert.equal(JelBoolean.TRUE, "Range(9, null) >>= 5");
    jelAssert.equal(JelBoolean.TRUE, "Range(9, null) >>= 9");
    jelAssert.equal(JelBoolean.TRUE, "Range(9, null) >>= 10");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= Fraction(1, 2)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) >>= Fraction(3, 2)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) >>= Fraction(11, 2)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= Fraction(20, 3)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4) <<= Fraction(5, 3)");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4) <<= Fraction(1, 2)");

    jelAssert.equal(new Range(2, 8), "1...4 * 2");
    jelAssert.equal(new Range(1, 2), "(4...8) / 4");
    jelAssert.equal(new Range(3, 5), "1...3 + 2");
    jelAssert.equal(new Range(3, 5), "5...7 - 2");
    jelAssert.equal(new Range(new Fraction(1, 2), new Fraction(5, 2)), "Range(1, 3) - Fraction(1, 2)");
    jelAssert.equal(new Range(4, 16), "2 * Range(1, 4) * 2");
    jelAssert.equal(new Range(3, 5), "2 + Range(1, 3)");
  });
  
  it('supports Range<->Range comparisons (exclusive)', function() {
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 4, true, true) == Range(1, 4, true, true)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 4, true, true) === Range(1, 4, true, true)");
    jelAssert.equal(JelBoolean.TRUE, "Range(1, 6, true, true) == 5");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 6, true, true) == 1");
    jelAssert.equal(JelBoolean.FALSE, "Range(1, 6, true, true) == 6");
  });

  it('supports maxInt/minInt', function() {
    jelAssert.equal("Range(1, 6).minInt", '1');
    jelAssert.equal("Range(1, 6).maxInt", '6');
    jelAssert.equal("Range(1.1, 6.1).minInt", '2');
    jelAssert.equal("Range(1.1, 6.1).maxInt", '6');
    jelAssert.equal("Range(-6.5, -2.5).minInt", '-6');
    jelAssert.equal("Range(-6.5, -2.5).maxInt", '-3');
    jelAssert.equal("Range(1.1, 1.9).minInt", 'null');
    jelAssert.equal("Range(-1.8, -1.1).maxInt", 'null');
    jelAssert.equal("Range(-1.8, -1).maxInt", '-1');

    jelAssert.equal("Range(1, 6, true, true).minInt", '2');
    jelAssert.equal("Range(1, 6, true, true).maxInt", '5');
    jelAssert.equal("Range(1.1, 6.1, true, true).minInt", '2');
    jelAssert.equal("Range(1.1, 6.1, true, true).maxInt", '6');
    jelAssert.equal("Range(-6.5, -2.5, true, true).minInt", '-6');
    jelAssert.equal("Range(-6.5, -2.5, true, true).maxInt", '-3');
    jelAssert.equal("Range(1.1, 1.9, true, true).minInt", 'null');
    jelAssert.equal("Range(-1.8, -1.1, true, true).maxInt", 'null');
    jelAssert.equal("Range(-1.8, -1, true, true).maxInt", 'null');

    jelAssert.equal("Range(1, 6, true, false).minInt", '2');
    jelAssert.equal("Range(1, 6, true, false).maxInt", '6');
    jelAssert.equal("Range(1, 6, false, true).minInt", '1');
    jelAssert.equal("Range(1, 6, false, true).maxInt", '5');

    jelAssert.equal("Range(1, null, true, false).minInt", '2');
    jelAssert.equal("Range(1, null).minInt", '1');
    jelAssert.equal("Range(1, null).maxInt", 'null');
    jelAssert.equal("Range(null, 8, true, true).minInt", 'null');
    jelAssert.equal("Range(null, 8).minInt", 'null');
    jelAssert.equal("Range(null, 8).maxInt", '8');
    jelAssert.equal("Range(null, 8, true, true).maxInt", '7');
  });
});
