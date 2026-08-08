import React, { useMemo, useState } from "react";
import styles from "./index.module.scss";
import {
  TreeGraphData as G6TreeGraphData,
  IGroup,
  ModelConfig,
} from "@antv/g6";
import { ChainGraphServicesStyles } from "./ChainGraphServices";
import { observer } from "mobx-react-lite";
import { generateRandomStr } from "hsu-utils";
import { Spin } from "antd";
import classNames from "classnames";
import {
  useChainGraphInit,
  useChainGraphData,
  useChainGraphSearch,
  useChainGraphExpand,
  useChainGraphLayout,
  useChainGraphMiniMap,
  useChainGraphResize,
} from "./_hooks";
import { ExpandButtons } from "./_components/ExpandButtons";
import { SearchSelect } from "./_components/SearchSelect";

export interface TreeGraphData extends G6TreeGraphData {
  origin?: Record<string, unknown>; // Original data
}

export interface ChainGraphProps {
  data?: TreeGraphData;
  octopus?: boolean;
  level?: number;
  rootLevel?: number;
  onClick?: (node?: TreeGraphData) => void;
  styles?: ChainGraphServicesStyles;
  showPort?: boolean;
  showMiniMap?: boolean;
  miniMapSize?: [number, number];
  getImage?: (img: string) => void;
  className?: string;
  showSearch?: boolean;
  showExpandBtn?: boolean;
  expandClassName?: string;
  resize?: boolean;
  offset?: [number, number];
  fitLeft?: boolean;
  paddingLeft?: number;
  loading?: boolean;
  hasHover?: boolean;
  hasSelected?: boolean;
  minZoom?: number;
  wrapperClassName?: string;
  labelRender?: (label: TreeGraphData) => string;
  addShape?: (
    group: IGroup,
    cfg: ModelConfig & { origin?: Record<string, unknown> }
  ) => void;
}

const ChainGraph: React.FC<ChainGraphProps> = observer((props) => {
  const {
    data,
    octopus,
    level = 1,
    rootLevel = 1,
    onClick,
    styles: ChainGraphServicesStyles,
    showPort = true,
    showMiniMap = true,
    miniMapSize = [200, 150],
    getImage,
    className,
    showSearch = true,
    showExpandBtn = true,
    expandClassName,
    resize = true,
    offset = [0, 0],
    fitLeft = false,
    paddingLeft = 20,
    loading = false,
    hasHover = true,
    hasSelected = true,
    minZoom,
    wrapperClassName,
    labelRender,
    addShape,
  } = props;
  const containerId = useMemo(() => generateRandomStr(10), []);
  const miniMapContainerId = useMemo(() => generateRandomStr(10), []);
  const [searchVal, setSearchVal] = useState("");

  // ==================== Initialization ====================
  const graph = useChainGraphInit({
    containerId,
    miniMapContainerId,
    octopus: octopus && !fitLeft,
    onClick,
    styles: ChainGraphServicesStyles,
    showPort,
    miniMapSize,
    fitLeft,
    paddingLeft,
    rootLevel,
    hasHover,
    hasSelected,
    minZoom,
    addShape,
  });

  // ==================== Set data ====================
  const { isLayouting } = useChainGraphData({
    graph,
    data,
    level,
    rootLevel,
    getImage,
    labelRender,
  });

  // ==================== Search ====================
  useChainGraphSearch({
    graph,
    searchVal,
  });

  // ==================== Expand all nodes ====================
  const { setAllExpand } = useChainGraphExpand({
    graph,
    level,
    rootLevel,
  });

  // ==================== Change layout ====================
  useChainGraphLayout({
    graph,
    octopus,
    rootLevel,
    getImage,
  });

  // ==================== Set MiniMap ====================
  useChainGraphMiniMap({
    graph,
    showMiniMap,
  });

  // ==================== Resize ====================
  useChainGraphResize({
    graph,
    containerId,
    resize,
    offset,
  });

  return (
    <Spin
      spinning={loading || (isLayouting && !!data?.children?.length)}
      classNames={{ root: classNames(styles.spinWrapper, wrapperClassName) }}
    >
      <div
        className={`${styles.ChainGraph} ${className}`}
        style={{
          opacity: !isLayouting ? 1 : 0,
        }}
      >
        <div
          className={styles.container}
          id={containerId}
          style={{
            width: `calc(100% - ${offset[0]}px )`,
            height: `calc(100% - ${offset[1]}px )`,
          }}
        />
        <div
          className={classNames(styles.miniMapContainer, {
            [styles.showMiniMap]: showMiniMap,
          })}
          id={miniMapContainerId}
        />
        {showExpandBtn && data?.children?.length && (
          <ExpandButtons
            onExpand={() => setAllExpand(true)}
            onCollapse={() => setAllExpand(false)}
            expandClassName={expandClassName}
          />
        )}
        {showSearch && (
          <SearchSelect onChange={(value) => setSearchVal(value)} />
        )}
      </div>
    </Spin>
  );
});

export default ChainGraph;
