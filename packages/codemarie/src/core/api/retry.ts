import { Logger } from "@/shared/services/Logger";

interface RetryOptions {
	maxRetries?: number;
	baseDelay?: number;
	maxDelay?: number;
	retryAllErrors?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	baseDelay: 1_000,
	maxDelay: 10_000,
	retryAllErrors: false,
};

export class RetriableError extends Error {
	status = 429;
	retryAfter?: number;

	constructor(message: string, retryAfter?: number, options?: ErrorOptions) {
		super(message, options);
		this.name = "RetriableError";

		this.retryAfter = retryAfter;
	}
}

export function withRetry(options: RetryOptions = {}) {
	const { maxRetries, baseDelay, maxDelay, retryAllErrors } = { ...DEFAULT_OPTIONS, ...options };

	return (target: any, _propertyKeyOrContext: any, descriptor?: PropertyDescriptor) => {
		const originalMethod = descriptor ? descriptor.value : target;

		const wrappedMethod = async function* (this: any, ...args: any[]) {
			for (let attempt = 0; attempt < maxRetries; attempt++) {
				try {
					yield* originalMethod.apply(this, args);
					return;
				} catch (error: any) {
					const isRateLimit = error?.status === 429 || error instanceof RetriableError;
					const isLastAttempt = attempt === maxRetries - 1;

					if ((!isRateLimit && !retryAllErrors) || isLastAttempt) {
						throw error;
					}

					// Get retry delay from header or calculate exponential backoff
					// Check various rate limit headers
					const retryAfter =
						error.headers?.["retry-after"] ||
						error.headers?.["x-ratelimit-reset"] ||
						error.headers?.["ratelimit-reset"] ||
						error.retryAfter;

					let delay: number;
					if (retryAfter) {
						// Handle both delta-seconds and Unix timestamp formats
						const retryValue = Number.parseInt(retryAfter, 10);
						if (retryValue > Date.now() / 1000) {
							// Unix timestamp
							delay = retryValue * 1000 - Date.now();
						} else {
							// Delta seconds
							delay = retryValue * 1000;
						}
					} else {
						// Exponential backoff with jitter
						delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
						// Add 0-20% jitter
						delay += Math.random() * 0.2 * delay;
					}

					const handlerInstance = this as any;
					if (handlerInstance.options?.onRetryAttempt) {
						try {
							await handlerInstance.options.onRetryAttempt(attempt + 1, maxRetries, delay, error);
						} catch (e) {
							Logger.error("Error in onRetryAttempt callback:", e);
						}
					}

					await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
				}
			}
		};
		if (descriptor) {
			descriptor.value = wrappedMethod;
			return descriptor;
		}
		return wrappedMethod;
	};
}

export async function asyncRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
	onRetry?: (attempt: number, error: any, delay: number) => Promise<void> | void,
): Promise<T> {
	const { maxRetries, baseDelay, maxDelay, retryAllErrors } = { ...DEFAULT_OPTIONS, ...options };

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error: any) {
			const isRateLimit = error?.status === 429 || error instanceof RetriableError;
			const isLastAttempt = attempt === maxRetries - 1;

			if ((!isRateLimit && !retryAllErrors) || isLastAttempt) {
				throw error;
			}

			const retryAfter =
				error.headers?.["retry-after"] ||
				error.headers?.["x-ratelimit-reset"] ||
				error.headers?.["ratelimit-reset"] ||
				error.retryAfter;

			let delay: number;
			if (retryAfter) {
				const retryValue = Number.parseInt(retryAfter, 10);
				if (retryValue > Date.now() / 1000) {
					delay = retryValue * 1000 - Date.now();
				} else {
					delay = retryValue * 1000;
				}
			} else {
				delay = Math.min(maxDelay, baseDelay * 2 ** attempt);
			}

			if (onRetry) {
				await onRetry(attempt + 1, error, delay);
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error("Retry failed"); // Should not reach here due to throw error in loop
}
