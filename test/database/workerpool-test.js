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
		return wp.addJob(task100, a=>Promise.resolve(a))
			.then(results=>{
				assert.equal(results.length, 100);
				assert.equal(results[77], 77);
			});
	});

	it('works with multiple task list', function() {
		const l = [];
		const wp = new WorkerPool(7);
		for (let i = 0; i < 100; i+=20) 
			l.push(wp.addJob(task100.slice(i, i+20), a=>Promise.resolve(a))
				.then(results=>{
					assert.equal(results.length, 20);
					assert.equal(results[0], i);
					assert.equal(results[10], i+10);
				}));
		return Promise.all(l);
	});

	it('works with slow tasks', function() {
		const l = [];
		const wp = new WorkerPool(7);
		for (let i = 0; i < 40; i+=20) 
			l.push(wp.addJob(task100.slice(i, i+20), a=>new Promise(resolve=>setTimeout(()=>resolve(a), 70-i)))
				.then(results=>{
					assert.equal(results.length, 20);
					assert.equal(results[0], i);
					assert.equal(results[10], i+10);
				}));
		return Promise.all(l);
	});

	
	// use timeouts
		
	// simulate errors
	
	// test with many one-tasks-jobs
});