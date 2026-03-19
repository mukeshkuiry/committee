import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Member, Loan, MonthlyRecord, Payment } from '../types';

const KEYS = {
  GROUP: 'group',
  MEMBERS: 'members',
  LOANS: 'loans',
  MONTHLY_RECORDS: 'monthly_records',
  PAYMENTS: 'payments',
};

export const getGroup = async (): Promise<Group | null> => {
  const data = await AsyncStorage.getItem(KEYS.GROUP);
  return data ? JSON.parse(data) : null;
};

export const saveGroup = async (group: Group): Promise<void> => {
  await AsyncStorage.setItem(KEYS.GROUP, JSON.stringify(group));
};

export const getMembers = async (): Promise<Member[]> => {
  const data = await AsyncStorage.getItem(KEYS.MEMBERS);
  return data ? JSON.parse(data) : [];
};

export const saveMembers = async (members: Member[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
};

export const getLoans = async (): Promise<Loan[]> => {
  const data = await AsyncStorage.getItem(KEYS.LOANS);
  return data ? JSON.parse(data) : [];
};

export const saveLoans = async (loans: Loan[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.LOANS, JSON.stringify(loans));
};

export const getMonthlyRecords = async (): Promise<MonthlyRecord[]> => {
  const data = await AsyncStorage.getItem(KEYS.MONTHLY_RECORDS);
  return data ? JSON.parse(data) : [];
};

export const saveMonthlyRecords = async (records: MonthlyRecord[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.MONTHLY_RECORDS, JSON.stringify(records));
};

export const getPayments = async (): Promise<Payment[]> => {
  const data = await AsyncStorage.getItem(KEYS.PAYMENTS);
  return data ? JSON.parse(data) : [];
};

export const savePayments = async (payments: Payment[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
};

export const clearAll = async (): Promise<void> => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};
