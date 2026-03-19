import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaymentBreakdown } from '../types';

interface PaymentBreakdownProps {
  breakdown: PaymentBreakdown;
  amount: number;
}

export function PaymentBreakdownComponent({ breakdown, amount }: PaymentBreakdownProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Breakdown (₹{amount})</Text>
      
      {breakdown.fine_paid > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Fine Payment:</Text>
          <Text style={[styles.value, styles.fine]}>₹{breakdown.fine_paid}</Text>
        </View>
      )}

      {breakdown.interest_paid > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Interest Payment:</Text>
          <Text style={[styles.value, styles.interest]}>₹{breakdown.interest_paid}</Text>
        </View>
      )}

      {breakdown.principal_paid > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Principal Payment:</Text>
          <Text style={[styles.value, styles.principal]}>₹{breakdown.principal_paid}</Text>
        </View>
      )}

      {breakdown.contribution_paid > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Contribution Payment:</Text>
          <Text style={[styles.value, styles.contribution]}>₹{breakdown.contribution_paid}</Text>
        </View>
      )}

      {breakdown.remaining > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Excess Amount:</Text>
          <Text style={[styles.value, styles.excess]}>₹{breakdown.remaining}</Text>
        </View>
      )}

      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Allocated:</Text>
        <Text style={styles.totalValue}>
          ₹{amount - breakdown.remaining}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    marginTop: 8,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  fine: {
    color: '#e74c3c',
  },
  interest: {
    color: '#8e44ad',
  },
  principal: {
    color: '#2980b9',
  },
  contribution: {
    color: '#27ae60',
  },
  excess: {
    color: '#f39c12',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    textAlign: 'right',
  },
});