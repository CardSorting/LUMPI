declare module "*.md" {
	const content: string;
	export default content;
}

declare module "*.sh" {
	const content: string;
	export default content;
}

declare module "bun:ffi" {
	export const dlopen: any;
	export const FFIType: any;
	export const ptr: any;
	export const CString: any;
}
