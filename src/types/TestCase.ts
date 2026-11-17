export type TestCase = {
    id: string;
    name: string;
    input: string[];
    output: string[];
};

export type TestCaseDraft = Omit<TestCase, "id">;
