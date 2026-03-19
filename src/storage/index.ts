import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Member, Loan, MonthlyRecord, Payment } from '../types';

const KEYS = {
  GROUP: 'group',
  MEMBERS: 'members',
  LOANS: 'loans',
  MONTHLY_RECORDS: 'monthly_records',
  PAYMENTS: 'payments',
};

// Helper functions
const getStoredArray = async <T>(key: string): Promise<T[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return [];
  }
};

const storeArray = async <T>(key: string, data: T[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
  }
};

const generateId = (): string => {
  return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11);
};

export const storage = {
  // Group
  async getGroup(): Promise<Group | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.GROUP);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting group:', error);
      return null;
    }
  },

  async saveGroup(group: Group): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.GROUP, JSON.stringify(group));
    } catch (error) {
      console.error('Error saving group:', error);
    }
  },

  // Members
  async getMembers(): Promise<Member[]> {
    return getStoredArray<Member>(KEYS.MEMBERS);
  },

  async saveMember(member: Omit<Member, 'id'>): Promise<Member> {
    const newMember: Member = { ...member, id: generateId() };
    const members = await this.getMembers();
    members.push(newMember);
    await storeArray(KEYS.MEMBERS, members);
    return newMember;
  },

  async updateMember(updatedMember: Member): Promise<void> {
    const members = await this.getMembers();
    const index = members.findIndex(m => m.id === updatedMember.id);
    if (index !== -1) {
      members[index] = updatedMember;
      await storeArray(KEYS.MEMBERS, members);
    }
  },

  async deleteMember(id: string): Promise<void> {
    const members = await this.getMembers();
    const filtered = members.filter(m => m.id !== id);
    await storeArray(KEYS.MEMBERS, filtered);
  },

  // Loans
  async getLoans(): Promise<Loan[]> {
    return getStoredArray<Loan>(KEYS.LOANS);
  },

  async getLoanByMember(memberId: string): Promise<Loan | null> {
    const loans = await this.getLoans();
    return loans.find(l => l.member_id === memberId && l.is_active) || null;
  },

  async saveLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const newLoan: Loan = { ...loan, id: generateId() };
    const loans = await this.getLoans();
    loans.push(newLoan);
    await storeArray(KEYS.LOANS, loans);
    return newLoan;
  },

  async updateLoan(updatedLoan: Loan): Promise<void> {
    const loans = await this.getLoans();
    const index = loans.findIndex(l => l.id === updatedLoan.id);
    if (index !== -1) {
      loans[index] = updatedLoan;
      await storeArray(KEYS.LOANS, loans);
    }
  },

  // Monthly Records
  async getMonthlyRecords(): Promise<MonthlyRecord[]> {
    return getStoredArray<MonthlyRecord>(KEYS.MONTHLY_RECORDS);
  },

  async getRecordByMemberMonth(memberId: string, month: number): Promise<MonthlyRecord | null> {
    const records = await this.getMonthlyRecords();
    return records.find(r => r.member_id === memberId && r.month === month) || null;
  },

  async saveMonthlyRecord(record: Omit<MonthlyRecord, 'id'>): Promise<MonthlyRecord> {
    const newRecord: MonthlyRecord = { ...record, id: generateId() };
    const records = await this.getMonthlyRecords();
    records.push(newRecord);
    await storeArray(KEYS.MONTHLY_RECORDS, records);
    return newRecord;
  },

  async updateMonthlyRecord(updatedRecord: MonthlyRecord): Promise<void> {
    const records = await this.getMonthlyRecords();
    const index = records.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = updatedRecord;
      await storeArray(KEYS.MONTHLY_RECORDS, records);
    }
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return getStoredArray<Payment>(KEYS.PAYMENTS);
  },

  async savePayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const newPayment: Payment = { ...payment, id: generateId() };
    const payments = await this.getPayments();
    payments.push(newPayment);
    await storeArray(KEYS.PAYMENTS, payments);
    return newPayment;
  },

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },
};