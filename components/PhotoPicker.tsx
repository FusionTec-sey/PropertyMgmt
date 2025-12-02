import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoPicker({ photos, onPhotosChange, maxPhotos = 10 }: PhotoPickerProps) {
  const handleAddPhoto = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only add up to ${maxPhotos} photos.`);
      return;
    }
    
    showPhotoOptions((uri: string | null) => {
      if (uri && photos.length < maxPhotos) {
        onPhotosChange([...photos, uri]);
      } else if (!uri) {
        console.log('[PhotoPicker] No photo selected');
      }
    });
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
        {photos.map((uri, index) => (
          <View key={index} style={styles.photoItem}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePhoto(index)}
            >
              <Trash2 size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < maxPhotos && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
            <Camera size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  photoList: {
    gap: 12,
  },
  photoItem: {
    position: 'relative' as const,
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F0F8FF',
    gap: 4,
  },
  addButtonText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600' as const,
  },
});

function validateImageType(uri: string, mimeType?: string | null): boolean {
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (mimeType && validMimeTypes.includes(mimeType.toLowerCase())) {
    return true;
  }
  
  const lowerUri = uri.toLowerCase();
  return validExtensions.some(ext => lowerUri.endsWith(ext));
}

export async function pickPhoto(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to add photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      if (!validateImageType(asset.uri, asset.mimeType)) {
        Alert.alert(
          'Invalid File Type',
          'Please select a valid image file (JPG, PNG, or WEBP).'
        );
        return null;
      }
      
      return asset.uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking photo:', error);
    Alert.alert('Error', 'Failed to pick photo. Please try again.');
    return null;
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      if (!validateImageType(asset.uri, asset.mimeType)) {
        Alert.alert(
          'Invalid File Type',
          'The captured image format is not supported. Please try again.'
        );
        return null;
      }
      
      return asset.uri;
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
}

export function showPhotoOptions(onPhotoSelected: (uri: string | null) => void) {
  if (Platform.OS === 'web') {
    pickPhoto().then(uri => {
      onPhotoSelected(uri);
    }).catch(error => {
      console.error('[PhotoPicker] Error picking photo:', error);
      onPhotoSelected(null);
    });
    return;
  }

  Alert.alert(
    'Add Photo',
    'Choose a photo source',
    [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await takePhoto();
          if (uri) onPhotoSelected(uri);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const uri = await pickPhoto();
          if (uri) onPhotoSelected(uri);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
}
