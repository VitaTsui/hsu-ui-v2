import { Popover, Space, Tabs, Tooltip } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import type { IconifyJSON } from "@iconify/react/offline";

import Icon, { addIconCollection } from "../../Icon";
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
 *
 * 传了 `icons` 走受限模式，这四套一套都不会被下载，见下面的说明。
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

/** 已知图标集的展示名。受限模式下按前缀取，取不到就直接用前缀本身当标签 */
const SET_LABELS: Record<string, string> = ICON_SETS.reduce<
  Record<string, string>
>((acc, set) => {
  acc[set.name] = set.label;
  return acc;
}, {});

interface IconSetView {
  label: string;
  name: string;
  /** 受限模式：这一组能选的图标名（不含前缀），直接来自 `icons` */
  icons?: string[];
  /** 非受限模式：整集按需加载 */
  load?: () => Promise<unknown>;
}

export interface IconSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  /**
   * 允许选择的图标全名清单（`prefix:name`，如 `ant-design:home-outlined`）。
   *
   * **不传 = 原行为**：四整套（ant-design / ep / fa / fa-solid，约 2.1 万枚）任选，
   * 左侧输入框可自由输入。
   *
   * 传了就是**受限模式**：
   * - 面板里只出现清单里的这些图标，Tabs 按清单里出现过的前缀自动分组；
   * - 左侧输入框转为只读 —— 自由输入是这个组件唯一的旁路，不关掉的话「只给能用的」
   *   就只是摆设。清空仍然可以（输入框自带清除按钮），因为「不设图标」总是合法的；
   * - 那四套整集一个字节都不会下载。
   *
   * 注意：清单里的图标要**已经注册过**才画得出来（本库自带的那批，或消费方用
   * `addIconCollection` 注册过的）。没注册的名字在面板里就是空格子，开发期控制台有警告。
   *
   * 引用最好稳定（模块级常量 / `useMemo`），每渲染新建一个数组会让分组白算一遍。
   */
  icons?: string[];
}

const IconSelect: React.FC<IconSelectProps> = (props) => {
  const { value = "", onChange, disabled, icons } = props;
  const [_value, setValue] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<string>("");
  const [activeIcon, setActiveIcon] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  /** Loaded icon-name lists, cached by set name */
  const [iconNames, setIconNames] = useState<Record<string, string[]>>({});

  /** 受限模式：传了清单（哪怕是空清单，也表示「一个都不给选」，不是「没限制」） */
  const restricted = icons !== undefined;

  const sets = useMemo<IconSetView[]>(() => {
    if (!icons) return ICON_SETS;

    // 按前缀分组，保持清单里第一次出现的顺序 —— 消费方排好的顺序就是面板的顺序
    const grouped = new Map<string, string[]>();
    for (const full of icons) {
      const sep = full.indexOf(":");
      if (sep <= 0) continue;
      const prefix = full.slice(0, sep);
      const name = full.slice(sep + 1);
      if (!name) continue;
      const list = grouped.get(prefix);
      if (list) list.push(name);
      else grouped.set(prefix, [name]);
    }

    return [...grouped].map(([prefix, names]) => ({
      label: SET_LABELS[prefix] ?? prefix,
      name: prefix,
      icons: names,
    }));
  }, [icons]);

  // 依赖用这个字符串而不是 `sets` 本身：消费方每渲染传一个新数组时，`sets` 也会是新引用，
  // 放进依赖数组就变成「每渲染必重跑」。集合列表真变了这个字符串才会变
  const setNamesKey = sets.map((set) => set.name).join(",");

  useEffect(() => {
    const names = setNamesKey ? setNamesKey.split(",") : [];
    // 当前 tab 还在就别动（受限清单变了也不该把用户正看的那一栏切走）；不在了回到第一栏
    setCurrentTab((prev) => (names.includes(prev) ? prev : (names[0] ?? "")));
  }, [setNamesKey]);

  useEffect(() => {
    if (value && value !== _value) {
      setValue(value);

      const prefix = value.split(":")[0];
      if (setNamesKey.split(",").includes(prefix)) {
        setCurrentTab(prefix);
        setActiveIcon(value);
      }
    }
  }, [value, _value, setNamesKey]);

  // Only fetch the current tab's icon names once the popover is open, and only once per set
  useEffect(() => {
    // 受限模式下能选什么完全由清单决定，那四套整集没有任何理由被下载
    if (restricted || !open || !currentTab || iconNames[currentTab]) return;

    const target = ICON_SETS.find((item) => item.name === currentTab);
    if (!target) return;

    let alive = true;
    target.load().then((module) => {
      if (!alive) return;

      const json = ((module as { default?: unknown }).default ?? module) as {
        icons: Record<string, unknown>;
      };

      // 整集已经在内存里了，顺手注册掉。不注册的话格子里一枚都画不出来
      // （渲染走 `@iconify/react/offline`，没注册过的名字就是空位）。
      // 注册是纯内存操作，不产生任何额外下载。
      addIconCollection(json as unknown as IconifyJSON);

      setIconNames((prev) => ({
        ...prev,
        [currentTab]: Object.keys(json.icons ?? {}),
      }));
    });

    return () => {
      alive = false;
    };
  }, [restricted, open, currentTab, iconNames]);

  /** 受限模式下的允许集合。非受限时不建，省掉这份内存 */
  const allowed = useMemo(
    () => (icons ? new Set(icons) : undefined),
    [icons]
  );

  const _onChange = (next: string) => {
    // 受限模式下清单说了算。`readOnly` 只是让人打不进去，这一层才是真的兜住：
    // 组件对外发出的值要么是空（「不设图标」总是合法的），要么在清单里，没有第三种。
    // 两层缺一不可 —— 只有 readOnly 的话，程序化赋值（自动填充、测试、消费方直接调
    // onChange）照样能把清单外的值送出去，「只给能用的」就又成了摆设。
    if (allowed && next !== "" && !allowed.has(next)) return;

    setValue(next);
    onChange?.(next);
  };

  return (
    // antd v6 deprecated `addonAfter` in favour of Space.Compact + Space.Addon
    <Space.Compact className={styles.iconSelect}>
      <Input
        value={_value}
        onChange={_onChange}
        disabled={disabled}
        // 受限模式下输入框只读：能选什么由清单说了算，自由输入会把这份约束整个绕过去。
        // 清除按钮是 Input 自带的，只读也在，所以「不设图标」仍然做得到
        readOnly={restricted}
        placeholder={restricted ? "点击右侧图标选择" : undefined}
      />
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
                items={sets.map((type) => ({
                  label: type.label,
                  key: type.name,
                  children: (
                    <div className={classNames(styles.typeIcon)}>
                      {(type.icons ?? iconNames[type.name] ?? [])
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
