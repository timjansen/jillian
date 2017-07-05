'use strict';

const DEFAULT_WORKER_NUM = 10;

class Job {
	// worker is a function(task) {} and returns a promise that's fulfilled when task is done.
	constructor(tasks, worker) {
		this.worker = worker;
		this.preparedTasks = new Set(tasks);
		this.taskCount = this.preparedTasks.size;
		this.resultList = [];
		this.promise = new Promise((resolve, reject)=>{this.resolve = resolve; this.reject = reject;});
	}
}

class WorkerPool {
	constructor(maxSimultanousWorkers = DEFAULT_WORKER_NUM) {
		this.maxSimultanousWorkers = maxSimultanousWorkers;
		this.currentWorkerNum = 0;
		this.jobs = [];
	}
	
	addJob(tasks, worker) {
		const j = new Job(tasks, worker);
		this.jobs.push(j);
		this.runTasks();
		return j.promise;
	}
		
	// internal
	runTasks() {
		this.cleanJobs();
		
		for (let i = 0; i < this.jobs.length; i++) {
			const job = this.jobs[i];
			const tasksToStart = Math.min(this.maxSimultanousWorkers - this.currentWorkerNum, job.preparedTasks.size);
			const tasks = job.preparedTasks.values();

			for (let j = 0; j < tasksToStart; j++) {
				const task = tasks.next().value;
				job.preparedTasks.delete(task);
				this.currentWorkerNum++;
				job.worker(task)
					.then(result=>{
						job.resultList.push(result); 
						if (job.resultList.length >= job.taskCount) {
							job.resolve(job.resultList);
						}

						this.currentWorkerNum--; 
						this.runTasks();
					}, e=>{
						job.preparedTasks.clear(); 
						job.reject(e);

						this.currentWorkerNum--; 
						this.runTasks();
					});
			}
			if (this.maxSimultanousWorkers <= this.currentWorkerNum)
				break;
		}
	}

	// internal
	cleanJobs() {
		this.jobs = this.jobs.filter(j=>!!j.preparedTasks.size);
	}
	

}

module.exports = WorkerPool;


