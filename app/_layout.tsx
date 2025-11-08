import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ContactsProvider } from '@/hooks/contacts-store';
import IncomingCallModal from '@/components/IncomingCallModal';
import ActiveCallModal from '@/components/ActiveCallModal';
import NoteModal from '@/components/NoteModal';
import ReminderSuggestionModal from '@/components/ReminderSuggestionModal';
import CustomSplashScreen from '@/components/SplashScreen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Keep the splash screen visible while we prepare the app
        await SplashScreen.preventAutoHideAsync();

        // Simulate app initialization time (you can add actual initialization logic here)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Hide the native splash screen
        await SplashScreen.hideAsync();

        // Show our custom splash screen for a bit longer
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsReady(true);
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return <CustomSplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ContactsProvider>
        <GestureHandlerRootView style={styles.container}>
          <RootLayoutNav />
          <IncomingCallModal />
          <ActiveCallModal />
          <NoteModal />
          <ReminderSuggestionModal />
        </GestureHandlerRootView>
      </ContactsProvider>
    </QueryClientProvider>
  );
}
