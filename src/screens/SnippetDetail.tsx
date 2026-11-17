import {ChangeEvent, useEffect, useRef, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Box, CircularProgress, IconButton, Menu, MenuItem, TextField, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useUpdateSnippetById
} from "../utils/queries.tsx";
import {
  automaticTestRunKey,
  useDownloadSnippet,
  useGetSnippetById,
  useShareSnippet,
  useUpdateSnippetFromFile
} from "../utils/queries.tsx";
import {AutomaticTestRunPanel} from "../components/snippet-test/AutomaticTestRunPanel.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Save, Share, UploadFile} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {SnippetContentVersion} from "../utils/snippet.ts";
import {SnippetExecution} from "./SnippetExecution.tsx";
import {queryClient} from "../App.tsx";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";
import {ApiErrorAlert} from "../components/common/ApiErrorAlert.tsx";

type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
}

export const SnippetDetail = (props: SnippetDetailProps) => {
  const {id, handleCloseModal} = props;
  const [code, setCode] = useState(
      ""
  );
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("")
  const [version, setVersion] = useState("")
  const [shareModalOppened, setShareModalOppened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState<HTMLElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {data: snippet, isLoading, isError, error: loadError, refetch} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: downloadSnippet, isLoading: isDownloading} = useDownloadSnippet()
  // El listado también cambia al guardar (por ejemplo vuelve a "pending"), y cada guardado
  // dispara la corrida automática de los tests (US #16): se vuelve a consultar para empezar a seguirla.
  const refreshAfterSave = async () => {
    await queryClient.invalidateQueries(['snippet', id])
    await queryClient.invalidateQueries('listSnippets')
    await queryClient.invalidateQueries(automaticTestRunKey(id))
  }
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading, error: updateError} = useUpdateSnippetById({
    onSuccess: refreshAfterSave
  })
  const {mutate: updateSnippetFromFile, isLoading: isUpdateFileLoading, error: updateFileError} = useUpdateSnippetFromFile({
    onSuccess: refreshAfterSave
  })

  useEffect(() => {
    if (snippet) {
      setCode(snippet.content);
      setName(snippet.name)
      setDescription(snippet.description)
      setLanguage(snippet.language)
      setVersion(snippet.version ?? "")
    }
  }, [snippet]);

  const hasChanges = !!snippet && (
      snippet.content !== code ||
      snippet.name !== name ||
      snippet.description !== description ||
      snippet.language !== language ||
      snippet.version !== version
  )

  const updateFromEditor = () => {
    if (!snippet) return
    updateSnippet({
      id,
      updateSnippet: {
        name: name === snippet.name ? undefined : name,
        description: description === snippet.description ? undefined : description,
        language: language === snippet.language ? undefined : language,
        version: version === snippet.version ? undefined : version,
        content: code === snippet.content ? undefined : code,
      },
    })
  }

  const updateFromFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !snippet) return
    updateSnippetFromFile({
      id,
      updateSnippet: {file, name, description, language, version: version || undefined},
    })
  }

  async function handleShareSnippet(userId: string) {
    shareSnippet({snippetId: id, userId})
  }

  const handleDownload = (version: SnippetContentVersion) => {
    if (!snippet) return
    setDownloadAnchor(null)
    downloadSnippet(
        {id: snippet.id, version},
        {
          onSuccess: content => {
            const file = new Blob([content], {type: 'text/plain'})
            const url = URL.createObjectURL(file)
            const link = document.createElement('a')
            link.href = url
            link.download = `${snippet.name}.${snippet.extension}`
            link.click()
            URL.revokeObjectURL(url)
          },
        },
    )
  }

  return (
      <Box p={4} minWidth={'60vw'}>
        <Box width={'100%'} p={2} display={'flex'} justifyContent={'flex-end'}>
          <CloseIcon style={{cursor: "pointer"}} onClick={handleCloseModal}/>
        </Box>
        {
          isLoading ? (<>
            <Typography fontWeight={"bold"} mb={2} variant="h4">Loading...</Typography>
            <CircularProgress/>
          </>) : isError ? (
              // Sin el snippet no hay nada que editar: el editor vacío dejaría guardar encima del contenido real.
              <>
                <Typography fontWeight={"bold"} mb={2} variant="h4">Snippet</Typography>
                <ApiErrorAlert error={loadError} onRetry={() => refetch()}/>
              </>
          ) : <>
            <Typography variant="h4" fontWeight={"bold"}>{snippet?.name ?? "Snippet"}</Typography>
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Share"}>
                <IconButton onClick={() => setShareModalOppened(true)}>
                  <Share/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)}>
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Download"}>
                <IconButton onClick={event => setDownloadAnchor(event.currentTarget)} disabled={isDownloading || !snippet}>
                  <Download/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Replace from file"}>
                <IconButton onClick={() => fileInputRef.current?.click()} disabled={isUpdateFileLoading || !snippet}>
                  {isUpdateFileLoading ? <CircularProgress size={20}/> : <UploadFile/>}
                </IconButton>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={updateFromEditor} disabled={isUpdateSnippetLoading || !hasChanges} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            {(updateError || updateFileError) && <Box pb={2}><ApiErrorAlert error={updateError ?? updateFileError}/></Box>}
            <Box display="flex" flexDirection="column" gap={2} pb={2}>
              <TextField label="Name" value={name} onChange={event => setName(event.target.value)} size="small"/>
              <TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} size="small"/>
              <Box display="flex" gap={2}>
                <TextField label="Language" value={language} onChange={event => setLanguage(event.target.value)} size="small" fullWidth/>
                <TextField label="Version" value={version} onChange={event => setVersion(event.target.value)} size="small" fullWidth/>
              </Box>
            </Box>
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, "javascript")}
                    maxLength={1000}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            <Box marginTop={2}>
              <AutomaticTestRunPanel snippetId={id} hasUnsavedChanges={hasChanges}
                                     onManageTests={() => setTestModalOpened(true)}/>
            </Box>
            <Box pt={1} flex={1} marginTop={2}>
              <SnippetExecution snippetId={id} hasUnsavedChanges={hasChanges}/>
            </Box>
          </>
        }
        <ShareSnippetModal loading={loadingShare || isLoading} open={shareModalOppened}
                           onClose={() => setShareModalOppened(false)}
                           onShare={handleShareSnippet}/>
        <Menu anchorEl={downloadAnchor} open={Boolean(downloadAnchor)} onClose={() => setDownloadAnchor(null)}>
          <MenuItem onClick={() => handleDownload('original')}>Download original</MenuItem>
          <MenuItem onClick={() => handleDownload('formatted')}>Download formatted</MenuItem>
        </Menu>
        <input hidden type="file" ref={fileInputRef} onChange={updateFromFile}/>
        <TestSnippetModal snippetId={id} open={testModalOpened} onClose={() => setTestModalOpened(false)}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

