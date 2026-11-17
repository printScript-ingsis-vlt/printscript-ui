import {AxiosInstance} from "axios";
import {FileType} from "../../types/FileType.ts";
import {Pagination} from "../pagination.ts";
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

// El listado no trae contenido; el detalle sí. La UI normaliza null a string vacío.
export type SnippetDto = Omit<Snippet, "content"> & { content: string | null }
type PaginatedSnippetsDto = Pagination & { snippets: SnippetDto[] }

export const toSnippet = ({content, ...rest}: SnippetDto): Snippet => ({...rest, content: content ?? ""})

export class SnippetsHttpOperations {
  constructor(private readonly http: AxiosInstance) {}

  async list(page: number, pageSize: number, filters: SnippetListFilters): Promise<PaginatedSnippets> {
    const {data} = await this.http.get<PaginatedSnippetsDto>("/snippets", {
      params: {
        page,
        page_size: pageSize,
        name: filters.name || undefined,
        language: filters.language || undefined,
        compliance: filters.compliance,
        relation: filters.relation,
        sort: filters.sort,
        order: filters.order,
      },
    })
    return {...data, snippets: data.snippets.map(toSnippet)}
  }

  async create({name, description, language, version, content}: CreateSnippet): Promise<Snippet> {
    const {data} = await this.http.post<SnippetDto>("/snippets", {name, description, language, version: version || undefined, content})
    return toSnippet(data)
  }

  async createFromFile({file, name, description, language, version}: CreateSnippetFromFile): Promise<Snippet> {
    const {data} = await this.http.post<SnippetDto>("/snippets", fileData(file, {name, description, language, version}))
    return toSnippet(data)
  }

  async getById(id: string): Promise<Snippet> {
    const {data} = await this.http.get<SnippetDto>(`/snippets/${encodeURIComponent(id)}`)
    return toSnippet(data)
  }

  async download(id: string, version: SnippetContentVersion): Promise<string> {
    const {data} = await this.http.get<string>(`/snippets/${encodeURIComponent(id)}/download`, {
      params: {version},
      responseType: 'text',
    })
    return data
  }

  async update(id: string, update: UpdateSnippet): Promise<Snippet> {
    const {data} = await this.http.put<SnippetDto>(`/snippets/${encodeURIComponent(id)}`, withoutEmptyVersion(update))
    return toSnippet(data)
  }

  async updateFromFile(id: string, {file, ...update}: UpdateSnippetFromFile): Promise<Snippet> {
    const {data} = await this.http.put<SnippetDto>(
        `/snippets/${encodeURIComponent(id)}`,
        fileData(file, withoutEmptyVersion(update)),
    )
    return toSnippet(data)
  }

  async delete(id: string): Promise<string> {
    await this.http.delete(`/snippets/${encodeURIComponent(id)}`)
    return id
  }

  async getFileTypes(): Promise<FileType[]> {
    const {data} = await this.http.get<FileType[]>("/snippets/file-types")
    return data
  }
}

type FileMetadata = { name?: string; description?: string; language?: string; version?: string }

const fileData = (file: File, metadata: FileMetadata): FormData => {
  const data = new FormData()
  data.append("file", file)
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== "") data.append(key, value)
  })
  return data
}

const withoutEmptyVersion = <T extends { version?: string }>(payload: T): T =>
    payload.version === "" ? {...payload, version: undefined} : payload
