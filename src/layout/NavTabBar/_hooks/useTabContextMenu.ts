import { useState } from "react";
import { useDebounceEffect } from "ahooks";

/**
 * Hook that handles the tab context menu
 */
export const useTabContextMenu = () => {
  const [open, setOpen] = useState<string>("");

  useDebounceEffect(() => {
    const close = () => {
      setOpen("");
    };

    document.removeEventListener("click", close);
    if (open) {
      document.addEventListener("click", close);
    }
  }, [open]);

  return { open, setOpen };
};

