import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, Clock, Calendar, Bell, CheckCircle, Edit3 } from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import { DetectedDateTime } from '@/types/contact';

export default function ReminderSuggestionModal() {
  const {
    showReminderSuggestionModal,
    detectedDateTimes,
    currentNoteForReminder,
    createReminderFromDetection,
    closeReminderSuggestionModal,
  } = useContacts();

  const [selectedDetections, setSelectedDetections] = useState<Set<number>>(new Set());
  const [customTitles, setCustomTitles] = useState<{ [key: number]: string }>({});
  const [editingTitle, setEditingTitle] = useState<number | null>(null);

  const handleToggleDetection = (index: number) => {
    const newSelected = new Set(selectedDetections);
    if (newSelected.has(index)) {
      newSelected.delete(index);
      const newTitles = { ...customTitles };
      delete newTitles[index];
      setCustomTitles(newTitles);
    } else {
      newSelected.add(index);
    }
    setSelectedDetections(newSelected);
  };

  const handleTitleChange = (index: number, title: string) => {
    setCustomTitles(prev => ({ ...prev, [index]: title }));
  };

  const handleCreateReminders = () => {
    if (selectedDetections.size === 0) {
      Alert.alert(
        'No Reminders Selected',
        'Please select at least one date/time to create reminders.'
      );
      return;
    }

    selectedDetections.forEach(index => {
      const detection = detectedDateTimes[index];
      const customTitle = customTitles[index];
      createReminderFromDetection(detection, customTitle);
    });

    Alert.alert(
      'Reminders Created',
      `Successfully created ${selectedDetections.size} reminder${selectedDetections.size > 1 ? 's' : ''}.`,
      [{ text: 'OK', onPress: closeReminderSuggestionModal }]
    );
  };

  const handleSkip = () => {
    closeReminderSuggestionModal();
  };

  const formatDetectedDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (!showReminderSuggestionModal || !currentNoteForReminder || detectedDateTimes.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeReminderSuggestionModal}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <X size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Reminders</Text>
          <TouchableOpacity onPress={handleCreateReminders}>
            <Text style={styles.createButton}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.noteInfo}>
            <Text style={styles.noteInfoTitle}>
              From call with {currentNoteForReminder.contactName}
            </Text>
            <Text style={styles.noteInfoText} numberOfLines={2}>
              &ldquo;{currentNoteForReminder.note}&rdquo;
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Found {detectedDateTimes.length} time{detectedDateTimes.length > 1 ? 's' : ''} in your
            note:
          </Text>

          <View style={styles.detectionsList}>
            {detectedDateTimes.map((detection, index) => {
              const isSelected = selectedDetections.has(index);
              const isEditing = editingTitle === index;
              const customTitle = customTitles[index];
              const defaultTitle = `Follow up: ${detection.originalText}`;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.detectionCard, isSelected && styles.selectedDetectionCard]}
                  onPress={() => handleToggleDetection(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.detectionHeader}>
                    <View style={styles.detectionInfo}>
                      <View style={styles.detectionTypeContainer}>
                        <Clock size={16} color="#007AFF" />
                        <Text style={styles.detectionType}>Time detected</Text>
                      </View>
                      <Text style={styles.detectionOriginal}>
                        &ldquo;{detection.originalText}&rdquo;
                      </Text>
                    </View>

                    <View style={styles.selectionIndicator}>
                      {isSelected ? (
                        <CheckCircle size={24} color="#007AFF" />
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>
                  </View>

                  <View style={styles.detectionDetails}>
                    <Text style={styles.suggestedDate}>
                      {formatDetectedDate(detection.suggestedDate)}
                    </Text>

                    {isSelected && (
                      <View style={styles.titleSection}>
                        <View style={styles.titleHeader}>
                          <Text style={styles.titleLabel}>Reminder title:</Text>
                          <TouchableOpacity
                            onPress={() => setEditingTitle(isEditing ? null : index)}
                            style={styles.editButton}
                          >
                            <Edit3 size={14} color="#007AFF" />
                          </TouchableOpacity>
                        </View>

                        {isEditing ? (
                          <TextInput
                            style={styles.titleInput}
                            value={customTitle || defaultTitle}
                            onChangeText={text => handleTitleChange(index, text)}
                            onBlur={() => setEditingTitle(null)}
                            autoFocus
                            placeholder="Enter reminder title"
                          />
                        ) : (
                          <Text style={styles.titlePreview}>{customTitle || defaultTitle}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoSection}>
            <Bell size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Select times to create reminders. Times are automatically set for today or tomorrow.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createReminderButton,
              selectedDetections.size === 0 && styles.createReminderButtonDisabled,
            ]}
            onPress={handleCreateReminders}
            disabled={selectedDetections.size === 0}
          >
            <Text
              style={[
                styles.createReminderButtonText,
                selectedDetections.size === 0 && styles.createReminderButtonTextDisabled,
              ]}
            >
              Create {selectedDetections.size > 0 ? selectedDetections.size : ''} Reminder
              {selectedDetections.size !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noteInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  noteInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  noteInfoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  detectionsList: {
    gap: 12,
    marginBottom: 20,
  },
  detectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedDetectionCard: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF' + '08',
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detectionInfo: {
    flex: 1,
  },
  detectionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detectionType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
  },
  detectionOriginal: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  detectionDetails: {
    gap: 12,
  },
  suggestedDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  titleSection: {
    gap: 8,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  editButton: {
    padding: 4,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  titlePreview: {
    fontSize: 14,
    color: '#333',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createReminderButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createReminderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createReminderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createReminderButtonTextDisabled: {
    color: '#999',
  },
});
