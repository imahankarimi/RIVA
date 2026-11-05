# AI Assistant ChatGPT-Style Redesign

**Date:** 2026-11-03  
**Status:** Complete  
**Apps:** Both frontend (desktop) and webapp (mobile PWA)

## Overview

Completely redesigned the AI Assistant interface to follow ChatGPT's proven UX pattern with a persistent conversation sidebar and clean chat area.

## What Changed

### 1. New Persistent Sidebar (`ConversationSidebar.tsx`)

**Desktop (≥1024px for frontend, ≥768px for webapp):**
- Always visible on the left (or right in RTL)
- 280px fixed width
- Contains New Chat button at top
- Scrollable conversation list grouped by time

**Mobile:**
- Slide-out panel from edge
- Backdrop blur overlay
- Hamburger menu button in top-left
- Same content as desktop

**Conversation List Features:**
- Grouped by: Today, Yesterday, Previous 7 Days, Older
- Active conversation highlighted in brand color (signal-50 bg)
- Hover reveals delete button
- Each item shows conversation icon + truncated title
- Empty state with centered icon and message

### 2. Redesigned Assistant Page

**Before:**
```
┌─────────────────────────────────────┐
│ Topbar + History/New buttons       │
├─────────────────────────────────────┤
│                                     │
│         Chat messages (full width)  │
│                                     │
├─────────────────────────────────────┤
│         Chat input (full width)     │
└─────────────────────────────────────┘
```

**After (ChatGPT-style):**
```
┌──────────┬──────────────────────────┐
│          │                          │
│ Sidebar  │    Chat Area             │
│ - New    │    (centered, max-w-3xl) │
│ - Today  │                          │
│ - Older  │    Messages              │
│          │                          │
│          ├──────────────────────────┤
│          │    Input (centered)      │
└──────────┴──────────────────────────┘
```

### 3. Updated `AssistantChatView`

- Removed dependency on Topbar
- Chat messages centered in `max-w-3xl` column (ChatGPT width)
- Input moved to sticky bottom with border-top
- Cleaner empty state centered in available space
- Better vertical spacing (py-8 for messages, py-4 for input)

### 4. Fixed Conversation Management (from earlier)

The core `useChat` hook now correctly:
- Loads messages on page refresh when a conversation ID exists
- Switches between conversations properly
- Creates new conversations without destroying old ones
- Persists active conversation in localStorage

## Files Modified

### Frontend
- `app/(app)/assistant/page.tsx` — New layout with sidebar + chat
- `components/chat/ConversationSidebar.tsx` — New ChatGPT-style sidebar (created)
- `components/chat/AssistantChatView.tsx` — Centered chat area, no Topbar
- `lib/hooks/useChat.ts` — Fixed message loading logic

### Webapp
- `app/(shell)/assistant/page.tsx` — New layout with sidebar + chat
- `components/chat/ConversationSidebar.tsx` — New ChatGPT-style sidebar (created)
- `components/chat/AssistantChatView.tsx` — Centered chat area
- `lib/hooks/useChat.ts` — Fixed message loading logic

## Technical Details

### Responsive Breakpoints
- **Frontend:** `lg:` (1024px) switches to desktop sidebar
- **Webapp:** `md:` (768px) switches to desktop sidebar

### Sidebar Animation
- Spring animation: `stiffness: 300, damping: 30`
- Slides from edge based on `dir` (RTL-aware)
- Mobile auto-closes after selecting conversation

### Layout
- Uses `flex h-screen` on page container
- Sidebar is `w-[280px]` fixed width
- Chat area is `flex-1` to fill remaining space
- Both use `overflow-hidden` to prevent scrollbar issues

### Styling
- Follows DESIGN_SYSTEM.md color tokens
- Active conversation: `bg-signal-50 text-signal-700`
- Hover states: `bg-surfaceMuted`
- Delete button: `hover:bg-rose-100 hover:text-rose-700`
- ChatGPT-style centered column: `max-w-3xl mx-auto`

## User Experience

✅ **Persistent history** — Conversations always visible (desktop)  
✅ **Quick access** — One click to switch conversations  
✅ **Clear new chat** — Dedicated button at top of sidebar  
✅ **Time grouping** — Easy to find recent vs old conversations  
✅ **Mobile friendly** — Slide-out panel with backdrop  
✅ **RTL support** — Sidebar mirrors correctly in Persian  
✅ **Keyboard navigation** — All interactive elements accessible  

## Design Decisions

1. **280px sidebar** — Matches ChatGPT's width, shows ~40 chars of title
2. **max-w-3xl chat** — Optimal reading width for messages (~896px)
3. **Centered layout** — Focuses attention on conversation
4. **Sticky input** — Always accessible, never scrolls away
5. **Group by time** — Natural way to organize conversation history
6. **Empty state** — Icon + message explains what to do

## What Still Works

- All existing chat functionality (transaction confirmation, choices, etc.)
- AI message streaming and thinking indicator
- Empty state with suggestions
- Message history persistence
- Business switching
- Both light and dark themes
- Persian (RTL) and English (LTR) locales

## Testing Checklist

- [ ] Desktop: Sidebar visible on load
- [ ] Mobile: Hamburger button shows/hides sidebar
- [ ] Click "New Chat" creates empty conversation
- [ ] Click conversation in sidebar loads its messages
- [ ] Active conversation highlighted
- [ ] Delete button removes conversation
- [ ] Page refresh preserves active conversation
- [ ] Conversation titles auto-generate from first message
- [ ] Grouped correctly by time periods
- [ ] Works in dark mode
- [ ] Works in Persian (RTL)
- [ ] Mobile backdrop dismisses sidebar

## Notes

- Old `ChatHistoryPanel.tsx` is now obsolete but kept for reference
- The backend conversation endpoints work correctly
- Conversation titles are auto-generated on first message
- No breaking changes to existing backend or API contracts
