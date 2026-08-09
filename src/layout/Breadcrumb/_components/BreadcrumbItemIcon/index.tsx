import React, { ReactNode } from "react";
import { Space } from "antd";
import Icon from "../../../../components/Icon";

interface BreadcrumbItemIconProps {
  icon?: ReactNode;
  title?: ReactNode;
}

/**
 * Breadcrumb item icon and title component
 */
const BreadcrumbItemIcon: React.FC<BreadcrumbItemIconProps> = ({
  icon,
  title,
}) => {
  return (
    <Space size={5}>
      {typeof icon === "string" ? <Icon icon={icon} /> : icon}
      {title}
    </Space>
  );
};

export default BreadcrumbItemIcon;

