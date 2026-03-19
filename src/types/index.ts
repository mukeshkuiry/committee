export interface Group {
  id: string;
  name: string;
  monthly_contribution: number;
  interest_rate: number;
  fine_amount: number;
  current_month: number;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
}

export interface Loan {
  id: string;
  member_id: string;
  principal_remaining: number;
  unpaid_interest: number;
  unpaid_interest_months: number;
  interest_rate: number;
  created_month: number;
  is_active: boolean;
}

export interface MonthlyRecord {
  id: string;
  member_id: string;
  month: number;
  contribution_due: number;
  contribution_paid: number;
  fine_added: number;
  total_fine: number;
  interest_added: number;
  interest_paid: number;
  principal_paid: number;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  breakdown: {
    fine_paid: number;
    interest_paid: number;
    principal_paid: number;
    contribution_paid: number;
  };
  date: string;
  month: number;
}

export interface PaymentBreakdown {
  fine_paid: number;
  interest_paid: number;
  principal_paid: number;
  contribution_paid: number;
  remaining: number;
}

export interface MemberSummary {
  member: Member;
  currentRecord: MonthlyRecord | null;
  loan: Loan | null;
  totalFine: number;
  totalDue: number;
}