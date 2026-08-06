import { ScratchpadService } from "../../broccolidb/core/agent-context/ScratchpadService.js"
import { createTestHarness } from "./harness.js"

async function testConcurrency() {
	console.log("--- TEST: Scratchpad Concurrency (Locking) ---")

	const harness = await createTestHarness({ testName: "concurrency" })
	await harness.start()

	try {
		const mockCtx: any = {
			workspace: { workspacePath: harness.workspacePath },
			storage: harness.storage,
		}

		const scratch = new ScratchpadService(mockCtx)
		await scratch.clear()

		const filename = "shared_resource.txt"
		const iterations = 20

		console.log(`[Test] Launching ${iterations} parallel writes to ${filename}...`)

		const promises = Array.from({ length: iterations }, (_, i) => {
			return scratch.write(filename, `content from worker ${i}`)
		})

		await Promise.all(promises)

		const finalContent = await scratch.read(filename)
		console.log(`[Test] Final content: ${finalContent}`)

		if (finalContent?.startsWith("content from worker")) {
			console.log("✅ SUCCESS: All parallel writes completed without crash or corruption.")
		} else {
			console.error("❌ FAILURE: Content corrupted or missing.")
		}
	} finally {
		await harness.cleanup()
	}

	console.log("--- CONCURRENCY TESTS COMPLETE ---")
}

testConcurrency().catch(console.error)
