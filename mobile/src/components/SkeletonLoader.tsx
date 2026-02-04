import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  count?: number;
  height?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 3, 
  height = 80 
}) => {
  const animatedValue = React.useMemo(() => new Animated.Value(0), []);
  
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.item, { height }]}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX }] },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
