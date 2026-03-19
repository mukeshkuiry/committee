import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { MemberCard } from '../../src/components/MemberCard';

export default function Dashboard() {
  const router = useRouter();
  const {
    group,
    memberSummaries,
    isLoading,
    isInitialized,
    processNextMonthAction,
    setupGroup,
  } = useApp();

  const [isProcessingMonth, setIsProcessingMonth] = React.useState(false);
  const [showGroupSetup, setShowGroupSetup] = React.useState(false);
  const [groupForm, setGroupForm] = React.useState({
    name: '',
    monthly_contribution: '',
    interest_rate: '',
    fine_amount: '',
  });

  React.useEffect(() => {
    if (isInitialized && !group) {
      setShowGroupSetup(true);
    }
  }, [isInitialized, group]);

  const handleNextMonth = () => {
    Alert.alert(
      'Process Next Month',
      'This will advance to the next month and process all member accounts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: async () => {
            setIsProcessingMonth(true);
            try {
              await processNextMonthAction();
              Alert.alert('Success', 'Month processed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to process month. Please try again.');
            } finally {
              setIsProcessingMonth(false);
            }
          },
        },
      ]
    );
  };

  const handleSetupGroup = async () => {
    if (!groupForm.name || !groupForm.monthly_contribution || !groupForm.interest_rate || !groupForm.fine_amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await setupGroup({
        name: groupForm.name,
        monthly_contribution: parseFloat(groupForm.monthly_contribution),
        interest_rate: parseFloat(groupForm.interest_rate),
        fine_amount: parseFloat(groupForm.fine_amount),
      });
      setShowGroupSetup(false);
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (showGroupSetup) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Setup Your Committee Group</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={groupForm.name}
              onChangeText={(text) => setGroupForm({ ...groupForm, name: text })}
              placeholder="Enter group name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Contribution (₹)</Text>
            <TextInput
              style={styles.input}
              value={groupForm.monthly_contribution}
              onChangeText={(text) => setGroupForm({ ...groupForm, monthly_contribution: text })}
              placeholder="Enter monthly contribution"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={groupForm.interest_rate}
              onChangeText={(text) => setGroupForm({ ...groupForm, interest_rate: text })}
              placeholder="Enter interest rate per month"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fine Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={groupForm.fine_amount}
              onChangeText={(text) => setGroupForm({ ...groupForm, fine_amount: text })}
              placeholder="Enter fine amount for missed contributions"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.setupButton} onPress={handleSetupGroup}>
            <Text style={styles.setupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No group found</Text>
      </View>
    );
  }

  const totalPoolContributions = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.currentRecord?.contribution_paid || 0);
  }, 0);

  const totalOutstandingLoans = memberSummaries.reduce((sum, ms) => {
    return sum + (ms.loan?.principal_remaining || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.monthInfo}>Month {group.current_month}</Text>
        </View>

        {/* Pool Info */}
        <View style={styles.poolInfo}>
          <View style={styles.poolCard}>
            <Text style={styles.poolLabel}>Pool Balance</Text>
            <Text style={styles.poolAmount}>₹{totalPoolContributions - totalOutstandingLoans}</Text>
          </View>
          <View style={styles.poolCard}>
            <Text style={styles.poolLabel}>Total Contributions</Text>
            <Text style={styles.poolAmount}>₹{totalPoolContributions}</Text>
          </View>
          <View style={styles.poolCard}>
            <Text style={styles.poolLabel}>Outstanding Loans</Text>
            <Text style={styles.poolAmount}>₹{totalOutstandingLoans}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/member/add')}
          >
            <Text style={styles.actionButtonText}>Add Member</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/loan/new')}
          >
            <Text style={styles.actionButtonText}>Issue Loan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/payment/new')}
          >
            <Text style={styles.actionButtonText}>Record Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Members ({memberSummaries.length})</Text>
          {memberSummaries.map((memberSummary) => (
            <MemberCard
              key={memberSummary.member.id}
              memberSummary={memberSummary}
              onPress={() => router.push(`/member/${memberSummary.member.id}`)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Next Month Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.nextMonthButton, isProcessingMonth && styles.disabledButton]}
          onPress={handleNextMonth}
          disabled={isProcessingMonth}
        >
          {isProcessingMonth ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextMonthText}>Next Month →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContainer: {
    flex: 1,
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
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  setupContainer: {
    padding: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 30,
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
  setupButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#1E3A5F',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  monthInfo: {
    fontSize: 16,
    color: '#B8D4F0',
    textAlign: 'center',
    marginTop: 4,
  },
  poolInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  poolCard: {
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
  poolLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  poolAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
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
  membersSection: {
    flex: 1,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  nextMonthButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  nextMonthText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});