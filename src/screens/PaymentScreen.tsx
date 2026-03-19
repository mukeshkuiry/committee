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
import { getMemberSummary, allocatePayment, recordPayment } from '../utils/finance';
import { MemberSummary } from '../types';

export default function PaymentScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof allocatePayment> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await getMemberSummary(memberId);
    setSummary(s);
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePreview = () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (!summary) return;

    const totalFine = summary.totalFine;
    const unpaidInterest = summary.loan ? summary.loan.unpaidInterest : 0;
    const principalRemaining = summary.loan ? summary.loan.principalRemaining : 0;
    const contributionDue =
      summary.totalContributionDue - summary.totalContributionPaid;

    const breakdown = allocatePayment(
      amtNum,
      totalFine,
      unpaidInterest,
      principalRemaining,
      contributionDue,
    );
    setPreview(breakdown);
  };

  const handleSave = async () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await recordPayment(memberId, amtNum);
      Alert.alert('Success', 'Payment recorded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setSaving(false);
    }
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

        <View style={styles.duesCard}>
          <Text style={styles.sectionTitle}>Current Dues</Text>
          {summary.totalFine > 0 && (
            <DueRow label="Fine" value={fmt(summary.totalFine)} type="red" />
          )}
          {summary.loan && summary.loan.unpaidInterest > 0 && (
            <DueRow
              label="Unpaid Interest"
              value={fmt(summary.loan.unpaidInterest)}
              type="orange"
            />
          )}
          {summary.loan && summary.loan.principalRemaining > 0 && (
            <DueRow
              label="Principal Remaining"
              value={fmt(summary.loan.principalRemaining)}
              type="blue"
            />
          )}
          {summary.totalContributionDue - summary.totalContributionPaid > 0 && (
            <DueRow
              label="Contribution Due"
              value={fmt(summary.totalContributionDue - summary.totalContributionPaid)}
              type="green"
            />
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>{fmt(summary.totalDue)}</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setPreview(null);
            }}
            placeholder="Enter amount"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.previewBtn} onPress={handlePreview}>
            <Text style={styles.previewBtnText}>Preview Breakdown</Text>
          </TouchableOpacity>
        </View>

        {preview && (
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>
            {preview.finePaid > 0 && (
              <DueRow label="Fine Paid" value={fmt(preview.finePaid)} type="red" />
            )}
            {preview.interestPaid > 0 && (
              <DueRow
                label="Interest Paid"
                value={fmt(preview.interestPaid)}
                type="orange"
              />
            )}
            {preview.principalPaid > 0 && (
              <DueRow
                label="Principal Paid"
                value={fmt(preview.principalPaid)}
                type="blue"
              />
            )}
            {preview.contributionPaid > 0 && (
              <DueRow
                label="Contribution Paid"
                value={fmt(preview.contributionPaid)}
                type="green"
              />
            )}
            {preview.remaining > 0 && (
              <DueRow
                label="Excess (no dues)"
                value={fmt(preview.remaining)}
                type="gray"
              />
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DueRow({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: 'red' | 'orange' | 'blue' | 'green' | 'gray';
}) {
  const colors: Record<string, string> = {
    red: '#DC2626',
    orange: '#D97706',
    blue: '#2563EB',
    green: '#059669',
    gray: '#6B7280',
  };
  return (
    <View style={styles.dueRow}>
      <Text style={styles.dueLabel}>{label}</Text>
      <Text style={[styles.dueValue, { color: colors[type] }]}>{value}</Text>
    </View>
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
  duesCard: {
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
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dueLabel: { fontSize: 14, color: '#374151' },
  dueValue: { fontSize: 14, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#DC2626' },
  inputCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
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
  previewBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  previewBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  breakdownCard: {
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
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: { backgroundColor: '#9CA3AF' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
