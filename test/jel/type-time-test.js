'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const Duration = require('../../build/jel/types/time/Duration.js').default;
const Timestamp = require('../../build/jel/types/time/Timestamp.js').default;
const TimeZone = require('../../build/jel/types/time/TimeZone.js').default;
const LocalDate = require('../../build/jel/types/time/LocalDate.js').default;
const LocalDateTime = require('../../build/jel/types/time/LocalDateTime.js').default;
const TimeOfDay = require('../../build/jel/types/time/TimeOfDay.js').default;
const ZonedDateTime = require('../../build/jel/types/time/ZonedDateTime.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const Range = require('../../build/jel/types/Range.js').default;

const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({Timestamp, TimeZone, FuzzyBoolean, Range, Duration}));


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

	it('supports toTimeOfDay', function() {
		const d = Date.UTC(2017, 11, 2, 13, 5, 1);
		jelAssert.equal(new TimeOfDay(13, 5, 1), `Timestamp(${d}).toTimeOfDay(TimeZone.UTC)`);
		jelAssert.equal(new TimeOfDay(8, 5, 1), `Timestamp(${d}).toTimeOfDay(TimeZone('America/New_York'))`);
		jelAssert.equal(new TimeOfDay(14, 5, 1), `Timestamp(${d}).toTimeOfDay(TimeZone('Europe/Amsterdam'))`);
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
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(${d}).isContinous()`);
		jelAssert.equal(d, `Timestamp(${d}).getStartTime(TimeZone.UTC).toNumber()`);
		jelAssert.equal(d, `Timestamp(${d}).getEndTime(TimeZone.UTC).toNumber()`);
	});

	
	it('supports operations with other timestamps', function() {
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000) === Timestamp(1000)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) === Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) === Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000) !== Timestamp(1001)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) !== Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) !== Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) << Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) << Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) <<= Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) <<= Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1001, 10) <<= Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1001, 10) >> Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1001, 10) >> Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1001, 10) >>= Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1001, 10) >>= Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) >>= Timestamp(1001, 10)`);

		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000) == Timestamp(1000)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1001) == Timestamp(1000)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000, 10) == Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1005, 10) == Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1000, 10) == Timestamp(1010, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1000, 10) == Timestamp(1015, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) == Timestamp(1021, 10)`);
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1000) != Timestamp(1001)`);
		jelAssert.equal(FuzzyBoolean.BARELY_FALSE, `Timestamp(1000, 10) != Timestamp(1009, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) != Timestamp(1000, 10)`);
		
		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1, 10) < Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1000, 10) < Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_FALSE, `Timestamp(1000, 10) < Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_FALSE, `Timestamp(1005, 10) < Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) < Timestamp(1, 10)`);

		jelAssert.equal(FuzzyBoolean.TRUE, `Timestamp(1, 10) <= Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1000, 10) <= Timestamp(1001, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_TRUE, `Timestamp(1000, 10) <= Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.BARELY_FALSE, `Timestamp(1005, 10) <= Timestamp(1000, 10)`);
		jelAssert.equal(FuzzyBoolean.FALSE, `Timestamp(1000, 10) <= Timestamp(10, 10)`);

	});
	
	it('supports operations with UnitValue', function() {
		// TODO, when UnitValue is ready
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
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam").isDST(Timestamp(${Date.UTC(2017, 11, 2)}))`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("Europe/Amsterdam").isDST(Timestamp(${Date.UTC(2017, 6, 2)}))`);
	});

	it('supports operations', function() {
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone.UTC == TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("Europe/Amsterdam") == TimeZone("Europe/Amsterdam")`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") == TimeZone("Europe/Berlin")`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("etc/UTC") == TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") == TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") != TimeZone("Europe/Amsterdam")`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("Europe/Amsterdam") != TimeZone.UTC`);

		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone.UTC === TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("Europe/Amsterdam") === TimeZone("Europe/Amsterdam")`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") === TimeZone("Europe/Berlin")`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("etc/UTC") === TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") === TimeZone.UTC`);
		jelAssert.equal(FuzzyBoolean.FALSE, `TimeZone("Europe/Amsterdam") !== TimeZone("Europe/Amsterdam")`);
		jelAssert.equal(FuzzyBoolean.TRUE, `TimeZone("Europe/Amsterdam") !== TimeZone.UTC`);

	});
});

describe('Duration', function() {
	it('creates and serializes', function() {
		jelAssert.equal(new Duration(2, 5, 10, 4, 2, 9), "Duration(2, 5, 10, 4, 2, 9)");
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

	it('simplifies with simplify()', function() {
		jelAssert.equal(new Duration(2, 5, 10, 1, 5, 2), "Duration(2, 5, 10, 1, 5, 2).simplify()");
		jelAssert.equal(new Duration(2, 5, 11, 3, 1, 3), "Duration(2, 5, 10, 25, 61, 3603).simplify()");
		jelAssert.equal(new Duration(3, 1, 10, 1, 6, 2), "Duration(3, 1, 10, 1, 5, 62).simplify()");
		jelAssert.equal(new Duration(4, 0, 10, 2, 2, 0), "Duration(3, 12, 10, 1, 62, 0).simplify()");
		jelAssert.equal(new Duration(4, 10, 10, 1, 6, 2), "Duration(3, 22, 10, 1, 5, 62).simplify()");
		jelAssert.equal(new Duration(-4, 0, -10, 0, -56, -2), "Duration(-3, -12, -10, -1, 5, -62).simplify()");
	});

});
