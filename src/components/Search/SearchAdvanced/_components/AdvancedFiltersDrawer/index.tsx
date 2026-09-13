import React from "react";
import type { FormInstance } from "antd";
import Form from "../../../../Form";
import { FormItemProps } from "../../../../FormItem";
import { DrawerFormProps } from "../../../../Form/DrawerForm";
import Icon from "../../../../Icon";
import type useLabelWidth from "../../../../../hooks/useLabelWidth";
import styles from "../../../index.module.scss";

interface AdvancedFiltersDrawerProps {
  expand: boolean;
  setExpand: (expand: boolean) => void;
  searchItems: FormItemProps[];
  form: FormInstance<Record<string, unknown>>;
  getLabelWidth: ReturnType<typeof useLabelWidth>[1];
  minLabelWidth?: boolean | number;
  onSearchClick: () => void;
  onResetClick: () => void;
  advancedFiltersProps?: DrawerFormProps;
}

export const AdvancedFiltersDrawer: React.FC<AdvancedFiltersDrawerProps> = ({
  expand,
  setExpand,
  searchItems,
  form,
  getLabelWidth,
  minLabelWidth,
  onSearchClick,
  onResetClick,
  advancedFiltersProps,
}) => {
  return (
    <Form.Drawer
      {...advancedFiltersProps}
      open={expand}
      reset={false}
      formItems={searchItems
        .filter((item) => item.visible)
        ?.map((i, idx) => ({
          ...i,
          labelWidth:
            i.layout === "vertical"
              ? undefined
              : i.width ??
                getLabelWidth(
                  searchItems
                    .filter((item) => item.visible)
                    .filter((_, _idx) => {
                      return _idx % 2 === idx % 2;
                    }),
                  undefined,
                  minLabelWidth
                ),
        }))}
      externalForm={form}
      onClose={() => setExpand(false)}
      title={
        <div className={styles.drawerTitle}>
          <Icon
            icon="ant-design:filter-filled"
            className={styles.drawerTitleIcon}
          />
          高级筛选
        </div>
      }
      className={styles.DrawerForm}
      buttonGroup={[
        {
          title: "查询",
          type: "primary",
          onClick: () => {
            onSearchClick();
            setExpand(false);
          },
          icon: <Icon icon="tabler:search" />,
        },
        {
          title: "重置",
          onClick: () => {
            onResetClick();
            setExpand(false);
          },
          icon: <Icon icon="basil:refresh-solid" />,
        },
      ]}
    />
  );
};
