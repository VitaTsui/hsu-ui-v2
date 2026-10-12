/**
 * Mount the date popup on the current antd Modal's wrap to avoid clipping by a parent's overflow:hidden (e.g. when embedded in a modal);
 * consistent with the usual behavior of formerly standalone popups inside large-screen BaseModals such as data resources. Falls back to document.body in non-modal scenarios.
 */
export { getUnclippedPopupContainer as defaultModalPickerGetPopupContainer } from "../../utils/getUnclippedPopupContainer";
