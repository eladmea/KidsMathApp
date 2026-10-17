import { useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

// Drag-from-a-tray for the counting steps (toppings on a pizza, candles on
// a cake). The tray holds an endless supply of one item. Dragging one shows
// it under the finger; letting go over the target calls
// onDrop(x, y) with the point relative to the target's top-left, or
// onMiss() anywhere else.
//
// The parent passes `targetRef` (the View to drop on) and renders the placed
// items itself. While a drag is on, onDragChange(true) lets the parent stop
// placed items from grabbing the touch as the finger passes over them.
// `renderItem` draws an item that isn't an emoji (e.g. an olive slice).
export default function DragTray({
  emoji,
  renderItem = null,
  label,
  targetRef,
  onDrop,
  onMiss = () => {},
  onDragChange = () => {},
  disabled = false,
}) {
  const [ghost, setGhost] = useState(null);
  const rootRef = useRef(null);
  const originRef = useRef({ x: 0, y: 0 });
  const targetBoxRef = useRef(null);
  const live = useRef({});
  live.current = { onDrop, onMiss, onDragChange, disabled };

  function measureAll() {
    rootRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
    targetRef.current?.measureInWindow((x, y, width, height) => {
      targetBoxRef.current = { x, y, width, height };
    });
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !live.current.disabled,
        onStartShouldSetPanResponderCapture: () => !live.current.disabled,
        onMoveShouldSetPanResponder: () => !live.current.disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          live.current.onDragChange(true);
          measureAll();
          const { pageX, pageY } = event.nativeEvent;
          setGhost({ x: pageX, y: pageY });
        },
        onPanResponderMove: (event) => {
          const { pageX, pageY } = event.nativeEvent;
          setGhost({ x: pageX, y: pageY });
        },
        onPanResponderRelease: (event) => {
          const { pageX, pageY } = event.nativeEvent;
          setGhost(null);
          live.current.onDragChange(false);
          const box = targetBoxRef.current;
          if (box && pageX >= box.x && pageX <= box.x + box.width && pageY >= box.y && pageY <= box.y + box.height) {
            live.current.onDrop(pageX - box.x, pageY - box.y);
          } else {
            live.current.onMiss();
          }
        },
        onPanResponderTerminate: () => {
          setGhost(null);
          live.current.onDragChange(false);
        },
      }),
    []
  );

  return (
    <View ref={rootRef} onLayout={measureAll} style={styles.root}>
      <View
        {...responder.panHandlers}
        style={[styles.tray, shadow, disabled && styles.trayDisabled]}
        accessibilityLabel={`Tray of ${label}`}
      >
        {/* Not selectable: on the web a selected emoji turns the next drag
            into the browser's own text drag, which cancels ours. */}
        {[0, 1, 2].map((i) =>
          renderItem ? (
            <View key={i} style={styles.trayDrawn}>
              {renderItem()}
            </View>
          ) : (
            <Text key={i} selectable={false} style={styles.trayItem}>
              {emoji}
            </Text>
          )
        )}
        <Text selectable={false} style={styles.trayHint}>Drag me!</Text>
      </View>
      {ghost &&
        (renderItem ? (
          <View
            pointerEvents="none"
            style={[styles.ghostDrawn, { left: ghost.x - originRef.current.x - 24, top: ghost.y - originRef.current.y - 24 }]}
          >
            {renderItem()}
          </View>
        ) : (
          <Text
            pointerEvents="none"
            selectable={false}
            style={[styles.ghost, { left: ghost.x - originRef.current.x - 24, top: ghost.y - originRef.current.y - 30 }]}
          >
            {emoji}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  tray: {
    userSelect: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6EBDD',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#D9B88F',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  trayDisabled: {
    opacity: 0.4,
  },
  trayItem: {
    fontSize: 40,
  },
  trayDrawn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostDrawn: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  trayHint: {
    fontSize: 14,
    fontWeight: '900',
    color: '#8A6A44',
    marginLeft: 6,
  },
  ghost: {
    position: 'absolute',
    fontSize: 48,
    zIndex: 20,
  },
});
