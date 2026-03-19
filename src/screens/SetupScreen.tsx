import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { saveGroup } from '../storage';
import { Group } from '../types';

interface Props {
  onSetupComplete: () => void;
  navigation?: any;
}

export default function SetupScreen({ onSetupComplete }: Props) {
  const [name, setName] = useState('');
  const [contribution, setContribution] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [fineAmount, setFineAmount] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    const contribNum = parseFloat(contribution);
    const rateNum = parseFloat(interestRate);
    const fineNum = parseFloat(fineAmount);

    if (isNaN(contribNum) || contribNum <= 0) {
      Alert.alert('Error', 'Enter a valid monthly contribution amount');
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      Alert.alert('Error', 'Enter a valid interest rate');
      return;
    }
    if (isNaN(fineNum) || fineNum < 0) {
      Alert.alert('Error', 'Enter a valid fine amount');
      return;
    }

    const group: Group = {
      id: Date.now().toString(),
      name: name.trim(),
      monthlyContribution: contribNum,
      interestRate: rateNum,
      fineAmount: fineNum,
      currentMonth: 1,
    };

    await saveGroup(group);
    onSetupComplete();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Setup Your Committee</Text>
        <Text style={styles.subtitle}>Configure your lending group</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Family Committee 2025"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Monthly Contribution (₹)</Text>
          <TextInput
            style={styles.input}
            value={contribution}
            onChangeText={setContribution}
            placeholder="e.g. 5000"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Monthly Interest Rate (%)</Text>
          <TextInput
            style={styles.input}
            value={interestRate}
            onChangeText={setInterestRate}
            placeholder="e.g. 3"
            keyboardType="decimal-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Monthly Fine Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={fineAmount}
            onChangeText={setFineAmount}
            placeholder="e.g. 200"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
