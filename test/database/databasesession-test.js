'use strict';

const Database = require('../../src/database/database.js');
const DatabaseSession = require('../../src/database/databasesession.js');
const DbEntry = require('../../src/database/dbentry.js');
const Category = require('../../src/database/category.js');
const Thing = require('../../src/database/thing.js');
const tmp = require('tmp');
const assert = require('assert');

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	console.log(`databasesession-test.js: Using tmp dir ${path}`);

	describe('database session', function() {
		it('puts and gets', function() {
			return Database.create(path+'/dbsession1')
			.then(db=>{
				const session = new DatabaseSession(db);

				const cat = new Category('MyCat');
				const thing = new Thing('MyThing', cat);
				return session.put(cat, thing).then(()=> {
					assert.equal(session.getFromCache('MyThing'), thing);
					assert.equal(session.get('MyThing'), thing);
					session.clearCacheInternal();
					assert.equal(session.getFromCache('MyThing'), null);
					
					return session.getFromDatabase('MyThing').then(thing1=>{
						assert.equal(thing1.distinctName, thing.distinctName);
						assert.equal(session.getFromCache('MyThing').distinctName, thing.distinctName);
						assert.equal(session.get('MyThing').distinctName, thing.distinctName);
						
						session.clearCacheInternal();
						return session.get('MyThing').then(thing2=>{
							assert.equal(thing2.distinctName, thing.distinctName);
							assert.equal(session.getFromCache('MyThing').distinctName, thing.distinctName);
						});
					});
				});
			});
		});
	});
	
});