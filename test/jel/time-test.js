'use strict';

require('source-map-support').install();
const assert = require('assert');

const Serializer = require('../../build/jel/Serializer.js').default;
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Float = require('../../build/jel/types/Float.js').default;
const Duration = require('../../build/jel/types/time/Duration.js').default;
const DurationRange = require('../../build/jel/types/time/DurationRange.js').default;
const Timestamp = require('../../build/jel/types/time/Timestamp.js').default;
const TimeZone = require('../../build/jel/types/time/TimeZone.js').default;
const LocalDate = require('../../build/jel/types/time/LocalDate.js').default;
const LocalDateTime = require('../../build/jel/types/time/LocalDateTime.js').default;
const ZonedDate = require('../../build/jel/types/time/ZonedDate.js').default;
const ZonedDateTime = require('../../build/jel/types/time/ZonedDateTime.js').default;
const TimeOfDay = require('../../build/jel/types/time/TimeOfDay.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const Range = require('../../build/jel/types/Range.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;

const {
	JelAssert,
	JelPromise,
	JelConsole,
	MockSession
} = require('../jel-assert.js');

const jelAssert = new JelAssert();

describe('Time', function() {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      ctx = defaultContext.plus(new MockSession());
      jelAssert.setCtx(ctx);
    });
  });
  

  describe('Timestamp', function() {
    it('creates and serializes', function() {
      jelAssert.equal(new Timestamp(25), "Timestamp(25)");
      jelAssert.equal(new Timestamp(25, 12), "Timestamp(25, 12)");

      jelAssert.notEqual(new Timestamp(25), "Timestamp(25, 12)");
      jelAssert.notEqual(new Timestamp(25, 4), "Timestamp(25)");
    });

    it('supports toNumber', function() {
      const d = Date.UTC(2017, 11, 2, 5, 3, 2);
      jelAssert.equal(d, `Timestamp(${d}).toNumber()`);
      jelAssert.equal(25, "Timestamp(25).toNumber()");
    });

    it('supports toLocalDate', function() {
      const d = Date.UTC(2017, 11, 2, 0, 0, 1);
      jelAssert.equal(new LocalDate(2017, 12, 2), `Timestamp(${d}).toLocalDate(TimeZone.UTC)`);
      jelAssert.equal(new LocalDate(2017, 12, 1), `Timestamp(${d}).toLocalDate(TimeZone('America/New_York'))`);
      jelAssert.equal(new LocalDate(2017, 12, 2), `Timestamp(${d}).toLocalDate(TimeZone('Europe/Amsterdam'))`);
    });

    it('supports toLocalDateTime', function() {
      const d = Date.UTC(2017, 11, 2, 0, 0, 1);
      jelAssert.equal(new LocalDateTime(new LocalDate(2017, 12, 2), new TimeOfDay(0, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone())`);
      jelAssert.equal(new LocalDateTime(new LocalDate(2017, 12, 1), new TimeOfDay(19, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone('America/New_York'))`);
      jelAssert.equal(new LocalDateTime(new LocalDate(2017, 12, 2), new TimeOfDay(1, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone('Europe/Amsterdam'))`);
    });

    it('supports toZonedDateTime', function() {
      const d = Date.UTC(2017, 11, 2, 0, 0, 1);
      jelAssert.equal(new ZonedDateTime(new TimeZone(), new LocalDate(2017, 12, 2), new TimeOfDay(0, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone())`);
      jelAssert.equal(new ZonedDateTime(new TimeZone("America/New_York"), new LocalDate(2017, 12, 1), new TimeOfDay(19, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone('America/New_York'))`);
      jelAssert.equal(new ZonedDateTime(new TimeZone("Europe/Amsterdam"), new LocalDate(2017, 12, 2), new TimeOfDay(1, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone('Europe/Amsterdam'))`);
    });

    it('supports timespec features', function() {
      const d = Date.UTC(2017, 11, 2, 0, 0, 1);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(${d}).isContinous()`);
      jelAssert.equal(d, `Timestamp(${d}).getStartTime(TimeZone.UTC).toNumber()`);
      jelAssert.equal(d, `Timestamp(${d}).getEndTime(TimeZone.UTC).toNumber()`);
    });


    it('supports operations with other timestamps', function() {
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000) === Timestamp(1000)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) === Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) === Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000) !== Timestamp(1001)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) !== Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) !== Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) << Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) << Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) <<= Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) <<= Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1001, 10) <<= Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1001, 10) >> Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1001, 10) >> Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1001, 10) >>= Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1001, 10) >>= Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) >>= Timestamp(1001, 10)`);

      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000) == Timestamp(1000)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1001) == Timestamp(1000)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000, 10) == Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1005, 10) == Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1000, 10) == Timestamp(1010, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1000, 10) == Timestamp(1015, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) == Timestamp(1021, 10)`);
      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1000) != Timestamp(1001)`);
      jelAssert.equal(JelBoolean.BARELY_FALSE, `Timestamp(1000, 10) != Timestamp(1009, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) != Timestamp(1000, 10)`);

      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1, 10) < Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1000, 10) < Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.BARELY_FALSE, `Timestamp(1000, 10) < Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.BARELY_FALSE, `Timestamp(1005, 10) < Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) < Timestamp(1, 10)`);

      jelAssert.equal(JelBoolean.TRUE, `Timestamp(1, 10) <= Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1000, 10) <= Timestamp(1001, 10)`);
      jelAssert.equal(JelBoolean.BARELY_TRUE, `Timestamp(1000, 10) <= Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.BARELY_FALSE, `Timestamp(1005, 10) <= Timestamp(1000, 10)`);
      jelAssert.equal(JelBoolean.FALSE, `Timestamp(1000, 10) <= Timestamp(10, 10)`);

      jelAssert.equal(`Timestamp(1000, 10) - Timestamp(10, 10)`, '990 @Millisecond +- 20');
      jelAssert.equal(`Timestamp(1000) - Timestamp(10, 0)`, '990 @Millisecond');
    });

    it('supports operations with UnitValue', function() {
      jelAssert.equal(`Timestamp(3, 10) + 5 @Millisecond`, 'Timestamp(8, 10)');
      jelAssert.equal(`Timestamp(8, 10) - 3 @Millisecond`, 'Timestamp(5, 10)');
      jelAssert.equal(`Timestamp(3, 10) +- 1 @Millisecond`, 'Timestamp(3, 1)');
      jelAssert.equal(`Timestamp(3, 10) +- 0 @Millisecond`, 'Timestamp(3, 0)');
    });

    it('supports operations with number', function() {
      jelAssert.equal(`Timestamp(3, 10) + 5`, 'Timestamp(8, 10)');
      jelAssert.equal(`Timestamp(8, 10) - 3`, 'Timestamp(5, 10)');
      jelAssert.equal(`Timestamp(3, 10) +- 1`, 'Timestamp(3, 1)');
      jelAssert.equal(`Timestamp(3, 10) +- 0`, 'Timestamp(3, 0)');
    });

  });


  describe('TimeZone', function() {
    it('creates and serializes', function() {
      jelAssert.equal(new TimeZone(), "TimeZone()");
      jelAssert.equal(`"UTC"`, "TimeZone().tz");
      jelAssert.equal(new TimeZone("America/New_York"), `TimeZone("America/New_York")`);
      jelAssert.notEqual(new TimeZone("America/New_York"), `TimeZone("America/Los_Angeles")`);
      jelAssert.notEqual(new TimeZone("etc/UTC"), `TimeZone("UTC")`);
    });

    it('returns offsets', function() {
      jelAssert.equal(-60, `TimeZone("Europe/Amsterdam").getOffset(Timestamp(${Date.UTC(2017, 11, 2)}))`);
      jelAssert.equal(-120, `TimeZone("Europe/Amsterdam").getOffset(Timestamp(${Date.UTC(2017, 6, 2)}))`);
      jelAssert.equal(300, `TimeZone("America/New_York").getOffset(Timestamp(${Date.UTC(2017, 11, 2)}))`);
      jelAssert.equal(240, `TimeZone("America/New_York").getOffset(Timestamp(${Date.UTC(2017, 6, 2)}))`);
      jelAssert.equal(0, `TimeZone.UTC.getOffset(Timestamp(${Date.UTC(2017, 6, 2)}))`);
    });

    it('returns DST', function() {
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam").isDST(Timestamp(${Date.UTC(2017, 11, 2)}))`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("Europe/Amsterdam").isDST(Timestamp(${Date.UTC(2017, 6, 2)}))`);
    });

    it('supports operations', function() {
      jelAssert.equal(JelBoolean.TRUE, `TimeZone.UTC == TimeZone.UTC`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("Europe/Amsterdam") == TimeZone("Europe/Amsterdam")`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") == TimeZone("Europe/Berlin")`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("etc/UTC") == TimeZone.UTC`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") == TimeZone.UTC`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") != TimeZone("Europe/Amsterdam")`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("Europe/Amsterdam") != TimeZone.UTC`);

      jelAssert.equal(JelBoolean.TRUE, `TimeZone.UTC === TimeZone.UTC`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("Europe/Amsterdam") === TimeZone("Europe/Amsterdam")`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") === TimeZone("Europe/Berlin")`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("etc/UTC") === TimeZone.UTC`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") === TimeZone.UTC`);
      jelAssert.equal(JelBoolean.FALSE, `TimeZone("Europe/Amsterdam") !== TimeZone("Europe/Amsterdam")`);
      jelAssert.equal(JelBoolean.TRUE, `TimeZone("Europe/Amsterdam") !== TimeZone.UTC`);

    });
  });

  describe('TimeOfDay', function() {
    it('creates and serializes', function() {
      jelAssert.equal('TimeOfDay(hour=13, minute=33, seconds=59)', new TimeOfDay(13, 33, 59));
      jelAssert.equal('TimeOfDay(13, 33, 59)', new TimeOfDay(13, 33, 59));
    });

    it('supports operators', function() {
      jelAssert.fuzzy('TimeOfDay(12, 33, 59) == TimeOfDay(12, 33, 59)', 1);
      jelAssert.fuzzy('TimeOfDay(12, 33, 59) == TimeOfDay(12, 33, 58)', 0);
      jelAssert.fuzzy('TimeOfDay(12, 33, 59) == TimeOfDay(15, 33, 59)', 0);
      jelAssert.fuzzy('TimeOfDay(12, 33, 59) == TimeOfDay(15, 33, null)', 0);
      jelAssert.fuzzy('TimeOfDay(15, 33, 59) == TimeOfDay(15, 33, null)', 1);
      jelAssert.fuzzy('TimeOfDay(15, 33, 59) == TimeOfDay(15, null, null)', 1);
      jelAssert.fuzzy('TimeOfDay( 9, 33, 59) == TimeOfDay(15, null, null)', 0);
      jelAssert.fuzzy('TimeOfDay( 9, 33, 59) != TimeOfDay(15, null, null)', 1);
      jelAssert.fuzzy('TimeOfDay( 9, 33, 59) != TimeOfDay( 9, null, null)', 0);

      jelAssert.fuzzy('TimeOfDay(15, 33, 59) === TimeOfDay(15, null, null)', 0);
      jelAssert.fuzzy('TimeOfDay(15, 33, 59) === TimeOfDay(15, 33, 59)', 1);
      jelAssert.fuzzy('TimeOfDay(15, 33, 59) === TimeOfDay(9, 33, 59)', 0);
      jelAssert.fuzzy('TimeOfDay(11, 33, 59) !== TimeOfDay(9, 33, null)', 1);

      jelAssert.fuzzy('TimeOfDay(13, 33, 59) > TimeOfDay(12, 33, 59)', 1);
      jelAssert.fuzzy('TimeOfDay(12, 33, 58) > TimeOfDay(12, 33, 59)', 0);
      jelAssert.fuzzy('TimeOfDay(12, 33, 58) < TimeOfDay(12, 33, 59)', 1);
      jelAssert.fuzzy('TimeOfDay(12, 33, 58) >= TimeOfDay(12, 33, 59)', 0);
      jelAssert.fuzzy('TimeOfDay(12, 34, 58) >= TimeOfDay(12, 33, 59)', 1);
      jelAssert.fuzzy('TimeOfDay(12, 34, 58) >= TimeOfDay(12, 34, 58)', 1);
      jelAssert.fuzzy('TimeOfDay(12, 34, 58) <= TimeOfDay(12, 34, 58)', 1);

      jelAssert.equal('TimeOfDay(3, 1, 10) - TimeOfDay(2, 0, 3)', 'Duration(hours=1, minutes=1, seconds=7)');
      jelAssert.equal('TimeOfDay(15, 1, 10) - TimeOfDay(12, 5, 1)', 'Duration(hours=2, minutes=56, seconds=9)');
      jelAssert.equal('TimeOfDay(10, 1, 10) - TimeOfDay(12, 5, 1)', 'Duration(hours=-2, minutes=-3, seconds=-51)');
      jelAssert.equal('TimeOfDay(10, 1, 10) + Duration(hours=3, seconds=2.5)', 'TimeOfDay(13, 1, 13)');
      jelAssert.equal('TimeOfDay(10, 1, 10) - Duration(hours=3, seconds=2.5)', 'TimeOfDay(7, 1, 8)');
      jelAssert.equal('TimeOfDay(10, 1, 10) - Duration(hours=24, seconds=65)', 'TimeOfDay(10, 0, 5)');

      jelAssert.equal('TimeOfDay(12, 33, 59)+Duration(0)', 'TimeOfDay(12, 33, 59)');
      jelAssert.equal('TimeOfDay(10, 33, 59)+Duration(hours=40)', 'TimeOfDay(2, 33, 59)');
      jelAssert.equal('TimeOfDay(0, 33, 59)+Duration(hours=-2)', 'TimeOfDay(22, 33, 59)');
      jelAssert.equal('TimeOfDay(2, 59, 9)+Duration(seconds=120)', 'TimeOfDay(3, 1, 9)');
      jelAssert.equal('TimeOfDay(2, 50, null)+Duration(minutes=40)', 'TimeOfDay(3, 30, null)');
      jelAssert.equal('TimeOfDay(20, null, null)+Duration(hours=5)', 'TimeOfDay(1, null, null)');
    });
  });

  describe('LocalDate', function() {
    it('creates and serializes', function() {
      jelAssert.equal('LocalDate(year=2013, month=5, day=2)', new LocalDate(2013, 5, 2));
      jelAssert.equal('LocalDate(1999, 1, 20)', new LocalDate(1999, 1, 20));	
    });

    it('supports getters', function() {
      jelAssert.equal('LocalDate(1999, 1, 20).dayOfYear', 20);
      jelAssert.equal('LocalDate(1999, 2, 20).dayOfYear', 51);
      jelAssert.equal('LocalDate(2018, 11, 5).dayOfYear', 309);
      jelAssert.equal('LocalDate(1999, 2, 20).year', 1999);
      jelAssert.equal('LocalDate(1999, 2, 20).month', 2);
      jelAssert.equal('LocalDate(1999, 2, 20).day', 20);
      jelAssert.equal('LocalDate(2018, 11, 12).dayOfWeek', 1);
      jelAssert.equal('LocalDate(2018, 11, 12).isoWeek', 46);
      jelAssert.equal('LocalDate(2018, 11, 12).century', 21);
      jelAssert.equal('LocalDate(2018, 11, 12).millenium', 3);
    });

    it('supports operators', function() {
      jelAssert.fuzzy('LocalDate(2018, 12, 24) == LocalDate(2018, 12, 24)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) == LocalDate(2018, 12, 25)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) != LocalDate(2018, 12, 25)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) == LocalDate(2018, 12, null)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) != LocalDate(2018, 12, null)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) == LocalDate(2018, null, null)', 1);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) == LocalDate(2018, null, null)', 0);

      jelAssert.fuzzy('LocalDate(2018, 12, 24) === LocalDate(2018, 12, 24)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) === LocalDate(2018, 12, 25)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) !== LocalDate(2018, 12, 25)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) === LocalDate(2018, 12, null)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) !== LocalDate(2018, 12, null)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) === LocalDate(2018, null, null)', 0);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) === LocalDate(2018, null, null)', 0);

      jelAssert.fuzzy('LocalDate(2018, 12, 24) >= LocalDate(2018, 12, 24)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) >= LocalDate(2018,  5, 30)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) <= LocalDate(2019,  5, 30)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) <= LocalDate(2019,  5, null)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) <= LocalDate(2019,  null, null)', 1);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) <= LocalDate(2019,  null, null)', 1);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) <= LocalDate(2019,  12, null)', 1);
      jelAssert.fuzzy('LocalDate(2019, 11, 24) <= LocalDate(2019,  12, null)', 1);

      jelAssert.fuzzy('LocalDate(2018, 12, 24) <= LocalDate(2018, 12, 24)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) <= LocalDate(2018,  5, 30)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) >= LocalDate(2019,  5, 30)', 0);

      jelAssert.fuzzy('LocalDate(2018, 12, 24) > LocalDate(2018, 12, 24)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) > LocalDate(2018,  5, 30)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) < LocalDate(2019,  5, 30)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) < LocalDate(2019,  5, null)', 1);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) < LocalDate(2019,  null, null)', 1);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) < LocalDate(2019,  null, null)', 0);
      jelAssert.fuzzy('LocalDate(2019, 12, 24) < LocalDate(2019,  12, null)', 0);
      jelAssert.fuzzy('LocalDate(2019, 11, 24) < LocalDate(2019,  12, null)', 1);

      jelAssert.fuzzy('LocalDate(2018, 12, 24) < LocalDate(2018, 12, 24)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) < LocalDate(2018,  5, 30)', 0);
      jelAssert.fuzzy('LocalDate(2018, 12, 24) > LocalDate(2019,  5, 30)', 0);

      jelAssert.equal('LocalDate(2018, 10, 4) - LocalDate(2018, 10, 1)', 'Duration(days=3)');
      jelAssert.equal('LocalDate(2018, 10, 4) - LocalDate(2018, 10, null)', 'Duration(days=3)');
      jelAssert.equal('LocalDate(2018, 10, 4) - LocalDate(2018, 8, 4)', 'Duration(months=2)');
      jelAssert.equal('LocalDate(2018, 10, 4) - LocalDate(2017, 10, 4)', 'Duration(years=1)');
      jelAssert.equal('LocalDate(2018, 10, 4) - LocalDate(2016, 11, 8)', 'Duration(years=1, months=10, days=26)');
      jelAssert.equal('LocalDate(2018,  1, 1) - LocalDate(2017, 12, 31)', 'Duration(days=1)');
      jelAssert.equal('LocalDate(2018,  1, 1) - LocalDate(2017, 12, 25)', 'Duration(days=7)');
      jelAssert.equal('LocalDate(2018, 12, 31) - LocalDate(2018, 12, 24)', 'Duration(days=7)');
      jelAssert.equal('LocalDate(2018, 11, 30) - LocalDate(2018, 11, 24)', 'Duration(days=6)');
      jelAssert.equal('LocalDate(2018,  1, 31) - LocalDate(2018,  1, 24)', 'Duration(days=7)');
      jelAssert.equal('LocalDate(2018,  6, 9) - LocalDate(2017, 12, 9)', 'Duration(months=6)');
      jelAssert.equal('LocalDate(2018,  1, 1) - LocalDate(2016, 12, 31)', 'Duration(years=1, days=1)');
      jelAssert.equal('LocalDate(2018,  2, 1) - LocalDate(2016, 11, 30)', 'Duration(years=1, months=2, days=1)');
      jelAssert.equal('LocalDate(2018,  1, 1) - LocalDate(2017, 12, 31)', 'Duration(days=1)');
      jelAssert.equal('LocalDate(2000,  1, 1) - LocalDate(2016, 12, 31)', 'Duration(years=-16, months=-11, days=-30)');
      jelAssert.equal('LocalDate(2000,  1, 1) - LocalDate(2001,  2,  1)', 'Duration(years=-1, months=-1)');
      jelAssert.equal('LocalDate(2000,  1, 2) - LocalDate(2001,  2,  1)', 'Duration(years=-1, months=0, days=-30)');
      jelAssert.equal('LocalDate(2000,  1, 2) - LocalDate(2001,  2,  3)', 'Duration(years=-1, months=-1, days=-1)');
      jelAssert.equal('LocalDate(2001,  1, 2) - LocalDate(2001,  2,  3)', 'Duration(months=-1, days=-1)');
      jelAssert.equal('LocalDate(2002,  1, 2) - LocalDate(2001,  2,  3)', 'Duration(months=10, days=27)');
      jelAssert.equal('LocalDate(2001,  2, 3) - LocalDate(2001,  1,  2)', 'Duration(months=1, days=1)');


      jelAssert.equal('LocalDate(2018, 10, 4) - Duration(seconds=1)', 'LocalDate(2018, 10, 3)');
      jelAssert.equal('LocalDate(2018, 10, 4) + Duration(hours=10)', 'LocalDate(2018, 10, 4)');
      jelAssert.equal('LocalDate(2018, 10, 4) - Duration(days=12)', 'LocalDate(2018, 9, 22)');
      jelAssert.equal('LocalDate(2018, 10, 4) + Duration(days=12)', 'LocalDate(2018, 10, 16)');
      jelAssert.equal('LocalDate(2018, 10, 4) + Duration(days=12, hours=2)', 'LocalDate(2018, 10, 16)');
      jelAssert.equal('LocalDate(2018, 10, null) + Duration(days=12)', 'LocalDate(2018, 10, 13)');
      jelAssert.equal('LocalDate(2018, 10, 4) + Duration(years=2, months=2, days=12)', 'LocalDate(2020, 12, 16)');
      jelAssert.equal('LocalDate(2018, 10, 4) - Duration(years=2, months=2, days=2)', 'LocalDate(2016, 8, 2)');

      jelAssert.equal('LocalDate(2018, 10, 4) + 2 @Year', 'LocalDate(2020, 10, 4)');
      jelAssert.equal('LocalDate(2018, 10, 4) + 2 @Month', 'LocalDate(2018, 12, 4)');
      jelAssert.equal('LocalDate(2018, 10, 4) + 2 @Day', 'LocalDate(2018, 10, 6)');
      jelAssert.equal('LocalDate(2018, 10, 4) - 2 @Year', 'LocalDate(2016, 10, 4)');
      jelAssert.equal('LocalDate(2018, 10, 4) - 2 @Month', 'LocalDate(2018, 8, 4)');
      jelAssert.equal('LocalDate(2018, 10, 4) - 2 @Day', 'LocalDate(2018, 10, 2)');

      jelAssert.equal('Duration(days=1) + LocalDate(2018, 10, 4)', 'LocalDate(2018, 10, 5)');
      jelAssert.equal('2 @Year + LocalDate(2018, 10, 4)', 'LocalDate(2020, 10, 4)');
    });

    it('supports conversions', function() {
      jelAssert.equal('LocalDate(2020, 5, 12).toZonedDate(TimeZone("Europe/Amsterdam"))', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2020, 5, 12)');
      jelAssert.equal('LocalDate(2020, 5, 12).toZonedDateTime(TimeZone("Europe/Amsterdam"))', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 0, 0, 0)');
      jelAssert.equal('LocalDate(2020, 5, 12).toZonedDateTime(TimeZone("Europe/Amsterdam"), TimeOfDay(12, 2, 1))', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 12, 2, 1)');
      jelAssert.equal('LocalDate(2020, 5, 12).toLocalDateTime(TimeOfDay(12, 2, 1))', 'LocalDateTime(2020, 5, 12, 12, 2, 1)');
      jelAssert.equal('LocalDate(2020, 5, 12).toLocalDateTime()', 'LocalDateTime(2020, 5, 12, 0, 0, 0)');
    });
  });


  describe('LocalDateTime', function() {
    it('creates and serializes', function() {
      jelAssert.equal('LocalDateTime(year=2013, month=5, day=2, hour=3)', new LocalDateTime(new LocalDate(2013, 5, 2), new TimeOfDay(3)));
      jelAssert.equal('LocalDateTime.fromDate(LocalDate(1999, 1, 20), TimeOfDay(13, 4, 5))', new LocalDateTime(new LocalDate(1999, 1, 20), new TimeOfDay(13, 4, 5)));	
    });

    it('supports operators', function() {
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) == LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) === LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 12) == LocalDateTime(2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('LocalDateTime(2000, 12, 24, 11, 23, 11) == LocalDateTime(2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) == LocalDateTime(2018, 12, 24, 11, null, null)', 1);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) === LocalDateTime(2018, 12, 24, 11, null, null)', 0);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) != LocalDateTime(2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 12) != LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('LocalDateTime(2000, 12, 24, 11, 23, 11) != LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);

      jelAssert.fuzzy('LocalDateTime(2017, 12, 1, 11, 23, 11) < LocalDateTime(2018, 12, 24, 11, 23, 12)', 1);
      jelAssert.fuzzy('LocalDateTime(2017, 12, 1, 11, 23, 11) > LocalDateTime(2018, 12, 24, 11, 23, 12)', 0);
      jelAssert.fuzzy('LocalDateTime(2017, 12, 1, 11, 23, 11) < LocalDateTime(2018, 12, 24, 11, null, null)', 1);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) >= LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('LocalDateTime(2018, 12, 24, 11, 23, 11) <= LocalDateTime(2018, 12, 24, 11, 23, 11)', 1);

      jelAssert.equal('LocalDateTime(2018, 12, 24, 11, 23, 11) - LocalDateTime(2017, 12, 24, 11, 23, 11)', 'Duration(years=1)');
      jelAssert.equal('LocalDateTime(2018, 12, 24, 11, 23, 11) - LocalDateTime(2018, 12, 24, 11, 23, 6)', 'Duration(seconds=5)');
      jelAssert.equal('LocalDateTime(2018, 12, 28, 11, 23, 11) - LocalDateTime(2018, 12, 24, 10, 23, 6)', 'Duration(days=4, hours=1, seconds=5)');

      jelAssert.equal('LocalDateTime(2019, 12, 24, 11, 23, 10) - LocalDateTime(2018, 12, 24, 10, 23, 11)', 'Duration(years=1, minutes=59, seconds=59)');
      jelAssert.equal('LocalDateTime(2019, 12, 24, 11, 23, 10) - LocalDateTime(2018, 12, 24, 11, 23, 11)', 'Duration(years=1, seconds=-1)');

      jelAssert.equal('LocalDateTime(2019, 12, 24, 11, 23, 10) - LocalDate(2019, 12, 24)', 'Duration(hours=11, minutes=23, seconds=10)');
      jelAssert.fuzzy('LocalDateTime(2019, 12, 24, 11, 23, 10) == LocalDate(2019, 12, 24)', 0);
      jelAssert.fuzzy('LocalDateTime(2019, 12, 24, 0, 0, 0) == LocalDate(2019, 12, 24)', 1);


      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + 2 @Year', 'LocalDateTime(2020, 10, 4, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + 2 @Month', 'LocalDateTime(2018, 12, 4, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + 2 @Day', 'LocalDateTime(2018, 10, 6, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) - 2 @Hour', 'LocalDateTime(2018, 10, 6, 6, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) + 2 @Minute', 'LocalDateTime(2018, 10, 6, 8, 14, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) - 2 @Second', 'LocalDateTime(2018, 10, 6, 8, 12, 18)');

      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + Duration(2)', 'LocalDateTime(2020, 10, 4, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + Duration(0, 2)', 'LocalDateTime(2018, 12, 4, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 4, 8, 12, 20) + Duration(0, 0, 2)', 'LocalDateTime(2018, 10, 6, 8, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) - Duration(0,0,0, 2)', 'LocalDateTime(2018, 10, 6, 6, 12, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) + Duration(0,0,0, 0, 2)', 'LocalDateTime(2018, 10, 6, 8, 14, 20)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) - Duration(0,0,0, 0,0,2)', 'LocalDateTime(2018, 10, 6, 8, 12, 18)');
      jelAssert.equal('LocalDateTime(2018, 10, 6, 8, 12, 20) + Duration(2,2,10, 2, 4, 6)', 'LocalDateTime(2020, 12, 16, 10, 16, 26)');
    });

    it('supports conversions', function() {
      jelAssert.equal('LocalDateTime(2020, 5, 12, 7, 4, 1).toZonedDate(TimeZone("Europe/Amsterdam"))', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2020, 5, 12)');
      jelAssert.equal('LocalDateTime(2020, 5, 12, 7, 4, 1).toZonedDateTime(TimeZone("Europe/Amsterdam"))', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 7, 4, 1)');
    });
  });

  describe('ZonedDate', function() {
    it('creates and serializes', function() {
      jelAssert.equal('ZonedDate(TimeZone.UTC, year=2013, month=5, day=2)', new ZonedDate(new TimeZone(), new LocalDate(2013, 5, 2)));
      jelAssert.equal('ZonedDate.fromLocalDate(TimeZone.UTC, LocalDate(2013, 5, 2))', new ZonedDate(new TimeZone(), new LocalDate(2013, 5, 2)));
      jelAssert.equal('ZonedDate(TimeZone("America/Los_Angeles"), 1999, 1, 20)', new ZonedDate(new TimeZone("America/Los_Angeles"), new LocalDate(1999, 1, 20)));
    });

    it('supports getter', function() {
      jelAssert.equal('ZonedDate(TimeZone.UTC, 1999, 1, 20).year', 1999);
      jelAssert.equal('ZonedDate(TimeZone.UTC, 1999, 1, 20).month', 1);
      jelAssert.equal('ZonedDate(TimeZone.UTC, 1999, 1, 20).day', 20);
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 11, 5).dayOfYear', 309);
    });

    it('supports operators', function() {
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) == ZonedDate(TimeZone.UTC, 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) === ZonedDate(TimeZone.UTC, 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) == ZonedDate(TimeZone("America/New_York"), 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) === ZonedDate(TimeZone("America/New_York"), 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("Europe/Paris"), 2018, 12, 24) == ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("Europe/Paris"), 2018, 12, 24) === ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 0);

      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) != ZonedDate(TimeZone.UTC, 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) !== ZonedDate(TimeZone.UTC, 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) != ZonedDate(TimeZone("America/New_York"), 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) !== ZonedDate(TimeZone("America/New_York"), 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("Europe/Paris"), 2018, 12, 24) != ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("Europe/Paris"), 2018, 12, 24) !== ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 1);

      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) === ZonedDate(TimeZone.UTC, 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) === ZonedDate(TimeZone.UTC, 2018, 12, 25)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) !== ZonedDate(TimeZone.UTC, 2018, 12, 25)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) === ZonedDate(TimeZone.UTC, 2018, 12, null)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) !== ZonedDate(TimeZone.UTC, 2018, 12, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) == ZonedDate(TimeZone.UTC, 2018, null, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) === ZonedDate(TimeZone.UTC, 2018, null, null)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 12, 24) === ZonedDate(TimeZone.UTC, 2018, null, null)', 0);

      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) >= ZonedDate(TimeZone.UTC, 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) >= ZonedDate(TimeZone.UTC, 2018,  5, 30)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) <= ZonedDate(TimeZone.UTC, 2019,  5, 30)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) <= ZonedDate(TimeZone.UTC, 2019,  5, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) <= ZonedDate(TimeZone.UTC, 2019,  null, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 12, 24) <= ZonedDate(TimeZone.UTC, 2019,  null, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 12, 24) <= ZonedDate(TimeZone.UTC, 2019,  12, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 11, 24) <= ZonedDate(TimeZone.UTC, 2019,  12, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) >= ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) <= ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("Europe/Paris"), 2018, 12, 24) <= ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 24)', 1);

      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) > ZonedDate(TimeZone.UTC, 2018, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone("America/New_York"), 2018, 12, 24) > ZonedDate(TimeZone.UTC, 2018, 12, 24)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) > ZonedDate(TimeZone.UTC, 2018,  5, 30)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) < ZonedDate(TimeZone.UTC, 2019,  5, 30)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) < ZonedDate(TimeZone.UTC, 2019,  5, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2018, 12, 24) < ZonedDate(TimeZone.UTC, 2019,  null, null)', 1);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 12, 24) < ZonedDate(TimeZone.UTC, 2019,  null, null)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 12, 24) < ZonedDate(TimeZone.UTC, 2019,  12, null)', 0);
      jelAssert.fuzzy('ZonedDate(TimeZone.UTC, 2019, 11, 24) < ZonedDate(TimeZone.UTC, 2019,  12, null)', 1);

      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - ZonedDate(TimeZone.UTC, 2018, 10, 1)', 'Duration(days=3)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - ZonedDate(TimeZone.UTC, 2018, 10, null)', 'Duration(days=3)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - ZonedDate(TimeZone.UTC, 2018, 8, 4)', 'Duration(months=2)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2000,  1, 1) - ZonedDate(TimeZone.UTC, 2016, 12, 31)', 'Duration(years=-16, months=-11, days=-30)');
      jelAssert.equal('ZonedDate(TimeZone("America/New_York"), 2018, 10, 4) - ZonedDate(TimeZone.UTC, 2018, 10, 4)', 'Duration(hours=4)');
      jelAssert.equal('ZonedDate(TimeZone("America/New_York"), 2018, 10, 4) - ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4)', 'Duration(hours=6)');

      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - Duration(seconds=1)', 'ZonedDate(TimeZone.UTC, 2018, 10, 3)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4) + Duration(hours=10)', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - Duration(years=2, months=2, days=2)', 'ZonedDate(TimeZone.UTC, 2016, 8, 2)');

      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) + 2 @Year', 'ZonedDate(TimeZone.UTC, 2020, 10, 4)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4) + 2 @Month', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 12, 4)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4) + 2 @Day', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 6)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4) - 2 @Year', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2016, 10, 4)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - 2 @Month', 'ZonedDate(TimeZone.UTC, 2018, 8, 4)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2018, 10, 4) - 2 @Day', 'ZonedDate(TimeZone.UTC, 2018, 10, 2)');

      jelAssert.equal('Duration(days=1) + ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 4)', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2018, 10, 5)');
      jelAssert.equal('2 @Year + ZonedDate(TimeZone.UTC, 2018, 10, 4)', 'ZonedDate(TimeZone.UTC, 2020, 10, 4)');
    });

    it('supports conversions', function() {
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2020, 5, 12).withTimeZone(TimeZone("Europe/Amsterdam"))', 'ZonedDate(TimeZone("Europe/Amsterdam"), 2020, 5, 12)');
      jelAssert.equal('ZonedDate(TimeZone.UTC, 2020, 5, 12).toUTC()', 'ZonedDate(TimeZone("UTC"), 2020, 5, 12)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2020, 5, 12).toZonedDateTime()', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 0, 0, 0)');
      jelAssert.equal('ZonedDate(TimeZone("Europe/Amsterdam"), 2020, 5, 12).toZonedDateTime(TimeOfDay(12, 2, 1))', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 12, 2, 1)');
    });
  });


  describe('ZonedDateTime', function() {
    it('creates and serializes', function() {
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2013, 5, 2, 3)', new ZonedDateTime(new TimeZone(), new LocalDate(2013, 5, 2), new TimeOfDay(3)));
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, year=2013, month=5, day=2, hour=3)', new ZonedDateTime(new TimeZone(), new LocalDate(2013, 5, 2), new TimeOfDay(3)));
      jelAssert.equal('ZonedDateTime.fromLocalDate(TimeZone.UTC, LocalDate(1999, 1, 20), TimeOfDay(13, 4, 5))', new ZonedDateTime(new TimeZone(), new LocalDate(1999, 1, 20), new TimeOfDay(13, 4, 5)));	
      jelAssert.equal('ZonedDateTime.fromZonedDate(ZonedDate(TimeZone.UTC, 1999, 1, 20), TimeOfDay(13, 4, 5))', new ZonedDateTime(new TimeZone(), new LocalDate(1999, 1, 20), new TimeOfDay(13, 4, 5)));	
    });

    it('supports operators', function() {
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) == ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 11) == ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 11) == ZonedDateTime(TimeZone("Europe/Amsterdam"), 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) === ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 11) === ZonedDateTime(TimeZone("Europe/Amsterdam"), 2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone("Europe/Amsterdam"), 2018, 12, 24, 11, 23, 11) === ZonedDateTime(TimeZone("Europe/Amsterdam"), 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 12) == ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2000, 12, 24, 11, 23, 11) == ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) == ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, null, null)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) === ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, null, null)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) != ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 12) != ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2000, 12, 24, 11, 23, 11) != ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);

      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2017, 12, 1, 11, 23, 11) < ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 12)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2017, 12, 24, 11, 23, 12) < ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 12)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2017, 12, 24, 11, 23, 12) > ZonedDateTime(TimeZone("Europe/Paris"), 2018, 12, 24, 11, 23, 12)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2017, 12, 1, 11, 23, 11) > ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 12)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2017, 12, 1, 11, 23, 11) < ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, null, null)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) >= ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) <= ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11)', 1);

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) - ZonedDateTime(TimeZone.UTC, 2017, 12, 24, 11, 23, 11)', 'Duration(years=1)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 24, 11, 23, 11) - ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 24, 11, 23, 6)', 'Duration(seconds=5)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 11) - ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 11, 23, 6)', 'Duration(seconds=5)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 28, 11, 23, 11) - ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 24, 10, 23, 6)', 'Duration(days=4, hours=1, seconds=5)');

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) - ZonedDateTime(TimeZone.UTC, 2018, 12, 24, 10, 23, 11)', 'Duration(years=1, minutes=59, seconds=59)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2019, 12, 24, 11, 23, 10) - ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 24, 11, 23, 11)', 'Duration(years=1, seconds=-1)');

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) - LocalDate(2019, 12, 24)', 'Duration(hours=11, minutes=23, seconds=10)');
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) == LocalDate(2019, 12, 24)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 0, 0, 0) == LocalDate(2019, 12, 24)', 1);

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) - ZonedDate(TimeZone.UTC, 2019, 12, 24)', 'Duration(hours=11, minutes=23, seconds=10)');
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) == ZonedDate(TimeZone("America/New_York"), 2019, 6, 24)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone("America/New_York"), 2019, 12, 24, 0, 0, 0) == ZonedDate(TimeZone("America/New_York"), 2019, 12, 24)', 1);

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) - LocalDateTime(2019, 12, 24, 9, 22, 1)', 'Duration(hours=2, minutes=1, seconds=9)');
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) > LocalDateTime(2019, 12, 24, 9, 22, 1)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) < LocalDateTime(2019, 12, 24, 9, 22, 1)', 0);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) >= LocalDateTime(2019, 12, 24, 11, 22, 10)', 1);
      jelAssert.fuzzy('ZonedDateTime(TimeZone.UTC, 2019, 12, 24, 11, 23, 10) == LocalDateTime(2019, 12, 24, 11, 23, 10)', 1);

      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 4, 8, 12, 20) + 2 @Year', 'ZonedDateTime(TimeZone.UTC, 2020, 10, 4, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 4, 8, 12, 20) + 2 @Month', 'ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 4, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 4, 8, 12, 20) + 2 @Day', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) - 2 @Hour', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 6, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) + 2 @Minute', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 14, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) - 2 @Second', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 18)');

      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 4, 8, 12, 20) + Duration(2)', 'ZonedDateTime(TimeZone("America/New_York"), 2020, 10, 4, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 4, 8, 12, 20) + Duration(0, 2)', 'ZonedDateTime(TimeZone("America/New_York"), 2018, 12, 4, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 4, 8, 12, 20) + Duration(0, 0, 2)', 'ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 6, 8, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 6, 8, 12, 20) - Duration(0,0,0, 2)', 'ZonedDateTime(TimeZone("America/New_York"), 2018, 10, 6, 6, 12, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) + Duration(0,0,0, 0, 2)', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 14, 20)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) - Duration(0,0,0, 0,0,2)', 'ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 18)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2018, 10, 6, 8, 12, 20) + Duration(2,2,10, 2, 4, 6)', 'ZonedDateTime(TimeZone.UTC, 2020, 12, 16, 10, 16, 26)');
    });

    it('supports conversions', function() {
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2020, 5, 12, 3, 4, 5).withTimeZone(TimeZone("Europe/Amsterdam"))', 'ZonedDateTime(TimeZone("Europe/Amsterdam"), 2020, 5, 12, 9, 4, 5)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2020, 5, 12, 3, 4, 5).toUTC()', 'ZonedDateTime(TimeZone("UTC"), 2020, 5, 12, 7, 4, 5)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2020, 5, 12, 3, 4, 5).toLocalDateTime()', 'LocalDateTime(2020, 5, 12, 3, 4, 5)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2020, 5, 12, 3, 4, 5).toZonedDate()', 'ZonedDate(TimeZone("America/New_York"), 2020, 5, 12)');
      jelAssert.equal('ZonedDateTime(TimeZone.UTC, 2020, 5, 12, 3, 4, 5).toTimestamp().toZonedDateTime(TimeZone.UTC)', 'ZonedDateTime(TimeZone.UTC, 2020, 5, 12, 3, 4, 5)');
      jelAssert.equal('ZonedDateTime(TimeZone("America/New_York"), 2020, 5, 12, 3, 4, 5).toTimestamp().toZonedDateTime(TimeZone.UTC)', 'ZonedDateTime(TimeZone.UTC, 2020, 5, 12, 7, 4, 5)');
    });

    it('can be type checked', function() {
      jelAssert.equal('LocalDate(2018, 12) instanceof date', 'true');
      jelAssert.equal('LocalDate(2018, 12) instanceof time', 'true');
      jelAssert.equal('"x" instanceof date', 'false');
      jelAssert.equal('"x" instanceof time', 'false');
      jelAssert.equal('LocalDateTime(2018, 12, 12, 20, 0, 0) instanceof date', 'false');
      jelAssert.equal('LocalDateTime(2018, 12, 12, 20, 0, 0) instanceof time', 'true');
    });
  });

});

