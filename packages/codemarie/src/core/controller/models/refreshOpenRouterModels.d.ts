import type { IController as Controller } from "@core/controller/types";
import type { ModelInfo } from "@shared/api";
/**
 * Core function: Refreshes the OpenRouter models and returns application types
 * @param controller The controller instance
 * @returns Record of model ID to ModelInfo (application types)
 */
export declare function refreshOpenRouterModels(controller: Controller): Promise<Record<string, ModelInfo>>;
export declare function appendDietCodeStealthModels(currentModels: Record<string, ModelInfo>): Record<string, ModelInfo>;
//# sourceMappingURL=refreshOpenRouterModels.d.ts.map