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
import { useApp } from '../../src/context/AppContext';

export default function GroupSettings() {
  const { group, setupGroup, isLoading } = useApp();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    monthly_contribution: '',
    interest_rate: '',
    fine_amount: '',
  });

  React.useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        monthly_contribution: group.monthly_contribution.toString(),
        interest_rate: group.interest_rate.toString(),
        fine_amount: group.fine_amount.toString(),
      });
    }
  }, [group]);

  const handleSave = async () => {
    if (!formData.name || !formData.monthly_contribution || !formData.interest_rate || !formData.fine_amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      await setupGroup({
        name: formData.name,
        monthly_contribution: parseFloat(formData.monthly_contribution),
        interest_rate: parseFloat(formData.interest_rate),
        fine_amount: parseFloat(formData.fine_amount),
      });
      setIsEditing(false);
      Alert.alert('Success', 'Group settings updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update group settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (group) {
      setFormData({
        name: group.name,
        monthly_contribution: group.monthly_contribution.toString(),
        interest_rate: group.interest_rate.toString(),
        fine_amount: group.fine_amount.toString(),
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        <View style={styles.header}>
          <Text style={styles.title}>Group Settings</Text>
          <Text style={styles.subtitle}>Current Month: {group.current_month}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.readOnlyInput]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={isEditing}
              placeholder="Enter group name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Contribution (₹)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.readOnlyInput]}
              value={formData.monthly_contribution}
              onChangeText={(text) => setFormData({ ...formData, monthly_contribution: text })}
              editable={isEditing}
              placeholder="Enter monthly contribution"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (% per month)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.readOnlyInput]}
              value={formData.interest_rate}
              onChangeText={(text) => setFormData({ ...formData, interest_rate: text })}
              editable={isEditing}
              placeholder="Enter interest rate"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fine Amount (₹)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.readOnlyInput]}
              value={formData.fine_amount}
              onChangeText={(text) => setFormData({ ...formData, fine_amount: text })}
              editable={isEditing}
              placeholder="Enter fine amount"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.actions}>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Settings</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.disabledButton]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Important Notes</Text>
          <Text style={styles.infoText}>
            • Changing settings will apply from the next month onwards{'\n'}
            • Interest rate is calculated monthly on remaining principal{'\n'}
            • Fine is added every month for missed contributions{'\n'}
            • Unpaid interest converts to principal after 6 months
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
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
  readOnlyInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  actions: {
    marginBottom: 30,
  },
  editButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
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