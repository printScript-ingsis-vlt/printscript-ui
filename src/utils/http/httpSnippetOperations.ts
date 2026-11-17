import {FakeSnippetOperations} from "../mock/fakeSnippetOperations.ts";
import {BACKEND_URL} from "../constants.ts";
import {PaginatedUsers} from "../users.ts";
import {
  CreateSnippet,
  CreateSnippetFromFile,
  PaginatedSnippets,
  Snippet,
  SnippetContentVersion,
  SnippetListFilters,
  UpdateSnippet,
  UpdateSnippetFromFile
} from "../snippet.ts";
import {FileType} from "../../types/FileType.ts";
import {TestCase, TestCaseDraft, TestRun} from "../../types/TestCase.ts";
import {Rule} from "../../types/Rule.ts";
import {createAuthenticatedHttpClient} from "./authenticatedHttpClient.ts";
import {RulesHttpOperations} from "./rulesHttpOperations.ts";
import {SnippetsHttpOperations} from "./snippetsHttpOperations.ts";
import {UsersHttpOperations} from "./usersHttpOperations.ts";
import {TestsHttpOperations} from "./testsHttpOperations.ts";

export class HttpSnippetOperations extends FakeSnippetOperations {
  private readonly snippets: SnippetsHttpOperations
  private readonly users: UsersHttpOperations
  private readonly rules: RulesHttpOperations
  private readonly tests: TestsHttpOperations

  constructor(getToken: () => Promise<string>, baseUrl: string = BACKEND_URL) {
    super()
    const http = createAuthenticatedHttpClient(getToken, baseUrl)
    this.snippets = new SnippetsHttpOperations(http)
    this.users = new UsersHttpOperations(http)
    this.rules = new RulesHttpOperations(http)
    this.tests = new TestsHttpOperations(http)
  }

  override listSnippetDescriptors(page: number, pageSize: number, filters: SnippetListFilters): Promise<PaginatedSnippets> {
    return this.snippets.list(page, pageSize, filters)
  }

  override createSnippet(snippet: CreateSnippet): Promise<Snippet> {
    return this.snippets.create(snippet)
  }

  override createSnippetFromFile(snippet: CreateSnippetFromFile): Promise<Snippet> {
    return this.snippets.createFromFile(snippet)
  }

  override getSnippetById(id: string): Promise<Snippet> {
    return this.snippets.getById(id)
  }

  override downloadSnippet(id: string, version: SnippetContentVersion): Promise<string> {
    return this.snippets.download(id, version)
  }

  override updateSnippetById(id: string, snippet: UpdateSnippet): Promise<Snippet> {
    return this.snippets.update(id, snippet)
  }

  override updateSnippetFromFile(id: string, snippet: UpdateSnippetFromFile): Promise<Snippet> {
    return this.snippets.updateFromFile(id, snippet)
  }

  override getTestCases(snippetId: string): Promise<TestCase[]> {
    return this.tests.list(snippetId)
  }

  override createTestCase(snippetId: string, testCase: TestCaseDraft): Promise<TestCase> {
    return this.tests.create(snippetId, testCase)
  }

  override updateTestCase(snippetId: string, testId: string, testCase: TestCaseDraft): Promise<TestCase> {
    return this.tests.update(snippetId, testId, testCase)
  }

  override removeTestCase(snippetId: string, testId: string): Promise<string> {
    return this.tests.remove(snippetId, testId)
  }

  override runTestCase(snippetId: string, testId: string): Promise<TestRun> {
    return this.tests.run(snippetId, testId)
  }

  override deleteSnippet(id: string): Promise<string> {
    return this.snippets.delete(id)
  }

  override getFileTypes(): Promise<FileType[]> {
    return this.snippets.getFileTypes()
  }

  override getUserFriends(name: string = "", page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {
    return this.users.search(name, page, pageSize)
  }

  override shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    return this.users.share(snippetId, userId)
  }

  override getLintingRules(): Promise<Rule[]> {
    return this.rules.get("lint")
  }

  override modifyLintingRule(rules: Rule[]): Promise<Rule[]> {
    return this.rules.update("lint", rules)
  }

  override getFormatRules(): Promise<Rule[]> {
    return this.rules.get("format")
  }

  override modifyFormatRule(rules: Rule[]): Promise<Rule[]> {
    return this.rules.update("format", rules)
  }
}
