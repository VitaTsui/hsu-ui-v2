/**
 * Local derivations of antd's internal ref / callback-argument types.
 *
 * antd does not re-export these from its package entry, so they used to be pulled straight from
 * `rc-select` / `rc-picker` / `rc-field-form` / `rc-tree-select` / `rc-upload`. antd v6 moved every
 * one of those internals to the `@rc-component/*` scope, so importing the old packages now yields
 * types that are *not the same declarations* antd uses internally — under v6 that surfaces as
 * `RefObject<T> is not assignable to LegacyRef<T>` when the ref is handed to an antd component.
 *
 * Deriving from antd's own public declarations instead means: no runtime dependency, and no need to
 * list `@rc-component/*` in dependencies and chase antd's version pins — the aliases follow antd
 * automatically on every upgrade. Each one was checked to be *exactly* equivalent (mutually
 * assignable) to the original `@rc-component/*` definition.
 */
import type React from "react";
import type { DatePicker, Form, InputNumber, TreeSelect } from "antd";
import type { TreeSelectProps, UploadProps } from "antd";

/** Ref exposed by antd `Select` / `AutoComplete` (`@rc-component/select`'s `BaseSelectRef`) */
export type { RefSelectProps as SelectRef } from "antd/es/select";

/** Ref exposed by antd `TreeSelect` — also a `BaseSelectRef` */
export type TreeSelectRef = React.ElementRef<typeof TreeSelect>;

/** Ref exposed by antd `InputNumber` — an `HTMLInputElement` plus `nativeElement` */
export type InputNumberRef = React.ElementRef<typeof InputNumber>;

/** Ref exposed by antd `DatePicker` (`@rc-component/picker`'s `PickerRef`) */
export type PickerRef = React.ElementRef<typeof DatePicker>;

/** Ref exposed by antd `DatePicker.RangePicker` (`RangePickerRef`: `PickerRef` without `focus`) */
export type RangePickerRef = React.ElementRef<typeof DatePicker.RangePicker>;

/** Ref exposed by antd `Form` — `FormInstance` plus an optional `nativeElement` */
export type FormRef<Values = any> = React.ElementRef<typeof Form<Values>>;

/** Argument handed to `Upload`'s `customRequest` (`@rc-component/upload`'s `UploadRequestOption`) */
export type UploadRequestOption = Parameters<
  NonNullable<UploadProps["customRequest"]>
>[0];

/** A single node of `TreeSelect`'s `treeData` */
export type TreeSelectDataNode = NonNullable<TreeSelectProps["treeData"]>[number];

/** Key type accepted by `TreeSelect` — `React.Key` without `bigint` */
export type SafeKey = Exclude<React.Key, bigint>;
