'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const Context = require('../../build/jel/Context.js').default;
const assert = require('assert');
		
describe('DbRef', function() {
	
	describe('get()', function() {
		it('takes DbEntries directly', function() {
			const dbe = new DbEntry('Test');
			const r = new DbRef(dbe);
			assert.strictEqual(r.get('fakeSession'), dbe);
		});
		
		it('gets a DbEntry without Promise', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {get: ()=>dbe};
			const fakeCtx = new Context(undefined, fakeSession);
			const r = new DbRef('Test', new Map([['a', 4]]));
			const obj = r.get(fakeCtx);
			assert.strictEqual(obj.distinctName, 'Test');
		});
		
		it('gets a DbEntry with Promise', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {get: ()=>Promise.resolve(dbe)};
			const fakeCtx = new Context(undefined, fakeSession);
			const r = new DbRef('Test', new Map([['a', 4]]));
			const objPromise = r.get(fakeCtx);
			return objPromise.then(obj=>{assert.strictEqual(obj.distinctName, 'Test');});
		});
		
		it('caches DbEntries', function() {
			let c = 0;
			const dbe = new DbEntry('Test');
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

	describe('member()', function() {
		it('passes parameters', function() {
			const dbe = new DbEntry('Test');
			const m = new Map([['a', 1], ['b', 2]]);
			const r = new DbRef(dbe, m);
			const ctx = new Context();
			let success = false;
			
			dbe.member = function(ctx, name, params) { success =  name  == 'test' && params.get('a') == 1 && params.get('b') == 2; return 9};
			assert.equal(r.member(ctx, 'test'), 9);
			assert.ok(success);
			
			success = false;
			dbe.member = function(ctx, name, params) { success =  name  == 'test2' && params.get('a') == 5 && params.get('b') == 2 && params.get('c') == 6; return 10};
			assert.equal(r.member(ctx, 'test2', new Map([['a', 5], ['c', 6]])), 10);
			assert.ok(success);

			success = false;
			const r0 = new DbRef(dbe);
			dbe.member = function(ctx, name, params) { success =  name  == 'test2' && params.get('a') == 5 && params.get('c') == 6; return 11};
			assert.equal(r0.member(ctx, 'test2', new Map([['a', 5], ['c', 6]])), 11);
			assert.ok(success);
		});
	});

	
	describe('with()', function() {
		it('takes DbEntries directly', function() {
			const dbe = new DbEntry('Test');
			const r = new DbRef(dbe);
			assert.equal(r.with('fakeSession', r=>assert.strictEqual(r, dbe) || 1), 1);
		});
		
		it('gets a DbEntry from the session cache', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {get: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			assert.equal(r.with(new Context(undefined, fakeSession), obj=>assert.strictEqual(obj.distinctName, 'Test') || 1), 1);
		});
	});

	
	describe('getAsync()', function() {
		it('wraps cached entries in a Promise', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {get: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			const objPromise = r.getAsync(new Context(undefined, fakeSession));
			return objPromise.then(obj=>{assert.strictEqual(obj.distinctName, 'Test');});
			
		});
	});

});	
