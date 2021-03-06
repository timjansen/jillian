'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const Context = require('../../build/jel/Context.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const assert = require('assert');
		
describe('DbRef', function() {
	
	describe('get()', function() {
		it('takes DbEntries directly', function() {
			const dbe = DbEntry.valueOf('Test');
			const r = new DbRef(dbe);
			assert.strictEqual(r.get('fakeSession'), dbe);
		});
		
		it('gets a DbEntry without Promise', function() {
			const dbe = DbEntry.valueOf('Test');
			const fakeSession = {get: ()=>dbe};
			const fakeCtx = new Context(undefined, fakeSession);
			const r = new DbRef('Test', new Dictionary(new Map([['a', 4]])));
			const obj = r.get(fakeCtx);
			assert.strictEqual(obj.distinctName, 'Test');
		});
		
		it('gets a DbEntry with Promise', function() {
			const dbe = DbEntry.valueOf('Test');
			const fakeSession = {get: ()=>Promise.resolve(dbe)};
			const fakeCtx = new Context(undefined, fakeSession);
			const r = new DbRef('Test', new Dictionary(new Map([['a', 4]])));
			const objPromise = r.get(fakeCtx);
			return objPromise.then(obj=>{assert.strictEqual(obj.distinctName, 'Test');});
		});
		
		it('caches DbEntries', function() {
			let c = 0;
			const dbe = DbEntry.valueOf('Test');
			const fakeSession = {get: function() {c++; return dbe}};
			const fakeCtx = new Context(undefined, fakeSession);
			const r = new DbRef('Test');
			const dbe1 = r.get(fakeCtx);
			assert.strictEqual(r.get(fakeCtx), dbe);
			assert.strictEqual(r.get(fakeCtx), dbe);
			assert.strictEqual(r.get(fakeCtx), dbe);
			assert.equal(c, 1);
		});
	});

	describe('with()', function() {
		it('takes DbEntries directly', function() {
			const dbe = DbEntry.valueOf('Test');
			const r = new DbRef(dbe);
			assert.equal(r.with('fakeSession', r=>assert.strictEqual(r, dbe) || 1), 1);
		});
		
		it('gets a DbEntry from the session cache', function() {
			const dbe = DbEntry.valueOf('Test');
			const fakeSession = {get: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			assert.equal(r.with(new Context(undefined, fakeSession), obj=>assert.strictEqual(obj.distinctName, 'Test') || 1), 1);
		});
	});

	
	describe('getAsync()', function() {
		it('wraps cached entries in a Promise', function() {
			const dbe = DbEntry.valueOf('Test');
			const fakeSession = {get: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			const objPromise = r.getAsync(new Context(undefined, fakeSession));
			return objPromise.then(obj=>{assert.strictEqual(obj.distinctName, 'Test');});
			
		});
	});

});	
