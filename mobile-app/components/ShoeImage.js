import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { imageUrl } from '../lib/api';
import { colors } from '../theme';

// A shoe picture, or a grey placeholder when there is none or it fails to load.
export default function ShoeImage({ path, style }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(path);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="image-outline" size={28} color={colors.muted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[styles.image, style]} resizeMode="cover" onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.line },
  placeholder: { backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' }
});
