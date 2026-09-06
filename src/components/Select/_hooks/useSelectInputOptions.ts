import { useEffect, useState } from "react";
import { SelectOption } from "..";
import { useLatestRef } from "../../../hooks/useLatestRef";

interface UseSelectInputOptionsProps {
  searchValue: string;
  isComposing: boolean;
  onChange?: (value: unknown) => void;
  onSearch?: (value: string) => void;
  optionsLength: number;
}

/**
 * Manage input options (when there are no matching options)
 */
export function useSelectInputOptions({
  searchValue,
  isComposing,
  onChange,
  onSearch,
  optionsLength,
}: UseSelectInputOptionsProps) {
  const [inputOptions, setInputOptions] = useState<SelectOption[]>([]);
  const onSearchRef = useLatestRef(onSearch);

  // 回调 prop 不进依赖数组：消费方传内联箭头时每次渲染都是新引用，effect 会跟着
  // 重跑并再调一次回调 —— 回调里 setState 就是死循环（详见 Input/TextArea 的说明）
  useEffect(() => {
    if (!isComposing) {
      onSearchRef.current?.(searchValue);
    }
  }, [inputOptions, isComposing, onSearchRef, optionsLength, searchValue]);

  return { inputOptions, setInputOptions };
}
