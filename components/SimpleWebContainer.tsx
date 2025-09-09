import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface SimpleWebContainerProps {
  children: React.ReactNode;
}

const SimpleWebContainer: React.FC<SimpleWebContainerProps> = ({ children }) => {
  // For non-web platforms, just return children
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // For web, provide a simple container
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    width: '100%',
    height: '100%',
  },
});

export default SimpleWebContainer;