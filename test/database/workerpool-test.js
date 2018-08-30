'use strict';

require('source-map-support').install();
const WorkerPool = require('../../build/database/WorkerPool.js').default;
const assert = require('assert');

const task100 = [];
for (let i = 0; i < 100; i++)
	task100.push(i);

const task20 = [];
for (let i = 0; i < 20; i++)
	task20.push(i);

describe('WorkerPool', function() {
	it('works with single task list', function() {
		const wp = new WorkerPool(5);
		return wp.runJob(task100, a=>Promise.resolve(a))
			.then(results=>{
				assert.equal(results.length, 100);
				assert.equal(results[77], 77);
			});
	});

	it('works with multiple task list', function() {
		const l = [];
		const wp = new WorkerPool(7);
		for (let i = 0; i < 100; i+=20) {
			const start = i;
			l.push(wp.runJob(task100.slice(start, start+20), a=>Promise.resolve(a))
				.then(results=>{
					assert.equal(results.length, 20);
					assert.equal(results[0], start);
					assert.equal(results[10], start+10);
				}));
		}
		return Promise.all(l);
	});

	it('works with slow tasks', function() {
		const l = [];
		const wp = new WorkerPool(7);
		for (let i = 0; i < 40; i+=20) {
			const start = i;
			l.push(wp.runJob(task100.slice(start, start+20), a=>new Promise(resolve=>setTimeout(()=>resolve(a), 70-start)))
				.then(results=>{
					assert.equal(results.length, 20);
					assert.equal(results[0], start);
					assert.equal(results[10], start+10);
				}));
		}
		return Promise.all(l);
	});

	it('can ignore nulls', function() {
		const wp = new WorkerPool(5);
		return wp.runJobIgnoreNull(task100, a=>a%2 ? Promise.resolve(a) : a%4 ? Promise.resolve(null) : Promise.resolve())
			.then(results=>{
				assert.equal(results.length, 50);
				assert.equal(results[38], 77);
			});
	});

	it('works with non-Promise jobs', function() {
		const l = [];
		const wp = new WorkerPool(7);
		for (let i = 0; i < 40; i+=20) {
			const start = i;
			l.push(wp.runJob(task100.slice(start, start+20), a=>70-start)
				.then(results=>{
					assert.equal(results.length, 20);
					assert.equal(results[0], 70-start);
					assert.equal(results[10], 70-start);
				}));
		}
		return Promise.all(l);
	});
	
	
});