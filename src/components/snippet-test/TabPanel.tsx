import {useEffect, useState} from "react";
import {TestCase, TestCaseDraft, TestRun} from "../../types/TestCase.ts";
import {Autocomplete, Box, Button, Chip, TextField, Typography} from "@mui/material";
import {BugReport, Delete, Save} from "@mui/icons-material";

type TabPanelProps = {
    index: number;
    value: number;
    test?: TestCase;
    onSave: (test: TestCaseDraft, testId?: string) => Promise<void>;
    onRemove?: (testId: string) => Promise<void>;
    onRun?: (testId: string) => Promise<TestRun | undefined>;
    saving: boolean;
    running: boolean;
}

const emptyTest = (): TestCaseDraft => ({name: "", input: [], output: []})

export const TabPanel = ({value, index, test, onSave, onRemove, onRun, saving, running}: TabPanelProps) => {
    const [testData, setTestData] = useState<TestCaseDraft>(test ?? emptyTest())
    const [runResult, setRunResult] = useState<TestRun>()

    useEffect(() => {
        setTestData(test ?? emptyTest())
        setRunResult(undefined)
    }, [test])

    const save = () => onSave(testData, test?.id)
    const isDirty = !test || test.name !== testData.name ||
        test.input.join("\u0000") !== testData.input.join("\u0000") ||
        test.output.join("\u0000") !== testData.output.join("\u0000")

    const change = (next: TestCaseDraft) => {
        setTestData(next)
        setRunResult(undefined)
    }

    const run = async () => {
        if (!test?.id || !onRun) return
        const result = await onRun(test.id)
        if (result) setRunResult(result)
    }

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
                                   onChange={(event) => change({...testData, name: event.target.value})}/>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Input</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            freeSolo
                            value={testData.input}
                            onChange={(_, input) => change({...testData, input})}
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
                            onChange={(_, output) => change({...testData, output})}
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
                        {test?.id && onRun && (
                            <Button disabled={saving || running || isDirty} onClick={run} variant="contained" startIcon={<BugReport/>}
                                    title={isDirty ? "Save changes before running the test" : undefined}>
                                Run
                            </Button>
                        )}
                    </Box>
                    {test?.id && isDirty && <Typography variant="caption" color="text.secondary">
                        Save changes before running: the server runs the saved test.
                    </Typography>}
                    {runResult && <Box data-testid="test-run-result" border={1} borderColor="divider" borderRadius={1} p={1.5}>
                        <Box display="flex" gap={1} alignItems="center" mb={1}>
                            <Chip label={runResult.passed ? "Pass" : "Fail"} color={runResult.passed ? "success" : "error"}/>
                            <Typography variant="body2">{runResult.passedCount}/{runResult.total} outputs matched</Typography>
                        </Box>
                        {runResult.lines.map(line => (
                            <Typography key={line.index} variant="body2" color={line.status === "PASS" ? "success.main" : "error.main"}>
                                Line {line.index + 1}: expected {line.expected ?? "(none)"}; got {line.actual ?? "(none)"}
                            </Typography>
                        ))}
                        {runResult.errors.map((error, errorIndex) => (
                            <Typography key={errorIndex} variant="body2" color="error.main">{error}</Typography>
                        ))}
                    </Box>}
                </Box>
            )}
        </div>
    )
}
