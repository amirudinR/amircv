import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './AnimatedBeam.module.css';

export interface AnimatedBeamNode {
  id: string;
  label: string;
  detail: string;
}

interface AnimatedBeamProps {
  nodes: AnimatedBeamNode[];
  /** Id of the currently active node; the beam into it is emphasised. */
  activeId: string;
  onSelect: (id: string) => void;
  /** Heading for the diagram, e.g. "How I build". */
  label?: string;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Wire {
  key: string;
  fromIndex: number;
  toIndex: number;
  d: string;
  from: Point;
  to: Point;
  endAngle: number;
  construction: Point;
}

interface BeamLayout {
  width: number;
  height: number;
  wires: Wire[];
}

const TERMINAL_GAP = 5;
const REACH_RATIO = 0.45;
const VERTICAL_BOW = 12;
const CONSTRUCTION_OFFSET = 9;
const PACKET_SAMPLES = 20;
const PACKET_SPEED = 46;
const PACKET_MIN_MS = 2600;
const PACKET_MAX_MS = 6400;
const PACKET_EDGE = 0.12;
const ARROW_PATH = 'M 0 0 L -8.5 -4 L -8.5 4 Z';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function sameLayout(previous: BeamLayout | null, next: BeamLayout): boolean {
  if (!previous) return false;
  if (previous.width !== next.width || previous.height !== next.height) return false;
  if (previous.wires.length !== next.wires.length) return false;
  return previous.wires.every((wire, index) => wire.d === next.wires[index]?.d);
}

function makeWire(
  from: Point,
  to: Point,
  fromHalf: number,
  toHalf: number,
  index: number,
): Wire {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const safe = distance > 0 ? distance : 1;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const direction = { x: dx / safe, y: dy / safe };
  const fromInset = Math.min(fromHalf, distance * 0.35) + TERMINAL_GAP;
  const toInset = Math.min(toHalf, distance * 0.35) + TERMINAL_GAP;
  const start = { x: from.x + direction.x * fromInset, y: from.y + direction.y * fromInset };
  const end = { x: to.x - direction.x * toInset, y: to.y - direction.y * toInset };
  const span = horizontal ? Math.abs(end.x - start.x) : Math.abs(end.y - start.y);
  const reach = Math.max(18, span * REACH_RATIO);
  const bow = horizontal ? 0 : VERTICAL_BOW;
  const lift = horizontal ? 0 : Math.sign(dy) * reach;
  const c1 = { x: start.x + (horizontal ? reach : bow), y: start.y + lift };
  const c2 = { x: end.x - (horizontal ? reach : bow), y: end.y - lift };
  const normal = { x: -direction.y, y: direction.x };

  return {
    key: `${index}-${index + 1}`,
    fromIndex: index,
    toIndex: index + 1,
    d: `M ${round(start.x)} ${round(start.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(end.x)} ${round(end.y)}`,
    from: start,
    to: end,
    endAngle: (Math.atan2(end.y - c2.y, end.x - c2.x) * 180) / Math.PI,
    construction: { x: round(normal.x * CONSTRUCTION_OFFSET), y: round(normal.y * CONSTRUCTION_OFFSET) },
  };
}

export function AnimatedBeam({
  nodes,
  activeId,
  onSelect,
  label,
  className,
}: AnimatedBeamProps) {
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const packetRefs = useRef(new Map<string, SVGGElement>());
  const [layout, setLayout] = useState<BeamLayout | null>(null);

  const count = nodes.length;
  const activeIndex = nodes.findIndex((node) => node.id === activeId);

  // Geometry is measured rather than assumed: the same numbers drive a row of
  // nodes and the vertical stack the mobile breakpoint reflows them into.
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || count < 1) return;

    const stageBox = stage.getBoundingClientRect();
    const width = Math.round(stageBox.width);
    const height = Math.round(stageBox.height);
    if (width < 2 || height < 2) return;

    const centres: Point[] = [];
    const halves: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const element = nodeRefs.current[index];
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const horizontal = Math.abs(rect.width) >= Math.abs(rect.height);
      centres.push({
        x: rect.left - stageBox.left + rect.width / 2,
        y: rect.top - stageBox.top + rect.height / 2,
      });
      halves.push(horizontal ? rect.width / 2 : rect.height / 2);
    }

    const wires: Wire[] = [];
    for (let index = 0; index + 1 < count; index += 1) {
      const from = centres[index];
      const to = centres[index + 1];
      if (!from || !to) break;
      wires.push(makeWire(from, to, halves[index] ?? 0, halves[index + 1] ?? 0, index));
    }

    setLayout((previous) =>
      sameLayout(previous, { width, height, wires }) ? previous : { width, height, wires },
    );
  }, [count]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let disposed = false;
    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(stage);

    const fonts = document.fonts;
    if (fonts) void fonts.ready.then(() => { if (!disposed) measure(); });

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [measure]);

  // Packets are positioned with the Web Animations API against keyframes
  // sampled off the rendered path, and every handle is cancelled on unmount or
  // when the motion preference changes.
  useEffect(() => {
    if (reducedMotion || !layout) return;

    const running: Animation[] = [];
    const wireCount = layout.wires.length;

    layout.wires.forEach((wire, index) => {
      const path = pathRefs.current.get(wire.key);
      const packet = packetRefs.current.get(wire.key);
      if (!path || !packet) return;

      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length < 4) return;

      const frames: Keyframe[] = [];
      for (let step = 0; step <= PACKET_SAMPLES; step += 1) {
        const t = step / PACKET_SAMPLES;
        const at = clamp(t * length, 0, length);
        const point = path.getPointAtLength(at);
        const lead = path.getPointAtLength(clamp(at + 2, 0, length));
        const trail = path.getPointAtLength(clamp(at - 2, 0, length));
        frames.push({
          offset: t,
          transform: `translate(${round(point.x)}px, ${round(point.y)}px) rotate(${round(
            (Math.atan2(lead.y - trail.y, lead.x - trail.x) * 180) / Math.PI,
          )}deg)`,
          opacity: t < PACKET_EDGE || t > 1 - PACKET_EDGE ? 0 : 1,
        });
      }

      const duration = clamp((length / PACKET_SPEED) * 1000, PACKET_MIN_MS, PACKET_MAX_MS);
      running.push(
        packet.animate(frames, {
          duration,
          iterations: Infinity,
          easing: 'linear',
          delay: -Math.round((duration / wireCount) * index),
        }),
      );
    });

    return () => {
      for (const animation of running) animation.cancel();
    };
  }, [layout, reducedMotion]);

  if (count === 0) return null;

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      role="group"
      aria-label={label ? `${label} — data flow diagram` : 'Data flow diagram'}
    >
      {label && (
        <p className={styles.head}>
          <span className={styles.label}>{label}</span>
          <span className={styles.rule} aria-hidden="true" />
        </p>
      )}

      <p className={styles.srOnly}>{`Data flow: ${nodes.map((node) => node.label).join(' to ')}`}</p>

      <div className={styles.sheet}>
        <span className={styles.cropTop} aria-hidden="true" />
        <span className={styles.cropBottom} aria-hidden="true" />

        <div className={styles.stage} ref={stageRef}>
          {layout && (
            <svg
              className={styles.canvas}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="none"
              focusable="false"
            >
              <g aria-hidden="true">
                {layout.wires.map((wire) => {
                  const emphasised = wire.toIndex === activeIndex && activeIndex > 0;
                  return (
                    <g key={wire.key}>
                      <path
                        className={styles.construction}
                        d={wire.d}
                        transform={`translate(${wire.construction.x} ${wire.construction.y})`}
                      />
                      {emphasised && <path className={styles.wireMarker} d={wire.d} />}
                      <path
                        ref={(element) => {
                          if (element) pathRefs.current.set(wire.key, element);
                          else pathRefs.current.delete(wire.key);
                        }}
                        className={
                          emphasised ? `${styles.wire} ${styles.wireEmphasised}` : styles.wire
                        }
                        d={wire.d}
                      />
                      <path
                        className={
                          emphasised ? `${styles.arrow} ${styles.arrowEmphasised}` : styles.arrow
                        }
                        d={ARROW_PATH}
                        transform={`translate(${round(wire.to.x)} ${round(
                          wire.to.y,
                        )}) rotate(${round(wire.endAngle)})`}
                      />
                      <g
                        transform={`translate(${round(wire.from.x)} ${round(wire.from.y)})`}
                      >
                        <circle className={styles.terminalRing} r="5" />
                        <circle
                          className={
                            emphasised
                              ? `${styles.terminalDot} ${styles.terminalDotEmphasised}`
                              : styles.terminalDot
                          }
                          r="2"
                        />
                      </g>
                      {!reducedMotion && (
                        <g
                          ref={(element) => {
                            if (element) packetRefs.current.set(wire.key, element);
                            else packetRefs.current.delete(wire.key);
                          }}
                          className={styles.packet}
                        >
                          <rect
                            className={styles.packetTail}
                            x={-17}
                            y={-1.25}
                            width={17}
                            height={2.5}
                          />
                          <rect
                            className={styles.packetHead}
                            x={-4}
                            y={-2.5}
                            width={9}
                            height={5}
                            rx={1}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          <ul className={styles.nodes} role="list">
            {nodes.map((node, index) => {
              const active = node.id === activeId;
              return (
                <li key={node.id} className={styles.nodeSlot}>
                  <button
                    type="button"
                    ref={(element) => {
                      nodeRefs.current[index] = element;
                    }}
                    className={active ? `${styles.node} ${styles.nodeActive}` : styles.node}
                    aria-pressed={active}
                    onClick={() => onSelect(node.id)}
                  >
                    <span className={styles.nodeIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.nodeLabel}>{node.label}</span>
                    <span className={styles.srOnly}>{`: ${node.detail}`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
