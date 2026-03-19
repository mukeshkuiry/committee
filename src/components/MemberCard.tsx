import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MemberSummary } from '../types';

interface MemberCardProps {
  memberSummary: MemberSummary;
  onPress: () => void;
}

export function MemberCard({ memberSummary, onPress }: MemberCardProps) {
  const { member, currentRecord, loan, totalFine, totalDue } = memberSummary;

  const contributionStatus = currentRecord 
    ? `${currentRecord.contribution_paid}/${currentRecord.contribution_due}`
    : '0/0';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.memberName}>{member.name}</Text>
        {totalDue > 0 && <Text style={styles.totalDue}>₹{totalDue}</Text>}
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Contribution:</Text>
        <Text style={[
          styles.value,
          currentRecord?.contribution_paid === currentRecord?.contribution_due 
            ? styles.paidFull 
            : styles.pending
        ]}>
          ₹{contributionStatus}
        </Text>
      </View>

      {totalFine > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Fine:</Text>
          <Text style={[styles.value, styles.fine]}>₹{totalFine}</Text>
        </View>
      )}

      {loan && loan.is_active && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Principal:</Text>
            <Text style={styles.value}>₹{loan.principal_remaining}</Text>
          </View>
          {loan.unpaid_interest > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Unpaid Interest:</Text>
              <Text style={[styles.value, styles.interest]}>₹{loan.unpaid_interest}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
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
    marginBottom: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    flex: 1,
  },
  totalDue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    backgroundColor: '#fee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
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
  paidFull: {
    color: '#27ae60',
  },
  pending: {
    color: '#e67e22',
  },
  fine: {
    color: '#e74c3c',
  },
  interest: {
    color: '#8e44ad',
  },
});