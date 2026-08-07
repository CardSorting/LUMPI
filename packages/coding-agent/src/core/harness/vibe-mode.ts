export interface VibeSessionConfig {
	directorRole: string;
	workerModel: string;
	readOnlyToolsOnly: boolean;
}

export interface WorkerTaskState {
	taskId: string;
	status: "queued" | "running" | "completed" | "failed";
	assignedWorker: string;
	resultSummary?: string;
}

export class VibeModeManager {
	private active: boolean;
	private config: VibeSessionConfig;
	private workerTasks: Map<string, WorkerTaskState>;

	constructor(config?: Partial<VibeSessionConfig>) {
		this.active = false;
		this.config = {
			directorRole: "director",
			workerModel: "fast",
			readOnlyToolsOnly: true,
			...config,
		};
		this.workerTasks = new Map<string, WorkerTaskState>();
	}

	public isVibeModeActive(): boolean {
		return this.active;
	}

	public enableVibeMode(): void {
		this.active = true;
	}

	public disableVibeMode(): void {
		this.active = false;
	}

	public dispatchWorkerTask(taskId: string, assignment: string): WorkerTaskState {
		const taskState: WorkerTaskState = {
			taskId,
			status: "running",
			assignedWorker: `worker-${Math.random().toString(36).slice(2, 7)}`,
		};
		this.workerTasks.set(taskId, taskState);
		return taskState;
	}

	public getWorkerTask(taskId: string): WorkerTaskState | undefined {
		return this.workerTasks.get(taskId);
	}
}
