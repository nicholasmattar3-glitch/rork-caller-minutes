import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import {
  X,
  UserPlus,
  User,
  Phone,
  Search,
  Plus,
  Camera,
  Image as ImageIcon,
  Maximize2,
  CreditCard,
  Edit3,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useContacts } from '@/hooks/contacts-store';
import { Contact } from '@/types/contact';
import BusinessCardEditor from './BusinessCardEditor';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: { name: string; phoneNumber: string }) => void;
  onSelectContact?: (contact: Contact) => void;
}

export default function AddContactModal({
  visible,
  onClose,
  onAdd,
  onSelectContact,
}: AddContactModalProps) {
  const { contacts, openCallNoteModal, updateContact } = useContacts();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [businessCardImage, setBusinessCardImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingBusinessCard, setViewingBusinessCard] = useState<string | null>(null);
  const [viewingContactName, setViewingContactName] = useState<string>('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingBusinessCard, setEditingBusinessCard] = useState<string | null>(null);
  const [showBusinessCardOptions, setShowBusinessCardOptions] = useState<string | null>(null);
  const [showCardEditor, setShowCardEditor] = useState(false);
  const [cardEditorImage, setCardEditorImage] = useState<string | null>(null);
  const [cardEditorContactName, setCardEditorContactName] = useState<string>('');

  // Get dimensions inside component
  const { width, height } = Dimensions.get('window');

  // Animation values for radiating effect from bottom-left corner
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(-width * 0.45)).current;
  const translateYAnim = useRef(new Animated.Value(height * 0.45)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Business card animation values for interactive movement
  const cardPan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const lastGestureRef = useRef({ vx: 0, vy: 0 });

  useEffect(() => {
    if (visible) {
      // Start animation immediately with no delay for seamless transition
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateXAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      scaleAnim.setValue(0);
      translateXAnim.setValue(-width * 0.45);
      translateYAnim.setValue(height * 0.45);
      opacityAnim.setValue(0);
    }
  }, [visible, width, height, scaleAnim, translateXAnim, translateYAnim, opacityAnim]);

  const handleAdd = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    onAdd({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      businessCardImage: businessCardImage || undefined,
    } as any);

    setName('');
    setPhoneNumber('');
    setBusinessCardImage(null);
    setShowAddForm(false);
    setEditingContactId(null);
    setEditingBusinessCard(null);
    onClose();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to attach business cards.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setCardEditorImage(result.assets[0].uri);
      setCardEditorContactName('');
      setShowCardEditor(true);
    }
  };

  const takePhoto = async () => {
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
      setCardEditorImage(result.assets[0].uri);
      setCardEditorContactName('');
      setShowCardEditor(true);
    }
  };

  const handleClose = () => {
    // Animate closing back to corner with smooth contraction
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: -width * 0.45,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: height * 0.45,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setName('');
      setPhoneNumber('');
      setSearchQuery('');
      setBusinessCardImage(null);
      setShowAddForm(false);
      setEditingContactId(null);
      setEditingBusinessCard(null);
      setShowBusinessCardOptions(null);
      onClose();
    });
  };

  const handleContactSelect = (contact: Contact) => {
    if (onSelectContact) {
      onSelectContact(contact);
      handleClose();
    } else {
      // Close modal first, then open call note modal after animation completes
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: -width * 0.45,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: height * 0.45,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setName('');
        setPhoneNumber('');
        setSearchQuery('');
        setBusinessCardImage(null);
        setShowAddForm(false);
        setEditingContactId(null);
        setEditingBusinessCard(null);
        setShowBusinessCardOptions(null);
        onClose();
        // Open call note modal after the close animation completes
        setTimeout(() => {
          openCallNoteModal(contact);
        }, 100);
      });
    }
  };

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery)
  );

  const handleBusinessCardView = (contact: Contact) => {
    if (contact.businessCardImage) {
      setViewingBusinessCard(contact.businessCardImage);
      setViewingContactName(contact.name);
      setShowImageViewer(true);
    }
  };

  const handleAddBusinessCard = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditingBusinessCard(contact.businessCardImage || null);
  };

  const showBusinessCardEditOptions = (contact: Contact) => {
    setShowBusinessCardOptions(null);
    Alert.alert('Business Card Options', 'What would you like to do?', [
      {
        text: 'Change Business Card',
        onPress: () => {
          setEditingContactId(contact.id);
          setEditingBusinessCard(contact.businessCardImage || null);
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
            setCardEditorImage(result.assets[0].uri);
            setCardEditorContactName(contact.name);
            setEditingContactId(contact.id);
            setShowCardEditor(true);
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const saveBusinessCard = async () => {
    if (editingContactId && editingBusinessCard) {
      updateContact({
        id: editingContactId,
        updates: { businessCardImage: editingBusinessCard },
      });
    }
    setEditingContactId(null);
    setEditingBusinessCard(null);
  };

  const cancelBusinessCardEdit = () => {
    setEditingContactId(null);
    setEditingBusinessCard(null);
    setShowBusinessCardOptions(null);
  };

  // Business card pan responder for interactive movement with physics
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        console.log('Starting drag');
        setIsDragging(true);
        // Stop any ongoing animations
        cardPan.stopAnimation();
        cardPan.extractOffset();

        // Add slight scale and dynamic rotation when starting drag
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1.05,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update card position with smooth movement
        cardPan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });

        // Dynamic rotation based on horizontal movement with limits
        const rotationValue = Math.max(-20, Math.min(20, gestureState.dx * 0.08));
        cardRotation.setValue(rotationValue);

        // Store velocity for momentum
        lastGestureRef.current = { vx: gestureState.vx, vy: gestureState.vy };
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('Releasing drag with velocity:', gestureState.vx, gestureState.vy);
        setIsDragging(false);
        cardPan.flattenOffset();

        // Calculate momentum based on velocity
        const velocity = Math.sqrt(gestureState.vx ** 2 + gestureState.vy ** 2);

        // If velocity is high, add momentum before snapping back
        if (velocity > 0.5) {
          // First, continue movement with momentum
          Animated.sequence([
            Animated.parallel([
              Animated.decay(cardPan, {
                velocity: { x: gestureState.vx * 2, y: gestureState.vy * 2 },
                deceleration: 0.985,
                useNativeDriver: true,
              }),
              Animated.timing(cardRotation, {
                toValue: gestureState.vx * 0.2,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
            // Then snap back to center with spring physics
            Animated.parallel([
              Animated.spring(cardPan, {
                toValue: { x: 0, y: 0 },
                tension: 40,
                friction: 7,
                useNativeDriver: true,
              }),
              Animated.spring(cardScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.spring(cardRotation, {
                toValue: 0,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        } else {
          // Direct snap back for slow movements
          Animated.parallel([
            Animated.spring(cardPan, {
              toValue: { x: 0, y: 0 },
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(cardRotation, {
              toValue: 0,
              tension: 80,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const pickImageForContact = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to attach business cards.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setCardEditorImage(result.assets[0].uri);
      const contact = contacts.find(c => c.id === editingContactId);
      setCardEditorContactName(contact?.name || '');
      setShowCardEditor(true);
    }
  };

  const takePhotoForContact = async () => {
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
      setCardEditorImage(result.assets[0].uri);
      const contact = contacts.find(c => c.id === editingContactId);
      setCardEditorContactName(contact?.name || '');
      setShowCardEditor(true);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    console.log('Rendering contact:', item.name, 'businessCardImage:', item.businessCardImage);

    return (
      <View style={styles.contactItemContainer}>
        {/* Edit Business Card Button - only show if business card exists */}
        {item.businessCardImage && (
          <TouchableOpacity
            style={styles.editBusinessCardButton}
            onPress={() => showBusinessCardEditOptions(item)}
            activeOpacity={0.7}
          >
            <Edit3 size={16} color="#007AFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleContactSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.contactAvatar}>
            <User size={20} color="#666" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            <View style={styles.phoneContainer}>
              <Phone size={12} color="#999" />
              <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
              {item.businessCardImage && (
                <View style={styles.businessCardBadge}>
                  <CreditCard size={10} color="#007AFF" />
                  <Text style={styles.businessCardBadgeText}>Card</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Add Business Card Button - only show if no business card exists */}
        {!item.businessCardImage && (
          <TouchableOpacity
            style={styles.addBusinessCardButton}
            onPress={() => handleAddBusinessCard(item)}
            activeOpacity={0.7}
          >
            <Plus size={18} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Business Card Thumbnail */}
        {item.businessCardImage && (
          <TouchableOpacity
            style={styles.businessCardThumbnail}
            onPress={() => handleBusinessCardView(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.businessCardImage }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            <View style={styles.thumbnailOverlay}>
              <Maximize2 size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              width: width * 0.95,
              height: height * 0.85,
              transform: [
                { scale: scaleAnim },
                { translateX: translateXAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="#007AFF" />
              </TouchableOpacity>

              <Text style={styles.title}>{showAddForm ? 'New Contact' : 'Select Contact'}</Text>

              {showAddForm ? (
                <TouchableOpacity onPress={handleAdd}>
                  <UserPlus size={24} color="#007AFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowAddForm(true)}>
                  <Plus size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>

            {showAddForm ? (
              <ScrollView style={styles.content}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter contact name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Card</Text>
                  {businessCardImage ? (
                    <View style={styles.imageContainer}>
                      <TouchableOpacity
                        style={styles.imagePreview}
                        onPress={() => setShowImageViewer(true)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: businessCardImage }}
                          style={styles.businessCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <Maximize2 size={24} color="#fff" />
                          <Text style={styles.imageOverlayText}>Tap to view</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setBusinessCardImage(null)}
                      >
                        <X size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imageButtonsContainer}>
                      <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                        <Camera size={24} color="#007AFF" />
                        <Text style={styles.imageButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                        <ImageIcon size={24} color="#007AFF" />
                        <Text style={styles.imageButtonText}>Choose Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.formFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddForm(false);
                      setName('');
                      setPhoneNumber('');
                      setBusinessCardImage(null);
                      setEditingContactId(null);
                      setEditingBusinessCard(null);
                      setShowBusinessCardOptions(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Add Contact</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.contactsList}>
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputWrapper}>
                    <Search size={18} color="#8E8E93" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search contacts..."
                      placeholderTextColor="#8E8E93"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filteredContacts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <User size={48} color="#ccc" />
                    <Text style={styles.emptyTitle}>
                      {searchQuery ? 'No contacts found' : 'No contacts yet'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'Try a different search' : 'Add a contact to get started'}
                    </Text>
                    {!searchQuery && (
                      <TouchableOpacity
                        style={styles.emptyAddButton}
                        onPress={() => setShowAddForm(true)}
                      >
                        <Plus size={20} color="#007AFF" />
                        <Text style={styles.emptyAddButtonText}>Add Contact</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <FlatList
                    data={filteredContacts}
                    renderItem={renderContact}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>

      {/* Business Card Viewer Modal */}
      <Modal
        visible={showImageViewer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowImageViewer(false);
          setViewingBusinessCard(null);
          setViewingContactName('');
          // Reset card position when closing
          cardPan.setValue({ x: 0, y: 0 });
          cardScale.setValue(1);
          cardRotation.setValue(0);
        }}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => {
              setShowImageViewer(false);
              setViewingBusinessCard(null);
              setViewingContactName('');
              // Reset card position when closing
              cardPan.setValue({ x: 0, y: 0 });
              cardScale.setValue(1);
              cardRotation.setValue(0);
            }}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {/* Edit Button - opposite corner from X button */}
          {viewingBusinessCard && viewingContactName && (
            <TouchableOpacity
              style={styles.imageViewerEditButton}
              onPress={() => {
                // Find the contact by name to get its ID
                const contact = contacts.find(c => c.name === viewingContactName);
                if (contact) {
                  setShowImageViewer(false);
                  setEditingContactId(contact.id);
                  setEditingBusinessCard(contact.businessCardImage || null);
                  // Reset card position when editing
                  cardPan.setValue({ x: 0, y: 0 });
                  cardScale.setValue(1);
                  cardRotation.setValue(0);
                }
              }}
            >
              <Edit3 size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.imageViewerContent}>
            {(businessCardImage || viewingBusinessCard) && (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.businessCardContainer,
                  {
                    transform: [
                      { translateX: cardPan.x },
                      { translateY: cardPan.y },
                      { scale: cardScale },
                      {
                        rotate: cardRotation.interpolate({
                          inputRange: [-20, 20],
                          outputRange: ['-20deg', '20deg'],
                        }),
                      },
                      {
                        perspective: 1000,
                      },
                    ],
                    opacity: isDragging ? 0.98 : 1,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.businessCardFrame,
                    {
                      shadowOpacity: cardScale.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [0.4, 0.6],
                      }),
                      shadowRadius: cardScale.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [20, 30],
                      }),
                    },
                  ]}
                >
                  <Image
                    source={{ uri: businessCardImage || viewingBusinessCard || '' }}
                    style={styles.businessCardCropped}
                    resizeMode="cover"
                  />
                  <Animated.View
                    style={[
                      styles.dragIndicator,
                      {
                        opacity: isDragging ? 1 : 0,
                        transform: [
                          {
                            scale: isDragging ? 1 : 0.8,
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            )}
          </View>
          <Animated.View
            style={[
              styles.imageViewerFooter,
              {
                opacity: isDragging ? 0.3 : 1,
              },
            ]}
          >
            <Text style={styles.imageViewerTitle}>
              {viewingContactName ? `${viewingContactName}'s Business Card` : 'Business Card'}
            </Text>
            <Text style={styles.imageViewerSubtitle}>
              {isDragging
                ? 'Release to snap back • Swipe for momentum effect'
                : 'Drag to move • Swipe for momentum • Auto-centers'}
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Business Card Edit Modal */}
      <Modal
        visible={editingContactId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.businessCardEditContainer}>
          <View style={styles.businessCardEditHeader}>
            <TouchableOpacity onPress={cancelBusinessCardEdit}>
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.businessCardEditTitle}>Business Card</Text>
            <TouchableOpacity onPress={saveBusinessCard}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.businessCardEditContent}>
            {editingBusinessCard ? (
              <View style={styles.imageContainer}>
                <TouchableOpacity
                  style={styles.imagePreview}
                  onPress={() => {
                    setViewingBusinessCard(editingBusinessCard);
                    setViewingContactName(
                      contacts.find(c => c.id === editingContactId)?.name || ''
                    );
                    setShowImageViewer(true);
                  }}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: editingBusinessCard }}
                    style={styles.businessCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Maximize2 size={24} color="#fff" />
                    <Text style={styles.imageOverlayText}>Tap to view</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setEditingBusinessCard(null)}
                >
                  <X size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity style={styles.imageButton} onPress={takePhotoForContact}>
                  <Camera size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={pickImageForContact}>
                  <ImageIcon size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Business Card Editor */}
      <BusinessCardEditor
        visible={showCardEditor}
        imageUri={cardEditorImage}
        contactName={cardEditorContactName}
        onSave={croppedUri => {
          if (editingContactId) {
            // Updating existing contact's business card
            updateContact({
              id: editingContactId,
              updates: { businessCardImage: croppedUri },
            });
            setEditingBusinessCard(croppedUri);
          } else {
            // Adding business card to new contact
            setBusinessCardImage(croppedUri);
          }
          setShowCardEditor(false);
          setCardEditorImage(null);
        }}
        onCancel={() => {
          setShowCardEditor(false);
          setCardEditorImage(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  formFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactsList: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  listContent: {
    paddingVertical: 8,
  },
  contactItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    position: 'relative',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  businessCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#007AFF15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  businessCardBadgeText: {
    fontSize: 9,
    color: '#007AFF',
    fontWeight: '600',
  },
  businessCardThumbnail: {
    width: 60,
    height: 40,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  businessCardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    gap: 8,
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  imageViewerEditButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  imageViewerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  imageViewerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  businessCardContainer: {
    width: 350,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessCardFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  businessCardCropped: {
    width: '100%',
    height: '100%',
  },
  dragIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -24,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  addBusinessCardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#007AFF20',
  },
  businessCardEditContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  businessCardEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  businessCardEditTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  businessCardEditContent: {
    flex: 1,
    padding: 20,
  },
  editBusinessCardButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#007AFF20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
