declare module "*.md" {
	const content: string;
	export default content;
}

declare module "*.sh" {
	const content: string;
	export default content;
}

declare module "bun:test" {
	export const describe: any;
	export const expect: any;
	export const it: any;
	export const beforeAll: any;
	export const beforeEach: any;
	export const afterAll: any;
	export const afterEach: any;
}
