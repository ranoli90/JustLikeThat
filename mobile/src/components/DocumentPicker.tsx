import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

interface DocumentPickerProps {
  onDocumentSelected: (document: DocumentPicker.DocumentPickerResult) => void;
  accept?: string;
  label?: string;
}

export const DocumentPickerButton: React.FC<DocumentPickerProps> = ({
  onDocumentSelected,
  accept = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  label = 'Upload Document',
}) => {
  const handlePress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        onDocumentSelected(result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      accessibilityLabel={label}
      accessibilityHint="Tap to select a document from your device"
    >
      <Ionicons name="cloud-upload-outline" size={24} color="#4F46E5" />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
  },
});
