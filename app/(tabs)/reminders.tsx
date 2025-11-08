import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Stack } from 'expo-router';
import {
  Bell,
  CheckCircle,
  Circle,
  Calendar,
  User,
  AlertCircle,
  Plus,
  X,
  Trash2,
  Archive,
  Search,
  Clock,
  Filter,
  Phone,
  Package,
  ChevronDown,
} from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import { Reminder } from '@/types/contact';
import GroupedView, { GroupByOption } from '@/components/GroupedView';

export default function RemindersScreen() {
  const { reminders, contacts, orders, addReminder, updateReminder, deleteReminder, updateOrder } =
    useContacts();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');
  const [newReminderDescription, setNewReminderDescription] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completedReminder, setCompletedReminder] = useState<Reminder | null>(null);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('day');
  const [showGroupByModal, setShowGroupByModal] = useState<boolean>(false);
  const [showCallReminders, setShowCallReminders] = useState<boolean>(true);
  const [showOrderReminders, setShowOrderReminders] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'orders'>('all');
  const fadeAnim = new Animated.Value(0);

  // Parse time from description
  const parseTimeFromDescription = (description: string): Date | null => {
    if (!description) return null;

    // Match various time formats
    const timePatterns = [
      /\b(\d{1,2})\s*[:.]\s*(\d{2})\s*(am|pm)?\b/i, // 12:30, 12.30, 12:30pm
      /\b(\d{1,2})\s*(am|pm)\b/i, // 3pm, 10am
      /\bat\s+(\d{1,2})\s*[:.]?\s*(\d{0,2})\s*(am|pm)?\b/i, // at 3, at 3:30pm
    ];

    for (const pattern of timePatterns) {
      const match = description.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3] || match[match.length - 1];

        if (meridiem) {
          const isPM = meridiem.toLowerCase() === 'pm';
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
        }

        const date = new Date(selectedDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }

    return null;
  };

  const handleAddReminder = () => {
    console.log('handleAddReminder called');
    console.log('Title:', newReminderTitle);
    console.log('Selected Contact ID:', selectedContactId);
    console.log('Contacts available:', contacts.length);

    if (!newReminderTitle.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    if (!selectedContactId) {
      Alert.alert('Error', 'Please select a contact');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContactId);
    console.log('Found contact:', contact);

    if (!contact) {
      Alert.alert('Error', 'Selected contact not found');
      return;
    }

    // Check if description contains time and update selectedDate
    const parsedTime = parseTimeFromDescription(newReminderDescription);
    const finalDate = parsedTime || selectedDate;

    console.log('Creating reminder with data:', {
      contactId: contact.id,
      contactName: contact.name,
      title: newReminderTitle.trim(),
      description: newReminderDescription.trim(),
      dueDate: finalDate,
      isCompleted: false,
    });

    try {
      addReminder({
        contactId: contact.id,
        contactName: contact.name,
        title: newReminderTitle.trim(),
        description: newReminderDescription.trim(),
        dueDate: finalDate,
        isCompleted: false,
      });

      console.log('Reminder added successfully');

      // Reset form
      setNewReminderTitle('');
      setNewReminderDescription('');
      setSelectedContactId('');
      setSelectedDate(new Date());
      setContactSearch('');
      setShowAddModal(false);

      Alert.alert('Success', 'Reminder created successfully!');
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    }
  };

  const handleReminderToggle = (reminder: any) => {
    if (!reminder.isCompleted) {
      // When completing a reminder, show the completion modal
      setCompletedReminder(reminder);
      setShowCompletionModal(true);
    } else {
      // When unchecking, just update directly
      if (reminder.isOrder) {
        // Handle order reminder completion
        const order = orders.find(o => o.id === reminder.orderId);
        if (order) {
          updateOrder({
            id: order.id,
            updates: { reminderSent: false },
          });
        }
      } else {
        updateReminder({
          id: reminder.id,
          updates: { isCompleted: false },
        });
      }
    }
  };

  const handleArchiveReminder = () => {
    if (completedReminder) {
      if ((completedReminder as any).isOrder) {
        // Handle order reminder archiving
        const order = orders.find(o => o.id === (completedReminder as any).orderId);
        if (order) {
          updateOrder({
            id: order.id,
            updates: {
              reminderSent: true,
              status: 'delivered',
            },
          });
        }
      } else {
        updateReminder({
          id: completedReminder.id,
          updates: {
            isCompleted: true,
            isArchived: true,
          },
        });
      }
      setShowCompletionModal(false);
      setCompletedReminder(null);
    }
  };

  const handleDeleteCompletedReminder = () => {
    if (completedReminder) {
      if ((completedReminder as any).isOrder) {
        // Handle order reminder deletion
        const order = orders.find(o => o.id === (completedReminder as any).orderId);
        if (order) {
          updateOrder({
            id: order.id,
            updates: {
              reminderDate: undefined,
              reminderSent: false,
            },
          });
        }
      } else {
        deleteReminder(completedReminder.id);
      }
      setShowCompletionModal(false);
      setCompletedReminder(null);
    }
  };

  const handleKeepReminder = () => {
    if (completedReminder) {
      if ((completedReminder as any).isOrder) {
        // Handle order reminder keeping
        const order = orders.find(o => o.id === (completedReminder as any).orderId);
        if (order) {
          updateOrder({
            id: order.id,
            updates: { reminderSent: true },
          });
        }
      } else {
        updateReminder({
          id: completedReminder.id,
          updates: { isCompleted: true },
        });
      }
      setShowCompletionModal(false);
      setCompletedReminder(null);
    }
  };

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const query = contactSearch.toLowerCase();
    return contacts.filter(
      contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber.toLowerCase().includes(query)
    );
  }, [contacts, contactSearch]);

  const ContactPicker = ({
    selectedId,
    onSelect,
  }: {
    selectedId: string;
    onSelect: (id: string) => void;
  }) => {
    const selectedContact = contacts.find(c => c.id === selectedId);

    return (
      <View style={styles.contactPicker}>
        <Text style={styles.inputLabel}>Contact *</Text>
        {contacts.length === 0 ? (
          <View style={styles.noContactsContainer}>
            <Text style={styles.noContactsText}>No contacts available. Add contacts first.</Text>
          </View>
        ) : (
          <>
            <View style={styles.contactSearchContainer}>
              <Search size={16} color="#8E8E93" />
              <TextInput
                style={styles.contactSearchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#8E8E93"
                value={contactSearch}
                onChangeText={setContactSearch}
              />
              {contactSearch.length > 0 && (
                <Pressable onPress={() => setContactSearch('')}>
                  <X size={16} color="#8E8E93" />
                </Pressable>
              )}
            </View>

            {selectedContact && (
              <View style={styles.selectedContactCard}>
                <User size={16} color="#007AFF" />
                <Text style={styles.selectedContactName}>{selectedContact.name}</Text>
                <Pressable onPress={() => onSelect('')}>
                  <X size={16} color="#666" />
                </Pressable>
              </View>
            )}

            <ScrollView style={styles.contactScrollView} showsVerticalScrollIndicator={false}>
              {filteredContacts.map(contact => (
                <Pressable
                  key={contact.id}
                  style={[
                    styles.contactItem,
                    selectedId === contact.id && styles.selectedContactItem,
                  ]}
                  onPress={() => {
                    onSelect(contact.id);
                    setContactSearch('');
                    // Animate selection
                    Animated.sequence([
                      Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                      Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                >
                  <View style={styles.contactItemContent}>
                    <Text
                      style={[
                        styles.contactItemName,
                        selectedId === contact.id && styles.selectedContactItemName,
                      ]}
                    >
                      {contact.name}
                    </Text>
                    <Text style={styles.contactItemPhone}>{contact.phoneNumber}</Text>
                  </View>
                  {selectedId === contact.id && <CheckCircle size={20} color="#007AFF" />}
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    );
  };

  const DatePicker = ({
    date,
    onDateChange,
  }: {
    date: Date;
    onDateChange: (date: Date) => void;
  }) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const quickDates = [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: 'Next Week', date: nextWeek },
    ];

    return (
      <View style={styles.datePicker}>
        <Text style={styles.inputLabel}>Due Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
          {quickDates.map(quickDate => {
            const isSelected = date.toDateString() === quickDate.date.toDateString();
            return (
              <Pressable
                key={quickDate.label}
                style={[styles.dateChip, isSelected && styles.selectedDateChip]}
                onPress={() => onDateChange(quickDate.date)}
              >
                <Text style={[styles.dateChipText, isSelected && styles.selectedDateChipText]}>
                  {quickDate.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.selectedDateText}>Selected: {date.toLocaleDateString()}</Text>
      </View>
    );
  };

  const AddReminderModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowAddModal(false)}>
            <X size={24} color="#666" />
          </Pressable>
          <Text style={styles.modalTitle}>Add Reminder</Text>
          <Pressable onPress={handleAddReminder}>
            <Text style={styles.saveButton}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newReminderTitle}
              onChangeText={setNewReminderTitle}
              placeholder="Enter reminder title"
              multiline={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newReminderDescription}
              onChangeText={text => {
                setNewReminderDescription(text);
                // Auto-detect time in description
                const detectedTime = parseTimeFromDescription(text);
                if (detectedTime) {
                  setSelectedDate(detectedTime);
                }
              }}
              placeholder="Enter description (e.g., 'Call at 3pm' or 'Meeting at 14:30')"
              multiline={true}
              numberOfLines={3}
            />
            {parseTimeFromDescription(newReminderDescription) && (
              <View style={styles.timeDetected}>
                <Clock size={14} color="#007AFF" />
                <Text style={styles.timeDetectedText}>
                  Time detected:{' '}
                  {parseTimeFromDescription(newReminderDescription)?.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>

          <ContactPicker selectedId={selectedContactId} onSelect={setSelectedContactId} />
          <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
        </ScrollView>
      </View>
    </Modal>
  );

  const CompletionModal = () => {
    const isOrderReminder = completedReminder && (completedReminder as any).isOrder;
    const modalTitle = isOrderReminder ? 'Order Reminder Completed!' : 'Call Reminder Completed!';
    const modalIcon = isOrderReminder ? Package : Phone;
    const IconComponent = modalIcon;

    return (
      <Modal
        visible={showCompletionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.completionModalOverlay}>
          <View
            style={[
              styles.completionModalContainer,
              isOrderReminder && styles.orderCompletionModal,
            ]}
          >
            <View style={styles.completionModalHeader}>
              <View
                style={[
                  styles.completionIconWrapper,
                  isOrderReminder && styles.orderCompletionIcon,
                ]}
              >
                <IconComponent size={24} color="#fff" />
              </View>
              <Text style={styles.completionModalTitle}>{modalTitle}</Text>
              <Text style={styles.completionModalSubtitle}>
                What would you like to do with this {isOrderReminder ? 'order' : 'call'} reminder?
              </Text>
            </View>

            <View style={styles.completionModalContent}>
              {completedReminder && (
                <View style={styles.completedReminderInfo}>
                  <Text style={styles.completedReminderTitle}>{completedReminder.title}</Text>
                  <Text style={styles.completedReminderContact}>
                    {completedReminder.contactName}
                  </Text>
                  {isOrderReminder && (completedReminder as any).items && (
                    <Text style={styles.orderItemsCount}>
                      {(completedReminder as any).items.length} items • $
                      {(completedReminder as any).totalAmount?.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.completionActions}>
                <Pressable
                  style={[
                    styles.completionActionButton,
                    isOrderReminder ? styles.deliveredButton : styles.archiveButton,
                  ]}
                  onPress={handleArchiveReminder}
                >
                  {isOrderReminder ? (
                    <Package size={20} color="#fff" />
                  ) : (
                    <Archive size={20} color="#fff" />
                  )}
                  <Text style={styles.completionActionText}>
                    {isOrderReminder ? 'Mark Delivered' : 'Archive'}
                  </Text>
                  <Text style={styles.completionActionSubtext}>
                    {isOrderReminder ? 'Order completed' : 'Save to archive'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.completionActionButton, styles.deleteButton]}
                  onPress={handleDeleteCompletedReminder}
                >
                  <Trash2 size={20} color="#fff" />
                  <Text style={styles.completionActionText}>Delete</Text>
                  <Text style={styles.completionActionSubtext}>Remove reminder</Text>
                </Pressable>

                <Pressable
                  style={[styles.completionActionButton, styles.keepButton]}
                  onPress={handleKeepReminder}
                >
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.completionActionText}>Keep</Text>
                  <Text style={styles.completionActionSubtext}>Mark as completed</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Reminders Yet</Text>
      <Text style={styles.emptyText}>
        Create reminders to follow up with your contacts after calls
      </Text>
      <Pressable
        style={styles.emptyActionButton}
        onPress={() => {
          if (contacts.length === 0) {
            Alert.alert('No Contacts', 'Add some contacts first to create reminders.');
            return;
          }
          setShowAddModal(true);
        }}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.emptyActionButtonText}>Create First Reminder</Text>
      </Pressable>
    </View>
  );

  // Separate call reminders and order reminders
  const callReminders = useMemo(() => {
    if (!showCallReminders) return [];
    return reminders.filter(r => !r.isArchived);
  }, [reminders, showCallReminders]);

  const orderReminders = useMemo(() => {
    if (!showOrderReminders) return [];

    return orders
      .filter(order => order.reminderDate && !order.reminderSent)
      .map(order => ({
        id: `order-${order.id}`,
        contactId: order.contactId,
        contactName: order.contactName,
        title: `Order #${order.id.slice(-6)}`,
        description:
          order.notes || `${order.items.length} items - Total: ${order.totalAmount.toFixed(2)}`,
        dueDate: new Date(order.reminderDate!),
        isCompleted: order.status === 'delivered',
        isArchived: false,
        createdAt: new Date(order.createdAt),
        isOrder: true,
        orderId: order.id,
        items: order.items,
        totalAmount: order.totalAmount,
      }));
  }, [orders, showOrderReminders]);

  const getFilteredReminders = () => {
    switch (activeTab) {
      case 'calls':
        return callReminders;
      case 'orders':
        return orderReminders;
      case 'all':
      default:
        return [...callReminders, ...orderReminders].sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }
  };

  const allReminders = getFilteredReminders();
  const pendingReminders = allReminders.filter(r => !r.isCompleted);
  const completedReminders = allReminders.filter(r => r.isCompleted);
  const overdueReminders = pendingReminders.filter(r => new Date(r.dueDate) < new Date());
  const todayReminders = pendingReminders.filter(
    r => new Date(r.dueDate).toDateString() === new Date().toDateString()
  );

  // Stats for each type
  const callStats = {
    pending: callReminders.filter(r => !r.isCompleted).length,
    completed: callReminders.filter(r => r.isCompleted).length,
    overdue: callReminders.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date()).length,
    today: callReminders.filter(
      r => !r.isCompleted && new Date(r.dueDate).toDateString() === new Date().toDateString()
    ).length,
  };

  const orderStats = {
    pending: orderReminders.filter(r => !r.isCompleted).length,
    completed: orderReminders.filter(r => r.isCompleted).length,
    overdue: orderReminders.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date()).length,
    today: orderReminders.filter(
      r => !r.isCompleted && new Date(r.dueDate).toDateString() === new Date().toDateString()
    ).length,
  };

  const renderReminderCard = (reminder: any) => {
    const isOverdue = new Date(reminder.dueDate) < new Date() && !reminder.isCompleted;
    const isToday = new Date(reminder.dueDate).toDateString() === new Date().toDateString();
    const contact = contacts.find(c => c.id === reminder.contactId);
    const isOrder = reminder.isOrder;

    return (
      <View
        key={reminder.id}
        style={[
          styles.reminderCard,
          reminder.isCompleted && styles.completedReminderCard,
          isOverdue && styles.overdueReminderCard,
          isOrder && styles.orderReminderCard,
        ]}
      >
        <Pressable style={styles.reminderCheckbox} onPress={() => handleReminderToggle(reminder)}>
          {reminder.isCompleted ? (
            <CheckCircle size={24} color="#34C759" />
          ) : (
            <Circle size={24} color={isOverdue ? '#FF3B30' : isOrder ? '#FF9500' : '#8E8E93'} />
          )}
        </Pressable>

        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            {isOrder ? <Package size={14} color="#FF9500" /> : <Phone size={14} color="#007AFF" />}
            <Text
              style={[styles.reminderTitle, reminder.isCompleted && styles.completedReminderTitle]}
            >
              {reminder.title}
            </Text>
          </View>

          <View style={styles.reminderMeta}>
            <View style={styles.reminderMetaItem}>
              <User size={14} color="#8E8E93" />
              <Text style={styles.reminderMetaText}>
                {contact ? contact.name : reminder.contactName}
                {contact && contact.phoneNumber && (
                  <Text style={styles.phoneText}> • {contact.phoneNumber}</Text>
                )}
              </Text>
            </View>

            <View style={styles.reminderMetaItem}>
              <Calendar size={14} color={isOverdue ? '#FF3B30' : isToday ? '#FF9500' : '#8E8E93'} />
              <Text
                style={[
                  styles.reminderMetaText,
                  isOverdue && styles.overdueText,
                  isToday && styles.todayText,
                ]}
              >
                {isToday ? 'Today' : new Date(reminder.dueDate).toLocaleDateString()}
                {' • '}
                {new Date(reminder.dueDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {isOverdue && !reminder.isCompleted && (
              <View style={styles.reminderMetaItem}>
                <AlertCircle size={14} color="#FF3B30" />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>

          {reminder.description && (
            <Text
              style={[
                styles.reminderDescription,
                reminder.isCompleted && styles.completedReminderDescription,
              ]}
            >
              {reminder.description}
            </Text>
          )}
        </View>

        <View style={styles.reminderActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              if (isOrder) {
                Alert.alert(
                  'Delete Order Reminder',
                  'Are you sure you want to delete this order reminder?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        const order = orders.find(o => o.id === reminder.orderId);
                        if (order) {
                          updateOrder({
                            id: order.id,
                            updates: {
                              reminderDate: undefined,
                              reminderSent: false,
                            },
                          });
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Delete Call Reminder',
                  'Are you sure you want to delete this call reminder?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => deleteReminder(reminder.id),
                    },
                  ]
                );
              }
            }}
          >
            <Trash2 size={18} color="#FF3B30" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Reminders' }} />

      {callReminders.length === 0 && orderReminders.length === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsGrid}
            >
              <View style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: '#007AFF15' }]}>
                  <Bell size={20} color="#007AFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{pendingReminders.length}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF3B3015' }]}>
                  <AlertCircle size={20} color="#FF3B30" />
                </View>
                <View style={styles.statContent}>
                  <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
                    {overdueReminders.length}
                  </Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF950015' }]}>
                  <Clock size={20} color="#FF9500" />
                </View>
                <View style={styles.statContent}>
                  <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                    {todayReminders.length}
                  </Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: '#34C75915' }]}>
                  <CheckCircle size={20} color="#34C759" />
                </View>
                <View style={styles.statContent}>
                  <Text style={[styles.statNumber, { color: '#34C759' }]}>
                    {completedReminders.length}
                  </Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
              <View style={[styles.tabBadge, activeTab === 'all' && styles.activeTabBadge]}>
                <Text
                  style={[styles.tabBadgeText, activeTab === 'all' && styles.activeTabBadgeText]}
                >
                  {callReminders.length + orderReminders.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === 'calls' && styles.activeTab]}
              onPress={() => setActiveTab('calls')}
            >
              <Phone size={16} color={activeTab === 'calls' ? '#007AFF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'calls' && styles.activeTabText]}>
                Calls
              </Text>
              <View style={[styles.tabBadge, activeTab === 'calls' && styles.activeTabBadge]}>
                <Text
                  style={[styles.tabBadgeText, activeTab === 'calls' && styles.activeTabBadgeText]}
                >
                  {callReminders.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
              onPress={() => setActiveTab('orders')}
            >
              <Package size={16} color={activeTab === 'orders' ? '#007AFF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                Orders
              </Text>
              <View style={[styles.tabBadge, activeTab === 'orders' && styles.activeTabBadge]}>
                <Text
                  style={[styles.tabBadgeText, activeTab === 'orders' && styles.activeTabBadgeText]}
                >
                  {orderReminders.length}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Group By Selector */}
          <View style={styles.groupBySection}>
            <Pressable style={styles.groupByButton} onPress={() => setShowGroupByModal(true)}>
              <Filter size={16} color="#007AFF" />
              <Text style={styles.groupByButtonText}>
                Group by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Text>
              <ChevronDown size={16} color="#007AFF" />
            </Pressable>
            {activeTab === 'calls' && (
              <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            )}
          </View>

          {/* Reminders List */}
          {activeTab === 'all' ? (
            <>
              {/* Call Reminders Section */}
              {callReminders.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Phone size={18} color="#007AFF" />
                      <Text style={styles.sectionTitle}>Call Reminders</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{callStats.pending}</Text>
                      </View>
                    </View>
                  </View>
                  <GroupedView
                    items={callReminders}
                    groupBy={groupBy}
                    renderItem={renderReminderCard}
                    itemType="reminder"
                    emptyMessage="No call reminders"
                  />
                </View>
              )}

              {/* Order Reminders Section */}
              {orderReminders.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Package size={18} color="#FF9500" />
                      <Text style={styles.sectionTitle}>Order Reminders</Text>
                      <View style={[styles.sectionBadge, { backgroundColor: '#FF950020' }]}>
                        <Text style={[styles.sectionBadgeText, { color: '#FF9500' }]}>
                          {orderStats.pending}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <GroupedView
                    items={orderReminders}
                    groupBy={groupBy}
                    renderItem={renderReminderCard}
                    itemType="reminder"
                    emptyMessage="No order reminders"
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'calls' ? 'Call Reminders' : 'Order Reminders'}
                </Text>
              </View>
              <GroupedView
                items={allReminders}
                groupBy={groupBy}
                renderItem={renderReminderCard}
                itemType="reminder"
                emptyMessage={`No ${activeTab} reminders`}
              />
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Bell size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Manage reminders for both calls and orders. Never miss important follow-ups or
                deliveries.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <AddReminderModal />
      <CompletionModal />

      {/* Group By Modal */}
      <Modal
        visible={showGroupByModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowGroupByModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroupByModal(false)}>
          <View style={styles.groupByModalContainer}>
            <Text style={styles.groupByModalTitle}>Group Reminders By</Text>
            {(['none', 'day', 'week', 'month', 'year'] as GroupByOption[]).map(option => (
              <Button
                key={option}
                style={[
                  styles.groupByOption,
                  groupBy === option && styles.selectedGroupByOption,
                ]}
                onPress={() => {
                  setGroupBy(option);
                  setShowGroupByModal(false);
                }}
              >
                <Text
                  style={[
                    styles.groupByOptionText,
                    groupBy === option && styles.selectedGroupByOptionText,
                  ]}
                >
                  {option === 'none'
                    ? 'No Grouping'
                    : option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {groupBy === option && <CheckCircle size={20} color="#007AFF" />}
              </Button>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  statsSection: {
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  statsGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  remindersList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedReminderCard: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  overdueReminderCard: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30' + '08',
  },
  reminderCheckbox: {
    marginTop: 2,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  completedReminderTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  reminderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderMetaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  todayText: {
    color: '#FF9500',
    fontWeight: '500',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  completedReminderDescription: {
    color: '#8E8E93',
  },
  reminderActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  contactPicker: {
    marginBottom: 20,
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF30',
  },
  selectedContactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  contactScrollView: {
    maxHeight: 200,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedContactItem: {
    backgroundColor: '#F0F8FF',
  },
  contactItemContent: {
    flex: 1,
  },
  contactItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  selectedContactItemName: {
    color: '#007AFF',
  },
  contactItemPhone: {
    fontSize: 14,
    color: '#8E8E93',
  },
  contactChip: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedContactChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  contactChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedContactChipText: {
    color: '#fff',
  },
  datePicker: {
    marginBottom: 20,
  },
  dateScrollView: {
    maxHeight: 50,
    marginBottom: 8,
  },
  dateChip: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedDateChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedDateChipText: {
    color: '#fff',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noContactsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 11,
    color: '#999',
  },
  timeDetected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#007AFF10',
    borderRadius: 8,
    gap: 6,
  },
  timeDetectedText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  completionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  completionModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  completionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  completionModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  completionModalContent: {
    alignItems: 'center',
  },
  completedReminderInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '100%',
  },
  completedReminderContact: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  completionActions: {
    width: '100%',
    gap: 12,
  },
  completionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  archiveButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  keepButton: {
    backgroundColor: '#34C759',
  },
  completionActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completionActionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF10',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabBadge: {
    backgroundColor: '#66666620',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: '#007AFF20',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  activeTabBadgeText: {
    color: '#007AFF',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  orderReminderCard: {
    borderColor: '#FF9500',
    backgroundColor: '#FF950008',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  orderCompletionModal: {
    borderTopWidth: 3,
    borderTopColor: '#FF9500',
  },
  completionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCompletionIcon: {
    backgroundColor: '#FF9500',
  },
  orderItemsCount: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
    marginTop: 2,
  },
  deliveredButton: {
    backgroundColor: '#FF9500',
  },
  groupBySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  groupByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  groupByButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  groupByModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  groupByModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  groupByOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedGroupByOption: {
    backgroundColor: '#007AFF10',
  },
  groupByOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGroupByOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
