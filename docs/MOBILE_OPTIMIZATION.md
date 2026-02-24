# Mobile Optimization Requirements

Mobile adaptation plan for NoteFlow, to be implemented in future versions.

<p align="right">
  <b>English</b> | <a href="MOBILE_OPTIMIZATION_CN.md">简体中文</a>
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

---

## Proposed Solution: Bottom Navigation + Drawer Panels

### Overview

```
┌─────────────────────┐
│      Header         │  ← Simplified toolbar
├─────────────────────┤
│                     │
│      Editor         │  ← Full-screen editor by default
│      (Main View)    │
│                     │
├─────────────────────┤
│ 📁  📝  ✏️  📋     │  ← Bottom navigation bar
│Folder Notes Edit TOC│
└─────────────────────┘

Tap navigation item → Panel slides out from side
```

### Advantages

- Follows mobile app conventions
- Maximizes screen space for editing
- One-handed operation friendly
- Clear navigation structure

---

## Detailed Design

### 1. New Components Required

| Component | Description | Priority |
|-----------|-------------|----------|
| `useIsMobile` | Hook to detect mobile viewport | High |
| `Drawer` | Reusable slide-out panel component | High |
| `MobileNav` | Bottom navigation bar component | High |
| `MobileHeader` | Simplified mobile header | Medium |

### 2. Layout Structure

```
MobileLayout:
├── MobileHeader (simplified)
│   ├── Note title
│   ├── Mode switcher
│   └── Actions menu
├── Editor (full-screen)
│   └── MarkdownEditor
├── MobileNav (bottom)
│   ├── Folder button
│   ├── Notes button
│   ├── Edit button (home)
│   └── Outline button
└── Drawers (overlay panels)
    ├── FolderDrawer (left)
    ├── NoteListDrawer (left)
    └── OutlineDrawer (right)
```

### 3. Bottom Navigation Items

| Icon | Name | Action |
|------|------|--------|
| Folder | Folders | Open folder panel from left |
| FileText | Notes | Open note list panel from left |
| Edit | Edit | Close all panels, return to editor |
| List | Outline | Open outline panel from right |

### 4. Drawer Panel Design

```
Folder Drawer (left slide):
┌──────────────┐
│ 📁 Folders   │
├──────────────┤
│ • General    │
│ • Work       │
│ • Personal   │
│ + New Folder │
└──────────────┘

Note List Drawer (left slide):
┌──────────────┐
│ 🔍 Search    │
├──────────────┤
│ 📝 Note 1    │
│ 📝 Note 2    │
│ 📝 Note 3    │
│ + New Note   │
└──────────────┘

Outline Drawer (right slide):
┌──────────────┐
│ 📋 Outline   │
├──────────────┤
│ H1 Title     │
│   H2 Section │
│   H2 Section │
│ H1 Title     │
└──────────────┘
```

### 5. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column + drawers |
| Tablet | 768px - 1024px | Two column layout |
| Desktop | > 1024px | Current four column layout |

---

## Alternative Solutions

### Option B: Tab Switching

Tab bar at top to switch between views.

**Pros**: Simple implementation
**Cons**: Cannot see editor and notes simultaneously

### Option C: Gesture Navigation

Swipe left/right to switch panels.

**Pros**: Intuitive, no extra UI
**Cons**: Poor discoverability, complex implementation

---

## Implementation Tasks

### Phase 1: Foundation

- [ ] Create `useIsMobile` hook
- [ ] Create `Drawer` component with animations
- [ ] Create `MobileNav` component
- [ ] Add mobile detection to layout

### Phase 2: Panels

- [ ] Create `FolderDrawer` component
- [ ] Create `NoteListDrawer` component
- [ ] Create `OutlineDrawer` component
- [ ] Implement panel state management

### Phase 3: Integration

- [ ] Update `MainLayout` for responsive behavior
- [ ] Update `App.tsx` for mobile layout
- [ ] Style all components for mobile
- [ ] Add touch-friendly interactions

### Phase 4: Polish

- [ ] Add smooth animations
- [ ] Optimize performance
- [ ] Test on various devices
- [ ] Fix mobile-specific bugs

---

## Technical Considerations

### State Management

```typescript
// Mobile UI state
interface MobileUIState {
  activePanel: 'folder' | 'notes' | 'outline' | null;
  isPanelOpen: boolean;
}

// Actions
openPanel(panel: 'folder' | 'notes' | 'outline'): void
closePanel(): void
togglePanel(panel): void
```

### CSS Considerations

- Use `position: fixed` for drawers
- Add `safe-area-inset-*` for notched devices
- Implement smooth `transform` animations
- Handle keyboard appearance (viewport changes)

### Touch Interactions

- Minimum touch target: 44x44px
- Add touch feedback (ripple effect)
- Support swipe to close panels
- Prevent body scroll when panel is open

---

## Target Version

- **Planned for**: v0.3.0 or v0.4.0
- **Priority**: Medium
- **Dependencies**: None

---

## References

- [Material Design - Bottom Navigation](https://m3.material.io/components/navigation-bar)
- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

---

*Created: 2026-02-24*
*Status: Planned*
