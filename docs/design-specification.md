# Design Specification - PropLedger

## 1. Direction & Rationale
**Style:** Modern Minimalism Premium (FinTech Edition)
**Essence:** A "Digital CFO" for landlords—trustworthy, calm, and meticulously organized. The interface balances high-density financial data with generous whitespace to reduce anxiety around tax compliance.
**Key References:** Linear (for density/spacing balance), Stripe Dashboard (for table clarity), Qonto (for modern banking aesthetic).

## 2. Design Tokens

### 2.1 Colors
**Primary (Trust Purple):**
- **Brand-500 (#6B46C1):** Primary actions, active states. Reliable, professional, deep.
- Brand-50 (#F3EFFF): Backgrounds for active items.
- Brand-100 (#E9D8FD): Subtle highlights.
- Brand-700 (#553C9A): Hover states.
- Brand-900 (#322659): Text headers (rare), deep accents.

**Neutral (Slate - Cool Gray):**
- Neutral-50 (#F8FAFC): App background.
- Neutral-100 (#F1F5F9): Card backgrounds/Surfaces.
- Neutral-200 (#E2E8F0): Borders, dividers.
- Neutral-500 (#64748B): Secondary text, icons.
- Neutral-900 (#0F172A): Primary text (High Contrast).

**Semantic (Spanish Regs):**
- Success (#10B981): "Paid", "Filed".
- Warning (#F59E0B): "Pending", "Due Soon".
- Error (#EF4444): "Late", "Missing Info".
- Info (#3B82F6): Regulatory updates.

**WCAG Compliance:**
- White Text on Brand-500 (#6B46C1): 5.8:1 (Passes AA).
- Neutral-900 on Neutral-50: 15.4:1 (Passes AAA).

### 2.2 Typography
**Family:** Inter (Sans-serif) - chosen for superior legibility of numbers.
**Scale (Mobile First):**
- **Heading 1:** 32px/40px (Desktop), 24px/32px (Mobile). Weight: 700.
- **Heading 2:** 24px/32px (Desktop), 20px/28px (Mobile). Weight: 600.
- **Heading 3:** 18px/28px. Weight: 600.
- **Body:** 16px/24px. Weight: 400.
- **Small/Label:** 14px/20px. Weight: 500 (Medium for readability).
- **Mono:** JetBrains Mono or Roboto Mono (for tabular financial data).

### 2.3 Spacing (4pt Grid)
- **Compact:** 4px, 8px (Internal component spacing).
- **Standard:** 16px, 24px (Between related elements).
- **Relaxed:** 32px, 48px (Card padding, Section gaps).
- **Structural:** 64px, 96px (Page margins).

### 2.4 Shape & Depth
- **Radius:** 12px (Modern standard). Inner elements: 8px.
- **Shadows:**
  - Card: `0 1px 3px rgba(0,0,0,0.1)` (Subtle).
  - Hover: `0 10px 15px -3px rgba(0,0,0,0.1)` (Lift).
  - Modal: `0 20px 25px -5px rgba(0,0,0,0.1)` (Deep).

## 3. Components

### 3.1 Transaction Table (Core)
**Structure:**
- Row height: 64px (Generous touch target).
- Columns: Date | Description (Primary) | Property (Badge) | Amount (Right aligned) | Actions.
**Tokens:**
- Bg: Neutral-100 (White).
- Border: Bottom 1px solid Neutral-200.
- Amount Text: Mono font, Neutral-900.
- Negative Amount: Neutral-900 (standard) or Neutral-700. Avoid Red for normal expenses to reduce stress.
**States:**
- Hover: Neutral-50 bg.
- Selected: Brand-50 bg + Brand-500 left border strip (4px).

### 3.2 Property Card
**Structure:**
- Layout: Thumbnail (Left/Top) + Info Block.
- Badge: "Occupied" (Success-50/700) or "Vacant" (Neutral-200/700).
**Tokens:**
- Padding: 24px.
- Radius: 16px.
- Shadow: Card Shadow.
**Interaction:**
- Whole card clickable. Hover lifts card (-4px Y-axis).

### 3.3 File Upload Zone
**Structure:**
- Dashed border area.
- Icon: Upload Cloud (48px).
- Text: "Drag bank statements (PDF, CSV)".
**Tokens:**
- Bg: Neutral-50.
- Border: 2px dashed Neutral-300.
**States:**
- DragOver: Border Brand-500, Bg Brand-50.

### 3.4 Navigation (Top Bar)
**Structure:**
- Logo (Left).
- Links: Dashboard, Properties, Transactions, Reports.
- Profile (Right).
**Tokens:**
- Height: 64px.
- Bg: White/Blur (Glassmorphism optional).
- Border: Bottom 1px solid Neutral-200.
- Active Link: Text Brand-600 + Bottom Border Brand-500 (2px).

### 3.5 Compliance Widget
**Structure:**
- Box with status icon + Title + "Action required" text.
**Tokens:**
- Gradient Border or Subtle background tint (e.g., Brand-50).
- Icon: Shield check (Success) or Alert (Warning).

### 3.6 Financial Summary Cards
**Structure:**
- Label (Small, Neutral-500) + Value (Huge, Neutral-900, Mono) + Trend (+2.4% success).
**Tokens:**
- Padding: 32px.
- Bg: White.

## 4. Layout & Responsive Patterns

### 4.1 Dashboard Layout
**Desktop (XL > 1280px):**
- Max-width: 1400px, centered.
- Grid: 12 Col.
- Sidebar: None (Horizontal Nav).
- Structure: Header + Main Content (Grid) + Footer.
**Mobile (SM < 640px):**
- Stacked layout.
- Horizontal scroll for Data Tables (or Card view toggle).
- Navigation: Hamburger menu.

### 4.2 Page Patterns (Ref: content-structure-plan.md)
- **Dashboard:** Hero (Welcome) + 4-Col Grid (Metrics) + 8/4 Split (Chart/Activity).
- **Transactions:** Full-width Table container. Filters sticky top.
- **Properties:** Masonry or Grid (3-Col Desktop, 1-Col Mobile).
- **Reports:** Text-heavy container (max-width 800px) for readability + Full-width charts.

### 4.3 Responsive Strategy
- **Tables:** On mobile, hide less critical columns (Category, Date) or switch to "Row Card" view (Description + Amount primary, tap to expand).
- **Touch:** All clickable targets min 44px. 

## 5. Interaction
- **Speed:** 200ms (Hover), 300ms (Modal/Slide).
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Standard).
- **Feedback:** Buttons scale down (0.98) on click. Inputs glow Brand-500 on focus.
- **Motion:**
  - Page Load: Content fades in + subtle slide up (10px).
  - List Items: Staggered entrance (50ms delay).
