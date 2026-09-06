import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.scss";
import XSpreadsheet, { Options } from "x-data-spreadsheet";
import { Equal, generateRandomStr } from "hsu-utils";
import "x-data-spreadsheet/dist/xspreadsheet.css";
import classNames from "classnames";
import { WorkBook } from "xlsx";
import { stox } from "./xlsxspread";
import useShallowStable from "../../hooks/useShallowStable";

interface XOptions extends Omit<Options, "view"> {
  showBottomTool?: boolean;
}

interface SpreadsheetProps {
  data?: WorkBook;
  xOptions?: XOptions;
  className?: string;
}

// 解构默认值写成字面量会每次渲染新建一个对象，进依赖数组就让 effect 每渲染必重跑；提到模块级常量
const EMPTY_X_OPTIONS: XOptions = {};

const Spreadsheet: React.FC<SpreadsheetProps> = (props) => {
  const { data, xOptions = EMPTY_X_OPTIONS, className } = props;
  const { showBottomTool = true, ...restXOptions } = xOptions;
  // rest 解构出来的对象每次渲染都是新引用，直接进依赖数组会让 memo 恒不命中。
  // useShallowStable 让它回到值语义：内容浅相等就复用同一引用，真变了立刻透出新引用。
  const xOptionsRest = useShallowStable(restXOptions);
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useMemo(() => generateRandomStr(10), []);
  const [sheet, setSheet] = useState<XSpreadsheet | null>(null);
  const [lastData, setLastData] = useState<WorkBook | undefined>(undefined);

  useEffect(() => {
    if (ref.current && containerRef.current && !sheet) {
      const _sheet = new XSpreadsheet(`#${id}`, {
        view: ref.current
          ? {
              width: () => ref.current!.clientWidth,
              height: () => ref.current!.clientHeight,
            }
          : undefined,
        ...xOptionsRest,
      });

      setSheet(_sheet);
    }
  }, [id, xOptionsRest, sheet]);

  useEffect(() => {
    if (sheet && data && !Equal.ObjEqual(data, lastData)) {
      sheet.loadData(stox(data));
      setLastData(data);
    }
  }, [sheet, data, lastData]);

  return (
    <div
      className={classNames(styles.spreadsheet, className, {
        [styles.showBottomTool]: showBottomTool,
      })}
      ref={ref}
    >
      <div id={id} ref={containerRef} />
    </div>
  );
};

export default Spreadsheet;
