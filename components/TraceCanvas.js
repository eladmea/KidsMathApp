import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { BOX, advance, isStrokeDone, startsAtDot } from '../utils/tracing';
import { colors } from '../utils/theme';

const DEMO_STEP_MS = 30;
const MAX_TRAIL = 500;

export const DEFAULT_LOOK = {
  dot: 10,
  guide: '#DCD6EA',
  guideCurrent: '#B9C8F5',
  done: colors.primary,
  doneScale: 1.6,
  trail: 'rgba(255, 154, 61, 0.55)',
  trailSize: 10,
  demo: '✏️',
};

// A finger-tracing area shared by the writing games. Give it the strokes
// (checkpoint lists in the 100 x 140 tracing box) and it handles the green
// start dot, live progress, the trail, the "watch me" demo and judging each
// stroke. Remount it (change its `key`) for the next number.
//
// Props:
//   strokes       checkpoint arrays, one per stroke
//   width         pixel width (height follows the box shape)
//   look          colours and sizes (see DEFAULT_LOOK); `trail` can be a
//                 colour, `trailEmoji` an emoji, `follower` an emoji that rides
//                 under the finger (a car, a bee)
//   startMarker   emoji at the first stroke's start (default: numbered dot)
//   endMarker     emoji at the last stroke's end (a flag, a flower)
//   background    content drawn under the guide (a pizza, a cake)
//   demoToken     change it to replay the demo
//   finished      shows everything as done and ignores touches
//   onHint(kind)  'start' (touched away from the start) | 'almost' (stopped
//                 early) | 'next' (a stroke done, more to go)
//   onComplete({ restarts })  every stroke traced
//   label         accessibility label
export default function TraceCanvas({
  strokes,
  width,
  look: lookOverrides,
  startMarker = null,
  endMarker = null,
  background = null,
  demoToken = 0,
  finished = false,
  onHint = () => {},
  onComplete = () => {},
  label = 'Tracing area',
}) {
  const look = { ...DEFAULT_LOOK, ...lookOverrides };
  const scale = width / BOX.width;
  const height = BOX.height * scale;
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [trail, setTrail] = useState([]);
  const [finger, setFinger] = useState(null);
  const [demoAt, setDemoAt] = useState(null);

  const checkpoints = strokes[strokeIndex];
  const live = useRef({});
  live.current = { checkpoints, strokeIndex, strokes, finished, onHint, onComplete };
  const originRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const dragRef = useRef({ active: false, reached: 0 });
  const restartsRef = useRef(0);
  const demoTimerRef = useRef(null);

  // Watch-me demo: the pencil (or follower) runs along every stroke once.
  useEffect(() => {
    const path = strokes.flat();
    let i = 0;
    setDemoAt(0);
    demoTimerRef.current = setInterval(() => {
      i += 1;
      if (i >= path.length) {
        clearInterval(demoTimerRef.current);
        setDemoAt(null);
        return;
      }
      setDemoAt(i);
    }, DEMO_STEP_MS);
    return () => clearInterval(demoTimerRef.current);
  }, [demoToken, strokes]);

  function measure() {
    canvasRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
  }

  function toBox(event) {
    const { pageX, pageY } = event.nativeEvent;
    return [(pageX - originRef.current.x) / scale, (pageY - originRef.current.y) / scale];
  }

  function endDrag() {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setFinger(null);
    const { checkpoints: cps, strokeIndex: current, strokes: all } = live.current;
    if (isStrokeDone(cps, drag.reached)) {
      if (current + 1 < all.length) {
        setStrokeIndex(current + 1);
        setReached(0);
        live.current.onHint('next');
      } else {
        setReached(cps.length);
        live.current.onComplete({ restarts: restartsRef.current });
      }
      return;
    }
    restartsRef.current += 1;
    setReached(0);
    setTrail([]);
    live.current.onHint('almost');
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        // Keep the gesture for the whole stroke (the page shouldn't take it).
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (live.current.finished) return;
          measure();
          const point = toBox(event);
          const cps = live.current.checkpoints;
          if (!startsAtDot(cps, point)) {
            dragRef.current = { active: false, reached: 0 };
            live.current.onHint('start');
            return;
          }
          clearInterval(demoTimerRef.current);
          setDemoAt(null);
          dragRef.current = { active: true, reached: advance(cps, 0, point) };
          setReached(dragRef.current.reached);
          setTrail([point]);
          setFinger(point);
        },
        onPanResponderMove: (event) => {
          const drag = dragRef.current;
          if (!drag.active) return;
          const point = toBox(event);
          drag.reached = advance(live.current.checkpoints, drag.reached, point);
          setReached(drag.reached);
          setFinger(point);
          setTrail((current) => (current.length >= MAX_TRAIL ? current : [...current, point]));
        },
        onPanResponderTerminate: () => endDrag(),
        onPanResponderRelease: () => endDrag(),
      }),
    [scale]
  );

  const dot = look.dot;
  const toPx = ([x, y], size = dot) => ({ left: x * scale - size / 2, top: y * scale - size / 2 });
  const allPath = strokes.flat();
  const demoPoint = demoAt !== null ? allPath[demoAt] : null;
  const lastStroke = strokes[strokes.length - 1];
  const end = lastStroke[lastStroke.length - 1];
  const rider = look.follower && (finger || demoPoint);

  return (
    <View
      ref={canvasRef}
      onLayout={measure}
      style={[styles.canvas, { width, height }]}
      accessibilityLabel={label}
      {...responder.panHandlers}
    >
      {background ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {background}
        </View>
      ) : null}
      {strokes.map((stroke, s) =>
        stroke.map((point, i) => {
          const isDone = finished || s < strokeIndex || (s === strokeIndex && i < reached);
          const isCurrent = s === strokeIndex;
          if (!isDone && i % 2 === 1) return null;
          return (
            <View
              key={`${s}-${i}`}
              pointerEvents="none"
              style={[
                styles.dot,
                { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: look.guide },
                toPx(point),
                isCurrent && { backgroundColor: look.guideCurrent },
                isDone && { backgroundColor: look.done, transform: [{ scale: look.doneScale }] },
              ]}
            />
          );
        })
      )}
      {!look.follower &&
        trail.map((point, i) =>
          look.trailEmoji ? (
            i % 3 === 0 ? (
              <Text key={`t${i}`} pointerEvents="none" style={[styles.trailEmoji, toPx(point, 18)]}>
                {look.trailEmoji}
              </Text>
            ) : null
          ) : (
            <View
              key={`t${i}`}
              pointerEvents="none"
              style={[
                styles.dot,
                { width: look.trailSize, height: look.trailSize, borderRadius: look.trailSize / 2, backgroundColor: look.trail },
                toPx(point, look.trailSize),
              ]}
            />
          )
        )}
      {endMarker && (
        <Text pointerEvents="none" style={[styles.marker, toPx(end, 34)]}>
          {endMarker}
        </Text>
      )}
      {!finished && (
        <View pointerEvents="none" style={[styles.start, toPx(checkpoints[0], 28)]}>
          {startMarker && strokeIndex === 0 ? (
            <Text style={styles.startEmoji}>{startMarker}</Text>
          ) : (
            <Text style={styles.startText}>{strokeIndex + 1}</Text>
          )}
        </View>
      )}
      {rider && (
        <Text pointerEvents="none" style={[styles.follower, toPx(rider, 40)]}>
          {look.follower}
        </Text>
      )}
      {!look.follower && demoPoint && (
        <Text pointerEvents="none" style={[styles.pencil, { left: demoPoint[0] * scale - 4, top: demoPoint[1] * scale - 30 }]}>
          {look.demo}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    overflow: 'visible',
    // No text selection while tracing on the web (it would cancel drags).
    userSelect: 'none',
  },
  dot: {
    position: 'absolute',
  },
  trailEmoji: {
    position: 'absolute',
    fontSize: 16,
    width: 18,
    textAlign: 'center',
  },
  marker: {
    position: 'absolute',
    fontSize: 28,
    width: 34,
    textAlign: 'center',
  },
  start: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  startEmoji: {
    fontSize: 14,
  },
  follower: {
    position: 'absolute',
    fontSize: 32,
    width: 40,
    textAlign: 'center',
  },
  pencil: {
    position: 'absolute',
    fontSize: 28,
  },
});
