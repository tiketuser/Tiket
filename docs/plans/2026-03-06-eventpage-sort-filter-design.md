# EventPage Ticket Sort Filter — Design

## Overview
Add a price sort control to the EventPage ticket list so users can order tickets cheapest-to-most-expensive or reverse.

## UI
Two pill buttons above the ticket list, RTL-aligned, matching the CategoryFilter style:
  [ מהזול ליקר ↑ ]  [ מהיקר לזול ↓ ]

- Active pill: bg-primary text-white
- Inactive pill: bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary
- Default: cheapest-first (asc) is pre-selected

## Architecture
All changes are confined to TicketListClient.tsx — no server changes needed.

### State
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

### Unified sorted list
Build a single array of items (bundles + solos) with a sortPrice key, sort by it, then render each as BundleCard or SingleCard. The existing bundledGroups / soloTickets memos are kept as-is; sortedItems derives from them.

## File changed
- app/EventPage/[title]/TicketListClient.tsx
