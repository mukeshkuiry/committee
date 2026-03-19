import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getGroup, getMembers } from '../storage';
import { getMemberSummary } from '../utils/finance';
import { MemberSummary, Group } from '../types';

export default function DashboardScreen({ navigation }: any) {
  const [group, setGroup] = useState<Group | null>(null);
  const [summaries, setSummaries] = useState<MemberSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const g = await getGroup();
    setGroup(g);
    const members = await getMembers();
    const sums = await Promise.all(members.map((m) => getMemberSummary(m.id)));
    setSummaries(sums.filter(Boolean) as MemberSummary[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const renderItem = ({ item }: { item: MemberSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('MemberDetail', { memberId: item.member.id })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.memberName}>{item.member.name}</Text>
        <View
          style={[
            styles.badge,
            item.loan ? styles.badgeActive : styles.badgeNone,
          ]}
        >
          <Text style={styles.badgeText}>
            {item.loan ? 'Loan Active' : 'No Loan'}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.cardItem}>
          <Text style={styles.cardLabel}>Contribution Due</Text>
          <Text style={styles.cardValue}>
            {formatCurrency(item.totalContributionDue - item.totalContributionPaid)}
          </Text>
        </View>
        <View style={styles.cardItem}>
          <Text style={styles.cardLabel}>Fine</Text>
          <Text style={[styles.cardValue, item.totalFine > 0 && styles.red]}>
            {formatCurrency(item.totalFine)}
          </Text>
        </View>
      </View>

      {item.loan && (
        <View style={styles.cardRow}>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Principal</Text>
            <Text style={styles.cardValue}>
              {formatCurrency(item.loan.principalRemaining)}
            </Text>
          </View>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Unpaid Interest</Text>
            <Text style={[styles.cardValue, styles.orange]}>
              {formatCurrency(item.loan.unpaidInterest)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Due</Text>
        <Text style={[styles.totalValue, item.totalDue > 0 && styles.red]}>
          {formatCurrency(item.totalDue)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate('Payment', { memberId: item.member.id })
          }
        >
          <Text style={styles.actionBtnText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.loanBtn]}
          onPress={() =>
            navigation.navigate('Loan', { memberId: item.member.id })
          }
        >
          <Text style={styles.actionBtnText}>Loan</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {group && (
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.monthText}>Month {group.currentMonth}</Text>
        </View>
      )}

      {summaries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No members yet.</Text>
          <Text style={styles.emptySubText}>
            Go to Members tab to add members.
          </Text>
        </View>
      ) : (
        <FlatList
          data={summaries}
          keyExtractor={(item) => item.member.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={load} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  groupHeader: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  monthText: { color: '#BFDBFE', fontSize: 14 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgeNone: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, color: '#1E40AF', fontWeight: '600' },
  cardRow: { flexDirection: 'row', marginBottom: 8 },
  cardItem: { flex: 1 },
  cardLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  cardValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  red: { color: '#DC2626' },
  orange: { color: '#D97706' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loanBtn: { backgroundColor: '#7C3AED' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});
