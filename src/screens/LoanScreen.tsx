import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMemberSummary, issueLoan } from '../utils/finance';
import { getGroup } from '../storage';
import { MemberSummary, Group } from '../types';

export default function LoanScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    const [s, g] = await Promise.all([getMemberSummary(memberId), getGroup()]);
    setSummary(s);
    setGroup(g);
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleIssueLoan = async () => {
    const amt = parseFloat(loanAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid loan amount');
      return;
    }

    Alert.alert(
      'Confirm Loan',
      `Issue a loan of ₹${amt.toLocaleString('en-IN')} to ${summary?.member.name}?\n\nMonthly interest: ₹${((amt * (group?.interestRate || 0)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${group?.interestRate}%)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue',
          onPress: async () => {
            setIssuing(true);
            try {
              await issueLoan(memberId, amt);
              await load();
              setLoanAmount('');
              Alert.alert('Success', 'Loan issued successfully!');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to issue loan');
            } finally {
              setIssuing(false);
            }
          },
        },
      ],
    );
  };

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (!summary) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.memberCard}>
          <Text style={styles.memberName}>{summary.member.name}</Text>
        </View>

        {summary.loan ? (
          <View style={styles.loanCard}>
            <Text style={styles.sectionTitle}>Active Loan</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Principal Remaining</Text>
              <Text style={styles.valueBlue}>
                {fmt(summary.loan.principalRemaining)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Unpaid Interest</Text>
              <Text style={styles.valueOrange}>
                {fmt(summary.loan.unpaidInterest)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Unpaid Months</Text>
              <Text style={styles.valueRed}>
                {summary.loan.unpaidInterestMonths} months
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Monthly Interest</Text>
              <Text style={styles.valuePurple}>
                {fmt(
                  (summary.loan.principalRemaining * (group?.interestRate || 0)) / 100,
                )}
                /month
              </Text>
            </View>

            {summary.loan.unpaidInterestMonths >= 4 && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  ⚠️ Warning: {summary.loan.unpaidInterestMonths} months of unpaid
                  interest. At 6 months, unpaid interest will be added to principal.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => navigation.navigate('Payment', { memberId })}
            >
              <Text style={styles.payBtnText}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noLoanCard}>
            <Text style={styles.noLoanText}>No active loan</Text>
          </View>
        )}

        {!summary.loan && (
          <View style={styles.issueCard}>
            <Text style={styles.sectionTitle}>Issue New Loan</Text>
            {group && (
              <Text style={styles.rateInfo}>
                Interest Rate: {group.interestRate}% per month (reducing balance)
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={loanAmount}
              onChangeText={setLoanAmount}
              placeholder="Loan amount"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {loanAmount && !isNaN(parseFloat(loanAmount)) && group && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  Monthly interest:{' '}
                  <Text style={styles.bold}>
                    ₹
                    {(
                      (parseFloat(loanAmount) * group.interestRate) /
                      100
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.issueBtn, issuing && styles.issueBtnDisabled]}
              onPress={handleIssueLoan}
              disabled={issuing}
            >
              {issuing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.issueBtnText}>Issue Loan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  memberCard: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    alignItems: 'center',
  },
  memberName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  loanCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 14, color: '#6B7280' },
  valueBlue: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  valueOrange: { fontSize: 16, fontWeight: '700', color: '#D97706' },
  valueRed: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  valuePurple: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
  warning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  payBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  payBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  noLoanCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  noLoanText: { fontSize: 16, color: '#9CA3AF' },
  issueCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  rateInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  preview: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  previewText: { color: '#4C1D95', fontSize: 14 },
  bold: { fontWeight: '700' },
  issueBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  issueBtnDisabled: { backgroundColor: '#9CA3AF' },
  issueBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
