import React from "react";
import SearchBase from "../_components/SearchBase";
import { ButtonProps as HsuButtonProps } from "../../Button";
import { SearchPropsWithFilter } from "../_types";

export interface SearchWithFilterProps extends SearchPropsWithFilter {
  beforeButtonGroup?: HsuButtonProps[];
  affterButtonGroup?: HsuButtonProps[];
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
