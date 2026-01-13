<p align="center">
  <img alt="Html figma logo" src="https://via.placeholder.com/128" />
</p>

<br />

# HTML <-> Figma

Figma plugin to convert HTML from a URL to Figma, or convert Figma designs to code.

## How does it work

1. [Install the plugin](https://www.figma.com/c/plugin/747985167520967365/HTML-To-Figma)
1. In Figma, open a new or existing document, then hit cmd+/ and search "html figma" and hit enter
1. Enter a URL you want to import

<img src="https://i.imgur.com/YNDD9dH.gif" alt="Plugin demo" width="480" />

## Why?

- Easily import real live site styles for a starting point for designs and prototypes
- Quickly turn real site components into design components
- Easy import from storybook, etc

## Chrome Extension

Want to capture a page behind an auth wall, or in a specific state you need to navigate to? Then the [chrome extension](https://chrome.google.com/webstore/detail/efjcmgblfpkhbjpkpopkgeomfkokpaim) is for you!

<img src="https://imgur.com/ARz16KC.gif" alt="Chrome extension demo" width="480" />

## Using the library

```js
// npm install html-to-figma
import { htmlToFigma } from "html-to-figma";
const layers = htmlToFigma(document.body);
// E.g. send these to the REST API, or generate a .figma.json file that can be uploaded through the Figma plugin
```

## Limitations

Importing HTML layers to Figma is a best-effort process. Even getting 90% there can save you a ton of time, only having to clean up a few things.

### Remaining Limitations:

- Cross-origin iframe content cannot be captured (security restriction)
- Some CSS properties may have limited support (clip-path, advanced filters)
- Animated content (videos, animated gifs) captured as static images
- Fonts must be uploaded to Figma for exact matching

## Recent Improvements ✨

### Newly Supported Features:
- ✅ **Gradient backgrounds** (linear-gradient, radial-gradient)
- ✅ **Pseudo-elements** (::before, ::after with backgrounds)
- ✅ **iframes** (captured as placeholder rectangles)
- ✅ **Element opacity** (properly transferred to Figma layers)
- ✅ **Multiple box shadows** (including inner/inset shadows)
- ✅ **Font weight & style** (bold, italic, weight values 100-900)
- ✅ **Text shadows** (captured in styles)
- ✅ **CSS transforms** (captured in properties)
- ✅ **CSS filters** (blur, brightness, etc.)
- ✅ **Blend modes** (mix-blend-mode)

### CSS Properties Now Captured:
- opacity, transform, filter
- text-shadow, font-weight, font-style
- mix-blend-mode, clip-path
- All gradient variations

If you find any issues or have feedback at all please make an issue.

## TODO

- [ ] Support code import (Figma to Code)
- [ ] Support Figma components
- [ ] Better font matching with fallback system
- [ ] Advanced filter effects
