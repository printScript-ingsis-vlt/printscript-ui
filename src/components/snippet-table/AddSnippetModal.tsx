import {
    Box,
    Button,
    capitalize,
    CircularProgress,
    Input,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography
} from "@mui/material";
import {highlight, languages} from "prismjs";
import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Save} from "@mui/icons-material";
import {CreateSnippet, CreateSnippetWithLang} from "../../utils/snippet.ts";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useCreateSnippet, useCreateSnippetFromFile, useGetFileTypes} from "../../utils/queries.tsx";
import {queryClient} from "../../App.tsx";
import {ApiErrorAlert} from "../common/ApiErrorAlert.tsx";

export const AddSnippetModal = ({open, onClose, defaultSnippet}: {
    open: boolean,
    onClose: () => void,
    defaultSnippet?: CreateSnippetWithLang
}) => {
    const [language, setLanguage] = useState(defaultSnippet?.language ?? "printscript");
    const [code, setCode] = useState(defaultSnippet?.content ?? "");
    const [snippetName, setSnippetName] = useState(defaultSnippet?.name ?? "")
    const [description, setDescription] = useState(defaultSnippet?.description ?? "")
    const [version, setVersion] = useState(defaultSnippet?.version ?? "")
    const {mutateAsync: createSnippet, isLoading: loadingSnippet} = useCreateSnippet({
        onSuccess: () => queryClient.invalidateQueries('listSnippets')
    })
    const {mutateAsync: createSnippetFromFile, isLoading: loadingFileSnippet} = useCreateSnippetFromFile({
        onSuccess: () => queryClient.invalidateQueries('listSnippets')
    })
    const {data: fileTypes} = useGetFileTypes();
    const [error, setError] = useState<unknown>(null)

    const handleCreateSnippet = async () => {
        const newSnippet: CreateSnippet = {
            name: snippetName,
            description,
            content: code,
            language: language,
            version: version || undefined,
            extension: fileTypes?.find((f) => f.language === language)?.extension ?? "prs"
        }
        setError(null)
        try {
            if (defaultSnippet?.file) {
                await createSnippetFromFile({...newSnippet, file: defaultSnippet.file})
            } else {
                await createSnippet(newSnippet);
            }
        } catch (e) {
            // El modal sigue abierto con lo que escribió el usuario, y el error (con regla, línea y columna) a la vista.
            setError(e)
            return
        }
        setSnippetName("")
        setDescription("")
        setVersion("")
        setCode("")
        onClose();
    }

    const handleClose = () => {
        setError(null)
        onClose()
    }

    useEffect(() => {
        setCode(defaultSnippet?.content ?? "")
        setLanguage(defaultSnippet?.language ?? "printscript")
        setSnippetName(defaultSnippet?.name ?? "")
        setDescription(defaultSnippet?.description ?? "")
        setVersion(defaultSnippet?.version ?? "")
    }, [defaultSnippet, open]);

    return (
        <ModalWrapper open={open} onClose={handleClose}>
            {
                <Box sx={{display: 'flex', flexDirection: "row", justifyContent: "space-between"}}>
                    <Typography id="modal-modal-title" variant="h5" component="h2"
                                sx={{display: 'flex', alignItems: 'center'}}>
                        Add Snippet
                    </Typography>
                    <Button disabled={!snippetName || !code || !language || loadingSnippet || loadingFileSnippet} variant="contained"
                            disableRipple
                            sx={{boxShadow: 0}} onClick={handleCreateSnippet}>
                        <Box pr={1} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                            {loadingSnippet || loadingFileSnippet ? <CircularProgress size={24}/> : <Save/>}
                        </Box>
                        Save Snippet
                    </Button>
                </Box>
            }
            {error != null && <ApiErrorAlert error={error}/>}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel htmlFor="name">Name</InputLabel>
                <Input onChange={e => setSnippetName(e.target.value)} value={snippetName} id="name"
                       sx={{width: '50%'}}/>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <InputLabel htmlFor="description">Description</InputLabel>
                <Input onChange={e => setDescription(e.target.value)} value={description} id="description"
                       sx={{width: '100%'}}/>
            </Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel htmlFor="name">Language</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={language}
                    label="Age"
                    onChange={(e: SelectChangeEvent<string>) => setLanguage(e.target.value)}
                    sx={{width: '50%'}}
                >
                    {
                        fileTypes?.map(x => (
                            <MenuItem data-testid={`menu-option-${x.language}`} key={x.language}
                                      value={x.language}>{capitalize((x.language))}</MenuItem>
                        ))
                    }
                </Select>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <InputLabel htmlFor="version">Version</InputLabel>
                <Input onChange={e => setVersion(e.target.value)} value={version} id="version" placeholder="Latest supported"
                       sx={{width: '50%'}}/>
            </Box>
            <InputLabel>Code Snippet</InputLabel>
            <Box width={"100%"} sx={{
                backgroundColor: 'black', color: 'white', borderRadius: "8px",
            }}>
                <Editor
                    value={code}
                    padding={10}
                    data-testid={"add-snippet-code-editor"}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, 'javascript')}
                    style={{
                        borderRadius: "8px",
                        overflow: "auto",
                        minHeight: "300px",
                        maxHeight: "600px",
                        width: "100%",
                        fontFamily: "monospace",
                        fontSize: 17,
                    }}
                />
            </Box>
        </ModalWrapper>
    )
}

