import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import {
  Folder,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  Phone,
  X,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import { CallNote, NoteFolder, GroupByOption, CallGroup } from '@/types/contact';
import { COLORS } from '@/constants/colors';

interface CallGroupManagerProps {
  notes: CallNote[];
  onNoteSelect?: (note: CallNote) => void;
  groupBy: GroupByOption;
  onGroupByChange: (option: GroupByOption) => void;
}

export default function CallGroupManager({
  notes,
  onNoteSelect,
  groupBy,
  onGroupByChange,
}: CallGroupManagerProps) {
  const { folders, addFolder, updateFolder, deleteFolder, updateNote } = useContacts();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderType, setFolderType] = useState<'general' | 'sales-run'>('general');
  const [selectedColor, setSelectedColor] = useState(COLORS?.primary || '#007AFF');
  const [draggedNote, setDraggedNote] = useState<CallNote | null>(null);
  const dragAnimation = useRef(new Animated.ValueXY()).current;

  const salesRunFolders = useMemo(() => folders.filter(f => f.type === 'sales-run'), [folders]);

  const groupedNotes = useMemo(() => {
    const groups: CallGroup[] = [];

    if (groupBy === 'none') {
      return [
        {
          id: 'all',
          title: 'All Calls',
          notes: notes,
          type: 'time-based' as const,
        },
      ];
    }

    if (groupBy === 'folder') {
      const ungrouped: CallNote[] = [];

      folders.forEach(folder => {
        const folderNotes = notes.filter(n => n.folderId === folder.id);
        if (folderNotes.length > 0) {
          groups.push({
            id: folder.id,
            title: folder.name,
            notes: folderNotes,
            type: 'folder-based',
            folderId: folder.id,
          });
        }
      });

      notes.forEach(note => {
        if (!note.folderId) {
          ungrouped.push(note);
        }
      });

      if (ungrouped.length > 0) {
        groups.push({
          id: 'ungrouped',
          title: 'Ungrouped',
          notes: ungrouped,
          type: 'folder-based',
        });
      }

      return groups;
    }

    // For time-based grouping, first group by time period, then by contact within each period
    const notesByTimePeriod = new Map<string, CallNote[]>();

    notes.forEach(note => {
      const date = new Date(note.callStartTime);
      let key: string;
      let title: string;

      switch (groupBy) {
        case 'day':
          key = date.toDateString();
          title = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          key = `${weekStart.toDateString()}-${weekEnd.toDateString()}`;
          title = `Week of ${weekStart.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })} - ${weekEnd.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`;
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          title = date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
          break;
        case 'year':
          key = date.getFullYear().toString();
          title = date.getFullYear().toString();
          break;
        default:
          key = date.toDateString();
          title = date.toDateString();
      }

      if (!notesByTimePeriod.has(key)) {
        notesByTimePeriod.set(key, []);
      }
      notesByTimePeriod.get(key)!.push(note);
    });

    // Now create groups with contact-based subgrouping for time periods
    notesByTimePeriod.forEach((notesInPeriod, key) => {
      // Group notes by contact within this time period
      const notesByContact = new Map<string, CallNote[]>();

      notesInPeriod.forEach(note => {
        const contactKey = note.contactName;
        if (!notesByContact.has(contactKey)) {
          notesByContact.set(contactKey, []);
        }
        notesByContact.get(contactKey)!.push(note);
      });

      // Create subgroups for each contact
      const contactGroups: CallGroup[] = [];
      notesByContact.forEach((contactNotes, contactName) => {
        contactGroups.push({
          id: `${key}-${contactName}`,
          title: contactName,
          notes: contactNotes.sort(
            (a, b) => new Date(b.callStartTime).getTime() - new Date(a.callStartTime).getTime()
          ),
          type: 'contact-based',
          contactName,
        });
      });

      // Sort contact groups by most recent call
      contactGroups.sort((a, b) => {
        const aLatest = Math.max(...a.notes.map(n => new Date(n.callStartTime).getTime()));
        const bLatest = Math.max(...b.notes.map(n => new Date(n.callStartTime).getTime()));
        return bLatest - aLatest;
      });

      const [title] = key.split('|');
      groups.push({
        id: key,
        title: title || key,
        notes: notesInPeriod.sort(
          (a, b) => new Date(b.callStartTime).getTime() - new Date(a.callStartTime).getTime()
        ),
        type: 'time-based',
        date: notesInPeriod[0].callStartTime,
        subGroups: contactGroups,
      });
    });

    return groups.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
  }, [notes, groupBy, folders]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderType('sales-run');
    setSelectedColor(COLORS?.primary || '#007AFF');
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder: NoteFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setFolderType(folder.type || 'general');
    setSelectedColor(folder.color);
    setShowFolderModal(true);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    if (editingFolder) {
      updateFolder({
        id: editingFolder.id,
        updates: {
          name: folderName,
          description: folderDescription,
          type: folderType,
          color: selectedColor,
        },
      });
    } else {
      addFolder({
        name: folderName,
        description: folderDescription,
        type: folderType,
        color: selectedColor,
      });
    }

    setShowFolderModal(false);
  };

  const handleDeleteFolder = (folder: NoteFolder) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? Notes will be ungrouped.`,
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

  const createPanResponder = (note: CallNote) => {
    if (Platform.OS === 'web') return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setDraggedNote(note);
      },

      onPanResponderMove: Animated.event([null, { dx: dragAnimation.x, dy: dragAnimation.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gestureState) => {
        // Check if dropped on a folder
        // This is simplified - in production you'd calculate actual drop zones
        const dropFolder = salesRunFolders.find(() => {
          // Simplified drop detection
          return Math.abs(gestureState.moveY) < 100;
        });

        if (dropFolder) {
          updateNote({
            id: note.id,
            updates: { folderId: dropFolder.id },
          });
        }

        Animated.spring(dragAnimation, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();

        setDraggedNote(null);
      },
    });
  };

  const renderNote = (note: CallNote) => {
    const panResponder = createPanResponder(note);
    const isBeingDragged = draggedNote?.id === note.id;

    const noteContent = (
      <TouchableOpacity
        style={[styles.noteItem, isBeingDragged && styles.draggingNote]}
        onPress={() => onNoteSelect?.(note)}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          <Text style={styles.noteName}>{note.contactName}</Text>
          <Text style={styles.noteTime}>
            {new Date(note.callStartTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.noteDetails}>
          <View style={styles.noteDetailItem}>
            <Phone size={12} color="#8E8E93" />
            <Text style={styles.noteDetailText}>
              {note.callDirection === 'inbound' ? 'Incoming' : 'Outgoing'}
            </Text>
          </View>
          <View style={styles.noteDetailItem}>
            <Clock size={12} color="#8E8E93" />
            <Text style={styles.noteDetailText}>
              {Math.floor(note.callDuration / 60)}:
              {(note.callDuration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        </View>
        {note.note && !note.isAutoGenerated && (
          <Text style={styles.notePreview} numberOfLines={2}>
            {note.note}
          </Text>
        )}
      </TouchableOpacity>
    );

    if (Platform.OS === 'web' || !panResponder) {
      return noteContent;
    }

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          isBeingDragged && {
            transform: [{ translateX: dragAnimation.x }, { translateY: dragAnimation.y }],
          },
        ]}
      >
        {noteContent}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.groupByContainer}>
          <Text style={styles.groupByLabel}>Group by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['none', 'day', 'week', 'month', 'year', 'folder'] as GroupByOption[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.groupByOption, groupBy === option && styles.groupByOptionActive]}
                onPress={() => onGroupByChange(option)}
              >
                <Text
                  style={[
                    styles.groupByOptionText,
                    groupBy === option && styles.groupByOptionTextActive,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {groupBy === 'folder' && (
          <TouchableOpacity style={styles.addFolderButton} onPress={handleCreateFolder}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addFolderText}>Sales Run</Text>
          </TouchableOpacity>
        )}
      </View>

      {groupBy === 'folder' && salesRunFolders.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.salesRunContainer}
        >
          {salesRunFolders.map(folder => (
            <View key={folder.id} style={[styles.salesRunFolder, { borderColor: folder.color }]}>
              <View style={styles.salesRunHeader}>
                <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
                  <Folder size={14} color="#fff" />
                </View>
                <Text style={styles.salesRunName}>{folder.name}</Text>
                <TouchableOpacity onPress={() => handleEditFolder(folder)}>
                  <Edit2 size={14} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              {folder.description && (
                <Text style={styles.salesRunDescription}>{folder.description}</Text>
              )}
              <Text style={styles.salesRunCount}>
                {notes.filter(n => n.folderId === folder.id).length} calls
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
        {groupedNotes.map(group => {
          const isExpanded = expandedGroups.has(group.id);

          return (
            <View key={group.id} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleGroup(group.id)}
                activeOpacity={0.7}
              >
                <View style={styles.groupHeaderLeft}>
                  {isExpanded ? (
                    <ChevronDown size={20} color="#000" />
                  ) : (
                    <ChevronRight size={20} color="#000" />
                  )}
                  {group.type === 'folder-based' && group.folderId && (
                    <View
                      style={[
                        styles.folderIndicator,
                        {
                          backgroundColor:
                            folders.find(f => f.id === group.folderId)?.color ||
                            COLORS?.primary ||
                            '#007AFF',
                        },
                      ]}
                    />
                  )}
                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>
                <Text style={styles.groupCount}>{group.notes.length}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.groupContent}>
                  {group.type === 'time-based' && group.subGroups
                    ? // Render contact-based subgroups for time periods
                      group.subGroups.map(subGroup => {
                        const subGroupExpanded = expandedGroups.has(subGroup.id);
                        return (
                          <View key={subGroup.id} style={styles.subGroup}>
                            <TouchableOpacity
                              style={styles.subGroupHeader}
                              onPress={() => toggleGroup(subGroup.id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.subGroupHeaderLeft}>
                                {subGroupExpanded ? (
                                  <ChevronDown size={16} color="#666" />
                                ) : (
                                  <ChevronRight size={16} color="#666" />
                                )}
                                <Text style={styles.subGroupTitle}>{subGroup.title}</Text>
                              </View>
                              <Text style={styles.subGroupCount}>{subGroup.notes.length}</Text>
                            </TouchableOpacity>

                            {subGroupExpanded && (
                              <View style={styles.subGroupContent}>
                                {subGroup.notes.map(note => (
                                  <View key={note.id}>{renderNote(note)}</View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })
                    : // Render notes directly for folder-based or simple grouping
                      group.notes.map(note => <View key={note.id}>{renderNote(note)}</View>)}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showFolderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFolder ? 'Edit Folder' : 'Create Sales Run Folder'}
              </Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Folder Name"
              value={folderName}
              onChangeText={setFolderName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={folderDescription}
              onChangeText={setFolderDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.colorLabel}>Choose Color:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorPicker}
            >
              {Object.values(COLORS || {}).map((color: string) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              {editingFolder && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => {
                    handleDeleteFolder(editingFolder);
                    setShowFolderModal(false);
                  }}
                >
                  <Trash2 size={16} color="#fff" />
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveFolder}
              >
                <Text style={styles.modalButtonText}>{editingFolder ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  groupByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupByLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  groupByOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  groupByOptionActive: {
    backgroundColor: COLORS?.primary || '#007AFF',
    borderColor: COLORS?.primary || '#007AFF',
  },
  groupByOptionText: {
    fontSize: 14,
    color: '#000',
  },
  groupByOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS?.success || '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addFolderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  salesRunContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    maxHeight: 120,
  },
  salesRunFolder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 2,
  },
  salesRunHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  folderIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salesRunName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  salesRunDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  salesRunCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontWeight: '500',
  },
  groupsList: {
    flex: 1,
  },
  group: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  groupCount: {
    fontSize: 14,
    color: '#8E8E93',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noteItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  draggingNote: {
    opacity: 0.8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  noteTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  noteDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  noteDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteDetailText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  notePreview: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveButton: {
    backgroundColor: COLORS?.primary || '#007AFF',
  },
  deleteButton: {
    backgroundColor: COLORS?.danger || '#FF3B30',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subGroup: {
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  subGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
  },
  subGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subGroupCount: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  subGroupContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
