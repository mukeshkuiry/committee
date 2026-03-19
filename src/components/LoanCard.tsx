import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Loan } from '../types';

interface LoanCardProps {
  loan: Loan;
  memberName: string;
}

export function LoanCard({ loan, memberName }: LoanCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.memberName}>{memberName}</Text>
        <Text style={[styles.status, loan.is_active ? styles.active : styles.inactive]}>
          {loan.is_active ? 'Active' : 'Closed'}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Principal Remaining:</Text>
        <Text style={styles.value}>₹{loan.principal_remaining}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Unpaid Interest:</Text>
        <Text style={[styles.value, styles.interest]}>₹{loan.unpaid_interest}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Interest Rate:</Text>
        <Text style={styles.value}>{loan.interest_rate}% monthly</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Unpaid Months:</Text>
        <Text style={[
          styles.value,
          loan.unpaid_interest_months >= 6 ? styles.warning : undefined
        ]}>
          {loan.unpaid_interest_months}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Created Month:</Text>
        <Text style={styles.value}>{loan.created_month}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  active: {
    backgroundColor: '#d5f4e6',
    color: '#27ae60',
  },
  inactive: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  interest: {
    color: '#8e44ad',
  },
  warning: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});