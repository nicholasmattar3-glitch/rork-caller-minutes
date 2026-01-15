import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomSplashScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Scale up and bounce entrance
    const entranceAnimation = Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    // Phase 3: Drive off to the right like a car with acceleration
    const exitAnimation = Animated.parallel([
      Animated.timing(translateXAnim, {
        toValue: screenWidth + 200, // Drive off to the right
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8, // Slightly smaller as it drives away
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Execute animations in sequence
    Animated.sequence([
      entranceAnimation,
      Animated.delay(1000), // Brief pause before driving off
      exitAnimation,
    ]).start();
  }, [bounceAnim, scaleAnim, translateXAnim, opacityAnim, screenWidth]);

  const bounceInterpolate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Animated.Text
            style={[
              styles.logo,
              {
                transform: [
                  { translateY: bounceInterpolate },
                  { translateX: translateXAnim },
                  { scale: scaleAnim },
                  { skewX: '15deg' },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            RR
          </Animated.Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626', // Red background
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF', // White color
    textAlign: 'center',
    letterSpacing: -10,
    paddingRight: 20,
  },
});
