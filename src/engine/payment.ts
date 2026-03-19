import { Member, MonthlyRecord, Loan, PaymentBreakdown, Payment } from '../types';
import { storage } from '../storage';

export function calculatePaymentBreakdown(
  amount: number,
  currentRecord: MonthlyRecord,
  loan: Loan | null,
): PaymentBreakdown {
  let remaining = amount;
  let fine_paid = 0;
  let interest_paid = 0;
  let principal_paid = 0;
  let contribution_paid = 0;

  // 1. Pay fine first
  if (remaining > 0 && currentRecord.total_fine > 0) {
    fine_paid = Math.min(remaining, currentRecord.total_fine);
    remaining -= fine_paid;
  }

  // 2. Pay unpaid_interest
  if (remaining > 0 && loan && loan.unpaid_interest > 0) {
    interest_paid = Math.min(remaining, loan.unpaid_interest);
    remaining -= interest_paid;
  }

  // 3. Pay principal
  if (remaining > 0 && loan && loan.principal_remaining > 0) {
    principal_paid = Math.min(remaining, loan.principal_remaining);
    remaining -= principal_paid;
  }

  // 4. Pay contribution
  if (remaining > 0) {
    const contribution_remaining = Math.max(0, currentRecord.contribution_due - currentRecord.contribution_paid);
    contribution_paid = Math.min(remaining, contribution_remaining);
    remaining -= contribution_paid;
  }

  return {
    fine_paid,
    interest_paid,
    principal_paid,
    contribution_paid,
    remaining,
  };
}

export async function applyPayment(
  member: Member,
  amount: number,
  currentRecord: MonthlyRecord,
  loan: Loan | null,
  month: number,
): Promise<Payment> {
  const breakdown = calculatePaymentBreakdown(amount, currentRecord, loan);

  // Update monthly record
  const updatedRecord: MonthlyRecord = {
    ...currentRecord,
    contribution_paid: currentRecord.contribution_paid + breakdown.contribution_paid,
    interest_paid: currentRecord.interest_paid + breakdown.interest_paid,
    principal_paid: currentRecord.principal_paid + breakdown.principal_paid,
    total_fine: Math.max(0, currentRecord.total_fine - breakdown.fine_paid),
  };

  await storage.updateMonthlyRecord(updatedRecord);

  // Update loan if exists
  if (loan && (breakdown.interest_paid > 0 || breakdown.principal_paid > 0)) {
    const updatedLoan: Loan = {
      ...loan,
      unpaid_interest: Math.max(0, loan.unpaid_interest - breakdown.interest_paid),
      principal_remaining: Math.max(0, loan.principal_remaining - breakdown.principal_paid),
      unpaid_interest_months: breakdown.interest_paid > 0 ? 0 : loan.unpaid_interest_months,
      is_active: loan.principal_remaining - breakdown.principal_paid > 0,
    };

    await storage.updateLoan(updatedLoan);
  }

  // Save payment record
  const payment = await storage.savePayment({
    member_id: member.id,
    amount,
    breakdown: {
      fine_paid: breakdown.fine_paid,
      interest_paid: breakdown.interest_paid,
      principal_paid: breakdown.principal_paid,
      contribution_paid: breakdown.contribution_paid,
    },
    date: new Date().toISOString(),
    month,
  });

  return payment;
}