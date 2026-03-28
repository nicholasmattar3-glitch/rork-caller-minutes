import { Tabs } from 'expo-router';
import { FileText, Settings, ShoppingBag, Bell, Globe, Route } from 'lucide-react-native';
import React from 'react';
import Colors from '@/constants/colors';
import { useContacts } from '@/hooks/contacts-store';

function TabsContent() {
  const { premiumSettings } = useContacts();
  const showShopifyTab = premiumSettings?.showShopifyTab ?? false;
  const showPlanRunTab = premiumSettings?.showPlanRunTab ?? false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="shopify"
        options={{
          title: 'Website',
          tabBarIcon: ({ color }) => <Globe color={color} size={24} />,
          href: showShopifyTab ? '/shopify' : null,
        }}
      />
      <Tabs.Screen
        name="plan-run"
        options={{
          title: 'Plan Run',
          tabBarIcon: ({ color }) => <Route color={color} size={24} />,
          href: showPlanRunTab ? '/plan-run' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabsContent />;
}
