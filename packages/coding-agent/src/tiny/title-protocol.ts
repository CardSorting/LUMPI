export interface TinyTitleProgressEvent {
	modelKey: string;
	phase: "loading" | "downloading" | "ready" | "error";
	loaded?: number;
	total?: number;
	error?: string;
}
