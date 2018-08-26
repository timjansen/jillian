'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const Context = require('../../build/jel/Context.js').default;
const tmp = require('tmp');
const assert = require('assert');

const baseCtx = new Context().setAll({DbRef, Category, Thing});

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	console.log(`databasesession-test.js: Using tmp dir ${path}`);

	describe('database session', function() {
		it('puts and gets', function() {
			return Database.create(path+'/dbsession1')
			.then(db=>{
				const session = new DbSession(db);

				const cat = new Category('MyCategory');
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
		
		
		it('reads a complete index from cache', function() {
			return Database.create(path+'/dbsession2')
			.then(db=>{
				const session = new DbSession(db);
				
				const cat = new Category('MyCategory');
				const thing = new Thing('MyThing', cat);
				const thing2 = new Thing('MyThing2', cat);
				return session.put(cat, thing, thing2)
					.then(()=>session.getByIndex(cat, 'catEntries'))
					.then(hits=>{
						assert.deepEqual(hits.map(h=>h.distinctName).sort(), ['MyThing', 'MyThing2']);
					});
			});
		});

		it('reads a complete index uncached', function() {
			return Database.create(path+'/dbsession3')
			.then(db=>{
				const session = new DbSession(db);
				
				const cat = new Category('MyCategory');
				const thing = new Thing('MyThing', cat);
				const thing2 = new Thing('MyThing2', cat);
				const thing3 = new Thing('MyThing3', cat);
				return session.put(cat, thing, thing2, thing3)
					.then(()=>session.clearCacheInternal().get('MyThing2')) // load one instance into the cache
					.then(()=>session.getByIndex(cat, 'catEntries'))
					.then(hits=>{
						assert.deepEqual(hits.map(d=>d.distinctName).sort(), ['MyThing', 'MyThing2', 'MyThing3']);
					});
			});
		});

	});
	
});