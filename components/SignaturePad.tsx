import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
}

export default function SignaturePad({
  onSignatureChange,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#FFFFFF',
}: SignaturePadProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPath = `M${locationX},${locationY}`;
        setCurrentPath(newPath);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          const newPaths = [...paths, currentPath];
          setPaths(newPaths);
          setCurrentPath('');
          
          if (onSignatureChange) {
            onSignatureChange(JSON.stringify(newPaths));
          }
        }
      },
    })
  ).current;

  return (
    <View 
      style={[styles.container, { backgroundColor }]}
      {...panResponder.panHandlers}
    >
      <Svg style={styles.svg}>
        {paths.map((path, index) => (
          <Path
            key={`path-${index}`}
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPath && (
          <Path
            d={currentPath}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </View>
  );
}

SignaturePad.displayName = 'SignaturePad';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  svg: {
    flex: 1,
  },
});
