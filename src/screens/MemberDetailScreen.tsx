import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMemberSummary } from '../utils/finance';
import { getPayments, getMonthlyRecords } from '../storage';
import { MemberSummary, Payment, MonthlyRecord } from '../types';

export default function MemberDetailScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);

  const load = useCallback(async () => {
    const [s, p, r] = await Promise.all([
      getMemberSummary(memberId),
      getPayments(),
      getMonthlyRecords(),
    ]);
    setSummary(s);
    setPayments(p.filter((pay) => pay.memberId === memberId));
    setRecords(
      r
        .filter((rec) => rec.memberId === memberId)
        .sort((a, b) => b.month - a.month),
    );
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (!summary) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.memberHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {summary.member.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.memberName}>{summary.member.name}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryItem, styles.summaryBlue]}>
          <Text style={styles.summaryLabel}>Contribution Due</Text>
          <Text style={styles.summaryValue}>
            {fmt(summary.totalContributionDue - summary.totalContributionPaid)}
          </Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryRed]}>
          <Text style={styles.summaryLabel}>Total Fine</Text>
          <Text style={styles.summaryValue}>{fmt(summary.totalFine)}</Text>
        </View>
        {summary.loan && (
          <>
            <View style={[styles.summaryItem, styles.summaryPurple]}>
              <Text style={styles.summaryLabel}>Principal</Text>
              <Text style={styles.summaryValue}>
                {fmt(summary.loan.principalRemaining)}
              </Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryOrange]}>
              <Text style={styles.summaryLabel}>Unpaid Interest</Text>
              <Text style={styles.summaryValue}>
                {fmt(summary.loan.unpaidInterest)}
              </Text>
            </View>
          </>
        )}
      </View>

      {summary.loan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Loan</Text>
          <View style={styles.card}>
            <InfoRow
              label="Principal Remaining"
              value={fmt(summary.loan.principalRemaining)}
            />
            <InfoRow
              label="Unpaid Interest"
              value={fmt(summary.loan.unpaidInterest)}
            />
            <InfoRow
              label="Unpaid Interest Months"
              value={`${summary.loan.unpaidInterestMonths} months`}
            />
            <InfoRow label="Loan Status" value="Active" highlight />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Records</Text>
        {records.length === 0 ? (
          <Text style={styles.noData}>No monthly records yet</Text>
        ) : (
          records.map((rec) => (
            <View key={rec.id} style={styles.recordCard}>
              <Text style={styles.recordMonth}>Month {rec.month}</Text>
              <InfoRow
                label="Contribution Due/Paid"
                value={`${fmt(rec.contributionDue)} / ${fmt(rec.contributionPaid)}`}
              />
              {rec.interestAdded > 0 && (
                <InfoRow label="Interest Added" value={fmt(rec.interestAdded)} />
              )}
              {rec.interestPaid > 0 && (
                <InfoRow label="Interest Paid" value={fmt(rec.interestPaid)} />
              )}
              {rec.fineAdded > 0 && (
                <InfoRow label="Fine Added" value={fmt(rec.fineAdded)} />
              )}
              <InfoRow label="Total Fine Balance" value={fmt(rec.totalFine)} />
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <Text style={styles.noData}>No payments yet</Text>
        ) : (
          [...payments]
            .sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((pay) => (
              <View key={pay.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentAmount}>{fmt(pay.amount)}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(pay.date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                {pay.finePaid > 0 && (
                  <InfoRow label="Fine Paid" value={fmt(pay.finePaid)} />
                )}
                {pay.interestPaid > 0 && (
                  <InfoRow label="Interest Paid" value={fmt(pay.interestPaid)} />
                )}
                {pay.principalPaid > 0 && (
                  <InfoRow label="Principal Paid" value={fmt(pay.principalPaid)} />
                )}
                {pay.contributionPaid > 0 && (
                  <InfoRow
                    label="Contribution Paid"
                    value={fmt(pay.contributionPaid)}
                  />
                )}
              </View>
            ))
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Payment', { memberId })}
        >
          <Text style={styles.actionBtnText}>Record Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.loanBtn]}
          onPress={() => navigation.navigate('Loan', { memberId })}
        >
          <Text style={styles.actionBtnText}>Manage Loan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.highlightValue]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  memberHeader: {
    backgroundColor: '#1E3A8A',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  memberName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
  },
  summaryBlue: { backgroundColor: '#DBEAFE' },
  summaryRed: { backgroundColor: '#FEE2E2' },
  summaryPurple: { backgroundColor: '#EDE9FE' },
  summaryOrange: { backgroundColor: '#FEF3C7' },
  summaryLabel: { fontSize: 12, color: '#374151', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  section: { margin: 16, marginTop: 0 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  highlightValue: { color: '#059669' },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  recordMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentAmount: { fontSize: 18, fontWeight: '700', color: '#059669' },
  paymentDate: { fontSize: 13, color: '#6B7280' },
  noData: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 16,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  loanBtn: { backgroundColor: '#7C3AED' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
