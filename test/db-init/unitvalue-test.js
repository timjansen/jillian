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

describe('Unit & UnitValues', function() {
  let db, session, ctx;
  before(function() {
      db = new Database(path);
      return DbSession.create(db).then(s=>{
        session = s;
        ctx = s.ctx;
        jelAssert.setCtx(ctx);
      });
  });

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
      assert.deepEqual(new Unit(new Dictionary(Util.toMap({Meter: Float.valueOf(1), Second: Float.valueOf(4), Watt: Float.valueOf(-1)}), true)).units, Util.toMap({Meter: 1, Second: 4, Watt: -1}));

      return Promise.all([jelAssert.equalPromise("1 @Second", "UnitValue(1, @Second)"), 
                          jelAssert.equalPromise("Unit(@Second)", "Unit(@Second)")]);
    });

    it('has comparison operators', function() {
      return Promise.all([
        jelAssert.equalPromise("Unit(@Meter) == Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit(@Meter) == Unit('Second')", "false"),
        jelAssert.equalPromise("Unit(@Meter) == Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit(@Meter) == Unit('Second')", "false"),
        jelAssert.equalPromise("Unit(@Meter) === Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit(@Meter) === Unit('Second')", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) == Unit('Meter')", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) == Unit([@Meter, @Meter])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Second]) == Unit(@Meter, @Second)", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) == Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Piece, @Second]) == Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) == Unit([@Meter, @Meter, @Second], @Watt)", "false"),

        jelAssert.equalPromise("Unit(@Meter) === Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit(@Meter) === Unit('Second')", "false"),
        jelAssert.equalPromise("Unit(@Meter) === Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit(@Meter) === Unit('Second')", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) === Unit('Meter')", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) === Unit([@Meter, @Meter])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Second]) === Unit(@Meter, @Second)", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) === Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Piece, @Second]) === Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) === Unit([@Meter, @Meter, @Second], @Watt)", "false"),

        jelAssert.equalPromise("Unit(@Meter) != Unit('Meter')", "false"),
        jelAssert.equalPromise("Unit(@Meter) !== Unit('Second')", "true"),
        jelAssert.equalPromise("Unit(@Meter) != Unit('Meter')", "false"),
        jelAssert.equalPromise("Unit(@Meter) !== Unit('Second')", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) != Unit('Meter')", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter]) !== Unit([@Meter, @Meter])", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Second]) != Unit(@Meter, @Second)", "true"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) != Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second, @Second], [@Watt, @Piece, @Second]) !== Unit([@Meter, @Meter, @Second], [@Watt, @Piece])", "false"),
        jelAssert.equalPromise("Unit([@Meter, @Meter, @Second], [@Watt, @Piece]) != Unit([@Meter, @Meter, @Second], @Watt)", "true")
      ]);
    });
    
    it('has operators', function() {
      return Promise.all([
        jelAssert.equalPromise("Unit(@Meter) * Unit('Meter')", "Unit({Meter: 2})"),
        jelAssert.equalPromise("Unit(@Meter) * 3", "Unit({Meter: 1})"),
        jelAssert.equalPromise("Unit(@Meter) / 3", "Unit({Meter: 1})"),
        jelAssert.equalPromise("Unit(@Meter) ^ 3", "Unit({Meter: 3})"),
        
        (new JEL("Unit([@Meter, @Meter, @Piece], [@Kilogram]) * Unit(@Watt, [@Litre, @Meter])").execute(session.ctx)).then(r=>assert.deepEqual(r.units, Util.toMap({Meter: 1, Piece: 1, Watt: 1, Litre: -1, Kilogram: -1}))),
        (new JEL("Unit([@Meter, @Meter, @Piece], [@Kilogram]) / Unit(@Watt, [@Litre, @Meter])").execute(session.ctx)).then(r=>assert.deepEqual(r.units, Util.toMap({Meter: 3, Piece: 1, Watt: -1, Litre: 1, Kilogram: -1})))
      ]);
    });

    it('supports isSimple()', function() {
      jelAssert.fuzzy("Unit(@Meter).isSimple()", 1);
      jelAssert.fuzzy("Unit(@Meter, 'Second').isSimple()", 0);
      jelAssert.fuzzy("Unit([@Meter, @Meter]).isSimple()", 0);
      jelAssert.fuzzy("Unit([], @Meter).isSimple()", 0);
    });

    it('supports toUnitReference()', function() {
      jelAssert.fuzzy("Unit(@Meter).toUnitReference() === @Meter", 1);
      assert.throws(()=>JEL("Unit([@Meter, @Meter]).toUnitReference()").executeImmediately(session.ctx), Error);
    });

    it('supports isType()', function() {
      jelAssert.fuzzy("Unit(@Meter).isType(@Meter)", 1);
      jelAssert.fuzzy("Unit(@Meter).isType('Meter')", 1);
      jelAssert.fuzzy("Unit(@Meter).isType(@Second)", 0);
      jelAssert.fuzzy("Unit(@Meter, 'Second').isType(@Meter)", 0);
    });
    
    it('works with Math', function() {
   		jelAssert.equal('Math.acos(0.44, @Degree).unit.isType("Degree")', "true");
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

    it('support canConvertTo()', function() {
      return Promise.all([
        jelAssert.equalPromise("(1 @Meter).canConvertTo(@Meter)", "true"),
        jelAssert.equalPromise("(100 @Centimeter).canConvertTo(@Meter)", "true"),
        jelAssert.equalPromise("UnitValue(144, Unit({Centimeter: 2})).canConvertTo(@SquareCentimeter)", "true"),
        jelAssert.equalPromise("(25 @DegreeCelsius).canConvertTo(@DegreeFahrenheit)", "true"),
        jelAssert.equalPromise("(18 @Piece).canConvertTo(@Dozen)", "true"),
        jelAssert.equalPromise("(3600 @Second).canConvertTo(@Hour)", "true"),

        jelAssert.equalPromise("(1800 @Second).canConvertTo(@Meter)", "false"),
        jelAssert.equalPromise("(1800 @Meter).canConvertTo(@Hour)", "false"),
        jelAssert.equalPromise("(1800 @Meter).canConvertTo(@SquareMeter)", "false")
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
      return Promise.all([
        jelAssert.equalPromise("(5 @Meter).abs()", "(5 @Meter)"),
        jelAssert.equalPromise("(-5 @Meter).abs()", "(5 @Meter)"),
        jelAssert.equalPromise("(-1/5 @Meter).abs()", "(1/5 @Meter)")
      ]);
    });			

    it('can be type-checked', function() {
      return Promise.all([
        jelAssert.equalPromise("5 @Meter instanceof numeric", "true"),
        jelAssert.equalPromise("5 @Meter instanceof numeric(1 @Meter ... 10 @Meter)", "true"),
        jelAssert.equalPromise("5 @Meter instanceof numeric(1 @Meter ... 2 @Meter)", "false"),

        jelAssert.equalPromise("5 @Meter instanceof @Meter", "true"),
        jelAssert.equalPromise("5 @Meter instanceof @Centimeter", "true"),
        jelAssert.equalPromise("5 @Meter instanceof @Length", "true"),
        jelAssert.equalPromise("5 @Hour instanceof @Time", "true"),
        jelAssert.equalPromise("5 @Meter instanceof @Velocity", "false"),
        jelAssert.equalPromise("5 instanceof @Meter", "false"),
        jelAssert.equalPromise("null instanceof @Meter", "false"),
        jelAssert.equalPromise("null instanceof @Time", "false"),
        jelAssert.equalPromise("5 @Meter instanceof duration", "false"),
        jelAssert.equalPromise("5 @Day instanceof duration", "true"),
        jelAssert.equalPromise("5 @Meter instanceof 1 @Meter ... 10 @Meter", "true"),
        jelAssert.equalPromise("50 @Meter instanceof 1 @Meter ... 10 @Meter", "false"),
        jelAssert.equalPromise("5 @Meter instanceof >=1 @Meter", "true"),
        jelAssert.equalPromise("5 @Meter instanceof >=10 @Meter", "false"),
        jelAssert.equalPromise("5 @Meter instanceof <=1 @Meter", "false"),
        jelAssert.equalPromise("5 @Meter instanceof <=10 @Meter", "true"),
        jelAssert.equalPromise("(50 @Inch as @Meter) instanceof 1 @Meter ... 10 @Meter", "true"),
        jelAssert.equalPromise("50 @Inch instanceof 1 @Meter ... 10 @Meter", "true"),
        jelAssert.equalPromise("5 @Inch instanceof 1 @Meter ... 10 @Meter", "false")
      ]);
    });			

    it('can be type-converted', function() {
      return Promise.all([
        jelAssert.equalPromise("5 @Meter as @Meter", "5 @Meter"),
        jelAssert.equalPromise("5 @Kilometer as @Meter", "5000 @Meter"),
        jelAssert.equalPromise("1 @Inch as @Centimeter", "2.54 @Centimeter")
      ]);
    });		
    
    it('works with Math', function() {
      jelAssert.equal('Math.asin(0.63, @Turn).toFloat()', Math.asin(0.63) / 2 / Math.PI);
      jelAssert.equal('Math.acos(1, @Radian).toFloat()', Math.acos(1));
      jelAssert.equal('Math.acos(0.44, @Degree).toFloat()', Math.acos(0.44) / 2 / Math.PI * 360);
      jelAssert.equal('Math.round(Math.atan(0.2, "Gradian").toFloat())', Math.round(Math.atan(0.2) / 2 / Math.PI * 400));	
      
      jelAssert.equal('Math.sin(90 @Degree)', Math.sin(Math.PI/2));
      jelAssert.equal('Math.cos(1 @Radian)', Math.cos(1));
      jelAssert.equal('Math.cos(0.5 @Turn)', Math.cos(Math.PI));
      jelAssert.equal('Math.tan(20 @Gradian)', Math.tan(Math.PI/10));
      
   		jelAssert.equal('Math.round(7.5 @Watt)', '8 @Watt');
      jelAssert.equal('Math.floor(Math.random(unit=@Meter))', '0 @Meter');
      jelAssert.equal('Math.trunc(Math.random(min=3 @Second, max=4 @Second))', '3 @Second');
      jelAssert.equal('Math.round(Math.random(min=3 @Second, max=7/2 @Second, unit=@Watt))', '3 @Watt');


    });

  });
  
});