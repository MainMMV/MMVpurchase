# Codex Gruvbox Theme — Web Design Specification

**Theme ID:** `codex-theme-v1`  
**Theme Name:** Gruvbox Dark  
**Design Style:** Minimal, warm, low-glare, desktop-first settings interface  
**Default Mode:** Dark  
**Default Font:** Google Sans  
**Alternative Font:** Samsung Sans  
**Accent Color:** Gruvbox Teal

---

## 1. Design Principles

- Use a dark, warm-gray interface inspired by Gruvbox.
- Avoid pure black and pure white.
- Use warm cream text on dark surfaces.
- Use teal for interactive elements and selected states.
- Use subtle borders and restrained contrast.
- Keep the layout spacious, organized, and consistent.
- Support desktop, tablet, and mobile layouts.
- Use rounded cards, simple line icons, and compact controls.

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#282828` | Main page background |
| `surface` | `#32302F` | Cards and panels |
| `surface-hover` | `#3C3836` | Hovered items |
| `surface-active` | `#504945` | Selected navigation and controls |
| `accent` | `#458588` | Primary accent and interactive elements |
| `accent-hover` | `#689D9D` | Accent hover state |
| `foreground` | `#EBDBB2` | Primary text |
| `foreground-muted` | `#BDAE93` | Secondary text |
| `foreground-subtle` | `#928374` | Hints and inactive labels |
| `border` | `#45403D` | Card borders and dividers |
| `success` | `#98971A` | Success indicators |
| `warning` | `#D79921` | Warning indicators |
| `error` | `#CC241D` | Error indicators |
| `info` | `#458588` | Information indicators |

### Color Usage Rules

- Primary text uses warm cream rather than white.
- Secondary text uses muted beige.
- Cards use a slightly lighter surface than the page background.
- Borders remain subtle and should not dominate the interface.
- Accent colors indicate interaction, selection, or focus.
- Status colors should be accompanied by text or icons.

## 3. Typography

### Font Options

**Option A — Google Sans (Default)**

Use Google Sans for headings, navigation, buttons, labels, and general interface text.

**Option B — Samsung Sans**

Allow users to switch to Samsung Sans for a Samsung-inspired interface.

**Option C — Arial (Fallback)**

Use Arial or a system sans-serif when the selected font is unavailable.

> Font availability: Google Sans and Samsung Sans may require licensed or otherwise authorized font files. Do not assume they are installed on every device. Load only font files you are permitted to distribute, or use the appropriate system fallback.

### Typography Scale

| Element | Size | Weight |
|---|---:|---:|
| Page title | 24px | 500 |
| Section heading | 16px | 500 |
| Card heading | 15px | 500 |
| Body text | 14px | 400 |
| Navigation item | 14px | 400 |
| Helper text | 12px | 400 |
| Button label | 14px | 500 |
| Small metadata | 11px | 400 |

### Typography Rules

- Use normal sentence case.
- Avoid excessive bold text.
- Use medium weights for headings.
- Keep line heights comfortable and readable.
- Use tabular numerals for prices, balances, and statistics.
- Maintain consistent font sizing across similar components.

## 4. Layout System

### Desktop Layout

- Left sidebar: approximately 338px wide.
- Main content area: flexible width.
- Main content padding: 20px.
- Sidebar padding: 12–16px.
- Standard card radius: 16px.
- Input and button radius: 10–12px.
- Card internal padding: 16px.
- Standard component spacing: 12–16px.

### Responsive Behavior

**Desktop**
- Persistent left navigation.
- Main content displayed beside the sidebar.
- Settings organized into cards and sections.

**Tablet**
- Narrower sidebar or collapsible navigation.
- Main content uses available width.
- Maintain comfortable touch targets.

**Mobile**
- Replace the persistent sidebar with a drawer or compact navigation.
- Stack cards vertically.
- Use full-width inputs where appropriate.
- Keep buttons and controls touch-friendly.

## 5. Component Styling

### Sidebar

- Background: `#282828`
- Right border: `#45403D`
- Inactive labels: `#BDAE93`
- Active item background: `#3C3836`
- Active icon: `#EBDBB2`
- Navigation height: approximately 36px
- Rounded navigation items: 8px

### Cards and Panels

- Background: `#32302F`
- Border: `1px solid #45403D`
- Radius: 16px
- Padding: 16px
- Avoid strong drop shadows.
- Separate related settings with subtle dividers.

### Buttons

**Primary**
- Background: `#458588`
- Text: `#EBDBB2`
- Rounded corners: 10px

**Secondary**
- Background: `#3C3836`
- Text: `#EBDBB2`
- Border: `1px solid #45403D`

**Ghost**
- Transparent background.
- Warm cream text.
- Subtle hover background.

### Inputs

- Background: `#3C3836`
- Text: `#EBDBB2`
- Border: `1px solid #504945`
- Focus border: `#458588`
- Placeholder: `#928374`
- Radius: 10px
- Height: 40px

### Switches and Sliders

- Use the accent color for the enabled state.
- Use muted gray for inactive tracks.
- Clearly distinguish enabled and disabled states.
- Show keyboard focus indicators.

### Dropdowns

- Dark surface background.
- Warm cream text.
- Subtle border.
- Highlight the selected option.
- Support keyboard navigation and focus.

### Icons

- Use simple outline icons.
- Standard icon size: 16–20px.
- Use a consistent icon family throughout the application.
- Avoid unnecessary decorative icons.

## 6. Interaction States

Every interactive component should support:

- Default
- Hover
- Focus
- Active
- Selected
- Disabled
- Loading, when applicable
- Error, when applicable

Use subtle transitions of approximately 120–180ms. Respect the operating system's reduced-motion preference.

## 7. Accessibility

- Keep text readable against dark backgrounds.
- Do not rely on color alone to communicate status.
- Provide visible keyboard focus indicators.
- Support keyboard navigation.
- Associate inputs with labels.
- Include accessible names for icon-only buttons.
- Support zoom and larger text without clipping.
- Check actual contrast ratios before release.

## 8. Theme Configuration

```json
{
  "themeId": "codex-theme-v1",
  "name": "Gruvbox Dark",
  "variant": "dark",
  "colors": {
    "accent": "#458588",
    "background": "#282828",
    "surface": "#32302F",
    "foreground": "#EBDBB2",
    "border": "#45403D"
  },
  "typography": {
    "default": "Google Sans",
    "alternatives": [
      "Samsung Sans",
      "Arial"
    ],
    "uiFontSize": 14,
    "codeFontSize": 12
  },
  "layout": {
    "sidebarWidth": 338,
    "contentPadding": 20,
    "cardRadius": 16
  },
  "accessibility": {
    "reducedMotion": "system",
    "keyboardNavigation": true
  }
}
```

## 9. Typography Selector

Provide a typography setting with these choices:

1. Google Sans — default, rounded modern interface typography.
2. Samsung Sans — alternative Samsung-style typography.
3. Arial — widely available fallback.
4. System Default — use the operating system's preferred sans-serif font.

Changing the selected font should update the entire interface immediately and persist the preference.

## 10. Final Design Goal

Create a consistent Gruvbox-inspired web interface with warm dark surfaces, cream typography, teal accents, restrained borders, rounded panels, responsive navigation, and selectable Google Sans or Samsung Sans typography.

The theme should be reusable across dashboards, settings pages, forms, tables, purchase lists, finance screens, and other web application sections.
