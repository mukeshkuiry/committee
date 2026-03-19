import { Group, Member, Loan, MonthlyRecord, Payment, MemberSummary } from '../types';
import {
  getGroup,
  getMembers,
  getLoans,
  getMonthlyRecords,
  getPayments,
  saveGroup,
  saveLoans,
  saveMonthlyRecords,
  savePayments,
} from '../storage';

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export interface PaymentBreakdown {
  finePaid: number;
  interestPaid: number;
  principalPaid: number;
  contributionPaid: number;
  remaining: number;
}

/**
 * Allocate payment with priority: fine -> interest -> principal -> contribution
 */
export function allocatePayment(
  amount: number,
  totalFine: number,
  unpaidInterest: number,
  principalRemaining: number,
  contributionDue: number,
): PaymentBreakdown {
  let remaining = amount;
  let finePaid = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  let contributionPaid = 0;

  // 1. Pay fine
  const finePayable = Math.min(remaining, totalFine);
  finePaid = finePayable;
  remaining -= finePayable;

  // 2. Pay interest
  const interestPayable = Math.min(remaining, unpaidInterest);
  interestPaid = interestPayable;
  remaining -= interestPayable;

  // 3. Pay principal
  const principalPayable = Math.min(remaining, principalRemaining);
  principalPaid = principalPayable;
  remaining -= principalPayable;

  // 4. Pay contribution
  const contributionPayable = Math.min(remaining, contributionDue);
  contributionPaid = contributionPayable;
  remaining -= contributionPayable;

  return { finePaid, interestPaid, principalPaid, contributionPaid, remaining };
}

/**
 * Process monthly cycle for all members:
 * Creates MonthlyRecord for currentMonth for each member,
 * applies interest and 6-month conversion rule to loans,
 * applies fines for prior unpaid contributions, then advances currentMonth.
 */
export async function processMonth(): Promise<void> {
  const group = await getGroup();
  if (!group) return;

  const members = await getMembers();
  const loans = await getLoans();
  const records = await getMonthlyRecords();
  const currentMonth = group.currentMonth;

  const updatedLoans = [...loans];
  const newRecords: MonthlyRecord[] = [];

  for (const member of members) {
    // Skip if record already exists for this month
    const existingRecord = records.find(
      (r) => r.memberId === member.id && r.month === currentMonth,
    );
    if (existingRecord) {
      continue;
    }

    // Get the most recent previous record for fine carry-over
    const prevRecord = records
      .filter((r) => r.memberId === member.id && r.month < currentMonth)
      .sort((a, b) => b.month - a.month)[0];

    const previousTotalFine = prevRecord ? prevRecord.totalFine : 0;

    // Apply fine if previous month's contribution was not fully paid
    let fineAdded = 0;
    if (currentMonth > 1 && prevRecord) {
      const contributionUnpaid = prevRecord.contributionPaid < prevRecord.contributionDue;
      if (contributionUnpaid) {
        fineAdded = group.fineAmount;
      }
    }

    // Calculate interest for active loan
    const loanIdx = updatedLoans.findIndex(
      (l) => l.memberId === member.id && l.isActive,
    );
    let interestAdded = 0;

    if (loanIdx >= 0) {
      const loan = updatedLoans[loanIdx];
      const interest = (loan.principalRemaining * group.interestRate) / 100;
      interestAdded = interest;
      loan.unpaidInterest += interest;
      loan.unpaidInterestMonths += 1;

      // 6-month conversion: unpaid interest becomes principal
      if (loan.unpaidInterestMonths >= 6) {
        loan.principalRemaining += loan.unpaidInterest;
        loan.unpaidInterest = 0;
        loan.unpaidInterestMonths = 0;
      }

      updatedLoans[loanIdx] = loan;
    }

    const newRecord: MonthlyRecord = {
      id: generateId(),
      memberId: member.id,
      month: currentMonth,
      contributionDue: group.monthlyContribution,
      contributionPaid: 0,
      fineAdded,
      totalFine: previousTotalFine + fineAdded,
      interestAdded,
      interestPaid: 0,
      principalPaid: 0,
    };

    newRecords.push(newRecord);
  }

  // Advance to next month
  group.currentMonth = currentMonth + 1;

  await saveGroup(group);
  await saveLoans(updatedLoans);
  await saveMonthlyRecords([...records, ...newRecords]);
}

/**
 * Get member summary with all dues
 */
export async function getMemberSummary(memberId: string): Promise<MemberSummary | null> {
  const [members, loans, records] = await Promise.all([
    getMembers(),
    getLoans(),
    getMonthlyRecords(),
  ]);

  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const loan = loans.find((l) => l.memberId === memberId && l.isActive) || null;
  const memberRecords = records.filter((r) => r.memberId === memberId);

  const totalContributionDue = memberRecords.reduce(
    (sum, r) => sum + r.contributionDue,
    0,
  );
  const totalContributionPaid = memberRecords.reduce(
    (sum, r) => sum + r.contributionPaid,
    0,
  );

  const latestRecord =
    memberRecords.sort((a, b) => b.month - a.month)[0] || null;
  const totalFine = latestRecord ? latestRecord.totalFine : 0;

  const contributionBalance = totalContributionDue - totalContributionPaid;
  const loanDue = loan ? loan.principalRemaining + loan.unpaidInterest : 0;
  const totalDue = contributionBalance + totalFine + loanDue;

  return {
    member,
    loan,
    currentRecord: latestRecord,
    totalContributionDue,
    totalContributionPaid,
    totalFine,
    totalDue,
  };
}

/**
 * Record a payment and distribute it across fine, interest, principal, contribution
 */
export async function recordPayment(
  memberId: string,
  amount: number,
): Promise<PaymentBreakdown> {
  const group = await getGroup();
  if (!group) throw new Error('No group found');

  const [loans, records, payments] = await Promise.all([
    getLoans(),
    getMonthlyRecords(),
    getPayments(),
  ]);

  const loanIdx = loans.findIndex(
    (l) => l.memberId === memberId && l.isActive,
  );
  const loan = loanIdx >= 0 ? loans[loanIdx] : null;

  const memberRecords = records
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => b.month - a.month);
  const latestRecord = memberRecords[0] || null;

  const totalFine = latestRecord ? latestRecord.totalFine : 0;
  const unpaidInterest = loan ? loan.unpaidInterest : 0;
  const principalRemaining = loan ? loan.principalRemaining : 0;
  const contributionDue = latestRecord
    ? latestRecord.contributionDue - latestRecord.contributionPaid
    : 0;

  const breakdown = allocatePayment(
    amount,
    totalFine,
    unpaidInterest,
    principalRemaining,
    contributionDue,
  );

  // Update loan
  if (loan && loanIdx >= 0) {
    loans[loanIdx].unpaidInterest -= breakdown.interestPaid;
    loans[loanIdx].principalRemaining -= breakdown.principalPaid;
    if (loans[loanIdx].principalRemaining <= 0 && loans[loanIdx].unpaidInterest <= 0) {
      loans[loanIdx].isActive = false;
      loans[loanIdx].principalRemaining = 0;
      loans[loanIdx].unpaidInterest = 0;
    }
    if (breakdown.interestPaid > 0) {
      loans[loanIdx].unpaidInterestMonths = 0;
    }
  }

  // Update latest monthly record
  if (latestRecord) {
    const recIdx = records.findIndex((r) => r.id === latestRecord.id);
    if (recIdx >= 0) {
      records[recIdx].contributionPaid += breakdown.contributionPaid;
      records[recIdx].interestPaid += breakdown.interestPaid;
      records[recIdx].principalPaid += breakdown.principalPaid;
      records[recIdx].totalFine = Math.max(
        0,
        records[recIdx].totalFine - breakdown.finePaid,
      );
    }
  }

  const payment: Payment = {
    id: generateId(),
    memberId,
    amount,
    month: group.currentMonth,
    date: new Date().toISOString(),
    finePaid: breakdown.finePaid,
    interestPaid: breakdown.interestPaid,
    principalPaid: breakdown.principalPaid,
    contributionPaid: breakdown.contributionPaid,
  };

  await Promise.all([
    saveLoans(loans),
    saveMonthlyRecords(records),
    savePayments([...payments, payment]),
  ]);

  return breakdown;
}

/**
 * Issue a loan to a member
 */
export async function issueLoan(memberId: string, amount: number): Promise<void> {
  const [group, loans] = await Promise.all([getGroup(), getLoans()]);
  if (!group) throw new Error('No group found');

  const existingLoan = loans.find((l) => l.memberId === memberId && l.isActive);
  if (existingLoan) {
    throw new Error('Member already has an active loan');
  }

  const newLoan: Loan = {
    id: generateId(),
    memberId,
    principalRemaining: amount,
    unpaidInterest: 0,
    unpaidInterestMonths: 0,
    isActive: true,
    issuedMonth: group.currentMonth,
  };

  await saveLoans([...loans, newLoan]);
}
