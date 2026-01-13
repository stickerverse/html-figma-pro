// TODO: make private package and import this from the public plugin repo
// import { Builder, BuilderElement } from "@builder.io/sdk";
type BuilderElement = any;
import traverse from "traverse";
import { fastClone } from "../plugin/functions/fast-clone";

// Re-export utilities from figma-utils to maintain backward compatibility
export * from "./figma-utils";
import {
  hasChildren,
  hasConstraints,
  isGeometryNode,
  getMetadata,
  traverseNode,
  isTextNode,
  isRectangleNode,
  isFrameNode,
  isImage,
  getImage,
  SizeType,
  ComponentType,
  NodeMetaData,
} from "./figma-utils";

const el = (options?: Partial<BuilderElement>): BuilderElement => ({
  "@type": "element",
  id: "node-" + Math.random().toString().split(".")[1],
  ...options,
});

const isCenteredX = (node: SceneNode, parent: SceneNode) => {
  if (hasConstraints(node)) {
    if (node.constraints.horizontal === "CENTER") {
      return true;
    }
  }
  return false;
};
const isRightJustified = (node: SceneNode, parent: SceneNode) => {
  if (hasConstraints(node)) {
    if (node.constraints.horizontal === "MAX") {
      return true;
    }
  }
  return false;
};
const isCenteredY = (node: SceneNode, parent: SceneNode) => {
  if (hasConstraints(node)) {
    if (node.constraints.vertical === "CENTER") {
      return true;
    }
  }
  return false;
};
const isBottomJustified = (node: SceneNode, parent: SceneNode) => {
  if (hasConstraints(node)) {
    if (node.constraints.vertical === "MAX") {
      return true;
    }
  }
  return false;
};

const isImageNode = (node: SceneNode) => {
  const image = getImage(node);
  const assumedLayout = getAssumeLayoutTypeForNode(node);
  return image && !isTextNode(node) && assumedLayout !== "columns";
};

const isAbsolute = (node: any) => true;
// Boolean(
//   node && node.data && ["absolute", "fixed"].includes(node.data.position)
// );

export function getCss(node: SceneNode, parent: SceneNode | null) {
  const layout = getAssumeLayoutTypeForNode(node);
  const parentLayout = parent && getAssumeLayoutTypeForNode(parent);
  const useAbsolute = isAbsolute(node); //  parentLayout === "unknown";

  // parentLayout && ["canvas", "unknown"].includes(parentLayout);

  const numberValue = <T>(thing: T, property: keyof T) => {
    const value = thing[property];
    if (property === "lineHeight") {
      console.log("value", value);
    }
    return typeof value === "string" && value.trim().endsWith("%")
      ? value
      : typeof value === "number"
      ? value + "px"
      : value && typeof (value as any).value === "number"
      ? (value as any).value + ((value as any).unit === "PERCENT" ? "%" : "px")
      : undefined;
  };

  // TODO: top and left margin distances

  const styles: Partial<CSSStyleDeclaration> = {
    ...(isImage(node) &&
      (parentLayout === "stack"
        ? {
            alignSelf: "stretch",
          }
        : parentLayout && "row"
        ? {
            flexGrow: "1",
          }
        : null)),
    ...(layout === "row" && {
      flexDirection: "row",
    }),
    ...(layout === "grid" && {
      flexDirection: "row",
      flexWrap: "wrap",
    }),
    ...(useAbsolute && {
      position: "absolute",
      // TODO: offset from parent or topmost/leftmost first item in selection
      top: node.y + "px",
      left: node.x + "px",
      width: node.width + "px",
      height: node.height + "px",
    }),
  };

  if (
    (hasChildren(node) &&
      node.children.length === 1 &&
      isCenteredY(node.children[0], node)) ||
    getAssumeSizeTypeForNode(node, "height") === "fixed"
  ) {
    styles.height = node.height + "px";
  }

  if (getAssumeSizeTypeForNode(node, "width") === "shrink") {
    if (hasConstraints(node)) {
      if (node.constraints.horizontal === "MIN") {
        styles.alignSelf = "flex-start";
      } else if (node.constraints.horizontal === "MAX") {
        styles.alignSelf = "flex-end";
      } else {
        styles.alignSelf = "center";
      }
    } else {
      styles.alignSelf = "center";
    }
  }

  if (getAssumeSizeTypeForNode(node, "width") === "fixed") {
    styles.width = node.width + "px";
  }

  if (isRectangleNode(node)) {
    styles.borderRadius = numberValue(node, "cornerRadius");
  }

  if (isGeometryNode(node)) {
    if (node.strokes && node.strokes.length) {
      const stroke = node.strokes[0];
      if (stroke.type === "SOLID") {
        const color = stroke.color;
        const colorString = `rgba(${Math.round(color.r * 255)}, ${Math.round(
          color.g * 255
        )}, ${Math.round(color.b * 255)}, ${
          typeof stroke.opacity === "number" ? stroke.opacity : 1
        })`;
        styles.borderColor = colorString;
      }
      if (typeof node.strokeWeight === "number") {
        styles.borderWidth = node.strokeWeight + "px";
      }
      styles.borderStyle = "solid";
    }

    if (Array.isArray(node.fills)) {
      (node.fills as Paint[]).forEach((fill) => {
        if (!fill.visible) {
          return;
        }
        if (fill.type === "SOLID") {
          const { color } = fill;
          const colorString = `rgba(${Math.round(color.r * 255)}, ${Math.round(
            color.g * 255
          )}, ${Math.round(color.b * 255)}, ${
            typeof fill.opacity === "number" ? fill.opacity : 1
          })`;
          if (node.type === "TEXT") {
            styles.color = colorString;
          } else {
            styles.backgroundColor = colorString;
          }
        }
        if (fill.type === "IMAGE") {
          if (
            // isTextNode(node) ||
            // getAssumeLayoutTypeForNode(node) === "columns"
            !isImage(node)
          ) {
            const url = (fill as any).url;
            if (url) {
              styles.backgroundImage = `url("${url}")`;
              styles.backgroundSize =
                fill.scaleMode === "FIT" ? "contain" : "cover"; // fill.
              styles.backgroundRepeat = "no-repeat";
              styles.backgroundPosition = "center";
            }
          }
        }
      });
    }
  }

  if (isTextNode(node)) {
    styles.fontSize = numberValue(node, "fontSize");
    styles.lineHeight = numberValue(node, "lineHeight");
    styles.letterSpacing = numberValue(node, "letterSpacing");
    styles.textAlign =
      (node.textAlignHorizontal && node.textAlignHorizontal.toLowerCase()) ||
      undefined;
    // styles.textDecoration = node.textDecoration
    styles.fontFamily =
      (typeof node.fontName !== "symbol" && node.fontName.family) || undefined;
  }

  return styles;
}

const last = <T>(arr: Array<T> | ReadonlyArray<T>) => arr[arr.length - 1];

const sortBy = <T>(arr: Array<T> | ReadonlyArray<T>, fn: (item: T) => any) => {
  return arr.slice().sort((a, b) => {
    const aVal = fn(a);
    const bVal = fn(b);
    return aVal > bVal ? 1 : bVal > aVal ? -1 : 0;
  });
};

export function sortChildren(nodes: SceneNode[]) {
  // TODO: this is wrong for grids
  return sortBy(nodes, (node) => node.x + node.y);
}

function omit<T extends object>(obj: T, ...values: (keyof T)[]): Partial<T> {
  const newObject = Object.assign({}, obj);
  for (const key of values) {
    delete (newObject as any)[key];
  }
  return newObject;
}

export function processBackgroundLayer(node: SceneNode) {
  if (hasChildren(node) && node.children.length) {
    const lastChild = node.children[0];
    if (
      !hasChildren(lastChild) &&
      // OR round these
      Math.abs(lastChild.x) < 1 &&
      Math.abs(lastChild.y) < 1 &&
      Math.abs(lastChild.width - node.width) < 1 &&
      Math.abs(lastChild.height - node.height) < 1 &&
      lastChild.type !== "VECTOR"
    ) {
      const last = (node.children as SceneNode[]).shift()!;
      Object.assign(node, omit(last as any, "type", "children", "constraints"));
    }
  }
}
export function processFillImages(node: SceneNode) {
  if (isGeometryNode(node)) {
    if (typeof node.fills !== "symbol") {
      node.fills.forEach((fill) => {
        if (fill.visible === false) {
          return;
        }
        if (fill.type === "IMAGE" && !(fill as any).url) {
          // const intArr = (fill as any).intArr as Uint8Array | undefined;
          // if (intArr) {
          //   console.log('intArr and no url', fill)
          //   try {
          //     const url =
          //       "data:image/png;base64," + arrayBufferToBase64(intArr);
          //     (fill as any).url = url;
          //   } catch (err) {
          //     console.warn("Could not set background image", node, fill, err);
          //   }
          // } else {
          console.log("No URL on image fill!", fill);
          (fill as any).url = "https://via.placeholder.com/150";
        }
        // }
      });
    }
  }
}

export interface FigmaToBuilderOptions {
  base64images?: boolean;
}

export function figmaToCode(
  figmaNode: SceneNode,
  parent?: SceneNode | null,
  options?: FigmaToBuilderOptions
): BuilderElement {
  // TODO: unsafe - be sure to clone this preserving Uint8Array
  const node = figmaNode;

  if (node.type === "VECTOR") {
    node.fills = [
      ...(Array.isArray(node.fills) ? node.fills : []),
      {
        type: "IMAGE",
        ...({
          url: "https://via.placeholder.com/150",
        } as any),
      },
    ];
  }

  processBackgroundLayer(node);
  processFillImages(node);

  const layout = getAssumeLayoutTypeForNode(node);

  const children =
    hasChildren(node) && sortChildren(node.children as SceneNode[]);
  if (children) {
    (node as any).children = children;
  }

  const image = getImage(node);

  const widths = children && children.map((item) => item.width);
  const allChildWidths = widths && widths.reduce((memo, num) => memo + num, 0);

  return el({
    // id: "node-" + node.id,
    responsiveStyles: {
      large: getCss(node, parent || null),
    },
    // TODO: maybe put original layer ID in metadata
    layerName: ["Frame", "Rectangle"].includes(node.name)
      ? undefined
      : node.name.length > 30
      ? node.name.substr(0, 30) + "..."
      : "",
    ...({
      meta: {
        figmaLayerId: node.id,
      },
    } as any),
    component: isTextNode(node)
      ? {
          name: "Text",
          options: {
            text: node.characters || "",
          },
        }
      : layout === "columns"
      ? {
          name: "Columns",
          // TODO: gutter var = average distance
          options: {
            // TODO: widths
            space: 10,
            stackColumnsAt: "tablet", // should be 'medium'
            columns:
              children &&
              children.map((child: SceneNode) => ({
                // width: 100 / children.length,
                blocks: [figmaToCode(child)],
                width:
                  Math.fround(
                    (child.width / (allChildWidths || node.width)) * 10000
                  ) / 100,
              })),
          },
        }
      : image
      ? // TODO: delete background image if set
        {
          name: "Image",
          options: {
            image: (image as any).url,
            aspectRatio: node.height / node.width,
            backgroundPosition: "center",
            backgroundSize: image.scaleMode === "FIT" ? "contain" : "cover",
          },
        }
      : undefined,
    children:
      children && layout !== "columns"
        ? children
            .slice()
            .reverse()
            .map((child: SceneNode) => figmaToCode(child, node))
        : undefined,
  });
}

export function canConvertToCode(node: SceneNode) {
  const assumed = getAssumeLayoutTypeForNode(node);
  return Boolean(assumed && assumed !== "unknown");
}

export const collidesVertically = (a: SceneNode, b: SceneNode, margin = 0) =>
  a.y + a.height + margin > b.y && a.y - margin < b.y + b.height;

export const collidesHorizontally = (a: SceneNode, b: SceneNode) =>
  a.x + a.width > b.x && a.x < b.x + b.width;

export function getAssumeSizeTypeForNode(
  node: SceneNode,
  direction: "width" | "height"
): SizeType {
  return "expand";
}

export function getAssumeLayoutTypeForNode(node: SceneNode): ComponentType {
  return "canvas";
}

const isElement = (thing: unknown): thing is BuilderElement => {
  if (!thing) {
    return false;
  }
  return (thing as any)["@type"] === "element";
};

const getElStyles = (block: BuilderElement) => {
  return (block.responsiveStyles && block.responsiveStyles.large) || {};
};
const getElPosition = (block: BuilderElement) => {
  const styles = getElStyles(block);
  return {
    top: parseFloat(styles.top || "") || 0,
    left: parseFloat(styles.left || "") || 0,
  };
};

const getTopMostElement = (blocks: BuilderElement[]) => {
  return blocks.reduce((memo, block) => {
    if (!memo) {
      return block;
    }
    return getElPosition(block).top < getElPosition(memo).top ? block : memo;
  }, null as BuilderElement | null);
};
const getLeftMostElement = (blocks: BuilderElement[]) => {
  return blocks.reduce((memo, block) => {
    if (!memo) {
      return block;
    }
    return getElPosition(block).left < getElPosition(memo).left ? block : memo;
  }, null as BuilderElement | null);
};

const removeExcessLayers = (...elements: BuilderElement[]) => {
  traverse(elements).forEach(function (item) {
    // Replaces isBuilderElement with isElement anywhere
    if (isElement(item)) {
      if (
        Object.keys(
          (item.responsiveStyles && item.responsiveStyles.large) || {}
        )
          .sort()
          .join() === "height,left,position,top,width"
      ) {
        const children = item.children;
        if (children && children.length) {
          const parentNode = this.parent && this.parent.node;
          if (Array.isArray(parentNode)) {
            const index = parentNode.indexOf(item);
            if (index > -1) {
              parentNode.splice(index, 1, ...children);
            }
            return;
          }
        }
        this.remove();
      }
    }
  });
};

// Import elements and convert their absolute positioning to accomodate for hierarchy
// (aka remove the top/left of each parent from each child)
export function selectionToCode(
  selection: SceneNode[],
  options: FigmaToBuilderOptions = {}
) {
  if (!selection.length) {
    return [];
  }
  const converted = selection.map((item) => figmaToCode(item, null, options));

  console.log(JSON.stringify({ step1: fastClone(converted) }, null, 2));

  const topMostOfSelection = getTopMostElement(converted)!;
  const leftMostOfSelection = getLeftMostElement(converted)!;

  const topMostTop = getElPosition(topMostOfSelection).top;
  const leftMostLeft = getElPosition(leftMostOfSelection).left;

  const newValuesById: { [id: string]: { top: number; left: number } } = {};

  removeExcessLayers(...converted);

  // First pass, gather new values
  traverse(converted).forEach(function (item) {
    if (isElement(item)) {
      if (this.path.length === 1) {
        // We want leaves
        return;
      }

      const position = getElPosition(item);
      let top = position.top;
      let left = position.left;

      for (const parent of this.parents) {
        const node = parent.node;
        if (isElement(node)) {
          const parentLayout = getElPosition(node);
          top = top - parentLayout.top;
          left = left - parentLayout.left;
          break;
        }
      }
      newValuesById[item.id!] = { top, left };
    }
  });

  // Second pass, apply new values
  traverse(converted).forEach(function (item) {
    if (isElement(item)) {
      const newValues = newValuesById[item.id!];
      if (newValues) {
        Object.assign(item.responsiveStyles!.large!, {
          top: `${newValues.top}px`,
          left: `${newValues.left}px`,
        });
      }
    }
  });

  console.log(JSON.stringify({ step2: fastClone(converted) }, null, 2));

  for (const el of converted) {
    const position = getElPosition(el);
    el.responsiveStyles!.large!.top = `${position.top - topMostTop}px`;
    el.responsiveStyles!.large!.left = `${position.left - leftMostLeft}px`;
  }

  console.log(JSON.stringify({ step3: fastClone(converted) }, null, 2));
  return converted;
}
