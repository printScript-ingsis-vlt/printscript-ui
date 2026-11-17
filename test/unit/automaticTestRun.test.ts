import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {
    AUTOMATIC_RUN_POLL_MS,
    automaticRunRefetchInterval,
    isAutomaticRunInProgress,
    summarizeAutomaticRun,
} from "../../src/types/AutomaticTestRun.ts";
import type {AutomaticTestResult, AutomaticTestRun, AutomaticTestStatus} from "../../src/types/AutomaticTestRun.ts";

const result = (name: string, passed: boolean): AutomaticTestResult => ({
    testId: `id-${name}`,
    testName: name,
    result: {
        passed,
        total: 1,
        passedCount: passed ? 1 : 0,
        failedCount: passed ? 0 : 1,
        lines: [{index: 0, expected: "1", actual: passed ? "1" : "2", status: passed ? "PASS" : "FAIL"}],
        errors: [],
    },
});

const run = (status: AutomaticTestStatus | null, results: AutomaticTestResult[] = [], error: string | null = null):
    AutomaticTestRun => ({status, generation: 1, results, error});

describe("isAutomaticRunInProgress / automaticRunRefetchInterval", () => {
    it("polls while the run is PENDING or RUNNING", () => {
        for (const status of ["PENDING", "RUNNING"] as const) {
            assert.equal(isAutomaticRunInProgress(run(status)), true);
            assert.equal(automaticRunRefetchInterval(run(status)), AUTOMATIC_RUN_POLL_MS);
        }
    });

    it("stops polling once the run finished, never ran, or the endpoint is missing", () => {
        for (const value of [run("COMPLETED"), run("ERROR"), run(null), null, undefined]) {
            assert.equal(isAutomaticRunInProgress(value), false);
            assert.equal(automaticRunRefetchInterval(value), false);
        }
    });
});

describe("summarizeAutomaticRun", () => {
    it("explains that nothing ran yet when the snippet was never saved", () => {
        assert.equal(summarizeAutomaticRun(run(null)).state, "never");
        assert.equal(summarizeAutomaticRun(undefined).state, "never");
    });

    it("reports queued and running states", () => {
        assert.equal(summarizeAutomaticRun(run("PENDING")).state, "pending");
        assert.equal(summarizeAutomaticRun(run("RUNNING")).state, "running");
    });

    it("reports a completed run with no tests", () => {
        const summary = summarizeAutomaticRun(run("COMPLETED"));
        assert.equal(summary.state, "no-tests");
        assert.equal(summary.total, 0);
    });

    it("reports passed when every test passed", () => {
        const summary = summarizeAutomaticRun(run("COMPLETED", [result("a", true), result("b", true)]));
        assert.deepEqual({state: summary.state, passed: summary.passed, total: summary.total},
            {state: "passed", passed: 2, total: 2});
        assert.match(summary.label, /2\/2/);
    });

    it("reports failed and how many failed when at least one test failed", () => {
        const summary = summarizeAutomaticRun(run("COMPLETED", [result("a", true), result("b", false)]));
        assert.equal(summary.state, "failed");
        assert.equal(summary.passed, 1);
        assert.match(summary.label, /1 of 2 tests failed/);
    });

    it("shows the technical error of an ERROR run, keeping partial results", () => {
        const summary = summarizeAutomaticRun(run("ERROR", [result("a", true)], "Engine unavailable"));
        assert.equal(summary.state, "error");
        assert.equal(summary.total, 1);
        assert.match(summary.label, /Engine unavailable/);
    });
});
