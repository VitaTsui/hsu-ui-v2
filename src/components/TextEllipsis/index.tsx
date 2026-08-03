import { Tooltip, TooltipProps } from "antd";
import { ReactNode, useEffect, useRef, useState } from "react";
import cssStyles from "./index.module.scss";

// Default Tooltip width
const DEFAULT_TOOLTIP_WIDTH = 200;

export interface TextEllipsisProps {
  /** Text content to display */
  children: ReactNode;
  /** Container width, used to compute the Tooltip width */
  width?: number | string;
  /** Tooltip config */
  tooltipConfig?: Omit<TooltipProps, "title" | "children"> & {
    /** Default Tooltip width (used when width is not set) */
    defaultWidth?: number;
  };
  /** Custom style */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Whether to disable the Tooltip (not shown even when the text overflows) */
  disabled?: boolean;
  /** Ellipsis position: 'start' truncates the beginning (...xxx), 'end' truncates the end (xxx...) */
  ellipsisPosition?: "start" | "end";
  /** Container style */
  containerStyle?: React.CSSProperties;
}

/**
 * Text overflow component
 * Automatically shows a Tooltip when the text overflows, and truncates the overflowing text
 */
const TextEllipsis: React.FC<TextEllipsisProps> = ({
  children,
  width,
  tooltipConfig,
  style,
  className,
  disabled = false,
  ellipsisPosition = "end",
  containerStyle,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [truncatedText, setTruncatedText] = useState<ReactNode>(children);
  // Actual rendered container width: used as the Tooltip width when width is not declared (e.g. dynamically allocated table column widths)
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    const element = textRef.current;
    const measureElement = measureRef.current;
    if (!element || !measureElement) return;

    // Convert children to a string
    const getTextContent = (node: ReactNode): string => {
      if (typeof node === "string" || typeof node === "number") {
        return String(node);
      }
      if (Array.isArray(node)) {
        return node?.map(getTextContent).join("");
      }
      return "";
    };

    // Sync the measure element's styles
    const computedStyle = window.getComputedStyle(element);
    measureElement.style.fontSize = computedStyle.fontSize;
    measureElement.style.fontFamily = computedStyle.fontFamily;
    measureElement.style.fontWeight = computedStyle.fontWeight;
    measureElement.style.fontStyle = computedStyle.fontStyle;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.padding = computedStyle.padding;
    measureElement.style.border = computedStyle.border;
    measureElement.style.boxSizing = computedStyle.boxSizing;

    // Compute the truncated text (truncating the beginning)
    const calculateTruncatedText = (text: string, maxWidth: number): string => {
      const ellipsis = "...";

      // If the entire text does not overflow, return it directly
      measureElement.textContent = text;
      if (measureElement.offsetWidth <= maxWidth) {
        return text;
      }

      // Binary search for the appropriate truncation point
      let left = 0;
      let right = text.length;
      let result = text;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const truncated = ellipsis + text.slice(mid);
        measureElement.textContent = truncated;

        if (measureElement.offsetWidth <= maxWidth) {
          result = truncated;
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }

      return result;
    };

    const textContent = getTextContent(children);

    const update = () => {
      // Detached nodes measure 0/0 — never let them overwrite a live measurement
      if (!element.isConnected) return;
      const isTextOverflow =
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight;

      setIsOverflow(isTextOverflow);
      setMeasuredWidth(element.clientWidth);

      // If truncating the beginning and the text overflows, the truncated text must be computed
      if (ellipsisPosition === "start" && isTextOverflow && textContent) {
        const maxWidth = element.clientWidth;
        const truncated = calculateTruncatedText(textContent, maxWidth);
        setTruncatedText(truncated);
      } else {
        setTruncatedText(children);
      }
    };

    update();

    // Re-measure overflow and width when the container width changes dynamically (e.g. table column width redistribution, window resize)
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [children, ellipsisPosition, style]);

  // Compute the Tooltip width: an explicit width takes priority; when not declared (or a percentage),
  // use the container's actual rendered width, falling back to defaultWidth if measurement fails
  const getTooltipWidth = () => {
    const defaultWidth = tooltipConfig?.defaultWidth ?? DEFAULT_TOOLTIP_WIDTH;
    const dynamicWidth = measuredWidth > 0 ? measuredWidth : defaultWidth;
    if (!width) return dynamicWidth;
    if (typeof width === "number") return width;
    if (typeof width === "string" && width.includes("%")) return dynamicWidth;
    return parseInt(width) || dynamicWidth;
  };

  const tooltipWidth = getTooltipWidth();

  // Extract config from tooltipConfig, removing defaultWidth
  const { defaultWidth, styles, ...restTooltipConfig } = tooltipConfig || {};
  void defaultWidth;

  // Try to format children as JSON
  const formatTooltipTitle = (content: ReactNode): ReactNode => {
    if (typeof content !== "string") return content;

    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, return the original content
      return content;
    }
  };

  const tooltipTitle = formatTooltipTitle(children);

  const content = (
    <span className={cssStyles.container} style={containerStyle}>
      {/* Hidden measure element */}
      <span
        ref={measureRef}
        className={cssStyles.measureElement}
        aria-hidden="true"
      />
      <span
        ref={textRef}
        className={`${cssStyles.textElement} ${
          ellipsisPosition === "end"
            ? cssStyles.ellipsisEnd
            : cssStyles.ellipsisStart
        } ${className || ""}`}
        style={style}
        title="" // Disable the browser's default tooltip
      >
        {ellipsisPosition === "start" ? truncatedText : children}
      </span>
    </span>
  );

  // Always keep the Tooltip wrapper mounted and toggle via title:
  // conditionally wrapping remounts the text DOM when isOverflow flips, which detaches
  // the node the measurement effect's ResizeObserver holds — its final callback then
  // reads 0/0 from the detached node and resets isOverflow, so the Tooltip never shows.
  return (
    <Tooltip
      arrow={false}
      placement="bottomLeft"
      {...restTooltipConfig}
      title={isOverflow && !disabled ? tooltipTitle : undefined}
      styles={{
        body: {
          width: tooltipWidth,
          overflow: "auto",
          maxHeight: "300px",
          whiteSpace: "pre-wrap",
        },
        ...styles,
      }}
    >
      {content}
    </Tooltip>
  );
};

export default TextEllipsis;
