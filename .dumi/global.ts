// 文档站全局副作用：注册 iconify 图标集（真实项目在入口 index.tsx 里做），
// 否则组件中以 iconify 名（如 "ph:user-bold"）引用的图标不显示。
// 注册必须走本库导出的 addIconCollection：@iconify/react 与 @iconify/react/offline
// 各带一份互相看不见的注册表，本库读的是 offline 那一份，注册错地方图标照样不显示。
import { addIconCollection as addCollection } from "../src/components/Icon";
import type { IconifyJSON } from "@iconify/react/offline";

import carbon from "@iconify/json/json/carbon.json";
import ep from "@iconify/json/json/ep.json";
import iconPark from "@iconify/json/json/icon-park.json";
import letsIcons from "@iconify/json/json/lets-icons.json";
import materialSymbols from "@iconify/json/json/material-symbols.json";
import mingcute from "@iconify/json/json/mingcute.json";
import tabler from "@iconify/json/json/tabler.json";
import basil from "@iconify/json/json/basil.json";
import fa from "@iconify/json/json/fa.json";
import faSolid from "@iconify/json/json/fa-solid.json";
import octicon from "@iconify/json/json/octicon.json";
import ph from "@iconify/json/json/ph.json";
import ix from "@iconify/json/json/ix.json";
import mdi from "@iconify/json/json/mdi.json";
import faRegular from "@iconify/json/json/fa-regular.json";
import weui from "@iconify/json/json/weui.json";
import fluent from "@iconify/json/json/fluent.json";
import iconParkSolid from "@iconify/json/json/icon-park-solid.json";
import iconParkOutline from "@iconify/json/json/icon-park-outline.json";
import tdesign from "@iconify/json/json/tdesign.json";
import solar from "@iconify/json/json/solar.json";
import ri from "@iconify/json/json/ri.json";
import eosIcons from "@iconify/json/json/eos-icons.json";
import heroiconsOutline from "@iconify/json/json/heroicons-outline.json";
import mi from "@iconify/json/json/mi.json";
import ci from "@iconify/json/json/ci.json";

addCollection(ep);
// ant-design 这一套**刻意不在这儿注册**：库自己已经注册了它用到的那 17 枚，
// 而且把 viewBox 修回了 antd 原本的 64 64 896 896（iconify 转出来的是 0 0 1024 1024，
// 同样字号下小 12.5%，见 scripts/gen-icon-data.cjs 的 VIEWBOX_OVERRIDES）。
// 这儿再整集注册一遍，文档站看到的尺寸就取决于两次 addCollection 谁后跑，
// 跟消费方实际看到的可能不一样 —— 文档站必须和消费方一致，否则眼验没有意义。
addCollection(mingcute);
addCollection(materialSymbols as IconifyJSON);
addCollection(carbon);
addCollection(letsIcons);
addCollection(iconPark);
addCollection(tabler);
addCollection(basil);
addCollection(fa);
addCollection(faSolid);
addCollection(octicon);
addCollection(ph as IconifyJSON);
addCollection(ix);
addCollection(mdi);
addCollection(faRegular);
addCollection(weui);
addCollection(fluent as IconifyJSON);
addCollection(iconParkSolid);
addCollection(iconParkOutline);
addCollection(tdesign);
addCollection(solar as IconifyJSON);
addCollection(ri as IconifyJSON);
addCollection(eosIcons as IconifyJSON);
addCollection(heroiconsOutline as IconifyJSON);
addCollection(mi as IconifyJSON);
addCollection(ci);
