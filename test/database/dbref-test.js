'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const Context = require('../../build/jel/Context.js').default;
const assert = require('assert');
		
describe('DbRef', function() {
	describe('getSession()', function() {
		it('gets the session from a context', function() {
			const fakeSession = 'fakeSession';
			const ctx = new Context(undefined, fakeSession);
			assert.strictEqual(DbRef.getSession(fakeSession), fakeSession);
			assert.strictEqual(DbRef.getSession(ctx), fakeSession);
		});
	});
	
	describe('get()', function() {
		it('takes DbEntries directly', function() {
			const dbe = new DbEntry('Test');
			const r = new DbRef(dbe);
			assert.strictEqual(r.get('fakeSession'), dbe);
		});
		
		it('adds a parameter proxy', function() {
			const dbe = new DbEntry('Test');
			const m = new Map([['a', 1], ['b', 2]]);
			const r = new DbRef(dbe, m);
			const ctx = new Context();
			let success = false;
		
			const proxy = r.get('fakeSession');
			assert.ok(proxy !== dbe);
			dbe.member = function(ctx, name, params) { success =  name  == 'test' && params.get('a') == 1 && params.get('b') == 2; return 9};
			assert.equal(proxy.member(ctx, 'test'), 9);
			assert.ok(success);
			
			success = false;
			dbe.member = function(ctx, name, params) { success =  name  == 'test2' && params.get('a') == 5 && params.get('b') == 2 && params.get('c') == 6; return 10};
			assert.equal(proxy.member(ctx, 'test2', new Map([['a', 5], ['c', 6]])), 10);
			assert.ok(success);

			success = false;
			const r0 = new DbRef(dbe);
			dbe.member = function(ctx, name, params) { success =  name  == 'test2' && params.get('a') == 5 && params.get('c') == 6; return 11};
			assert.equal(r0.get('fakeSession').member(ctx, 'test2', new Map([['a', 5], ['c', 6]])), 11);
			assert.ok(success);
		});
		
		it('gets a DbEntry from the session cache', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {getFromCache: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			const proxy = r.get(fakeSession);
			assert.strictEqual(proxy.dbEntry, dbe);
		});
		
		it('gets a DbEntry from the database', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {getFromCache: ()=>undefined, getFromDatabase: ()=>Promise.resolve(dbe)};
			const r = new DbRef('Test', new Map([['a', 4]]));
			const proxyPromise = r.get(fakeSession);
			return proxyPromise.then(proxy=>{assert.strictEqual(proxy.dbEntry, dbe);});
		});
		
		it('caches DbEntries', function() {
			let c = 0;
			const dbe = new DbEntry('Test');
			const fakeSession = {getFromCache: function() {c++; return dbe}};
			const r = new DbRef('Test');
			const dbe1 = r.get(fakeSession);
			assert.strictEqual(r.get(fakeSession), dbe);
			assert.strictEqual(r.get(fakeSession), dbe);
			assert.strictEqual(r.get(fakeSession), dbe);
			assert.equal(c, 1);
		});
	});

	describe('getAsync()', function() {
		it('wraps cached entries in a Promise', function() {
			const dbe = new DbEntry('Test');
			const fakeSession = {getFromCache: ()=>dbe};
			const r = new DbRef('Test', new Map([['a', 4]]));
			const proxyPromise = r.getAsync(fakeSession);
			return proxyPromise.then(proxy=>{assert.strictEqual(proxy.dbEntry, dbe);});
			
		});
	});

});	
