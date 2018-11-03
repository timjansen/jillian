'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Duration = require('../../build/jel/types/time/Duration.js').default;
const DurationRange = require('../../build/jel/types/time/DurationRange.js').default;
const Timestamp = require('../../build/jel/types/time/Timestamp.js').default;
const TimeZone = require('../../build/jel/types/time/TimeZone.js').default;
const LocalDate = require('../../build/jel/types/time/LocalDate.js').default;
const LocalDateTime = require('../../build/jel/types/time/LocalDateTime.js').default;
const TimeOfDay = require('../../build/jel/types/time/TimeOfDay.js').default;
const ZonedDateTime = require('../../build/jel/types/time/ZonedDateTime.js').default;
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
jelAssert.setCtx(DefaultContext.plus(new MockSession()));


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
		jelAssert.equal(new LocalDate(2017, 11, 2), `Timestamp(${d}).toLocalDate(TimeZone.UTC)`);
		jelAssert.equal(new LocalDate(2017, 11, 1), `Timestamp(${d}).toLocalDate(TimeZone('America/New_York'))`);
		jelAssert.equal(new LocalDate(2017, 11, 2), `Timestamp(${d}).toLocalDate(TimeZone('Europe/Amsterdam'))`);
	});

	it('supports toLocalDateTime', function() {
		const d = Date.UTC(2017, 11, 2, 0, 0, 1);
		jelAssert.equal(new LocalDateTime(new LocalDate(2017, 11, 2), new TimeOfDay(0, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone())`);
		jelAssert.equal(new LocalDateTime(new LocalDate(2017, 11, 1), new TimeOfDay(19, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone('America/New_York'))`);
		jelAssert.equal(new LocalDateTime(new LocalDate(2017, 11, 2), new TimeOfDay(1, 0, 1)), `Timestamp(${d}).toLocalDateTime(TimeZone('Europe/Amsterdam'))`);
	});

	it('supports toZonedDateTime', function() {
		const d = Date.UTC(2017, 11, 2, 0, 0, 1);
		jelAssert.equal(new ZonedDateTime(new TimeZone(), new LocalDate(2017, 11, 2), new TimeOfDay(0, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone())`);
		jelAssert.equal(new ZonedDateTime(new TimeZone("America/New_York"), new LocalDate(2017, 11, 1), new TimeOfDay(19, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone('America/New_York'))`);
		jelAssert.equal(new ZonedDateTime(new TimeZone("Europe/Amsterdam"), new LocalDate(2017, 11, 2), new TimeOfDay(1, 0, 1)), `Timestamp(${d}).toZonedDateTime(TimeZone('Europe/Amsterdam'))`);
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
		jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) < Duration(years=3)", 1);
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
		jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=2), Duration(years=3))", 0);
		jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) < DurationRange(Duration(years=3), Duration(years=8))", 0);
		jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=2), Duration(years=3))", 0);
		jelAssert.fuzzy("DurationRange(Duration(years=2), Duration(years=4)) > DurationRange(Duration(years=3), Duration(years=8))", 0);

		jelAssert.equal("DurationRange(Duration(years=1), Duration(years=36))", "DurationRange(Duration(years=2), Duration(years=40)) - DurationRange(Duration(years=1), Duration(years=4))");
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
});


