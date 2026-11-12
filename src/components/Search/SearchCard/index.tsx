import React, { CSSProperties, useRef, useMemo, memo } from "react";
import classNames from "classnames";
import styles from "./index.module.scss";
import OptionRow, {
  DEFAULT_FONT,
  ElementItem,
  SearchCardOption,
  Font,
} from "./_components/OptionRow";
import { useSearchCardValue, useSearchCardCollapse } from "./_hooks";
import { SearchBox } from "./_components/SearchBox";
import { CollapseToggle } from "./_components/CollapseToggle";
import { isLegacyHasSelectorBrowser } from "../../../utils/cssSupports";

export type { ElementItem, SearchCardOption, Font };

export interface SearchCardProps {
  options: SearchCardOption[];
  defaultValue?: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
  padding?: number;
  gap?: number;
  font?: Font;
  className?: string;
  defaultCollapse?: boolean;
  collapseExpand?: boolean;
  showSearchBox?: boolean;
  searchPlaceholder?: string;
  searchField?: string;
}

const SearchCard: React.FC<SearchCardProps> = memo((props) => {
  const {
    options,
    defaultValue,
    onChange,
    padding = 8,
    gap = 8,
    font: fontProp,
    className,
    defaultCollapse = false,
    collapseExpand = true,
    showSearchBox = false,
    searchPlaceholder,
    searchField = "",
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  // A partial font (e.g. only `size`) keeps the other defaults; stable identity avoids re-measuring every render.
  const font = useMemo<Required<Font>>(
    () => ({ ...DEFAULT_FONT, ...fontProp }),
    [fontProp?.family, fontProp?.size, fontProp?.weight]
  );
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const { value, setValue, internalValue, setInternalValue, getRealValues } =
    useSearchCardValue({
      defaultValue,
      searchField,
      options,
      onChange,
    });

  const { collapse, toggleCollapse } = useSearchCardCollapse({
    defaultCollapse,
  });

  // Handle search
  const handleSearch = () => {
    const realValues = getRealValues();
    onChange?.({ ...realValues, [searchField]: internalValue });
  };

  return (
    <div
      className={classNames(styles.SearchCard, className, {
        [styles.collapse]: collapse,
        [styles.legacyHasSearchBox]: legacyHasSelector && showSearchBox,
      })}
      style={
        {
          "--searchCard-column-gap": `${gap}px`,
          "--searchCard-padding-left-right": `${padding}px`,
          "--searchCard-font-family": font.family,
          "--searchCard-font-size": `${font.size}px`,
          "--searchCard-font-weight": font.weight,
        } as CSSProperties
      }
    >
      {showSearchBox && (
        <SearchBox
          value={internalValue}
          onChange={setInternalValue}
          onSearch={handleSearch}
          placeholder={searchPlaceholder}
        />
      )}

      <div className={styles.optionsBox} ref={ref}>
        <div className={styles.options}>
          {options?.map((option) => {
            return (
              <OptionRow
                key={option.name}
                option={option}
                value={value}
                setValue={(v) => {
                  setValue({
                    ...v,
                    [searchField]: internalValue,
                  });
                }}
                font={font}
                padding={padding}
                gap={gap}
                legacyHasSelector={legacyHasSelector}
              />
            );
          })}
        </div>
      </div>
      {collapseExpand && (
        <CollapseToggle collapse={collapse} onToggle={toggleCollapse} />
      )}
    </div>
  );
});

export default SearchCard;
