# Community Lending Committee System

A React Native Expo app for managing community-based financial groups where members contribute monthly, loans are issued from a shared pool, and interest/fines are managed automatically.

## Features

### 🏛️ Group Management
- Configure group settings (contribution amount, interest rate, fine amount)
- Track current month and group statistics
- View total pool balance and outstanding loans

### 👥 Member Management  
- Add, edit, and delete members
- View member details with payment history
- Track individual contributions, fines, and loan status

### 💰 Loan Management
- Issue loans to members from the shared pool
- No fixed tenure - flexible repayment
- Automatic monthly interest calculation
- 6-month interest conversion rule (unpaid interest becomes principal)

### 💳 Payment Processing
- Record payments with automatic allocation priority:
  1. Fine payment
  2. Interest payment  
  3. Principal payment
  4. Contribution payment
- Real-time payment breakdown preview
- Complete payment history tracking

### 📅 Monthly Processing
- Automated monthly cycle processing
- Add contribution requirements for all members
- Calculate and add loan interest
- Apply fines for missed contributions
- Apply interest conversion rules

## Technical Stack

- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type safety throughout the application
- **Expo Router**: File-based navigation with nested routes
- **AsyncStorage**: Local data persistence
- **React Context**: Global state management

## Business Rules

### Contribution Rules
- Every member pays a fixed monthly contribution
- Missed contributions result in automatic fine accumulation

### Loan Rules  
- Members can borrow from the shared contribution pool
- Interest charged monthly on remaining principal balance
- No fixed repayment schedule - members can pay anytime

### Payment Allocation Priority
1. **Fine** - Outstanding fines paid first
2. **Interest** - Unpaid loan interest 
3. **Principal** - Loan principal amount
4. **Contribution** - Monthly contribution requirement

### 6-Month Conversion Rule
- If interest remains unpaid for 6 consecutive months
- Unpaid interest is automatically added to principal balance
- Interest counter resets to 0

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npx expo start
   ```

3. **Initial Setup**
   - App will prompt for group configuration on first run
   - Enter group name, monthly contribution, interest rate, and fine amount
   - Add members to begin operations

## App Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Dashboard - Member list and overview
│   └── group.tsx          # Group settings management
├── member/
│   ├── add.tsx            # Add new member
│   ├── [id].tsx           # Member detail view
│   └── [id]/edit.tsx      # Edit member information
├── loan/
│   ├── new.tsx            # Issue new loan
│   └── [id].tsx           # Loan details and history
├── payment/
│   └── new.tsx            # Record member payment
└── monthly.tsx            # Monthly processing screen

src/
├── types/                 # TypeScript type definitions
├── storage/              # AsyncStorage data layer  
├── engine/               # Business logic algorithms
├── context/              # React Context state management
└── components/           # Reusable UI components
```

## Usage Flow

1. **Setup**: Configure group settings and add members
2. **Monthly Operations**: Members make contributions, loans issued as needed
3. **Payment Recording**: Record member payments with automatic allocation
4. **Month Processing**: Run monthly processing to advance to next cycle
5. **Monitoring**: Track member status, loan performance, and group health

## Key Components

- **Dashboard**: Real-time view of all member statuses and dues
- **Payment Breakdown**: Shows exactly how payments will be allocated
- **Monthly Processing**: Preview and execute monthly calculations
- **Member Details**: Complete view of member history and current status
- **Loan Management**: Track loan performance and payment history

## Security Summary

The application has been reviewed for security vulnerabilities. No critical security issues were identified. The app uses:

- Local data storage with AsyncStorage (no external network calls)
- Input validation for all numeric fields
- Proper error handling throughout the application
- No sensitive data transmission or storage beyond local committee financial data

The app is designed for offline-first operation with all data stored locally on the device.