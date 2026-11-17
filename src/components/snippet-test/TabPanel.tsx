import {useEffect, useState} from "react";
import {TestCase, TestCaseDraft} from "../../types/TestCase.ts";
import {Autocomplete, Box, Button, Chip, TextField, Typography} from "@mui/material";
import {Delete, Save} from "@mui/icons-material";

type TabPanelProps = {
    index: number;
    value: number;
    test?: TestCase;
    onSave: (test: TestCaseDraft, testId?: string) => Promise<void>;
    onRemove?: (testId: string) => Promise<void>;
    saving: boolean;
}

const emptyTest = (): TestCaseDraft => ({name: "", input: [], output: []})

export const TabPanel = ({value, index, test, onSave, onRemove, saving}: TabPanelProps) => {
    const [testData, setTestData] = useState<TestCaseDraft>(test ?? emptyTest())

    useEffect(() => {
        setTestData(test ?? emptyTest())
    }, [test])

    const save = () => onSave(testData, test?.id)

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{width: '100%', height: '100%'}}
        >
            {value === index && (
                <Box sx={{px: 3}} display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Name</Typography>
                        <TextField size="small" value={testData.name}
                                   onChange={(event) => setTestData({...testData, name: event.target.value})}/>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Input</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            freeSolo
                            value={testData.input}
                            onChange={(_, input) => setTestData({...testData, input})}
                            renderTags={(values: readonly string[], getTagProps) =>
                                values.map((option: string, tagIndex: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index: tagIndex})} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params}/>} options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Output</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            freeSolo
                            value={testData.output}
                            onChange={(_, output) => setTestData({...testData, output})}
                            renderTags={(values: readonly string[], getTagProps) =>
                                values.map((option: string, tagIndex: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index: tagIndex})} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params}/>} options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="row" gap={1}>
                        {test?.id && onRemove && (
                            <Button onClick={() => onRemove(test.id)} disabled={saving} variant="outlined" color="error"
                                    startIcon={<Delete/>}>
                                Remove
                            </Button>
                        )}
                        <Button disabled={!testData.name.trim() || saving} onClick={save} variant="outlined" startIcon={<Save/>}>
                            Save
                        </Button>
                    </Box>
                </Box>
            )}
        </div>
    )
}
