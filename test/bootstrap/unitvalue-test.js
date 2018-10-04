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
const List = require('../../build/jel/types/List.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const Util = require('../../build/util/Util.js').default;
const tmp = require('tmp');
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();


tmp.dir(function(err, path) {
  if (err) 
		throw err;
	console.log(`unitvalue-test.js: Using tmp dir ${path}`);

	return Database.create(path+'/unitvalue-test')
		.then(db=>Loader.bootstrapDatabaseObjects(db, 'bootstrap-data/objects').then(()=>db))
		.then(db=>{
			const session = new DbSession(db, new Context().setAll({JelPromise, JelConsole}));

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
					assert.deepEqual(new Unit(new Dictionary(Util.toMap({Meter: 1, Second: 4, Watt: -1}))).units, Util.toMap({Meter: 1, Second: 4, Watt: -1}));

					assert.ok(new JEL("Unit(@Meter)").executeImmediately(session.ctx) instanceof Unit);
					jelAssert.equal("Unit(@Second)", "Unit(@Second)");
					jelAssert.notEqual("Unit(@Second)", "Unit(@Meter)");
					jelAssert.equal("1 @Second", "UnitValue(1, @Second)");
				});

				it('has operators', function() {
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
					jelAssert.equal("UnitValue(33, @Second).value", 33);
					jelAssert.equal("UnitValue(33, @Second).unit", "Unit(@Second)");
					jelAssert.equal("UnitValue(33, Unit(@Meter, @Second)).unit", "Unit(@Meter, @Second)");
					jelAssert.equal("UnitValue(Fraction(4, 2), Unit(@Meter, @Second)).value", "Fraction(4, 2)");
				});
				
				it('has operators that work with identical units', function() {
					jelAssert.fuzzy("UnitValue(1, @Meter) == UnitValue(1, 'Meter')", 1);
					jelAssert.fuzzy("UnitValue(1, @Meter) == UnitValue(2, @Meter)", 0);
					jelAssert.fuzzy("UnitValue(1, @Meter) != UnitValue(1, 'Meter')", 0);
					jelAssert.fuzzy("UnitValue(1, @Meter) != UnitValue(2, @Meter)", 1);

					jelAssert.fuzzy("UnitValue(Fraction(9,2), @Meter) == UnitValue(4.5, @Meter)", 1);
					jelAssert.fuzzy("UnitValue(Fraction(9,2), @Meter) != UnitValue(4.6, @Meter)", 1);
					jelAssert.fuzzy("UnitValue(Fraction(9,2), @Meter) == UnitValue(4.6, @Meter)", 0);
					jelAssert.fuzzy("UnitValue(Fraction(9,2), @Meter) != UnitValue(4.5, @Meter)", 0);

					jelAssert.fuzzy("UnitValue(Fraction(2, 3), @Meter) > UnitValue(0.6, 'Meter')", 1);
					jelAssert.fuzzy("UnitValue(Fraction(2, 3), @Meter) < UnitValue(0.7, 'Meter')", 1);
					jelAssert.fuzzy("UnitValue(Fraction(2, 3), @Meter) < UnitValue(0.6, 'Meter')", 0);
					jelAssert.fuzzy("UnitValue(Fraction(2, 3), @Meter) > UnitValue(0.7, 'Meter')", 0);

					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) == UnitValue(ApproximateNumber(6, 3), @Meter)", 0.9, 1);
					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) === UnitValue(ApproximateNumber(6, 3), @Meter)", 0);
					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) != UnitValue(ApproximateNumber(6, 3), @Meter)", 0, 0.2);
					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) !== UnitValue(ApproximateNumber(6, 3), @Meter)", 1);

					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) < UnitValue(ApproximateNumber(6, 3), @Meter)", 0.5, 1);
					jelAssert.fuzzy("UnitValue(ApproximateNumber(5, 3), @Meter) << UnitValue(ApproximateNumber(6, 3), @Meter)", 1);
				});

				it('has operators that work with different units', function() {
					return Promise.all([
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) == UnitValue(1, @Second)", 0),
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) != UnitValue(1, @Second)", 1),
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) == UnitValue(1, @Centimeter)", 0),
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) != UnitValue(1, @Centimeter)", 1),
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) == UnitValue(100, @Centimeter)", 1),
						jelAssert.fuzzyPromise("UnitValue(1, @Meter) != UnitValue(100, @Centimeter)", 0)
					]);
				});

				it('supports toPrimaryUnits()', function() {
					return Promise.all([
						jelAssert.equalPromise("UnitValue(5, @Meter).toPrimaryUnits()", "UnitValue(5, @Meter)"),
						jelAssert.equalPromise("UnitValue(5, @Kilometer).toPrimaryUnits()", "UnitValue(5000, @Meter)"),
						jelAssert.equalPromise("UnitValue(42, Unit({Meter: 3})).toPrimaryUnits()", "UnitValue(42, Unit({Meter: 3}))"),
						jelAssert.equalPromise("UnitValue(1, Unit({Kilometer: 3})).toPrimaryUnits()", "UnitValue(1e9, Unit({Meter: 3}))"),
						jelAssert.equalPromise("UnitValue(5000, @Litre).toPrimaryUnits()", "UnitValue(5, @CubicMeter)"),
						jelAssert.equalPromise("UnitValue(5555, Unit(@SquareFeet, @Knot)).toPrimaryUnits().round()", "UnitValue(1003, Unit(@SquareMeter, @MeterPerSecond))"),
						jelAssert.equalPromise("UnitValue(777, Unit({Day: -3, Radian: -2, Horsepower: 2, Kilometer: 4})).toPrimaryUnits().round()", "UnitValue(204, Unit({Second: -3, Degree: -2, Watt: 2, Meter: 4}))"),
						jelAssert.equalPromise("UnitValue(1, Unit({Meter: 1, Foot: 2, Mile: 1})).toPrimaryUnits().round()", "UnitValue(150, Unit({Meter: 4}))")
					]);
				});

				
				it('support convertTo() with simple units', function() {
					return Promise.all([
						jelAssert.equalPromise("UnitValue(1, @Meter).convertTo(@Centimeter)", "UnitValue(100, @Centimeter)"),
						jelAssert.equalPromise("UnitValue(100, @Centimeter).convertTo(@Meter)", "UnitValue(1, @Meter)"),
						jelAssert.equalPromise("UnitValue(450, @Centimeter).convertTo(@Meter)", "UnitValue(Fraction(9,2),Unit({Meter:1}))"),
						jelAssert.equalPromise("UnitValue(25, @DegreeCelsius).convertTo(@DegreeFahrenheit)", "UnitValue(77, @DegreeFahrenheit)"),
						jelAssert.equalPromise("UnitValue(18, @Piece).convertTo(@Dozen)", "UnitValue(Fraction(3,2), @Dozen)"),
						jelAssert.equalPromise("UnitValue(3600, @Second).convertTo(@Hour)", "UnitValue(1, @Hour)"),
						jelAssert.equalPromise("UnitValue(1800, @Second).convertTo(@Hour)", "UnitValue(Fraction(1,2), @Hour)")
					]);
				});			
				
				it('support convertTo() with complex units', function() {
					return Promise.all([
						jelAssert.equalPromise("UnitValue(5, Unit(@Meter, @Second)).convertTo(@MeterPerSecond)", "UnitValue(5, @MeterPerSecond)"),
						jelAssert.equalPromise("UnitValue(5, Unit({Meter: 1, Second: -2})).convertTo(@MeterPerSecondSquared)", "UnitValue(5, @MeterPerSecondSquared)"),
						jelAssert.equalPromise("UnitValue(5, Unit({MeterPerSecond: 1, Second: -1})).convertTo(@MeterPerSecondSquared)", "UnitValue(5, @MeterPerSecondSquared)"),
						jelAssert.equalPromise("UnitValue(144, Unit({Centimeter: 2})).convertTo(@SquareCentimeter)", "UnitValue(144, @SquareCentimeter)"),
						jelAssert.equalPromise("UnitValue(3, Unit({Meter: 2})).convertTo(@SquareMeter)", "UnitValue(3, @SquareMeter)"),
						jelAssert.equalPromise("UnitValue(3, Unit({Meter: 2})).convertTo(@SquareCentimeter)", "UnitValue(3e4, @SquareCentimeter)"),
						jelAssert.equalPromise("UnitValue(500, Unit({Millimeter: 2})).convertTo(@SquareCentimeter)", "UnitValue(5, @SquareCentimeter)"),
						jelAssert.equalPromise("UnitValue(50000, Unit(@Foot, @Hour)).convertTo(@MeterPerSecond).round()", "UnitValue(4, @MeterPerSecond)"),
						jelAssert.equalPromise("UnitValue(5, Unit({Mile: 1, Minute: -2})).convertTo(@MeterPerSecondSquared).round(10)", "UnitValue(2.2, @MeterPerSecondSquared)")
					]);
				});
					
				it('supports simplify()', function() {
					return Promise.all([
						jelAssert.equalPromise("UnitValue(5, @Meter).simplify()", "UnitValue(5, @Meter)"),
						jelAssert.equalPromise("UnitValue(5, @Mile).simplify()", "UnitValue(5, @Mile)"),
						jelAssert.equalPromise("UnitValue(5, Unit(@Meter, @Second)).simplify()", "UnitValue(5, @MeterPerSecond)"),
						jelAssert.equalPromise("UnitValue(36, Unit(@Kilometer, @Hour)).simplify()", "UnitValue(36, @KilometerPerHour)"),
						jelAssert.equalPromise("UnitValue(2, Unit(@Kilometer, @Minute)).simplify().round()", "UnitValue(33, @MeterPerSecond)"),
						jelAssert.equalPromise("UnitValue(10, Unit({Meter: 2})).simplify()", "UnitValue(10, @SquareMeter)"),
						jelAssert.equalPromise("UnitValue(10, Unit({Meter: 3})).simplify()", "UnitValue(10, @CubicMeter)"),
						jelAssert.equalPromise("UnitValue(10, Unit({Foot: 3})).simplify()", "UnitValue(10, @CubicFeet)"),
						jelAssert.equalPromise("UnitValue(10, Unit({Kilometer: 2})).simplify()", "UnitValue(10, @SquareKilometer)"),
						jelAssert.equalPromise("UnitValue(5, Unit({Foot: 1, Millimeter: 1, Mile: 1})).simplify().round()", "UnitValue(2, @CubicMeter)")
					]);
				});			
			});
		
		
		
	});
});