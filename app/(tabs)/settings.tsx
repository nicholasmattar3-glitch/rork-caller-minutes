import React, { useState, ReactNode, ReactElement, cloneElement } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Stack } from 'expo-router';
import {
  Plus,
  Download,
  Users,
  Settings as SettingsIcon,
  Trash2,
  Info,
  Edit3,
  X,
  Save,
  Check,
  Tag,
  Crown,
  FileText,
  Archive,
  Star,
  BarChart3,
  TrendingUp,
  Calendar,
} from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import AddContactModal from '@/components/AddContactModal';
import ModalHeader from '@/components/ModalHeader';
import ToggleItem from '@/components/ToggleItem';
import SectionHeader from '@/components/SectionHeader';
import { COLORS, SPACING, SHADOW, BORDER_RADIUS } from '@/constants/theme';

interface TemplateSection {
  id: string;
  label: string;
  enabled: boolean;
  custom?: boolean;
}

export default function SettingsScreen() {
  const {
    contacts,
    notes,
    orders,
    reminders,
    addContact,
    importContacts,
    isImporting,
    clearAllData,
    noteTemplate,
    updateNoteTemplate,
    addFakeContacts,
    isAddingFakeContacts,
    presetTags,
    updatePresetTags,
    noteSettings,
    updateNoteSettings,
    premiumSettings,
    updatePremiumSettings,
  } = useContacts();
  const [showAddModal, setShowAddModal] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editableTags, setEditableTags] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPremium, setIsPremium] = useState(true); // Testing mode - premium enabled
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Parse existing template or use default sections
  const parseTemplateToSections = (template: string): TemplateSection[] => {
    const defaultSections: TemplateSection[] = [
      { id: 'purpose', label: 'Purpose of call', enabled: true },
      { id: 'keypoints', label: 'Key points discussed', enabled: true },
      { id: 'action', label: 'Action items', enabled: true },
      { id: 'nextsteps', label: 'Next steps', enabled: true },
      { id: 'additional', label: 'Additional notes', enabled: true },
    ];

    // Check which sections exist in the current template
    defaultSections.forEach(section => {
      section.enabled = template.toLowerCase().includes(section.label.toLowerCase());
    });

    return defaultSections;
  };

  const [templateSections, setTemplateSections] = useState<TemplateSection[]>(() =>
    parseTemplateToSections(noteTemplate)
  );
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [newPromptText, setNewPromptText] = useState('');
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  const handleImportContacts = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Contact import is not available on web. Please use the mobile app.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await new Promise<{ imported: number; total: number }>((resolve, reject) => {
        importContacts(undefined, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      if (result.imported > 0) {
        Alert.alert(
          'Import Successful',
          `Successfully imported ${result.imported} new contacts. You now have ${result.total} total contacts.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No New Contacts', 'All your device contacts are already in the app.', [
          { text: 'OK' },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Import Failed',
        error.message || 'Failed to import contacts. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddFakeContacts = async () => {
    try {
      const result = await new Promise<{ added: number; total: number }>((resolve, reject) => {
        addFakeContacts(undefined, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      if (result.added > 0) {
        Alert.alert(
          'Fake Contacts Added',
          `Successfully added ${result.added} fake contacts for testing. You now have ${result.total} total contacts.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No New Contacts', 'All fake contacts are already in the app.', [
          { text: 'OK' },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Failed to Add Contacts',
        error.message || 'Failed to add fake contacts. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all contacts and call notes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Data Cleared', 'All data has been successfully cleared.');
          },
        },
      ]
    );
  };

  const handleEditTemplate = () => {
    setTemplateSections(parseTemplateToSections(noteTemplate));
    setShowTemplateModal(true);
  };

  const handleEditTags = () => {
    setEditableTags([...presetTags]);
    setShowTagsModal(true);
  };

  const handleSaveTemplate = () => {
    // Build template from enabled sections
    let template = 'Call with [CONTACT_NAME] - [DATE]\n\n';

    templateSections.forEach(section => {
      if (section.enabled) {
        template += `${section.label}:\n\n`;
      }
    });

    // Add custom prompts
    customPrompts.forEach(prompt => {
      template += `${prompt}:\n\n`;
    });

    updateNoteTemplate(template.trim());
    setShowTemplateModal(false);
    Alert.alert('Template Updated', 'Your call note template has been updated successfully.');
  };

  const handleCloseTemplate = () => {
    setShowTemplateModal(false);
    setTemplateSections(parseTemplateToSections(noteTemplate));
    setCustomPrompts([]);
    setNewPromptText('');
    setShowAddPrompt(false);
  };

  const toggleSection = (id: string) => {
    setTemplateSections(prev =>
      prev.map(section => (section.id === id ? { ...section, enabled: !section.enabled } : section))
    );
  };

  const addCustomPrompt = () => {
    if (newPromptText.trim()) {
      setCustomPrompts(prev => [...prev, newPromptText.trim()]);
      setNewPromptText('');
      setShowAddPrompt(false);
    }
  };

  const removeCustomPrompt = (index: number) => {
    setCustomPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTags = () => {
    updatePresetTags(editableTags);
    setShowTagsModal(false);
    Alert.alert('Tags Updated', 'Your preset tags have been updated successfully.');
  };

  const handleCloseTags = () => {
    setShowTagsModal(false);
    setEditableTags([...presetTags]);
    setNewTagText('');
    setShowAddTag(false);
  };

  const addTag = () => {
    if (newTagText.trim() && !editableTags.includes(newTagText.trim())) {
      setEditableTags(prev => [...prev, newTagText.trim()]);
      setNewTagText('');
      setShowAddTag(false);
    }
  };

  const removeTag = (index: number) => {
    setEditableTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportLogs = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        contacts,
        notes,
        orders,
        reminders,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `call-notes-export-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web export
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Export Complete', 'Your data has been downloaded successfully.');
      } else {
        // Mobile share
        await Share.share({
          message: jsonString,
          title: 'Call Notes Export',
        });
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveLogs = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    try {
      // In a real app, this would save to cloud storage
      // For now, we'll just show a success message
      Alert.alert(
        'Logs Saved',
        'Your call logs have been saved to secure cloud storage. You can access them anytime from any device.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Save Failed', 'Failed to save logs. Please try again.');
    }
  };

  const handleUpgradeToPremium = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Premium features include:\n\n• Cloud backup and sync\n• Export all data\n• Password protected notes\n• Advanced analytics & reports\n• Priority support\n• Unlimited storage',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade Now',
          onPress: () => {
            // In a real app, this would open the payment flow
            setIsPremium(true);
            setShowPremiumModal(false);
            Alert.alert('Welcome to Premium!', 'You now have access to all premium features.');
          },
        },
      ]
    );
  };

  const handleViewReports = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowReportsModal(true);
  };

  // Analytics calculations
  const getAnalytics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter recent data
    const recentNotes = notes.filter(note => new Date(note.createdAt) >= thirtyDaysAgo);
    const recentOrders = orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
    const recentReminders = reminders.filter(
      reminder => new Date(reminder.createdAt) >= thirtyDaysAgo
    );

    const weeklyNotes = notes.filter(note => new Date(note.createdAt) >= sevenDaysAgo);
    const weeklyOrders = orders.filter(order => new Date(order.createdAt) >= sevenDaysAgo);

    // Calculate trends
    const notesGrowth =
      weeklyNotes.length > 0
        ? (weeklyNotes.length / Math.max(recentNotes.length - weeklyNotes.length, 1)) * 100
        : 0;
    const ordersGrowth =
      weeklyOrders.length > 0
        ? (weeklyOrders.length / Math.max(recentOrders.length - weeklyOrders.length, 1)) * 100
        : 0;

    // Most active contacts
    const contactActivity = contacts
      .map(contact => {
        const contactNotes = notes.filter(note => note.contactId === contact.id);
        const contactOrders = orders.filter(order => order.contactId === contact.id);
        return {
          contact,
          totalActivity: contactNotes.length + contactOrders.length,
          notes: contactNotes.length,
          orders: contactOrders.length,
        };
      })
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, 5);

    // Tag frequency
    const tagCounts: { [key: string]: number } = {};
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Weekly activity chart data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayNotes = notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= dayStart && noteDate < dayEnd;
      }).length;

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate < dayEnd;
      }).length;

      weeklyData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        notes: dayNotes,
        orders: dayOrders,
        total: dayNotes + dayOrders,
      });
    }

    return {
      totalStats: {
        contacts: contacts.length,
        notes: notes.length,
        orders: orders.length,
        reminders: reminders.length,
      },
      recentStats: {
        notes: recentNotes.length,
        orders: recentOrders.length,
        reminders: recentReminders.length,
      },
      trends: {
        notesGrowth: Math.round(notesGrowth),
        ordersGrowth: Math.round(ordersGrowth),
      },
      topContacts: contactActivity,
      topTags,
      weeklyActivity: weeklyData,
    };
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    disabled = false,
    destructive = false,
  }: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }) => (
    <Button
      style={[
        styles.settingItem,
        disabled && styles.settingItemDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.iconContainer, destructive && styles.destructiveIconContainer]}>
        {cloneElement(
          icon as ReactElement,
          {
            color: disabled ? '#999' : destructive ? '#FF3B30' : '#007AFF',
            size: 20,
          } as any
        )}
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            disabled && styles.settingTitleDisabled,
            destructive && styles.destructiveTitle,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, disabled && styles.settingSubtitleDisabled]}>
            {subtitle}
          </Text>
        )}
      </View>
    </Button>
  );

  const InfoCard = ({ title, description }: { title: string; description: string }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Info size={16} color="#007AFF" />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={styles.infoDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacts</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={<Plus />}
              title="Add Contact Manually"
              subtitle="Create a new contact entry"
              onPress={() => setShowAddModal(true)}
            />
            <SettingItem
              icon={<Download />}
              title={isImporting ? 'Importing...' : 'Import from Device'}
              subtitle={
                Platform.OS === 'web'
                  ? 'Not available on web'
                  : `Sync contacts from your device (${contacts.length} contacts)`
              }
              onPress={handleImportContacts}
              disabled={isImporting || Platform.OS === 'web'}
            />
            <SettingItem
              icon={<Users />}
              title={isAddingFakeContacts ? 'Adding...' : 'Add Fake Contacts'}
              subtitle="Add sample contacts for testing the app"
              onPress={handleAddFakeContacts}
              disabled={isAddingFakeContacts}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <InfoCard
            title="How it works"
            description="This app helps you manage contacts and take call notes. All data is stored locally on your device."
          />
          <InfoCard
            title="Contact Management"
            description="The app helps you organize contacts and manage call-related notes and reminders."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Notes</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={<Edit3 />}
              title="Edit Note Template"
              subtitle="Customize the default structure for call notes"
              onPress={handleEditTemplate}
            />
            <SettingItem
              icon={<Tag />}
              title="Manage Tags"
              subtitle={`Customize preset tags for call notes (${presetTags.length} tags)`}
              onPress={handleEditTags}
            />
          </View>

          <View style={[styles.settingsGroup, { marginTop: 12 }]}>
            <ToggleItem
              title="Show Call Duration"
              subtitle="Display duration in call notes"
              value={noteSettings?.showDuration ?? true}
              onValueChange={value => updateNoteSettings({ showDuration: value })}
            />

            <ToggleItem
              title="Show Call Direction"
              subtitle="Display incoming/outgoing status"
              value={noteSettings?.showDirection ?? true}
              onValueChange={value => updateNoteSettings({ showDirection: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.premiumSectionHeader}>
            <Crown size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Premium Features</Text>
            {!isPremium && (
              <Button
                style={styles.upgradeButton}
                onPress={() => setShowPremiumModal(true)}
              >
                <Star size={16} color="#FFD700" />
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </Button>
            )}
          </View>
          <View style={[styles.settingsGroup, !isPremium && styles.settingsGroupDisabled]}>
            <SettingItem
              icon={<Archive />}
              title={isExporting ? 'Exporting...' : 'Export All Data'}
              subtitle={`Export contacts, notes, orders & reminders (${contacts.length + notes.length + orders.length + reminders.length} items)`}
              onPress={handleExportLogs}
              disabled={isExporting}
            />
            <SettingItem
              icon={<FileText />}
              title="Save Logs to Cloud"
              subtitle="Backup your data to secure cloud storage"
              onPress={handleSaveLogs}
            />
            <SettingItem
              icon={<BarChart3 />}
              title="Analytics & Reports"
              subtitle="View detailed analytics and generate reports"
              onPress={handleViewReports}
            />
            <ToggleItem
              title="Password Protected Notes"
              subtitle="Require password to view notes"
              value={noteSettings?.passwordProtected ?? false}
              onValueChange={value => {
                if (!isPremium) {
                  setShowPremiumModal(true);
                  return;
                }
                if (value) {
                  setShowPasswordModal(true);
                } else {
                  Alert.alert(
                    'Remove Password Protection',
                    'Are you sure you want to remove password protection from your notes?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                          updateNoteSettings({ passwordProtected: false, password: undefined });
                        },
                      },
                    ]
                  );
                }
              }}
              disabled={!isPremium}
            />
            <ToggleItem
              title="Enable Shopify/Website Tab"
              subtitle="Add a premium tab for Shopify store or website integration"
              value={premiumSettings?.showShopifyTab ?? false}
              onValueChange={value => {
                if (!isPremium) {
                  setShowPremiumModal(true);
                  return;
                }
                updatePremiumSettings({ showShopifyTab: value });
              }}
              disabled={!isPremium}
            />
            <ToggleItem
              title="Enable Plan a Run Tab"
              subtitle="Add a premium tab for planning contact visit routes with drag-and-drop functionality"
              value={premiumSettings?.showPlanRunTab ?? false}
              onValueChange={value => {
                if (!isPremium) {
                  setShowPremiumModal(true);
                  return;
                }
                updatePremiumSettings({ showPlanRunTab: value });
              }}
              disabled={!isPremium}
            />
          </View>
          {!isPremium && (
            <View style={styles.premiumOverlay}>
              <Crown size={24} color="#FFD700" />
              <Text style={styles.premiumOverlayText}>Premium Feature</Text>
              <Text style={styles.premiumOverlaySubtext}>
                Upgrade to access cloud backup, export, and password protection
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={<Trash2 />}
              title="Clear All Data"
              subtitle="Delete all contacts and call notes"
              onPress={handleClearAllData}
              destructive
            />
          </View>
        </View>
      </ScrollView>

      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addContact}
      />

      <Modal visible={showTemplateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.templateModalContainer} edges={['top', 'bottom']}>
          <ModalHeader
            title="Template Settings"
            onClose={handleCloseTemplate}
            onAction={handleSaveTemplate}
            leftIcon={<X size={24} color={COLORS.PRIMARY} />}
            rightIcon={<Save size={24} color={COLORS.PRIMARY} />}
          />

          <ScrollView style={styles.templateContent} showsVerticalScrollIndicator={false}>
            <SectionHeader
              title="Default Sections"
              description="Select which sections to include in your call notes"
            />

            <View style={styles.templateSections}>
              {templateSections.map(section => (
                <Button
                  key={section.id}
                  style={styles.templateSectionItem}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.templateSectionLeft}>
                    <View style={[styles.checkbox, section.enabled && styles.checkboxChecked]}>
                      {section.enabled && <Check size={16} color="#fff" />}
                    </View>
                    <Text style={styles.templateSectionLabel}>{section.label}</Text>
                  </View>
                </Button>
              ))}
            </View>

            <View style={styles.customPromptsSection}>
              <SectionHeader
                title="Custom Prompts"
                description="Add your own custom prompts to the template"
              />

              {customPrompts.map((prompt, index) => (
                <View key={index} style={styles.customPromptItem}>
                  <Text style={styles.customPromptText}>{prompt}</Text>
                  <Button onPress={() => removeCustomPrompt(index)}>
                    <X size={20} color="#FF3B30" />
                  </Button>
                </View>
              ))}

              {showAddPrompt ? (
                <View style={styles.addPromptContainer}>
                  <TextInput
                    style={styles.addPromptInput}
                    placeholder="Enter custom prompt..."
                    placeholderTextColor="#999"
                    value={newPromptText}
                    onChangeText={setNewPromptText}
                    autoFocus
                    onSubmitEditing={addCustomPrompt}
                  />
                  <View style={styles.addPromptButtons}>
                    <Button
                      style={styles.addPromptButton}
                      onPress={() => {
                        setShowAddPrompt(false);
                        setNewPromptText('');
                      }}
                    >
                      <Text style={styles.addPromptButtonCancel}>Cancel</Text>
                    </Button>
                    <Button
                      style={[
                        styles.addPromptButton,
                        styles.addPromptButtonPrimary,
                      ]}
                      onPress={addCustomPrompt}
                    >
                      <Text style={styles.addPromptButtonAdd}>Add</Text>
                    </Button>
                  </View>
                </View>
              ) : (
                <Button
                  style={styles.addCustomPromptButton}
                  onPress={() => setShowAddPrompt(true)}
                >
                  <Plus size={20} color="#007AFF" />
                  <Text style={styles.addCustomPromptText}>Add Custom Prompt</Text>
                </Button>
              )}
            </View>

            <View style={styles.templatePreviewSection}>
              <Text style={styles.templateSectionTitle}>Preview</Text>
              <View style={styles.templatePreview}>
                <Text style={styles.templatePreviewText}>
                  Call with [CONTACT_NAME] - [DATE]{'\n\n'}
                </Text>
                {templateSections
                  .filter(s => s.enabled)
                  .map(section => (
                    <Text key={section.id} style={styles.templatePreviewText}>
                      {section.label}:{'\n\n'}
                    </Text>
                  ))}
                {customPrompts.map((prompt, index) => (
                  <Text key={`custom-${index}`} style={styles.templatePreviewText}>
                    {prompt}:{'\n\n'}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.templateFooter}>
            <Button
              style={styles.templateSaveButton}
              onPress={handleSaveTemplate}
            >
              <Text style={styles.templateSaveButtonText}>Save Template</Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showTagsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.templateModalContainer} edges={['top', 'bottom']}>
          <ModalHeader
            title="Manage Tags"
            onClose={handleCloseTags}
            onAction={handleSaveTags}
            leftIcon={<X size={24} color={COLORS.PRIMARY} />}
            rightIcon={<Save size={24} color={COLORS.PRIMARY} />}
          />

          <ScrollView style={styles.templateContent} showsVerticalScrollIndicator={false}>
            <SectionHeader
              title="Preset Tags"
              description="These tags will be available as quick options when adding call notes"
            />

            <View style={styles.tagsGrid}>
              {editableTags.map((tag, index) => (
                <View key={index} style={styles.editableTag}>
                  <Text style={styles.editableTagText}>{tag}</Text>
                  <Button onPress={() => removeTag(index)} style={styles.editableTagRemove}>
                    <X size={16} color="#FF3B30" />
                  </Button>
                </View>
              ))}

              {showAddTag ? (
                <View style={styles.addTagInputContainer}>
                  <TextInput
                    style={styles.addTagInput}
                    placeholder="Enter tag name..."
                    placeholderTextColor="#999"
                    value={newTagText}
                    onChangeText={setNewTagText}
                    onSubmitEditing={addTag}
                    onBlur={() => {
                      if (newTagText.trim()) {
                        addTag();
                      } else {
                        setShowAddTag(false);
                      }
                    }}
                    autoFocus
                  />
                </View>
              ) : (
                <Button
                  style={styles.addTagButton}
                  onPress={() => setShowAddTag(true)}
                >
                  <Plus size={16} color="#007AFF" />
                  <Text style={styles.addTagButtonText}>Add Tag</Text>
                </Button>
              )}
            </View>

            <View style={styles.tagPreviewSection}>
              <Text style={styles.templateSectionTitle}>Preview</Text>
              <Text style={styles.templateDescription}>
                These tags will appear as quick selection options in call notes
              </Text>
              <View style={styles.tagPreview}>
                {editableTags.map((tag, index) => (
                  <View key={index} style={styles.previewTag}>
                    <Text style={styles.previewTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.templateFooter}>
            <Button
              style={styles.templateSaveButton}
              onPress={handleSaveTags}
            >
              <Text style={styles.templateSaveButtonText}>Save Tags</Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.templateModalContainer} edges={['top', 'bottom']}>
          <View style={styles.templateHeader}>
            <Button
              onPress={() => {
                setShowPasswordModal(false);
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <X size={24} color="#007AFF" />
            </Button>

            <Text style={styles.templateTitle}>Set Password</Text>

            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            style={styles.passwordContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text style={styles.passwordDescription}>
              Set a password to protect your call notes. You'll need to enter this password to view
              notes.
            </Text>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordLabel}>Password</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordLabel}>Confirm Password</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {password && confirmPassword && password !== confirmPassword && (
              <Text style={styles.passwordError}>Passwords do not match</Text>
            )}

            <Button
              style={[
                styles.passwordSaveButton,
                (!password || !confirmPassword || password !== confirmPassword) &&
                  styles.passwordSaveButtonDisabled,
              ]}
              onPress={() => {
                if (password && confirmPassword && password === confirmPassword) {
                  updateNoteSettings({ passwordProtected: true, password });
                  setShowPasswordModal(false);
                  setPassword('');
                  setConfirmPassword('');
                  Alert.alert('Password Set', 'Your notes are now password protected.');
                }
              }}
              disabled={!password || !confirmPassword || password !== confirmPassword}
            >
              <Text
                style={[
                  styles.passwordSaveButtonText,
                  (!password || !confirmPassword || password !== confirmPassword) &&
                    styles.passwordSaveButtonTextDisabled,
                ]}
              >
                Set Password
              </Text>
            </Button>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showPremiumModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.premiumModalContainer} edges={['top', 'bottom']}>
          <View style={styles.premiumModalHeader}>
            <Button onPress={() => setShowPremiumModal(false)}>
              <X size={24} color="#007AFF" />
            </Button>

            <View style={styles.premiumTitleContainer}>
              <Crown size={24} color="#FFD700" />
              <Text style={styles.premiumModalTitle}>Premium Features</Text>
            </View>

            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.premiumModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.premiumHero}>
              <Crown size={48} color="#FFD700" />
              <Text style={styles.premiumHeroTitle}>Unlock Premium</Text>
              <Text style={styles.premiumHeroSubtitle}>
                Get access to advanced features and cloud storage
              </Text>
            </View>

            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Archive size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Export All Data</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Export contacts, notes, orders, and reminders in JSON format
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeature}>
                <FileText size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Cloud Backup</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Automatically save your logs to secure cloud storage
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeature}>
                <Users size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Unlimited Storage</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Store unlimited contacts, notes, and call history
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeature}>
                <SettingsIcon size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Password Protection</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Secure your call notes with password protection
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeature}>
                <BarChart3 size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Analytics & Reports</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Detailed insights, trends, and exportable reports
                  </Text>
                </View>
              </View>

              <View style={styles.premiumFeature}>
                <Star size={24} color="#007AFF" />
                <View style={styles.premiumFeatureContent}>
                  <Text style={styles.premiumFeatureTitle}>Priority Support</Text>
                  <Text style={styles.premiumFeatureDescription}>
                    Get priority customer support and feature requests
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.premiumStats}>
              <Text style={styles.premiumStatsTitle}>Your Current Usage</Text>
              <View style={styles.premiumStatsGrid}>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatNumber}>{contacts.length}</Text>
                  <Text style={styles.premiumStatLabel}>Contacts</Text>
                </View>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatNumber}>{notes.length}</Text>
                  <Text style={styles.premiumStatLabel}>Notes</Text>
                </View>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatNumber}>{orders.length}</Text>
                  <Text style={styles.premiumStatLabel}>Orders</Text>
                </View>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatNumber}>{reminders.length}</Text>
                  <Text style={styles.premiumStatLabel}>Reminders</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.premiumModalFooter}>
            <Button
              style={styles.premiumUpgradeButton}
              onPress={handleUpgradeToPremium}
            >
              <Crown size={20} color="#fff" />
              <Text style={styles.premiumUpgradeButtonText}>Upgrade to Premium</Text>
            </Button>
            <Button
              style={styles.premiumCancelButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.premiumCancelButtonText}>Maybe Later</Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showReportsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.reportsModalContainer} edges={['top', 'bottom']}>
          <View style={styles.reportsHeader}>
            <Button onPress={() => setShowReportsModal(false)}>
              <X size={24} color="#007AFF" />
            </Button>

            <View style={styles.reportsTitleContainer}>
              <BarChart3 size={24} color="#007AFF" />
              <Text style={styles.reportsModalTitle}>Analytics & Reports</Text>
            </View>

            <Button
              onPress={() => {
                const analytics = getAnalytics();
                const reportData = {
                  generatedAt: new Date().toISOString(),
                  summary: analytics.totalStats,
                  trends: analytics.trends,
                  topContacts: analytics.topContacts,
                  topTags: analytics.topTags,
                  weeklyActivity: analytics.weeklyActivity,
                };

                if (Platform.OS === 'web') {
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                } else {
                  Share.share({
                    message: JSON.stringify(reportData, null, 2),
                    title: 'Analytics Report',
                  });
                }
              }}
            >
              <Download size={24} color="#007AFF" />
            </Button>
          </View>

          <ScrollView style={styles.reportsContent} showsVerticalScrollIndicator={false}>
            {(() => {
              const analytics = getAnalytics();
              return (
                <>
                  {/* Overview Cards */}
                  <View style={styles.overviewSection}>
                    <Text style={styles.reportsSectionTitle}>Overview</Text>
                    <View style={styles.overviewGrid}>
                      <View style={styles.overviewCard}>
                        <Users size={24} color="#007AFF" />
                        <Text style={styles.overviewNumber}>{analytics.totalStats.contacts}</Text>
                        <Text style={styles.overviewLabel}>Total Contacts</Text>
                      </View>
                      <View style={styles.overviewCard}>
                        <FileText size={24} color="#34C759" />
                        <Text style={styles.overviewNumber}>{analytics.totalStats.notes}</Text>
                        <Text style={styles.overviewLabel}>Call Notes</Text>
                      </View>
                      <View style={styles.overviewCard}>
                        <Archive size={24} color="#FF9500" />
                        <Text style={styles.overviewNumber}>{analytics.totalStats.orders}</Text>
                        <Text style={styles.overviewLabel}>Orders</Text>
                      </View>
                      <View style={styles.overviewCard}>
                        <Calendar size={24} color="#FF3B30" />
                        <Text style={styles.overviewNumber}>{analytics.totalStats.reminders}</Text>
                        <Text style={styles.overviewLabel}>Reminders</Text>
                      </View>
                    </View>
                  </View>

                  {/* Trends */}
                  <View style={styles.trendsSection}>
                    <Text style={styles.reportsSectionTitle}>Weekly Trends</Text>
                    <View style={styles.trendsGrid}>
                      <View style={styles.trendCard}>
                        <View style={styles.trendHeader}>
                          <TrendingUp
                            size={20}
                            color={analytics.trends.notesGrowth >= 0 ? '#34C759' : '#FF3B30'}
                          />
                          <Text style={styles.trendTitle}>Notes Growth</Text>
                        </View>
                        <Text
                          style={[
                            styles.trendValue,
                            { color: analytics.trends.notesGrowth >= 0 ? '#34C759' : '#FF3B30' },
                          ]}
                        >
                          {analytics.trends.notesGrowth >= 0 ? '+' : ''}
                          {analytics.trends.notesGrowth}%
                        </Text>
                        <Text style={styles.trendSubtitle}>vs last week</Text>
                      </View>
                      <View style={styles.trendCard}>
                        <View style={styles.trendHeader}>
                          <TrendingUp
                            size={20}
                            color={analytics.trends.ordersGrowth >= 0 ? '#34C759' : '#FF3B30'}
                          />
                          <Text style={styles.trendTitle}>Orders Growth</Text>
                        </View>
                        <Text
                          style={[
                            styles.trendValue,
                            { color: analytics.trends.ordersGrowth >= 0 ? '#34C759' : '#FF3B30' },
                          ]}
                        >
                          {analytics.trends.ordersGrowth >= 0 ? '+' : ''}
                          {analytics.trends.ordersGrowth}%
                        </Text>
                        <Text style={styles.trendSubtitle}>vs last week</Text>
                      </View>
                    </View>
                  </View>

                  {/* Weekly Activity Chart */}
                  <View style={styles.chartSection}>
                    <Text style={styles.reportsSectionTitle}>Weekly Activity</Text>
                    <View style={styles.chartContainer}>
                      <View style={styles.chartGrid}>
                        {analytics.weeklyActivity.map((day, index) => {
                          const maxActivity = Math.max(
                            ...analytics.weeklyActivity.map(d => d.total)
                          );
                          return (
                            <View key={index} style={styles.chartColumn}>
                              <View style={styles.chartBars}>
                                <View
                                  style={[
                                    styles.chartBar,
                                    styles.chartBarNotes,
                                    {
                                      height: maxActivity > 0 ? (day.notes / maxActivity) * 120 : 0,
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.chartBar,
                                    styles.chartBarOrders,
                                    {
                                      height:
                                        maxActivity > 0 ? (day.orders / maxActivity) * 120 : 0,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.chartLabel}>{day.day}</Text>
                              <Text style={styles.chartValue}>{day.total}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, styles.chartBarNotes]} />
                          <Text style={styles.legendText}>Notes</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, styles.chartBarOrders]} />
                          <Text style={styles.legendText}>Orders</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Top Contacts */}
                  <View style={styles.topContactsSection}>
                    <Text style={styles.reportsSectionTitle}>Most Active Contacts</Text>
                    <View style={styles.topContactsList}>
                      {analytics.topContacts.map((item, index) => (
                        <View key={item.contact.id} style={styles.topContactItem}>
                          <View style={styles.topContactRank}>
                            <Text style={styles.topContactRankText}>{index + 1}</Text>
                          </View>
                          <View style={styles.topContactInfo}>
                            <Text style={styles.topContactName}>{item.contact.name}</Text>
                            <Text style={styles.topContactStats}>
                              {item.notes} notes • {item.orders} orders
                            </Text>
                          </View>
                          <Text style={styles.topContactTotal}>{item.totalActivity}</Text>
                        </View>
                      ))}
                      {analytics.topContacts.length === 0 && (
                        <Text style={styles.emptyState}>No contact activity yet</Text>
                      )}
                    </View>
                  </View>

                  {/* Top Tags */}
                  <View style={styles.topTagsSection}>
                    <Text style={styles.reportsSectionTitle}>Most Used Tags</Text>
                    <View style={styles.topTagsList}>
                      {analytics.topTags.map((item, index) => (
                        <View key={item.tag} style={styles.topTagItem}>
                          <View style={styles.topTagRank}>
                            <Text style={styles.topTagRankText}>{index + 1}</Text>
                          </View>
                          <View style={styles.topTagInfo}>
                            <Text style={styles.topTagName}>{item.tag}</Text>
                          </View>
                          <Text style={styles.topTagCount}>{item.count}</Text>
                        </View>
                      ))}
                      {analytics.topTags.length === 0 && (
                        <Text style={styles.emptyState}>No tags used yet</Text>
                      )}
                    </View>
                  </View>

                  {/* Export Options */}
                  <View style={styles.exportSection}>
                    <Text style={styles.reportsSectionTitle}>Export Options</Text>
                    <View style={styles.exportButtons}>
                      <Button
                        style={styles.exportButton}
                        onPress={() => {
                          const summaryText = `Call Notes Summary Report\n\nGenerated: ${new Date().toLocaleDateString()}\n\nOverview:\n• Total Contacts: ${analytics.totalStats.contacts}\n• Total Notes: ${analytics.totalStats.notes}\n• Total Orders: ${analytics.totalStats.orders}\n• Total Reminders: ${analytics.totalStats.reminders}\n\nRecent Activity (30 days):\n• Notes: ${analytics.recentStats.notes}\n• Orders: ${analytics.recentStats.orders}\n\nTop Contacts:\n${analytics.topContacts
                            .slice(0, 3)
                            .map(
                              (c, i) =>
                                `${i + 1}. ${c.contact.name} (${c.totalActivity} activities)`
                            )
                            .join('\n')}\n\nTop Tags:\n${analytics.topTags
                            .slice(0, 3)
                            .map((t, i) => `${i + 1}. ${t.tag} (${t.count} uses)`)
                            .join('\n')}`;

                          if (Platform.OS === 'web') {
                            const blob = new Blob([summaryText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `summary-report-${new Date().toISOString().split('T')[0]}.txt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          } else {
                            Share.share({
                              message: summaryText,
                              title: 'Summary Report',
                            });
                          }
                        }}
                      >
                        <FileText size={20} color="#007AFF" />
                        <Text style={styles.exportButtonText}>Export Summary</Text>
                      </Button>

                      <Button
                        style={styles.exportButton}
                        onPress={() => {
                          const detailedData = {
                            generatedAt: new Date().toISOString(),
                            analytics: analytics,
                            rawData: {
                              contacts: contacts.map(c => ({
                                id: c.id,
                                name: c.name,
                                phoneNumber: c.phoneNumber,
                              })),
                              notes: notes.map(n => ({
                                id: n.id,
                                contactId: n.contactId,
                                createdAt: n.createdAt,
                                tags: n.tags,
                              })),
                              orders: orders.map(o => ({
                                id: o.id,
                                contactId: o.contactId,
                                createdAt: o.createdAt,
                                status: o.status,
                              })),
                              reminders: reminders.map(r => ({
                                id: r.id,
                                contactId: r.contactId,
                                createdAt: r.createdAt,
                                title: r.title,
                              })),
                            },
                          };

                          if (Platform.OS === 'web') {
                            const blob = new Blob([JSON.stringify(detailedData, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `detailed-report-${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          } else {
                            Share.share({
                              message: JSON.stringify(detailedData, null, 2),
                              title: 'Detailed Analytics Report',
                            });
                          }
                        }}
                      >
                        <BarChart3 size={20} color="#007AFF" />
                        <Text style={styles.exportButtonText}>Export Detailed</Text>
                      </Button>
                    </View>
                  </View>
                </>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const commonStyles = {
  card: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    ...SHADOW.SMALL,
  },
  cardWithPadding: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.LG,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dashedBorder: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed' as const,
  },
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  pill: {
    borderRadius: BORDER_RADIUS.ROUND,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  scrollContent: {
    paddingVertical: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  section: {
    marginBottom: SPACING.XXL,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.LG,
  },
  settingsGroup: {
    ...commonStyles.card,
  },
  settingItem: {
    ...commonStyles.rowCenter,
    padding: SPACING.LG,
    ...commonStyles.divider,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  destructiveIconContainer: {
    backgroundColor: '#fff0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
  destructiveTitle: {
    color: COLORS.DESTRUCTIVE,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  settingSubtitleDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
  infoCard: {
    ...commonStyles.cardWithPadding,
    marginBottom: SPACING.MD,
    ...SHADOW.SMALL,
  },
  infoHeader: {
    ...commonStyles.rowCenter,
    marginBottom: SPACING.SM,
    gap: SPACING.SM,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  infoDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  templateModalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  templateContent: {
    flex: 1,
  },
  templateSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.XXL,
    marginBottom: SPACING.SM,
    marginHorizontal: SPACING.XL,
  },
  templateDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.XL,
    lineHeight: 20,
  },
  templateSections: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  templateSectionItem: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.LG,
    ...commonStyles.divider,
  },
  templateSectionLeft: {
    ...commonStyles.rowCenter,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  templateSectionLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  customPromptsSection: {
    marginTop: SPACING.SM,
  },
  customPromptItem: {
    ...commonStyles.rowCenter,
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.SM,
    padding: 14,
    borderRadius: BORDER_RADIUS.MD,
  },
  customPromptText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  addCustomPromptButton: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    padding: 14,
    borderRadius: BORDER_RADIUS.MD,
    ...commonStyles.dashedBorder,
  },
  addCustomPromptText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
  },
  addPromptContainer: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    padding: 14,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  addPromptInput: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    ...commonStyles.divider,
    paddingBottom: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  addPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.MD,
  },
  addPromptButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  addPromptButtonPrimary: {
    backgroundColor: COLORS.PRIMARY,
  },
  addPromptButtonCancel: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  addPromptButtonAdd: {
    ...commonStyles.primaryButtonText,
    fontSize: 15,
  },
  templatePreviewSection: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  templatePreview: {
    ...commonStyles.cardWithPadding,
  },
  templatePreviewText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  templateFooter: {
    padding: SPACING.XL,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.XL,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  templateSaveButton: {
    ...commonStyles.primaryButton,
  },
  templateSaveButtonText: {
    ...commonStyles.primaryButtonText,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.XXL,
  },
  editableTag: {
    ...commonStyles.rowCenter,
    ...commonStyles.pill,
    backgroundColor: COLORS.PRIMARY,
    gap: 6,
  },
  editableTagText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  editableTagRemove: {
    padding: 2,
  },
  addTagButton: {
    ...commonStyles.rowCenter,
    ...commonStyles.pill,
    backgroundColor: '#f0f4f8',
    gap: 6,
    ...commonStyles.dashedBorder,
  },
  addTagButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  addTagInputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.ROUND,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 4,
  },
  addTagInput: {
    fontSize: 14,
    color: '#333',
    minWidth: 80,
    paddingVertical: 4,
  },
  tagPreviewSection: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  tagPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    ...commonStyles.cardWithPadding,
  },
  previewTag: {
    ...commonStyles.pill,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.LG,
    paddingVertical: 6,
  },
  previewTagText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContent: {
    flex: 1,
    padding: SPACING.XL,
  },
  passwordDescription: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: SPACING.XXXL,
  },
  passwordInputContainer: {
    marginBottom: SPACING.XL,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.SM,
  },
  passwordInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  passwordError: {
    color: COLORS.DESTRUCTIVE,
    fontSize: 14,
    marginTop: -SPACING.MD,
    marginBottom: SPACING.XL,
  },
  passwordSaveButton: {
    ...commonStyles.primaryButton,
    marginTop: SPACING.XXXL,
  },
  passwordSaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  passwordSaveButtonText: {
    ...commonStyles.primaryButtonText,
  },
  passwordSaveButtonTextDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
  premiumSectionHeader: {
    ...commonStyles.rowCenter,
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.LG,
    gap: SPACING.SM,
  },
  upgradeButton: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.GOLD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
    borderRadius: SPACING.LG,
    marginLeft: 'auto',
    gap: 4,
  },
  upgradeButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  settingsGroupDisabled: {
    opacity: 0.6,
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: SPACING.LG,
    right: SPACING.LG,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  premiumOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GOLD,
  },
  premiumOverlaySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  premiumModalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  premiumModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  premiumTitleContainer: {
    ...commonStyles.rowCenter,
    gap: SPACING.SM,
  },
  premiumModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  premiumModalContent: {
    flex: 1,
  },
  premiumHero: {
    alignItems: 'center',
    padding: SPACING.XXXL,
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    marginTop: SPACING.LG,
    borderRadius: SPACING.LG,
    gap: SPACING.MD,
  },
  premiumHeroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  premiumHeroSubtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  premiumFeatures: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    marginTop: SPACING.LG,
    borderRadius: SPACING.LG,
    padding: SPACING.XL,
    gap: SPACING.XL,
  },
  premiumFeature: {
    ...commonStyles.rowCenter,
    alignItems: 'flex-start',
    gap: SPACING.LG,
  },
  premiumFeatureContent: {
    flex: 1,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  premiumStats: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    marginTop: SPACING.LG,
    marginBottom: SPACING.XL,
    borderRadius: SPACING.LG,
    padding: SPACING.XL,
  },
  premiumStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  premiumStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  premiumStat: {
    alignItems: 'center',
    gap: 4,
  },
  premiumStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  premiumStatLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  premiumModalFooter: {
    padding: SPACING.XL,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.XL,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: SPACING.MD,
  },
  premiumUpgradeButton: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.GOLD,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.LG,
    justifyContent: 'center',
    gap: SPACING.SM,
  },
  premiumUpgradeButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  premiumCancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  premiumCancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: '500',
  },
  reportsModalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  reportsTitleContainer: {
    ...commonStyles.rowCenter,
    gap: SPACING.SM,
  },
  reportsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  reportsContent: {
    flex: 1,
  },
  reportsSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.XL,
  },
  overviewSection: {
    marginTop: SPACING.XL,
    marginBottom: SPACING.XXL,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
    marginHorizontal: SPACING.LG,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.WHITE,
    borderRadius: SPACING.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    gap: SPACING.SM,
    ...SHADOW.MEDIUM,
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  trendsSection: {
    marginBottom: SPACING.XXL,
  },
  trendsGrid: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginHorizontal: SPACING.LG,
  },
  trendCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: SPACING.LG,
    padding: SPACING.LG,
    ...SHADOW.MEDIUM,
  },
  trendHeader: {
    ...commonStyles.rowCenter,
    gap: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  trendTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  chartSection: {
    marginBottom: SPACING.XXL,
  },
  chartContainer: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    borderRadius: SPACING.LG,
    padding: SPACING.XL,
    ...SHADOW.MEDIUM,
  },
  chartGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginBottom: SPACING.LG,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: SPACING.SM,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  chartBarNotes: {
    backgroundColor: COLORS.PRIMARY,
  },
  chartBarOrders: {
    backgroundColor: COLORS.WARNING,
  },
  chartLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 10,
    color: COLORS.TEXT_TERTIARY,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.XL,
  },
  legendItem: {
    ...commonStyles.rowCenter,
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  topContactsSection: {
    marginBottom: SPACING.XXL,
  },
  topContactsList: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    borderRadius: SPACING.LG,
    overflow: 'hidden',
    ...SHADOW.MEDIUM,
  },
  topContactItem: {
    ...commonStyles.rowCenter,
    padding: SPACING.LG,
    ...commonStyles.divider,
  },
  topContactRank: {
    width: 32,
    height: 32,
    borderRadius: SPACING.LG,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  topContactRankText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  topContactInfo: {
    flex: 1,
  },
  topContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  topContactStats: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  topContactTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  topTagsSection: {
    marginBottom: SPACING.XXL,
  },
  topTagsList: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.LG,
    borderRadius: SPACING.LG,
    overflow: 'hidden',
    ...SHADOW.MEDIUM,
  },
  topTagItem: {
    ...commonStyles.rowCenter,
    padding: SPACING.LG,
    ...commonStyles.divider,
  },
  topTagRank: {
    width: 32,
    height: 32,
    borderRadius: SPACING.LG,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  topTagRankText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  topTagInfo: {
    flex: 1,
  },
  topTagName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  topTagCount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  exportSection: {
    marginBottom: SPACING.XXXL,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginHorizontal: SPACING.LG,
  },
  exportButton: {
    flex: 1,
    ...commonStyles.rowCenter,
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    gap: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    ...SHADOW.MEDIUM,
  },
  exportButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.TEXT_TERTIARY,
    fontSize: 14,
    fontStyle: 'italic',
    padding: SPACING.XL,
  },
});
