export const workspace = {
	getConfiguration: () => ({
		get: (_key: string, defaultValue?: unknown) => defaultValue,
		has: () => false,
	}),
	workspaceFolders: [],
};

export const window = {
	activeTextEditor: undefined,
	showInformationMessage: async () => {},
	showErrorMessage: async () => {},
	showWarningMessage: async () => {},
};

export const commands = {
	executeCommand: async () => {},
	registerCommand: () => ({ dispose: () => {} }),
};

export const Uri = {
	file: (path: string) => ({ fsPath: path, path, scheme: "file" }),
	parse: (uri: string) => ({ fsPath: uri, path: uri, scheme: "file" }),
};

export class Disposable {
	dispose() {}
}

export class EventEmitter {
	event = () => ({ dispose: () => {} });
	fire() {}
	dispose() {}
}

export default {
	workspace,
	window,
	commands,
	Uri,
	Disposable,
	EventEmitter,
};
