export interface Group {
  id: string;
  name: string;
  monthlyContribution: number;
  interestRate: number; // percentage e.g. 3 means 3%
  fineAmount: number;
  currentMonth: number; // month index starting from 1
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
}

export interface Loan {
  id: string;
  memberId: string;
  principalRemaining: number;
  unpaidInterest: number;
  unpaidInterestMonths: number;
  isActive: boolean;
  issuedMonth: number;
}

export interface MonthlyRecord {
  id: string;
  memberId: string;
  month: number;
  contributionDue: number;
  contributionPaid: number;
  fineAdded: number;
  totalFine: number;
  interestAdded: number;
  interestPaid: number;
  principalPaid: number;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  month: number;
  date: string;
  finePaid: number;
  interestPaid: number;
  principalPaid: number;
  contributionPaid: number;
}

export interface MemberSummary {
  member: Member;
  loan: Loan | null;
  currentRecord: MonthlyRecord | null;
  totalContributionDue: number;
  totalContributionPaid: number;
  totalFine: number;
  totalDue: number;
}
