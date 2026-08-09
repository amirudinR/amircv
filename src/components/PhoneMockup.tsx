import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { MockupType } from '@/data/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './PhoneMockup.module.css';

interface IconProps {
  size?: number;
  fill?: string;
  stroke?: string;
  children: ReactNode;
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function Icon({ size = 14, fill = 'none', stroke = 'currentColor', children }: IconProps) {
  return (
    <svg {...ICON_PROPS} width={size} height={size} fill={fill} stroke={stroke}>
      {children}
    </svg>
  );
}

const CartIcon = () => (
  <Icon>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Icon>
);

const BarcodeIcon = () => (
  <Icon size={30}>
    <path d="M3 5v14M7 5v14M10 5v6M10 15v4M14 5v4M14 13v6M18 5v14M22 5v6M22 15v4" />
  </Icon>
);

const PrinterIcon = () => (
  <Icon>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3h12v6" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Icon>
);

const PlayIcon = () => (
  <Icon size={12} fill="currentColor" stroke="none">
    <polygon points="6 4 20 12 6 20 6 4" />
  </Icon>
);

const PauseIcon = () => (
  <Icon size={12}>
    <rect x="6" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="15" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none" />
  </Icon>
);

const MicIcon = () => (
  <Icon size={13}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </Icon>
);

const SyncIcon = () => (
  <Icon size={10}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
);

const PowerIcon = () => (
  <Icon size={22}>
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
  </Icon>
);

const SunIcon = () => (
  <Icon size={26}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Icon>
);

const CheckIcon = () => (
  <Icon size={11}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

interface PhoneMockupProps {
  type: MockupType;
  size?: 'sm' | 'md';
}

export function PhoneMockup({ type, size = 'md' }: PhoneMockupProps) {
  return (
    <div
      className={`${styles.phone}${size === 'sm' ? ` ${styles.phoneSm}` : ''}`}
      role="group"
      aria-label={`Interactive demo: ${type.replace('-', ' ')}`}
    >
      <div className={styles.screen}>
        <div className={styles.island} aria-hidden="true">
          <span className={styles.islandDot} />
        </div>

        <div className={styles.status} aria-hidden="true">
          <span className={styles.statusTime}>21:04</span>
          <div className={styles.statusIcons}>
            <svg width="14" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
              <rect x="0" y="8" width="3" height="4" rx="0.8" />
              <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8" />
              <rect x="9" y="3" width="3" height="9" rx="0.8" />
              <rect x="13.5" y="0.5" width="3" height="11.5" rx="0.8" opacity="0.3" />
            </svg>
            <svg width="17" height="10" viewBox="0 0 18 11" fill="none" stroke="currentColor" aria-hidden="true">
              <rect x="0.5" y="0.5" width="13" height="10" rx="3" />
              <rect x="2" y="2" width="10" height="7" rx="1.6" fill="currentColor" stroke="none" />
              <rect x="15" y="3.5" width="2" height="4" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>

        <div className={styles.viewport}>
          {type === 'pos' && <PosSkin />}
          {type === 'equalizer' && <EqualizerSkin />}
          {type === 'mindlog' && <MindLogSkin />}
          {type === 'flashlight' && <FlashlightSkin />}
        </div>

        <div className={styles.homeBar} aria-hidden="true" />
      </div>
    </div>
  );
}

/* ---------------------------------- POS ---------------------------------- */

interface PosLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

const POS_CATALOG = [
  { id: 's1', name: 'Fresh Fruits Pack', price: 15000 },
  { id: 's2', name: 'Java Coffee Beans', price: 45000 },
  { id: 's3', name: 'Poros Tea Box', price: 12000 },
  { id: 's4', name: 'Brown Sugar Pack', price: 9000 },
];

const POS_INITIAL: PosLine[] = [
  { id: 's1', name: 'Fresh Fruits Pack', price: 15000, qty: 2 },
  { id: 's2', name: 'Java Coffee Beans', price: 45000, qty: 1 },
];

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

function PosSkin() {
  const [cart, setCart] = useState<PosLine[]>(POS_INITIAL);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scanTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (scanTimer.current) window.clearTimeout(scanTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const flash = (text: string) => {
    setToast(text);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const scanItem = () => {
    const pick = POS_CATALOG[Math.floor(Math.random() * POS_CATALOG.length)];
    setCart((prev) => {
      const existing = prev.find((line) => line.id === pick.id);
      return existing
        ? prev.map((line) =>
            line.id === pick.id ? { ...line, qty: line.qty + 1 } : line,
          )
        : [...prev, { ...pick, qty: 1 }];
    });
    setScanning(true);
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => setScanning(false), 420);
    flash(`${pick.name} scanned — cart updated offline`);
  };

  const printInvoice = () => {
    flash('Invoice dispatched: thermal printer + WhatsApp API');
  };

  const clearCart = () => {
    setCart([]);
    flash('Cart cleared — local cache intact');
  };

  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <div className={styles.pos}>
      <header className={styles.skinHeader}>
        <span className={styles.skinBrand}>
          <CartIcon />
          Poros Retail
        </span>
        <span className={styles.skinMeta}>B2B-286</span>
      </header>

      <button
        type="button"
        className={`${styles.scan}${scanning ? ` ${styles.scanning}` : ''}`}
        onClick={scanItem}
        aria-label="Scan a barcode into the receipt"
      >
        <span className={styles.scanIcon}>
          <BarcodeIcon />
        </span>
        <span>{scanning ? 'Item registered' : 'Tap to scan barcode'}</span>
      </button>

      <div className={styles.receipt}>
        <span className={styles.receiptLabel}>Receipt cart</span>
        <ul className={styles.cartList}>
          {cart.length === 0 && (
            <li className={styles.cartEmpty}>Cart empty — scan an item</li>
          )}
          {cart.map((line) => (
            <li key={line.id} className={styles.cartRow}>
              <span className={styles.cartName}>
                {line.name} <small>x{line.qty}</small>
              </span>
              <span className={styles.cartPrice}>
                {formatRupiah(line.price * line.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.cartTotal}>
          <span>Total</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>

      {toast && (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      )}

      <div className={styles.posActions}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={printInvoice}>
          <PrinterIcon />
          Invoice
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={clearCart}>
          Clear
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- EQUALIZER ------------------------------- */

const EQ_BANDS = [38, 52, 30, 64, 46, 78, 58, 40, 70, 60, 44, 72];

interface EqRow {
  key: string;
  label: string;
  unit: string;
  color: string;
}

const EQ_ROWS: [keyof EqState, EqRow][] = [
  ['bass', { key: 'bass', label: 'Bass', unit: '60Hz', color: 'var(--accent)' }],
  ['mid', { key: 'mid', label: 'Mids', unit: '1.2kHz', color: 'var(--accent-2)' }],
  ['treble', { key: 'treble', label: 'Treble', unit: '8kHz', color: 'var(--accent)' }],
];

interface EqState {
  bass: number;
  mid: number;
  treble: number;
}

function EqualizerSkin() {
  const reducedMotion = usePrefersReducedMotion();
  const [eq, setEq] = useState<EqState>({ bass: 70, mid: 50, treble: 85 });
  const [playing, setPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(EQ_BANDS);

  const curve = (state: EqState): number[] =>
    EQ_BANDS.map((base, index) => {
      const boost = index < 4 ? state.bass : index > 8 ? state.treble : state.mid;
      const drift = reducedMotion ? 0 : Math.round(Math.random() * 12 - 6);
      const value = base * 0.55 + boost * 0.45 + drift;
      return Math.max(12, Math.min(96, Math.round(value)));
    });

  useEffect(() => {
    if (!playing || reducedMotion) {
      setBars(curve(eq));
      return;
    }
    const id = window.setInterval(() => {
      setBars((prev) =>
        prev.map((height) =>
          Math.max(12, Math.min(96, height + Math.round(Math.random() * 18 - 9))),
        ),
      );
    }, 150);
    return () => window.clearInterval(id);
  }, [playing, reducedMotion, eq]);

  const update = (key: keyof EqState, value: number) => {
    const next = { ...eq, [key]: value };
    setEq(next);
    setBars(curve(next));
  };

  return (
    <div className={styles.eq}>
      <header className={styles.skinHeader}>
        <span className={styles.skinBrand}>
          <span className={styles.eqGlyph} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          DSP Equalizer
        </span>
        <span className={styles.skinMeta}>44.1 kHz</span>
      </header>

      <div className={styles.eqCanvas}>
        <span className={styles.eqCanvasLabel}>Graphic EQ</span>
        {bars.map((height, index) => (
          <span
            key={index}
            className={styles.eqBar}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <div className={styles.eqSliders}>
        {EQ_ROWS.map(([key, row]) => {
          const value = eq[key];
          return (
            <label key={row.key} className={styles.eqField}>
              <span className={styles.eqLabelRow}>
                <span className={styles.eqLabel}>
                  {row.label} · {row.unit}
                </span>
                <span className={styles.eqValue} style={{ color: row.color }}>
                  +{value}dB
                </span>
              </span>
              <input
                className={styles.eqRange}
                type="range"
                min="0"
                max="100"
                value={value}
                style={{ accentColor: row.color }}
                onChange={(event) => update(key, Number(event.target.value))}
                aria-label={`${row.label} level`}
              />
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.btn}${playing ? ` ${styles.btnPrimary}` : ''}`}
        onClick={() => setPlaying((prev) => !prev)}
        aria-pressed={playing}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'DSP engaged' : 'Trigger sound demo'}
      </button>
    </div>
  );
}

/* -------------------------------- MINDLOG -------------------------------- */

interface MindEntry {
  id: number;
  time: string;
  text: string;
  tag: string;
}

const MIND_INITIAL: MindEntry[] = [
  {
    id: 1,
    time: '08:12',
    text: 'Shipped offline-first sync layer for Poros POS v2.',
    tag: 'work',
  },
  {
    id: 2,
    time: '09:04',
    text: 'Debugged thermal printer handshake on a low-end device.',
    tag: 'debug',
  },
  {
    id: 3,
    time: '09:31',
    text: 'Sketched n8n reorder automation for inventory levels.',
    tag: 'ideas',
  },
];

const VOICE_PROMPTS = [
  'Voice note: refactor Room repository to a single source of truth.',
  'Voice note: ship strobe latency fix to the Play Store tonight.',
  'Voice note: prototype agentic invoice summarizer this weekend.',
  'Voice note: rebalance EQ curve for outdoor speaker profiles.',
];

const timeNow = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function MindLogSkin() {
  const [entries, setEntries] = useState<MindEntry[]>(MIND_INITIAL);
  const [listening, setListening] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [draft, setDraft] = useState('');
  const captureTimer = useRef<number | null>(null);
  const syncTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (captureTimer.current) window.clearTimeout(captureTimer.current);
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    },
    [],
  );

  const addEntry = (text: string) => {
    setEntries((prev) =>
      [
        { id: Date.now(), time: timeNow(), text, tag: 'captured' },
        ...prev,
      ].slice(0, 6),
    );
    setSyncing(true);
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => setSyncing(false), 1400);
  };

  const capture = () => {
    if (listening) return;
    setListening(true);
    captureTimer.current = window.setTimeout(() => {
      const prompt = VOICE_PROMPTS[Math.floor(Math.random() * VOICE_PROMPTS.length)];
      setListening(false);
      addEntry(prompt);
    }, 1500);
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    addEntry(text);
  };

  return (
    <div className={styles.mind}>
      <header className={styles.skinHeader}>
        <span className={styles.skinBrand}>
          <MicIcon />
          MindLog
        </span>
        <span
          className={`${styles.syncBadge}${syncing ? ` ${styles.syncBadgeActive}` : ''}`}
        >
          <SyncIcon />
          {syncing ? 'Syncing' : 'Synced'}
        </span>
      </header>

      <ul className={styles.entryList}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.entry}>
            <span className={styles.entryTime}>{entry.time}</span>
            <span className={styles.entryText}>{entry.text}</span>
            <span className={styles.entryTag}>{entry.tag}</span>
          </li>
        ))}
      </ul>

      <div className={styles.entryRow}>
        <input
          className={styles.entryInput}
          value={draft}
          placeholder="Type a quick note…"
          aria-label="New diary note"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <button
          type="button"
          className={`${styles.micBtn}${listening ? ` ${styles.micBtnListening}` : ''}`}
          onClick={capture}
          aria-label={listening ? 'Listening to your voice' : 'Capture a voice entry'}
        >
          {listening ? <span className={styles.micDots}><span /><span /><span /></span> : <MicIcon />}
        </button>
      </div>

      <span className={styles.mindHint}>
        {listening ? 'Listening… transcribing on device' : 'Tap mic for voice-to-text'}
      </span>
    </div>
  );
}

/* ------------------------------- FLASHLIGHT ------------------------------- */

function FlashlightSkin() {
  const reducedMotion = usePrefersReducedMotion();
  const [on, setOn] = useState(false);
  const [strobe, setStrobe] = useState(false);

  const togglePower = () => {
    setOn((prev) => !prev);
    if (on) setStrobe(false);
  };

  const strobeActive = on && strobe && !reducedMotion;

  return (
    <div
      className={`${styles.flash}${on ? ` ${styles.flashOn}` : ''}${
        strobeActive ? ` ${styles.flashStrobe}` : ''
      }`}
    >
      <div className={styles.flashTop}>
        <span className={styles.skinBrand}>
          <SunIcon />
          Flashlight Pro
        </span>
        <span className={styles.skinMeta}>{on ? 'Active' : 'Standby'}</span>
      </div>

      <button
        type="button"
        className={styles.powerCore}
        onClick={togglePower}
        aria-pressed={on}
        aria-label={on ? 'Turn flashlight off' : 'Turn flashlight on'}
      >
        {on ? <SunIcon /> : <PowerIcon />}
      </button>

      <span className={styles.flashStatus}>
        {on ? 'LED engaged · 850 lm' : 'Tap the core to engage LED'}
      </span>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnGhost}`}
        onClick={() => setStrobe((value) => !value)}
        disabled={!on || reducedMotion}
        aria-pressed={strobe}
      >
        {strobe ? 'Strobe: on' : 'Strobe: off'}
      </button>
    </div>
  );
}