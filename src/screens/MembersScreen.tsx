import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getGroup, getMembers, saveMembers } from '../storage';
import { generateId } from '../utils/finance';
import { Member, Group } from '../types';

export default function MembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const [g, m] = await Promise.all([getGroup(), getMembers()]);
    setGroup(g);
    setMembers(m);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addMember = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Member name is required');
      return;
    }
    const member: Member = {
      id: generateId(),
      groupId: group?.id || '',
      name: newName.trim(),
    };
    const updated = [...members, member];
    await saveMembers(updated);
    setMembers(updated);
    setNewName('');
    setModalVisible(false);
  };

  const removeMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = members.filter((m) => m.id !== memberId);
            await saveMembers(updated);
            setMembers(updated);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{members.length} Members</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Member</Text>
        </TouchableOpacity>
      </View>

      {members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No members yet</Text>
          <Text style={styles.emptySubText}>Add members to get started</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberSub}>Member #{index + 1}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeMember(item.id, item.name)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Member name"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalVisible(false);
                  setNewName('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={addMember}
              >
                <Text style={styles.confirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  count: { fontSize: 16, fontWeight: '600', color: '#374151' },
  addBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 16 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  memberSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  removeBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  confirmBtn: { backgroundColor: '#2563EB' },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
