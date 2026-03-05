# EventPage Ticket Sort Filter — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two pill buttons (cheapest-first / most-expensive-first) above the ticket list on EventPage that sort all tickets (bundles and solo) by price.

**Architecture:** All logic lives in `TicketListClient.tsx`. A `sortOrder` state drives a `sortedItems` useMemo that unifies bundles and solo tickets into one array sorted by price, replacing the separate `bundledGroups`/`soloTickets` render loops.

**Tech Stack:** React, TypeScript, Tailwind CSS (pill button style matching CategoryFilter)

---

### Task 1: Add sortOrder state and sortedItems memo to TicketListClient

**Files:**
- Modify: `app/EventPage/[title]/TicketListClient.tsx`

**Step 1: Add sortOrder state**

In `TicketListClient`, add after the existing `useState` declarations (around line 83):

```ts
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
```

**Step 2: Add sortedItems memo**

Add after the existing `bundledGroups`/`soloTickets` useMemo (around line 119):

```ts
type SortableItem =
  | { type: 'bundle'; sortPrice: number; data: Ticket[] }
  | { type: 'solo'; sortPrice: number; data: Ticket };

const sortedItems = useMemo((): SortableItem[] => {
  const items: SortableItem[] = [
    ...bundledGroups.map((group) => ({
      type: 'bundle' as const,
      sortPrice: Math.min(...group.map((t) => t.askingPrice)),
      data: group,
    })),
    ...soloTickets.map((ticket) => ({
      type: 'solo' as const,
      sortPrice: ticket.askingPrice,
      data: ticket,
    })),
  ];
  return items.sort((a, b) =>
    sortOrder === 'asc' ? a.sortPrice - b.sortPrice : b.sortPrice - a.sortPrice,
  );
}, [bundledGroups, soloTickets, sortOrder]);
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`
Expected: no type errors in TicketListClient.tsx

**Step 4: Commit**

```bash
git add app/EventPage/[title]/TicketListClient.tsx
git commit -m "feat: add sortedItems memo to TicketListClient"
```

---

### Task 2: Replace separate render loops with unified sortedItems render

**Files:**
- Modify: `app/EventPage/[title]/TicketListClient.tsx`

**Step 1: Replace the two render blocks**

Find the JSX section that renders `{bundledGroups.map(...)}` followed by `{soloTickets.map(...)}` (lines ~183–255) and replace both with a single loop:

```tsx
{sortedItems.map((item) => {
  if (item.type === 'bundle') {
    const group = item.data;
    if (group.length === 1) {
      const ticket = group[0];
      return (
        <div key={ticket.id} className="w-full sm:flex sm:items-center sm:justify-center">
          <SingleCard
            title={event.artist}
            imageSrc={event.imageUrl || "/images/Artist/default.png"}
            date={ticket.date}
            location={ticket.venue}
            seatLocation={ticketSeatLocation(ticket)}
            price={ticket.askingPrice}
            soldOut={false}
            ticketsLeft={soloTickets.length + 1}
            timeLeft=""
            buttonAction="קנה"
            ticketId={ticket.id}
            sellerId={ticket.sellerId}
            isSelectable={true}
            isSelected={selectedIds.has(ticket.id)}
            onToggleSelect={() => toggleSelect(ticket.id)}
            onInstantBuy={() => openInstantBuy(ticket)}
          />
        </div>
      );
    }
    return (
      <div key={group[0].bundleId} className="w-full sm:flex sm:items-center sm:justify-center">
        <BundleCard
          tickets={group.map(ticketToBundleTicket)}
          eventTitle={event.artist}
          canSplit={group[0].canSplit}
          onBuyAll={openBundleBuy}
          onBuySelected={openBundleBuy}
        />
      </div>
    );
  }
  // solo
  const ticket = item.data;
  return (
    <div key={ticket.id} className="w-full sm:flex sm:items-center sm:justify-center">
      <SingleCard
        title={event.artist}
        imageSrc={event.imageUrl || "/images/Artist/default.png"}
        date={ticket.date}
        location={ticket.venue}
        seatLocation={ticketSeatLocation(ticket)}
        price={ticket.askingPrice}
        soldOut={false}
        ticketsLeft={soloTickets.length}
        timeLeft=""
        buttonAction="קנה"
        ticketId={ticket.id}
        sellerId={ticket.sellerId}
        isSelectable={true}
        isSelected={selectedIds.has(ticket.id)}
        onToggleSelect={() => toggleSelect(ticket.id)}
        onInstantBuy={() => openInstantBuy(ticket)}
      />
    </div>
  );
})}
```

**Step 2: Build check**

Run: `npm run build 2>&1 | head -30`
Expected: clean

**Step 3: Commit**

```bash
git add app/EventPage/[title]/TicketListClient.tsx
git commit -m "feat: render tickets from unified sortedItems array"
```

---

### Task 3: Add sort pill buttons UI above the ticket list

**Files:**
- Modify: `app/EventPage/[title]/TicketListClient.tsx`

**Step 1: Add sort bar JSX**

Insert this block as the first child inside the outer `<div dir="rtl" className="flex flex-col ...">`, before the `{sortedItems.map(...)}`:

```tsx
{/* Sort bar */}
<div className="flex gap-2 justify-start w-full">
  {(['asc', 'desc'] as const).map((order) => (
    <button
      key={order}
      onClick={() => setSortOrder(order)}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${
        sortOrder === order
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
      }`}
    >
      {order === 'asc' ? 'מהזול ליקר ↑' : 'מהיקר לזול ↓'}
    </button>
  ))}
</div>
```

**Step 2: Build check**

Run: `npm run build 2>&1 | head -30`
Expected: clean

**Step 3: Verify visually**

Run `npm run dev`, open an EventPage, confirm:
- Two pills appear above tickets
- "מהזול ליקר ↑" is active (primary color) by default
- Clicking "מהיקר לזול ↓" re-orders tickets descending and activates that pill
- Multi-buy bar still works correctly

**Step 4: Commit**

```bash
git add app/EventPage/[title]/TicketListClient.tsx
git commit -m "feat: add price sort pill buttons to EventPage ticket list"
```
