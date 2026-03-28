import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, PhoneOff, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useContacts } from '@/hooks/contacts-store';

export default function IncomingCallModal() {
  const { incomingCall, answerCall, declineCall } = useContacts();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (incomingCall) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [incomingCall, pulseAnim]);

  if (!incomingCall) return null;

  const handleAnswer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    answerCall();
  };

  const handleDecline = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    declineCall();
  };

  return (
    <Modal visible={true} animationType="fade" statusBarTranslucent>
      <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.incomingText}>
            {incomingCall.direction === 'inbound' ? 'Incoming call' : 'Calling...'}
          </Text>

          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <User size={60} color="#fff" />
            </View>
          </Animated.View>

          <Text style={styles.name}>{incomingCall.contact.name}</Text>
          <Text style={styles.phone}>{incomingCall.contact.phoneNumber}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
              <PhoneOff size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.answerButton} onPress={handleAnswer}>
              <Phone size={28} color="#fff" />
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
  incomingText: {
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
    marginBottom: 80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  declineButton: {
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
  answerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
