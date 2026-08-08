import type {
  TreeSelectDataNode as DataNode,
  SafeKey,
} from "../../../../types/antd";

/**
 * Compute the node keys that should be expanded based on the default expand level (for TreeSelect)
 * @param treeData Tree data (DataNode type)
 * @param level Expand level (starting from 1; 1 means the first level, 2 the second, and so on)
 * @returns Array of node keys that should be expanded
 */
export const getExpandedKeysByLevel = (
  treeData: DataNode[],
  level: number
): SafeKey[] => {
  if (level < 1 || !treeData?.length) {
    return [];
  }

  const expandedKeys: SafeKey[] = [];

  const traverse = (nodes: DataNode[], currentLevel: number) => {
    for (const node of nodes) {
      // Expand this node if the current level is below the target level
      if (currentLevel < level && node.children?.length && node.key !== undefined) {
        expandedKeys.push(node.key as SafeKey);
        traverse(node.children, currentLevel + 1);
      }
    }
  };

  traverse(treeData, 1);
  return expandedKeys;
};

