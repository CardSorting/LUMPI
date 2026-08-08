declare module "bun:ffi" {
	export const dlopen: any;
	export const FFIType: any;
	export const ptr: any;
}

declare module "picomatch" {
	interface PicomatchOptions {
		dot?: boolean;
		[key: string]: any;
	}
	type MatcherFunction = (str: string) => boolean;
	function picomatch(pattern: string | string[], options?: PicomatchOptions): MatcherFunction;
	export default picomatch;
}
