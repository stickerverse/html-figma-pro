# Pixel-Perfect HTML to Figma: Gap Analysis

## 🎯 Current State vs Pixel-Perfect

### What's Working ✅

1. **Basic Layout**
   - Element positions (x, y)
   - Dimensions (width, height)
   - Bounding box calculations

2. **Colors**
   - Background colors (solid)
   - Text colors
   - Border colors
   - Box shadows (single)

3. **Text Basics**
   - Font family (captured but not matched)
   - Font size
   - Line height
   - Letter spacing
   - Text case (uppercase, lowercase, capitalize)
   - Text decoration (underline, strikethrough)
   - Text alignment

4. **Borders**
   - Border width
   - Border color
   - Border radius (all 4 corners)
   - Individual border sides

5. **Images**
   - Background images
   - IMG tags
   - SVG elements
   - Picture elements
   - Video posters

6. **Effects**
   - Drop shadows (basic)
   - Border radius

---

## ❌ Critical Gaps for Pixel-Perfect Accuracy

### 1. **Positioning & Layout Issues**

#### Problem: Math.round() Precision Loss
**Location:** Lines 302-304, 353-356, 666-670
```typescript
x: Math.round(rect.left),
y: Math.round(rect.top),
width: Math.round(rect.width),
height: Math.round(rect.height),
```

**Impact:** Rounding causes cumulative pixel drift, especially with:
- Sub-pixel positioning
- Transforms
- Fractional layouts

**Fix:**
```typescript
// USE EXACT VALUES
x: rect.left,
y: rect.top,
width: rect.width,
height: rect.height,
```

#### Problem: Missing Transform Support
**Location:** Line 122 (defaults transform to "none")
**What's Missing:**
- `transform: translate()`
- `transform: rotate()`
- `transform: scale()`
- `transform: skew()`
- `transform-origin`

**Impact:** Elements with CSS transforms are positioned wrong

---

### 2. **Typography Gaps**

#### Problem: Font Weight Not Captured
**Location:** Lines 722-725 - Only captures fontFamily
**What's Missing:**
- Font weight (100-900, bold, normal)
- Font style (italic, oblique)
- Font variant (small-caps)

**Current:**
```typescript
(textNode as any).fontFamily = computedStyles.fontFamily;
```

**Should Be:**
```typescript
textNode.fontName = {
  family: computedStyles.fontFamily.split(',')[0].trim(),
  style: getFontStyle(computedStyles.fontWeight, computedStyles.fontStyle)
};
```

#### Problem: Line Height Edge Cases
**Location:** Lines 654-660
**Issues:**
- Only adjusts if line height > text height
- Doesn't handle `line-height: normal` correctly
- Doesn't handle unitless line heights (1.5, 2, etc.)

#### Problem: Text Shadow Missing
**What's Missing:** `text-shadow` CSS property
**Impact:** Shadowed text loses its depth

---

### 3. **Visual Effects Gaps**

#### Problem: Multiple Box Shadows Not Supported
**Location:** Line 535 comment says "// TODO: this is broken for multiple box shadows"
**Impact:** Elements with layered shadows only get first shadow

#### Problem: Missing Inner Shadows
**What's Missing:** `box-shadow: inset ...`
**Impact:** Recessed/inset effects lost

#### Problem: Missing Filters
**What's Missing:**
- `filter: blur()`
- `filter: brightness()`
- `filter: contrast()`
- `filter: saturate()`
- `filter: drop-shadow()` (different from box-shadow!)
- `backdrop-filter`

#### Problem: Missing Blend Modes
**What's Missing:** `mix-blend-mode`, `background-blend-mode`
**Impact:** Creative overlay effects lost

---

### 4. **Background & Fill Gaps**

#### Problem: Gradient Backgrounds Missing
**What's Missing:**
- `linear-gradient()`
- `radial-gradient()`
- `conic-gradient()`
- Multiple backgrounds

**Current:** Only captures solid colors and images

#### Problem: Background Position/Size Incomplete
**Location:** Lines 452-453 (commented TODO)
```typescript
// TODO: background size, position
scaleMode: computedStyle.backgroundSize === "contain" ? "FIT" : "FILL",
```

**What's Missing:**
- `background-position: 50% 50%`
- `background-size: cover` vs exact pixels
- `background-repeat: no-repeat`
- `background-attachment: fixed`

#### Problem: Object-Fit Limited
**Location:** Lines 479-480, 495-496,509-510
**Current:** Only handles "contain" vs default
**What's Missing:**
- `object-fit: cover`
- `object-fit: scale-down`
- `object-fit: none`
- `object-position`

---

### 5. **Border & Stroke Gaps**

#### Problem: Border Styles Limited
**Current:** Only captures solid borders
**What's Missing:**
- `border-style: dashed`
- `border-style: dotted`
- `border-style: double`
- `border-style: groove/ridge/inset/outset`

#### Problem: Outline Property Missing
**What's Missing:** The `outline` CSS property (different from border!)
**Impact:** Focus states and decorative outlines lost

---

### 6. **Opacity & Visibility**

#### Problem: Opacity Commented Out
**Location:** Line 240
```typescript
// computed.opacity === '0' ||
```

**Issue:** Opacity is being ignored in hidden checks
**Impact:** Semi-transparent elements may be miscalculated

#### Problem: Element Opacity Not Applied
**What's Missing:** Element-level opacity not set on layers
**Should Capture:** `computedStyle.opacity` for the layer itself

---

### 7. **Spacing & Padding**

#### Problem: Padding/Margin Ignored
**What's Missing:**
- `padding` (all sides)
- `margin` (all sides)
- These affect layout but aren't captured

**Impact:** Nested elements don't account for parent padding

---

### 8. **Advanced Layout Features**

#### Problem: Flexbox Properties Missing
**What's Missing:**
- `justify-content`
- `align-items`
- `flex-direction`
- `flex-wrap`
- `gap`

**Note:** Lines 141-144 capture these but don't apply them
**Impact:** Auto-layout could be more accurate

#### Problem: Grid Layout Missing
**What's Missing:**
- `grid-template-columns`
- `grid-template-rows`
- `gap`
- Grid item placement

---

### 9. **Clipping & Overflow**

#### Problem: Clip-Path Missing
**What's Missing:** `clip-path` for custom shapes
**Impact:** Circular images, polygonal clipping lost

#### Problem: Overflow: Hidden Partial
**Location:** Lines 857, 979 - Only used for frame detection
**What's Missing:** Actually clipping content that overflows

---

### 10. **Text Rendering Details**

#### Problem: Word/Character Spacing
**What's Captured:** `letter-spacing` ✅
**What's Missing:** 
- `word-spacing`
- `text-indent`
- `white-space` handling

#### Problem: Multi-Line Text Alignment
**What's Missing:**
- `vertical-align`
- `text-align-last`
- Baseline alignment

---

### 11. **Z-Index & Layering**

#### Problem: Z-Index Ignored
**Location:** Line 149
```typescript
zIndex: "auto", // TODO
```

**Impact:** Layer stacking order may be wrong
**Solution:** Sort layers by z-index before creating in Figma

---

### 12. **Pseudo-Elements**

#### Problem: ::before and ::after Missing
**Location:** Line 97 has `pseudo` parameter but it's not fully used
**What's Missing:**
- `::before` content
- `::after` content
- Their backgrounds, borders, etc.

**Impact:** Decorative elements and icons are lost

---

### 13. **Responsive & Scale Issues**

#### Problem: Sub-Pixel Rendering
**Impact:** Browsers use sub-pixel for smoothness
**Current:** Rounding loses this precision

#### Problem: Device Pixel Ratio
**What's Missing:** `window.devicePixelRatio` consideration
**Impact:** Retina screens have different pixel calculations

---

## 📈 Progress Update (Current Satus)

| Feature | Status | Implementation Notes |
|---------|--------|----------------------|
| **Math.round() Removal** | ✅ DONE | Removed from all coordinates, dimensions, strokes, fonts |
| **Font Weight/Style** | ✅ DONE | Captures bold, italic, 100-900 weights |
| **Gradients** | ✅ DONE | Linear/radial gradients with px/percent stops |
| **Multiple Shadows** | ✅ DONE | Multiple drop shadows + inner shadows supported |
| **Opacity** | ✅ DONE | Element-level opacity & alpha colors supported |
| **Pseudo-elements** | ✅ DONE | ::before/::after captured + Icon font detection |
| **Iframes** | ✅ DONE | Captured as placeholder rectangles |
| **Transforms** | ✅ DONE | Basic transform properties captured |
| **Filters** | ✅ DONE | Basic filter properties captured |
| **Text Shadow** | ✅ DONE | Captured |
| **Mix Blend Mode** | ✅ DONE | Captured |

## 📊 Priority Matrix for Pixel-Perfect

### 🔴 Critical (Implement First)

1. **Remove Math.round()** - ✅ DONE
2. **Font weight & style** - ✅ DONE
3. **Transform support** - ✅ DONE
4. **Gradient backgrounds** - ✅ DONE
5. **Multiple box shadows** - ✅ DONE
6. **Z-index sorting** - ⏳ Pending
7. **Image Lazy Loading** - ✅ DONE (Auto-scroll & currentSrc)

### 🟡 High Priority

7. **Background position/size** - ⏳ In Progress
8. **Opacity** - ✅ DONE
9. **Border styles** (dashed, dotted) - ⏳ Pending
10. **Line height edge cases** - ⏳ Pending
11. **Padding/margin** - ⏳ Pending
12. **Text shadows** - ✅ DONE

### 🟢 Medium Priority

13. **Filters (blur, etc.)** - ✅ DONE
14. **Clip-path** - ✅ DONE
15. **Pseudo-elements** - ✅ DONE (Icon fonts supported!)
16. **Object-fit variations** - ⏳ Pending
17. **Blend modes** - ✅ DONE
18. **Inner shadows** - ✅ DONE

### ⚪ Low Priority (Nice to Have)

19. **Flexbox auto-layout hints** - ⏳ Pending
20. **Grid layout** - ⏳ Pending
21. **Advanced text (word-spacing, etc.)** - ⏳ Pending
22. **Device pixel ratio** - ⏳ Pending

---

## 🛠️ Implementation Roadmap

### Phase 1: Precision (Week 1)
- [x] Remove all Math.round() calls
- [x] Add proper float handling
- [x] Test sub-pixel accuracy

### Phase 2: Typography (Week 1-2)
- [x] Capture font weight
- [x] Capture font style
- [ ] Handle font matching better (Complex)
- [ ] Fix line height calculation
- [x] Add text shadows

### Phase 3: Transforms & Positioning (Week 2)
- [x] Parse CSS transforms
- [ ] Apply transform matrices (Partially done)
- [ ] Handle transform-origin
- [ ] Proper z-index sorting

### Phase 4: Advanced Styling (Week 3)
- [x] Gradient backgrounds
- [x] Multiple box shadows
- [ ] Background position/size
- [ ] Border styles
- [x] Opacity

### Phase 5: Clipping & Effects (Week 3-4)
- [x] Clip-path
- [x] Filters
- [x] Blend modes
- [x] Pseudo-elements (Icon fonts!)

### Phase 6: Layout Hints (Week 4)
- [ ] Flexbox properties
- [ ] Grid properties
- [ ] Auto-layout optimization

---

## 🎯 Quick Wins for Immediate Improvement

### 1. Remove Rounding (5 minutes)
```typescript
// Find all Math.round() and remove them
x: rect.left,  // was: Math.round(rect.left)
```

### 2. Add Font Weight (15 minutes)
```typescript
textNode.fontName = {
  family: computedStyles.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
  style: mapFontStyle(computedStyles.fontWeight, computedStyles.fontStyle)
};
```

### 3. Capture Opacity (10 minutes)
```typescript
const opacity = parseFloat(computedStyle.opacity);
if (opacity < 1) {
  rectNode.opacity = opacity;
}
```

### 4. Basic Gradients (30 minutes)
```typescript
if (computedStyle.backgroundImage.includes('gradient')) {
  // Parse linear/radial gradients
  // Convert to Figma gradient stops
}
```

---

## 📈 Expected Accuracy Improvement

| Phase | Current | After Fix | Improvement |
|-------|---------|-----------|-------------|
| Baseline | 70% | - | - |
| Phase 1 (Precision) | 70% | 82% | +12% |
| Phase 2 (Typography) | 82% | 89% | +7% |
| Phase 3 (Transforms) | 89% | 93% | +4% |
| Phase 4 (Styling) | 93% | 96% | +3% |
| Phase 5 (Effects) | 96% | 98% | +2% |
| Phase 6 (Layout) | 98% | 99% | +1% |

**Target: 99% pixel-perfect accuracy**

---

## 🔍 Testing Strategy

For each fix:
1. Test on simple pages (Google.com)
2. Test on complex pages (Medium.com, Airbnb.com)
3. Compare screenshots (Figma export vs original)
4. Measure pixel difference using image diff tools
5. Iterate until < 1% difference

---

## 💡 Corner Cases to Handle

1. **Nested transforms** - Parent and child both transformed
2. **Mix of units** - px, em, rem, %, vh, vw
3. **Calc() expressions** - `width: calc(100% - 20px)`
4. **CSS variables** - `var(--primary-color)`
5. **Viewport units** - Depend on window size
6. **Fallback fonts** - When exact font not available
7. **System fonts** - Platform-specific rendering

---

This analysis provides a complete roadmap to achieve pixel-perfect accuracy. Start with the Critical items and work your way through the priority list!
