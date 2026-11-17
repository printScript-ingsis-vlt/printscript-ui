import {
  Box,
  Button,
  capitalize,
  IconButton,
  InputBase,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import {AddSnippetModal} from "./AddSnippetModal.tsx";
import {useRef, useState} from "react";
import {Add, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow.tsx";
import {
  ComplianceEnum,
  CreateSnippetWithLang,
  getFileLanguage,
  Snippet,
  SnippetListFilters,
  SnippetRelation,
  SnippetSortField
} from "../../utils/snippet.ts";
import {usePaginationContext} from "../../contexts/paginationContext.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (snippetName: string) => void;
  filters: SnippetListFilters;
  onFiltersChange: (changes: Partial<SnippetListFilters>) => void;
}

export const SnippetTable = (props: SnippetTableProps) => {
  const {snippets, handleClickSnippet, loading, handleSearchSnippet, filters, onFiltersChange} = props;
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverMenuOpened, setPopoverMenuOpened] = useState(false)
  const [snippet, setSnippet] = useState<CreateSnippetWithLang | undefined>()

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {page, page_size: pageSize, count, handleChangePageSize, handleGoToPage} = usePaginationContext()
  const {createSnackbar} = useSnackbarContext()
  const {data: fileTypes} = useGetFileTypes();

  const handleLoadSnippet = async (target: EventTarget & HTMLInputElement) => {
    const files = target.files
    if (!files || !files.length) {
      createSnackbar('error',"Please select at leat one file")
      return
    }
    const file = files[0]
    const splitName = file.name.split(".")
    const fileType = getFileLanguage(fileTypes ?? [], splitName.at(-1))
    if (!fileType) {
      createSnackbar('error', `File type ${splitName.at(-1)} not supported`)
      return
    }
    file.text().then((text) => {
      setSnippet({
        name: splitName[0],
        description: "",
        content: text,
        language: fileType.language,
        version: "",
        file,
        extension: fileType.extension
      })
    }).catch(e => {
      console.error(e)
    }).finally(() => {
      setAddModalOpened(true)
      target.value = ""
    })
  }

  function handleClickMenu() {
    setPopoverMenuOpened(false)
  }

  const handleSort = (field: SnippetSortField) => {
    onFiltersChange({
      sort: field,
      order: filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc',
    })
  }

  const sortLabel = (field: SnippetSortField, label: string) => (
      <TableSortLabel
          active={filters.sort === field}
          direction={filters.sort === field ? filters.order : 'asc'}
          onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
  )

  return (
      <>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Box sx={{background: 'white', width: '30%', display: 'flex'}}>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder="Search by name"
                inputProps={{'aria-label': 'search'}}
                onChange={e => handleSearchSnippet(e.target.value)}
            />
            <IconButton type="button" sx={{p: '10px'}} aria-label="search">
              <Search/>
            </IconButton>
          </Box>
          <Button ref={popoverRef} variant="contained" disableRipple sx={{boxShadow: 0}}
                  onClick={() => setPopoverMenuOpened(true)}>
            <Add/>
            Add Snippet
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" gap={2} mt={2}>
          <FormControl size="small" sx={{minWidth: 170}}>
            <InputLabel id="snippet-relation-label">Snippets</InputLabel>
            <Select
                labelId="snippet-relation-label"
                value={filters.relation}
                label="Snippets"
                onChange={(event: SelectChangeEvent<SnippetRelation>) => onFiltersChange({
                  relation: event.target.value as SnippetRelation,
                })}
            >
              <MenuItem value="all">All snippets</MenuItem>
              <MenuItem value="owned">My snippets</MenuItem>
              <MenuItem value="shared">Shared with me</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{minWidth: 170}}>
            <InputLabel id="snippet-language-label">Language</InputLabel>
            <Select
                labelId="snippet-language-label"
                value={filters.language ?? ""}
                label="Language"
                onChange={(event: SelectChangeEvent<string>) => onFiltersChange({language: event.target.value || undefined})}
            >
              <MenuItem value="">All languages</MenuItem>
              {fileTypes?.map(fileType => (
                  <MenuItem key={fileType.language} value={fileType.language}>{capitalize(fileType.language)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{minWidth: 170}}>
            <InputLabel id="snippet-compliance-label">Conformance</InputLabel>
            <Select
                labelId="snippet-compliance-label"
                value={filters.compliance ?? ""}
                label="Conformance"
                onChange={(event: SelectChangeEvent<string>) => onFiltersChange({
                  compliance: (event.target.value || undefined) as ComplianceEnum | undefined,
                })}
            >
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="compliant">Compliant</MenuItem>
              <MenuItem value="not-compliant">Not compliant</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Table size="medium" sx={{borderSpacing: "0 10px", borderCollapse: "separate"}}>
          <TableHead>
            <TableRow sx={{fontWeight: 'bold'}}>
              <StyledTableCell sx={{fontWeight: "bold"}}>{sortLabel('name', 'Name')}</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>{sortLabel('language', 'Language')}</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>Author</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>{sortLabel('compliance', 'Conformance')}</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>{
            loading ? (
                <>
                  {Array.from({length: 10}).map((_, index) => (
                      <LoadingSnippetRow key={index}/>
                  ))}
                </>
            ) : (
                <>
                  {
                      snippets && snippets.map((snippet) => (
                          <SnippetRow data-testid={"snippet-row"}
                                      onClick={() => handleClickSnippet(snippet.id)} key={snippet.id} snippet={snippet}/>
                      ))
                  }
                </>
            )
          }
          </TableBody>
          <TablePagination count={count} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, page) => handleGoToPage(page)}
                           onRowsPerPageChange={e => handleChangePageSize(Number(e.target.value))}/>
        </Table>
        <AddSnippetModal defaultSnippet={snippet} open={addModalOpened}
                         onClose={() => {
                           setAddModalOpened(false)
                           setSnippet(undefined)
                         }}/>
        <Menu anchorEl={popoverRef.current} open={popoverMenuOpened} onClick={handleClickMenu}>
          <MenuItem onClick={() => {
            setSnippet(undefined)
            setAddModalOpened(true)
          }}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef?.current?.click()}>Load snippet from file</MenuItem>
        </Menu>
        <input hidden type={"file"} ref={inputRef} multiple={false} data-testid={"upload-file-input"}
               onChange={e => handleLoadSnippet(e?.target)}/>
      </>
  )
}


export const StyledTableCell = styled(TableCell)`
    border: 0;
    align-items: center;
`
