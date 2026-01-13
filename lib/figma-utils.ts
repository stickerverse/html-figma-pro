// Utility functions for Figma nodes
// These are separated from figma-to-code.ts to avoid bundling heavy dependencies
// like 'traverse' into the Figma plugin environment

export type SizeType = "shrink" | "expand" | "fixed";

export type ComponentType =
  | "row"
  | "stack"
  | "columns"
  | "grid"
  | "canvas"
  | "unknown";

export interface NodeMetaData {
  component?: ComponentType;
  widthType?: SizeType;
  heightType?: SizeType;
}

export const hasChildren = (node: unknown): node is ChildrenMixin =>
  !!(node && (node as any).children);

export const hasConstraints = (node: unknown): node is ConstraintMixin =>
  !!(node && (node as any).constraints);

export const isTextNode = (node: unknown): node is TextNode =>
  !!(node && (node as any).type === "TEXT");

export const isRectangleNode = (node: unknown): node is RectangleNode =>
  !!(node && (node as any).type === "RECTANGLE");

export const isFrameNode = (node: unknown): node is FrameNode =>
  !!(
    node &&
    ((node as any).type === "FRAME" || (node as any).type === "GROUP")
  );

export const isGeometryNode = (node: unknown): node is GeometryMixin =>
  !!(node && (node as any).fills);

// Forward declaration for getAssumeSizeTypeForNode
// This will be defined in figma-to-code.ts but we need to reference it
declare function getAssumeSizeTypeForNode(
  node: SceneNode,
  direction: "width" | "height"
): SizeType;

export const isImage = (node: unknown): node is GeometryMixin =>
  Boolean(
    isGeometryNode(node) &&
      typeof node.fills !== "symbol" &&
      node.fills.find((item) => item.type === "IMAGE") &&
      (typeof getAssumeSizeTypeForNode === "undefined" ||
        getAssumeSizeTypeForNode(node as any, "height") !== "fixed")
  );

export const getImage = (node: unknown) =>
  (isGeometryNode(node) &&
    typeof node.fills !== "symbol" &&
    (node.fills.find((item) => item.type === "IMAGE") as ImagePaint)) ||
  null;

export const getMetadata = (node: SceneNode): NodeMetaData | null => {
  const anyNode = node as any;
  if (anyNode.data) {
    return anyNode.data;
  } else if (node.getSharedPluginData) {
    return (
      JSON.parse(node.getSharedPluginData("html-to-figma", "data") || "{}") ||
      {}
    );
  } else {
    return null;
  }
};

export function traverseNode(
  node: SceneNode,
  cb: (node: SceneNode, parent: SceneNode | null) => void,
  _parent: SceneNode | null = null
) {
  cb(node, _parent);
  if (hasChildren(node)) {
    for (const child of node.children) {
      traverseNode(child, cb, node);
    }
  }
}
