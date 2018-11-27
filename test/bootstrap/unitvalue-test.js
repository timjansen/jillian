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
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const List = require('../../build/jel/types/List.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const JelNumber = require('../../build/jel/types/JelNumber.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const Util = require('../../build/util/Util.js').default;
const tmp = require('tmp');
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const path = 'build/tmp/bootstrap-load';


const db = new Database(path);
const session = new DbSession(db, DefaultContext.get());

jelAssert.setCtx(session.ctx);

describe('Unit', function() {
  it('can be created', function() {
    assert.deepEqual(new Unit('Meter').units, Util.toMap({Meter: 1}));
    assert.deepEqual(new Unit(new DbRef('Meter')).units, Util.toMap({Meter: 1}));
    assert.deepEqual(new Unit(new List([new DbRef('Meter'), new DbRef('Meter')])).units, Util.toMap({Meter: 2}));
    assert.deepEqual(new Unit('Meter', 'Second').units, Util.toMap({Meter: 1, Second: -1}));
    assert.deepEqual(new Unit('Meter', new DbRef('Second')).units, Util.toMap({Meter: 1, Second: -1}));
    assert.deepEqual(new Unit('Meter').units, Util.toMap({Meter: 1}));
    assert.deepEqual(new Unit('Meter', new List([new DbRef('Second'), new DbRef('Second')])).units, Util.toMap({Meter: 1, Second: -2}));
    assert.deepEqual(new Unit('Second', new List([new DbRef('Second'), new DbRef('Second')])).units, Util.toMap({Second: -1}));
    assert.deepEqual(new Unit(Util.toMap({Meter: 1, Second: 4, Watt: -1})).units, Util.toMap({Meter: 1, Second: 4, Watt: -1}));
    assert.deepEqual(new Unit(new Dictionary(Util.toMap({Meter: JelNumber.valueOf(1), Second: JelNumber.valueOf(4), Watt: JelNumber.valueOf(-1)}), true)).units, Util.toMap({Meter: 1, Second: 4, Watt: -1}));

    assert.ok(new JEL("Unit(@Meter)").executeImmediately(session.ctx) instanceof Unit);
    jelAssert.equal("Unit(@Second)", "Unit(@Second)");
    jelAssert.notEqual("Unit(@Second)", "Unit(@Meter)");
    jelAssert.equal("1 @Second", "UnitValue(1, @Second)");
  });

  it('has operators', function() {
    jelAssert.fuzzy("Unit(@Meter) == Unit('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter) == Unit('Second')", 0);
    jelAssert.fuzzy("Unit(@Meter) == Unit('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter) == Unit('Second')", 0);
    jelAssert.fuzzy("Unit(@Meter) === Unit('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter) === Unit('Second')", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) == Unit('Meter')", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) == Unit([@Meter, @Meter])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Second]) == Unit(@Meter, @Second)", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) == Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Pieces, @Second]) == Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) == Unit([@Meter, @Meter, @Second], @Watt)", 0);

    jelAssert.fuzzy("Unit(@Meter) === Unit('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter) === Unit('Second')", 0);
    jelAssert.fuzzy("Unit(@Meter) === Unit('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter) === Unit('Second')", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) === Unit('Meter')", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) === Unit([@Meter, @Meter])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Second]) === Unit(@Meter, @Second)", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) === Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Pieces, @Second]) === Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) === Unit([@Meter, @Meter, @Second], @Watt)", 0);

    jelAssert.fuzzy("Unit(@Meter) != Unit('Meter')", 0);
    jelAssert.fuzzy("Unit(@Meter) !== Unit('Second')", 1);
    jelAssert.fuzzy("Unit(@Meter) != Unit('Meter')", 0);
    jelAssert.fuzzy("Unit(@Meter) !== Unit('Second')", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) != Unit('Meter')", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter]) !== Unit([@Meter, @Meter])", 0);
    jelAssert.fuzzy("Unit([@Meter, @Second]) != Unit(@Meter, @Second)", 1);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) != Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Pieces, @Second]) !== Unit([@Meter, @Meter, @Second], [@Watt, @Pieces])", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter, @Second], [@Watt, @Pieces]) != Unit([@Meter, @Meter, @Second], @Watt)", 1);

    jelAssert.equal("Unit(@Meter) * Unit('Meter')", "Unit({Meter: 2})");
    assert.deepEqual(new JEL("Unit([@Meter, @Meter, @Pieces], [@Kilogram]) * Unit(@Watt, [@Liter, @Meter])").executeImmediately(session.ctx).units, Util.toMap({Meter: 1, Pieces: 1, Watt: 1, Liter: -1, Kilogram: -1}));
    assert.deepEqual(new JEL("Unit([@Meter, @Meter, @Pieces], [@Kilogram]) / Unit(@Watt, [@Liter, @Meter])").executeImmediately(session.ctx).units, Util.toMap({Meter: 3, Pieces: 1, Watt: -1, Liter: 1, Kilogram: -1}));

    jelAssert.equal("Unit(@Meter) * 3", "Unit({Meter: 1})");
    jelAssert.equal("Unit(@Meter) / 3", "Unit({Meter: 1})");
    jelAssert.equal("Unit(@Meter) ^ 3", "Unit({Meter: 3})");
  });

  it('supports isSimple()', function() {
    jelAssert.fuzzy("Unit(@Meter).isSimple()", 1);
    jelAssert.fuzzy("Unit(@Meter, 'Second').isSimple()", 0);
    jelAssert.fuzzy("Unit([@Meter, @Meter]).isSimple()", 0);
    jelAssert.fuzzy("Unit([], @Meter).isSimple()", 0);
  });

  it('supports toSimpleType()', function() {
    jelAssert.fuzzy("Unit(@Meter).toSimpleType() === @Meter", 1);
    assert.throws(()=>JEL("Unit([@Meter, @Meter]).toSimpleType()").executeImmediately(session.ctx), Error);
  });

  it('supports isType()', function() {
    jelAssert.fuzzy("Unit(@Meter).isType(@Meter)", 1);
    jelAssert.fuzzy("Unit(@Meter).isType('Meter')", 1);
    jelAssert.fuzzy("Unit(@Meter).isType(@Second)", 0);
    jelAssert.fuzzy("Unit(@Meter, 'Second').isType(@Meter)", 0);
  });
});

describe('UnitValue', function() {
  it('can be created ', function() {
    assert.deepEqual(new UnitValue(2, 'Meter').unit.units, Util.toMap({Meter: 1}));
    assert.deepEqual(new UnitValue(2, 'Meter').value, 2);
    assert.deepEqual(new UnitValue(2, new DbRef('Meter')).unit.units, Util.toMap({Meter: 1}));
    assert.deepEqual(new UnitValue(0, new Unit('Meter', 'Second')).unit.units, Util.toMap({Meter: 1, Second: -1}));
    jelAssert.equal("(33 @Second).value", 33);
    jelAssert.equal("(33 @Second).unit", "Unit(@Second)");
    jelAssert.equal("UnitValue(33, Unit(@Meter, @Second)).unit", "Unit(@Meter, @Second)");
    jelAssert.equal("UnitValue(Fraction(4, 2), Unit(@Meter, @Second)).value", "4/2");
  });

  it('has operators that work with identical units', function() {
    jelAssert.fuzzy("1 @Meter == UnitValue(1, 'Meter')", 1);
    jelAssert.fuzzy("1 @Meter == 2 @Meter", 0);
    jelAssert.fuzzy("1 @Meter != UnitValue(1, 'Meter')", 0);
    jelAssert.fuzzy("1 @Meter != 2 @Meter", 1);

    jelAssert.fuzzy("9/2 @Meter == 4.5 @Meter", 1);
    jelAssert.fuzzy("9/2 @Meter != 4.6 @Meter", 1);
    jelAssert.fuzzy("9/2 @Meter == 4.6 @Meter", 0);
    jelAssert.fuzzy("9/2 @Meter != 4.5 @Meter", 0);

    jelAssert.fuzzy("2/3 @Meter > 0.6 @Meter", 1);
    jelAssert.fuzzy("2/3 @Meter < 0.7 @Meter", 1);
    jelAssert.fuzzy("2/3 @Meter < 0.6 @Meter", 0);
    jelAssert.fuzzy("2/3 @Meter > 0.7 @Meter", 0);

    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) == UnitValue(ApproximateNumber(6, 3), @Meter)", 0.9, 1);
    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) === UnitValue(ApproximateNumber(6, 3), @Meter)", 0);
    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) != UnitValue(ApproximateNumber(6, 3), @Meter)", 0, 0.2);
    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) !== UnitValue(ApproximateNumber(6, 3), @Meter)", 1);

    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) < UnitValue(ApproximateNumber(6, 3), @Meter)", 0.5, 1);
    jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) << UnitValue(ApproximateNumber(6, 3), @Meter)", 1);
  });

  it('has operators that work with different units', function() {
    return Promise.all([
      jelAssert.fuzzyPromise("1 @Meter == 1 @Second", 0),
      jelAssert.fuzzyPromise("1 @Meter != 1 @Second", 1),
      jelAssert.fuzzyPromise("1 @Meter == 1 @Centimeter", 0),
      jelAssert.fuzzyPromise("1 @Meter != 1 @Centimeter", 1),
      jelAssert.fuzzyPromise("1 @Meter == 100 @Centimeter", 1),
      jelAssert.fuzzyPromise("1 @Meter != 100 @Centimeter", 0)
    ]);
  });

  it('works with approximate numbers', function() {
    return Promise.all([
      jelAssert.equalPromise("15 @Meter +- 3", new UnitValue(new ApproximateNumber(15, 3), 'Meter')),
      jelAssert.equalPromise("20 @Meter +- 0.5 @Meter", new UnitValue(new ApproximateNumber(20, 0.5), 'Meter')),
      jelAssert.equalPromise("10 @Meter +- 1/2 @Meter", new UnitValue(new ApproximateNumber(10, new Fraction(1, 2)), 'Meter')),
      jelAssert.equalPromise("10/8 @Meter +- 1/8 @Meter", new UnitValue(new ApproximateNumber(new Fraction(10, 8), new Fraction(1, 8)), 'Meter')),
      jelAssert.equalPromise("3/4 @Meter +- 0.5 @Meter", new UnitValue(new ApproximateNumber(new Fraction(3, 4), 0.5), 'Meter')),
      jelAssert.equalPromise("1 @Meter +- 1 @Centimeter", new UnitValue(new ApproximateNumber(1, new Fraction(1, 100)), 'Meter')),
      jelAssert.equalPromise("30 @Meter +- (1 @Meter +- 0.5 @Meter)", new UnitValue(new ApproximateNumber(30, 1.5), 'Meter'))
    ]);
  });

  it('supports toPrimaryUnits()', function() {
    return Promise.all([
      jelAssert.equalPromise("(5 @Meter).toPrimaryUnits()", "UnitValue(5, @Meter)"),
      jelAssert.equalPromise("(5 @Kilometer).toPrimaryUnits()", "UnitValue(5000, @Meter)"),
      jelAssert.equalPromise("UnitValue(42, Unit({Meter: 3})).toPrimaryUnits()", "UnitValue(42, Unit({Meter: 3}))"),
      jelAssert.equalPromise("UnitValue(1, Unit({Kilometer: 3})).toPrimaryUnits()", "UnitValue(1e9, Unit({Meter: 3}))"),
      jelAssert.equalPromise("UnitValue(5000, @Litre).toPrimaryUnits()", "UnitValue(5, @CubicMeter)"),
      jelAssert.equalPromise("UnitValue(5555, Unit(@SquareFeet, @Knot)).toPrimaryUnits().round()", "UnitValue(1003, Unit(@SquareMeter, @MeterPerSecond))"),
      jelAssert.equalPromise("UnitValue(777, Unit({Year: -1, Radian: -2, Horsepower: 2, Kilometer: 3})).toPrimaryUnits().round()", "UnitValue(4173470, Unit({Second: -1, Degree: -2, Watt: 2, Meter: 3}))"),
      jelAssert.equalPromise("UnitValue(1, Unit({Meter: 1, Foot: 2, Mile: 1})).toPrimaryUnits().round()", "UnitValue(150, Unit({Meter: 4}))")
    ]);
  });


  it('support convertTo() with simple units', function() {
    return Promise.all([
      jelAssert.equalPromise("(1 @Meter).convertTo(@Centimeter)", "100 @Centimeter"),
      jelAssert.equalPromise("(100 @Centimeter).convertTo(@Meter)", "1 @Meter"),
      jelAssert.equalPromise("(450 @Centimeter).convertTo(@Meter)", "9/2 @Meter"),
      jelAssert.equalPromise("(25 @DegreeCelsius).convertTo(@DegreeFahrenheit)", "77  @DegreeFahrenheit"),
      jelAssert.equalPromise("(18 @Piece).convertTo(@Dozen)", "3/2 @Dozen"),
      jelAssert.equalPromise("(3600 @Second).convertTo(@Hour)", "1 @Hour"),
      jelAssert.equalPromise("(1800 @Second).convertTo(@Hour)", "1/2 @Hour")
    ]);
  });			

  it('support convertTo() with complex units', function() {
    return Promise.all([
      jelAssert.equalPromise("UnitValue(5, Unit(@Meter, @Second)).convertTo(@MeterPerSecond)", "5 @MeterPerSecond"),
      jelAssert.equalPromise("UnitValue(5, Unit({Meter: 1, Second: -2})).convertTo(@MeterPerSecondSquared)", "5 @MeterPerSecondSquared"),
      jelAssert.equalPromise("UnitValue(5, Unit({MeterPerSecond: 1, Second: -1})).convertTo(@MeterPerSecondSquared)", "5 @MeterPerSecondSquared"),
      jelAssert.equalPromise("UnitValue(144, Unit({Centimeter: 2})).convertTo(@SquareCentimeter)", "144 @SquareCentimeter"),
      jelAssert.equalPromise("UnitValue(3, Unit({Meter: 2})).convertTo(@SquareMeter)", "3 @SquareMeter"),
      jelAssert.equalPromise("UnitValue(3, Unit({Meter: 2})).convertTo(@SquareCentimeter)", "3e4 @SquareCentimeter"),
      jelAssert.equalPromise("UnitValue(500, Unit({Millimeter: 2})).convertTo(@SquareCentimeter)", "5 @SquareCentimeter"),
      jelAssert.equalPromise("UnitValue(50000, Unit(@Foot, @Hour)).convertTo(@MeterPerSecond).round()", "4 @MeterPerSecond"),
      jelAssert.equalPromise("UnitValue(5, Unit({Mile: 1, Minute: -2})).convertTo(@MeterPerSecondSquared).round(10)", "2.2 @MeterPerSecondSquared")
    ]);
  });

  it('supports simplify()', function() {
    return Promise.all([
      jelAssert.equalPromise("(5 @Meter).simplify()", "(5 @Meter)"),
      jelAssert.equalPromise("(5 @Mile).simplify()", "(5 @Mile)"),
      jelAssert.equalPromise("UnitValue(5, Unit(@Meter, @Second)).simplify()", "5 @MeterPerSecond"),
      jelAssert.equalPromise("UnitValue(36, Unit(@Kilometer, @Hour)).simplify()", "36 @KilometerPerHour"),
      jelAssert.equalPromise("UnitValue(2, Unit(@Kilometer, @Minute)).simplify().round()", "33 @MeterPerSecond"),
      jelAssert.equalPromise("UnitValue(10, Unit({Meter: 2})).simplify()", "10 @SquareMeter"),
      jelAssert.equalPromise("UnitValue(10, Unit({Meter: 3})).simplify()", "10 @CubicMeter"),
      jelAssert.equalPromise("UnitValue(10, Unit({Foot: 3})).simplify()", "10 @CubicFeet"),
      jelAssert.equalPromise("UnitValue(10, Unit({Kilometer: 2})).simplify()", "10 @SquareKilometer"),
      jelAssert.equalPromise("UnitValue(5, Unit({Foot: 1, Millimeter: 1, Mile: 1})).simplify().round()", "2 @CubicMeter")
    ]);
  });			

  it('supports abs()', function() {
    jelAssert.equalPromise("(5 @Meter).abs()", "(5 @Meter)");
    jelAssert.equalPromise("(-5 @Meter).abs()", "(5 @Meter)");
    jelAssert.equalPromise("(-1/5 @Meter).abs()", "(1/5 @Meter)");
  });			

});
