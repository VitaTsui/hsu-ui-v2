---
nav: 组件
group:
  title: 通用
  order: 1
title: Icon 图标
---

# Icon 图标

统一图标入口：传入 antd 图标名（如 `UserOutlined`）走 `@ant-design/icons`（**逐枚懒加载**，见下），传入 iconify 名（如 `ph:user-bold`）走 `@iconify/react/offline`。

## 图标从哪儿来（必读）

**本库只画注册过的图标，一次公网请求都不发。**渲染走 `@iconify/react/offline` —— 没注册过的名字就是一个空位，不会去 `api.iconify.design` 现拉。

> **2.6.0 破坏性变更**：2.5.x 及之前走的是联网版，没注册过的名字会去公网现拉。
> 如果你的项目依赖「随便写个 iconify 名字就能显示」，升上来之后那些图标会变成空白。
> 修法是把它们所在的图标集注册掉（见下），或把图标名换成已注册的那批。
> 换来的是：**不再有任何一条通往公网的出口**，内网 / 断网 / CSP 收紧的环境下行为一致，
> 也不会再有「开发时好好的、上线到内网一片空白且不报错」这种只能靠肉眼发现的坑。

所以分两笔账：

- **本库自己用到的图标**（`Select` 的下拉箭头、`Table` 翻页、`Copy`、`Tree` 搜索、`Chat` …… 共 61 枚）：**库已经自己注册好了**，零请求。消费方什么都不用做，子路径按需引入同样成立。数据由 `scripts/gen-icon-data.cjs` 从源码反扫生成，只裁用到的那几十枚（约 12 KB gzip）。
- **你自己代码里写的 iconify 名**：要你自己注册。忘了注册时，开发环境下 `Icon` 会在控制台打一条警告点名是哪个图标，别忽略它。

注册请用本库导出的 `addIconCollection`：

```ts
import { addIconCollection } from "@hsu-react/ui";
import ph from "@iconify/json/json/ph.json";

addIconCollection(ph); // 整集 4.3 MB，生产环境建议只裁用到的那几枚
```

> **别用 `@iconify/react` 自带的 `addCollection`。**`@iconify/react` 和
> `@iconify/react/offline` 是两个各自独立的产物，**各带一份互相看不见的注册表**
> （实测：往 offline 那份注册后，联网版的 `iconLoaded()` 仍然返回 `false`）。
> 本库读的是 offline 那一份，注册到联网版那一份等于没注册 —— 图标全白且不报错。
> `addIconCollection` 存在的意义就是让这个选择题消失。
> 还导出了 `isIconRegistered(name)`，可以问「这枚画得出来吗」。

## 引入

```ts
import { Icon } from "@hsu-react/ui";
```

## antd 图标

antd 图标名（驼峰）。这 846 个名字**逐枚懒加载**：传到哪一枚才下载哪一枚（几百字节），
一个 antd 名字都不传的项目零字节、零请求。第一次渲染某一枚时它要等一个来回才到，
那一帧用等宽等高的占位撑住、不抖布局。

> 别从 `@ant-design/icons` 的包根取图标 —— 它的 barrel 被 `@ant-design/x` 等库静态引用着，
> 谁再从包根引一次（`import * as` 或整包 `import()` 都算），那 846 枚就会被整体保留成一个
> 静态可达的 chunk，约 200 KB gzip 落到每个消费方头上。本库的 `scripts/check-heavy-deps.cjs`
> 会在构建期拦住这种写法。

### 首屏碎片化：同时用了 antd 组件的项目建议加这条 manualChunks

逐枚 `import()` 有一个副作用：**antd 自己静态引着的那几十枚图标**（`CloseOutlined`、
`SearchOutlined`、`CaretDownFilled` …… 实测 39 枚）会同时出现在你的静态图和这张按需表里。
rollup 按「能到达它的入口集合」切块，而每个 `import()` 目标又都是独立的 chunk 根，
于是它们各自单独成块 —— 字节没变，但小文件各压一次，**首屏 gzip 会涨 2～3%、多出几十个请求**
（实测消费方：54 → 93 个 script、896 → 919 KB gzip，raw 只从 3119 变到 3137 KB）。

把它们并回一个 chunk 即可，判据是「除了 `@ant-design/icons` 自己的 barrel 之外还有没有别的
静态引用方」—— 有就说明这一枚本来就在首屏，并进来不新增任何字节；没有就一枚都不碰：

```ts
// vite.config.ts -> build.rollupOptions.output
manualChunks(id, { getModuleInfo }) {
  if (!/@ant-design[\\/]icons[\\/]es[\\/]icons[\\/][A-Z][A-Za-z0-9]*\.js$/.test(id)) return;
  const importers = getModuleInfo(id)?.importers ?? [];
  if (importers.some((imp) => !/@ant-design[\\/]icons[\\/]/.test(imp))) {
    return "antdIconsStatic";
  }
}
```

实测加上之后：首屏 **47 个 script / 895 KB gzip**（比不用本库按需表的基线 54 个 / 896 KB
还略好），按需那侧照旧 —— `UserOutlined` 3.7 KB、`AccountBookTwoTone` 5.7 KB，
而 `CloseOutlined` 这种 antd 已经在用的直接命中、零新请求。

```tsx
import React from "react";
import { Icon } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 22 }}>
    <Icon icon="UserOutlined" />
    <Icon icon="SettingOutlined" />
    <Icon icon="HomeOutlined" />
    <Icon icon="HeartFilled" style={{ color: "#eb2f96" }} />
  </div>
);
```

## iconify 图标

iconify 图标名（`集合:名称`，本库之外的图标需自行注册对应图标集）：

```tsx
import React from "react";
import { Icon } from "@hsu-react/ui";

export default () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 22 }}>
    <Icon icon="ph:user-bold" />
    <Icon icon="mdi:home" />
    <Icon icon="tabler:settings" />
    <Icon icon="solar:heart-bold" style={{ color: "#eb2f96" }} />
    <Icon icon="carbon:document" />
  </div>
);
```

## API

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| icon | 图标名：antd 图标名 或 iconify 名 | `string` |
| iconProps | 透传给 iconify 的属性 | `object` |

继承原生 `span` 属性（`className` / `style` / `onClick` 等）。

### 附带导出

| 名称 | 说明 | 类型 |
| --- | --- | --- |
| addIconCollection | 把一个 iconify 图标集注册进本库的图标表（纯内存，无下载） | `(data: IconifyJSON, prefix?: string \| boolean) => void` |
| isIconRegistered | 这枚图标名注册过没有（注册过才画得出来） | `(name: string) => boolean` |
