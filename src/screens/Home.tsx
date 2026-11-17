import {withNavbar} from "../components/navbar/withNavbar.tsx";
import {SnippetTable} from "../components/snippet-table/SnippetTable.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useMemo, useState} from "react";
import {SnippetDetail} from "./SnippetDetail.tsx";
import {Drawer} from "@mui/material";
import {useGetSnippets} from "../utils/queries.tsx";
import {usePaginationContext} from "../contexts/paginationContext.tsx";
import useDebounce from "../hooks/useDebounce.ts";
import {ApiErrorAlert} from "../components/common/ApiErrorAlert.tsx";
import {defaultSnippetListFilters, SnippetListFilters} from "../utils/snippet.ts";

const HomeScreen = () => {
  const {id: paramsId} = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [listFilters, setListFilters] = useState<SnippetListFilters>(defaultSnippetListFilters);
  const [snippetId, setSnippetId] = useState<string | null>(null)
  const {page, page_size, count, handleChangeCount, handleGoToPage} = usePaginationContext()
  const filters = useMemo(
      () => ({...listFilters, name: snippetName || undefined}),
      [listFilters, snippetName],
  )
  const {data, isLoading, isError, error, refetch} = useGetSnippets(page, page_size, filters)

  useEffect(() => {
    // Con 0 resultados también hay que actualizar el total (si no, el paginador queda con el valor anterior).
    if (data && data.count != count) {
      handleChangeCount(data.count)
    }
  }, [count, data, handleChangeCount]);


  useEffect(() => {
    if (paramsId) {
      setSnippetId(paramsId);
    }
  }, [paramsId]);

  const handleCloseModal = () => setSnippetId(null)

  // DeBounce Function
  useDebounce(() => {
        setSnippetName(searchTerm);
        handleGoToPage(0)
      }, [searchTerm], 800
  );

  const handleSearchSnippet = (snippetName: string) => {
    setSearchTerm(snippetName);
  };

  const handleFiltersChange = (changes: Partial<SnippetListFilters>) => {
    setListFilters(current => ({...current, ...changes}))
    handleGoToPage(0)
  }

  return (
      <>
        {isError && <ApiErrorAlert error={error} onRetry={() => refetch()}/>}
        <SnippetTable loading={isLoading} handleClickSnippet={setSnippetId} snippets={data?.snippets}
                      filters={filters} onFiltersChange={handleFiltersChange}
                      handleSearchSnippet={handleSearchSnippet}/>
        <Drawer open={!!snippetId} anchor={"right"} onClose={handleCloseModal}>
          {snippetId && <SnippetDetail handleCloseModal={handleCloseModal} id={snippetId}/>}
        </Drawer>
      </>
  )
}

export default withNavbar(HomeScreen);

