import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';
import FastImage from 'react-native-fast-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Photo {
  src: string;
  width: number;
  height: number;
}

const GalleryScreen = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPhotos = () => {
      fetch('https://app.olivia.haus/api/photos')
        .then(res => {
          if (!res.ok) {
            throw new Error('Nepodarilo sa načítať fotografie.');
          }
          return res.json();
        })
        .then(data => {
          setPhotos(data);
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchPhotos();
  }, []);

  const openImageViewer = (index: number) => {
    setCurrentIndex(index);
    setIsVisible(true);
  };

  const renderHeader = () => (
    <TouchableOpacity style={styles.closeButton} onPress={() => setIsVisible(false)}>
      <Icon name="close" size={35} color="#fff" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const imagesForViewer = photos.map(photo => ({
    url: photo.src,
    props: {
      source: {
        uri: photo.src,
        priority: FastImage.priority.normal,
      },
    },
  }));

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.src}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => openImageViewer(index)} style={styles.imageContainer}>
            <FastImage
              style={styles.image}
              source={{
                uri: item.src,
                priority: FastImage.priority.normal,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        )}
      />
      <Modal visible={visible} transparent={true} onRequestClose={() => setIsVisible(false)}>
        <ImageViewer
          imageUrls={imagesForViewer}
          index={currentIndex}
          onCancel={() => setIsVisible(false)}
          enableSwipeDown
          renderHeader={renderHeader}
          renderIndicator={() => null}
          loadingRender={() => <ActivityIndicator size="large" color="#ff4500" />}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  imageContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
  },
  image: {
    flex: 1,
    margin: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
});

export default GalleryScreen;
