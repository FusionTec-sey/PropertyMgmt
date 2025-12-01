import React, { useRef } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';

export interface SwipeAction {
  text: string;
  backgroundColor: string;
  color: string;
  icon?: React.ReactNode;
  onPress: () => void;
  testID?: string;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  testID?: string;
}

const SWIPE_THRESHOLD = 50;
const MAX_SWIPE = 200;

export default function SwipeableItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeStart,
  onSwipeEnd,
  testID,
}: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        onSwipeStart?.();
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const maxLeft = leftActions.length > 0 ? MAX_SWIPE : 0;
        const maxRight = rightActions.length > 0 ? -MAX_SWIPE : 0;
        
        const clampedDx = Math.max(maxRight, Math.min(maxLeft, dx));
        translateX.setValue(clampedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        translateX.flattenOffset();
        
        let finalPosition = 0;
        
        if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          if (leftActions.length > 0) {
            const actionWidth = MAX_SWIPE / Math.max(leftActions.length, 1);
            finalPosition = Math.min(MAX_SWIPE, actionWidth * leftActions.length);
          }
        } else if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          if (rightActions.length > 0) {
            const actionWidth = MAX_SWIPE / Math.max(rightActions.length, 1);
            finalPosition = -Math.min(MAX_SWIPE, actionWidth * rightActions.length);
          }
        }
        
        lastOffset.current = finalPosition;
        
        Animated.spring(translateX, {
          toValue: finalPosition,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start(() => {
          onSwipeEnd?.();
        });
      },
      onPanResponderTerminate: () => {
        closeSwipe();
      },
    })
  ).current;

  const closeSwipe = () => {
    lastOffset.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      onSwipeEnd?.();
    });
  };

  const handleActionPress = (action: SwipeAction) => {
    closeSwipe();
    setTimeout(() => {
      action.onPress();
    }, 200);
  };

  const renderActions = (actions: SwipeAction[], isLeft: boolean) => {
    if (actions.length === 0) return null;

    const actionWidth = MAX_SWIPE / actions.length;

    return (
      <View
        style={[
          styles.actionsContainer,
          isLeft ? styles.leftActionsContainer : styles.rightActionsContainer,
        ]}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor,
                width: actionWidth,
              },
            ]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
            testID={action.testID}
          >
            {action.icon && <View style={styles.actionIcon}>{action.icon}</View>}
            <Text style={[styles.actionText, { color: action.color }]} numberOfLines={1}>
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} testID={testID}>
      {renderActions(leftActions, true)}
      {renderActions(rightActions, false)}
      
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  content: {
    backgroundColor: '#FFFFFF',
  },
  actionsContainer: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  leftActionsContainer: {
    left: 0,
  },
  rightActionsContainer: {
    right: 0,
  },
  actionButton: {
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
  },
  actionIcon: {
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
