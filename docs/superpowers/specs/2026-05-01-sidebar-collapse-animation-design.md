# Design Spec: Sidebar Collapse Animation Optimization

## 1. Goal Description

Optimize the sidebar collapse buttons in both Left and Right sidebars to use a "Minimal & Breathing" animation style. This ensures visual consistency across the project and enhances the "premium" feel of the interface while adhering to the "Humanistic Minimalism" design philosophy.

## 2. Component Architecture

Extract a reusable `SidebarCollapseButton` component to replace scattered implementations in `LeftSidebar.tsx` and `RightSidebar.tsx`.

### SidebarCollapseButton Props

| Prop          | Type         | Description                            |
| :------------ | :----------- | :------------------------------------- | ---------------------------------------------- |
| `isCollapsed` | `boolean`    | Current collapsed state                |
| `onClick`     | `() => void` | Click handler                          |
| `side`        | `'left'      | 'right'`                               | Which sidebar it belongs to (determines icons) |
| `isMobile`    | `boolean`    | (Optional) Mobile mode for LeftSidebar |
| `label`       | `string`     | ARIA label                             |
| `className`   | `string`     | (Optional) Custom styling              |

## 3. Motion Specs (Scheme A: Sync Scale-Fade)

Using `framer-motion` for all transitions.

### Timing

- **Duration**: `0.15s`
- **Ease**: `[0.4, 0, 0.2, 1]` (cubic-bezier)
- **AnimatePresence Mode**: `wait` (to avoid overlapping icons)

### Keyframes

- **Initial/Enter**: `{ opacity: 0, scale: 0.9 }`
- **Animate**: `{ opacity: 1, scale: 1 }`
- **Exit**: `{ opacity: 0, scale: 0.9 }`

### Interaction States

- **Hover**: `scale(1.02)` (Inherited from global button style)
- **Active (whileTap)**: `scale(0.95)` (Synchronized with global "Active" state in `design.md`)

## 4. Visual Language Consistency

- **Icons**:
  - Left Sidebar: `PanelLeftOpenIcon` (collapsed), `PanelLeftCloseIcon` (expanded)
  - Right Sidebar: `PanelRightOpenIcon` (collapsed), `PanelRightCloseIcon` (expanded)
  - Mobile Left Sidebar: `Cancel01Icon`
- **Colors**: `text-muted-foreground` with `hover:text-foreground` and `hover:bg-secondary`.
- **Borders**: No borders or whisper-weight if needed for contrast.

## 5. Verification Plan

### Manual Testing

- Verify Left Sidebar button on Desktop (collapse/expand).
- Verify Left Sidebar button on Mobile (close).
- Verify Right Sidebar button on Desktop (collapse/expand).
- Ensure animation speed feels consistent with the sidebar sliding duration.
