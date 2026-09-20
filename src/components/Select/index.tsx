import {
  ConfigProvider,
  Select as AntdSelect,
  SelectProps as AntdSelectProps,
} from "antd";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SelectRef } from "../../types/antd";
import { DefaultOptionType } from "antd/es/select";
import Icon from "../Icon";
import classNames from "classnames";
import styles from "./index.module.scss";
import { useSelectComposition, useSelectPopupMetrics } from "./_hooks";
import {
  buildSelectPopupPlacements,
  calculatePopupWidth,
  filterOption,
} from "./_utils";
import { Prefix } from "./_components/Prefix";
import { Suffix } from "./_components/Suffix";
import { isLegacyHasSelectorBrowser } from "../../utils/cssSupports";
import TreeSelect from "./TreeSelect";
import AutoCompleteSelect from "./AutoCompleteSelect";
import IconSelect from "./IconSelect";

export interface SelectOption<T = number | string> {
  label: string;
  value: T;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface SelectProps extends Omit<
  AntdSelectProps,
  "placement" | "filterOption"
> {
  prefix?: ReactNode;
  suffix?: ReactNode;
  selectClassName?: string;
  arrowAnimation?: boolean;
  popupMatchContentWidth?: boolean;
  placement?: "bottomLeft" | "topLeft";
  filterOption?: (searchValue: string, option?: DefaultOptionType) => boolean;
  options?: SelectOption[];
  optionFontSize?: number;
  valueInlabel?: "before" | "after";
}

interface SelectFC extends React.FC<SelectProps> {
  /** 树形选择器 */
  Tree: typeof TreeSelect;
  /** 自动补全选择器 */
  AutoComplete: typeof AutoCompleteSelect;
  /** 图标选择器 */
  Icon: typeof IconSelect;
  /** antd 的 `Select.Option`，供 JSX 写法（本库更推荐用 `options` 属性） */
  Option: typeof AntdSelect.Option;
  /** antd 的 `Select.OptGroup` */
  OptGroup: typeof AntdSelect.OptGroup;
}

const Select = ((props: SelectProps) => {
  const {
    prefix,
    suffix,
    className,
    selectClassName,
    arrowAnimation = true,
    onFocus,
    onBlur,
    onSearch,
    disabled,
    mode,
    popupMatchSelectWidth,
    popupMatchContentWidth,
    popupClassName,
    placement = "bottomLeft",
    filterOption: customFilterOption,
    onChange,
    options = [],
    optionFontSize = 14,
    valueInlabel,
    optionRender,
    labelRender,
    suffixIcon: customSuffixIcon,
    onOpenChange,
    ...antdSelctConfig
  } = props;
  const [focused, setFocused] = useState<boolean>(false);
  const ref = useRef<SelectRef | null>(null);
  /* antd 自己的触发节点（`.ant-select`）。浮层的横向定位由 antd 对着它算，而外壳比它
     宽出一圈边框＋内边距（有 prefix 时更多），所以要量一次这个差补给 antd。
     `BaseSelectRef.nativeElement` 就是那个根节点，回调 ref 在**提交阶段**执行，
     早于 `useSelectPopupMetrics` 的 `useLayoutEffect`，首开就已经量得到。 */
  const triggerRef = useRef<HTMLElement | null>(null);
  const attachSelect = useCallback((instance: SelectRef | null) => {
    ref.current = instance;
    triggerRef.current =
      (instance?.nativeElement as HTMLElement | undefined) ?? null;
  }, []);
  const selectRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  /** 外壳装饰区被按下时的 `open`；null 表示这一次按下不归外壳管（落在 antd 自己的区域里） */
  const openAtPressRef = useRef<boolean | null>(null);
  const [legacyHasErrorStatus, setLegacyHasErrorStatus] =
    useState<boolean>(false);
  const [legacyHasArrowOrClear, setLegacyHasArrowOrClear] =
    useState<boolean>(true);
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const { isComposing } = useSelectComposition({ onSearch });

  /* 浮层宽度按**外壳**（`.select` 那层带边框与 11px 内边距的 div）给，横向位置则整条
     交给 antd —— 只把「外壳比 antd 触发节点宽出来的那一圈」量出来，做成定位表里的
     `offset` 补给 antd。从前是量出外壳 left 再用 `styles.popup.root.left` 盖掉 antd
     那一份，连带把横向贴边收拢（`adjustX`）一起盖没了。详见 `useSelectPopupMetrics`。 */
  const {
    width: selectWidth,
    insetStart,
    insetEnd,
  } = useSelectPopupMetrics(selectRef, triggerRef, open);
  const { popupOverflow } = useContext(ConfigProvider.ConfigContext);
  const builtinPlacements = useMemo(
    () => buildSelectPopupPlacements(insetStart, insetEnd, popupOverflow),
    [insetStart, insetEnd, popupOverflow],
  );

  const calculatedPopupWidth = popupMatchContentWidth
    ? calculatePopupWidth({
        options,
        selectWidth,
        mode,
        optionFontSize,
        valueInlabel,
      })
    : selectWidth;

  useEffect(() => {
    if (!legacyHasSelector) {
      return;
    }

    const container = selectRef.current;
    if (!container) {
      return;
    }

    const selectNode = container.querySelector(
      `.${styles.antdSelect}`,
    ) as HTMLElement | null;
    if (!selectNode) {
      return;
    }

    const updateLegacyStates = () => {
      setLegacyHasErrorStatus(
        selectNode.classList.contains("ant-select-status-error"),
      );

      let hasArrowOrClear = false;
      const children = selectNode.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (
          child.classList.contains("ant-select-arrow") ||
          child.classList.contains("ant-select-clear")
        ) {
          hasArrowOrClear = true;
          break;
        }
      }

      setLegacyHasArrowOrClear(hasArrowOrClear);
    };

    updateLegacyStates();

    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(updateLegacyStates);
    observer.observe(selectNode, {
      attributes: true,
      childList: true,
      subtree: false,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [legacyHasSelector, open]);

  return (
    <div
      className={classNames({
        [styles.select]: true,
        [className ?? ""]: true,
        [styles.focused]: focused,
        [styles.disabled]: disabled,
        [styles.popupMatchContentWidth]: popupMatchContentWidth,
        [styles.legacyHasErrorStatus]:
          legacyHasSelector && legacyHasErrorStatus,
      })}
      onFocus={
        mode
          ? () => {
              ref.current?.focus();
              setOpen(true);
            }
          : undefined
      }
      onBlur={
        mode
          ? () => {
              setOpen(false);
            }
          : undefined
      }
      /* 只认「外壳自己」的那一圈内边距。
         外壳是画在 antd 选择器外面的一层边框 ＋ 左右 11px 内边距，那一圈 antd 收不到点击，
         所以由这里补一次开合。但它**不能**对着整棵子树无条件翻转 `open`：
         下拉浮层由 `getPopupContainer` 挂在这个外壳里面，清除按钮（✕）也在 antd 选择器里，
         点它们都会冒泡到这里。从前这里写的是 `setOpen(!open)`，于是点 ✕ 清空值
         反而把浮层**打开**，而浮层是 position: fixed 贴在控件正下方的 —— 在成员列表这类
         纵向堆叠的表单里，它正好盖住下一行的下拉框（实测行距 102px、浮层高 104px），
         用户以为在点第 2 行，点到的是第 1 行的选项，值就写到了第 1 行头上。
         所以这里把「外壳自己的装饰区」（内边距 ＋ prefix / suffix）和「antd 自己的区域」
         （选择器与浮层）划成互不相交的两块：前者归这里，后者归 antd（见下面的
         onOpenChange），不再两套判断并存。

         开合按 **mousedown 那一刻**的状态翻转，不按 click 那一刻：
         装饰区在 antd 的触发元素之外，rc-trigger 会把这里的 mousedown 当成「点了外面」
         而先把浮层关掉（React 的事件挂在根容器上，早于 rc-trigger 挂在 document 上的监听），
         等 click 跑到这里时 `open` 已经是 false，再翻转就等于又把它打开 —— 表现是点内边距
         关不掉浮层。存一份按下时的状态，就是「按用户当时看到的样子翻转」。 */
      onMouseDown={
        !mode
          ? (e) => {
              const target = e.target as Element | null;
              openAtPressRef.current = target?.closest(
                ".ant-select, .ant-select-dropdown",
              )
                ? null
                : open;
            }
          : undefined
      }
      onClick={
        !mode
          ? () => {
              const openAtPress = openAtPressRef.current;
              openAtPressRef.current = null;
              if (openAtPress === null) {
                return;
              }
              ref.current?.focus();
              setOpen(!openAtPress);
            }
          : undefined
      }
      ref={selectRef}
    >
      {prefix && <Prefix prefix={prefix} />}
      <AntdSelect
        {...{
          allowClear: true,
          showSearch: true,
          ...antdSelctConfig,
          mode,
          open,
          /* `open` 是受控的，不把 antd 的开合请求接回来，antd 就**永远关不掉浮层**：
             Esc、点外面、选中一项、点清除按钮，rc-select 全都只是调这个回调，
             回调缺席就等于这些关闭动作被静默丢掉（实测：按 Esc 后 aria-expanded 仍是 true）。
             接回来时还要把消费方自己的 `onOpenChange` 往下叫一声，否则就从「关不掉」
             换成「关得掉但外面看不见」。 */
          onOpenChange: (visible: boolean) => {
            setOpen(visible);
            onOpenChange?.(visible);
          },
          onFocus: (e) => {
            setFocused(true);
            onFocus?.(e);
          },
          onBlur: (e) => {
            setFocused(false);
            setOpen(false);
            onBlur?.(e);
          },
          options,
          labelRender:
            labelRender ??
            ((option) => {
              if (valueInlabel === "before") {
                return option.value;
              }

              return option.label;
            }),
          optionRender:
            optionRender ??
            ((option) => {
              if (valueInlabel) {
                return (
                  <span>
                    <span>
                      {valueInlabel === "before" ? option.value : option.label}
                    </span>
                    <span style={{ opacity: 0.5 }}>
                      {" "}
                      - {valueInlabel === "after" ? option.value : option.label}
                    </span>
                  </span>
                );
              }

              return option.label;
            }),
          onChange,
          filterOption: (searchValue, option) =>
            filterOption({
              searchValue,
              option,
              isComposing,
              customFilterOption,
              valueInlabel,
            }),
          className: classNames(styles.antdSelect, selectClassName, {
            [styles.noArrowAnimation]: !arrowAnimation,
            [styles.legacyHasArrowOrClear]:
              legacyHasSelector && legacyHasArrowOrClear,
          }),
          // v6 replaced `popupClassName` / `dropdownStyle` with the `popup.root` semantic slot.
          // The public `popupClassName` prop of this component is kept as-is for consumers.
          classNames: { popup: { root: popupClassName } },
          getPopupContainer: () => selectRef.current ?? document.body,
          popupMatchSelectWidth:
            popupMatchSelectWidth ?? (calculatedPopupWidth || undefined),
          builtinPlacements,
          suffixIcon: customSuffixIcon ?? <Icon icon="ep:arrow-down" />,
          placement,
        }}
        ref={attachSelect}
        disabled={disabled}
      />
      {suffix && <Suffix suffix={suffix} />}
    </div>
  );
}) as SelectFC;

Select.Tree = TreeSelect;
Select.AutoComplete = AutoCompleteSelect;
Select.Icon = IconSelect;
Select.Option = AntdSelect.Option;
Select.OptGroup = AntdSelect.OptGroup;

export default Select;
