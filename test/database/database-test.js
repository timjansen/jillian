'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DatabaseConfig = require('../../build/database/DatabaseConfig.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const tmp = require('tmp');
const fs = require('fs');
const assert = require('assert');

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	console.log(`database-test.js: Using tmp dir ${path}`);

	describe('database', function() {
		it('creates a database', function() {
			return Database.create(path+'/db1', new DatabaseConfig({sizing: 99}))
			.then(db=>{
				assert(fs.existsSync(path+'/db1'));
				assert(fs.existsSync(path+'/db1/dbconfig.jel'));
				assert(fs.existsSync(path+'/db1/data'));
				return db.init(config=>assert.equal(db.config.sizing, 99));
			});
		});

		it('re-opens a database', function() {
			return Database.create(path+'/db2', new DatabaseConfig({sizing: 999}))
			.then(()=>{
				const db = new Database(path+'/db2');
				return db.init(config=>{
					assert.equal(config, db.config);
					assert.equal(config.sizing, 999);
				});
			});
		});

		it('does not find DB entries that do not exist', function() {
			return Database.create(path+'/db3')
			.then(db=>Promise.all([db.get('doesNotExist)'), db.getByHash('0000000000000000')]))
			.then(results=>assert.deepEqual(results, [null, null]));
		});

		
		it('loads and stores DB entries', function() {
			return Database.create(path+'/db4')
			.then(db=>{
				const e = new DbEntry('MyFirstEntry');
				assert.equal(e.hashCode.length, 16);
				return db.put(e).then(()=>db.get('MyFirstEntry').then(e1=>{
					assert.equal(e1.constructor.name, 'DbEntry');
					assert.equal(e1.distinctName, 'MyFirstEntry');
					return db.getByHash(e.hashCode).then(e2=>{
						assert.equal(e2.distinctName, 'MyFirstEntry');
						const db2 = new Database(path+'/db4');
						return db2.get('MyFirstEntry').then(e1=>assert.equal(e1.distinctName, 'MyFirstEntry'));
					});
				}));
			})
			.then(()=>{
				const db = new Database(path+'/db4');
				const a = new DbEntry('MyOtherEntry');
				return db.put(a)
					.then(()=>db.get('MyOtherEntry').then(a1=>assert.equal(a1.distinctName, 'MyOtherEntry')))
					.then(()=>db.get('MyFirstEntry').then(e1=>assert.equal(e1.distinctName, 'MyFirstEntry')));
			});
		});
		
		it('overwrites DB entries', function() {
			return Database.create(path+'/db5')
						.then(db=>{
								const e = new DbEntry('MyEntry');
								return db.put(e)
									.then(()=>db.get('MyEntry')
												.then(e2=>{e2.distinctName='x';return db.put(e2)})
												.then(()=>db.getByHash(e.hashCode))
												.then(e3=>assert.equal(e3.distinctName, 'x'))
											 );
			});
		});

		it('deletes DB entries', function() {
			return Database.create(path+'/db6')
						.then(db=>{
								const e = new DbEntry('MyEntry');
								return db.put(e)
									.then(()=>db.delete(e))
									.then(()=>db.get('MyEntry'))
									.then(e2=>assert.strictEqual(e2, null));
			});
		});

		it('maintains a category index', function() {
			return Database.create(path+'/db7')
						.then(db=>{
								const superC = new Category('SuperCategory');
								const c1 = new Category('C1Category', superC);
								const c2 = new Category('C2Category', superC);
								const c3 = new Category('C3Category', superC);
								const subC1 = new Category('SubC1Category', c1);

								return db.put(superC, c1, c2, c3, subC1)
									.then(()=>db.readCategoryIndex(c1, 'subCategories')
									.then(list=>assert.deepEqual(list, [subC1.hashCode]))
									.then(()=>db.readCategoryIndex(superC, 'subCategories'))
									.then(list=>assert.deepEqual(list.sort(), [c1.hashCode, c2.hashCode, c3.hashCode, subC1.hashCode].sort()))
								);
			});
		});

		
	});
	
});