import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Plus, Edit3, Trash2, Folder } from 'lucide-react-native';
import { NoteFolder } from '@/types/contact';
import { useContacts } from '@/hooks/contacts-store';

interface FolderManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const FOLDER_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#5856D6',
  '#FF3B30',
  '#00C7BE',
  '#AF52DE',
  '#FF2D92',
  '#A2845E',
  '#8E8E93',
];

export default function FolderManagementModal({ visible, onClose }: FolderManagementModalProps) {
  const { folders, addFolder, updateFolder, deleteFolder } = useContacts();
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [folderDescription, setFolderDescription] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0]);

  const resetForm = () => {
    setFolderName('');
    setFolderDescription('');
    setSelectedColor(FOLDER_COLORS[0]);
    setEditingFolder(null);
    setShowAddForm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddFolder = () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    addFolder({
      name: folderName.trim(),
      description: folderDescription.trim() || undefined,
      color: selectedColor,
    });

    resetForm();
  };

  const handleEditFolder = (folder: NoteFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setSelectedColor(folder.color);
    setShowAddForm(true);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !folderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    updateFolder({
      id: editingFolder.id,
      updates: {
        name: folderName.trim(),
        description: folderDescription.trim() || undefined,
        color: selectedColor,
      },
    });

    resetForm();
  };

  const handleDeleteFolder = (folder: NoteFolder) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? Notes in this folder will be moved to "No Folder".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteFolder(folder.id),
        },
      ]
    );
  };

  const ColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.colorPickerLabel}>Color</Text>
      <View style={styles.colorOptions}>
        {FOLDER_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Folders</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add/Edit Form */}
          {showAddForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {editingFolder ? 'Edit Folder' : 'Add New Folder'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={folderName}
                  onChangeText={setFolderName}
                  placeholder="Enter folder name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={folderDescription}
                  onChangeText={setFolderDescription}
                  placeholder="Enter folder description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              <ColorPicker />

              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={editingFolder ? handleUpdateFolder : handleAddFolder}
                >
                  <Text style={styles.saveButtonText}>{editingFolder ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add Folder Button */}
          {!showAddForm && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
              <Plus size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add New Folder</Text>
            </TouchableOpacity>
          )}

          {/* Folders List */}
          <View style={styles.foldersList}>
            <Text style={styles.sectionTitle}>Folders ({folders.length})</Text>
            {folders.map(folder => (
              <View key={folder.id} style={styles.folderItem}>
                <View style={styles.folderInfo}>
                  <View style={styles.folderIcon}>
                    <Folder size={20} color={folder.color} fill={folder.color + '20'} />
                  </View>
                  <View style={styles.folderDetails}>
                    <Text style={styles.folderName}>{folder.name}</Text>
                    {folder.description && (
                      <Text style={styles.folderDescription}>{folder.description}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.folderActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditFolder(folder)}
                  >
                    <Edit3 size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteFolder(folder)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {folders.length === 0 && (
              <View style={styles.emptyState}>
                <Folder size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>No Folders Yet</Text>
                <Text style={styles.emptyText}>Create folders to organize your call notes</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    marginBottom: 16,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  foldersList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  folderDescription: {
    fontSize: 14,
    color: '#666',
  },
  folderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
