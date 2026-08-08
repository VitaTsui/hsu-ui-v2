import React, { ReactNode, forwardRef, useState } from "react";

import Icon from "../Icon";
import TurndownService from "turndown";
import classNames from "classnames";
import { message } from "antd";
import styles from "./index.module.scss";

export interface CopyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "id" | "children"> {
  id: string;
  /** true (default): report via a global toast; false: swap the button for an inline "已复制！" state */
  isMessage?: boolean;
  md?: boolean;
  text?: string;
  copyIcon?: ReactNode;
  copyedIcon?: ReactNode;
  hideIcon?: boolean;
}

/**
 * Wrapped in `forwardRef` because antd v6's Trigger (Tooltip / Popover / Dropdown) hands its child
 * a ref instead of falling back to `findDOMNode` the way v5 did — a plain function component makes
 * it warn and lose the trigger. The remaining props are spread onto the rendered node for the same
 * reason: Trigger injects its event handlers by cloning the child.
 */
const Copy = forwardRef<HTMLDivElement, CopyProps>((props, ref) => {
  const {
    id,
    isMessage = true,
    md = true,
    text,
    copyIcon,
    copyedIcon,
    hideIcon = false,
    className,
    onClick,
    ...rest
  } = props;
  const [copyed, setCopyed] = useState<boolean>(false);

  const onCopy = () => {
    let content = document.getElementById(id);

    if (content) {
      try {
        if (md) {
          const turndownService = new TurndownService();

          const markdown = turndownService.turndown(content);

          const div = document.createElement("div");
          div.append(markdown);

          content = div;
        }

        navigator.clipboard
          .writeText(content.innerText)
          .then(() => {
            if (isMessage) {
              message.success("复制成功");
            } else {
              setCopyed(true);

              setTimeout(() => {
                setCopyed(false);
              }, 2000);
            }
          })
          .catch(() => {
            if (isMessage) {
              message.error("复制失败");
            } else {
              setCopyed(false);
            }
          });
      } catch {
        if (md) {
          const turndownService = new TurndownService();

          const markdown = turndownService.turndown(content);

          const div = document.createElement("div");
          div.append(markdown);
          div.id = id;
          div.style.width = "0px";
          div.style.height = "0px";

          document.body.appendChild(div);

          content = div;
        }

        const range = document.createRange();
        const selection = window.getSelection();
        try {
          selection?.removeAllRanges();
          range.selectNode(content);
          selection?.addRange(range);
          document.execCommand("copy");
          selection?.removeAllRanges();

          if (md) {
            document.body.removeChild(content);
          }

          if (isMessage) {
            message.success("复制成功");
          } else {
            setCopyed(true);

            setTimeout(() => {
              setCopyed(false);
            }, 2000);
          }
        } catch {
          if (isMessage) {
            message.error("复制失败");
          } else {
            setCopyed(false);
          }
        }
      }
    }
  };

  return copyed ? (
    <div ref={ref} {...rest} className={classNames(styles.Copyed, className)}>
      {!hideIcon &&
        (copyedIcon ?? (
          <Icon icon="ci:check" className={classNames(styles.icon)} />
        ))}
      已复制！
    </div>
  ) : (
    <div
      ref={ref}
      {...rest}
      className={classNames(styles.Copy, className)}
      onClick={(e) => {
        onCopy();
        onClick?.(e);
      }}
    >
      {!hideIcon &&
        (copyIcon ?? (
          <Icon icon="ci:copy" className={classNames(styles.icon)} />
        ))}
      {text ?? "复制"}
    </div>
  );
});

Copy.displayName = "Copy";

export default Copy;
