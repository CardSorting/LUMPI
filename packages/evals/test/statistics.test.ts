import { describe, expect, it } from "vitest";
import {
	calculateConfidenceInterval,
	calculateMean,
	calculatePassAtK,
	calculateStandardError,
	calculateTokenEfficiencyIndex,
	calculateVariance,
	calculateWelchTTest,
} from "../src/statistics.ts";

describe("statistics module", () => {
	it("calculates mean accurately", () => {
		expect(calculateMean([10, 20, 30, 40, 50])).toBe(30);
		expect(calculateMean([])).toBe(0);
	});

	it("calculates sample variance and standard error", () => {
		const sample = [10, 12, 23, 23, 16, 23, 21, 16];
		const variance = calculateVariance(sample);
		const sem = calculateStandardError(sample);

		expect(variance).toBeGreaterThan(20);
		expect(sem).toBeGreaterThan(1);
	});

	it("calculates 95% confidence interval", () => {
		const sample = [100, 102, 98, 101, 99, 103, 97];
		const ci = calculateConfidenceInterval(sample);

		expect(ci.mean).toBe(100);
		expect(ci.lower).toBeLessThan(100);
		expect(ci.upper).toBeGreaterThan(100);
		expect(ci.marginOfError).toBeGreaterThan(0);
	});

	it("calculates Pass@k accurately", () => {
		expect(calculatePassAtK(10, 10, 1)).toBe(1.0);
		expect(calculatePassAtK(10, 0, 1)).toBe(0.0);
		expect(calculatePassAtK(10, 5, 1)).toBe(0.5);
		expect(calculatePassAtK(10, 5, 2)).toBeGreaterThan(0.5);
	});

	it("computes Welch's t-test and Cohen's d effect size", () => {
		const group1 = [100, 105, 98, 102, 104, 101];
		const group2 = [50, 52, 48, 51, 49, 53];
		const result = calculateWelchTTest(group1, group2);

		expect(result.isStatisticallySignificant).toBe(true);
		expect(result.tStatistic).toBeGreaterThan(10);
		expect(result.cohensD).toBeGreaterThan(2);
	});

	it("calculates Token Efficiency Index (TEI)", () => {
		const tei = calculateTokenEfficiencyIndex(1.0, 50000);
		expect(tei).toBe(0.2);
	});
});
