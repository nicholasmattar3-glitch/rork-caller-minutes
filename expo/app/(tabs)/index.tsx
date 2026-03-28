import React, { useMemo, useState, ComponentType } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Search, Calendar } from 'lucide-react-native';
import { useContacts } from '@/hooks/contacts-store';
import ContactCard from '@/components/ContactCard';
import NoteModal from '@/components/NoteModal';
import CallGroupManager from '@/components/CallGroupManager';
import { GroupByOption } from '@/types/contact';
import Button from '@/components/Button';

type ViewMode = 'contacts' | 'calls';

const COLORS = {
  background: '#F2F2F7',
  white: '#fff',
  black: '#000',
  primary: '#007AFF',
  secondary: '#8E8E93',
  border: '#C6C6C8',
  icon: '#C7C7CC',
  text: '#333',
  placeholder: '#999',
};

const SPACING = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 32,
};

export default function ContactsScreen() {
  const { contacts, notes } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('contacts');
  const [groupBy, setGroupBy] = useState<GroupByOption>('day');

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      contact => contact.name.toLowerCase().includes(query) || contact.phoneNumber.includes(query)
    );
  }, [contacts, searchQuery]);

  const sectionedContacts = useMemo(() => {
    if (!filteredContacts.length) return [];

    const sorted = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name));
    const sections: { title: string; data: typeof contacts }[] = [];

    sorted.forEach(contact => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      let section = sections.find(s => s.title === firstLetter);

      if (!section) {
        section = { title: firstLetter, data: [] };
        sections.push(section);
      }

      section.data.push(contact);
    });

    return sections.sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredContacts]);

  const TabButton = ({
    mode,
    icon: Icon,
    label,
  }: {
    mode: ViewMode;
    icon: ComponentType<{ size: number; color: string }>;
    label: string;
  }) => {
    const isActive = viewMode === mode;
    return (
      <Button
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setViewMode(mode)}
      >
        <Icon size={18} color={isActive ? COLORS.primary : COLORS.secondary} />
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
      </Button>
    );
  };

  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={16} color={COLORS.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const ContactsView = () => (
    <>
      <SearchBar />
      {sectionedContacts.length > 0 ? (
        <SectionList
          sections={sectionedContacts}
          renderItem={({ item }) => <ContactCard contact={item} />}
          renderSectionHeader={({ section }: { section: { title: string } }) => {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            );
          }}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Users size={48} color={COLORS.icon} />
          <Text style={styles.emptyTitle}>No Contacts</Text>
          <Text style={styles.emptyText}>
            Go to Settings to add contacts manually or import from your device
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <TabButton mode="contacts" icon={Users} label="Contacts" />
        <TabButton mode="calls" icon={Calendar} label="Call History" />
      </View>

      {viewMode === 'contacts' ? (
        <ContactsView />
      ) : (
        <CallGroupManager notes={notes} groupBy={groupBy} onGroupByChange={setGroupBy} />
      )}

      <NoteModal />
    </SafeAreaView>
  );
}

const commonStyles = {
  flex1Background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionPadding: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  bottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  boldText: {
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
};

const styles = StyleSheet.create({
  container: commonStyles.flex1Background,
  list: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    ...commonStyles.sectionPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  sectionHeaderText: {
    fontSize: 16,
    ...commonStyles.boldText,
  },
  emptyContainer: {
    ...commonStyles.flex1Background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    ...commonStyles.boldText,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    backgroundColor: COLORS.background,
    ...commonStyles.sectionPadding,
    ...commonStyles.bottomBorder,
  },
  searchInputContainer: {
    ...commonStyles.rowCenter,
    paddingHorizontal: 12,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  tabContainer: {
    ...commonStyles.rowCenter,
    backgroundColor: COLORS.background,
    ...commonStyles.sectionPadding,
    ...commonStyles.bottomBorder,
  },
  tab: {
    flex: 1,
    ...commonStyles.rowCenter,
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
