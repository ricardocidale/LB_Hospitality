import { describe, it, expect, beforeEach } from "vitest";
import {
  computeCacheKey,
  getCachedResult,
  setCachedResult,
  invalidateComputeCache,
  getCacheStatus,
  resetCacheStats,
} from "../../server/finance/cache";
import type { PortfolioComputeResult } from "../../server/finance/core/types";

function makeMockResult(overrides?: Partial<PortfolioComputeResult>): PortfolioComputeResult {
  return {
    engineVersion: "1.0.0",
    computedAt: new Date().toISOString(),
    perPropertyYearly: {},
    perPropertyMonthly: {},
    consolidatedYearly: [],
    outputHash: "mock-hash-" + Math.random().toString(36).slice(2),
    propertyCount: 1,
    projectionYears: 10,
    cached: false,
    validationSummary: {
      opinion: "UNQUALIFIED",
      identityChecks: 5,
      passed: 5,
      failed: 0,
    },
    ...overrides,
  };
}

describe("Finance Compute Cache", () => {
  beforeEach(() => {
    invalidateComputeCache();
    resetCacheStats();
  });

  describe("computeCacheKey", () => {
    it("produces deterministic hashes for identical inputs", () => {
      const input = { properties: [{ id: 1, name: "Hotel A" }], assumptions: { inflationRate: 0.03 } };
      const hash1 = computeCacheKey(input);
      const hash2 = computeCacheKey(input);
      expect(hash1).toBe(hash2);
    });

    it("produces deterministic hashes regardless of key order", () => {
      const input1 = { a: 1, b: 2, c: 3 };
      const input2 = { c: 3, a: 1, b: 2 };
      expect(computeCacheKey(input1)).toBe(computeCacheKey(input2));
    });

    it("produces different hashes for different inputs", () => {
      const hash1 = computeCacheKey({ rate: 0.05 });
      const hash2 = computeCacheKey({ rate: 0.06 });
      expect(hash1).not.toBe(hash2);
    });

    it("returns a non-empty string", () => {
      const hash = computeCacheKey({ foo: "bar" });
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe("get / set cached results", () => {
    it("returns null for a cache miss", () => {
      const result = getCachedResult("nonexistent-hash");
      expect(result).toBeNull();
    });

    it("returns cached result on hit", () => {
      const mockResult = makeMockResult({ propertyCount: 7 });
      const hash = "test-hash-1";
      setCachedResult(hash, mockResult);
      const cached = getCachedResult(hash);
      expect(cached).not.toBeNull();
      expect(cached!.propertyCount).toBe(7);
    });

    it("tracks hit/miss statistics correctly", () => {
      const hash = "stats-test";
      setCachedResult(hash, makeMockResult());

      getCachedResult("miss-1");
      getCachedResult("miss-2");
      getCachedResult(hash);

      const status = getCacheStatus();
      expect(status.hits).toBe(1);
      expect(status.misses).toBe(2);
      expect(status.hitRate).toBeCloseTo(1 / 3, 5);
    });

    it("stores multiple entries independently", () => {
      setCachedResult("hash-a", makeMockResult({ propertyCount: 3 }));
      setCachedResult("hash-b", makeMockResult({ propertyCount: 5 }));

      expect(getCachedResult("hash-a")!.propertyCount).toBe(3);
      expect(getCachedResult("hash-b")!.propertyCount).toBe(5);
    });
  });

  describe("invalidateComputeCache", () => {
    it("clears all cached entries", () => {
      setCachedResult("hash-1", makeMockResult());
      setCachedResult("hash-2", makeMockResult());
      expect(getCacheStatus().size).toBe(2);

      invalidateComputeCache();
      expect(getCacheStatus().size).toBe(0);
      expect(getCachedResult("hash-1")).toBeNull();
      expect(getCachedResult("hash-2")).toBeNull();
    });

    it("is safe to call when cache is empty", () => {
      expect(() => invalidateComputeCache()).not.toThrow();
      expect(getCacheStatus().size).toBe(0);
    });
  });

  describe("getCacheStatus", () => {
    it("returns correct structure with zero stats initially", () => {
      const status = getCacheStatus();
      expect(status.size).toBe(0);
      expect(status.maxSize).toBe(200);
      expect(status.ttlMs).toBe(60_000);
      expect(status.hits).toBe(0);
      expect(status.misses).toBe(0);
      expect(status.hitRate).toBe(0);
    });

    it("reflects cache size after insertions", () => {
      setCachedResult("a", makeMockResult());
      setCachedResult("b", makeMockResult());
      setCachedResult("c", makeMockResult());
      expect(getCacheStatus().size).toBe(3);
    });
  });

  describe("resetCacheStats", () => {
    it("resets hit/miss counters without clearing cache entries", () => {
      setCachedResult("keep-me", makeMockResult());
      getCachedResult("keep-me");
      getCachedResult("nope");

      resetCacheStats();
      const status = getCacheStatus();
      expect(status.hits).toBe(0);
      expect(status.misses).toBe(0);
      expect(status.size).toBe(1);
    });
  });

  describe("end-to-end cache workflow", () => {
    it("cache key → set → get → invalidate → miss", () => {
      const input = { properties: [{ id: 42 }], assumptions: { capRate: 0.07 } };
      const key = computeCacheKey(input);
      const result = makeMockResult({ projectionYears: 10 });

      setCachedResult(key, result);
      expect(getCachedResult(key)).not.toBeNull();
      expect(getCachedResult(key)!.projectionYears).toBe(10);

      invalidateComputeCache();
      expect(getCachedResult(key)).toBeNull();
    });
  });
});
