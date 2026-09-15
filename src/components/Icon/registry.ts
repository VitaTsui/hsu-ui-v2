import { addCollection as addIconifyCollection } from "@iconify/react/offline";
import type { IconifyJSON } from "@iconify/react/offline";

/**
 * 图标注册表 —— 本库渲染图标用的那一份，**只有这一份**。
 *
 * 为什么要由本库出这个入口，而不是让消费方自己 `import { addCollection } from "@iconify/react"`：
 * `@iconify/react` 的两个入口是**两个各自独立的产物**，各带一份自己的 storage。
 * `dist/iconify.js`（联网版）和 `dist/offline.js`（离线版）互相看不见对方注册的东西 ——
 * 实测：`offline.addIcon("probe:one", …)` 之后 `full.iconLoaded("probe:one") === false`。
 * 本库的 `Icon` 渲染走的是 offline 版，所以消费方若往联网版里注册，等于注册到了一个
 * 本库根本不读的表里：**图标全白，且一条错都不报**。
 *
 * 于是注册入口收进本库：`import { addIconCollection } from "@hsu-react/ui"`，
 * 存哪儿、读哪儿由库自己保证一致，消费方没有选错的机会。
 */

/**
 * 已注册的全名（`prefix:name`）。
 *
 * offline 版**没有** `iconLoaded()`（那是联网版才导出的），所以这张表得自己记。
 * 记的判据与 `addCollection` 内部一致：`icons` 的键 ＋ `aliases` 的键 —— iconify 的
 * `parseIconSet` 会把 alias 解析成真图标一并写进 storage，所以 alias 名同样画得出来。
 */
const registeredIcons = new Set<string>();

/**
 * 把一个 iconify 图标集注册进本库的图标表。
 *
 * 纯内存操作，不产生任何下载。签名与 `@iconify/react` 的 `addCollection` 一致。
 */
export function addIconCollection(
  data: IconifyJSON,
  prefix?: string | boolean
): void {
  addIconifyCollection(data, prefix);

  // 与 addCollection 内部同一条计算：显式传字符串时原样用，传 false 时不加前缀，
  // 其余情况用图标集自带的 prefix ＋ 冒号
  const namePrefix =
    typeof prefix === "string"
      ? prefix
      : prefix !== false && typeof data.prefix === "string"
        ? `${data.prefix}:`
        : "";

  for (const name of Object.keys(data.icons ?? {})) {
    registeredIcons.add(namePrefix + name);
  }
  for (const name of Object.keys(data.aliases ?? {})) {
    registeredIcons.add(namePrefix + name);
  }
}

/** 这枚 iconify 图标名有没有注册过（注册过才画得出来） */
export function isIconRegistered(name: string): boolean {
  return registeredIcons.has(name);
}
