import {SnippetOperations} from '../snippetOperations'
import {FakeSnippetStore} from './fakeSnippetStore'
import {
  CreateSnippet,
  CreateSnippetFromFile,
  PaginatedSnippets,
  Snippet,
  SnippetContentVersion,
  SnippetListFilters,
  UpdateSnippet,
  UpdateSnippetFromFile
} from '../snippet'
import autoBind from 'auto-bind'
import {PaginatedUsers} from "../users.ts";
import {TestCase, TestCaseDraft, TestRun} from "../../types/TestCase.ts";
import {AutomaticTestRun} from "../../types/AutomaticTestRun.ts";
import {FileType} from "../../types/FileType.ts";
import {Rule} from "../../types/Rule.ts";

const DELAY: number = 1000

export class FakeSnippetOperations implements SnippetOperations {
  private readonly fakeStore = new FakeSnippetStore()

  constructor() {
    autoBind(this)
  }

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.createSnippet(createSnippet)), DELAY)
    })
  }

  async createSnippetFromFile(createSnippet: CreateSnippetFromFile): Promise<Snippet> {
    return this.createSnippet({...createSnippet, content: await createSnippet.file.text()})
  }

  getSnippetById(id: string): Promise<Snippet | undefined> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getSnippetById(id)), DELAY)
    })
  }

  downloadSnippet(id: string, version: SnippetContentVersion): Promise<string> {
    void version
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const snippet = this.fakeStore.getSnippetById(id)
        if (snippet) resolve(snippet.content)
        else reject(new Error(`Snippet with id ${id} does not exist`))
      }, DELAY)
    })
  }

  listSnippetDescriptors(page: number, pageSize: number, filters: SnippetListFilters): Promise<PaginatedSnippets> {
    void filters
    const response: PaginatedSnippets = {
      page: page,
      page_size: pageSize,
      count: 20,
      snippets: page == 0 ? this.fakeStore.listSnippetDescriptors().splice(0,pageSize) : this.fakeStore.listSnippetDescriptors().splice(1,2)
    }

    return new Promise(resolve => {
      setTimeout(() => resolve(response), DELAY)
    })
  }

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.updateSnippet(id, updateSnippet)), DELAY)
    })
  }

  async updateSnippetFromFile(id: string, updateSnippet: UpdateSnippetFromFile): Promise<Snippet> {
    return this.updateSnippetById(id, {...updateSnippet, content: await updateSnippet.file.text()})
  }

  getUserFriends(name: string = "", page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getUserFriends(name,page,pageSize)), DELAY)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shareSnippet(snippetId: string, _userId: string): Promise<Snippet> {
    return new Promise(resolve => {
      // @ts-expect-error, it will always find it in the fake store
      setTimeout(() => resolve(this.fakeStore.getSnippetById(snippetId)), DELAY)
    })
  }

  getFormatRules(): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getFormatRules()), DELAY)
    })
  }

  getLintingRules(): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getLintingRules()), DELAY)
    })
  }

  getTestCases(snippetId: string): Promise<TestCase[]> {
    void snippetId
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getTestCases()), DELAY)
    })
  }

  createTestCase(snippetId: string, testCase: TestCaseDraft): Promise<TestCase> {
    void snippetId
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.postTestCase(testCase)), DELAY)
    })
  }

  updateTestCase(snippetId: string, testId: string, testCase: TestCaseDraft): Promise<TestCase> {
    void snippetId
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.postTestCase({...testCase, id: testId})), DELAY)
    })
  }

  removeTestCase(snippetId: string, id: string): Promise<string> {
    void snippetId
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.removeTestCase(id)), DELAY)
    })
  }

  getAutomaticTestRun(snippetId: string): Promise<AutomaticTestRun> {
    void snippetId
    return new Promise(resolve => {
      setTimeout(() => resolve({status: null, generation: 0, results: [], error: null}), DELAY)
    })
  }

  runTestCase(snippetId: string, testId: string): Promise<TestRun> {
    void snippetId
    void testId
    return new Promise(resolve => {
      setTimeout(() => resolve({
        passed: true,
        total: 0,
        passedCount: 0,
        failedCount: 0,
        lines: [],
        errors: [],
      }), DELAY)
    })
  }

  deleteSnippet(id: string): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.deleteSnippet(id)), DELAY)
    })
  }

  getFileTypes(): Promise<FileType[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getFileTypes()), DELAY)
    })
  }

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.modifyFormattingRule(newRules)), DELAY)
    })
  }

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.modifyLintingRule(newRules)), DELAY)
    })
  }
}
