'use strict';

// Note that this test is in the database dir because UnitValue requires DB objects
//

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
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
		.then(db=>{
			const session = new DbSession(db, new Context().setAll({JelPromise, JelConsole}));
	
			jelAssert.setCtx(session.ctx);
		
			describe('unit', function() {
				it('creates units', function() {
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
	});
	
});