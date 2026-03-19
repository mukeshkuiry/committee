import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getGroup, getMembers } from '../storage';
import { processMonth } from '../utils/finance';
import { Group, Member } from '../types';

export default function MonthlyScreen() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    const [g, m] = await Promise.all([getGroup(), getMembers()]);
    setGroup(g);
    setMembers(m);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleNextMonth = () => {
    if (members.length === 0) {
      Alert.alert('No Members', 'Add members before processing monthly cycle.');
      return;
    }

    Alert.alert(
      'Process Next Month',
      `This will advance from Month ${group?.currentMonth} to Month ${(group?.currentMonth || 0) + 1}.\n\nThis will:\n• Add contribution dues\n• Calculate loan interest\n• Apply 6-month conversion rule\n• Apply fines for unpaid contributions\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            setProcessing(true);
            try {
              await processMonth();
              await load();
              Alert.alert('Success', 'Monthly processing completed!');
            } catch (e) {
              Alert.alert('Error', 'Failed to process month');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {group && (
        <>
          <View style={styles.groupCard}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>Month {group.currentMonth}</Text>
            </View>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.sectionTitle}>Group Configuration</Text>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Monthly Contribution</Text>
              <Text style={styles.configValue}>
                ₹{group.monthlyContribution.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Interest Rate</Text>
              <Text style={styles.configValue}>{group.interestRate}%/month</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Fine Amount</Text>
              <Text style={styles.configValue}>
                ₹{group.fineAmount.toLocaleString('en-IN')}/month
              </Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Total Members</Text>
              <Text style={styles.configValue}>{members.length}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Pool Size</Text>
              <Text style={styles.configValue}>
                ₹{(members.length * group.monthlyContribution).toLocaleString('en-IN')}/month
              </Text>
            </View>
          </View>

          <View style={styles.lifecycleCard}>
            <Text style={styles.sectionTitle}>Monthly Lifecycle Steps</Text>
            {[
              'Add contribution due for all members',
              'Calculate loan interest (reducing balance)',
              'Apply 6-month rule (unpaid interest → principal)',
              'Apply fine for unpaid contributions',
            ].map((step, idx) => (
              <View key={idx} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.processBtn, processing && styles.processBtnDisabled]}
            onPress={handleNextMonth}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.processBtnText}>
                Process Month {group.currentMonth} → {group.currentMonth + 1}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  groupCard: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  monthBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  monthBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  configCard: {
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
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configLabel: { fontSize: 14, color: '#6B7280' },
  configValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  lifecycleCard: {
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
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  processBtn: {
    backgroundColor: '#059669',
    margin: 16,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  processBtnDisabled: { backgroundColor: '#9CA3AF' },
  processBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
