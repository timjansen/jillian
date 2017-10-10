const DEFAULT_WORKER_NUM = 10;

class Job {
	preparedTasks: Set<any>;
	taskCount: number;
	resultList: any[] = [];
	promise: Promise<any>;
	resolve: (x: any)=>any;
	reject: (x: any)=>any;
	
	// worker is a function(task) {} and returns a promise that's fulfilled when task is done.
	constructor(tasks: any[], public worker: (task: any)=>any) {
		this.preparedTasks = new Set(tasks);
		this.taskCount = this.preparedTasks.size;
		this.promise = new Promise((resolve, reject)=>{this.resolve = resolve; this.reject = reject;});
	}
}

export default class WorkerPool {
	currentWorkerNum = 0;
	jobs: Job[] = [];

	constructor(public maxSimultanousWorkers = DEFAULT_WORKER_NUM) {
	}
	
	addJob(tasks: any[], worker: (task: any)=>Promise<any>) {
		const j = new Job(tasks, worker);
		this.jobs.push(j);
		this.runTasks();
		return j.promise;
	}
		
	// internal
	private runTasks(): void {
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
					.then((result: any)=>{
						job.resultList.push(result); 
						if (job.resultList.length >= job.taskCount) {
							job.resolve(job.resultList);
						}

						this.currentWorkerNum--; 
						this.runTasks();
					}, (e: any)=>{
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
	private cleanJobs(): void {
		this.jobs = this.jobs.filter(j=>!!j.preparedTasks.size);
	}
	

}


