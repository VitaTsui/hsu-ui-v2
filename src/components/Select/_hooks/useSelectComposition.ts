import { useEffect, useState } from "react";

interface UseSelectCompositionProps {
  onSearch?: (value: string) => void;
}

/**
 * Manage IME composition state
 */
export function useSelectComposition({
  onSearch,
}: UseSelectCompositionProps) {
  const [isComposing, setComposing] = useState<boolean>(false);
  const hasOnSearch = !!onSearch;

  useEffect(() => {
    const compositionend = () => {
      setComposing(false);
    };
    const compositionstart = () => {
      setComposing(true);
    };

    if (hasOnSearch) {
      window.addEventListener("compositionstart", compositionstart);
      window.addEventListener("compositionend", compositionend);
    }

    return () => {
      window.removeEventListener("compositionstart", compositionstart);
      window.removeEventListener("compositionend", compositionend);
    };
    // onSearch 在这里只被当作「要不要监听输入法事件」的真值判断，effect 体从不调它。
    // 直接进依赖数组的话，消费方传内联箭头就会每渲染一次拆一次、装一次 window 监听；
    // 只取「有没有传」这个布尔量，从无到有时照样会重新注册。
  }, [hasOnSearch]);

  return { isComposing };
}

