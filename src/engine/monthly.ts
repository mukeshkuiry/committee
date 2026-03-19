import { Group, Member, Loan, MonthlyRecord } from '../types';
import { storage } from '../storage';

export async function processNextMonth(
  group: Group,
  members: Member[],
  loans: Loan[],
): Promise<void> {
  const newMonth = group.current_month + 1;

  // Update group's current month
  const updatedGroup: Group = {
    ...group,
    current_month: newMonth,
  };
  await storage.saveGroup(updatedGroup);

  // Process each member
  for (const member of members) {
    await processMemberForNewMonth(member, group, newMonth, loans);
  }
}

async function processMemberForNewMonth(
  member: Member,
  group: Group,
  newMonth: number,
  loans: Loan[],
): Promise<void> {
  const memberLoan = loans.find(l => l.member_id === member.id && l.is_active);
  
  // Get previous month's record (if exists)
  const previousRecord = group.current_month > 0 
    ? await storage.getRecordByMemberMonth(member.id, group.current_month)
    : null;

  // Calculate fine from previous month
  let carryOverFine = 0;
  let newFine = 0;
  
  if (previousRecord) {
    carryOverFine = previousRecord.total_fine;
    // Check if contribution was missed in previous month
    if (previousRecord.contribution_paid < previousRecord.contribution_due) {
      newFine = group.fine_amount;
    }
  }

  // Process loan interest if member has active loan
  let updatedLoan = memberLoan;
  if (memberLoan) {
    const monthlyInterest = memberLoan.principal_remaining * (memberLoan.interest_rate / 100);
    const newUnpaidInterest = memberLoan.unpaid_interest + monthlyInterest;
    const newUnpaidMonths = memberLoan.unpaid_interest_months + 1;

    // Apply 6-month rule
    let finalUnpaidInterest = newUnpaidInterest;
    let finalPrincipal = memberLoan.principal_remaining;
    let finalUnpaidMonths = newUnpaidMonths;

    if (newUnpaidMonths >= 6) {
      // Convert unpaid interest to principal
      finalPrincipal = memberLoan.principal_remaining + newUnpaidInterest;
      finalUnpaidInterest = 0;
      finalUnpaidMonths = 0;
    }

    updatedLoan = {
      ...memberLoan,
      unpaid_interest: finalUnpaidInterest,
      unpaid_interest_months: finalUnpaidMonths,
      principal_remaining: finalPrincipal,
    };

    await storage.updateLoan(updatedLoan);
  }

  // Create new monthly record
  const newRecord: Omit<MonthlyRecord, 'id'> = {
    member_id: member.id,
    month: newMonth,
    contribution_due: group.monthly_contribution,
    contribution_paid: 0,
    fine_added: newFine,
    total_fine: carryOverFine + newFine,
    interest_added: memberLoan 
      ? memberLoan.principal_remaining * (memberLoan.interest_rate / 100)
      : 0,
    interest_paid: 0,
    principal_paid: 0,
  };

  await storage.saveMonthlyRecord(newRecord);
}

export async function getMemberSummaries(
  group: Group,
  members: Member[],
  loans: Loan[],
  monthlyRecords: MonthlyRecord[],
): Promise<Array<{
  member: Member;
  currentRecord: MonthlyRecord | null;
  loan: Loan | null;
  totalFine: number;
  totalDue: number;
}>> {
  return members.map(member => {
    const currentRecord = monthlyRecords.find(
      r => r.member_id === member.id && r.month === group.current_month
    ) || null;
    
    const loan = loans.find(l => l.member_id === member.id && l.is_active) || null;
    
    const totalFine = currentRecord ? currentRecord.total_fine : 0;
    
    // Calculate total due: unpaid contribution + fine + unpaid interest
    let totalDue = totalFine;
    if (currentRecord) {
      totalDue += Math.max(0, currentRecord.contribution_due - currentRecord.contribution_paid);
    }
    if (loan) {
      totalDue += loan.unpaid_interest;
    }

    return {
      member,
      currentRecord,
      loan,
      totalFine,
      totalDue,
    };
  });
}