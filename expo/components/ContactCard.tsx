import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  PanResponder,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { ChevronRight, User, CreditCard, X, Edit3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Contact } from '@/types/contact';
import { useContacts } from '@/hooks/contacts-store';

interface ContactCardProps {
  contact: Contact;
}

export default function ContactCard({ contact }: ContactCardProps) {
  const { openCallNoteModal, updateContact } = useContacts();
  const [showBusinessCard, setShowBusinessCard] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Business card dimensions
  const BUSINESS_CARD_WIDTH = screenWidth * 0.85;
  const BUSINESS_CARD_HEIGHT = BUSINESS_CARD_WIDTH * 0.63; // Standard business card ratio (3.5:2.2)

  // Animation values for business card
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Calculate center position
  const centerX = (screenWidth - BUSINESS_CARD_WIDTH) / 2;
  const centerY = (screenHeight - BUSINESS_CARD_HEIGHT) / 2;

  // Pan responder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Add slight scale and rotation on touch
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1.05,
            useNativeDriver: true,
          }),
          Animated.spring(rotation, {
            toValue: (Math.random() - 0.5) * 0.1, // Random slight rotation
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update position based on gesture
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });

        // Add dynamic rotation based on movement
        const rotationValue = gestureState.dx * 0.0005;
        rotation.setValue(rotationValue);
      },
      onPanResponderRelease: () => {
        // Snap back to center with spring animation
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(rotation, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  // Reset animation values when modal opens
  const handleShowBusinessCard = () => {
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    rotation.setValue(0);
    setShowBusinessCard(true);
  };

  const handleContactPress = () => {
    const options: any[] = [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Create Call Note',
        onPress: () => openCallNoteModal(contact),
      },
    ];

    if (contact.businessCardImage) {
      options.splice(1, 0, {
        text: 'View Business Card',
        onPress: () => handleShowBusinessCard(),
      });
    }

    Alert.alert(contact.name, contact.phoneNumber, options);
  };

  const showBusinessCardEditOptions = () => {
    Alert.alert('Business Card Options', 'What would you like to do?', [
      {
        text: 'Change Business Card',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (status !== 'granted') {
            Alert.alert(
              'Permission Denied',
              'We need camera roll permissions to attach business cards.'
            );
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            base64: false,
          });

          if (!result.canceled && result.assets[0]) {
            updateContact({
              id: contact.id,
              updates: { businessCardImage: result.assets[0].uri },
            });
            setShowBusinessCard(false);
            // Reset animation values
            pan.setValue({ x: 0, y: 0 });
            scale.setValue(1);
            rotation.setValue(0);
          }
        },
      },
      {
        text: 'Take New Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();

          if (status !== 'granted') {
            Alert.alert(
              'Permission Denied',
              'We need camera permissions to take photos of business cards.'
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
            base64: false,
          });

          if (!result.canceled && result.assets[0]) {
            updateContact({
              id: contact.id,
              updates: { businessCardImage: result.assets[0].uri },
            });
            setShowBusinessCard(false);
            // Reset animation values
            pan.setValue({ x: 0, y: 0 });
            scale.setValue(1);
            rotation.setValue(0);
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handleContactPress}>
        <View style={styles.avatar}>
          <User size={24} color="#666" />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{contact.name}</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phone}>{contact.phoneNumber}</Text>
            {contact.businessCardImage && (
              <View style={styles.businessCardBadge}>
                <CreditCard size={12} color="#007AFF" />
                <Text style={styles.businessCardText}>Card</Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={20} color="#C7C7CC" />
      </TouchableOpacity>

      {/* Business Card Viewer Modal */}
      <Modal
        visible={showBusinessCard}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowBusinessCard(false);
          // Reset animation values
          pan.setValue({ x: 0, y: 0 });
          scale.setValue(1);
          rotation.setValue(0);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowBusinessCard(false);
              // Reset animation values
              pan.setValue({ x: 0, y: 0 });
              scale.setValue(1);
              rotation.setValue(0);
            }}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>

          {/* Edit Business Card Button */}
          <TouchableOpacity style={styles.editButton} onPress={() => showBusinessCardEditOptions()}>
            <Edit3 size={20} color="#fff" />
          </TouchableOpacity>

          {/* Interactive Business Card */}
          <Animated.View
            style={[
              styles.businessCardContainer,
              {
                left: centerX,
                top: centerY,
                width: BUSINESS_CARD_WIDTH,
                height: BUSINESS_CARD_HEIGHT,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale },
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-57.2958deg', '57.2958deg'], // Convert radians to degrees
                    }),
                  },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {contact.businessCardImage && (
              <Image
                source={{ uri: contact.businessCardImage }}
                style={styles.businessCardImage}
                resizeMode="cover"
              />
            )}

            {/* Card shadow/border effect */}
            <View style={styles.cardShadow} />
          </Animated.View>

          <View style={styles.modalFooter}>
            <Text style={styles.modalTitle}>{contact.name}&apos;s Business Card</Text>
            <Text style={styles.modalSubtitle}>Drag to move • Release to snap back</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
    marginBottom: 2,
  },
  phone: {
    fontSize: 15,
    color: '#8E8E93',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#007AFF15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  businessCardText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  editButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessCardContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  businessCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
