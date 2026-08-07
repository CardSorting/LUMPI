/**
 * [LAYER: CORE]
 * Bounded summaries for JoyRide execution artifacts.
 */
import { Buffer } from "node:buffer";
export function summarizeJoyRideCommandOutput(output, maxChars = 12_000) {
    const originalBytes = Buffer.byteLength(output, "utf8");
    if (output.length <= maxChars) {
        return {
            text: output,
            originalBytes,
            summaryBytes: originalBytes,
            truncated: false,
        };
    }
    const headLength = Math.max(0, Math.floor(maxChars * 0.65));
    const tailLength = Math.max(0, maxChars - headLength);
    const text = `${output.slice(0, headLength)}\n\n[JoyRide summary truncated ${output.length - maxChars} chars]\n\n${output.slice(-tailLength)}`;
    return {
        text,
        originalBytes,
        summaryBytes: Buffer.byteLength(text, "utf8"),
        truncated: true,
    };
}
//# sourceMappingURL=summaries.js.map