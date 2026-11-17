import {Box, Divider, IconButton, Tab, Tabs, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useEffect, useState} from "react";
import {AddRounded} from "@mui/icons-material";
import {
  useCreateTestCase,
  useGetTestCases,
  useRemoveTestCase,
  useRunTestCase,
  useUpdateTestCase,
} from "../../utils/queries.tsx";
import {TabPanel} from "./TabPanel.tsx";
import {TestCaseDraft, TestRun} from "../../types/TestCase.ts";
import {ApiErrorAlert} from "../common/ApiErrorAlert.tsx";

type TestSnippetModalProps = {
    snippetId: string
    open: boolean
    onClose: () => void
}

export const TestSnippetModal = ({snippetId, open, onClose}: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);
    const {data: testCases = [], isLoading, error: listError} = useGetTestCases(snippetId);
    const createTest = useCreateTestCase(snippetId)
    const updateTest = useUpdateTestCase(snippetId)
    const removeTest = useRemoveTestCase(snippetId)
    const runTest = useRunTestCase(snippetId)

    useEffect(() => {
        if (value > testCases.length) setValue(testCases.length)
    }, [testCases.length, value])

    const handleChange = (_: SyntheticEvent, newValue: number) => setValue(newValue)

    const save = async (testCase: TestCaseDraft, testId?: string) => {
        try {
            if (testId) await updateTest.mutateAsync({testId, testCase})
            else await createTest.mutateAsync(testCase)
        } catch {
            // El hook conserva el error para mostrarlo arriba del formulario.
        }
    }

    const remove = async (testId: string) => {
        try {
            await removeTest.mutateAsync(testId)
            setValue(0)
        } catch {
            // El hook conserva el error para mostrarlo arriba del formulario.
        }
    }

    const run = async (testId: string): Promise<TestRun | undefined> => {
        try {
            return await runTest.mutateAsync(testId)
        } catch {
            // El hook conserva el error para mostrarlo arriba del formulario.
            return undefined
        }
    }

    const error = listError ?? createTest.error ?? updateTest.error ?? removeTest.error ?? runTest.error
    const saving = createTest.isLoading || updateTest.isLoading || removeTest.isLoading

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant={"h5"}>Test snippet</Typography>
            <Divider/>
            {error && <Box mt={2}><ApiErrorAlert error={error}/></Box>}
            <Box mt={2} display="flex">
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    aria-label="Snippet tests"
                    sx={{borderRight: 1, borderColor: 'divider'}}
                >
                    {testCases.map((testCase, index) => (
                        <Tab key={testCase.id} label={testCase.name} value={index}/>
                    ))}
                    <IconButton disableRipple onClick={() => setValue(testCases.length)} aria-label="Add test">
                        <AddRounded />
                    </IconButton>
                </Tabs>
                {isLoading ? <Typography sx={{px: 3}}>Loading tests…</Typography> : <>
                    {testCases.map((testCase, index) => (
                        <TabPanel key={testCase.id} index={index} value={value} test={testCase}
                                  onSave={save} onRemove={remove} onRun={run}
                                  saving={saving} running={runTest.isLoading}/>
                    ))}
                    <TabPanel index={testCases.length} value={value} onSave={save} saving={saving} running={false}/>
                </>}
            </Box>
        </ModalWrapper>
    )
}
