export type TestCase = {
    id: string;
    name: string;
    input: string[];
    output: string[];
};

export type TestCaseDraft = Omit<TestCase, "id">;

export type TestRunLine = {
    index: number;
    expected: string | null;
    actual: string | null;
    status: "PASS" | "FAIL";
};

/** Resultado de correr un test guardado; no se persiste ni modifica el test. */
export type TestRun = {
    passed: boolean;
    total: number;
    passedCount: number;
    failedCount: number;
    lines: TestRunLine[];
    errors: string[];
};
