import {useMutation, UseMutationResult, useQuery, useQueryClient} from 'react-query';
import {
  CreateSnippet,
  CreateSnippetFromFile,
  PaginatedSnippets,
  Snippet,
  SnippetContentVersion,
  SnippetListFilters,
  UpdateSnippet,
  UpdateSnippetFromFile
} from './snippet.ts';
import {SnippetOperations} from "./snippetOperations.ts";
import {PaginatedUsers} from "./users.ts";
import {TestCase, TestCaseDraft, TestRun} from "../types/TestCase.ts";
import {AutomaticTestRun, automaticRunRefetchInterval} from "../types/AutomaticTestRun.ts";
import {isAxiosError} from "axios";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import {useAuth0} from "@auth0/auth0-react";
import {useMemo} from "react";
import {HttpSnippetOperations} from "./http/httpSnippetOperations.ts";
import {describeError} from "./http/apiError.ts";
import {useSnackbarContext} from "../contexts/snackbarContext.tsx";


export const useSnippetsOperations = () => {
  const {getAccessTokenSilently} = useAuth0()

  // Una sola instancia por sesión: si no, cada render crearía un cliente nuevo.
  return useMemo<SnippetOperations>(
      () => new HttpSnippetOperations(() => getAccessTokenSilently()),
      [getAccessTokenSilently]
  )
}

export const useGetSnippets = (page: number = 0, pageSize: number = 10, filters: SnippetListFilters) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedSnippets, Error>(
      ['listSnippets', page, pageSize, filters],
      () => snippetOperations.listSnippetDescriptors(page, pageSize, filters),
      {
        // Los resultados de lint llegan por Redis; sólo refrescamos mientras la página visible tenga pendientes.
        refetchInterval: data => data?.snippets.some(snippet => snippet.compliance === 'pending') ? 5000 : false,
      },
  );
};

export const useGetSnippetById = (id: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Snippet | undefined, Error>(['snippet', id], () => snippetOperations.getSnippetById(id), {
    enabled: !!id, // This query will not execute until the id is provided
    // Los resultados de lint llegan de forma asíncrona; el detalle se actualiza mientras espera.
    refetchInterval: data => data?.compliance === 'pending' ? 5000 : false,
  });
};

export const useDownloadSnippet = () => {
  const snippetOperations = useSnippetsOperations()
  const reportError = useReportError()

  return useMutation<string, Error, { id: string, version: SnippetContentVersion }>(
      ({id, version}) => snippetOperations.downloadSnippet(id, version),
      {onError: reportError},
  )
}

export const useCreateSnippet = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, CreateSnippet> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, CreateSnippet>(createSnippet => snippetOperations.createSnippet(createSnippet), {onSuccess});
};

export const useCreateSnippetFromFile = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, CreateSnippetFromFile> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, CreateSnippetFromFile>(
      snippet => snippetOperations.createSnippetFromFile(snippet),
      {onSuccess},
  )
}

export const useUpdateSnippetById = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, {
  id: string;
  updateSnippet: UpdateSnippet
}> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippet }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetById(id, updateSnippet),{
        onSuccess,
    }
  );
};

export const useUpdateSnippetFromFile = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, {
  id: string;
  updateSnippet: UpdateSnippetFromFile
}> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippetFromFile }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetFromFile(id, updateSnippet),
      {onSuccess},
  )
}

export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedUsers, Error>(['users',name,page,pageSize], () => snippetOperations.getUserFriends(name,page, pageSize));
};

// Los errores de las acciones que no tienen un lugar propio en pantalla (borrar, compartir) salen en un snackbar.
const useReportError = () => {
  const {createSnackbar} = useSnackbarContext()
  return (error: unknown) => createSnackbar("error", describeError(error).message)
}

export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations()
  const reportError = useReportError()

  return useMutation<Snippet, Error, { snippetId: string; userId: string }>(
      ({snippetId, userId}) => snippetOperations.shareSnippet(snippetId, userId),
      {onError: reportError}
  );
};


export const useGetTestCases = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<TestCase[], Error>(
      ['testCases', snippetId],
      () => snippetOperations.getTestCases(snippetId),
      {enabled: !!snippetId},
  )
};

export const useCreateTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  const queryClient = useQueryClient()

  return useMutation<TestCase, Error, TestCaseDraft>(
      testCase => snippetOperations.createTestCase(snippetId, testCase),
      {onSuccess: () => queryClient.invalidateQueries(['testCases', snippetId])},
  )
};

export const useUpdateTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  const queryClient = useQueryClient()

  return useMutation<TestCase, Error, {testId: string; testCase: TestCaseDraft}>(
      ({testId, testCase}) => snippetOperations.updateTestCase(snippetId, testId, testCase),
      {onSuccess: () => queryClient.invalidateQueries(['testCases', snippetId])},
  )
}

export const useRemoveTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  const queryClient = useQueryClient()

  return useMutation<string, Error, string>(
      testId => snippetOperations.removeTestCase(snippetId, testId),
      {onSuccess: () => queryClient.invalidateQueries(['testCases', snippetId])},
  )
}

export const automaticTestRunKey = (snippetId: string) => ['automaticTestRun', snippetId]

/**
 * US #16: estado de la última corrida automática de tests del snippet.
 * Refresca cada pocos segundos mientras la corrida está en curso y se detiene al terminar.
 * Devuelve null si el backend todavía no expone el endpoint (404), para no mostrar un error por algo que no existe.
 */
export const useGetAutomaticTestRun = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<AutomaticTestRun | null, Error>(
      automaticTestRunKey(snippetId),
      async () => {
        try {
          return await snippetOperations.getAutomaticTestRun(snippetId)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) return null
          throw error
        }
      },
      {
        enabled: !!snippetId,
        refetchInterval: automaticRunRefetchInterval,
      },
  )
}

export const useRunTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestRun, Error, string>(
      testId => snippetOperations.runTestCase(snippetId, testId),
  )
}



export const useGetFormatRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('formatRules', () => snippetOperations.getFormatRules());
}

export const useModifyFormatRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  const reportError = useReportError()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyFormatRule(rule),
      {onSuccess, onError: reportError}
  );
}


export const useGetLintingRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('lintingRules', () => snippetOperations.getLintingRules());
}


export const useModifyLintingRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  const reportError = useReportError()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyLintingRule(rule),
      {onSuccess, onError: reportError}
  );
}

export const useDeleteSnippet = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  const reportError = useReportError()

  return useMutation<string, Error, string>(
      id => snippetOperations.deleteSnippet(id),
      {
        onSuccess,
        onError: reportError,
      }
  );
}


export const useGetFileTypes = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<FileType[], Error>('fileTypes', () => snippetOperations.getFileTypes());
}
