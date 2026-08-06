import * as fs from "node:fs"
import * as path from "node:path"
import { StorageService } from "../../broccolidb/infrastructure/storage/StorageService.js"
import { dbPool } from "../../broccolidb/infrastructure/db/BufferedDbPool.js"
import { setDbPath } from "../../broccolidb/infrastructure/db/Config.js"

export interface TestHarnessOptions {
	testName?: string
	workspacePath?: string
	useDbPool?: boolean
}

export interface TestHarness {
	dbPath: string
	workspacePath: string
	storage: StorageService
	dbPool: typeof dbPool
	start: () => Promise<void>
	stop: () => Promise<void>
	cleanup: () => Promise<void>
}

/**
 * Standardized test harness for Codemarie & BroccoliDB engine integration tests.
 * Manages isolated temporary SQLite databases, StorageService instances, and safe lifecycle teardown.
 */
export async function createTestHarness(options: TestHarnessOptions = {}): Promise<TestHarness> {
	const suffix = options.testName ? `-${options.testName}` : ""
	const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
	const dbPath = path.join("/tmp", `test-codemarie${suffix}-${timestamp}.sqlite`)
	const workspacePath = options.workspacePath || path.join("/tmp", `workspace-codemarie${suffix}-${timestamp}`)

	if (!fs.existsSync(workspacePath)) {
		fs.mkdirSync(workspacePath, { recursive: true })
	}

	if (options.useDbPool) {
		setDbPath(dbPath)
	}

	const mockCtx: any = {
		workspace: { workspacePath },
	}

	const storage = new StorageService(mockCtx)

	const start = async () => {
		await storage.start()
		if (options.useDbPool) {
			try {
				await dbPool.start()
			} catch (e: any) {
				console.warn(`[TestHarness] dbPool.start() skipped or failed: ${e.message}`)
			}
		}
	}

	const stop = async () => {
		if (options.useDbPool) {
			try {
				await dbPool.stop()
			} catch {}
		}
		try {
			await storage.stop()
		} catch {}
	}

	const cleanup = async () => {
		await stop()
		if (fs.existsSync(dbPath)) {
			try {
				fs.unlinkSync(dbPath)
			} catch {}
		}
		if (fs.existsSync(workspacePath)) {
			try {
				fs.rmSync(workspacePath, { recursive: true, force: true })
			} catch {}
		}
	}

	return {
		dbPath,
		workspacePath,
		storage,
		dbPool,
		start,
		stop,
		cleanup,
	}
}
