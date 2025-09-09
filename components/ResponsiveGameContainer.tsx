import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  responsiveDimensions,
  handleOrientationChange,
  getResponsiveLayout,
  scale,
  verticalScale,
} from '../utils/responsive';

interface ResponsiveGameContainerProps {
  children: React.ReactNode;
}

const ResponsiveGameContainer: React.FC<ResponsiveGameContainerProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    isLandscape: Dimensions.get('window').width > Dimensions.get('window').height,
  });

  const [layout, setLayout] = useState(getResponsiveLayout());

  useEffect(() => {
    // Handle orientation changes
    const unsubscribe = handleOrientationChange((newDimensions) => {
      setDimensions(newDimensions);
      setLayout(getResponsiveLayout());
    });

    return unsubscribe;
  }, []);

  // Calculate responsive container styles
  const getContainerStyle = () => {
    const { width, height, isLandscape } = dimensions;
    
    // For web, constrain to reasonable game dimensions
    if (Platform.OS === 'web') {
      const maxWidth = 480;
      const maxHeight = 900;
      const aspectRatio = 9 / 16;
      
      let containerWidth = width;
      let containerHeight = height;
      
      // Constrain width
      if (width > maxWidth) {
        containerWidth = maxWidth;
        containerHeight = maxWidth / aspectRatio;
      }
      
      // Constrain height
      if (containerHeight > maxHeight) {
        containerHeight = maxHeight;
        containerWidth = maxHeight * aspectRatio;
      }
      
      return {
        width: containerWidth,
        height: containerHeight,
        maxWidth,
        maxHeight,
        alignSelf: 'center' as const,
      };
    }
    
    // For mobile, use full dimensions
    return {
      width: '100%',
      height: '100%',
      flex: 1,
    };
  };

  const containerStyle = getContainerStyle();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a2e"
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.container, containerStyle]}>
        <View style={styles.gameWrapper}>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  dimensions,
                  layout,
                  isResponsive: true,
                })
              : child
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        borderRadius: 10,
        margin: 'auto',
      },
      default: {},
    }),
  },
  gameWrapper: {
    flex: 1,
    position: 'relative',
  },
});

export default ResponsiveGameContainer;