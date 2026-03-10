# Mobile Optimization Requirements

Mobile adaptation plan for NoteFlow, to be implemented in future versions.

<p align="right">
  <a href="MOBILE_OPTIMIZATION_CN.md">简体中文</a> | <b>English</b>
</p>

---

## Background

NoteFlow currently uses a **four-column layout** (Sidebar + NoteList + Editor + Outline), which is completely unusable on mobile devices. This document outlines the optimization plan for mobile adaptation.

---

## Current Issues

| Issue | Description |
|-------|-------------|
| Too many columns | 4 columns cannot fit on mobile screens |
| Unusable UI | Elements are too small to interact with |
| Poor UX | No mobile-specific interactions |
| Auth pages | Login/Register not optimized for mobile |
| Keyboard handling | Editor viewport not adapted for keyboard |

---

## Proposed Solution: Bottom Navigation + Drawer Panels + FAB

### Overview

```
┌─────────────────────┐
│ 🔍  Note Title   ⋮  │  ← Simplified toolbar (search + title + menu)
├─────────────────────┤
│                     │
│      Editor         │  ← Full-screen editor by default
│      (Main View)    │
│                     │
│            ┌─────┐  │
│            │  +  │  │  ← FAB Floating Button (quick create)
│            └─────┘  │
├─────────────────────┤
│ 📁  📝  ✏️  📋  ⚙️ │  ← Bottom navigation bar (5 items)
│Folder Notes Edit TOC Settings│
└─────────────────────┘

Tap navigation item → Panel slides out from side
Tap FAB → Quick create new note
```

### Advantages

- Follows mobile app conventions (Material Design / iOS HIG)
- Maximizes screen space for editing
- One-handed operation friendly
- Clear navigation structure
- Quick action entry point (FAB)

---

## Detailed Design

### 1. New Components Required

| Component | Description | Priority |
|-----------|-------------|----------|
| `useIsMobile` | Hook to detect mobile viewport | High |
| `useBreakpoint` | Responsive breakpoint detection hook | High |
| `Drawer` | Reusable slide-out panel component | High |
| `MobileNav` | Bottom navigation bar component | High |
| `MobileHeader` | Simplified mobile header | High |
| `FloatingActionButton` | Floating action button | High |
| `FolderDrawer` | Folder drawer panel | High |
| `NoteListDrawer` | Note list drawer panel | High |
| `OutlineDrawer` | Outline drawer panel | Medium |
| `MobileSettingsSheet` | Mobile settings panel | Medium |

### 2. Layout Structure

```
MobileLayout:
├── MobileHeader (simplified)
│   ├── Search button
│   ├── Note title
│   ├── Mode switcher (Edit/Preview/Split)
│   └── More menu (dark mode, sync, settings, logout)
├── Editor (full-screen)
│   └── MarkdownEditor
├── FAB (floating)
│   └── Quick create note button
├── MobileNav (bottom)
│   ├── Folder button
│   ├── Notes button
│   ├── Edit button (home)
│   ├── Outline button
│   └── Settings button
└── Drawers/Sheets (overlay panels)
    ├── FolderDrawer (left)
    ├── NoteListDrawer (left)
    ├── OutlineDrawer (right)
    └── SettingsSheet (bottom sheet)
```

### 3. Bottom Navigation Items

| Icon | Name | Action |
|------|------|--------|
| Folder | Folders | Open folder panel from left |
| FileText | Notes | Open note list panel from left |
| Edit3 | Edit | Close all panels, return to editor (default) |
| List | Outline | Open outline panel from right |
| Settings | Settings | Open settings sheet from bottom |

### 4. Drawer Panel Design

```
Folder Drawer (left slide):
┌──────────────┐
│ 📁 Folders   │
│ ──────────── │
│ • General    │
│ • Work       │
│ • Personal   │
│              │
│ + New Folder │
└──────────────┘

Note List Drawer (left slide):
┌──────────────┐
│ 🔍 Search..  │
│ ──────────── │
│ Current Folder│
│ ──────────── │
│ 📝 Note 1    │
│ 📝 Note 2    │
│ 📝 Note 3    │
│              │
│ + New Note   │
└──────────────┘

Outline Drawer (right slide):
┌──────────────┐
│ 📋 Outline   │
│ ──────────── │
│ ▸ H1 Title   │
│   ▸ H2 Section│
│   ▸ H2 Section│
│ ▸ H1 Title   │
└──────────────┘

Settings Sheet (bottom sheet):
┌──────────────┐
│ ⚙️ Settings  │
│ ──────────── │
│ 🌙 Dark Mode │
│ 🔄 Sync Status│
│ 📧 Account   │
│ 🚪 Logout    │
└──────────────┘
```

### 5. Responsive Breakpoints

| Breakpoint | Width | Layout | Navigation |
|------------|-------|--------|------------|
| Mobile | < 640px | Single column + drawer + FAB | Bottom nav |
| Tablet Portrait | 640px - 768px | Single column + drawer | Bottom nav |
| Tablet Landscape | 768px - 1024px | Two column layout | Side nav |
| Desktop | > 1024px | Current four column layout | Sidebar |

### 6. Floating Action Button (FAB)

```
Position: Bottom right, 16px above bottom nav
Function: Quick create new note
Interaction:
  - Tap: Create new note and enter edit
  - Long press: Show quick menu (new note, new folder)
Animation:
  - Hide when panel is open
  - Auto hide/show on scroll
```

### 7. Mobile Header Design

```
┌─────────────────────────────────────┐
│ 🔍  │    Note Title    │  👁️  │ ⋮  │
│Search│                │ Preview│Menu│
└─────────────────────────────────────┘

Search button: Expand search overlay
Title: Current note title (tappable to edit)
Preview toggle: Edit/Preview/Split mode
More menu: Additional actions
```

### 8. Auth Pages Mobile Adaptation

```
Login/Register Page:
┌─────────────────────┐
│                     │
│      📓 NoteFlow    │
│                     │
│  ┌───────────────┐  │
│  │ 📧 Email      │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ 🔒 Password   │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │    Login      │  │
│  └───────────────┘  │
│                     │
│   No account? Sign up│
│                     │
└─────────────────────┘

Design Points:
- Form elements large enough (touch-friendly)
- Input height 48px+
- Button height 48px+
- Social login buttons prominent
- Forgot password link clear
```

---

## Touch Interaction Design

### 1. Gestures

| Gesture | Action | Context |
|---------|--------|---------|
| Swipe left | Delete note | Note list item |
| Swipe right | Quick menu | Note list item |
| Pull down | Sync/Refresh | Note list |
| Tap backdrop | Close panel | Drawer panel |
| Swipe to close | Close panel | Drawer panel |
| Pinch | Zoom editor | Editor (optional) |

### 2. Touch Targets

| Element | Minimum Size |
|---------|--------------|
| Buttons | 44 × 44 px |
| List items | 48 px height |
| Nav items | 56 px height |
| FAB | 56 × 56 px |

### 3. Touch Feedback

- Ripple effect on tap
- Press state change
- Haptic feedback (optional)

---

## Keyboard Adaptation

### 1. Editor Keyboard

```
When keyboard appears:
1. Viewport height auto-adjusts
2. Toolbar fixed above keyboard (optional)
3. Scroll to current cursor position
4. FAB auto-hides

When keyboard dismisses:
1. Restore full viewport
2. FAB reappears
```

### 2. Keyboard Shortcuts (External Keyboard)

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + N | New note |
| Cmd/Ctrl + S | Save |
| Cmd/Ctrl + F | Search |
| Cmd/Ctrl + B | Bold |
| Cmd/Ctrl + I | Italic |
| Esc | Close panel |

---

## Status Indicators

### 1. Sync Status

```
┌─────────────────┐
│ 🔄 Syncing...   │  ← Top banner
└─────────────────┘

┌─────────────────┐
│ ✅ Synced       │  ← Brief display then disappear
└─────────────────┘

┌─────────────────┐
│ ⚠️ Offline Mode │  ← Persistent display
└─────────────────┘
```

### 2. Offline Mode

- Show offline indicator
- Disable network-dependent features
- Local data works normally
- Auto-sync when reconnected

---

## Implementation Tasks

### Phase 1: Foundation

- [ ] Create `useIsMobile` hook
- [ ] Create `useBreakpoint` hook
- [ ] Create `Drawer` component with animations
- [ ] Create `MobileNav` bottom navigation component
- [ ] Create `FloatingActionButton` component

### Phase 2: Panels

- [ ] Create `MobileHeader` simplified header component
- [ ] Create `FolderDrawer` folder drawer
- [ ] Create `NoteListDrawer` note list drawer
- [ ] Create `OutlineDrawer` outline drawer
- [ ] Create `SettingsSheet` settings panel
- [ ] Implement panel state management (mobileUIStore)

### Phase 3: Layout Integration

- [ ] Create `MobileLayout` mobile layout
- [ ] Update `App.tsx` to support mobile layout switching
- [ ] Update `MainLayout` for responsive behavior
- [ ] Mobile styles for all components
- [ ] Add touch-friendly interactions

### Phase 4: Page Optimization

- [ ] Optimize `LandingPage` auth page for mobile
- [ ] Optimize editor keyboard interaction
- [ ] Add search mobile experience
- [ ] Add gesture operations (swipe to delete, etc.)

### Phase 5: Polish

- [ ] Add smooth animations
- [ ] Performance optimization
- [ ] Multi-device testing
- [ ] Fix mobile-specific bugs
- [ ] PWA support (optional)

---

## Technical Implementation

### 1. State Management

```typescript
// stores/mobileUIStore.ts
interface MobileUIState {
  // Panel state
  activePanel: 'folder' | 'notes' | 'outline' | 'settings' | null;
  isPanelOpen: boolean;

  // Actions
  openPanel: (panel: 'folder' | 'notes' | 'outline' | 'settings') => void;
  closePanel: () => void;
  togglePanel: (panel: 'folder' | 'notes' | 'outline' | 'settings') => void;

  // FAB state
  isFabVisible: boolean;
  setFabVisible: (visible: boolean) => void;

  // Search state
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}
```

### 2. Responsive Hook

```typescript
// hooks/useBreakpoint.ts
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}
```

### 3. Drawer Component

```typescript
// components/common/Drawer.tsx
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  title?: string;
  width?: string;
}
```

### 4. CSS Considerations

```css
/* Safe area adaptation */
.mobile-header {
  padding-top: env(safe-area-inset-top);
}

.mobile-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Drawer styles */
.drawer {
  position: fixed;
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

/* Touch feedback */
.touchable {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.touchable:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

---

## Target Version

- **Planned for**: v0.3.0
- **Priority**: High
- **Dependencies**: None

---

## References

- [Material Design - Navigation Bar](https://m3.material.io/components/navigation-bar)
- [Material Design - Navigation Drawer](https://m3.material.io/components/navigation-drawer)
- [Material Design - Floating Action Button](https://m3.material.io/components/floating-action-button)
- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple HIG - Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)

---

*Created: 2026-02-24*
*Updated: 2026-03-10*
*Status: In Development*
