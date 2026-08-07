/**
 * Asynchronously creates all non-existing subdirectories for a given file path
 * and collects them in an array for later deletion.
 *
 * @param filePath - The full path to a file.
 * @returns A promise that resolves to an array of newly created directories.
 */
export declare function createDirectoriesForFile(filePath: string): Promise<string[]>;
/**
 * Helper function to check if a path exists.
 *
 * @param path - The path to check.
 * @returns A promise that resolves to true if the path exists, false otherwise.
 */
export declare function fileExistsAtPath(filePath: string): Promise<boolean>;
/**
 * Checks if the path is a directory
 * @param filePath - The path to check.
 * @returns A promise that resolves to true if the path is a directory, false otherwise.
 */
export declare function isDirectory(filePath: string): Promise<boolean>;
/**
 * Gets the size of a file in kilobytes
 * @param filePath - Path to the file to check
 * @returns Promise<number> - Size of the file in KB, or 0 if file doesn't exist
 */
export declare function getFileSizeInKB(filePath: string): Promise<number>;
/**
 * Writes content to a file
 * @param filePath - Absolute path to the file
 * @param content - Content to write (string or Uint8Array)
 * @param encoding - Text encoding (default: 'utf8')
 * @returns A promise that resolves when the file is written
 */
export declare function writeFile(filePath: string, content: string | Uint8Array, encoding?: BufferEncoding): Promise<void>;
/**
 * Robustly writes content to a file atomically by writing to a temporary file
 * and then renaming it. This prevents data corruption if the process is killed
 * or power is lost during a write operation.
 */
export declare function writeAtomic(filePath: string, content: string | Uint8Array): Promise<void>;
/**
 * Recursively reads a directory and returns an array of absolute file paths.
 *
 * @param directoryPath - The path to the directory to read.
 * @param excludedPaths - Nested array of paths to ignore.
 * @returns A promise that resolves to an array of absolute file paths.
 * @throws Error if the directory cannot be read.
 */
export declare const readDirectory: (directoryPath: string, excludedPaths?: string[][]) => Promise<any[]>;
export declare function getBinaryLocation(name: string): Promise<string>;
//# sourceMappingURL=fs.d.ts.map