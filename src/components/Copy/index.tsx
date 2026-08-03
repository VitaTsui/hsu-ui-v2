import React, { ReactNode, useState } from "react";

import Icon from "../Icon";
import TurndownService from "turndown";
import classNames from "classnames";
import { message } from "antd";
import styles from "./index.module.scss";

export interface CopyProps {
  id: string;
  /** true (default): report via a global toast; false: swap the button for an inline "已复制！" state */
  isMessage?: boolean;
  md?: boolean;
  text?: string;
  copyIcon?: ReactNode;
  copyedIcon?: ReactNode;
  hideIcon?: boolean;
}

const Copy: React.FC<CopyProps> = (props) => {
  const {
    id,
    isMessage = true,
    md = true,
    text,
    copyIcon,
    copyedIcon,
    hideIcon = false,
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

  return (
    <>
      {copyed ? (
        <div className={classNames(styles.Copyed)}>
          {!hideIcon &&
            (copyedIcon ?? (
              <Icon icon="ci:check" className={classNames(styles.icon)} />
            ))}
          已复制！
        </div>
      ) : (
        <div className={classNames(styles.Copy)} onClick={onCopy}>
          {!hideIcon &&
            (copyIcon ?? (
              <Icon icon="ci:copy" className={classNames(styles.icon)} />
            ))}
          {text ?? "复制"}
        </div>
      )}
    </>
  );
};

export default Copy;
