import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { LoanCard } from '../../src/components/LoanCard';

export default function LoanDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loans, members, payments, monthlyRecords, group, isLoading } = useApp();

  const loan = loans.find(l => l.id === id);
  const member = loan ? members.find(m => m.id === loan.member_id) : null;
  
  // Get payment history for this loan (payments with principal or interest components)
  const loanPayments = loan
    ? payments
        .filter(p => p.member_id === loan.member_id && (p.breakdown.principal_paid > 0 || p.breakdown.interest_paid > 0))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Get monthly records for this member since loan was created
  const memberRecords = loan && member
    ? monthlyRecords
        .filter(r => r.member_id === member.id && r.month >= loan.created_month)
        .sort((a, b) => b.month - a.month)
    : [];

  if (isLoading || !loan || !member) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalPrincipalPaid = loanPayments.reduce((sum, p) => sum + p.breakdown.principal_paid, 0);
  const totalInterestPaid = loanPayments.reduce((sum, p) => sum + p.breakdown.interest_paid, 0);
  const originalPrincipal = loan.principal_remaining + totalPrincipalPaid;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <LoanCard loan={loan} memberName={member.name} />
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Original Principal:</Text>
              <Text style={styles.summaryValue}>₹{originalPrincipal}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Principal Paid:</Text>
              <Text style={[styles.summaryValue, styles.positive]}>₹{totalPrincipalPaid}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Principal Remaining:</Text>
              <Text style={styles.summaryValue}>₹{loan.principal_remaining}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest Paid:</Text>
              <Text style={[styles.summaryValue, styles.positive]}>₹{totalInterestPaid}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Unpaid Interest:</Text>
              <Text style={[styles.summaryValue, styles.negative]}>₹{loan.unpaid_interest}</Text>
            </View>

            {loan.unpaid_interest_months >= 6 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Interest has been unpaid for {loan.unpaid_interest_months} months. 
                  At 6 months, unpaid interest is converted to principal.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/payment/new?memberId=${member.id}`)}
          >
            <Text style={styles.actionButtonText}>Record Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/member/${member.id}`)}
          >
            <Text style={styles.actionButtonText}>View Member</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History */}
        {loanPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {loanPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.paymentBreakdown}>
                  {payment.breakdown.principal_paid > 0 && (
                    <Text style={styles.breakdownItem}>Principal: ₹{payment.breakdown.principal_paid}</Text>
                  )}
                  {payment.breakdown.interest_paid > 0 && (
                    <Text style={styles.breakdownItem}>Interest: ₹{payment.breakdown.interest_paid}</Text>
                  )}
                  {payment.breakdown.fine_paid > 0 && (
                    <Text style={styles.breakdownItem}>Fine: ₹{payment.breakdown.fine_paid}</Text>
                  )}
                  {payment.breakdown.contribution_paid > 0 && (
                    <Text style={styles.breakdownItem}>Contribution: ₹{payment.breakdown.contribution_paid}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Records */}
        {memberRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Interest History</Text>
            {memberRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordMonth}>Month {record.month}</Text>
                  {record.month === group?.current_month && (
                    <Text style={styles.currentLabel}>Current</Text>
                  )}
                </View>
                <View style={styles.recordDetails}>
                  {record.interest_added > 0 && (
                    <Text style={styles.recordItem}>
                      Interest Added: ₹{record.interest_added}
                    </Text>
                  )}
                  {record.interest_paid > 0 && (
                    <Text style={[styles.recordItem, styles.positive]}>
                      Interest Paid: ₹{record.interest_paid}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  positive: {
    color: '#27ae60',
  },
  negative: {
    color: '#e74c3c',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2980b9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  paymentBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownItem: {
    fontSize: 12,
    color: '#555',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  currentLabel: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#e67e22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  recordDetails: {
    gap: 4,
  },
  recordItem: {
    fontSize: 13,
    color: '#555',
  },
});