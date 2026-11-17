import {AxiosInstance} from "axios";
import {TestCase, TestCaseDraft, TestRun} from "../../types/TestCase.ts";

export class TestsHttpOperations {
  constructor(private readonly http: AxiosInstance) {}

  async list(snippetId: string): Promise<TestCase[]> {
    const {data} = await this.http.get<TestCase[]>(this.basePath(snippetId))
    return data
  }

  async create(snippetId: string, testCase: TestCaseDraft): Promise<TestCase> {
    const {data} = await this.http.post<TestCase>(this.basePath(snippetId), testCase)
    return data
  }

  async update(snippetId: string, testId: string, testCase: TestCaseDraft): Promise<TestCase> {
    const {data} = await this.http.put<TestCase>(`${this.basePath(snippetId)}/${encodeURIComponent(testId)}`, testCase)
    return data
  }

  async remove(snippetId: string, testId: string): Promise<string> {
    await this.http.delete(`${this.basePath(snippetId)}/${encodeURIComponent(testId)}`)
    return testId
  }

  async run(snippetId: string, testId: string): Promise<TestRun> {
    const {data} = await this.http.post<TestRun>(`${this.basePath(snippetId)}/${encodeURIComponent(testId)}/run`)
    return data
  }

  private basePath(snippetId: string): string {
    return `/snippets/${encodeURIComponent(snippetId)}/tests`
  }
}
