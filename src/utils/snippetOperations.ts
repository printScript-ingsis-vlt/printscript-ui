import {
  CreateSnippet,
  CreateSnippetFromFile,
  PaginatedSnippets,
  Snippet,
  SnippetContentVersion,
  SnippetListFilters,
  UpdateSnippet,
  UpdateSnippetFromFile
} from './snippet'
import {PaginatedUsers} from "./users.ts";
import {TestCase, TestCaseDraft, TestRun} from "../types/TestCase.ts";
import {AutomaticTestRun} from "../types/AutomaticTestRun.ts";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";

export interface SnippetOperations {
  listSnippetDescriptors(page: number, pageSize: number, filters: SnippetListFilters): Promise<PaginatedSnippets>

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet>

  createSnippetFromFile(createSnippet: CreateSnippetFromFile): Promise<Snippet>

  getSnippetById(id: string): Promise<Snippet | undefined>

  downloadSnippet(id: string, version: SnippetContentVersion): Promise<string>

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet>

  updateSnippetFromFile(id: string, updateSnippet: UpdateSnippetFromFile): Promise<Snippet>

  getUserFriends(name?: string,page?: number,pageSize?: number): Promise<PaginatedUsers>

  shareSnippet(snippetId: string,userId: string): Promise<Snippet>

  getFormatRules(): Promise<Rule[]>

  getLintingRules(): Promise<Rule[]>

  getTestCases(snippetId: string): Promise<TestCase[]>

  createTestCase(snippetId: string, testCase: TestCaseDraft): Promise<TestCase>

  updateTestCase(snippetId: string, testId: string, testCase: TestCaseDraft): Promise<TestCase>

  removeTestCase(snippetId: string, testId: string): Promise<string>

  runTestCase(snippetId: string, testId: string): Promise<TestRun>

  getAutomaticTestRun(snippetId: string): Promise<AutomaticTestRun>

  deleteSnippet(id: string): Promise<string>

  getFileTypes(): Promise<FileType[]>

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]>

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]>
}
