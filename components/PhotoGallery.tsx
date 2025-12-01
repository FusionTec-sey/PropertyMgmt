import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Dimensions } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface PhotoGalleryProps {
  photos: string[];
  onAddPhoto?: () => void;
  onDeletePhoto?: (index: number) => void;
  editable?: boolean;
  maxPhotos?: number;
  testID?: string;
}

export default function PhotoGallery({ 
  photos, 
  onAddPhoto, 
  onDeletePhoto, 
  editable = false,
  maxPhotos = 10,
  testID 
}: PhotoGalleryProps) {
  const [viewerVisible, setViewerVisible] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handlePhotoPress = (index: number) => {
    setSelectedIndex(index);
    setViewerVisible(true);
  };

  const handleDeleteCurrent = () => {
    if (onDeletePhoto) {
      onDeletePhoto(selectedIndex);
      if (selectedIndex >= photos.length - 1 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
      if (photos.length === 1) {
        setViewerVisible(false);
      }
    }
  };

  if (photos.length === 0 && !editable) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos ({photos.length})</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePhotoPress(index)}
            style={styles.photoItem}
            testID={`photo-${index}`}
          >
            <Image source={{ uri: photo }} style={styles.thumbnail} />
          </TouchableOpacity>
        ))}
        
        {editable && photos.length < maxPhotos && (
          <TouchableOpacity
            onPress={onAddPhoto}
            style={[styles.photoItem, styles.addPhotoButton]}
            testID="add-photo-button"
          >
            <Plus size={32} color="#007AFF" />
            <Text style={styles.addPhotoText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {selectedIndex + 1} of {photos.length}
            </Text>
            <View style={styles.viewerActions}>
              {editable && onDeletePhoto && (
                <TouchableOpacity
                  onPress={handleDeleteCurrent}
                  style={styles.viewerButton}
                  testID="delete-photo-button"
                >
                  <Trash2 size={24} color="#FF3B30" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setViewerVisible(false)}
                style={styles.viewerButton}
                testID="close-viewer-button"
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedIndex(index);
            }}
            scrollEventThrottle={16}
            contentOffset={{ x: selectedIndex * width, y: 0 }}
          >
            {photos.map((photo, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image 
                  source={{ uri: photo }} 
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.thumbnailStrip}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStripContent}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedIndex(index)}
                  style={[
                    styles.thumbnailStripItem,
                    selectedIndex === index && styles.thumbnailStripItemActive
                  ]}
                >
                  <Image source={{ uri: photo }} style={styles.thumbnailStripImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  scrollContent: {
    paddingRight: 16,
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden' as const,
    backgroundColor: '#F0F0F0',
  },
  thumbnail: {
    width: '100%' as const,
    height: '100%' as const,
  },
  addPhotoButton: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: '#007AFF',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  viewerCounter: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  viewerActions: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  viewerButton: {
    padding: 8,
  },
  imageContainer: {
    width: width,
    height: height - 200,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fullImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  thumbnailStrip: {
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  thumbnailStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thumbnailStripItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'transparent' as const,
  },
  thumbnailStripItemActive: {
    borderColor: '#007AFF',
  },
  thumbnailStripImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
});
