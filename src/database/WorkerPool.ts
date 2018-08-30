const DEFAULT_WORKER_NUM = 10;

class Job {
	preparedTasks: Set<any>;
	taskCount: number;
	resultList: any[] = [];
	promise: Promise<any>;
	resolve: (x: any)=>any;
	reject: (x: any)=>any;
	finishedTasks = 0;
	
	// worker is a function(task) {} and returns a promise that's fulfilled when task is done.
	constructor(tasks: any[], public worker: (task: any)=>any, public ignoreNull = false) {
		this.preparedTasks = new Set(tasks);
		this.taskCount = this.preparedTasks.size;
		this.promise = new Promise((resolve, reject)=>{this.resolve = resolve; this.reject = reject;});
	}
}

/**
 * Creates a 'PromisePool', analog to a ThreadPool, that prevents too many Promises from running simultanously.
 */
export default class WorkerPool {
	currentWorkerNum = 0;
	jobs: Job[] = [];

	constructor(public maxSimultanousWorkers = DEFAULT_WORKER_NUM) {
	}
	
	private runJobInternal<I,R>(tasks: I[], worker: (task: I)=>Promise<R>, ignoreNull: boolean): Promise<R[]> {
		if (!tasks.length)
			return Promise.resolve([]);
		
		const j = new Job(tasks, worker, ignoreNull);
		this.jobs.push(j);
		this.runTasks();
		return j.promise;
	}
	
	/**
	 * Creates a job to run in the pool. It will call the worker with every task from the given array.
	 * The worker returns a Promise for each task. When all worker promises have been fulfilled,
	 * the promise of runJob() is also fulfilled and returns an array with the results of all worker
	 * promises.
	 * If any of the worker promises was rejected, the runJob() promise is also rejected with the 
	 * worker's error object. Please note that more than one worker fails, you will still only get the
	 * failure of the first worker. Further workers won't be started, but there is no way to end the
	 * workers that are still running.
	 * @param tasks the array of tasks to give to the workers
	 * @param worker the worker that gets a task and returns a Promise for the work results
	 * @return a Promise with the result. If all workers Promises are fulfilled, this Promise is also fulfilled
	 *         with an array of the worker Promise results as value. Its length is the same
	 *         as the task array's. If any of the workers Promises is rejected, this
	 *         Promise is rejected immediately.
	 */
	runJob<I,R>(tasks: I[], worker: (task: I)=>Promise<R>): Promise<R[]> {
		return this.runJobInternal(tasks, worker, false);
	}

	/**
	 * Creates a job to run in the pool, but ignore null and undefined values returned by the worker promises. 
	 * It will call the worker with every task from the given array.
	 * The worker returns a Promise for each task. When all worker promises have been fulfilled,
	 * the promise of runJob() is also fulfilled and returns an array with the results of all worker
	 * promises, excluding those that returned null or undefined.
	 * If any of the worker promises was rejected, the runJob() promise is also rejected with the 
	 * worker's error object. Please note that more than one worker fails, you will still only get the
	 * failure of the first worker. Further workers won't be started, but there is no way to end the
	 * workers that are still running.
	 * @param tasks the array of tasks to give to the workers
	 * @param worker the worker that gets a task and returns a Promise for the work results
	 * @return a Promise with the result. If all workers Promises are fulfilled, this Promise is also fulfilled
	 *         with an array of the non-null, non-undefined worker Promise results as value. 
	 *         If any of the workers Promises is rejected, this Promise is rejected immediately.
	 */
	runJobIgnoreNull<I,R>(tasks: I[], worker: (task: I)=>Promise<R>): Promise<NonNullable<R>[]> {
		return this.runJobInternal(tasks, worker, true) as Promise<NonNullable<R>[]>;
	}

	
	// internal
	private runTasks(): void {
		this.cleanJobs();
		
		for (let i = 0; i < this.jobs.length; i++) {
			const job = this.jobs[i];
			const tasks = job.preparedTasks.values();

			while (job.preparedTasks.size > 0 && this.currentWorkerNum < this.maxSimultanousWorkers) {
				const task = tasks.next().value;
				job.preparedTasks.delete(task);
				const workerResult = job.worker(task);
				if (workerResult instanceof Promise) {
					this.currentWorkerNum++;
					workerResult.then((result: any)=>{
						job.finishedTasks++;
						if (result != null || !job.ignoreNull)
							job.resultList.push(result); 
						if (job.finishedTasks >= job.taskCount)
							job.resolve(job.resultList);

						this.currentWorkerNum--; 
						this.runTasks();
					}, (e: any)=>{
						job.preparedTasks.clear(); 
						job.reject(e);

						this.currentWorkerNum--; 
						this.runTasks();
					});
				}
				else {
					job.finishedTasks++;
					if (workerResult != null || !job.ignoreNull)
						job.resultList.push(workerResult); 
					if (job.finishedTasks >= job.taskCount)
						job.resolve(job.resultList);
				}
					
			}
			if (this.currentWorkerNum >= this.maxSimultanousWorkers)
				break;
		}
	}

	private cleanJobs(): void {
		this.jobs = this.jobs.filter(j=>!!j.preparedTasks.size);
	}
	
	static run<I,R>(tasks: I[], worker: (task: I)=>Promise<R>, maxSimultanousWorkers = DEFAULT_WORKER_NUM): Promise<R[]> {
		return new WorkerPool(maxSimultanousWorkers).runJob(tasks, worker);
	}
	
}


