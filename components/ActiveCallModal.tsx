import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PhoneOff, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useContacts } from '@/hooks/contacts-store';

export default function ActiveCallModal() {
  const { activeCall, endCall } = useContacts();
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (activeCall) {
      const interval = setInterval(() => {
        const duration = Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    endCall();
  };

  if (!activeCall) return null;

  return (
    <Modal visible={true} animationType="fade" statusBarTranslucent>
      <LinearGradient colors={['#2d5a27', '#4a7c59']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.statusText}>Call in progress</Text>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={60} color="#fff" />
            </View>
          </View>

          <Text style={styles.name}>{activeCall.contact.name}</Text>
          <Text style={styles.phone}>{activeCall.contact.phoneNumber}</Text>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
              <PhoneOff size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  name: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  phone: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 16,
  },
  duration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 60,
  },
  actions: {
    alignItems: 'center',
  },
  endButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
