import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Select from ".";

const options = [{ label: "Option", value: "one" }];
const cases = [
  [
    "Select",
    (getPopupContainer?: (node: HTMLElement) => HTMLElement) => (
      <Select
        options={options}
        popupClassName="container-probe"
        getPopupContainer={getPopupContainer}
      />
    ),
  ],
  [
    "AutoComplete",
    (getPopupContainer?: (node: HTMLElement) => HTMLElement) => (
      <Select.AutoComplete
        options={options}
        popupClassName="container-probe"
        getPopupContainer={getPopupContainer}
      />
    ),
  ],
  [
    "TreeSelect",
    (getPopupContainer?: (node: HTMLElement) => HTMLElement) => (
      <Select.Tree
        treeData={[{ title: "Option", value: "one" }]}
        popupClassName="container-probe"
        getPopupContainer={getPopupContainer}
      />
    ),
  ],
] as const;

for (const [name, control] of cases) {
  describe(`${name} popup in scrolling content`, () => {
    for (const modal of [false, true]) {
      it(`escapes scroll content ${modal ? "inside a modal" : "inside a table"}`, async () => {
        const { container } = render(
          <div className={modal ? "ant-modal-wrap" : undefined}>
            <div
              data-testid="scroll-body"
              className="ant-table-body"
              style={{ overflow: "auto", height: 100 }}
            >
              {control()}
            </div>
          </div>,
        );
        fireEvent.mouseDown(container.querySelector(".ant-select-content")!);
        const popup = await waitFor(() => {
          const node = document.querySelector(".container-probe")!;
          expect(node).toBeTruthy();
          return node;
        });
        expect(
          container.querySelector(".ant-table-body")!.contains(popup),
        ).toBe(false);
        expect(popup.closest(".ant-modal-wrap")).toBe(
          modal ? container.querySelector(".ant-modal-wrap") : null,
        );
      });
    }
    it("honors an explicit popup container", async () => {
      const { container } = render(
        <div className="custom-popup-host">
          {control((node) => node.closest(".custom-popup-host") as HTMLElement)}
        </div>,
      );
      fireEvent.mouseDown(container.querySelector(".ant-select-content")!);
      await waitFor(() =>
        expect(container.querySelector(".container-probe")).toBeTruthy(),
      );
    });
  });
}
