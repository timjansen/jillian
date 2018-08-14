'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const Context = require('../../build/jel/Context.js').default;
const tmp = require('tmp');
const assert = require('assert');

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	Database.create(path+'/cattest')
	.then(db=>{
		const session = new DbSession(db);
		const ctx = new Context(undefined, session);
		
		describe('Category', function() {
			it('must end with "Category"', function() {
				assert.throws(()=>new Category('NoThings'));
			});
			
			
			it('finds no instances', function() {
				const cat = new Category('NoThingsCategory');
				return session.put(ctx, cat)
					.then(()=>cat.getInstances(ctx))
					.then(instances=>assert.deepEqual(instances, []));
			});
			
			it('finds instances', function() {
				const cat = new Category('MyCategory');
				const subCat = new Category('MySubCategory', cat);
				const thing = new Thing('MyThing1', cat);
				const thing2 = new Thing('MyThing2', cat);
				const thing3 = new Thing('MyThing3', subCat);
				return session.put(ctx, cat, subCat, thing, thing2, thing3)
					.then(()=>cat.getInstances(ctx))
					.then(instances=>{
						assert.deepEqual(instances.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']);
						
					cat.getInstances(ctx) // this time cached...
					.then(instances2=>assert.deepEqual(instances2.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']));	
				});
			});
			

		});


	
	});
});