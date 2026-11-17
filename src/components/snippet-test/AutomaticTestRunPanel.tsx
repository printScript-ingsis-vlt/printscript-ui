import {Box, Button, Chip, CircularProgress, Typography} from "@mui/material";
import {BugReport} from "@mui/icons-material";
import {useGetAutomaticTestRun} from "../../utils/queries.tsx";
import {AutomaticRunState, summarizeAutomaticRun} from "../../types/AutomaticTestRun.ts";
import {ApiErrorAlert} from "../common/ApiErrorAlert.tsx";

type AutomaticTestRunPanelProps = {
    snippetId: string;
    /** El editor tiene cambios sin guardar: los resultados son de la última versión guardada. */
    hasUnsavedChanges: boolean;
    onManageTests: () => void;
}

const STATE_COLOR: Record<AutomaticRunState, "default" | "info" | "success" | "error" | "warning"> = {
    "never": "default",
    "pending": "info",
    "running": "info",
    "no-tests": "default",
    "passed": "success",
    "failed": "error",
    "error": "warning",
}

const STATE_CHIP: Record<AutomaticRunState, string> = {
    "never": "Not run",
    "pending": "Pending",
    "running": "Running",
    "no-tests": "No tests",
    "passed": "Passed",
    "failed": "Failed",
    "error": "Error",
}

/**
 * US #16: muestra el resultado de la corrida automática de todos los tests que dispara cada guardado.
 * Mientras la corrida está pendiente o en curso, el hook refresca solo hasta que termina.
 */
export const AutomaticTestRunPanel = ({snippetId, hasUnsavedChanges, onManageTests}: AutomaticTestRunPanelProps) => {
    const {data: run, isLoading, error, refetch} = useGetAutomaticTestRun(snippetId)

    // El backend todavía no tiene el endpoint: no hay nada que mostrar.
    if (run === null) return null

    const summary = summarizeAutomaticRun(run)
    const inProgress = summary.state === "pending" || summary.state === "running"

    return (
        <Box data-testid="automatic-test-run" border={1} borderColor="divider" borderRadius={1} p={2}
             display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontWeight="bold">Automatic tests</Typography>
                {!isLoading && !error && (
                    <Chip size="small" label={STATE_CHIP[summary.state]} color={STATE_COLOR[summary.state]}
                          icon={inProgress ? <CircularProgress size={12} color="inherit"/> : undefined}
                          data-testid="automatic-test-run-status"/>
                )}
                <Box flex={1}/>
                <Button size="small" startIcon={<BugReport/>} onClick={onManageTests}>Manage tests</Button>
            </Box>

            {isLoading && <Typography variant="body2" color="text.secondary">Loading test results…</Typography>}
            {error && <ApiErrorAlert error={error} onRetry={() => refetch()}/>}

            {run && <>
                <Typography variant="body2" color="text.secondary">{summary.label}</Typography>
                {hasUnsavedChanges && (
                    <Typography variant="caption" color="text.secondary">
                        These results are for the last saved version. Save to run the tests again.
                    </Typography>
                )}
                {!inProgress && run.results.map(({testId, testName, result}) => (
                    <Box key={testId} data-testid="automatic-test-result" display="flex" flexDirection="column"
                         gap={0.5} pl={1} borderLeft={3}
                         borderColor={result.passed ? "success.main" : "error.main"}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Chip size="small" label={result.passed ? "Pass" : "Fail"}
                                  color={result.passed ? "success" : "error"}/>
                            <Typography variant="body2" fontWeight="bold">{testName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {result.passedCount}/{result.total} outputs matched
                            </Typography>
                        </Box>
                        {!result.passed && result.lines.filter(line => line.status === "FAIL").map(line => (
                            <Typography key={line.index} variant="caption" color="error.main">
                                Line {line.index + 1}: expected {line.expected ?? "(none)"}; got {line.actual ?? "(none)"}
                            </Typography>
                        ))}
                        {result.errors.map((message, index) => (
                            <Typography key={index} variant="caption" color="error.main">{message}</Typography>
                        ))}
                    </Box>
                ))}
            </>}
        </Box>
    )
}
