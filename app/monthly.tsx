import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';

export default function MonthlyProcessing() {
  const router = useRouter();
  const {
    group,
    memberSummaries,
    processNextMonthAction,
    isLoading,
  } = useApp();

  const [isProcessing, setIsProcessing] = React.useState(false);

  if (isLoading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleProcessMonth = () => {
    Alert.alert(
      'Process Next Month',
      `This will advance from Month ${group.current_month} to Month ${group.current_month + 1}.\n\nThe following actions will be performed:\n• Add monthly contributions for all members\n• Calculate and add interest on active loans\n• Add fines for members who missed contributions\n• Apply 6-month interest conversion rule if applicable\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await processNextMonthAction();
              Alert.alert(
                'Success', 
                `Month ${group.current_month + 1} has been processed successfully!`,
                [
                  { text: 'OK', onPress: () => router.back() },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to process month. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Calculate summary statistics
  const totalContributionsDue = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.currentRecord?.contribution_due || 0);
  }, 0);

  const totalContributionsPaid = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.currentRecord?.contribution_paid || 0);
  }, 0);

  const totalFinesOwed = memberSummaries.reduce((sum, ms) => {
    return sum + ms.totalFine;
  }, 0);

  const membersWithLoans = memberSummaries.filter(ms => ms.loan?.is_active).length;
  const totalLoanPrincipal = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.loan?.principal_remaining || 0);
  }, 0);

  const totalUnpaidInterest = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.loan?.unpaid_interest || 0);
  }, 0);

  const membersWithUnpaidContributions = memberSummaries.filter(ms => {
    const record = ms.currentRecord;
    return record && record.contribution_paid < record.contribution_due;
  }).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Processing</Text>
          <Text style={styles.subtitle}>Current: Month {group.current_month}</Text>
          <Text style={styles.nextMonth}>Next: Month {group.current_month + 1}</Text>
        </View>

        {/* Current Month Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Month Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>₹{totalContributionsPaid}</Text>
              <Text style={styles.summaryLabel}>Contributions Paid</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>₹{totalContributionsDue - totalContributionsPaid}</Text>
              <Text style={styles.summaryLabel}>Contributions Due</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, styles.negative]}>₹{totalFinesOwed}</Text>
              <Text style={styles.summaryLabel}>Total Fines</Text>
            </View>
          </View>
        </View>

        {/* Loan Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{membersWithLoans}</Text>
              <Text style={styles.summaryLabel}>Active Loans</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>₹{totalLoanPrincipal}</Text>
              <Text style={styles.summaryLabel}>Principal Outstanding</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, styles.negative]}>₹{totalUnpaidInterest}</Text>
              <Text style={styles.summaryLabel}>Unpaid Interest</Text>
            </View>
          </View>
        </View>

        {/* Processing Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Month Actions</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewItem}>
              <Text style={styles.previewIcon}>📋</Text>
              <Text style={styles.previewText}>
                Add ₹{group.monthly_contribution} contribution requirement for all {memberSummaries.length} members
              </Text>
            </View>
            
            {membersWithLoans > 0 && (
              <View style={styles.previewItem}>
                <Text style={styles.previewIcon}>💰</Text>
                <Text style={styles.previewText}>
                  Calculate interest on {membersWithLoans} active loans at {group.interest_rate}% rate
                </Text>
              </View>
            )}

            {membersWithUnpaidContributions > 0 && (
              <View style={styles.previewItem}>
                <Text style={styles.previewIcon}>⚠️</Text>
                <Text style={styles.previewText}>
                  Add ₹{group.fine_amount} fine for {membersWithUnpaidContributions} members with unpaid contributions
                </Text>
              </View>
            )}

            <View style={styles.previewItem}>
              <Text style={styles.previewIcon}>🔄</Text>
              <Text style={styles.previewText}>
                Apply 6-month interest conversion rule (if applicable)
              </Text>
            </View>
          </View>
        </View>

        {/* Warning Messages */}
        {(membersWithUnpaidContributions > 0 || totalUnpaidInterest > 0) && (
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ Attention Required</Text>
            {membersWithUnpaidContributions > 0 && (
              <Text style={styles.warningText}>
                {membersWithUnpaidContributions} members have unpaid contributions and will receive fines.
              </Text>
            )}
            {totalUnpaidInterest > 0 && (
              <Text style={styles.warningText}>
                ₹{totalUnpaidInterest} in unpaid interest exists across all loans.
              </Text>
            )}
          </View>
        )}

        {/* Process Button */}
        <TouchableOpacity
          style={[styles.processButton, isProcessing && styles.disabledButton]}
          onPress={handleProcessMonth}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContent}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.processButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.processButtonText}>
              Process Month {group.current_month + 1} →
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Important Notes</Text>
          <Text style={styles.infoText}>
            • Processing a month cannot be undone{'\n'}
            • All calculations are performed automatically{'\n'}
            • Members can make payments after processing{'\n'}
            • Interest is calculated on remaining principal balance{'\n'}
            • Fines accumulate until contributions are paid
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#B8D4F0',
    marginTop: 4,
  },
  nextMonth: {
    fontSize: 16,
    color: '#e8f4f8',
    marginTop: 2,
    fontWeight: '600',
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  negative: {
    color: '#e74c3c',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  processButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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