import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  X,
  Clock,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Tag,
  Circle,
  Edit3,
  Folder,
} from 'lucide-react-native';
import { CallNote } from '@/types/contact';
import { useContacts } from '@/hooks/contacts-store';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 0.6; // Business card aspect ratio

interface NoteViewModalProps {
  visible: boolean;
  note: CallNote | null;
  onClose: () => void;
  onEdit: () => void;
}

export default function NoteViewModal({ visible, note, onClose, onEdit }: NoteViewModalProps) {
  const { folders } = useContacts();
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // Scale up slightly when touched
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        // Update position
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Add rotation based on horizontal movement
        const rotationValue = (gestureState.dx / screenWidth) * 15; // Max 15 degrees
        rotation.setValue(rotationValue);
      },

      onPanResponderRelease: (evt, gestureState) => {
        // Calculate velocity for physics
        const velocity = {
          x: gestureState.vx,
          y: gestureState.vy,
        };

        // Snap back to center with spring physics
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            velocity,
            tension: 40,
            friction: 8,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
          }),
          Animated.spring(rotation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }),
        ]).start();
      },
    })
  ).current;

  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffInHours = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      // 7 days
      return noteDate.toLocaleDateString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return noteDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatCallDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatCallTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'follow-up':
        return '#FF9500';
      case 'waiting-reply':
        return '#007AFF';
      case 'closed':
        return '#34C759';
      case 'other':
        return '#5856D6';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string, customStatus?: string) => {
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

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return '#34C759';
      case 'medium':
        return '#FF9500';
      case 'high':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getFolder = () => {
    if (!note?.folderId) return null;
    return folders.find(f => f.id === note.folderId);
  };

  if (!visible || !note) return null;

  const folder = getFolder();

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Call Note</Text>

          <TouchableOpacity onPress={onEdit} style={styles.headerButton}>
            <Edit3 size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Interactive Business Card */}
          <View style={styles.cardContainer}>
            <Animated.View
              style={[
                styles.businessCard,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: scale },
                    {
                      rotate: rotation.interpolate({
                        inputRange: [-15, 15],
                        outputRange: ['-15deg', '15deg'],
                      }),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>
                      {note.contactName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{note.contactName}</Text>
                    <Text style={styles.cardTitle}>Contact</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                  <View style={styles.cardDetailRow}>
                    <Phone size={14} color="#666" />
                    <Text style={styles.cardDetailText}>+1 (555) 123-4567</Text>
                  </View>
                  <View style={styles.cardDetailRow}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.cardDetailText}>
                      Last call: {formatCallTime(note.callStartTime)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>
                    {new Date(note.callStartTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Text style={styles.dragHint}>Drag the card to interact</Text>
          </View>

          {/* Call Details */}
          <View style={styles.callDetailsCard}>
            <View style={styles.callDetailRow}>
              <View style={styles.callDetailItem}>
                {note.callDirection === 'inbound' ? (
                  <PhoneIncoming size={16} color="#34c759" />
                ) : (
                  <PhoneOutgoing size={16} color="#007AFF" />
                )}
                <Text style={styles.callDetailText}>
                  {note.callDirection === 'inbound' ? 'Incoming' : 'Outgoing'}
                </Text>
              </View>

              <View style={styles.callDetailItem}>
                <Clock size={16} color="#666" />
                <Text style={styles.callDetailText}>{formatCallTime(note.callStartTime)}</Text>
              </View>

              <View style={styles.callDetailItem}>
                <Phone size={16} color="#666" />
                <Text style={styles.callDetailText}>{formatCallDuration(note.callDuration)}</Text>
              </View>
            </View>
          </View>

          {/* Status and Priority */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(note.status) + '20' },
                  ]}
                >
                  <Tag size={12} color={getStatusColor(note.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(note.status) }]}>
                    {getStatusText(note.status, note.customStatus)}
                  </Text>
                </View>
              </View>

              {note.priority && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Priority</Text>
                  <View style={styles.priorityBadge}>
                    <Circle
                      size={8}
                      color={getPriorityColor(note.priority)}
                      fill={getPriorityColor(note.priority)}
                    />
                    <Text style={styles.priorityText}>
                      {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {(note.category || folder) && (
              <View style={styles.metaRow}>
                {note.category && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{note.category}</Text>
                    </View>
                  </View>
                )}

                {folder && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Folder</Text>
                    <View style={styles.folderBadge}>
                      <Folder size={12} color={folder.color} />
                      <Text style={styles.folderText}>{folder.name}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagsCard}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {note.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Note Content */}
          <View style={styles.noteCard}>
            <Text style={styles.sectionTitle}>Note</Text>
            <Text style={[styles.noteContent, note.isAutoGenerated && styles.autoNoteContent]}>
              {note.note || 'No note content'}
            </Text>
            {note.isAutoGenerated && (
              <View style={styles.autoIndicator}>
                <Text style={styles.autoText}>Auto-generated</Text>
              </View>
            )}
          </View>

          {/* Timestamps */}
          <View style={styles.timestampsCard}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Created:</Text>
              <Text style={styles.timestampValue}>{formatDate(note.createdAt)}</Text>
            </View>
            {note.updatedAt && (
              <View style={styles.timestampRow}>
                <Text style={styles.timestampLabel}>Updated:</Text>
                <Text style={styles.timestampValue}>{formatDate(note.updatedAt)}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  cardContainer: {
    height: CARD_HEIGHT + 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  businessCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#666',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardDate: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  dragHint: {
    marginTop: 16,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  callDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  callDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callDetailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    marginRight: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  folderText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tagsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  autoNoteContent: {
    fontStyle: 'italic',
    color: '#666',
  },
  autoIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  autoText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  timestampsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timestampValue: {
    fontSize: 14,
    color: '#333',
  },
});
