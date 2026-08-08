import React from "react";
import { FormItemProps } from "../../FormItem";
import SearchBase from "../_components/SearchBase";
import { BasicButtonProps } from "../../Button";
import { SearchPropsWithFilter } from "../_types";

export interface SearchWithMoreProps
  extends Omit<SearchPropsWithFilter, "moreSearchItems"> {
  moreSearchItems: FormItemProps[];
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
}

/**
 * Search component with a "more items" section
 * - Splits search items into a basic group and a "more" group
 * - Only basic items are shown initially; expanding reveals the rest
 * - Suitable for pages with a large number of search fields
 */
const SearchWithMore: React.FC<SearchWithMoreProps> = (props) => {
  const { setFilter, ...rest } = props;

  return (
    <SearchBase
      {...rest}
      // SearchWithMore always shows all search items
      showAllSearchItems
      showFilter={!!setFilter}
    />
  );
};

export default SearchWithMore;
