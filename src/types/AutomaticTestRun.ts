import type {TestRun} from "./TestCase.ts";

/**
 * US #16: cada vez que se guarda un snippet, snippet-service corre todos sus tests en segundo plano
 * (GET /snippets/{id}/tests/automatic-run). El guardado no espera ni depende de este resultado.
 */
export type AutomaticTestStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR";

export type AutomaticTestResult = {
    testId: string;
    testName: string;
    result: TestRun;
};

export type AutomaticTestRun = {
    /** null: el snippet todavía no se guardó desde que existe el testing automático. */
    status: AutomaticTestStatus | null;
    /** Aumenta con cada guardado; sirve para no mezclar resultados de versiones distintas. */
    generation: number;
    results: AutomaticTestResult[];
    /** Error técnico de la corrida (engine caído, etc.). Un test que falla no es un error. */
    error: string | null;
};

export type AutomaticRunState =
    | "never"
    | "pending"
    | "running"
    | "no-tests"
    | "passed"
    | "failed"
    | "error";

export type AutomaticRunSummary = {
    state: AutomaticRunState;
    passed: number;
    total: number;
    label: string;
};

/** Cada cuánto se vuelve a preguntar mientras la corrida no terminó. */
export const AUTOMATIC_RUN_POLL_MS = 2000;

export const isAutomaticRunInProgress = (run: AutomaticTestRun | null | undefined): boolean =>
    run?.status === "PENDING" || run?.status === "RUNNING";

/** Para react-query: sólo se refresca mientras la corrida está en curso. */
export const automaticRunRefetchInterval = (run: AutomaticTestRun | null | undefined): number | false =>
    isAutomaticRunInProgress(run) ? AUTOMATIC_RUN_POLL_MS : false;

export const summarizeAutomaticRun = (run: AutomaticTestRun | null | undefined): AutomaticRunSummary => {
    const results = run?.results ?? [];
    const total = results.length;
    const passed = results.filter(({result}) => result.passed).length;

    switch (run?.status ?? null) {
        case null:
            return {state: "never", passed, total, label: "Not run yet: tests run automatically every time you save"};
        case "PENDING":
            return {state: "pending", passed, total, label: "Queued: tests will run in a few seconds"};
        case "RUNNING":
            return {state: "running", passed, total, label: "Running tests…"};
        case "ERROR":
            return {
                state: "error",
                passed,
                total,
                label: run?.error ? `Could not run tests: ${run.error}` : "Could not run tests",
            };
        case "COMPLETED":
            if (total === 0) return {state: "no-tests", passed, total, label: "This snippet has no tests"};
            return passed === total
                ? {state: "passed", passed, total, label: `All tests passed (${passed}/${total})`}
                : {state: "failed", passed, total, label: `${total - passed} of ${total} tests failed`};
    }
};
