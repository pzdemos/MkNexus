# Flux Design System
## Server Management Interface — Style Guide

---

## 1. Design Philosophy

**Core Principle**: A server management tool should feel like an extension of the terminal itself — precise, fast, and unapologetically technical. Every pixel serves productivity.

**Design Direction**:
- **Dark-first**: The interface lives in darkness because servers run 24/7 and admins work at all hours
- **Information density**: High data-per-screen ratio without visual clutter
- **Terminal DNA**: Terminal-green accents, monospace fonts for data, grid-based layouts
- **Zero decoration**: No gradients, no shadows, no rounded corners beyond 4px functional radius

**Referenced Style Anchors**:
- **Stripe Developer Dashboard** — dark technical interface, card-based information architecture
- **Linear.app** — precise dark UI, restrained color usage, modern sans-serif typography
- **Swiss International Style** — strict grid alignment, strong typographic hierarchy

---

## 2. Color System

### 2.1 Dark Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | `#09090B` | Page background, terminal viewport |
| **Surface** | `#18181B` | Cards, sidebar, panels, modals |
| **Surface Elevated** | `#27272A` | Hover states, active items, input backgrounds |
| **Border** | `#3F3F46` | Dividers, card borders, table borders |
| **Text Primary** | `#FAFAFA` | Headlines, primary content |
| **Text Secondary** | `#A1A1AA` | Labels, descriptions, secondary info |
| **Text Tertiary** | `#71717A` | Placeholders, disabled states, timestamps |
| **Primary** | `#0D9373` | Emerald — actions, active states, success indicators, links |
| **Accent** | `#22D3EE` | Cyan — data highlights, secondary emphasis, terminal cursor |
| **Warning** | `#F59E0B` | Amber — caution states, pending operations |
| **Danger** | `#EF4444` | Red — errors, destructive actions, deletion |
| **Info** | `#3B82F6` | Blue — informational badges, neutral emphasis |

### 2.2 Semantic Color Usage

```
✅ Success  → Primary (#0D9373) — file saved, connected, running
⚠️ Warning  → Amber (#F59E0B) — certificate expiring, reconnecting
❌ Error    → Red (#EF4444) — connection failed, save error
ℹ️  Info     → Blue (#3B82F6) — neutral status, tips
🔷 Accent   → Cyan (#22D3EE) — data numbers, highlights
```

### 2.3 Terminal Color Palette

The terminal uses a custom 16-color palette optimized for dark backgrounds:

```
Black:       #18181B    Bright Black:   #27272A
Red:         #EF4444    Bright Red:     #F87171
Green:       #10B981    Bright Green:   #34D399
Yellow:      #F59E0B    Bright Yellow:  #FBBF24
Blue:        #3B82F6    Bright Blue:    #60A5FA
Magenta:     #A855F7    Bright Magenta: #C084FC
Cyan:        #06B6D4    Bright Cyan:    #22D3EE
White:       #E4E4E7    Bright White:   #FAFAFA

Cursor:      #0D9373    Selection BG:   #0D937340
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Fallback |
|------|------|----------|
| **UI / Body** | Inter | system-ui, -apple-system, sans-serif |
| **Monospace** | JetBrains Mono | Menlo, Monaco, "Courier New", monospace |

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 36px | 700 | 1.2 | Page titles (Terminal, Files) |
| H1 | 24px | 600 | 1.3 | Section headers, module names |
| H2 | 18px | 600 | 1.4 | Card titles, panel headers |
| Body | 14px | 400 | 1.6 | General text, descriptions |
| Body Small | 13px | 400 | 1.5 | File names, menu items |
| Caption | 12px | 400 | 1.4 | Metadata, permissions, timestamps |
| Mono | 14px | 400 | 1.6 | Code, terminal, config files |
| Mono Small | 12px | 400 | 1.5 | Logs, status text |

### 3.3 Typography Rules

- **Headlines**: Use Inter SemiBold (600), color Text Primary
- **Data values**: Use JetBrains Mono for all technical data (file sizes, PIDs, permissions, versions)
- **Uppercase tracking**: Navigation labels, badges, section headers use `uppercase` with `letter-spacing: 0.05em`
- **Truncation**: Single-line truncation with ellipsis for paths and file names; never wrap file paths

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```
xs:   4px
sm:   8px
md:   12px
base: 16px
lg:   24px
xl:   32px
2xl:  48px
```

### 4.2 Layout Patterns

**App Shell**:
```
┌──────────────────────────────────────┐
│  Sidebar │ Header                    │
│  (224px) ├───────────────────────────┤
│          │                           │
│          │  Main Content Area        │
│          │                           │
│          │                           │
└──────────────────────────────────────┘
```

**File Manager — Split View** (Desktop):
```
┌────────────────────┬─────────────────┐
│  File List         │  File Editor    │
│  (50%)             │  (50%)          │
│                    │                 │
│  [icon] name       │  [toolbar]      │
│  [icon] name       │                 │
│  [icon] name       │  [textarea]     │
│                    │                 │
└────────────────────┴─────────────────┘
```

### 4.3 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Sidebar hidden (overlay), bottom action bar, single column, full-screen modals |
| Tablet | 768–1024px | Collapsible sidebar, touch-optimized targets |
| Desktop | > 1024px | Fixed sidebar, split-pane file editor, full keyboard shortcuts |

---

## 5. Components

### 5.1 Sidebar Navigation

```
Background:     Surface (#18181B)
Border:         1px solid Border (#3F3F46) right
Width:          224px (desktop)
Item height:    40px
Icon size:      20px

Active State:
  Background:   Primary at 10% opacity (#0D93731A)
  Text:         Primary (#0D9373)
  Border:       1px solid Primary at 20% opacity

Hover State:
  Background:   Surface Elevated at 50% (#27272A80)
  Text:         Text Primary

Inactive State:
  Text:         Text Secondary
```

### 5.2 File List Row

```
Height:         48px
Padding:        0 16px
Border bottom:  1px solid Border at 50% (#3F3F4680)
Icon size:      20px

Folder icon:    Amber (#F59E0B)
File icon:      Text Secondary (#A1A1AA)

Selected State:
  Background:   Primary at 10%
  Left border:  2px solid Primary

Hover State:
  Background:   Surface Elevated at 40%

Interaction:
  Click:        Toggle selection
  Double-click: Open folder or file
```

### 5.3 Terminal Panel

```
Background:     Background (#09090B)
Padding:        4px
Font:           JetBrains Mono, 14px

Tab bar height: 36px
Tab padding:    8px 12px
Active tab:     Surface (#18181B) background, Text Primary
Inactive tab:   transparent, Text Secondary

Status dot:
  CONNECTED:    Primary (#0D9373)
  CONNECTING:   Warning (#F59E0B)
  DISCONNECTED: Text Tertiary (#71717A)
  RECONNECTING: Accent (#22D3EE)
  ERROR:        Danger (#EF4444)

Mobile shortcut bar:
  Height:       40px
  Button:       36px × 32px, Surface Elevated background, Mono font
```

### 5.4 File Editor Panel

```
Background:     Background (#09090B)
Toolbar height: 44px
Toolbar BG:     Surface (#18181B)

Dirty indicator:  Amber dot + "已修改" text
Save button:      Primary background, white text
Close button:     Icon only, hover Surface Elevated

Textarea:
  Font:         JetBrains Mono, 14px, line-height 1.6
  Text color:   Text Secondary
  Background:   Background
  Padding:      16px
  No border, no resize handle

Read-only files:
  Background:   Background
  Pre-formatted text, no edit cursor
```

### 5.5 Status Cards (Nginx, SSL)

```
Background:     Surface (#18181B)
Border:         1px solid Border (#3F3F46)
Border radius:  8px
Padding:        16px

Icon container:
  Size:         40px × 40px
  Background:   Status color at 10%
  Icon color:   Status color
  Border radius: 8px

Label:          Caption size, Text Secondary
Value:          H2 size, Status color, font-weight 600
```

### 5.6 Notifications (Toast)

```
Position:       Bottom-right, 16px from edges
Max width:      448px
Border radius:  8px
Padding:        12px 16px
Border:         1px solid status color at 20%
Background:     Surface with 80% opacity + backdrop blur

Animation:      Slide in from bottom-right, 200ms ease-out
Auto-dismiss:   3000ms (success), 5000ms (error)

Success:  Border/Icon Primary (#0D9373)
Error:    Border/Icon Danger (#EF4444)
Warning:  Border/Icon Warning (#F59E0B)
Info:     Border/Icon Info (#3B82F6)
```

### 5.7 Mobile Bottom Action Bar

```
Height:         56px
Background:     Surface (#18181B)
Border top:     1px solid Border
Position:       Fixed bottom

Button layout:
  Distribution: Space-around
  Icon size:    20px
  Label:        Caption, 10px
  Tap target:   Minimum 44px × 44px

Active state:   Text Primary
Inactive state: Text Secondary
```

---

## 6. Iconography

**Icon Library**: Lucide React (`lucide-react`)

**Usage Rules**:
- **20px** for navigation items
- **16px** for inline actions (toolbar buttons)
- **14px** for status indicators and inline metadata
- **Color**: Inherit from parent text color unless indicating status

**Module Icons**:
| Module | Icon | Color |
|--------|------|-------|
| Files | `FolderOpen` | Text Secondary |
| Terminal | `Terminal` | Text Secondary |
| Nginx | `Server` | Text Secondary |
| SSL | `Lock` | Text Secondary |
| Database | `Database` | Text Secondary |
| Skill | `Wand2` | Text Secondary |

---

## 7. Motion & Animation

### 7.1 Principles

- **Fast**: 150–200ms for micro-interactions
- **Subtle**: No bouncy or playful animations; keep it professional
- **Functional**: Animations communicate state change, never decorative

### 7.2 Defined Motions

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Sidebar toggle | 300ms | ease-in-out |
| Selection highlight | 100ms | ease |
| Toast enter | 200ms | ease-out |
| Toast exit | 150ms | ease-in |
| Tab switch | 0ms (instant) | — |
| Button hover | 100ms | ease |
| Modal overlay | 150ms | ease-out |

### 7.3 No-Animation Zones

- Terminal content rendering (xterm.js handles its own rendering)
- File list scrolling (native browser scroll)
- Text selection

---

## 8. Interaction Patterns

### 8.1 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Focus search bar |
| `Ctrl + S` | Save file (in editor) |
| `Enter` | Navigate into selected folder |
| `Backspace` | Go up one directory |
| `Delete` | Delete selected file(s) |

### 8.2 Touch Targets (Mobile)

| Element | Minimum Size |
|---------|-------------|
| Action bar buttons | 48px × 48px |
| File list rows | 56px height |
| Form inputs | 44px height |
| Sidebar nav items | 44px height |

### 8.3 Gestures (Mobile)

| Gesture | Action |
|---------|--------|
| Pull down | Refresh file list |
| Long press | Multi-select file |
| Swipe left | Reveal file actions (edit, delete) |

---

## 9. File Editor Specifications

### 9.1 Supported File Types

**Editable** (60+ extensions): `txt`, `md`, `json`, `js`, `jsx`, `ts`, `tsx`, `html`, `css`, `scss`, `less`, `yaml`, `yml`, `xml`, `sh`, `bash`, `zsh`, `py`, `rb`, `go`, `rs`, `c`, `cpp`, `h`, `hpp`, `java`, `php`, `lua`, `sql`, `conf`, `config`, `ini`, `env`, `dockerfile`, `gitignore`, `log`, `vue`, `svelte`, `astro`

**Preview only** (images): `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `ico`

### 9.2 Editor States

```
┌─────────────────────────────┐
│ [icon] filename.md   ●已修改  │  ← Toolbar
│                      [Save] [X]│
├─────────────────────────────┤
│                             │
│  # Markdown content         │  ← Editable area
│  with syntax highlighting   │
│                             │
│                             │
└─────────────────────────────┘

Dirty indicator:    Amber dot (●) + "已修改" text
Save button state:  Active when dirty, disabled when clean
Keyboard shortcut:  Ctrl+S triggers save
```

### 9.3 API Error Handling

When the backend API is unavailable:
1. Show detailed error message in notification toast
2. Load demo content appropriate to file type
3. Allow editing of demo content (save will show "saved" toast)
4. Console logs full error for debugging

---

## 10. Z-Index Hierarchy

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0–10 | File list, content areas |
| Sticky | 20 | Header, toolbar |
| Overlays | 30 | Sidebar overlay (mobile) |
| Dropdowns | 40 | New file menu, context menus |
| Modals | 50 | Full-screen mobile editor |
| Notifications | 100 | Toast messages |

---

## 11. File Tree (Project Structure)

```
src/
├── api/
│   └── client.ts           — HTTP client, all API endpoints
├── stores/
│   ├── auth.ts             — Authentication state (Zustand)
│   ├── terminal.ts         — Terminal tabs & settings (Zustand)
│   └── app.ts              — App-level state (device, theme, notifications)
├── hooks/
│   ├── useDeviceType.ts    — Responsive breakpoint detection
│   ├── useWebSocket.ts     — WebSocket with auto-reconnect
│   └── useFileManager.ts   — File list management
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     — Module navigation (desktop/mobile)
│   │   ├── Header.tsx      — Top bar with search & actions
│   │   └── MainLayout.tsx  — App shell wrapper
│   ├── file-manager/
│   │   └── FileEditor.tsx  — Text editor panel
│   └── shared/
│       └── NotificationContainer.tsx — Toast message container
├── pages/
│   ├── Login.tsx           — Authentication screen
│   ├── Files.tsx           — File manager (split view)
│   ├── Terminal.tsx        — Multi-tab terminal (xterm.js)
│   ├── Nginx.tsx           — Nginx status, config, logs
│   ├── SSL.tsx             — Certificate management
│   ├── Database.tsx        — KV database CRUD
│   └── Skill.tsx           — Markdown document management
├── types/
│   └── index.ts            — All TypeScript interfaces
├── App.tsx                 — Router + auth guard
├── main.tsx                — Entry point
└── index.css               — Tailwind imports + custom scrollbar
```

---

*Document version: 2.0*
*Last updated: 2026-05-17*
