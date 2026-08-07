import type { TinyTitleProgressEvent } from "./title-protocol.ts";

export interface TinyTitleGenerateOptions {
	signal?: AbortSignal;
	systemPrompt?: string;
}

type TinyTitleProgressListener = (event: TinyTitleProgressEvent) => void;

class TinyTitleClient {
	private readonly listeners = new Set<TinyTitleProgressListener>();

	onProgress(listener: TinyTitleProgressListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	async generate(modelKey: string, _input: string, options?: TinyTitleGenerateOptions): Promise<string | null> {
		if (options?.signal?.aborted) {
			throw options.signal.reason ?? new DOMException("The operation was aborted", "AbortError");
		}
		for (const listener of this.listeners) {
			listener({ modelKey, phase: "error", error: "Local title runtime is unavailable" });
		}
		return null;
	}
}

export const tinyTitleClient = new TinyTitleClient();
