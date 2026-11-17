import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Box, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useUpdateSnippetById
} from "../utils/queries.tsx";
import {useDownloadSnippet, useGetSnippetById, useShareSnippet} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Save, Share} from "@mui/icons-material";
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
  const [shareModalOppened, setShareModalOppened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState<HTMLElement | null>(null)

  const {data: snippet, isLoading, isError, error: loadError, refetch} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: downloadSnippet, isLoading: isDownloading} = useDownloadSnippet()
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading, error: updateError} = useUpdateSnippetById({
    onSuccess: async () => {
      // El listado también cambia al guardar (por ejemplo vuelve a "pending").
      await queryClient.invalidateQueries(['snippet', id])
      await queryClient.invalidateQueries('listSnippets')
    }
  })

  useEffect(() => {
    if (snippet) {
      setCode(snippet.content);
    }
  }, [snippet]);

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
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={() => updateSnippet({id: id, updateSnippet: {content: code}})} disabled={isUpdateSnippetLoading || !snippet || snippet.content === code} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            {updateError && <Box pb={2}><ApiErrorAlert error={updateError}/></Box>}
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
            <Box pt={1} flex={1} marginTop={2}>
              <SnippetExecution snippetId={id} hasUnsavedChanges={!!snippet && snippet.content !== code}/>
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
        <TestSnippetModal open={testModalOpened} onClose={() => setTestModalOpened(false)}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

