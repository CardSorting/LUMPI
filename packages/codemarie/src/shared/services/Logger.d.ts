/**
 * [LAYER: INFRASTRUCTURE]
 */
/**
 * Simple Logger utility for the extension's backend code.
 */
export declare class Logger {
    #private;
    private constructor();
    private static isVerbose;
    static setVerbose(verbose: boolean): void;
    private static subscribers;
    private static output;
    /**
     * Register a callback to receive log output messages.
     */
    static subscribe(outputFn: (msg: string) => void): void;
    static error(message: string, ...args: unknown[]): void;
    static warn(message: string, ...args: unknown[]): void;
    static log(message: string, ...args: unknown[]): void;
    static debug(message: string, ...args: unknown[]): void;
    static info(message: string, ...args: unknown[]): void;
    static trace(message: string, ...args: unknown[]): void;
}
//# sourceMappingURL=Logger.d.ts.map