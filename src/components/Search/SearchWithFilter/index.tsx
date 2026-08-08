import React from "react";
import SearchBase from "../_components/SearchBase";
import { BasicButtonProps } from "../../Button";
import { SearchPropsWithFilter } from "../_types";

export interface SearchWithFilterProps extends SearchPropsWithFilter {
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
}

/**
 * Search component with filter settings
 * - Provides a dropdown menu allowing users to dynamically choose which search items are displayed
 * - Users can customize the displayed search fields
 * - Offers a more flexible search experience
 */
const SearchWithFilter: React.FC<SearchWithFilterProps> = (props) => {
  return <SearchBase {...props} showFilter />;
};

export default SearchWithFilter;
