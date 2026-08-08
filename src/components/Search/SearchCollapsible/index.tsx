import React, { useCallback, useState } from "react";
import classNames from "classnames";
import styles from "../index.module.scss";
import SearchBase from "../_components/SearchBase";
import { CollapseToggle } from "./_components/CollapseToggle";
import { ButtonProps as HsuButtonProps } from "../../Button";
import { SearchPropsWithFilter } from "../_types";

export interface SearchCollapsibleProps extends SearchPropsWithFilter {
  onCollapseToggle?: (collapse: boolean) => void;
  beforeButtonGroup?: HsuButtonProps[];
  affterButtonGroup?: HsuButtonProps[];
}

/**
 * Search component in collapsible mode
 * - The entire search area can be fully collapsed/expanded
 * - Initial expanded state is controlled via defaultExpanded
 * - Suitable for scenarios where the search bar needs to be hidden to gain more display space
 */
const SearchCollapsible: React.FC<SearchCollapsibleProps> = (props) => {
  const {
    className,
    defaultExpanded = false,
    onCollapseToggle,
    setFilter,
    ...rest
  } = props;

  // The semantics of collapse are inverted, so defaultExpanded needs to be negated
  const [collapse, setCollapse] = useState(!defaultExpanded);

  // Handle collapse toggle
  const handleCollapseToggle = useCallback(() => {
    setCollapse((prev) => {
      const newCollapse = !prev;
      onCollapseToggle?.(newCollapse);
      return newCollapse;
    });
  }, [onCollapseToggle]);

  return (
    <SearchBase
      {...rest}
      defaultExpanded={defaultExpanded}
      showFilter={!!setFilter}
      className={classNames(className, styles.collapseExpand, {
        [styles.collapse]: collapse,
      })}
      afterForm={
        <CollapseToggle collapse={collapse} onToggle={handleCollapseToggle} />
      }
    />
  );
};

export default SearchCollapsible;
