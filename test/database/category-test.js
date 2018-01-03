'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DatabaseSession = require('../../build/database/DbSession.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const tmp = require('tmp');
const assert = require('assert');

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	Database.create(path+'/cattest')
	.then(db=>{
		const session = new DatabaseSession(db);
		
		describe('Category', function() {
			it('finds no instances', function() {
				const cat = new Category('NoThings');
				return session.put(cat)
					.then(()=>cat.getInstances(session))
					.then(instances=>assert.deepEqual(instances, []));
			});
			
			it('finds instances', function() {
				const cat = new Category('MyCat');
				const subCat = new Category('MySubCat', cat);
				const thing = new Thing('MyThing1', cat);
				const thing2 = new Thing('MyThing2', cat);
				const thing3 = new Thing('MyThing3', subCat);
				return session.put(cat, subCat, thing, thing2, thing3)
					.then(()=>cat.getInstances(session))
					.then(instances=>{
						assert.deepEqual(instances.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']);
						
					cat.getInstances(session) // this time cached...
					.then(instances2=>assert.deepEqual(instances2.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']));	
				});
			});
			

		});


	
	});
});