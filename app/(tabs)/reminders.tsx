import React, { useState, useMemo, useRef, useCallback } from 'react';
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
import ModalHeader from '@/components/ModalHeader';
import SectionHeader from '@/components/SectionHeader';
import { COLORS, SPACING, SHADOW, BORDER_RADIUS } from '@/constants/theme';
import { parseTimeFromDescription } from '@/utils/timeParser';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    const parsedTime = parseTimeFromDescription(newReminderDescription, selectedDate);
    const finalDate = parsedTime || selectedDate;

    console.log('Creating reminder with data:', {
      contactId: contact.id,
      contactName: contact.name,
      title: newReminderTitle.trim(),
      description: newReminderDescription.trim(),
      dueDate: finalDate,
      isCompleted: false,
    });

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
              <Search size={16} color={COLORS.TEXT_QUATERNARY} />
              <TextInput
                style={styles.contactSearchInput}
                placeholder="Search contacts..."
                placeholderTextColor={COLORS.TEXT_QUATERNARY}
                value={contactSearch}
                onChangeText={setContactSearch}
              />
              {contactSearch.length > 0 && (
                <Pressable onPress={() => setContactSearch('')}>
                  <X size={16} color={COLORS.TEXT_QUATERNARY} />
                </Pressable>
              )}
            </View>

            {selectedContact && (
              <View style={styles.selectedContactCard}>
                <User size={16} color={COLORS.PRIMARY} />
                <Text style={styles.selectedContactName}>{selectedContact.name}</Text>
                <Pressable onPress={() => onSelect('')}>
                  <X size={16} color={COLORS.TEXT_SECONDARY} />
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
                  {selectedId === contact.id && <CheckCircle size={20} color={COLORS.PRIMARY} />}
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

  const CompletionModal = () => {
    const isOrderReminder = completedReminder && (completedReminder as any).isOrder;
    const modalTitle = isOrderReminder ? 'Order Reminder Completed!' : 'Call Reminder Completed!';
    const modalIcon = isOrderReminder ? Package : Phone;
    const IconComponent = modalIcon;

    const completionActions = [
      {
        icon: isOrderReminder ? Package : Archive,
        label: isOrderReminder ? 'Mark Delivered' : 'Archive',
        subtext: isOrderReminder ? 'Order completed' : 'Save to archive',
        style: isOrderReminder ? styles.deliveredButton : styles.archiveButton,
        onPress: handleArchiveReminder,
      },
      {
        icon: Trash2,
        label: 'Delete',
        subtext: 'Remove reminder',
        style: styles.deleteButton,
        onPress: handleDeleteCompletedReminder,
      },
      {
        icon: CheckCircle,
        label: 'Keep',
        subtext: 'Mark as completed',
        style: styles.keepButton,
        onPress: handleKeepReminder,
      },
    ];

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
                <IconComponent size={24} color={COLORS.WHITE} />
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
                {completionActions.map((action) => (
                  <CompletionActionButton
                    key={action.label}
                    icon={action.icon}
                    label={action.label}
                    subtext={action.subtext}
                    style={action.style}
                    onPress={action.onPress}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Helper component for stat cards
  const StatCard = ({ icon: Icon, count, label, color = COLORS.TEXT_PRIMARY }: {
    icon: any;
    count: number;
    label: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statNumber, { color }]}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  // Helper component for tab buttons
  const TabButton = ({ tab, icon: Icon, label, count, onPress }: {
    tab: 'all' | 'calls' | 'orders';
    icon?: any;
    label: string;
    count: number;
    onPress: () => void;
  }) => {
    const isActive = activeTab === tab;
    return (
      <Pressable style={[styles.tab, isActive && styles.activeTab]} onPress={onPress}>
        {Icon && <Icon size={16} color={isActive ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} />}
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
        <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
          <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
            {count}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Helper component for completion action buttons
  const CompletionActionButton = ({ icon: Icon, label, subtext, style, onPress }: {
    icon: any;
    label: string;
    subtext: string;
    style: any;
    onPress: () => void;
  }) => (
    <Pressable style={[styles.completionActionButton, style]} onPress={onPress}>
      <Icon size={20} color={COLORS.WHITE} />
      <Text style={styles.completionActionText}>{label}</Text>
      <Text style={styles.completionActionSubtext}>{subtext}</Text>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color={COLORS.ICON_GRAY} />
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
        <Plus size={20} color={COLORS.WHITE} />
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

  const tabs = [
    { tab: 'all' as const, label: 'All', count: callReminders.length + orderReminders.length },
    { tab: 'calls' as const, icon: Phone, label: 'Calls', count: callReminders.length },
    { tab: 'orders' as const, icon: Package, label: 'Orders', count: orderReminders.length },
  ];

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

    // Helper to get circle color based on reminder state
    const getCircleColor = () => {
      if (isOverdue) return COLORS.DESTRUCTIVE;
      if (isOrder) return COLORS.WARNING;
      return COLORS.TEXT_QUATERNARY;
    };

    // Helper to get calendar icon color
    const getCalendarColor = () => {
      if (isOverdue) return COLORS.DESTRUCTIVE;
      if (isToday) return COLORS.WARNING;
      return COLORS.TEXT_QUATERNARY;
    };

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
            <CheckCircle size={24} color={COLORS.SUCCESS} />
          ) : (
            <Circle size={24} color={getCircleColor()} />
          )}
        </Pressable>

        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            {isOrder ? <Package size={14} color={COLORS.WARNING} /> : <Phone size={14} color={COLORS.PRIMARY} />}
            <Text
              style={[styles.reminderTitle, reminder.isCompleted && styles.completedReminderTitle]}
            >
              {reminder.title}
            </Text>
          </View>

          <View style={styles.reminderMeta}>
            <View style={styles.reminderMetaItem}>
              <User size={14} color={COLORS.TEXT_QUATERNARY} />
              <Text style={styles.reminderMetaText}>
                {contact ? contact.name : reminder.contactName}
                {contact && contact.phoneNumber && (
                  <Text style={styles.phoneText}> • {contact.phoneNumber}</Text>
                )}
              </Text>
            </View>

            <View style={styles.reminderMetaItem}>
              <Calendar size={14} color={getCalendarColor()} />
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
                <AlertCircle size={14} color={COLORS.DESTRUCTIVE} />
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
            <Trash2 size={18} color={COLORS.DESTRUCTIVE} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
              {[
                { icon: Bell, count: pendingReminders.length, label: 'Pending', color: COLORS.PRIMARY },
                { icon: AlertCircle, count: overdueReminders.length, label: 'Overdue', color: COLORS.DESTRUCTIVE },
                { icon: Clock, count: todayReminders.length, label: 'Today', color: COLORS.WARNING },
                { icon: CheckCircle, count: completedReminders.length, label: 'Done', color: COLORS.SUCCESS },
              ].map((stat) => (
                <StatCard
                  key={stat.label}
                  icon={stat.icon}
                  count={stat.count}
                  label={stat.label}
                  color={stat.color}
                />
              ))}
            </ScrollView>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            {tabs.map((tabConfig) => (
              <TabButton
                key={tabConfig.tab}
                tab={tabConfig.tab}
                icon={tabConfig.icon}
                label={tabConfig.label}
                count={tabConfig.count}
                onPress={() => setActiveTab(tabConfig.tab)}
              />
            ))}
          </View>

          {/* Group By Selector */}
          <View style={styles.groupBySection}>
            <Pressable style={styles.groupByButton} onPress={() => setShowGroupByModal(true)}>
              <Filter size={16} color={COLORS.PRIMARY} />
              <Text style={styles.groupByButtonText}>
                Group by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Text>
              <ChevronDown size={16} color={COLORS.PRIMARY} />
            </Pressable>
            {activeTab === 'calls' && (
              <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Plus size={16} color={COLORS.WHITE} />
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
                      <Phone size={18} color={COLORS.PRIMARY} />
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
                      <Package size={18} color={COLORS.WARNING} />
                      <Text style={styles.sectionTitle}>Order Reminders</Text>
                      <View style={[styles.sectionBadge, styles.orderSectionBadge]}>
                        <Text style={[styles.sectionBadgeText, styles.orderSectionBadgeText]}>
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
              <Bell size={20} color={COLORS.PRIMARY} />
              <Text style={styles.infoText}>
                Manage reminders for both calls and orders. Never miss important follow-ups or
                deliveries.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <ModalHeader
            title="Add Reminder"
            onClose={() => setShowAddModal(false)}
            onAction={handleAddReminder}
            leftIcon={<X size={24} color={COLORS.TEXT_SECONDARY} />}
            rightIcon={<Text style={styles.saveButton}>Save</Text>}
          />

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
                  const detectedTime = parseTimeFromDescription(text, selectedDate);
                  if (detectedTime) {
                    setSelectedDate(detectedTime);
                  }
                }}
                placeholder="Enter description (e.g., 'Call at 3pm' or 'Meeting at 14:30')"
                multiline={true}
                numberOfLines={3}
              />
              {parseTimeFromDescription(newReminderDescription, selectedDate) && (
                <View style={styles.timeDetected}>
                  <Clock size={14} color={COLORS.PRIMARY} />
                  <Text style={styles.timeDetectedText}>
                    Time detected:{' '}
                    {parseTimeFromDescription(newReminderDescription, selectedDate)?.toLocaleTimeString([], {
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
                {groupBy === option && <CheckCircle size={20} color={COLORS.PRIMARY} />}
              </Button>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Common style patterns
const commonStyles = {
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    ...SHADOW.SMALL,
  },
  cardWithPadding: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
  },
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  iconCircle: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: BORDER_RADIUS.ROUND,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  scrollContent: {
    paddingVertical: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  statsSection: {
    paddingVertical: SPACING.XL,
    backgroundColor: COLORS.WHITE,
    marginTop: SPACING.SM,
  },
  statsGrid: {
    paddingHorizontal: SPACING.LG,
    gap: SPACING.MD,
  },
  statCard: {
    ...commonStyles.card,
    padding: SPACING.MD,
    ...commonStyles.rowCenter,
    minWidth: 140,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    ...commonStyles.iconCircle,
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.XL,
  },
  sectionHeader: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    ...commonStyles.rowCenter,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    gap: 4,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  remindersList: {
    paddingHorizontal: SPACING.LG,
    gap: SPACING.MD,
  },
  reminderCard: {
    ...commonStyles.rowCenter,
    alignItems: 'flex-start',
    padding: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    gap: SPACING.MD,
    ...SHADOW.SMALL,
  },
  completedReminderCard: {
    opacity: 0.6,
    backgroundColor: COLORS.BACKGROUND_GRAY,
  },
  overdueReminderCard: {
    borderColor: COLORS.DESTRUCTIVE,
    backgroundColor: COLORS.DESTRUCTIVE + '08',
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
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  completedReminderTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_QUATERNARY,
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
    marginBottom: 6,
  },
  reminderMetaItem: {
    ...commonStyles.rowCenter,
    gap: 4,
  },
  reminderMetaText: {
    fontSize: 12,
    color: COLORS.TEXT_QUATERNARY,
  },
  overdueText: {
    color: COLORS.DESTRUCTIVE,
    fontWeight: '500',
  },
  todayText: {
    color: COLORS.WARNING,
    fontWeight: '500',
  },
  reminderDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  completedReminderDescription: {
    color: COLORS.TEXT_QUATERNARY,
  },
  reminderActions: {
    flexDirection: 'column',
    gap: SPACING.SM,
  },
  actionButton: {
    width: 32,
    height: 32,
    ...commonStyles.iconCircle,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  infoSection: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
    marginTop: SPACING.SM,
  },
  infoCard: {
    ...commonStyles.card,
    padding: SPACING.LG,
    ...commonStyles.rowCenter,
    alignItems: 'flex-start',
    gap: SPACING.MD,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XXXL,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XXL,
  },
  emptyActionButton: {
    backgroundColor: COLORS.PRIMARY,
    ...commonStyles.rowCenter,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  emptyActionButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.LG,
  },
  inputGroup: {
    marginBottom: SPACING.XL,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    fontSize: 16,
    backgroundColor: COLORS.WHITE,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  contactPicker: {
    marginBottom: SPACING.XL,
  },
  contactSearchContainer: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginBottom: SPACING.MD,
    gap: SPACING.SM,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  selectedContactCard: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginBottom: SPACING.MD,
    gap: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  selectedContactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  contactScrollView: {
    maxHeight: 200,
  },
  contactItem: {
    ...commonStyles.rowCenter,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND,
  },
  selectedContactItem: {
    backgroundColor: COLORS.PRIMARY + '08',
  },
  contactItemContent: {
    flex: 1,
  },
  contactItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  selectedContactItemName: {
    color: COLORS.PRIMARY,
  },
  contactItemPhone: {
    fontSize: 14,
    color: COLORS.TEXT_TERTIARY,
  },
  contactChip: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: SPACING.XL,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
  },
  selectedContactChip: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  contactChipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  selectedContactChipText: {
    color: COLORS.WHITE,
  },
  datePicker: {
    marginBottom: SPACING.XL,
  },
  dateScrollView: {
    maxHeight: 50,
    marginBottom: SPACING.SM,
  },
  dateChip: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: SPACING.XL,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
  },
  selectedDateChip: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  dateChipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  selectedDateChipText: {
    color: COLORS.WHITE,
  },
  selectedDateText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  noContactsContainer: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.LG,
    alignItems: 'center',
  },
  noContactsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.TEXT_TERTIARY,
  },
  timeDetected: {
    ...commonStyles.rowCenter,
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 6,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: BORDER_RADIUS.SM,
    gap: 6,
  },
  timeDetectedText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  completionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  completionModalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XXL,
    width: '100%',
    maxWidth: 400,
    ...SHADOW.LARGE,
  },
  completionModalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  completionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  completionModalSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  completionModalContent: {
    alignItems: 'center',
  },
  completedReminderInfo: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    width: '100%',
  },
  completedReminderContact: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  completionActions: {
    width: '100%',
    gap: SPACING.MD,
  },
  completionActionButton: {
    ...commonStyles.rowCenter,
    justifyContent: 'center',
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XL,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.MD,
  },
  archiveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  deleteButton: {
    backgroundColor: COLORS.DESTRUCTIVE,
  },
  keepButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  completionActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  completionActionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: SPACING.SM,
  },
  tabContainer: {
    ...commonStyles.rowCenter,
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
    gap: SPACING.SM,
  },
  tab: {
    flex: 1,
    ...commonStyles.rowCenter,
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
  },
  tabBadge: {
    backgroundColor: COLORS.TEXT_SECONDARY + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SPACING.MD,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabBadgeText: {
    color: COLORS.PRIMARY,
  },
  sectionTitleContainer: {
    ...commonStyles.rowCenter,
    gap: SPACING.SM,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: SPACING.MD,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  orderSectionBadge: {
    backgroundColor: COLORS.WARNING + '20',
  },
  orderSectionBadgeText: {
    color: COLORS.WARNING,
  },
  orderReminderCard: {
    borderColor: COLORS.WARNING,
    backgroundColor: COLORS.WARNING + '08',
  },
  reminderHeader: {
    ...commonStyles.rowCenter,
    gap: 6,
    marginBottom: 2,
  },
  orderCompletionModal: {
    borderTopWidth: 3,
    borderTopColor: COLORS.WARNING,
  },
  completionIconWrapper: {
    width: 48,
    height: 48,
    ...commonStyles.iconCircle,
    backgroundColor: COLORS.PRIMARY,
  },
  orderCompletionIcon: {
    backgroundColor: COLORS.WARNING,
  },
  orderItemsCount: {
    fontSize: 13,
    color: COLORS.WARNING,
    fontWeight: '500',
    marginTop: 2,
  },
  deliveredButton: {
    backgroundColor: COLORS.WARNING,
  },
  groupBySection: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  groupByButton: {
    ...commonStyles.rowCenter,
    gap: 6,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  groupByButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  groupByModalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    width: '90%',
    maxWidth: 350,
    ...SHADOW.LARGE,
  },
  groupByModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  groupByOption: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  selectedGroupByOption: {
    backgroundColor: COLORS.PRIMARY + '10',
  },
  groupByOptionText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  selectedGroupByOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});
