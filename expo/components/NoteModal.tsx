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
} from 'react-native';
import {
  X,
  Save,
  Clock,
  Phone,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
} from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import { NoteStatus } from '@/types/contact';

interface TemplateSection {
  id: string;
  label: string;
  value: string;
}

export default function NoteModal() {
  const {
    showNoteModal,
    currentCallContact,
    callStartTime,
    callEndTime,
    closeNoteModal,
    saveNote,
    noteTemplate,
    presetTags,
  } = useContacts();
  const [selectedStatus, setSelectedStatus] = useState<NoteStatus>('follow-up');
  const [customStatus, setCustomStatus] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    if (showNoteModal && currentCallContact) {
      // Parse template into sections
      const template =
        noteTemplate ||
        'Purpose of call:\n\nKey points discussed:\n\nAction items:\n\nNext steps:\n\nAdditional notes:';
      const lines = template.split('\n');
      const sections: TemplateSection[] = [];

      let currentSection: TemplateSection | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.endsWith(':')) {
          // This is a section header
          if (currentSection) {
            sections.push(currentSection);
          }
          const label = line.slice(0, -1);
          const id = label.toLowerCase().replace(/\s+/g, '-');
          currentSection = {
            id,
            label,
            value: '',
          };
        }
      }

      // Add the last section
      if (currentSection) {
        sections.push(currentSection);
      }

      // If no sections found, use defaults
      if (sections.length === 0) {
        sections.push(
          { id: 'purpose', label: 'Purpose of call', value: '' },
          { id: 'keypoints', label: 'Key points discussed', value: '' },
          { id: 'action', label: 'Action items', value: '' },
          { id: 'nextsteps', label: 'Next steps', value: '' },
          { id: 'additional', label: 'Additional notes', value: '' }
        );
      }

      setTemplateSections(sections);
      setExpandedSections(new Set()); // Start with all sections collapsed
      setSelectedStatus('follow-up');
      setCustomStatus('');
      setShowStatusPicker(false);
      setSelectedPriority('medium');
      setShowPriorityPicker(false);
      setTags([]);
      setNewTag('');
      setShowTagInput(false);
      setShowTagPicker(false);
    }
  }, [showNoteModal, currentCallContact, noteTemplate]);

  const formatCallDuration = () => {
    if (!callStartTime || !callEndTime) return '0s';
    const duration = Math.floor((callEndTime.getTime() - callStartTime.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatCallTime = () => {
    if (!callStartTime) return '';
    return callStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCallDate = () => {
    if (!callStartTime) return '';
    return callStartTime.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSave = () => {
    // Build the note text from sections with content
    const header = `Call with ${currentCallContact?.name} - ${new Date().toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`;

    let noteText = header + '\n\n';

    // Only include sections that have actual content
    const sectionsWithContent = templateSections.filter(section => section.value.trim());
    sectionsWithContent.forEach(section => {
      noteText += `${section.label}:\n${section.value.trim()}\n\n`;
    });

    if (noteText.trim() !== header.trim()) {
      const finalCustomStatus = selectedStatus === 'other' ? customStatus.trim() : undefined;
      saveNote(noteText.trim(), selectedStatus, finalCustomStatus, selectedPriority, tags);
    } else {
      // No content added, just close
      closeNoteModal();
    }

    setTemplateSections([]);
    setSelectedStatus('follow-up');
    setCustomStatus('');
  };

  const handleClose = () => {
    setTemplateSections([]);
    setSelectedStatus('follow-up');
    setCustomStatus('');
    setShowStatusPicker(false);
    setSelectedPriority('medium');
    setShowPriorityPicker(false);
    setTags([]);
    setNewTag('');
    setShowTagInput(false);
    setShowTagPicker(false);
    closeNoteModal();
  };

  const handleSkip = () => {
    saveNote('', 'closed');
    setTemplateSections([]);
    setSelectedStatus('follow-up');
    setCustomStatus('');
    setSelectedPriority('medium');
    setTags([]);
  };

  const updateSectionValue = (id: string, value: string) => {
    setTemplateSections(prev =>
      prev.map(section => (section.id === id ? { ...section, value } : section))
    );
  };

  const toggleSectionExpanded = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const addPresetTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setShowTagPicker(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#FF9500';
    }
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Medium Priority';
    }
  };

  const hasContent = templateSections.some(s => s.value.trim());

  if (!showNoteModal || !currentCallContact) return null;

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Call Note</Text>

          <TouchableOpacity onPress={handleSave}>
            <Save size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.contactName}>{currentCallContact.name}</Text>
          <Text style={styles.contactPhone}>{currentCallContact.phoneNumber}</Text>

          <View style={styles.callInfo}>
            <View style={styles.callInfoItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.callInfoText}>
                {formatCallTime()} • {formatCallDate()}
              </Text>
            </View>
            <View style={styles.callInfoItem}>
              <Phone size={16} color="#666" />
              <Text style={styles.callInfoText}>Duration: {formatCallDuration()}</Text>
            </View>
          </View>

          {/* Status Selection */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Call Status</Text>
            <TouchableOpacity
              style={styles.statusSelector}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Tag size={16} color="#007AFF" />
              <Text style={styles.statusText}>
                {selectedStatus === 'other' && customStatus
                  ? customStatus
                  : selectedStatus === 'follow-up'
                    ? 'Follow-up'
                    : selectedStatus === 'waiting-reply'
                      ? 'Waiting Reply'
                      : selectedStatus === 'closed'
                        ? 'Closed'
                        : 'Other'}
              </Text>
              <ChevronDown size={16} color="#666" />
            </TouchableOpacity>

            {showStatusPicker && (
              <View style={styles.statusPicker}>
                {(['follow-up', 'waiting-reply', 'closed', 'other'] as NoteStatus[]).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusOption}
                    onPress={() => {
                      setSelectedStatus(status);
                      if (status !== 'other') {
                        setShowStatusPicker(false);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        selectedStatus === status && styles.selectedStatusText,
                      ]}
                    >
                      {status === 'follow-up'
                        ? 'Follow-up'
                        : status === 'waiting-reply'
                          ? 'Waiting Reply'
                          : status === 'closed'
                            ? 'Closed'
                            : 'Other'}
                    </Text>
                    {selectedStatus === status && <Check size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}

                {selectedStatus === 'other' && (
                  <TextInput
                    style={styles.customStatusInput}
                    placeholder="Enter custom status..."
                    placeholderTextColor="#999"
                    value={customStatus}
                    onChangeText={setCustomStatus}
                    onSubmitEditing={() => setShowStatusPicker(false)}
                    autoFocus
                  />
                )}
              </View>
            )}
          </View>

          {/* Priority Selection */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Priority</Text>
            <TouchableOpacity
              style={styles.statusSelector}
              onPress={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <AlertCircle size={16} color={getPriorityColor(selectedPriority)} />
              <Text style={styles.statusText}>{getPriorityLabel(selectedPriority)}</Text>
              <ChevronDown size={16} color="#666" />
            </TouchableOpacity>

            {showPriorityPicker && (
              <View style={styles.statusPicker}>
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={styles.statusOption}
                    onPress={() => {
                      setSelectedPriority(priority);
                      setShowPriorityPicker(false);
                    }}
                  >
                    <View style={styles.priorityOptionContent}>
                      <AlertCircle size={16} color={getPriorityColor(priority)} />
                      <Text
                        style={[
                          styles.statusOptionText,
                          selectedPriority === priority && styles.selectedStatusText,
                        ]}
                      >
                        {getPriorityLabel(priority)}
                      </Text>
                    </View>
                    {selectedPriority === priority && <Check size={16} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Tags Section */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} style={styles.tagRemove}>
                    <X size={14} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}

              {showTagInput ? (
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Enter custom tag..."
                    placeholderTextColor="#999"
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={addTag}
                    onBlur={() => {
                      if (newTag.trim()) {
                        addTag();
                      } else {
                        setShowTagInput(false);
                      }
                    }}
                    autoFocus
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => setShowTagPicker(!showTagPicker)}
                  >
                    <Tag size={16} color="#007AFF" />
                    <Text style={styles.addTagText}>Add Tag</Text>
                    <ChevronDown size={16} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.customTagButton}
                    onPress={() => setShowTagInput(true)}
                  >
                    <Plus size={16} color="#007AFF" />
                    <Text style={styles.addTagText}>Custom</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {showTagPicker && (
              <View style={styles.tagPicker}>
                <Text style={styles.tagPickerTitle}>Select from preset tags:</Text>
                <View style={styles.presetTagsContainer}>
                  {presetTags
                    .filter(tag => !tags.includes(tag))
                    .map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.presetTagOption}
                        onPress={() => addPresetTag(tag)}
                      >
                        <Text style={styles.presetTagText}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  {presetTags.filter(tag => !tags.includes(tag)).length === 0 && (
                    <Text style={styles.noTagsText}>All preset tags are already added</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Call Notes</Text>
          <Text style={styles.sectionDescription}>
            Fill in the sections that apply to your call
          </Text>

          {/* Template Sections */}
          <View style={styles.templateSections}>
            {templateSections.map((section, index) => (
              <View
                key={section.id}
                style={[
                  styles.templateSection,
                  index === templateSections.length - 1 && styles.lastSection,
                ]}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSectionExpanded(section.id)}
                >
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp size={20} color="#666" />
                  ) : (
                    <ChevronDown size={20} color="#666" />
                  )}
                </TouchableOpacity>

                {expandedSections.has(section.id) && (
                  <View style={styles.sectionContent}>
                    <TextInput
                      style={styles.sectionInput}
                      placeholder={`Enter ${section.label.toLowerCase()}...`}
                      placeholderTextColor="#999"
                      multiline
                      textAlignVertical="top"
                      value={section.value}
                      onChangeText={text => updateSectionValue(section.id, text)}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, !hasContent && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasContent && selectedStatus === 'other' && !customStatus.trim()}
          >
            <Text
              style={[
                styles.saveButtonText,
                !hasContent &&
                  selectedStatus === 'other' &&
                  !customStatus.trim() &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              Save Note
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  contactName: {
    fontSize: 26,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  contactPhone: {
    fontSize: 17,
    color: '#666',
    marginBottom: 20,
  },
  callInfo: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  callInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  callInfoText: {
    fontSize: 15,
    color: '#666',
  },
  promptText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    fontSize: 17,
    lineHeight: 24,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 250,
    maxHeight: 400,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    gap: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    gap: 10,
  },
  statusText: {
    fontSize: 17,
    color: '#333',
    flex: 1,
  },
  statusPicker: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  statusOptionText: {
    fontSize: 17,
    color: '#333',
  },
  selectedStatusText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  customStatusInput: {
    padding: 16,
    fontSize: 17,
    color: '#333',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  priorityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    padding: 2,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addTagText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tagInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tagInput: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
    minWidth: 80,
  },
  customTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#34C759',
    borderStyle: 'dashed',
  },
  tagPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  presetTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetTagOption: {
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  presetTagText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noTagsText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
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
  },
  templateSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionLabel: {
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
});
