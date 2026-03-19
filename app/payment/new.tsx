import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { PaymentBreakdownComponent } from '../../src/components/PaymentBreakdown';
import { calculatePaymentBreakdown } from '../../src/engine/payment';

export default function NewPayment() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const { members, group, recordPayment, monthlyRecords, loans } = useApp();
  
  const [selectedMemberId, setSelectedMemberId] = React.useState(memberId || '');
  const [amount, setAmount] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showBreakdown, setShowBreakdown] = React.useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const currentRecord = selectedMember && group
    ? monthlyRecords.find(r => r.member_id === selectedMember.id && r.month === group.current_month)
    : null;
  const memberLoan = selectedMember ? (loans.find(l => l.member_id === selectedMember.id && l.is_active) ?? null) : null;

  const breakdown = selectedMember && currentRecord && amount && !isNaN(parseFloat(amount))
    ? calculatePaymentBreakdown(parseFloat(amount), currentRecord, memberLoan)
    : null;

  React.useEffect(() => {
    if (amount && parseFloat(amount) > 0 && currentRecord) {
      setShowBreakdown(true);
    } else {
      setShowBreakdown(false);
    }
  }, [amount, currentRecord]);

  const handleRecordPayment = async () => {
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a member');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (!currentRecord) {
      Alert.alert('Error', 'No current month record found for this member');
      return;
    }

    const paymentAmount = parseFloat(amount);
    const member = members.find(m => m.id === selectedMemberId);

    if (!member) {
      Alert.alert('Error', 'Member not found');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Record payment of ₹${paymentAmount} from ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record Payment',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await recordPayment(selectedMemberId, paymentAmount);
              Alert.alert('Success', 'Payment recorded successfully!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to record payment. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No group found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Record Payment</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Member</Text>
            <ScrollView style={styles.memberList} nestedScrollEnabled>
              {members.map(member => {
                const record = monthlyRecords.find(r => r.member_id === member.id && r.month === group.current_month);
                const loan = loans.find(l => l.member_id === member.id && l.is_active);
                
                let totalDue = 0;
                if (record) {
                  totalDue += Math.max(0, record.contribution_due - record.contribution_paid);
                  totalDue += record.total_fine;
                }
                if (loan) {
                  totalDue += loan.unpaid_interest;
                }

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberOption,
                      selectedMemberId === member.id && styles.selectedMember
                    ]}
                    onPress={() => setSelectedMemberId(member.id)}
                  >
                    <View style={styles.memberInfo}>
                      <Text style={[
                        styles.memberName,
                        selectedMemberId === member.id && styles.selectedMemberName
                      ]}>
                        {member.name}
                      </Text>
                      {totalDue > 0 && (
                        <Text style={styles.memberDue}>Due: ₹{totalDue}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter payment amount"
              keyboardType="numeric"
            />
          </View>

          {showBreakdown && breakdown && (
            <PaymentBreakdownComponent
              breakdown={breakdown}
              amount={parseFloat(amount)}
            />
          )}

          <TouchableOpacity
            style={[styles.recordButton, isProcessing && styles.disabledButton]}
            onPress={handleRecordPayment}
            disabled={isProcessing || !selectedMemberId || !amount}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.recordButtonText}>Record Payment</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {selectedMember && currentRecord && (
          <View style={styles.memberStatusSection}>
            <Text style={styles.statusTitle}>Current Status - {selectedMember.name}</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Contribution this month:</Text>
                <Text style={styles.statusValue}>
                  ₹{currentRecord.contribution_paid}/{currentRecord.contribution_due}
                </Text>
              </View>
              
              {currentRecord.total_fine > 0 && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Total Fine:</Text>
                  <Text style={[styles.statusValue, styles.fine]}>₹{currentRecord.total_fine}</Text>
                </View>
              )}

              {memberLoan && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Loan Principal:</Text>
                    <Text style={styles.statusValue}>₹{memberLoan.principal_remaining}</Text>
                  </View>
                  {memberLoan.unpaid_interest > 0 && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Unpaid Interest:</Text>
                      <Text style={[styles.statusValue, styles.interest]}>₹{memberLoan.unpaid_interest}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Payment Priority</Text>
          <Text style={styles.infoText}>
            Payments are automatically allocated in this order:{'\n'}
            1. Fine{'\n'}
            2. Unpaid Interest{'\n'}
            3. Loan Principal{'\n'}
            4. Monthly Contribution{'\n'}
            Any excess amount will be shown in the breakdown.
          </Text>
        </View>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  memberList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  memberOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedMember: {
    backgroundColor: '#e8f4f8',
    borderBottomColor: '#2980b9',
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedMemberName: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  memberDue: {
    fontSize: 12,
    color: '#e67e22',
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberStatusSection: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
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
    color: '#333',
    textAlign: 'right',
  },
  fine: {
    color: '#e74c3c',
  },
  interest: {
    color: '#8e44ad',
  },
  infoSection: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});