import React from "react";
import { Space } from "antd";
import Icon from "../../../../components/Icon";
import { BreadcrumbType } from "../..";

interface BreadcrumbMenuItemProps {
  item: BreadcrumbType;
  navigate: (path: string) => void;
}

/**
 * Breadcrumb menu item component
 */
const BreadcrumbMenuItem: React.FC<BreadcrumbMenuItemProps> = ({
  item,
  navigate,
}) => {
  const handleClick = () => {
    if ((!item.children || item.route?.index) && item.path) {
      navigate(item.path);
    }
  };

  return (
    <Space size={5} onClick={handleClick}>
      {typeof item.icon === "string" ? <Icon icon={item.icon} /> : item.icon}
      {item.title}
    </Space>
  );
};

export default BreadcrumbMenuItem;
