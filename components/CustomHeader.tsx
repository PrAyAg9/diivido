import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomHeaderProps {
  title: string;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  backgroundColor?: string;
}

export default function CustomHeader({
  title,
  rightComponent,
  leftComponent,
  backgroundColor = '#FFFFFF',
}: CustomHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop:
            Platform.OS === 'android' ? insets.top + 20 : insets.top + 12,
          paddingBottom: 16,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>{leftComponent}</View>

        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>{rightComponent}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
});
