import { Popover, Space, Tabs, Tooltip } from "antd";
import React, { useEffect, useState } from "react";

import Icon from "../../Icon";
import Input from "../../Input";
import styles from "./index.module.scss";
import classNames from "classnames";

/**
 * The four selectable icon sets are loaded on demand.
 *
 * Together these JSON files weigh about 1.9 MB, and a static import drags them into the
 * initial bundle along with IconSelect:
 *
 *   FormItem → FormSelect → IconSelect → @iconify/json/json/*.json
 *
 * Only pages like menu management ever actually open the icon picker, so the set metadata
 * and the icon-name list are split apart: label / name stay static (the Tabs must render
 * immediately), and the matching set is fetched for the current tab once the popover opens.
 */
const ICON_SETS: Array<{
  label: string;
  name: string;
  load: () => Promise<unknown>;
}> = [
  {
    label: "Ant Design",
    name: "ant-design",
    load: () => import("@iconify/json/json/ant-design.json"),
  },
  {
    label: "Element Plus",
    name: "ep",
    load: () => import("@iconify/json/json/ep.json"),
  },
  {
    label: "Font Awesome 4",
    name: "fa",
    load: () => import("@iconify/json/json/fa.json"),
  },
  {
    label: "Font Awesome 5 Solid",
    name: "fa-solid",
    load: () => import("@iconify/json/json/fa-solid.json"),
  },
];

export interface IconSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const IconSelect: React.FC<IconSelectProps> = (props) => {
  const { value = "", onChange, disabled } = props;
  const [_value, setValue] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<string>("");
  const [activeIcon, setActiveIcon] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  /** Loaded icon-name lists, cached by set name */
  const [iconNames, setIconNames] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setCurrentTab(ICON_SETS[0].name);
  }, []);

  useEffect(() => {
    if (value && value !== _value) {
      setValue(value);

      if (ICON_SETS.find((item) => item.name === value.split(":")[0])) {
        setCurrentTab(value.split(":")[0]);
        setActiveIcon(value);
      }
    }
  }, [value, _value]);

  // Only fetch the current tab's icon names once the popover is open, and only once per set
  useEffect(() => {
    if (!open || !currentTab || iconNames[currentTab]) return;

    const target = ICON_SETS.find((item) => item.name === currentTab);
    if (!target) return;

    let alive = true;
    target.load().then((module) => {
      if (!alive) return;

      const json = ((module as { default?: unknown }).default ?? module) as {
        icons: Record<string, unknown>;
      };

      setIconNames((prev) => ({
        ...prev,
        [currentTab]: Object.keys(json.icons ?? {}),
      }));
    });

    return () => {
      alive = false;
    };
  }, [open, currentTab, iconNames]);

  const _onChange = (value: string) => {
    setValue(value);
    onChange?.(value);
  };

  return (
    // antd v6 deprecated `addonAfter` in favour of Space.Compact + Space.Addon
    <Space.Compact className={styles.iconSelect}>
      <Input value={_value} onChange={_onChange} disabled={disabled} />
      <Space.Addon>
        <Popover
          placement="bottom"
          trigger="click"
          zIndex={1000}
          open={open}
          onOpenChange={setOpen}
          content={
            <div className={styles.popoverContent}>
              <Input
                value={search}
                onChange={setSearch}
                placeholder="搜索"
                style={{ height: "40px" }}
              />
              <Tabs
                className={styles.tabs}
                activeKey={currentTab}
                onChange={(key) => {
                  setCurrentTab(key);
                }}
                items={ICON_SETS.map((type) => ({
                  label: type.label,
                  key: type.name,
                  children: (
                    <div className={classNames(styles.typeIcon)}>
                      {(iconNames[type.name] ?? [])
                        .filter((i) => i.includes(search))
                        .map((item: string) => {
                          return (
                            <Tooltip
                              key={item}
                              title={type.name + ":" + item}
                              placement="top"
                            >
                              <div
                                className={classNames(styles.iconItem, {
                                  [styles.active]:
                                    activeIcon === type.name + ":" + item,
                                })}
                                onClick={() => {
                                  setActiveIcon(type.name + ":" + item);

                                  _onChange(type.name + ":" + item);
                                }}
                              >
                                <Icon icon={type.name + ":" + item} />
                              </div>
                            </Tooltip>
                          );
                        })}
                    </div>
                  ),
                }))}
              />
            </div>
          }
        >
          <div className={styles.iconShow}>
            <Icon icon={_value} />
          </div>
        </Popover>
      </Space.Addon>
    </Space.Compact>
  );
};

export default IconSelect;
