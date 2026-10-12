/** Keep dropdowns outside scrollable table bodies and modal content. */
export function getUnclippedPopupContainer(trigger: HTMLElement): HTMLElement {
  return (
    (trigger.closest(".ant-modal-wrap") as HTMLElement | null) ??
    trigger.ownerDocument.body
  );
}
