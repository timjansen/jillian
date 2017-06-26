'use strict';

const Database = require('../../src/database/database.js');
const DatabaseConfig = require('../../src/database/databaseconfig.js');
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
			});
		});
		
		it('deletes DB entries', function() {
			
		});

		it('maintains a thing index', function() {
			
		});

		it('maintains a category index', function() {
			
		});

	});
	
});