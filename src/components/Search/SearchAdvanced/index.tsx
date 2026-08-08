import React from "react";
import classNames from "classnames";
import styles from "../index.module.scss";
import SearchBase from "../_components/SearchBase";
import { AdvancedFiltersDrawer } from "./_components/AdvancedFiltersDrawer";
import { BasicButtonProps } from "../../Button";
import { DrawerFormProps } from "../../Form/DrawerForm";
import { SearchPropsWithFilter } from "../_types";

export interface SearchAdvancedProps extends SearchPropsWithFilter {
  advancedFiltersProps?: DrawerFormProps;
  beforeButtonGroup?: BasicButtonProps[];
  affterButtonGroup?: BasicButtonProps[];
}

/**
 * Search component in advanced filters mode
 * - Does not display labels
 * - Uses a drawer to present additional filter items
 * - Better suited for complex filtering scenarios
 */
const SearchAdvanced: React.FC<SearchAdvancedProps> = (props) => {
  const {
    className,
    advancedFiltersProps,
    setFilter,
    minLabelWidth,
    ...rest
  } = props;

  return (
    <SearchBase
      {...rest}
      minLabelWidth={minLabelWidth}
      advancedFilters
      showFilter={!!setFilter}
      className={classNames(className, styles.advancedFilters)}
      renderOutside={(ctx) =>
        ctx.setExpand && (
          <AdvancedFiltersDrawer
            expand={ctx.expand}
            setExpand={ctx.setExpand}
            searchItems={ctx.processedSearchItems}
            form={ctx.form}
            getLabelWidth={ctx.getLabelWidth}
            minLabelWidth={minLabelWidth}
            onSearchClick={ctx.onSearchClick}
            onResetClick={ctx.onResetClick}
            advancedFiltersProps={advancedFiltersProps}
          />
        )
      }
    />
  );
};

export default SearchAdvanced;
