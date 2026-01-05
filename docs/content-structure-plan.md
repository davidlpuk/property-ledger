# Content Structure Plan - PropLedger

## 1. Material Inventory

**Content Files:**
- `docs/research.md`: Spanish regulation context (Veri*Factu, SII, Housing Law, Tax deductions).

**Visual Assets:**
- `imgs/`: Reference style images available.
- Needs: User avatar placeholders, Property thumbnail placeholders.

**Data Requirements:**
- Transaction records (Date, Desc, Amount, Category).
- Property registry (Cadastral value, acquisition cost).
- Tenant details (Contract dates, monthly rent).

## 2. Website Structure

**Type:** MPA (Multi-Page Application)
**Reasoning:** 
- **Functional Depth:** Distinct complex workflows (Transactions vs. Tax Reporting vs. Property Management) require dedicated spaces.
- **Scalability:** Allows adding new modules (e.g., Document storage) without cluttering a single view.
- **Performance:** Loads specific logic only when needed (e.g., Charting libraries only on Reports page).
- **User Mental Model:** Matches the "Office" physical model (File cabinet, Desk, Mailbox).

## 3. Page/Section Breakdown

**Visual Asset Column Rules:**
- **[OK] Content Images**: Property photos, Bank logos, Tenant avatars.
- **[X] Decorative Images**: Abstract backgrounds, gradients, illustrations (handled in Design Spec).

### Page 1: Dashboard (Home) (`/dashboard`)
**Purpose:** High-level overview of portfolio health and immediate actions.

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Hero/Welcome** | Hero Pattern | User Profile | "Hola, María" + Active property count | - |
| **Financial Pulse** | Data Card Grid | Transaction DB | Total Revenue (Current Month), Expenses, Net Income | - |
| **Action Items** | Notification List | Logic | "3 Transactions to categorize", "Upload pending for Property X" | - |
| **Tax Forecast** | Mini-Chart Widget | `docs/research.md` (IVA/IRPF rules) | Estimated tax liability for upcoming quarter | - |

### Page 2: Transactions (`/transactions`)
**Purpose:** The core work surface for categorization and reconciliation.

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Control Bar** | Filter/Search Bar | - | Search, Date Range, Property Filter | - |
| **Transaction List** | Data Table (Complex) | Transaction DB | Date, Desc, Amount (EUR), Category, Status | Bank Logos (if avail) |
| **Upload Area** | File Upload Zone | - | "Drag bank statements here (CSV, PDF)" | - |

### Page 3: Properties (`/properties`)
**Purpose:** Digital twin of the real estate portfolio.

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Portfolio Grid** | Card Grid | Property DB | Property Name, Address, Occupancy Status | `imgs/property_thumb.jpg` |
| **Property Detail** | Detail View | Property DB | Cadastral Ref, Acquisition Date, Cost (for amortization) | - |

### Page 4: Compliance & Taxes (`/taxes`)
**Purpose:** Navigating Spanish bureaucracy (IVA, IRPF, SII).

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Tax Status** | Status Dashboard | `docs/research.md` | Veri*Factu readiness, SII status | - |
| **Deductibles** | Progress/List | `docs/research.md` | Tracked expenses vs. Gross Income limit | - |
| **Reports** | Download List | System | "Modelo 303 Draft", "Annual Profitability Report" | PDF Icons |

### Page 5: Tenants (`/tenants`)
**Purpose:** Relationship and contract management.

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant List** | List/Table | Tenant DB | Name, Property, Rent Status (Paid/Late) | `imgs/user_avatar.jpg` |
| **Contract Info** | Info Card | Contract DB | Start/End Date, Deposit Amount | - |

## 4. Content Analysis

**Information Density:** High
- Financial data tables require precision and scanning.
- Tax regulations require clear textual explanations.

**Content Balance:**
- **Data/Charts:** 40% (Tables, Financial summaries).
- **Text:** 30% (Regulatory explanations, descriptions).
- **Whitespace:** 30% (Critical for reducing cognitive load in finance).
- **Content Type:** Data-driven SaaS.

**Localization:**
- **Language:** English UI (per prompt) but Spanish formats.
- **Number Format:** 1.200,00 € (Comma decimal, Dot thousands).
- **Date Format:** DD/MM/YYYY.
