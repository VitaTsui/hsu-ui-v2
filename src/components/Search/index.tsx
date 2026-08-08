import React from "react";
import SearchCard, { SearchCardProps } from "./SearchCard";
import SearchAdvanced from "./SearchAdvanced";
import SearchCollapsible from "./SearchCollapsible";
import SearchWithFilter from "./SearchWithFilter";
import SearchWithMore from "./SearchWithMore";
import SearchBase from "./_components/SearchBase";
import { BaseSearchProps } from "./_types";
import { BasicButtonProps } from "../Button";

export interface SearchProps extends BaseSearchProps {
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
}

interface SearchFC extends React.FC<SearchProps> {
  Card: React.FC<SearchCardProps>;
  Advanced: typeof SearchAdvanced;
  Collapsible: typeof SearchCollapsible;
  WithFilter: typeof SearchWithFilter;
  WithMore: typeof SearchWithMore;
}

// Export all available Search mode key names
export type SearchModeKeys =
  | "Default"
  | keyof Omit<SearchFC, keyof React.FC<SearchProps>>;

// Export the Search mode props mapping type
export type SearchModePropsMap = {
  Default: SearchProps;
  Card: React.ComponentProps<SearchFC["Card"]>;
  Advanced: React.ComponentProps<SearchFC["Advanced"]>;
  Collapsible: React.ComponentProps<SearchFC["Collapsible"]>;
  WithFilter: React.ComponentProps<SearchFC["WithFilter"]>;
  WithMore: React.ComponentProps<SearchFC["WithMore"]>;
};

/**
 * Base Search component
 * - Standard search form layout with adaptive column count and expand/collapse
 */
const Search: SearchFC = (props) => {
  return <SearchBase {...props} />;
};

Search.Card = SearchCard;
Search.Advanced = SearchAdvanced;
Search.Collapsible = SearchCollapsible;
Search.WithFilter = SearchWithFilter;
Search.WithMore = SearchWithMore;

export default Search;
