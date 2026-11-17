import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'

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
  content: string;
  language: string;
  extension: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

export type UpdateSnippet = {
  content: string
}

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: ComplianceEnum;
  author: string;
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => x.extension == fileExt)
}
