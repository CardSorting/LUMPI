/**
 * Safe wrapper for bun:ffi that degrades gracefully in non-Bun environments (e.g. Node.js).
 */
let bunDlopen: any;
let bunFFIType: any;
let bunPtr: any;

if (typeof Bun !== "undefined") {
	try {
		const ffi = await import("bun:ffi");
		bunDlopen = ffi.dlopen;
		bunFFIType = ffi.FFIType;
		bunPtr = ffi.ptr;
	} catch {
		// Ignore
	}
}

export const dlopen = bunDlopen;
export const FFIType = bunFFIType;
export const ptr = bunPtr;
