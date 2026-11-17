import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'

// lo que devuelve una regla de linting incumplida
export type LintIssue = {
  rule: string;
  severity: string;
  message: string;
  line: number;
  column: number;
}

export type SnippetRelation = 'owned' | 'shared' | 'all'
export type SnippetSortField = 'name' | 'language' | 'compliance'
export type SnippetSortOrder = 'asc' | 'desc'
export type SnippetContentVersion = 'original' | 'formatted'

export type SnippetListFilters = {
  name?: string;
  language?: string;
  compliance?: ComplianceEnum;
  relation: SnippetRelation;
  sort: SnippetSortField;
  order: SnippetSortOrder;
}

export const defaultSnippetListFilters: SnippetListFilters = {
  relation: 'all',
  sort: 'name',
  order: 'asc',
}


export type CreateSnippet = {
  name: string;
  description: string;
  content: string;
  language: string;
  version?: string;
  extension: string;
}

/** Datos precargados en el modal de alta, opcionalmente desde un archivo local. */
export type CreateSnippetWithLang = CreateSnippet & { file?: File }

/** El backend recibe archivos por multipart, separado del flujo JSON del editor. */
export type CreateSnippetFromFile = Omit<CreateSnippet, "content"> & { file: File }

export type UpdateSnippet = {
  name?: string
  description?: string
  language?: string
  version?: string
  content?: string
}

export type UpdateSnippetFromFile = Omit<UpdateSnippet, "content"> & { file: File }

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: ComplianceEnum;
  author: string;
  lintIssues?: LintIssue[];
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => x.extension == fileExt)
}
