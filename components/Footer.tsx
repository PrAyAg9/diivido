import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

/**
 * A footer component that displays a "Built with Bolt.new" badge.
 * The badge is centered and links to the Bolt.new website when pressed.
 */
export default function Footer() {

  /**
   * Handles the press event on the Bolt badge by opening the link.
   */
  const handleBoltPress = () => {
    Linking.openURL('https://bolt.new').catch(err => 
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View style={styles.footer}>
      {/* This TouchableOpacity acts as a button, styled like a badge. */}
      <TouchableOpacity 
        style={styles.boltBadge} 
        onPress={handleBoltPress}
        activeOpacity={0.8} // Controls the opacity when the button is pressed
      >
        <View style={styles.boltContent}>
          <View style={styles.boltIcon}>
            {/* The lightning bolt emoji */}
            <Text style={styles.boltEmoji}>⚡</Text>
          </View>
          <Text style={styles.boltText}>Built with Bolt.new</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// StyleSheet for the footer component
const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    // Horizontally center the content
    justifyContent: 'flex-start' ,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB', // A light gray background
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // A subtle top border
    // Pushes the footer to the bottom of the screen in a flex container
    marginTop: 'auto', 
  },
  boltBadge: {
    backgroundColor: '#1F2937', // A dark, slate gray background for the badge
    borderRadius: 20, // Fully rounded corners
    paddingHorizontal: 12,
    paddingVertical: 6,
    // Shadow properties for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android shadow
    elevation: 3,
  },
  boltContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  boltIcon: {
    marginRight: 6,
  },
  boltEmoji: {
    fontSize: 14,
  },
  boltText: {
    fontSize: 12,
    // Using system fonts by default, but you can add custom fonts like 'Inter-Medium'
    // fontFamily: 'Inter-Medium', 
    color: '#FFFFFF', // White text
  },
});
