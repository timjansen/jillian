'use strict';

const DEFAULT_WORKER_NUM = 10;

class WorkerPool {
		
	// worker is a function(task) {} and returns a promise that's fulfilled when task is done.
	// tasks need to be unique, so they can be stored in a map
	constructor(worker, abortOnError=true, simultanousWorkers = DEFAULT_WORKER_NUM, tasks = []) {
		this.worker = worker;
		this.abortOnError = abortOnError;
		this.simultanousWorkers = simultanousWorkers;
		this.preparedTasks = new Set();
		this.activeTasks = new Map(); // task -> promise
		this.errorList = [];
		this.resultList = [];
		this.queuedTaskCount = 0;

		this.addTasks(tasks);
	}
	
	addTasks(tasks) {
		if (this.abortOnError && this.errorList.length)
			return;
		
		tasks.forEach((t)=>this.preparedTasks.add(t));
		this.queuedTaskCount+=tasks.length;
		this.findNewTasks();
	}
		
	// internal
	findNewTasks() {
		if (this.abortOnError && this.errorList.length)
			return;

		const workersLeft = Math.min(this.preparedTasks.size, this.simultanousWorkers - this.activeTasks.size);
		const it = this.preparedTasks.values();
		for (let i = 0; i < workersLeft; i++) {
			const task = it.next().value;
			this.preparedTasks.delete(task);
			this.activeTasks.put(task, this.worker(task).then(result=>this.completed(task, result), e=>this.abort(e)));
		}
	}
	
	// internal
	completed(task, result) {
		this.activeTasks.delete(task);
		this.resultList.push(result);
		
		if (this.queuedTaskCount == this.resultList.length) {
			if (this.completionHandler)
				this.completionHandler(this.resultList, this.errorList);
		}
		else
			this.findNewTasks();
	}
	
	// internal
	abort(e) {
		this.errorList.push(e);
		if (this.abortOnError) {
			this.preparedTasks.clear();
			this.activeTasks.clear();
			if (this.completionHandler)
				this.completionHandler(this.resultList, this.errorList);
		}
		else 
			this.findNewTasks();
	}
	
	// registers a function(errorList) to call when all scheduled tasks are done
	registerCompletionHandler(handler) {
		this.completionHandler = handler;
	}
	
	
}