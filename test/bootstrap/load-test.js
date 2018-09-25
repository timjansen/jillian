'use strict';

// Note that this test is in the database dir because UnitValue requires DB objects
//

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const Loader = require('../../build/database/Loader.js').default;
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

	return Database.create(path+'/load-test')
		.then(db=>{
			const session = new DbSession(db, new Context().setAll({JelPromise, JelConsole}));
	
			jelAssert.setCtx(session.ctx);
		
			describe('Loader', function() {
				it('loads DB objects', function() {
					return Loader.bootstrapDatabaseObjects(db, 'bootstrap-data/objects', console.log)
					.then(c=>Promise.resolve(session.get('Meter')))
					.then(m=>Promise.resolve(m.member(session.ctx, 'isPrimaryUnit')))
					.then(m=>assert.ok(m));
				});
				
			});
	});
	
});