import React, { useMemo, ReactNode, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight, Calendar, Clock, Package, Bell } from 'lucide-react-native';
import { Reminder, Order } from '@/types/contact';

export type GroupByOption = 'none' | 'day' | 'week' | 'month' | 'year';

interface GroupedItem {
  id: string;
  title: string;
  date: Date;
  items: (Reminder | Order)[];
  type: 'time-based';
}

interface GroupedViewProps {
  items: (Reminder | Order)[];
  groupBy: GroupByOption;
  renderItem: (item: Reminder | Order) => ReactNode;
  emptyMessage?: string;
  itemType: 'reminder' | 'order';
}

export default function GroupedView({
  items,
  groupBy,
  renderItem,
  emptyMessage,
  itemType,
}: GroupedViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return null;
    }

    const groups: Map<string, GroupedItem> = new Map();
    const now = new Date();

    items.forEach(item => {
      let date: Date;
      if ('dueDate' in item) {
        // It's a Reminder
        date = new Date(item.dueDate);
      } else {
        // It's an Order - use reminderDate if available, otherwise createdAt
        date = item.reminderDate ? new Date(item.reminderDate) : new Date(item.createdAt);
      }

      let groupKey: string;
      let groupTitle: string;

      switch (groupBy) {
        case 'day': {
          groupKey = date.toDateString();
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          if (date.toDateString() === today.toDateString()) {
            groupTitle = 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupTitle = 'Yesterday';
          } else if (date.toDateString() === tomorrow.toDateString()) {
            groupTitle = 'Tomorrow';
          } else {
            groupTitle = date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            });
          }
          break;
        }
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          groupKey = `${weekStart.toDateString()}-${weekEnd.toDateString()}`;

          const currentWeekStart = new Date(now);
          currentWeekStart.setDate(now.getDate() - now.getDay());

          if (weekStart.toDateString() === currentWeekStart.toDateString()) {
            groupTitle = 'This Week';
          } else {
            groupTitle = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          }
          break;
        }
        case 'month': {
          groupKey = `${date.getFullYear()}-${date.getMonth()}`;
          const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

          if (groupKey === currentMonth) {
            groupTitle = 'This Month';
          } else {
            groupTitle = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
          break;
        }
        case 'year':
          groupKey = date.getFullYear().toString();
          groupTitle = date.getFullYear().toString();
          break;

        default:
          groupKey = date.toDateString();
          groupTitle = date.toLocaleDateString();
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          title: groupTitle,
          date: date,
          items: [],
          type: 'time-based',
        });
      }

      groups.get(groupKey)?.items.push(item);
    });

    // Sort groups by date
    const sortedGroups = Array.from(groups.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Sort items within each group
    sortedGroups.forEach(group => {
      group.items.sort((a, b) => {
        const dateA =
          'dueDate' in a
            ? new Date(a.dueDate)
            : a.reminderDate
              ? new Date(a.reminderDate)
              : new Date(a.createdAt);
        const dateB =
          'dueDate' in b
            ? new Date(b.dueDate)
            : b.reminderDate
              ? new Date(b.reminderDate)
              : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    });

    return sortedGroups;
  }, [items, groupBy]);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {itemType === 'reminder' ? (
          <Bell size={48} color="#ccc" />
        ) : (
          <Package size={48} color="#ccc" />
        )}
        <Text style={styles.emptyText}>{emptyMessage || `No ${itemType}s yet`}</Text>
      </View>
    );
  }

  if (groupBy === 'none' || !groupedItems) {
    return (
      <View style={styles.ungroupedContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.itemContainer}>
            {renderItem(item)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groupedItems.map(group => {
        const isExpanded = expandedGroups.has(group.id);
        const itemCount = group.items.length;

        return (
          <View key={group.id} style={styles.groupContainer}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroup(group.id)}>
              <View style={styles.groupHeaderLeft}>
                {isExpanded ? (
                  <ChevronDown size={20} color="#666" />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              </View>
              <View style={styles.groupHeaderRight}>
                {groupBy === 'day' && <Calendar size={16} color="#8E8E93" />}
                {groupBy === 'week' && <Calendar size={16} color="#8E8E93" />}
                {groupBy === 'month' && <Calendar size={16} color="#8E8E93" />}
                {groupBy === 'year' && <Calendar size={16} color="#8E8E93" />}
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.groupContent}>
                {group.items.map(item => (
                  <View key={item.id} style={styles.groupedItemContainer}>
                    {renderItem(item)}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ungroupedContainer: {
    flex: 1,
    gap: 12,
  },
  itemContainer: {
    marginBottom: 12,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  groupContent: {
    marginTop: 8,
    gap: 8,
  },
  groupedItemContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
