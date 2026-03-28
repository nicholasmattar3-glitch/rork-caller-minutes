import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Move, Maximize2, Grid3x3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.586; // Standard business card ratio (3.5:2.2)

interface BusinessCardEditorProps {
  visible: boolean;
  imageUri: string | null;
  onSave: (croppedUri: string) => void;
  onCancel: () => void;
  contactName?: string;
}

export default function BusinessCardEditor({
  visible,
  imageUri,
  onSave,
  onCancel,
  contactName,
}: BusinessCardEditorProps) {
  const [editingImage, setEditingImage] = useState<string | null>(imageUri);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({
    width: screenWidth,
    height: screenHeight * 0.6,
  });

  // Transform states
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const [currentScale, setCurrentScale] = useState(1);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const centerImage = useCallback(
    (imgWidth: number, imgHeight: number) => {
      // Calculate scale to fit the card frame
      const cardWidth = containerSize.width * 0.8;
      const cardHeight = cardWidth / CARD_ASPECT_RATIO;

      const scaleX = cardWidth / imgWidth;
      const scaleY = cardHeight / imgHeight;
      const optimalScale = Math.max(scaleX, scaleY) * 1.2; // Slightly larger for cropping flexibility

      setCurrentScale(optimalScale);
      setCurrentTranslateX(0);
      setCurrentTranslateY(0);
      setCurrentRotation(0);

      Animated.parallel([
        Animated.spring(scale, { toValue: optimalScale, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(rotation, { toValue: 0, useNativeDriver: true }),
      ]).start();
    },
    [containerSize.width, rotation, scale, translateX, translateY]
  );

  useEffect(() => {
    if (imageUri) {
      setEditingImage(imageUri);
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
        centerImage(width, height);
      });
    }
  }, [centerImage, imageUri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);
        translateX.setOffset(currentTranslateX);
        translateY.setOffset(currentTranslateY);
        translateX.setValue(0);
        translateY.setValue(0);
      },

      onPanResponderMove: Animated.event([null, { dx: translateX, dy: translateY }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        translateX.flattenOffset();
        translateY.flattenOffset();

        const newX = currentTranslateX + gestureState.dx;
        const newY = currentTranslateY + gestureState.dy;

        setCurrentTranslateX(newX);
        setCurrentTranslateY(newY);
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(currentScale * 1.2, 5);
    setCurrentScale(newScale);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(currentScale * 0.8, 0.5);
    setCurrentScale(newScale);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleRotate = () => {
    const newRotation = currentRotation + 90;
    setCurrentRotation(newRotation);
    Animated.spring(rotation, {
      toValue: newRotation,
      useNativeDriver: true,
    }).start();
  };

  const handleAutoCenter = () => {
    if (imageSize.width && imageSize.height) {
      centerImage(imageSize.width, imageSize.height);
    }
  };

  const handleSave = async () => {
    if (!editingImage) return;

    try {
      console.log('Starting image save process...');
      console.log('Image size:', imageSize);
      console.log('Container size:', containerSize);
      console.log('Current transforms:', {
        currentScale,
        currentTranslateX,
        currentTranslateY,
        currentRotation,
      });

      // Calculate the crop area based on the business card frame
      const cardWidth = containerSize.width * 0.8;
      const cardHeight = cardWidth / CARD_ASPECT_RATIO;

      console.log('Card dimensions:', { cardWidth, cardHeight });

      // Get the actual image dimensions
      const actualImageWidth = imageSize.width;
      const actualImageHeight = imageSize.height;

      // Calculate scale factor between displayed image and actual image
      const displayScale = Math.min(cardWidth / actualImageWidth, cardHeight / actualImageHeight);

      // Calculate crop coordinates in actual image space
      const centerX = actualImageWidth / 2;
      const centerY = actualImageHeight / 2;

      // Convert translate values to actual image coordinates
      const translateXInImageSpace = -currentTranslateX / (displayScale * currentScale);
      const translateYInImageSpace = -currentTranslateY / (displayScale * currentScale);

      // Calculate crop dimensions in actual image space
      const cropWidthInImageSpace = cardWidth / (displayScale * currentScale);
      const cropHeightInImageSpace = cardHeight / (displayScale * currentScale);

      // Calculate crop origin (top-left corner)
      const cropX = Math.max(
        0,
        Math.min(
          actualImageWidth - cropWidthInImageSpace,
          centerX + translateXInImageSpace - cropWidthInImageSpace / 2
        )
      );
      const cropY = Math.max(
        0,
        Math.min(
          actualImageHeight - cropHeightInImageSpace,
          centerY + translateYInImageSpace - cropHeightInImageSpace / 2
        )
      );

      // Ensure crop dimensions don't exceed image bounds
      const finalCropWidth = Math.min(cropWidthInImageSpace, actualImageWidth - cropX);
      const finalCropHeight = Math.min(cropHeightInImageSpace, actualImageHeight - cropY);

      console.log('Crop parameters:', {
        cropX,
        cropY,
        finalCropWidth,
        finalCropHeight,
        rotation: currentRotation,
      });

      // Build manipulation actions
      const actions: any[] = [];

      // Apply rotation first if needed
      if (currentRotation !== 0) {
        actions.push({ rotate: currentRotation });
      }

      // Apply crop
      actions.push({
        crop: {
          originX: Math.round(cropX),
          originY: Math.round(cropY),
          width: Math.round(finalCropWidth),
          height: Math.round(finalCropHeight),
        },
      });

      // Resize to standard business card size
      actions.push({ resize: { width: 800 } });

      console.log('Applying manipulations:', actions);

      // Apply transformations and crop
      const manipResult = await ImageManipulator.manipulateAsync(editingImage, actions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      });

      console.log('Manipulation result:', manipResult);
      onSave(manipResult.uri);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    }
  };

  const pickNewImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setEditingImage(result.assets[0].uri);
      Image.getSize(result.assets[0].uri, (width, height) => {
        setImageSize({ width, height });
        centerImage(width, height);
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {contactName ? `${contactName}'s Card` : 'Business Card'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Check size={24} color="#34C759" />
          </TouchableOpacity>
        </View>

        {/* Image Editor */}
        <View
          style={styles.editorContainer}
          onLayout={e => {
            setContainerSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            });
          }}
        >
          {/* Card Frame */}
          <View style={styles.cardFrameContainer}>
            <View
              style={[
                styles.cardFrame,
                {
                  width: containerSize.width * 0.8,
                  height: (containerSize.width * 0.8) / CARD_ASPECT_RATIO,
                },
              ]}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <View style={styles.gridOverlay} pointerEvents="none">
                  <View style={styles.gridRow}>
                    <View style={styles.gridCell} />
                    <View style={[styles.gridCell, styles.gridCellCenter]} />
                    <View style={styles.gridCell} />
                  </View>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCell} />
                    <View style={[styles.gridCell, styles.gridCellCenter]} />
                    <View style={styles.gridCell} />
                  </View>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCell} />
                    <View style={[styles.gridCell, styles.gridCellCenter]} />
                    <View style={styles.gridCell} />
                  </View>
                </View>
              )}

              {/* Image */}
              {editingImage && (
                <View style={styles.imageContainer}>
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.imageWrapper,
                      {
                        transform: [
                          { translateX },
                          { translateY },
                          { scale },
                          {
                            rotate: rotation.interpolate({
                              inputRange: [0, 360],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: editingImage }}
                      style={[
                        styles.image,
                        {
                          width: imageSize.width,
                          height: imageSize.height,
                          marginLeft: -imageSize.width / 2,
                          marginTop: -imageSize.height / 2,
                        },
                      ]}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </View>
              )}

              {/* Crop Indicator */}
              <View style={styles.cropIndicator} pointerEvents="none">
                <View style={styles.cropCorner} />
                <View style={[styles.cropCorner, styles.cropCornerTR]} />
                <View style={[styles.cropCorner, styles.cropCornerBL]} />
                <View style={[styles.cropCorner, styles.cropCornerBR]} />
              </View>
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            {isDragging ? 'Drag to position' : 'Drag image to adjust • Pinch to zoom'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <ZoomIn size={20} color="#007AFF" />
              <Text style={styles.controlText}>Zoom In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <ZoomOut size={20} color="#007AFF" />
              <Text style={styles.controlText}>Zoom Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
              <RotateCw size={20} color="#007AFF" />
              <Text style={styles.controlText}>Rotate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleAutoCenter}>
              <Maximize2 size={20} color="#007AFF" />
              <Text style={styles.controlText}>Auto Fit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, showGrid && styles.controlButtonActive]}
              onPress={() => setShowGrid(!showGrid)}
            >
              <Grid3x3 size={20} color={showGrid ? '#fff' : '#007AFF'} />
              <Text style={[styles.controlText, showGrid && styles.controlTextActive]}>Grid</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={pickNewImage}>
              <Move size={20} color="#007AFF" />
              <Text style={styles.controlText}>Change</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  editorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrameContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrame: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  image: {
    position: 'absolute',
  },
  gridOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridCellCenter: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cropIndicator: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  cropCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#007AFF',
    top: -1,
    left: -1,
  },
  cropCornerTR: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    left: undefined,
    right: -1,
  },
  cropCornerBL: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    top: undefined,
    bottom: -1,
  },
  cropCornerBR: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    top: undefined,
    left: undefined,
    bottom: -1,
    right: -1,
  },
  instructions: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    opacity: 0.8,
  },
  controls: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  controlButtonActive: {
    backgroundColor: '#007AFF',
  },
  controlText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 5,
  },
  controlTextActive: {
    color: '#fff',
  },
});
