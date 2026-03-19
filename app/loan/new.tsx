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
// Note: Using TouchableOpacity for member selection instead of Picker for better compatibility
import { useApp } from '../../src/context/AppContext';

export default function NewLoan() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const { members, group, loans, issueLoan } = useApp();
  
  const [selectedMemberId, setSelectedMemberId] = React.useState(memberId || '');
  const [principal, setPrincipal] = React.useState('');
  const [interestRate, setInterestRate] = React.useState(group?.interest_rate.toString() || '');
  const [isSaving, setIsSaving] = React.useState(false);

  // Filter out members who already have active loans
  const availableMembers = members.filter(member => {
    const hasActiveLoan = loans.some(loan => loan.member_id === member.id && loan.is_active);
    return !hasActiveLoan;
  });

  React.useEffect(() => {
    if (group && !interestRate) {
      setInterestRate(group.interest_rate.toString());
    }
  }, [group]);

  const handleIssueLoan = async () => {
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a member');
      return;
    }

    if (!principal || isNaN(parseFloat(principal)) || parseFloat(principal) <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }

    if (!interestRate || isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    if (!group) {
      Alert.alert('Error', 'No group found');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) {
      Alert.alert('Error', 'Selected member not found');
      return;
    }

    const principalAmount = parseFloat(principal);
    const rate = parseFloat(interestRate);

    Alert.alert(
      'Confirm Loan',
      `Issue loan of ₹${principalAmount} to ${member.name} at ${rate}% monthly interest?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue Loan',
          onPress: async () => {
            setIsSaving(true);
            try {
              await issueLoan({
                member_id: selectedMemberId,
                principal_remaining: principalAmount,
                unpaid_interest: 0,
                unpaid_interest_months: 0,
                interest_rate: rate,
                created_month: group.current_month,
              });
              Alert.alert('Success', 'Loan issued successfully!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to issue loan. Please try again.');
            } finally {
              setIsSaving(false);
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

  if (availableMembers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Issue New Loan</Text>
          <View style={styles.noMembersCard}>
            <Text style={styles.noMembersTitle}>No Members Available</Text>
            <Text style={styles.noMembersText}>
              All members already have active loans. A member can only have one active loan at a time.
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Issue New Loan</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Member</Text>
            <ScrollView style={styles.memberList} nestedScrollEnabled>
              {availableMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberOption,
                    selectedMemberId === member.id && styles.selectedMember
                  ]}
                  onPress={() => setSelectedMemberId(member.id)}
                >
                  <Text style={[
                    styles.memberName,
                    selectedMemberId === member.id && styles.selectedMemberName
                  ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={principal}
              onChangeText={setPrincipal}
              placeholder="Enter loan amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (% per month)</Text>
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder="Enter interest rate"
              keyboardType="numeric"
            />
            <Text style={styles.helper}>Default: {group.interest_rate}%</Text>
          </View>

          <TouchableOpacity
            style={[styles.issueButton, isSaving && styles.disabledButton]}
            onPress={handleIssueLoan}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.issueButtonText}>Issue Loan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Loan Terms</Text>
          <Text style={styles.infoText}>
            • No fixed tenure - member can repay anytime{'\n'}
            • Interest calculated monthly on remaining principal{'\n'}
            • Payment priority: Fine → Interest → Principal → Contribution{'\n'}
            • Unpaid interest converts to principal after 6 consecutive months
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  memberList: {
    maxHeight: 150,
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
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  selectedMemberName: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  helper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  issueButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  issueButtonText: {
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
  noMembersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noMembersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 12,
  },
  noMembersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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