# Committee Lending Management App

A React Native (Expo) app for managing a community lending committee — a shared pool where members contribute monthly, take loans, pay interest, and receive fines for missed payments.

## Features

- **Group Setup** — Configure group name, monthly contribution, interest rate, and fine amount
- **Member Management** — Add and remove members (admin-only, members are offline entities)
- **Dashboard** — At-a-glance view of all members' dues, loan status, and total amounts owed
- **Loan Management** — Issue loans, track principal remaining, unpaid interest, and unpaid months
- **Payment Recording** — Record payments with automatic priority allocation (fine → interest → principal → contribution)
- **Monthly Processing** — Advance the month: add contribution dues, calculate interest, apply the 6-month conversion rule, and add fines

## Business Rules

| Rule | Description |
|------|-------------|
| Interest calculation | Reducing balance: `interest = principal × rate` each month |
| 6-month conversion | If interest unpaid for 6 consecutive months, unpaid interest is added to principal |
| Fine accumulation | Fine added every month a contribution remains unpaid |
| Payment priority | Fine → Interest → Principal → Contribution |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator / Android Emulator, or [Expo Go](https://expo.dev/client) on a physical device

### Install & Run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

## Project Structure

```
src/
  types/index.ts          — TypeScript interfaces (Group, Member, Loan, Payment, etc.)
  storage/index.ts        — AsyncStorage helpers (get/save for each entity)
  utils/finance.ts        — Core financial logic (allocatePayment, processMonth, issueLoan, etc.)
  screens/
    SetupScreen.tsx       — Initial group configuration
    DashboardScreen.tsx   — Main screen: all members with dues summary
    MembersScreen.tsx     — Add/remove members
    MonthlyScreen.tsx     — Monthly lifecycle processor
    LoanScreen.tsx        — Issue loans & view loan details
    PaymentScreen.tsx     — Record payment with breakdown preview
    MemberDetailScreen.tsx — Full member history (records, payments, loan)
```

## Monthly Lifecycle

Each time the admin presses **"Process Month"**, the system:

1. Creates a monthly record for each member (contribution due)
2. Calculates and adds loan interest to each borrower's unpaid interest
3. Applies the 6-month rule: if `unpaidInterestMonths >= 6`, adds unpaid interest to principal
4. Applies a fine to members whose previous month's contribution was not fully paid
5. Advances `currentMonth` by 1

## Data Storage

All data is stored locally using `@react-native-async-storage/async-storage`. No backend or internet connection is required.
