import React, { ReactNode, useRef, useState } from "react";

import Icon from "../../Icon";
import { Spin } from "antd";
import classNames from "classnames";
import styles from "./index.module.scss";

export interface IframePanelProps
  extends React.DetailedHTMLProps<
    React.IframeHTMLAttributes<HTMLIFrameElement>,
    HTMLIFrameElement
  > {
  fullBtn?: boolean;
  children?: ReactNode;
}

const IframePanel: React.FC<IframePanelProps> = (props) => {
  const { fullBtn, children, ...coreProps } = props;
  const ref = useRef<HTMLIFrameElement>(null);
  const [spinning, setSpinning] = useState(true);

  return (
    <div className={classNames(styles.IframPanel)}>
      {children ? (
        <div ref={ref} className={styles.content}>
          {children}
        </div>
      ) : (
        <Spin
          spinning={spinning}
          classNames={{ root: styles.spin }}
          size="large"
        >
          <iframe {...coreProps} ref={ref} onLoad={() => setSpinning(false)} />
        </Spin>
      )}

      {fullBtn && (!spinning || children) && (
        <div
          className={styles.full}
          onClick={() => {
            if (ref.current) {
              const div = ref.current;
              div.requestFullscreen?.();
            }
          }}
        >
          <Icon icon={"lets-icons:full-alt"} />
        </div>
      )}
    </div>
  );
};

export default IframePanel;
