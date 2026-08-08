import React, { useEffect, useState } from "react";
import { Dropdown } from "antd";
import Checkbox from "../../../Checkbox";
import Icon from "../../../Icon";
import { FormItemProps } from "../../../FormItem";
import styles from "../../index.module.scss";
import Button from "../../../Button";

interface FilterDropdownProps {
  searchItems: FormItemProps[];
  originalSearchItems: FormItemProps[];
  setSearchItems: (items: FormItemProps[]) => void;
  onFilterChange?: (items: FormItemProps[]) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  searchItems,
  originalSearchItems,
  setSearchItems,
  onFilterChange,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpen(false);
    };
    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return (
    <Dropdown
      open={open}
      classNames={{ root: styles.filterDropdown }}
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        onClick: (e) => {
          e.domEvent.stopPropagation();
        },
        items: [
          {
            key: "1",
            label: (
              <div className={styles.filterDropdownItem}>
                <Checkbox
                  indeterminate={
                    searchItems.some((item) => item.visible) &&
                    !searchItems.every((item) => item.visible)
                  }
                  checked={searchItems.every((item) => item.visible)}
                  onChange={(e) => {
                    const newItems = searchItems?.map((item) => ({
                      ...item,
                      visible: e.target.checked,
                    }));
                    setSearchItems(newItems);
                    onFilterChange?.(newItems);
                  }}
                >
                  全选
                </Checkbox>

                <Icon
                  icon="basil:refresh-solid"
                  className={styles.filterDropdownItemIcon}
                  onClick={(e) => {
                    e.stopPropagation();

                    const newItems = originalSearchItems?.map((i) => ({
                      ...i,
                      visible:
                        typeof i.visible === "boolean" ? i.visible : true,
                    }));
                    setSearchItems(newItems);
                    onFilterChange?.(newItems);
                  }}
                />
              </div>
            ),
          },
          {
            type: "divider",
          },
          ...(searchItems || []).map((i) => {
            return {
              label: (
                <Checkbox
                  checked={i.visible}
                  onChange={(e) => {
                    e.stopPropagation();

                    const newItems = searchItems?.map((item) => {
                      if (item.name === i.name) {
                        return {
                          ...item,
                          visible: e.target.checked,
                        };
                      }
                      return item;
                    });
                    setSearchItems(newItems);
                    onFilterChange?.(newItems);
                  }}
                >
                  {i.label}
                </Checkbox>
              ),
              key: i.name,
            };
          }),
        ],
      }}
    >
      <Button
        icon={<Icon icon="solar:settings-linear" />}
        onClick={(e) => {
          e.stopPropagation();

          setOpen(!open);
        }}
      >
        设置
      </Button>
    </Dropdown>
  );
};
