import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
      return result.assets[0].uri;
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
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
}

export function showPhotoOptions(onPhotoSelected: (uri: string) => void) {
  if (Platform.OS === 'web') {
    pickPhoto().then(uri => {
      if (uri) onPhotoSelected(uri);
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
    ]
  );
}
