import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Group, Member, Loan, MonthlyRecord, Payment, MemberSummary } from '../types';
import { storage } from '../storage';
import { processNextMonth, getMemberSummaries } from '../engine/monthly';
import { applyPayment } from '../engine/payment';

interface AppState {
  group: Group | null;
  members: Member[];
  loans: Loan[];
  monthlyRecords: MonthlyRecord[];
  payments: Payment[];
  memberSummaries: MemberSummary[];
  isLoading: boolean;
  isInitialized: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_DATA'; payload: Omit<AppState, 'isLoading' | 'isInitialized'> }
  | { type: 'SET_GROUP'; payload: Group }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'ADD_LOAN'; payload: Loan }
  | { type: 'UPDATE_LOAN'; payload: Loan }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'ADD_MONTHLY_RECORD'; payload: MonthlyRecord }
  | { type: 'UPDATE_MONTHLY_RECORD'; payload: MonthlyRecord }
  | { type: 'UPDATE_SUMMARIES'; payload: MemberSummary[] };

const initialState: AppState = {
  group: null,
  members: [],
  loans: [],
  monthlyRecords: [],
  payments: [],
  memberSummaries: [],
  isLoading: true,
  isInitialized: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_GROUP':
      return { ...state, group: action.payload };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(m => m.id === action.payload.id ? action.payload : m),
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter(m => m.id !== action.payload),
      };
    case 'ADD_LOAN':
      return { ...state, loans: [...state.loans, action.payload] };
    case 'UPDATE_LOAN':
      return {
        ...state,
        loans: state.loans.map(l => l.id === action.payload.id ? action.payload : l),
      };
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    case 'ADD_MONTHLY_RECORD':
      return { ...state, monthlyRecords: [...state.monthlyRecords, action.payload] };
    case 'UPDATE_MONTHLY_RECORD':
      return {
        ...state,
        monthlyRecords: state.monthlyRecords.map(r => r.id === action.payload.id ? action.payload : r),
      };
    case 'UPDATE_SUMMARIES':
      return { ...state, memberSummaries: action.payload };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  loadAllData: () => Promise<void>;
  setupGroup: (groupData: Omit<Group, 'id' | 'current_month'>) => Promise<void>;
  addMember: (memberData: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  issueLoan: (loanData: Omit<Loan, 'id' | 'is_active'>) => Promise<Loan>;
  recordPayment: (memberId: string, amount: number) => Promise<Payment>;
  processNextMonthAction: () => Promise<void>;
  refreshSummaries: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadAllData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [group, members, loans, monthlyRecords, payments] = await Promise.all([
        storage.getGroup(),
        storage.getMembers(),
        storage.getLoans(),
        storage.getMonthlyRecords(),
        storage.getPayments(),
      ]);

      const memberSummaries = group 
        ? await getMemberSummaries(group, members, loans, monthlyRecords)
        : [];

      dispatch({
        type: 'SET_DATA',
        payload: {
          group,
          members,
          loans,
          monthlyRecords,
          payments,
          memberSummaries,
        },
      });

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setupGroup = async (groupData: Omit<Group, 'id' | 'current_month'>) => {
    const existingGroup = state.group;
    const group: Group = {
      ...groupData,
      id: existingGroup ? existingGroup.id : Date.now().toString(),
      current_month: existingGroup ? existingGroup.current_month : 1,
    };

    await storage.saveGroup(group);
    dispatch({ type: 'SET_GROUP', payload: group });
  };

  const addMember = async (memberData: Omit<Member, 'id'>) => {
    const member = await storage.saveMember(memberData);
    dispatch({ type: 'ADD_MEMBER', payload: member });
    
    // Create initial monthly record for current month if group exists
    if (state.group) {
      const existingRecord = await storage.getRecordByMemberMonth(member.id, state.group.current_month);
      if (!existingRecord) {
        await storage.saveMonthlyRecord({
          member_id: member.id,
          month: state.group.current_month,
          contribution_due: state.group.monthly_contribution,
          contribution_paid: 0,
          fine_added: 0,
          total_fine: 0,
          interest_added: 0,
          interest_paid: 0,
          principal_paid: 0,
        });
      }
    }
    
    await refreshSummaries();
    return member;
  };

  const updateMember = async (member: Member) => {
    await storage.updateMember(member);
    dispatch({ type: 'UPDATE_MEMBER', payload: member });
    await refreshSummaries();
  };

  const deleteMember = async (id: string) => {
    await storage.deleteMember(id);
    dispatch({ type: 'DELETE_MEMBER', payload: id });
    await refreshSummaries();
  };

  const issueLoan = async (loanData: Omit<Loan, 'id' | 'is_active'>) => {
    const loan = await storage.saveLoan({ ...loanData, is_active: true });
    dispatch({ type: 'ADD_LOAN', payload: loan });
    await refreshSummaries();
    return loan;
  };

  const recordPayment = async (memberId: string, amount: number) => {
    const member = state.members.find(m => m.id === memberId);
    if (!member || !state.group) {
      throw new Error('Member or group not found');
    }

    const currentRecord = await storage.getRecordByMemberMonth(memberId, state.group.current_month);
    if (!currentRecord) {
      throw new Error('No current month record found for member');
    }

    const loan = await storage.getLoanByMember(memberId);
    const payment = await applyPayment(member, amount, currentRecord, loan, state.group.current_month);
    
    dispatch({ type: 'ADD_PAYMENT', payload: payment });
    await loadAllData(); // Reload all data to get updated records
    return payment;
  };

  const processNextMonthAction = async () => {
    if (!state.group) return;
    
    await processNextMonth(state.group, state.members, state.loans);
    await loadAllData(); // Reload all data after processing
  };

  const refreshSummaries = useCallback(async () => {
    if (state.group) {
      const summaries = await getMemberSummaries(
        state.group,
        state.members,
        state.loans,
        state.monthlyRecords
      );
      dispatch({ type: 'UPDATE_SUMMARIES', payload: summaries });
    }
  }, [state.group, state.members, state.loans, state.monthlyRecords]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    refreshSummaries();
  }, [refreshSummaries]);

  const contextValue: AppContextValue = {
    ...state,
    loadAllData,
    setupGroup,
    addMember,
    updateMember,
    deleteMember,
    issueLoan,
    recordPayment,
    processNextMonthAction,
    refreshSummaries,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}