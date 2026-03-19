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

export default function MemberDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    members,
    loans,
    monthlyRecords,
    payments,
    group,
    isLoading,
    deleteMember,
  } = useApp();

  const [isDeletingMember, setIsDeletingMember] = React.useState(false);

  const member = members.find(m => m.id === id);
  const memberLoan = loans.find(l => l.member_id === id && l.is_active);
  const memberRecords = monthlyRecords
    .filter(r => r.member_id === id)
    .sort((a, b) => b.month - a.month);
  const memberPayments = payments
    .filter(p => p.member_id === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Show last 10 payments

  if (isLoading || !member) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentRecord = group 
    ? memberRecords.find(r => r.month === group.current_month)
    : null;

  const handleDeleteMember = () => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${member.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingMember(true);
            try {
              await deleteMember(member.id);
              Alert.alert('Success', 'Member deleted successfully!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete member. Please try again.');
            } finally {
              setIsDeletingMember(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.memberName}>{member.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/member/${member.id}/edit`)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, isDeletingMember && styles.disabledButton]}
            onPress={handleDeleteMember}
            disabled={isDeletingMember}
          >
            {isDeletingMember ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Status */}
      {currentRecord && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status (Month {group?.current_month})</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Contribution:</Text>
              <Text style={[
                styles.statusValue,
                currentRecord.contribution_paid === currentRecord.contribution_due 
                  ? styles.paidFull 
                  : styles.pending
              ]}>
                ₹{currentRecord.contribution_paid}/{currentRecord.contribution_due}
              </Text>
            </View>
            
            {currentRecord.total_fine > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Total Fine:</Text>
                <Text style={[styles.statusValue, styles.fine]}>₹{currentRecord.total_fine}</Text>
              </View>
            )}

            {currentRecord.interest_paid > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Interest Paid:</Text>
                <Text style={styles.statusValue}>₹{currentRecord.interest_paid}</Text>
              </View>
            )}

            {currentRecord.principal_paid > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Principal Paid:</Text>
                <Text style={styles.statusValue}>₹{currentRecord.principal_paid}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Active Loan */}
      {memberLoan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Loan</Text>
          <LoanCard loan={memberLoan} memberName={member.name} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/payment/new?memberId=${member.id}`)}
        >
          <Text style={styles.actionButtonText}>Record Payment</Text>
        </TouchableOpacity>
        {!memberLoan && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/loan/new?memberId=${member.id}`)}
          >
            <Text style={styles.actionButtonText}>Issue Loan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Payments */}
      {memberPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {memberPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                <Text style={styles.paymentDate}>
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.paymentBreakdown}>
                {payment.breakdown.fine_paid > 0 && (
                  <Text style={styles.breakdownItem}>Fine: ₹{payment.breakdown.fine_paid}</Text>
                )}
                {payment.breakdown.interest_paid > 0 && (
                  <Text style={styles.breakdownItem}>Interest: ₹{payment.breakdown.interest_paid}</Text>
                )}
                {payment.breakdown.principal_paid > 0 && (
                  <Text style={styles.breakdownItem}>Principal: ₹{payment.breakdown.principal_paid}</Text>
                )}
                {payment.breakdown.contribution_paid > 0 && (
                  <Text style={styles.breakdownItem}>Contribution: ₹{payment.breakdown.contribution_paid}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Monthly History */}
      {memberRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly History</Text>
          {memberRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <Text style={styles.recordMonth}>Month {record.month}</Text>
              <View style={styles.recordDetails}>
                <Text style={styles.recordItem}>
                  Contribution: ₹{record.contribution_paid}/{record.contribution_due}
                </Text>
                {record.total_fine > 0 && (
                  <Text style={[styles.recordItem, styles.fine]}>
                    Fine: ₹{record.total_fine}
                  </Text>
                )}
                {record.interest_paid > 0 && (
                  <Text style={styles.recordItem}>
                    Interest Paid: ₹{record.interest_paid}
                  </Text>
                )}
                {record.principal_paid > 0 && (
                  <Text style={styles.recordItem}>
                    Principal Paid: ₹{record.principal_paid}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
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
  header: {
    backgroundColor: '#1E3A5F',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#2980b9',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
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
  recordMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  recordDetails: {
    gap: 4,
  },
  recordItem: {
    fontSize: 13,
    color: '#555',
  },
});