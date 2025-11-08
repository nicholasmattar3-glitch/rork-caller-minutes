import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  MapPin,
  Users,
  Clock,
  Calendar,
  Plus,
  X,
  CheckCircle,
  Play,
  Route,
} from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import { Contact } from '@/types/contact';

interface RunPlan {
  id: string;
  name: string;
  contacts: Contact[];
  estimatedDuration: number; // in minutes
  route?: string;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'completed';
  createdAt: Date;
}

interface DraggedContact {
  contact: Contact;
  position: Animated.ValueXY;
  scale: Animated.Value;
  isDragging: boolean;
}

const screenHeight = Dimensions.get('window').height;

export default function PlanRunScreen() {
  const { contacts, notes } = useContacts();
  const [runPlans, setRunPlans] = useState<RunPlan[]>([]);
  const [draggedContact, setDraggedContact] = useState<DraggedContact | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<RunPlan | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState<boolean>(false);
  const [newPlanName, setNewPlanName] = useState<string>('');

  // Get contacts that have call notes (potential leads)
  const contactsWithNotes = contacts.filter(contact =>
    notes.some(note => note.contactId === contact.id)
  );

  const createNewPlan = () => {
    if (!newPlanName.trim()) {
      return;
    }

    const newPlan: RunPlan = {
      id: Date.now().toString(),
      name: newPlanName.trim(),
      contacts: [],
      estimatedDuration: 0,
      status: 'draft',
      createdAt: new Date(),
    };

    setRunPlans(prev => [...prev, newPlan]);
    setSelectedPlan(newPlan);
    setNewPlanName('');
    setShowCreatePlan(false);
  };

  const addContactToPlan = (contact: Contact, planId: string) => {
    setRunPlans(prev =>
      prev.map(plan => {
        if (plan.id === planId) {
          const isAlreadyAdded = plan.contacts.some(c => c.id === contact.id);
          if (!isAlreadyAdded) {
            const updatedContacts = [...plan.contacts, contact];
            return {
              ...plan,
              contacts: updatedContacts,
              estimatedDuration: updatedContacts.length * 15, // 15 minutes per contact
            };
          }
        }
        return plan;
      })
    );
  };

  const removeContactFromPlan = (contactId: string, planId: string) => {
    setRunPlans(prev =>
      prev.map(plan => {
        if (plan.id === planId) {
          const updatedContacts = plan.contacts.filter(c => c.id !== contactId);
          return {
            ...plan,
            contacts: updatedContacts,
            estimatedDuration: updatedContacts.length * 15,
          };
        }
        return plan;
      })
    );
  };

  const deletePlan = (planId: string) => {
    setRunPlans(prev => prev.filter(plan => plan.id !== planId));
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
    }
  };

  const createPanResponder = (contact: Contact) => {
    const position = new Animated.ValueXY();
    const scale = new Animated.Value(1);

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setDraggedContact({
          contact,
          position,
          scale,
          isDragging: true,
        });

        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: false,
        }).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Check if over drop zone (bottom half of screen)
        const dropZoneY = screenHeight * 0.5;
        const currentY = evt.nativeEvent.pageY;
        setDropZoneActive(currentY > dropZoneY);
      },

      onPanResponderRelease: evt => {
        const dropZoneY = screenHeight * 0.5;
        const currentY = evt.nativeEvent.pageY;

        if (currentY > dropZoneY && selectedPlan) {
          // Dropped in the drop zone
          addContactToPlan(contact, selectedPlan.id);

          // Success animation
          Animated.sequence([
            Animated.spring(scale, {
              toValue: 1.3,
              useNativeDriver: false,
            }),
            Animated.spring(scale, {
              toValue: 0,
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // Return to original position
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: false,
            }),
          ]).start();
        }

        setDropZoneActive(false);
        setTimeout(() => setDraggedContact(null), 300);
      },
    });
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const panResponder = createPanResponder(item);
    const notesCount = notes.filter(note => note.contactId === item.id).length;

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.contactCard,
          draggedContact?.contact.id === item.id && {
            transform: [
              { translateX: draggedContact.position.x },
              { translateY: draggedContact.position.y },
              { scale: draggedContact.scale },
            ],
            zIndex: 1000,
          },
        ]}
      >
        <View style={styles.contactInfo}>
          <View style={styles.contactAvatar}>
            <Users size={16} color="#666" />
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
            <Text style={styles.notesCount}>{notesCount} call notes</Text>
          </View>
        </View>
        <View style={styles.dragHandle}>
          <View style={styles.dragDots} />
          <View style={styles.dragDots} />
          <View style={styles.dragDots} />
        </View>
      </Animated.View>
    );
  };

  const renderPlan = ({ item }: { item: RunPlan }) => {
    const isSelected = selectedPlan?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={() => setSelectedPlan(item)}
      >
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{item.name}</Text>
            <View style={styles.planMeta}>
              <Users size={12} color="#666" />
              <Text style={styles.planMetaText}>{item.contacts.length} contacts</Text>
              <Clock size={12} color="#666" />
              <Text style={styles.planMetaText}>{item.estimatedDuration}min</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.deletePlanButton} onPress={() => deletePlan(item.id)}>
            <X size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {item.contacts.length > 0 && (
          <View style={styles.planContacts}>
            {item.contacts.slice(0, 3).map(contact => (
              <View key={contact.id} style={styles.planContactItem}>
                <Text style={styles.planContactName}>{contact.name}</Text>
              </View>
            ))}
            {item.contacts.length > 3 && (
              <Text style={styles.moreContactsText}>+{item.contacts.length - 3} more</Text>
            )}
          </View>
        )}

        <View style={styles.planActions}>
          <TouchableOpacity style={styles.planActionButton}>
            <MapPin size={14} color="#007AFF" />
            <Text style={styles.planActionText}>Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.planActionButton}>
            <Calendar size={14} color="#007AFF" />
            <Text style={styles.planActionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.startRunButton}>
            <Play size={14} color="#fff" />
            <Text style={styles.startRunText}>Start</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedPlanContacts = () => {
    if (!selectedPlan || selectedPlan.contacts.length === 0) {
      return (
        <View style={styles.emptyPlanState}>
          <Route size={48} color="#ccc" />
          <Text style={styles.emptyPlanTitle}>No contacts in this plan</Text>
          <Text style={styles.emptyPlanText}>
            Drag contacts from above to add them to this run plan
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={selectedPlan.contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.planContactCard}>
            <View style={styles.planContactInfo}>
              <View style={styles.planContactAvatar}>
                <Users size={14} color="#666" />
              </View>
              <View>
                <Text style={styles.planContactName}>{item.name}</Text>
                <Text style={styles.planContactPhone}>{item.phoneNumber}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeContactButton}
              onPress={() => removeContactFromPlan(item.id, selectedPlan.id)}
            >
              <X size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Plan a Run',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowCreatePlan(true)}>
              <Plus size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Contacts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Contacts with Call Notes ({contactsWithNotes.length})
          </Text>
          <Text style={styles.sectionSubtitle}>Drag contacts to add them to your run plan</Text>

          <FlatList
            data={contactsWithNotes}
            keyExtractor={item => item.id}
            renderItem={renderContact}
            showsVerticalScrollIndicator={false}
            style={styles.contactsList}
            contentContainerStyle={styles.contactsListContent}
          />
        </View>

        {/* Run Plans Section */}
        <View
          style={[styles.section, styles.plansSection, dropZoneActive && styles.dropZoneActive]}
        >
          <View style={styles.plansSectionHeader}>
            <Text style={styles.sectionTitle}>Run Plans ({runPlans.length})</Text>
            {selectedPlan && (
              <Text style={styles.selectedPlanIndicator}>Selected: {selectedPlan.name}</Text>
            )}
          </View>

          {runPlans.length === 0 ? (
            <View style={styles.emptyPlansState}>
              <Route size={48} color="#ccc" />
              <Text style={styles.emptyPlansTitle}>No run plans yet</Text>
              <Text style={styles.emptyPlansText}>Create your first run plan to get started</Text>
              <TouchableOpacity
                style={styles.createFirstPlanButton}
                onPress={() => setShowCreatePlan(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.createFirstPlanText}>Create Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              <FlatList
                data={runPlans}
                keyExtractor={item => item.id}
                renderItem={renderPlan}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.plansList}
                contentContainerStyle={styles.plansListContent}
              />

              {selectedPlan && (
                <View style={styles.selectedPlanDetails}>
                  <Text style={styles.selectedPlanTitle}>{selectedPlan.name} - Contacts</Text>
                  {renderSelectedPlanContacts()}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Create Plan Modal */}
      <Modal
        visible={showCreatePlan}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreatePlan(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createPlanModal}>
            <Text style={styles.modalTitle}>Create New Run Plan</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter plan name"
                placeholderTextColor="#999"
                value={newPlanName}
                onChangeText={setNewPlanName}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreatePlan(false);
                  setNewPlanName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateButton} onPress={createNewPlan}>
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drop Zone Indicator */}
      {dropZoneActive && (
        <View style={styles.dropZoneIndicator}>
          <CheckCircle size={32} color="#34C759" />
          <Text style={styles.dropZoneText}>Drop here to add to {selectedPlan?.name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  section: {
    flex: 1,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  plansSection: {
    borderTopWidth: 2,
    borderTopColor: '#e9ecef',
  },
  dropZoneActive: {
    backgroundColor: '#34C75910',
    borderTopColor: '#34C759',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  plansSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  selectedPlanIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  notesCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  dragHandle: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  dragDots: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginVertical: 1,
  },
  plansContainer: {
    flex: 1,
  },
  plansList: {
    maxHeight: 200,
  },
  plansListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlanCard: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF05',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planMetaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  deletePlanButton: {
    padding: 4,
  },
  planContacts: {
    marginBottom: 12,
  },
  planContactItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  planContactName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  moreContactsText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  planActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    gap: 4,
  },
  planActionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  startRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 6,
    gap: 4,
    marginLeft: 'auto',
  },
  startRunText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  selectedPlanDetails: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  selectedPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  planContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  planContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planContactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planContactPhone: {
    fontSize: 12,
    color: '#666',
  },
  removeContactButton: {
    padding: 4,
  },
  emptyPlansState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyPlansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPlansText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createFirstPlanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyPlanState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPlanText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerButton: {
    padding: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  createPlanModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
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
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalCreateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  dropZoneIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropZoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
