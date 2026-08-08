import { PlaceholderDict, PlaceholderDictEn, FormItemType } from "..";
import { Form, FormItemProps, Tooltip, TooltipProps } from "antd";
import React, { CSSProperties, ReactNode, useMemo } from "react";

import Icon from "../../Icon";
import classNames from "classnames";
import styles from "./index.module.scss";
import usePermissions from "../../../hooks/usePermissions";
import { isLegacyHasSelectorBrowser } from "../../../utils/cssSupports";
import { generateRandomStr } from "hsu-utils";
import useLabelSize from "./_hooks/useLabelSize";
import useInputSize from "./_hooks/useInputSize";

interface TipsProps {
  icon?: ReactNode;
  iconClassName?: string;
}

export interface ItemContainerProps extends FormItemProps {
  children?: ReactNode;
  labelWidth?: string | number;
  labelHeight?: string | number;
  labelMinHeight?: string | number;
  inputWidth?: string | number;
  inputMinWidth?: string | number;
  inputHeight?: string | number;
  inputMinHeight?: string | number;
  height?: string | number;
  width?: string | number;
  requiredMsg?: string;
  layout?: "horizontal" | "vertical";
  requiredPosition?: "before" | "after";
  hideRequired?: boolean;
  tips?: TipsProps & TooltipProps;
  labelRender?: (label: ReactNode) => ReactNode;
  horizontalAlignment?: "between" | "start";
  labelClassName?: string;
  disabled?: boolean;
  en?: boolean;
  type?: FormItemType;
  locale?: string;
  hasPermi?: string[];
  labelExtra?: ReactNode;
  labelExtraClassName?: string;
  labelEllipsis?: boolean;
  labelBreak?: boolean;
  hideAdditiona?: boolean;
  hideLabel?: boolean;
  /** Visibility switch, consumed by FormItem; destructured and stripped here to avoid passing it through to the DOM */
  visible?: boolean;
}

const ItemContainer: React.FC<ItemContainerProps> = (props) => {
  const {
    children,
    className,
    required,
    rules = [],
    name = "",
    labelWidth,
    labelHeight,
    labelMinHeight,
    inputWidth,
    inputMinWidth,
    inputHeight,
    inputMinHeight,
    height,
    width,
    style,
    requiredMsg,
    layout = "horizontal",
    requiredPosition = "before",
    colon,
    label,
    labelRender,
    tips = {},
    horizontalAlignment = "start",
    hideRequired = false,
    labelClassName,
    en,
    type = "",
    hasPermi,
    labelExtra,
    labelExtraClassName,
    labelEllipsis = false,
    labelBreak = false,
    hideAdditiona = false,
    hideLabel = false,
    visible: _visible,
    ...formItemProps
  } = props;
  const { icon = "material-symbols:help", iconClassName, ...tipsConfig } = tips;
  const { permitted } = usePermissions(hasPermi);
  const cls = useMemo(() => generateRandomStr(10), []);
  const legacyHasSelector = isLegacyHasSelectorBrowser();

  const _label = useMemo(() => {
    if (hideLabel) {
      return undefined;
    }

    return Object.keys(tips).length ? (
      <>
        <span className={classNames(styles.labelContent, labelClassName)}>
          <span
            className={classNames(styles.labelCont, {
              [styles.labelEllipsis]: labelEllipsis,
              [styles.labelBreak]: labelBreak,
            })}
          >
            {label}
          </span>
        </span>
        <Tooltip
          arrow={false}
          placement="top"
          color="var(--vita-muted)"
          styles={{ container: { color: "var(--vita-foreground)", padding: "6px 12px" } }}
          {...tipsConfig}
        >
          {typeof icon === "string" ? (
            <Icon
              icon={icon}
              className={classNames(styles.tipsIcon, iconClassName)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              fontSize={16}
              color="var(--vita-subtle-foreground)"
            />
          ) : (
            <div
              className={classNames(styles.tipsIconNode, iconClassName)}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {icon}
            </div>
          )}
        </Tooltip>
      </>
    ) : label ? (
      <>
        <span className={classNames(styles.label, labelClassName)}>
          <span
            className={classNames(styles.labelCont, {
              [styles.labelEllipsis]: labelEllipsis,
              [styles.labelBreak]: labelBreak,
            })}
          >
            {label}
          </span>
        </span>
        {labelExtra && (
          <span className={classNames(styles.labelExtra, labelExtraClassName)}>
            {labelExtra}
          </span>
        )}
      </>
    ) : undefined;
  }, [
    tips,
    labelClassName,
    label,
    tipsConfig,
    icon,
    iconClassName,
    labelExtra,
    labelExtraClassName,
    labelEllipsis,
    labelBreak,
    hideLabel,
  ]);

  const {
    width: _labelWidth,
    height: _labelHeight,
    minHeight: _labelMinHeight,
  } = useLabelSize({
    labelWidth,
    labelHeight,
    labelMinHeight,
    height,
  });

  const {
    width: _inputWidth,
    height: _inputHeight,
    minHeight: _inputMinHeight,
    horizontalMinWidth: _inputHorizontalMinWidth,
  } = useInputSize({
    inputWidth,
    inputMinWidth,
    inputHeight,
    inputMinHeight,
    height,
  });

  if (!permitted) {
    return null;
  }

  return (
    <Form.Item
      {...formItemProps}
      name={name}
      rules={[
        {
          required,
          message:
            requiredMsg ??
            (en
              ? `${PlaceholderDictEn[type || "INPUT"]}`
              : `${PlaceholderDict[type || "INPUT"]}`),
        },
        ...rules,
      ]}
      className={classNames({
        [cls]: true,
        [styles.formItem]: true,
        [className ?? ""]: true,
        [styles[layout]]: layout,
        [styles[requiredPosition]]: requiredPosition,
        [styles.hideRequired]: hideRequired,
        [styles[horizontalAlignment]]:
          layout === "horizontal" && horizontalAlignment,
        [styles.hasLabelContent]: !!Object.keys(tips).length,
        [styles.hideAdditiona]: hideAdditiona,
        [styles.legacyHasLabelExtra]:
          legacyHasSelector &&
          layout === "vertical" &&
          !hideLabel &&
          !!label &&
          !!labelExtra &&
          !Object.keys(tips).length,
      })}
      colon={
        typeof colon === "boolean"
          ? colon
          : layout === "horizontal" && requiredPosition === "before"
      }
      label={labelRender ? labelRender(_label) : _label}
      style={
        {
          width: typeof width === "number" ? width + "px" : width,
          "--label-width": _labelWidth,
          "--label-height": _labelHeight,
          "--label-min-height": _labelMinHeight,
          "--input-width": _inputWidth,
          "--input-height": _inputHeight,
          "--input-min-height": _inputMinHeight,
          "--input-horizontal-min-width": _inputHorizontalMinWidth,
          "--input-horizontal-flex-grow":
            parseInt(_inputHorizontalMinWidth) !== 0 ? 0 : 1,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Form.Item>
  );
};

export default ItemContainer;
