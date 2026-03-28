import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  Save,
  Tag,
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  Folder,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { CallNote, NoteStatus } from '@/types/contact';
import { useContacts } from '@/hooks/contacts-store';

interface EditNoteModalProps {
  visible: boolean;
  note: CallNote | null;
  onClose: () => void;
  onSave: (updatedNote: Partial<CallNote>) => void;
  onDelete?: (noteId: string) => void;
}

const PRIORITY_COLORS = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface TemplateField {
  id: string;
  label: string;
  value: string;
}

export default function EditNoteModal({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
}: EditNoteModalProps) {
  const { folders, noteTemplate, presetTags } = useContacts();
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<NoteStatus>('follow-up');
  const [customStatus, setCustomStatus] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const parseNoteIntoFields = (noteContent: string, template: string): TemplateField[] => {
    const fields: TemplateField[] = [];

    // Get template sections (excluding the header line)
    const templateLines = template.split('\n').filter(line => line.trim());
    const templateSections = templateLines.filter(line => line.endsWith(':'));

    // Parse the note content
    const noteLines = noteContent.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    // Skip the header line if it exists
    let startIndex = 0;
    if (noteLines[0]?.match(/^Call with .* - /)) {
      startIndex = 1;
    }

    for (let i = startIndex; i < noteLines.length; i++) {
      const line = noteLines[i];

      // Check if this line is a section header
      const isSection = templateSections.some(
        section => line.trim() === section || line.trim() === section.replace(':', '')
      );

      if (isSection) {
        // Save previous section if exists
        if (currentSection) {
          fields.push({
            id: currentSection.toLowerCase().replace(/[^a-z0-9]/g, ''),
            label: currentSection,
            value: currentContent.join('\n').trim(),
          });
        }

        // Start new section
        currentSection = line.trim().replace(':', '');
        currentContent = [];
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      fields.push({
        id: currentSection.toLowerCase().replace(/[^a-z0-9]/g, ''),
        label: currentSection,
        value: currentContent.join('\n').trim(),
      });
    }

    // Add any missing template sections
    templateSections.forEach(section => {
      const sectionLabel = section.replace(':', '');
      const sectionId = sectionLabel.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!fields.find(f => f.id === sectionId)) {
        fields.push({
          id: sectionId,
          label: sectionLabel,
          value: '',
        });
      }
    });

    return fields;
  };

  useEffect(() => {
    if (note && noteTemplate) {
      // Parse note into template fields
      const fields = parseNoteIntoFields(note.note, noteTemplate);
      setTemplateFields(fields);

      // Start with all sections collapsed
      setExpandedSections(new Set());

      setSelectedStatus(note.status);
      setCustomStatus(note.customStatus || '');
      setTags(note.tags || []);
      setPriority(note.priority || 'medium');
      setCategory(note.category || '');
      setSelectedFolderId(note.folderId);
    }
  }, [note, noteTemplate]);

  const handleSave = () => {
    if (!note) return;

    // Reconstruct the note text from template fields
    let noteText = `Call with ${note.contactName} - ${new Date(note.callStartTime).toLocaleDateString()}\n\n`;

    templateFields.forEach(field => {
      if (field.value.trim()) {
        noteText += `${field.label}:\n${field.value}\n\n`;
      }
    });

    const finalCustomStatus = selectedStatus === 'other' ? customStatus.trim() : undefined;
    const updatedNote: Partial<CallNote> = {
      note: noteText.trim(),
      status: selectedStatus,
      customStatus: finalCustomStatus,
      tags: tags.filter(tag => tag.trim()),
      priority,
      category: category.trim() || undefined,
      folderId: selectedFolderId,
      updatedAt: new Date(),
    };

    onSave(updatedNote);
    onClose();
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setTemplateFields(prev =>
      prev.map(field => (field.id === fieldId ? { ...field, value } : field))
    );
  };

  const handleDelete = () => {
    if (!note || !onDelete) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(note.id);
            onClose();
          },
        },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const togglePresetTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleSectionExpanded = (fieldId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const getStatusText = (status: NoteStatus, customStatus?: string) => {
    if (status === 'other' && customStatus) return customStatus;
    switch (status) {
      case 'follow-up':
        return 'Follow-up';
      case 'waiting-reply':
        return 'Waiting Reply';
      case 'closed':
        return 'Closed';
      case 'other':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getSelectedFolder = () => {
    return folders.find(f => f.id === selectedFolderId);
  };

  const getFolderDisplayText = () => {
    const folder = getSelectedFolder();
    return folder ? folder.name : 'No Folder';
  };

  if (!visible || !note) return null;

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Edit Note</Text>

          <View style={styles.headerActions}>
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Save size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.contactName}>{note.contactName}</Text>
          <Text style={styles.contactPhone}>
            {new Date(note.callStartTime).toLocaleDateString()} •{' '}
            {new Date(note.callStartTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          {/* Template Fields */}
          <Text style={styles.sectionTitle}>Call Notes</Text>
          <Text style={styles.sectionDescription}>
            Fill in the sections that apply to your call
          </Text>

          <View style={styles.templateSections}>
            {templateFields.map((field, index) => (
              <View
                key={field.id}
                style={[
                  styles.templateSection,
                  index === templateFields.length - 1 && styles.lastTemplateSection,
                ]}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSectionExpanded(field.id)}
                >
                  <Text style={styles.templateSectionLabel}>{field.label}</Text>
                  {expandedSections.has(field.id) ? (
                    <ChevronUp size={20} color="#666" />
                  ) : (
                    <ChevronDown size={20} color="#666" />
                  )}
                </TouchableOpacity>

                {expandedSections.has(field.id) && (
                  <View style={styles.sectionContent}>
                    <TextInput
                      style={styles.sectionInput}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      placeholderTextColor="#999"
                      multiline
                      textAlignVertical="top"
                      value={field.value}
                      onChangeText={text => updateFieldValue(field.id, text)}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Status Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Status</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Tag size={16} color="#007AFF" />
              <Text style={styles.selectorText}>{getStatusText(selectedStatus, customStatus)}</Text>
            </TouchableOpacity>

            {showStatusPicker && (
              <View style={styles.picker}>
                {(['follow-up', 'waiting-reply', 'closed', 'other'] as NoteStatus[]).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedStatus(status);
                      if (status !== 'other') {
                        setShowStatusPicker(false);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        selectedStatus === status && styles.selectedText,
                      ]}
                    >
                      {getStatusText(status)}
                    </Text>
                    {selectedStatus === status && <CheckCircle2 size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}

                {selectedStatus === 'other' && (
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter custom status..."
                    placeholderTextColor="#999"
                    value={customStatus}
                    onChangeText={setCustomStatus}
                    onSubmitEditing={() => setShowStatusPicker(false)}
                  />
                )}
              </View>
            )}
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <Circle
                size={16}
                color={PRIORITY_COLORS[priority]}
                fill={PRIORITY_COLORS[priority]}
              />
              <Text style={styles.selectorText}>{PRIORITY_LABELS[priority]}</Text>
            </TouchableOpacity>

            {showPriorityPicker && (
              <View style={styles.picker}>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={styles.pickerOption}
                    onPress={() => {
                      setPriority(p);
                      setShowPriorityPicker(false);
                    }}
                  >
                    <View style={styles.priorityOption}>
                      <Circle size={16} color={PRIORITY_COLORS[p]} fill={PRIORITY_COLORS[p]} />
                      <Text
                        style={[styles.pickerOptionText, priority === p && styles.selectedText]}
                      >
                        {PRIORITY_LABELS[p]}
                      </Text>
                    </View>
                    {priority === p && <CheckCircle2 size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Folder Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Folder</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowFolderPicker(!showFolderPicker)}
            >
              <Folder
                size={16}
                color={getSelectedFolder()?.color || '#999'}
                fill={getSelectedFolder()?.color ? getSelectedFolder()!.color + '20' : '#f0f0f0'}
              />
              <Text style={styles.selectorText}>{getFolderDisplayText()}</Text>
            </TouchableOpacity>

            {showFolderPicker && (
              <View style={styles.picker}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedFolderId(undefined);
                    setShowFolderPicker(false);
                  }}
                >
                  <View style={styles.folderOption}>
                    <Folder size={16} color="#999" fill="#f0f0f0" />
                    <Text
                      style={[styles.pickerOptionText, !selectedFolderId && styles.selectedText]}
                    >
                      No Folder
                    </Text>
                  </View>
                  {!selectedFolderId && <CheckCircle2 size={16} color="#007AFF" />}
                </TouchableOpacity>

                {folders.map(folder => (
                  <TouchableOpacity
                    key={folder.id}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedFolderId(folder.id);
                      setShowFolderPicker(false);
                    }}
                  >
                    <View style={styles.folderOption}>
                      <Folder size={16} color={folder.color} fill={folder.color + '20'} />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedFolderId === folder.id && styles.selectedText,
                        ]}
                      >
                        {folder.name}
                      </Text>
                    </View>
                    {selectedFolderId === folder.id && <CheckCircle2 size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sales, Support, Follow-up..."
              placeholderTextColor="#999"
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Tags */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowTagPicker(!showTagPicker)}
            >
              <Tag size={16} color="#007AFF" />
              <Text style={styles.selectorText}>
                {tags.length > 0
                  ? `${tags.length} tag${tags.length > 1 ? 's' : ''} selected`
                  : 'Select tags'}
              </Text>
            </TouchableOpacity>

            {showTagPicker && (
              <View style={styles.picker}>
                {presetTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.pickerOption}
                    onPress={() => togglePresetTag(tag)}
                  >
                    <Text
                      style={[styles.pickerOptionText, tags.includes(tag) && styles.selectedText]}
                    >
                      {tag}
                    </Text>
                    {tags.includes(tag) && <CheckCircle2 size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}

                <View style={styles.addTagContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Add custom tag..."
                    placeholderTextColor="#999"
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={() => {
                      addTag();
                      setShowTagPicker(false);
                    }}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                    <Plus size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <X size={14} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 40,
  },
  contactName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    gap: 8,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templateSections: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    overflow: 'hidden',
    marginBottom: 24,
  },
  templateSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastTemplateSection: {
    borderBottomWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  templateSectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
