import { Popover, Space, Tabs, Tooltip } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  /**
   * 当前图标全名。三种入参各是一种意思，**不要混用**：
   *
   * - **一次都不传** → 不受控，值由组件自己记着，外部不会把它冲掉；
   * - **传 `null` 或 `""`** → 受控地表示「没有图标」，输入框会跟着清空；
   * - **传字符串** → 受控地表示选中了它。
   *
   * `null` 单列出来是因为可空字段常常直接从后端原样传下来；它和 `""` 同义。
   * `undefined` 则是「没给」——`Form.resetFields()` 把字段重置成的就是它，
   * 所以**值变成 `undefined` 也会清空**，而不是被当成「外部没在控」。
   */
  value?: string | null;
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
   *   就只是摆设。清空仍然可以（组件自己渲染的那枚清除按钮），因为「不设图标」总是合法的；
   * - 那四套整集一个字节都不会下载。
   *
   * 注意：清单里的图标要**已经注册过**才画得出来（本库自带的那批，或消费方用
   * `addIconCollection` 注册过的）。没注册的名字在面板里就是空格子，开发期控制台有警告。
   *
   * 引用最好稳定（模块级常量 / `useMemo`），每渲染新建一个数组会让分组白算一遍。
   */
  icons?: string[];
  /**
   * 图标面板开合时叫一声。面板的开合状态组件自己记着（受控给 antd `Popover`），
   * 这个回调只是把结果告诉外面，不参与决定开不开。
   */
  onOpenChange?: (open: boolean) => void;
}

const IconSelect: React.FC<IconSelectProps> = (props) => {
  // 这里**不能**给 `value` 兜一个 `= ""` 的默认值：那会把「一次都没给过」（undefined）
  // 和「给了空」（""）折叠成同一个值，下面的同步就只剩「猜」这一条路了
  const { value, onChange, disabled, icons, onOpenChange } = props;
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

  /**
   * 外部值最近一次是什么。初值必须是 `undefined` —— 不受控时 `value` 也永远是
   * `undefined`，两者恒等，下面那个 effect 就一次都不会去动内部值
   */
  const prevValueRef = useRef<string | null | undefined>(undefined);

  /**
   * 外部 `value` → 内部值的同步。
   *
   * 判据是「**这个 prop 变了没有**」，不是「这个值真不真」。
   *
   * 旧写法是 `if (value && value !== _value)`，靠真值判断来猜「父级到底在不在控这个值」——
   * 之所以要猜，是因为上面那个 `value = ""` 的默认值已经把 `undefined` 和 `""` 抹平了。
   * 代价是父级把值重置为空的三种写法（`""` / `undefined` / `null`）一条都同步不下来，
   * 输入框会留着上一次的图标名：`Form.resetFields()`、切换编辑对象、弹窗复用同一个实例
   * 走的都是这条路，清除按钮发出的 `""` 被父级回写时也走这条路。
   *
   * 现在三种入参各归各位：
   * - 一次都没给过 → `value` 恒为 `undefined`，与 ref 初值相同，内部值不被外部冲掉；
   * - 给了 `null` / `""` → 「没有图标」，同步成空串；
   * - 给了字符串 → 同步成它。
   *
   * 这跟本库 `Input` 的做法是同一套（`components/Input/index.tsx` 的 `prevValueRef`），
   * 不是另起一份判断。
   */
  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;

    // `null` 与 `undefined` 都是「没有图标」，统一成空串
    const next = value ?? "";
    setValue(next);

    if (!next) {
      // 外部清空了，面板里上一枚的高亮也要撤掉，不然「值空了但面板还亮着」
      setActiveIcon("");
      return;
    }

    const prefix = next.split(":")[0];
    if (setNamesKey.split(",").includes(prefix)) {
      setCurrentTab(prefix);
      setActiveIcon(next);
    }
  }, [value, setNamesKey]);

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

  /**
   * 受限模式下「清空」的唯一入口。
   *
   * 为什么不用 Input 自带的那枚：`allowClear` 的清除按钮由 `@rc-component/input`
   * 的 `BaseInput` 渲染，而它算可见性时把 `readOnly` 一起判死了 ——
   * `needClear = !disabled && !readOnly && value && …`（BaseInput.js:67），
   * 不满足就挂上 `ant-input-clear-icon-hidden`（同文件 :81），antd 给这个类的样式是
   * `visibility: hidden`。**只读 ＋ 自带清除按钮，这两件事在当前依赖版本下不能共存。**
   *
   * 这不是 rc 的 bug，是 `readOnly` 的语义本来就是「用户不能改这个值」，清空也是改。
   * 所以受限模式关掉 `allowClear`，清除按钮由本组件自己渲染 —— 跟 antd 自家 Select
   * 的做法一致（只读的 combobox input ＋ 自己画的 `.ant-select-clear`）。
   *
   * 按钮常驻、没得清时只是 `visibility: hidden`：受限模式的输入框任何时候都带 affix
   * 包裹层，宽度不会因为有没有选中图标而跳一下。
   */
  const clearable = restricted && !disabled && !!_value;

  const onClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 别让这一下冒泡到外层去；面板的高亮也要跟着撤，不然清空后面板里还亮着上一枚
    e.stopPropagation();
    setActiveIcon("");
    _onChange("");
  };

  return (
    // antd v6 deprecated `addonAfter` in favour of Space.Compact + Space.Addon
    <Space.Compact className={styles.iconSelect}>
      <Input
        value={_value}
        onChange={_onChange}
        disabled={disabled}
        // 受限模式下输入框只读：能选什么由清单说了算，自由输入会把这份约束整个绕过去。
        // `readOnly` 是浏览器原生的，键盘、粘贴、拖放、输入法组字、密码管理器自动填充
        // 一次全挡住，读屏软件也会念出「只读」—— 用 onKeyDown / beforeinput 拦是拦不全的
        // （`insertCompositionText` 按规范就不可取消，中文输入法照样能打进去）。
        // 代价是自带的清除按钮会被一起判死，所以受限模式下关掉 allowClear、自己画一枚，
        // 见上面 `onClear` 处的说明。
        readOnly={restricted}
        allowClear={!restricted}
        suffix={
          restricted ? (
            <button
              type="button"
              aria-label="清除图标"
              aria-hidden={!clearable}
              tabIndex={clearable ? 0 : -1}
              className={classNames(styles.clear, {
                [styles.clearHidden]: !clearable,
              })}
              onClick={onClear}
            >
              <Icon icon="ant-design:close-circle-filled" />
            </button>
          ) : undefined
        }
        placeholder={restricted ? "点击右侧图标选择" : undefined}
      />
      <Space.Addon>
        <Popover
          placement="bottom"
          trigger="click"
          zIndex={1000}
          open={open}
          onOpenChange={(visible) => {
            setOpen(visible);
            onOpenChange?.(visible);
          }}
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
