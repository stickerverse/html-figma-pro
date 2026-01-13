export interface SvgNode extends DefaultShapeMixin, ConstraintMixin {
  type: "SVG";
  svg: string;
}

export function htmlToFigma(
  selector: HTMLElement | string = "body",
  useFrames = false,
  time = false
) {
  function getDirectionMostOfElements(
    direction: "left" | "right" | "top" | "bottom",
    elements: Element[]
  ) {
    if (elements.length === 1) {
      return elements[0];
    }
    return elements.reduce((memo, value: Element) => {
      if (!memo) {
        return value;
      }

      if (direction === "left" || direction === "top") {
        if (
          getBoundingClientRect(value)[direction] <
          getBoundingClientRect(memo)[direction]
        ) {
          return value;
        }
      } else {
        if (
          getBoundingClientRect(value)[direction] >
          getBoundingClientRect(memo)[direction]
        ) {
          return value;
        }
      }
      return memo;
    }, null as Element | null);
  }
  function getAggregateRectOfElements(elements: Element[]) {
    if (!elements.length) {
      return null;
    }

    const top = getBoundingClientRect(
      getDirectionMostOfElements("top", elements)!
    ).top;
    const left = getBoundingClientRect(
      getDirectionMostOfElements("left", elements)!
    ).left;
    const bottom = getBoundingClientRect(
      getDirectionMostOfElements("bottom", elements)!
    ).bottom;
    const right = getBoundingClientRect(
      getDirectionMostOfElements("right", elements)!
    ).right;
    const width = right - left;
    const height = bottom - top;
    return {
      top,
      left,
      bottom,
      right,
      width,
      height,
    };
  }
  function getBoundingClientRect(el: Element): ClientRect {
    const computed = getComputedStyle(el);
    const display = computed.display;
    if (display && display.includes("inline") && el.children.length) {
      const elRect = el.getBoundingClientRect();
      const aggregateRect = getAggregateRectOfElements(
        Array.from(el.children)
      )!;

      if (elRect.width > aggregateRect.width) {
        return {
          ...aggregateRect,
          width: elRect.width,
          left: elRect.left,
          right: elRect.right,
        };
      }
      return aggregateRect;
    }

    return el.getBoundingClientRect();
  }

  if (time) {
    console.time("Parse dom");
  }
  function getAppliedComputedStyles(
    element: Element,
    pseudo?: string
  ): { [key: string]: string } {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
      return {};
    }

    const styles = getComputedStyle(element, pseudo);

    const list: (keyof React.CSSProperties)[] = [
      "opacity",
      "backgroundColor",
      "border",
      "borderTop",
      "borderLeft",
      "borderRight",
      "borderBottom",
      "borderRadius",
      "backgroundImage",
      "borderColor",
      "boxShadow",
      "transform",
      "filter",
      "textShadow",
      "fontWeight",
      "fontStyle",
      "mixBlendMode",
      "clipPath",
    ];

    const color = styles.color;

    const defaults: any = {
      transform: "none",
      opacity: "1",
      borderRadius: "0px",
      backgroundImage: "none",
      backgroundPosition: "0% 0%",
      backgroundSize: "auto",
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundAttachment: "scroll",
      border: "0px none " + color,
      borderTop: "0px none " + color,
      borderBottom: "0px none " + color,
      borderLeft: "0px none " + color,
      borderRight: "0px none " + color,
      borderWidth: "0px",
      borderColor: color,
      borderStyle: "none",
      boxShadow: "none",
      fontWeight: "400",
      textAlign: "start",
      justifyContent: "normal",
      alignItems: "normal",
      alignSelf: "auto",
      flexGrow: "0",
      textDecoration: "none solid " + color,
      lineHeight: "normal",
      letterSpacing: "normal",
      backgroundRepeat: "repeat",
      zIndex: "auto", // TODO
    };

    function pick<T extends { [key: string]: V }, V = any>(
      object: T,
      paths: (keyof T)[]
    ) {
      const newObject: Partial<T> = {};
      paths.forEach((path) => {
        if (object[path]) {
          if (object[path] !== defaults[path]) {
            newObject[path] = object[path];
          }
        }
      });
      return newObject;
    }

    return pick(styles, list as any) as any;
  }
  function size(obj: object) {
    return Object.keys(obj).length;
  }

  type WithRef<T> = Partial<T> & { ref?: Element | Node };

  type LayerNode = WithRef<RectangleNode | TextNode | FrameNode | SvgNode>;

  const layers: LayerNode[] = [];
  const el =
    selector instanceof HTMLElement
      ? selector
      : document.querySelector(selector || "body");

  function textNodesUnder(el: Element) {
    let n: Node | null = null;
    const a: Node[] = [];
    const walk = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while ((n = walk.nextNode())) {
      a.push(n);
    }
    return a;
  }

  const getUrl = (url: string) => {
    if (!url) {
      return "";
    }
    let final = url.trim();
    if (final.startsWith("//")) {
      final = "https:" + final;
    }

    if (final.startsWith("/")) {
      final = "https://" + location.host + final;
    }

    return final;
  };

  interface Unit {
    unit: "PIXELS";
    value: number;
  }

  const parseUnits = (str?: string | null): null | Unit => {
    if (!str) {
      return null;
    }
    const match = str.match(/([\d\.]+)px/);
    const val = match && match[1];
    if (val) {
      return {
        unit: "PIXELS",
        value: parseFloat(val),
      };
    }
    return null;
  };

  // Internal RGB parser for gradient parsing
  function getRgbInternal(colorString?: string | null) {
    if (!colorString) return null;
    const rgbMatch = colorString.match(
      /rgba?\(([\d\.]+),\s*([\d\.]+),\s*([\d\.]+)(?:,\s*([\d\.]+))?\)/
    );
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]) / 255,
        g: parseInt(rgbMatch[2]) / 255,
        b: parseInt(rgbMatch[3]) / 255,
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
      };
    }
    const hexMatch = colorString.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return {
        r: parseInt(hex.substr(0, 2), 16) / 255,
        g: parseInt(hex.substr(2, 2), 16) / 255,
        b: parseInt(hex.substr(4, 2), 16) / 255,
        a: 1,
      };
    }
    return null;
  }

  interface ColorStop {
    color: { r: number; g: number; b: number; a: number };
    position: number;
  }

  // Parse CSS linear/radial gradients
  const parseGradient = (gradientStr: string): any | null => {
    if (!gradientStr || gradientStr === "none") return null;

    const linearMatch = gradientStr.match(/linear-gradient\(([^)]+)\)/);
    if (linearMatch) {
      const parts = linearMatch[1].split(/,(?![^(]*\))/);
      let angle = 180;
      let colorStops: string[] = [];

      const firstPart = parts[0].trim();
      if (firstPart.includes("deg")) {
        angle = parseFloat(firstPart);
        colorStops = parts.slice(1);
      } else if (firstPart.startsWith("to ")) {
        const dir = firstPart.replace("to ", "");
        const dirMap: { [k: string]: number } = {
          top: 0,
          right: 90,
          bottom: 180,
          left: 270,
          "top right": 45,
          "bottom right": 135,
          "bottom left": 225,
          "top left": 315,
        };
        angle = dirMap[dir] || 180;
        colorStops = parts.slice(1);
      } else {
        colorStops = parts;
      }

      const stops: ColorStop[] = [];
      colorStops.forEach((stop, i) => {
        // Match color followed by optional position (% or px)
        const m = stop
          .trim()
          .match(
            /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-z]+)\s*([\d.]+%|[\d.]+px)?$/i
          );
        if (m) {
          const rgb = getRgbInternal(m[1].trim());
          let pos: number;
          if (m[2]) {
            if (m[2].endsWith("%")) {
              pos = parseFloat(m[2]) / 100;
            } else if (m[2].endsWith("px")) {
              // For pixel values, normalize to 0-1 range (assume 100px = 10%)
              // This is a rough estimate since we don't know the element size
              pos = Math.min(parseFloat(m[2]) / 1000, 1);
            } else {
              pos = i / Math.max(colorStops.length - 1, 1);
            }
          } else {
            pos = i / Math.max(colorStops.length - 1, 1);
          }
          if (rgb) stops.push({ color: { ...rgb }, position: pos });
        }
      });

      if (stops.length >= 2) {
        const rad = ((angle - 90) * Math.PI) / 180;
        return {
          type: "GRADIENT_LINEAR",
          gradientTransform: [
            [Math.cos(rad), Math.sin(rad), 0.5],
            [-Math.sin(rad), Math.cos(rad), 0.5],
          ],
          gradientStops: stops,
        };
      }
    }

    const radialMatch = gradientStr.match(/radial-gradient\(([^)]+)\)/);
    if (radialMatch) {
      const parts = radialMatch[1].split(/,(?![^(]*\))/);
      const colorStops = parts.length > 1 ? parts.slice(1) : parts;

      const stops: ColorStop[] = [];
      colorStops.forEach((stop, i) => {
        const m = stop.trim().match(/(.*?)\s*(\d+%)?$/);
        if (m) {
          const rgb = getRgbInternal(m[1].trim());
          const pos = m[2]
            ? parseFloat(m[2]) / 100
            : i / Math.max(colorStops.length - 1, 1);
          if (rgb) stops.push({ color: { ...rgb }, position: pos });
        }
      });

      if (stops.length >= 2) {
        return {
          type: "GRADIENT_RADIAL",
          gradientTransform: [
            [1, 0, 0.5],
            [0, 1, 0.5],
          ],
          gradientStops: stops,
        };
      }
    }

    return null;
  };

  // Map font weight string to numeric value
  const parseFontWeight = (weight: string): number => {
    const weightMap: { [k: string]: number } = {
      normal: 400,
      bold: 700,
      bolder: 700,
      lighter: 300,
      "100": 100,
      "200": 200,
      "300": 300,
      "400": 400,
      "500": 500,
      "600": 600,
      "700": 700,
      "800": 800,
      "900": 900,
    };
    return weightMap[weight] || 400;
  };

  function isHidden(element: Element) {
    let el: Element | null = element;
    do {
      const computed = getComputedStyle(el);
      if (
        // computed.opacity === '0' ||
        computed.display === "none" ||
        computed.visibility === "hidden"
      ) {
        return true;
      }
      // Some sites hide things by having overflow: hidden and height: 0, e.g. dropdown menus that animate height in
      if (
        computed.overflow !== "visible" &&
        el.getBoundingClientRect().height < 1
      ) {
        return true;
      }
    } while ((el = el.parentElement));
    return false;
  }

  if (el) {
    // Process SVG <use> elements
    for (const use of Array.from(el.querySelectorAll("use"))) {
      try {
        const symbolSelector = use.href.baseVal;
        const symbol: SVGSymbolElement | null =
          document.querySelector(symbolSelector);
        if (symbol) {
          use.outerHTML = symbol.innerHTML;
        }
      } catch (err) {
        console.warn("Error querying <use> tag href", err);
      }
    }

    const getShadowEls = (el: Element): Element[] =>
      Array.from(
        (el.shadowRoot && el.shadowRoot.querySelectorAll("*")) ||
          ([] as Element[])
      ).reduce((memo, el) => {
        memo.push(el);
        memo.push(...getShadowEls(el));
        return memo;
      }, [] as Element[]);

    const els = Array.from(el.querySelectorAll("*")).reduce((memo, el) => {
      memo.push(el);
      memo.push(...getShadowEls(el));
      return memo;
    }, [] as Element[]);

    if (els) {
      Array.from(els).forEach((el) => {
        if (isHidden(el)) {
          return;
        }
        if (el instanceof SVGSVGElement) {
          const rect = el.getBoundingClientRect();

          // TODO: pull in CSS/computed styles
          // TODO: may need to pull in layer styles too like shadow, bg color, etc
          layers.push({
            type: "SVG",
            ref: el,
            svg: el.outerHTML,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
          return;
        }
        // Sub SVG Eleemnt
        else if (el instanceof SVGElement) {
          return;
        }

        if (
          el.parentElement &&
          el.parentElement instanceof HTMLPictureElement
        ) {
          return;
        }

        // Handle iframes - capture as placeholder
        if (el instanceof HTMLIFrameElement) {
          const rect = el.getBoundingClientRect();
          if (rect.width >= 1 && rect.height >= 1) {
            layers.push({
              type: "RECTANGLE",
              ref: el,
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              fills: [
                {
                  type: "SOLID",
                  color: { r: 0.9, g: 0.9, b: 0.9 },
                  opacity: 1,
                },
              ] as any,
              strokes: [
                {
                  type: "SOLID",
                  color: { r: 0.8, g: 0.8, b: 0.8 },
                  opacity: 1,
                },
              ],
              strokeWeight: 1,
              name: `iframe: ${el.src || "embedded content"}`,
            } as any);
          }
          return;
        }

        // Handle pseudo-elements (::before and ::after)
        const processPseudo = (pseudo: "::before" | "::after") => {
          const pseudoStyle = getComputedStyle(el, pseudo);
          const content = pseudoStyle.content;
          if (
            content &&
            content !== "none" &&
            content !== '""' &&
            content !== "''"
          ) {
            const elRect = el.getBoundingClientRect();

            // Check if this is an icon font (FontAwesome, Material Icons, etc.)
            const fontFamily = pseudoStyle.fontFamily || "";
            const isIconFont =
              /font\s*awesome|material|icon|icomoon|glyphicon/i.test(
                fontFamily
              );

            // Get dimensions - for icon fonts, use fontSize as dimension
            let width = parseFloat(pseudoStyle.width || "0") || 0;
            let height = parseFloat(pseudoStyle.height || "0") || 0;

            if (isIconFont && (width < 1 || height < 1)) {
              const fontSize = parseFloat(pseudoStyle.fontSize || "16") || 16;
              width = fontSize;
              height = fontSize;
            }

            if (width >= 1 && height >= 1) {
              const pseudoFills: Paint[] = [];

              // For icon fonts, use the text color as fill
              if (isIconFont) {
                const iconColor = getRgbInternal(pseudoStyle.color);
                if (iconColor) {
                  pseudoFills.push({
                    type: "SOLID",
                    color: { r: iconColor.r, g: iconColor.g, b: iconColor.b },
                    opacity: iconColor.a,
                  } as SolidPaint);
                }
              } else {
                const bgColor = getRgbInternal(pseudoStyle.backgroundColor);
                if (bgColor && bgColor.a > 0) {
                  pseudoFills.push({
                    type: "SOLID",
                    color: { r: bgColor.r, g: bgColor.g, b: bgColor.b },
                    opacity: bgColor.a,
                  } as SolidPaint);
                }
              }

              // Check for gradient
              if (
                pseudoStyle.backgroundImage &&
                pseudoStyle.backgroundImage !== "none"
              ) {
                const gradFill = parseGradient(pseudoStyle.backgroundImage);
                if (gradFill) pseudoFills.push(gradFill);
              }

              // Calculate position based on pseudo-element display
              const position = pseudoStyle.position || "static";
              let x = elRect.left;
              let y = elRect.top;

              if (position === "absolute") {
                // Absolute positioned pseudo-elements
                const left = parseFloat(pseudoStyle.left || "0") || 0;
                const top = parseFloat(pseudoStyle.top || "0") || 0;
                x = elRect.left + left;
                y = elRect.top + top;
              } else {
                // Inline pseudo-elements - position at start or end of parent
                if (pseudo === "::after") {
                  x = elRect.right - width;
                }
              }

              // Create node if we have fills, or if it's an icon font
              if (pseudoFills.length > 0 || isIconFont) {
                const pseudoNode = {
                  type: "RECTANGLE",
                  ref: el,
                  x: Math.round(x),
                  y: Math.round(y),
                  width: Math.round(width),
                  height: Math.round(height),
                  fills:
                    pseudoFills.length > 0
                      ? (pseudoFills as any)
                      : [
                          {
                            type: "SOLID",
                            color: { r: 0.5, g: 0.5, b: 0.5 },
                            opacity: 0.5,
                          },
                        ],
                  name: isIconFont
                    ? `icon${pseudo} (${fontFamily.split(",")[0].trim()})`
                    : `${el.tagName.toLowerCase()}${pseudo}`,
                } as WithRef<RectangleNode>;

                // Add border radius if present
                const borderRadius =
                  parseFloat(pseudoStyle.borderRadius || "0") || 0;
                if (borderRadius > 0) {
                  (pseudoNode as any).cornerRadius = borderRadius;
                }

                layers.push(pseudoNode);
              }
            }
          }
        };

        processPseudo("::before");
        processPseudo("::after");

        const appliedStyles = getAppliedComputedStyles(el);
        const computedStyle = getComputedStyle(el);

        if (
          (size(appliedStyles) ||
            el instanceof HTMLImageElement ||
            el instanceof HTMLPictureElement ||
            el instanceof HTMLVideoElement) &&
          computedStyle.display !== "none"
        ) {
          const rect = getBoundingClientRect(el);

          if (rect.width >= 1 && rect.height >= 1) {
            const fills: Paint[] = [];

            const color = getRgb(computedStyle.backgroundColor);

            if (color) {
              fills.push({
                type: "SOLID",
                color: {
                  r: color.r,
                  g: color.g,
                  b: color.b,
                },
                opacity: color.a || 1,
              } as SolidPaint);
            }

            const rectNode = {
              type: "RECTANGLE",
              ref: el,
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              fills: fills as any,
            } as WithRef<RectangleNode>;

            // Apply element opacity
            const opacity = parseFloat(computedStyle.opacity || "1");
            if (!isNaN(opacity) && opacity < 1) {
              (rectNode as any).opacity = opacity;
            }

            if (computedStyle.border) {
              const parsed = computedStyle.border.match(
                /^([\d\.]+)px\s*(\w+)\s*(.*)$/
              );
              if (parsed) {
                let [_match, width, type, color] = parsed;
                if (width && width !== "0" && type !== "none" && color) {
                  const rgb = getRgb(color);
                  if (rgb) {
                    rectNode.strokes = [
                      {
                        type: "SOLID",
                        color: { r: rgb.r, b: rgb.b, g: rgb.g },
                        opacity: rgb.a || 1,
                      },
                    ];
                    rectNode.strokeWeight = Math.round(parseFloat(width));
                  }
                }
              }
            }

            if (!rectNode.strokes) {
              const capitalize = (str: string) =>
                str[0].toUpperCase() + str.substring(1);
              const directions = ["top", "left", "right", "bottom"];
              for (const dir of directions) {
                const computed =
                  computedStyle[("border" + capitalize(dir)) as any];
                if (computed) {
                  const parsed = computed.match(/^([\d\.]+)px\s*(\w+)\s*(.*)$/);
                  if (parsed) {
                    let [_match, borderWidth, type, color] = parsed;
                    if (
                      borderWidth &&
                      borderWidth !== "0" &&
                      type !== "none" &&
                      color
                    ) {
                      const rgb = getRgb(color);
                      if (rgb) {
                        const width = ["top", "bottom"].includes(dir)
                          ? rect.width
                          : parseFloat(borderWidth);
                        const height = ["left", "right"].includes(dir)
                          ? rect.height
                          : parseFloat(borderWidth);
                        layers.push({
                          ref: el,
                          type: "RECTANGLE",
                          x:
                            dir === "left"
                              ? rect.left - width
                              : dir === "right"
                              ? rect.right
                              : rect.left,
                          y:
                            dir === "top"
                              ? rect.top - height
                              : dir === "bottom"
                              ? rect.bottom
                              : rect.top,
                          width,
                          height,
                          fills: [
                            {
                              type: "SOLID",
                              color: { r: rgb.r, b: rgb.b, g: rgb.g },
                              opacity: rgb.a || 1,
                            } as SolidPaint,
                          ] as any,
                        } as WithRef<RectangleNode>);
                      }
                    }
                  }
                }
              }
            }

            if (
              computedStyle.backgroundImage &&
              computedStyle.backgroundImage !== "none"
            ) {
              // Check for gradient first
              const gradientFill = parseGradient(computedStyle.backgroundImage);
              if (gradientFill) {
                fills.push(gradientFill);
              } else {
                // Fall back to image URL
                const urlMatch = computedStyle.backgroundImage.match(
                  /url\(['"]?(.*?)['"]?\)/
                );
                const url = urlMatch && urlMatch[1];
                if (url) {
                  fills.push({
                    url,
                    type: "IMAGE",
                    scaleMode:
                      computedStyle.backgroundSize === "contain"
                        ? "FIT"
                        : "FILL",
                    imageHash: null,
                  } as ImagePaint);
                }
              }
            }
            if (el instanceof SVGSVGElement) {
              const url = `data:image/svg+xml,${encodeURIComponent(
                el.outerHTML.replace(/\s+/g, " ")
              )}`;
              if (url) {
                fills.push({
                  url,
                  type: "IMAGE",
                  // TODO: object fit, position
                  scaleMode: "FILL",
                  imageHash: null,
                } as ImagePaint);
              }
            }
            if (el instanceof HTMLImageElement) {
              const url = el.src;
              if (url) {
                fills.push({
                  url,
                  type: "IMAGE",
                  // TODO: object fit, position
                  scaleMode:
                    computedStyle.objectFit === "contain" ? "FIT" : "FILL",
                  imageHash: null,
                } as ImagePaint);
              }
            }
            if (el instanceof HTMLPictureElement) {
              const firstSource = el.querySelector("source");
              if (firstSource) {
                const src = getUrl(firstSource.srcset.split(/[,\s]+/g)[0]);
                // TODO: if not absolute
                if (src) {
                  fills.push({
                    url: src,
                    type: "IMAGE",
                    // TODO: object fit, position
                    scaleMode:
                      computedStyle.objectFit === "contain" ? "FIT" : "FILL",
                    imageHash: null,
                  } as ImagePaint);
                }
              }
            }
            if (el instanceof HTMLVideoElement) {
              const url = el.poster;
              if (url) {
                fills.push({
                  url,
                  type: "IMAGE",
                  // TODO: object fit, position
                  scaleMode:
                    computedStyle.objectFit === "contain" ? "FIT" : "FILL",
                  imageHash: null,
                } as ImagePaint);
              }
            }

            if (computedStyle.boxShadow && computedStyle.boxShadow !== "none") {
              interface ParsedBoxShadow {
                inset: boolean;
                offsetX: number;
                offsetY: number;
                blurRadius: number;
                spreadRadius: number;
                color: string;
              }
              const LENGTH_REG = /^[0-9]+[a-zA-Z%]+?$/;
              const toNum = (v: string): number => {
                if (!/px$/.test(v) && v !== "0") return 0;
                const n = parseFloat(v);
                return !isNaN(n) ? n : 0;
              };
              const isLength = (v: string) => v === "0" || LENGTH_REG.test(v);
              const parseValue = (str: string): ParsedBoxShadow => {
                if (str.startsWith("rgb")) {
                  const colorMatch = str.match(/(rgba?\(.+?\))(.+)/);
                  if (colorMatch) {
                    str = (colorMatch[2] + " " + colorMatch[1]).trim();
                  }
                }

                const PARTS_REG = /\s(?![^(]*\))/;
                const parts = str.split(PARTS_REG);
                const inset = parts.includes("inset");
                const last = parts.slice(-1)[0];
                const color = !isLength(last) ? last : "rgba(0, 0, 0, 1)";

                const nums = parts
                  .filter((n) => n !== "inset")
                  .filter((n) => n !== color)
                  .map(toNum);

                const [offsetX, offsetY, blurRadius, spreadRadius] = nums;

                return {
                  inset,
                  offsetX: offsetX || 0,
                  offsetY: offsetY || 0,
                  blurRadius: blurRadius || 0,
                  spreadRadius: spreadRadius || 0,
                  color,
                };
              };

              // Split multiple box shadows by comma (but not inside rgba())
              const shadowStrings =
                computedStyle.boxShadow.split(/,(?![^(]*\))/);
              const effects: any[] = [];

              for (const shadowStr of shadowStrings) {
                const parsed = parseValue(shadowStr.trim());
                const color = getRgb(parsed.color);
                if (color) {
                  effects.push({
                    color,
                    type: parsed.inset ? "INNER_SHADOW" : "DROP_SHADOW",
                    radius: parsed.blurRadius,
                    spread: parsed.spreadRadius,
                    blendMode: "NORMAL",
                    visible: true,
                    offset: {
                      x: parsed.offsetX,
                      y: parsed.offsetY,
                    },
                  });
                }
              }

              if (effects.length > 0) {
                rectNode.effects = effects;
              }
            }

            const borderTopLeftRadius = parseUnits(
              computedStyle.borderTopLeftRadius
            );
            if (borderTopLeftRadius) {
              rectNode.topLeftRadius = borderTopLeftRadius.value;
            }
            const borderTopRightRadius = parseUnits(
              computedStyle.borderTopRightRadius
            );
            if (borderTopRightRadius) {
              rectNode.topRightRadius = borderTopRightRadius.value;
            }
            const borderBottomRightRadius = parseUnits(
              computedStyle.borderBottomRightRadius
            );
            if (borderBottomRightRadius) {
              rectNode.bottomRightRadius = borderBottomRightRadius.value;
            }
            const borderBottomLeftRadius = parseUnits(
              computedStyle.borderBottomLeftRadius
            );
            if (borderBottomLeftRadius) {
              rectNode.bottomLeftRadius = borderBottomLeftRadius.value;
            }

            layers.push(rectNode);
          }
        }
      });
    }

    const textNodes = textNodesUnder(el);

    function getRgb(colorString?: string | null) {
      if (!colorString) {
        return null;
      }
      const [_1, r, g, b, _2, a] = (colorString!.match(
        /rgba?\(([\d\.]+), ([\d\.]+), ([\d\.]+)(, ([\d\.]+))?\)/
      )! || []) as string[];

      const none = a && parseFloat(a) === 0;

      if (r && g && b && !none) {
        return {
          r: parseInt(r) / 255,
          g: parseInt(g) / 255,
          b: parseInt(b) / 255,
          a: a ? parseFloat(a) : 1,
        };
      }
      return null;
    }

    const fastClone = (data: any) =>
      typeof data === "symbol" ? null : JSON.parse(JSON.stringify(data));

    for (const node of textNodes) {
      if (node.textContent && node.textContent.trim().length) {
        const parent = node.parentElement;
        if (parent) {
          if (isHidden(parent)) {
            continue;
          }
          const computedStyles = getComputedStyle(parent);
          const range = document.createRange();
          range.selectNode(node);
          const rect = fastClone(range.getBoundingClientRect());
          const lineHeight = parseUnits(computedStyles.lineHeight);
          range.detach();
          if (lineHeight && rect.height < lineHeight.value) {
            const delta = lineHeight.value - rect.height;
            rect.top -= delta / 2;
            rect.height = lineHeight.value;
          }
          if (rect.height < 1 || rect.width < 1) {
            continue;
          }

          const textNode = {
            x: Math.round(rect.left),
            ref: node,
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            type: "TEXT",
            characters: node.textContent.trim().replace(/\s+/g, " ") || "",
          } as WithRef<TextNode>;

          const fills: SolidPaint[] = [];
          const rgb = getRgb(computedStyles.color);

          if (rgb) {
            fills.push({
              type: "SOLID",
              color: {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
              },
              opacity: rgb.a || 1,
            } as SolidPaint);
          }

          if (fills.length) {
            textNode.fills = fills;
          }
          const letterSpacing = parseUnits(computedStyles.letterSpacing);
          if (letterSpacing) {
            textNode.letterSpacing = letterSpacing;
          }

          if (lineHeight) {
            textNode.lineHeight = lineHeight;
          }

          const { textTransform } = computedStyles;
          switch (textTransform) {
            case "uppercase": {
              textNode.textCase = "UPPER";
              break;
            }
            case "lowercase": {
              textNode.textCase = "LOWER";
              break;
            }
            case "capitalize": {
              textNode.textCase = "TITLE";
              break;
            }
          }

          const fontSize = parseUnits(computedStyles.fontSize);
          if (fontSize) {
            textNode.fontSize = Math.round(fontSize.value);
          }
          if (computedStyles.fontFamily) {
            // const font = computedStyles.fontFamily.split(/\s*,\s*/);
            (textNode as any).fontFamily = computedStyles.fontFamily;
          }

          // Capture font weight
          if (computedStyles.fontWeight) {
            (textNode as any).fontWeight = parseFontWeight(
              computedStyles.fontWeight
            );
          }

          // Capture font style (italic, oblique)
          if (
            computedStyles.fontStyle &&
            computedStyles.fontStyle !== "normal"
          ) {
            (textNode as any).fontStyle = computedStyles.fontStyle;
          }

          if (computedStyles.textDecoration) {
            if (
              computedStyles.textDecoration === "underline" ||
              computedStyles.textDecoration === "strikethrough"
            ) {
              textNode.textDecoration =
                computedStyles.textDecoration.toUpperCase() as any;
            }
          }
          if (computedStyles.textAlign) {
            if (
              ["left", "center", "right", "justified"].includes(
                computedStyles.textAlign
              )
            ) {
              textNode.textAlignHorizontal =
                computedStyles.textAlign.toUpperCase() as any;
            }
          }

          layers.push(textNode);
        }
      }
    }
  }

  // TODO: send frame: { children: []}
  const root = {
    type: "FRAME",
    width: Math.round(window.innerWidth),
    height: Math.round(document.documentElement.scrollHeight),
    x: 0,
    y: 0,
    ref: document.body,
  } as WithRef<FrameNode>;

  layers.unshift(root);

  const hasChildren = (node: LayerNode): node is ChildrenMixin =>
    node && Array.isArray((node as ChildrenMixin).children);

  function traverse(
    layer: LayerNode,
    cb: (layer: LayerNode, parent?: LayerNode | null) => void,
    parent?: LayerNode | null
  ) {
    if (layer) {
      cb(layer, parent);
      if (hasChildren(layer)) {
        layer.children.forEach((child) =>
          traverse(child as LayerNode, cb, layer)
        );
      }
    }
  }

  function makeTree() {
    function getParent(layer: LayerNode) {
      let response: LayerNode | null = null;
      try {
        traverse(root, (child) => {
          if (
            child &&
            (child as any).children &&
            (child as any).children.includes(layer)
          ) {
            response = child;
            // Deep traverse short circuit hack
            throw "DONE";
          }
        });
      } catch (err) {
        if (err === "DONE") {
          // Do nothing
        } else {
          console.error(err.message);
        }
      }
      return response;
    }

    const refMap = new WeakMap<Element | Node, LayerNode>();
    layers.forEach((layer) => {
      if (layer.ref) {
        refMap.set(layer.ref, layer);
      }
    });

    let updated = true;
    let iterations = 0;
    while (updated) {
      updated = false;
      if (iterations++ > 10000) {
        console.error("Too many tree iterations 1");
        break;
      }

      traverse(root, (layer, originalParent) => {
        // const node = layer.ref!;
        const node = layer.ref;
        let parentElement: Element | null =
          (node && (node as Element).parentElement) || null;
        do {
          if (parentElement === document.body) {
            break;
          }
          if (parentElement && parentElement !== document.body) {
            // Get least common demoninator shared parent and make a group
            const parentLayer = refMap.get(parentElement);
            if (parentLayer === originalParent) {
              break;
            }
            if (parentLayer && parentLayer !== root) {
              if (hasChildren(parentLayer)) {
                if (originalParent) {
                  const index = (originalParent as any).children.indexOf(layer);
                  (originalParent as any).children.splice(index, 1);
                  (parentLayer.children as Array<any>).push(layer);
                  updated = true;
                  return;
                }
              } else {
                let parentRef = parentLayer.ref;
                if (
                  parentRef &&
                  parentRef instanceof Node &&
                  parentRef.nodeType === Node.TEXT_NODE
                ) {
                  parentRef = parentRef.parentElement as Element;
                }
                const overflowHidden =
                  parentRef instanceof Element &&
                  getComputedStyle(parentRef).overflow !== "visible";
                const newParent: LayerNode = {
                  type: "FRAME",
                  clipsContent: !!overflowHidden,
                  // type: 'GROUP',
                  x: parentLayer.x,
                  y: parentLayer.y,
                  width: parentLayer.width,
                  height: parentLayer.height,
                  ref: parentLayer.ref,
                  backgrounds: [] as any,
                  children: [parentLayer, layer] as any[],
                };

                const parent = getParent(parentLayer);
                if (!parent) {
                  console.warn(
                    "\n\nCANT FIND PARENT\n",
                    JSON.stringify({ ...parentLayer, ref: null })
                  );
                  continue;
                }
                if (originalParent) {
                  const index = (originalParent as any).children.indexOf(layer);
                  (originalParent as any).children.splice(index, 1);
                }
                delete parentLayer.ref;
                const newIndex = (parent as any).children.indexOf(parentLayer);
                refMap.set(parentElement, newParent);
                (parent as any).children.splice(newIndex, 1, newParent);
                updated = true;
                return;
              }
            }
          }
        } while (
          parentElement &&
          (parentElement = parentElement.parentElement)
        );
      });
    }
    // Collect tree of depeest common parents and make groups
    let secondUpdate = true;
    let secondIterations = 0;
    while (secondUpdate) {
      if (secondIterations++ > 10000) {
        console.error("Too many tree iterations 2");
        break;
      }
      secondUpdate = false;
      function getParents(node: Element | Node): Element[] {
        let el: Element | null =
          node instanceof Node && node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : (node as Element);

        let parents: Element[] = [];
        while (el && (el = el.parentElement)) {
          parents.push(el);
        }
        return parents;
      }

      function getDepth(node: Element | Node) {
        return getParents(node).length;
      }

      traverse(root, (layer, parent) => {
        if (secondUpdate) {
          return;
        }
        if (layer.type === "FRAME") {
          // Final all child elements with layers, and add groups around  any with a shared parent not shared by another
          const ref = layer.ref as Element;
          if (layer.children && layer.children.length > 2) {
            const childRefs =
              layer.children &&
              (layer.children as LayerNode[]).map((child) => child.ref!);

            let lowestCommonDenominator = layer.ref!;
            let lowestCommonDenominatorDepth = getDepth(
              lowestCommonDenominator
            );

            // Find lowest common demoninator with greatest depth
            for (const childRef of childRefs) {
              const otherChildRefs = childRefs.filter(
                (item) => item !== childRef
              );
              const childParents = getParents(childRef);
              for (const otherChildRef of otherChildRefs) {
                const otherParents = getParents(otherChildRef);
                for (const parent of otherParents) {
                  if (
                    childParents.includes(parent) &&
                    layer.ref!.contains(parent)
                  ) {
                    const depth = getDepth(parent);
                    if (depth > lowestCommonDenominatorDepth) {
                      lowestCommonDenominator = parent;
                      lowestCommonDenominatorDepth = depth;
                    }
                  }
                }
              }
            }
            if (
              lowestCommonDenominator &&
              lowestCommonDenominator !== layer.ref
            ) {
              // Make a group around all children elements
              const newChildren = layer.children!.filter((item: any) =>
                lowestCommonDenominator.contains(item.ref)
              );

              if (newChildren.length !== layer.children.length) {
                const lcdRect = getBoundingClientRect(
                  lowestCommonDenominator as Element
                );

                const overflowHidden =
                  lowestCommonDenominator instanceof Element &&
                  getComputedStyle(lowestCommonDenominator).overflow !==
                    "visible";

                const newParent: LayerNode = {
                  type: "FRAME",
                  clipsContent: !!overflowHidden,
                  ref: lowestCommonDenominator as Element,
                  x: lcdRect.left,
                  y: lcdRect.top,
                  width: lcdRect.width,
                  height: lcdRect.height,
                  backgrounds: [] as any,
                  children: newChildren as any,
                };
                refMap.set(lowestCommonDenominator, ref);
                let firstIndex = layer.children.length - 1;
                for (const child of newChildren) {
                  const childIndex = layer.children.indexOf(child as any);
                  if (childIndex > -1 && childIndex < firstIndex) {
                    firstIndex = childIndex;
                  }
                }
                (layer.children as any).splice(firstIndex, 0, newParent);
                for (const child of newChildren) {
                  const index = layer.children.indexOf(child);
                  if (index > -1) {
                    (layer.children as any).splice(index, 1);
                  }
                }
                secondUpdate = true;
              }
            }
          }
        }
      });
    }
    // Update all positions
    traverse(root, (layer) => {
      if (layer.type === "FRAME" || (layer.type as any) === "GROUP") {
        const { x, y } = layer;
        if (x || y) {
          traverse(layer, (child) => {
            if (child === layer) {
              return;
            }
            child.x = child.x! - x!;
            child.y = child.y! - y!;
          });
        }
      }
    });
  }

  function removeRefs(layers: LayerNode[]) {
    layers.concat([root]).forEach((layer) => {
      traverse(layer, (child) => {
        delete child.ref;
      });
    });
  }

  function addConstraints(layers: LayerNode[]) {
    layers.forEach((layer) => {
      traverse(layer, (child) => {
        if (child.type === "SVG") {
          child.constraints = {
            horizontal: "CENTER",
            vertical: "MIN",
          };
        } else {
          const ref = child.ref;
          if (ref) {
            const el = ref instanceof HTMLElement ? ref : ref.parentElement;
            const parent = el && el.parentElement;
            if (el && parent) {
              const currentDisplay = el.style.display;
              el.style.setProperty("display", "none", "!important");
              let computed = getComputedStyle(el);
              const hasFixedWidth =
                computed.width && computed.width.trim().endsWith("px");
              const hasFixedHeight =
                computed.height && computed.height.trim().endsWith("px");
              el.style.display = currentDisplay;
              const parentStyle = getComputedStyle(parent);
              let hasAutoMarginLeft = computed.marginLeft === "auto";
              let hasAutoMarginRight = computed.marginRight === "auto";
              let hasAutoMarginTop = computed.marginTop === "auto";
              let hasAutoMarginBottom = computed.marginBottom === "auto";

              computed = getComputedStyle(el);

              function setData(node: any, key: string, value: string) {
                if (!(node as any).data) {
                  (node as any).data = {};
                }
                (node as any).data[key] = value;
              }

              if (["absolute", "fixed"].includes(computed.position!)) {
                setData(child, "position", computed.position!);
              }

              if (hasFixedHeight) {
                setData(child, "heightType", "fixed");
              }
              if (hasFixedWidth) {
                setData(child, "widthType", "fixed");
              }

              const isInline =
                computed.display && computed.display.includes("inline");

              if (isInline) {
                const parentTextAlign = parentStyle.textAlign;
                if (parentTextAlign === "center") {
                  hasAutoMarginLeft = true;
                  hasAutoMarginRight = true;
                } else if (parentTextAlign === "right") {
                  hasAutoMarginLeft = true;
                }

                if (computed.verticalAlign === "middle") {
                  hasAutoMarginTop = true;
                  hasAutoMarginBottom = true;
                } else if (computed.verticalAlign === "bottom") {
                  hasAutoMarginTop = true;
                  hasAutoMarginBottom = false;
                }

                setData(child, "widthType", "shrink");
              }
              const parentJustifyContent =
                parentStyle.display === "flex" &&
                ((parentStyle.flexDirection === "row" &&
                  parentStyle.justifyContent) ||
                  (parentStyle.flexDirection === "column" &&
                    parentStyle.alignItems));

              if (parentJustifyContent === "center") {
                hasAutoMarginLeft = true;
                hasAutoMarginRight = true;
              } else if (
                parentJustifyContent &&
                (parentJustifyContent.includes("end") ||
                  parentJustifyContent.includes("right"))
              ) {
                hasAutoMarginLeft = true;
                hasAutoMarginRight = false;
              }

              const parentAlignItems =
                parentStyle.display === "flex" &&
                ((parentStyle.flexDirection === "column" &&
                  parentStyle.justifyContent) ||
                  (parentStyle.flexDirection === "row" &&
                    parentStyle.alignItems));
              if (parentAlignItems === "center") {
                hasAutoMarginTop = true;
                hasAutoMarginBottom = true;
              } else if (
                parentAlignItems &&
                (parentAlignItems.includes("end") ||
                  parentAlignItems.includes("bottom"))
              ) {
                hasAutoMarginTop = true;
                hasAutoMarginBottom = false;
              }

              if (child.type === "TEXT") {
                if (computed.textAlign === "center") {
                  hasAutoMarginLeft = true;
                  hasAutoMarginRight = true;
                } else if (computed.textAlign === "right") {
                  hasAutoMarginLeft = true;
                  hasAutoMarginRight = false;
                }
              }

              child.constraints = {
                horizontal:
                  hasAutoMarginLeft && hasAutoMarginRight
                    ? "CENTER"
                    : hasAutoMarginLeft
                    ? "MAX"
                    : "SCALE",
                vertical:
                  hasAutoMarginBottom && hasAutoMarginTop
                    ? "CENTER"
                    : hasAutoMarginTop
                    ? "MAX"
                    : "MIN",
              };
            }
          } else {
            child.constraints = {
              horizontal: "SCALE",
              vertical: "MIN",
            };
          }
        }
      });
    });
  }

  // TODO: arg can be passed in
  const MAKE_TREE = useFrames;
  if (MAKE_TREE) {
    (root as any).children = layers.slice(1);
    makeTree();
    addConstraints([root]);
    removeRefs([root]);
    if (time) {
      console.info("\n");
      console.timeEnd("Parse dom");
    }
    return [root];
  }

  removeRefs(layers);

  if (time) {
    console.info("\n");
    console.timeEnd("Parse dom");
  }

  return layers;
}
