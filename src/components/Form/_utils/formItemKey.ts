import { FormItemProps } from "../../FormItem";

/**
 * 表单项的 React key。
 *
 * 原来直接用 `item.name`，而**一个表单有两个互斥、同名的字段是合法的** ——
 * 消费方真实写法：Bearer Token 用 `PASSWORD`、自定义请求头用 `TEXTAREA`，
 * 两条都叫 `authValue`，靠 `visible` 互斥。`FormItemProps` 是按 `type` 判别的
 * 联合类型，把 `type` 写成三元表达式会让 `componentProps` 退化成所有形态的
 * 交集、编译期就通不过，所以拆成两条是**故意的**，不是写错。
 *
 * 于是控制台常年三条
 * `Encountered two children with the same key, 'authValue'`。
 * 目前行为无害（两条永远只渲染一个，另一个 return null），但 React 明说
 * 重复 key 的行为不受支持、将来可能改。
 *
 * 修法是重名的第二条起加后缀，而不是改成按下标 —— 按下标会让
 * 「条件性地从数组里删掉某一项」的表单在删除时整片重挂。
 *
 * ⚠️ **按声明数组编号，不能按「可见的那部分」编号。**互斥字段两条都在数组里，
 * 只是其中一条渲染成 null。若先 `filter(visible)` 再编号，切换的瞬间剩下那条的
 * key 会从 `authValue#1` 变成 `authValue` —— **key 一变就是重挂**，用户正在输入的
 * 内容和焦点当场丢，比原来那条警告严重得多。数组是静态写死的，
 * 按声明顺序编号则天然稳定，切 `visible` 不动 key。
 *
 * @param items 声明顺序的表单项数组（**不要预先过滤**）
 * @returns 与入参等长、下标一一对应的 key 数组
 */
export const formItemKeys = (items?: FormItemProps[]): string[] => {
  const used: Record<string, number> = {};

  return (items ?? []).map((item, idx) => {
    // name 缺省时退回下标：没有名字的项本来就互不相同，用下标不会撞
    const name = item?.name == null ? `#${idx}` : String(item.name);
    const seen = used[name] ?? 0;
    used[name] = seen + 1;

    return seen === 0 ? name : `${name}#${seen}`;
  });
};

export default formItemKeys;
