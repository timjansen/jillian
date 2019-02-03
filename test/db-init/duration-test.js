'use strict';

// Note that this test is in the database dir because UnitValue requires DB objects
//

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const Loader = require('../../build/database/Loader.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Serializer = require('../../build/jel/Serializer.js').default;
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Duration = require('../../build/jel/types/time/Duration.js').default;
const DurationRange = require('../../build/jel/types/time/DurationRange.js').default;
const Range = require('../../build/jel/types/Range.js').default;
const List = require('../../build/jel/types/List.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const Float = require('../../build/jel/types/Float.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const Util = require('../../build/util/Util.js').default;
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const path = 'build/tmp/db-init';

describe('Duration & DurationRange', function() {
  let db, session, ctx;
  before(function() {
      db = new Database(path);
      return DbSession.create(db).then(s=>{
        session = s;
        ctx = s.ctx;
        jelAssert.setCtx(ctx);
      });
  });

  describe('Duration', function() {
    it('creates and serializes', function() {
      jelAssert.equal(new Duration(2, 5, 10, 4, 2, 9), "Duration(2, 5, 10, 4, 2, 9)");
      jelAssert.equal(new Duration(2, 5, 10, 4, 2, 9), "Duration(seconds=9, minutes=2, hours=4/1, days=10, months=5, years=2)");
    });

    it('supports operations with other Durations', function() {
      jelAssert.equal(new Duration(2, 5, 10, 4, 2, 9), "Duration(1, 2, 2, 0, 1, 4)+Duration(1, 3, 8, 4, 1, 5)");
      jelAssert.equal("Duration(years=2, seconds=5)", "Duration(years=2)+Duration(seconds=5)");

      jelAssert.equal("Duration(months=-1, seconds=2)", "Duration(1, 2, 8, 0, 1, 4)-Duration(1, 3, 8, 0, 1, 2)");
      jelAssert.equal("Duration(years=2, seconds=-5)", "Duration(years=2)-Duration(seconds=5)");

      jelAssert.equal(4, "Duration(hours=2)/Duration(seconds=1800)");

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) == Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) != Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) == Duration(seconds=124)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) != Duration(seconds=124)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) === Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) === Duration(minutes=2, seconds=5)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) !== Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) !== Duration(minutes=2, seconds=5)", 0);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >= Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) >= Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) >= Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(years=4) >= Duration(years=4)", 1);
      jelAssert.fuzzy("Duration(years=4, days=1) >= Duration(years=4)", 1);
      jelAssert.fuzzy("Duration(years=4, days=1) <= Duration(years=4, days=2)", 1);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) > Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) > Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) > Duration(seconds=125)", 0);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) <= Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) <= Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) <= Duration(seconds=125)", 1);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) < Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) < Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) < Duration(seconds=125)", 1);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >> Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) >> Duration(seconds=125)", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) >> Duration(seconds=125)", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >>= Duration(seconds=125)", 1);

    });

  it('supports operations with UnitValues', function() {
      jelAssert.equal(new Duration(1, 2, 2, 0, 1, 14), "Duration(1, 2, 2, 0, 1, 4)+ 10 @Second");
      jelAssert.equal("Duration(years=2, seconds=5)", "Duration(years=2)+ 5 @Second");

      jelAssert.equal("Duration(1, 2, 8, 0, 1, 2)", "Duration(1, 2, 8, 0, 1, 4)- 2 @Second");

      jelAssert.equal(4, "Duration(hours=2)/1800 @Second");

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) == 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) != 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) == 124 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) != 124 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) === 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) !== 125 @Second", 0);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >= 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) >= 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) >= 125 @Second", 0);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) > 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) > 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) > 125 @Second", 0);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) <= 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) <= 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) <= 125 @Second", 1);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) < 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) < 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) < 125 @Second", 1);

      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >> 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=6) >> 125 @Second", 1);
      jelAssert.fuzzy("Duration(minutes=2, seconds=4) >> 125 @Second", 0);
      jelAssert.fuzzy("Duration(minutes=2, seconds=5) >>= 125 @Second", 1);

    });

    it('supports operations with numbers', function() {
      jelAssert.equal(new Duration(4, 2, 2, 0, 2, 16), "Duration(2, 1, 1, 0, 1, 8)*2");
      jelAssert.equal(new Duration(1, 4, 2, 0, 5, 3.5), "Duration(2, 8, 4, 0, 10, 7) * 1/2");

      jelAssert.equal(new Duration(1, 4, 2, 0, 5, 3.5), "Duration(2, 8, 4, 0, 10, 7) / 2");
    });

    it('supports unary ops', function() {
      jelAssert.equal(new Duration(4, 2, 2, 0, 2, 16), "-Duration(-4, -2, -2, 0, -2, -16)");
      jelAssert.fuzzy("!Duration(minutes=2, seconds=5)", 0);
      jelAssert.fuzzy("!Duration(seconds=0)", 1);
      jelAssert.fuzzy("!Duration(seconds=60, minutes=-1)", 1);
    });


    it('rounds up to full days wilth fullDays()', function() {
      jelAssert.equal(new Duration(2, 5, 10), "Duration(2, 5, 10, 1).fullDays()");
      jelAssert.equal(new Duration(2, 5, 10), "Duration(2, 5, 10, 23, 0, 0).fullDays()");
      jelAssert.equal(new Duration(2, 5, 11), "Duration(2, 5, 10, 23, 59, 60).fullDays()");
      jelAssert.equal(new Duration(2, 5, 9), "Duration(2, 5, 10, -1).fullDays()");
      jelAssert.equal(new Duration(2, 5, 9), "Duration(2, 5, 10, 0, 0, -1).fullDays()");
      jelAssert.equal(new Duration(2, 5, 9), "Duration(2, 5, 10, -24).fullDays()");
      jelAssert.equal(new Duration(2, 5, 8), "Duration(2, 5, 10, -24, 0, -1).fullDays()");
    });

    it('supports toEstimatedSeconds()', function() {
      jelAssert.equal("10 @Second", "Duration(seconds=10).toEstimatedSeconds()");
      jelAssert.equal("30 @Second", "Duration(minutes=1/2).toEstimatedSeconds()");
      jelAssert.equal("7203 @Second", "Duration(hours=2,seconds=3).toEstimatedSeconds()");
      jelAssert.equal("(25*3600 @Second) +- 3600 @Second", "Duration(hours=1,days=1).toEstimatedSeconds()");
      jelAssert.equal("(2*365*24*3600 @Second) +- 86400 @Second", "Duration(years=2).toEstimatedSeconds()");
    });

    it('simplifies with simplify()', function() {
      jelAssert.equal(new Duration(2, 5, 10, 1, 5, 2), "Duration(2, 5, 10, 1, 5, 2).simplify()");
      jelAssert.equal(new Duration(2, 5, 11, 3, 1, 3), "Duration(2, 5, 10, 25, 61, 3603).simplify()");
      jelAssert.equal(new Duration(3, 1, 10, 1, 6, 2), "Duration(3, 1, 10, 1, 5, 62).simplify()");
      jelAssert.equal(new Duration(4, 0, 10, 2, 2, 0), "Duration(3, 12, 10, 1, 62, 0).simplify()");
      jelAssert.equal(new Duration(4, 10, 10, 1, 6, 2), "Duration(3, 22, 10, 1, 5, 62).simplify()");
      jelAssert.equal(new Duration(-4, 0, -10, 0, -56, -2), "Duration(-3, -12, -10, -1, 5, -62).simplify()");
    });

    it('supports min()/max()', function() {
      jelAssert.equal("Duration(seconds=4)", "Duration.min(Duration(seconds=10), 20 @Second, 5 @Year, Duration(months=4), Duration(seconds=4))");
      jelAssert.equal("Duration(seconds=4)", "Duration.min(4 @Second, Duration(seconds=10), 20 @Second, Duration(months=4))");
      jelAssert.equal("Duration(seconds=50000000000)", "Duration.max(4 @Second, Duration(seconds=10), 20 @Second, 50000000000 @Second, Duration(months=4))");
    });
  });

  describe('DurationRange', function() {
    it('creates and serializes', function() {
      jelAssert.equal(new Range(Float.valueOf(2), Float.valueOf(3)), "Range(2, 3)"); // just to check that inheritance is working
      assert.equal(Serializer.serialize(new DurationRange(new Duration(0,0,0, 0, 2, 11), new Duration(0,0,0, 0, 5, 7))), "DurationRange(Duration(0,0,0,0,2,11),Duration(0,0,0,0,5,7))");
      assert.equal(new JEL('DurationRange(Duration(0,0,0, 0, 2, 12), Duration(0,0,0, 0, 5, 7))').executeImmediately(ctx).constructor.name, "DurationRange");
      jelAssert.equal(new DurationRange(new Duration(0,0,0, 0, 2, 3), new Duration(0,0,0, 0, 5, 7)), "DurationRange(Duration(minutes=2, seconds=3), Duration(minutes=5, seconds=7))");
    });

    it('supports contains()', function() {
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=1))", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=2))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=4))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=5))", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=4, seconds=-1))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)).contains(Duration(years=2, seconds=-1))", 0);
      jelAssert.fuzzy("DurationRange(Duration(minutes=2), Duration(minutes=4)).contains(200 @Second)", 1);
      jelAssert.fuzzy("DurationRange(Duration(minutes=2), Duration(minutes=4)).contains(400 @Second)", 0);
      jelAssert.fuzzy("DurationRange(Duration(minutes=20), Duration(minutes=40)).contains(DurationRange(Duration(minutes=23), Duration(minutes=24)))", 1);
      jelAssert.fuzzy("DurationRange(Duration(minutes=30), Duration(minutes=40)).contains(DurationRange(Duration(minutes=23), Duration(minutes=24)))", 0);
    });

    it('supports operators with Duration', function() {
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > Duration(years=1)", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) < Duration(years=1)", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) < Duration(years=3)", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) << Duration(years=3)", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) == Duration(years=3)", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) === Duration(years=3)", 0);

      jelAssert.equal("DurationRange(Duration(years=1), Duration(years=3))", "DurationRange(Duration(years=2), Duration(years=4)) - Duration(years=1)", 1);
      jelAssert.equal("DurationRange(Duration(years=3), Duration(years=5))", "DurationRange(Duration(years=2), Duration(years=4)) + Duration(years=1)", 1);
    });

    it('supports operators with numbers', function() {
      jelAssert.equal("DurationRange(Duration(years=10), Duration(years=20))", "DurationRange(Duration(years=2), Duration(years=4)) * 5", 1);
      jelAssert.equal("DurationRange(Duration(years=4), Duration(years=12))", "DurationRange(Duration(years=3), Duration(years=9)) / 3/4", 1);
    });

    it('supports operators with other DurationRanges', function() {
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) == DurationRange(Duration(years=2), Duration(years=4))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) === DurationRange(Duration(years=2), Duration(years=4))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) === DurationRange(Duration(years=3), Duration(years=3))", 0);

      jelAssert.fuzzy("DurationRange(Duration(years=8), Duration(years=9)) >= DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=8), Duration(years=9)) <= DurationRange(Duration(years=2), Duration(years=3))", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) >= DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) >= DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) <= DurationRange(Duration(years=3), Duration(years=8))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) >= DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) >= DurationRange(Duration(years=3), Duration(years=8))", 0);

      jelAssert.fuzzy("DurationRange(Duration(years=8), Duration(years=9)) > DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=8), Duration(years=9)) < DurationRange(Duration(years=2), Duration(years=3))", 0);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) < DurationRange(Duration(years=3), Duration(years=8))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=2), Duration(years=3))", 1);
      jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=3), Duration(years=8))", 0);

      jelAssert.equal("DurationRange(Duration(years=1), Duration(years=36))", "DurationRange(Duration(years=2), Duration(years=40)) - DurationRange(Duration(years=1), Duration(years=4))");
    });


  });

  
});