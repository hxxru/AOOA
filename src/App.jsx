import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import content from "../content/stages.json";
import packageJson from "../package.json";

const ENTRIES = content.stages;
const APP_VERSION = packageJson.version;
const ERA_CONFIG = {
  archean: {
    label: "Archean",
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.06)",
    startMya: 4200,
    endMya: 1800,
  },
  proterozoic: {
    label: "Proterozoic",
    color: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.06)",
    startMya: 1800,
    endMya: 541,
  },
  paleozoic: {
    label: "Paleozoic",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.06)",
    startMya: 541,
    endMya: 252,
  },
  mesozoic: {
    label: "Mesozoic",
    color: "#facc15",
    bg: "rgba(250, 204, 21, 0.06)",
    startMya: 252,
    endMya: 66,
  },
  cenozoic: {
    label: "Cenozoic",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.06)",
    startMya: 66,
    endMya: 0,
  },
};

const ERA_ORDER = ["archean", "proterozoic", "paleozoic", "mesozoic", "cenozoic"];
const MOBILE_NAV_QUERY = "(max-width: 760px), (pointer: coarse)";

function getEraStartIndex(index) {
  const era = ENTRIES[index].era;
  return ENTRIES.findIndex((entry) => entry.era === era);
}

function isMobileNavigationViewport() {
  return window.matchMedia(MOBILE_NAV_QUERY).matches;
}

function getConfidenceColor(confidence) {
  const value = confidence.toLowerCase();
  if (value.startsWith("high")) return "#4ade80";
  if (value.startsWith("medium-high") || value.startsWith("medium–high")) return "#2dd4bf";
  if (value.startsWith("medium-low") || value.startsWith("medium–low")) return "#fb923c";
  if (value.startsWith("medium")) return "#fbbf24";
  if (value.startsWith("low")) return "#f87171";
  return "#a1a1aa";
}

function ConfidencePill({ text }) {
  return (
    <span className="confidence-pill">
      <span
        className="confidence-dot"
        style={{ background: getConfidenceColor(text) }}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}

function Label({ children }) {
  return <div className="field-label">{children}</div>;
}

function DataField({ label, children }) {
  return (
    <div className="data-field">
      <Label>{label}</Label>
      <div className="data-field-value">{children}</div>
    </div>
  );
}

function TimelineStrip({ current }) {
  const entry = ENTRIES[current];
  const anchorIndex = getEraStartIndex(current);
  const anchorEntry = ENTRIES[anchorIndex];
  const PAD = 12;
  const visibleWindowMya = Math.max(anchorEntry.mya, 0.1);
  const visibleEntries = ENTRIES.slice(anchorIndex);

  // Patched from the original JSX. The first version used CSS calc() multiplication
  // with mixed units, which is invalid/fragile. These helpers move the multiplication
  // into JS and leave CSS with simple percentage + px or percentage - px expressions.
  const timelinePos = (pct) => `calc(${pct}% + ${PAD - (pct / 100) * PAD * 2}px)`;
  const timelineHeight = (pct) => `calc(${pct}% - ${(pct / 100) * PAD * 2}px)`;
  const visiblePercent = (mya) => (1 - mya / visibleWindowMya) * 100;

  return (
    <div className="timeline-strip" aria-label={`Timeline from ${anchorEntry.time} to now`}>
      {anchorIndex > 0 && (
        <div className="timeline-collapsed-history" title={`${anchorIndex} earlier stages collapsed`} />
      )}

      {ERA_ORDER.map((key) => {
        const e = ERA_CONFIG[key];
        const olderEdge = Math.min(e.startMya, visibleWindowMya);
        const newerEdge = Math.max(e.endMya, 0);
        if (olderEdge <= newerEdge) return null;

        const top = visiblePercent(olderEdge);
        const bottom = visiblePercent(newerEdge);
        return (
          <div
            key={key}
            className="timeline-era-band"
            style={{
              top: timelinePos(top),
              height: timelineHeight(bottom - top),
              background: e.color,
            }}
          />
        );
      })}

      <div className="timeline-center-line" style={{ top: PAD, bottom: PAD }} />

      {visibleEntries.map((candidate, offset) => {
        const pct = visiblePercent(candidate.mya);
        const index = anchorIndex + offset;
        const isCurrent = index === current;
        const color = ERA_CONFIG[candidate.era].color;
        return (
          <div
            key={candidate.id}
            className="timeline-dot"
            style={{
              "--timeline-pos": timelinePos(pct),
              top: timelinePos(pct),
              width: isCurrent ? 8 : 3,
              height: isCurrent ? 8 : 3,
              background: isCurrent ? color : "rgba(255,255,255,0.18)",
              zIndex: isCurrent ? 3 : 1,
              boxShadow: isCurrent ? `0 0 8px ${color}60` : "none",
            }}
          />
        );
      })}

      <div
        className="timeline-current-tick"
        style={{
          "--timeline-pos": timelinePos(visiblePercent(entry.mya)),
          top: timelinePos(visiblePercent(entry.mya)),
          background: ERA_CONFIG[entry.era].color,
        }}
      />

      <div className="timeline-label timeline-label-now">now</div>
      <div className="timeline-label timeline-label-current">{anchorEntry.time}</div>
    </div>
  );
}

function EntryList({ current, onSelect }) {
  const scrollRef = useRef(null);
  const currentEntry = ENTRIES[current];
  const anchorIndex = getEraStartIndex(current);
  const earlierCount = anchorIndex;
  const visibleCount = ENTRIES.length - anchorIndex;
  const era = ERA_CONFIG[currentEntry.era];
  const visibleLabel = `${era.label} onward`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [anchorIndex]);

  const grouped = useMemo(() => {
    const items = [];
    let lastEra = null;
    ENTRIES.slice(anchorIndex).forEach((entry, offset) => {
      if (entry.era !== lastEra) {
        items.push({ type: "era", era: entry.era });
        lastEra = entry.era;
      }
      items.push({ type: "entry", entry, index: anchorIndex + offset });
    });
    return items;
  }, [anchorIndex]);

  return (
    <nav className="entry-list" aria-label="Ancestor stages">
      <div className="entry-list-status">
        <button
          type="button"
          className="earlier-collapse"
          onClick={() => onSelect(anchorIndex - 1)}
          disabled={earlierCount === 0}
          aria-label={earlierCount > 0 ? `Go to previous stage, ${earlierCount} earlier stages` : "At earliest stage"}
        >
          {earlierCount > 0 ? `${earlierCount} earlier` : "origin"}
        </button>
        <div className="entry-list-current-time">
          <span>{currentEntry.time}</span>
          <small>{visibleLabel} - {visibleCount} visible</small>
        </div>
      </div>

      <div ref={scrollRef} className="entry-list-scroll">
        {grouped.map((item) => {
          if (item.type === "era") {
            const cfg = ERA_CONFIG[item.era];
            return (
              <div key={`era-${item.era}`} className="entry-era-label" style={{ color: cfg.color }}>
                {cfg.label}
              </div>
            );
          }

          const { entry, index } = item;
          const active = index === current;
          const cfg = ERA_CONFIG[entry.era];

          return (
            <button
              key={entry.id}
              type="button"
              className={`entry-list-item ${active ? "is-active" : ""}`}
              style={{
                "--entry-color": cfg.color,
                borderLeftColor: active ? cfg.color : "transparent",
              }}
              onClick={() => onSelect(index)}
            >
              <span
                className="entry-list-dot"
                style={{ background: active ? cfg.color : "rgba(255,255,255,0.2)" }}
                aria-hidden="true"
              />
              <span className="entry-list-name">{entry.name}</span>
            </button>
          );
        })}
        <div className="entry-list-bottom-spacer" />
      </div>
    </nav>
  );
}

function PageContent({ entry }) {
  const era = ERA_CONFIG[entry.era];

  return (
    <main className="page-content" style={{ background: era.bg }}>
      <div className="era-bar" style={{ background: era.color }} />

      <div className="page-header-row">
        <span className="stage-number">#{String(entry.id).padStart(2, "0")}</span>
        <span className="stage-time" style={{ color: era.color }}>
          {entry.time}
        </span>
      </div>

      <h1>{entry.name}</h1>
      <div className="stage-group">{entry.group}</div>

      <div className="illustration-placeholder" role="img" aria-label={`Illustration placeholder for ${entry.name}`}>
        <span>illustration</span>
      </div>

      <section className="stage-fields" aria-label="Stage details">
        <DataField label="exemplar fossils / analogues">
          <em>{entry.fossils}</em>
        </DataField>

        <div className="data-field">
          <Label>characteristics</Label>
          <div className="characteristics-row">
            <span><span aria-hidden="true">↔</span>{entry.length}</span>
            <span><span aria-hidden="true">⚖</span>{entry.mass}</span>
            <span><span aria-hidden="true">⟳</span>{entry.genTime}</span>
          </div>
        </div>

        <DataField label="key innovation">{entry.innovation}</DataField>

        <DataField label="proximity confidence">
          <ConfidencePill text={entry.confidence} />
        </DataField>
      </section>

      <section className="explainer-placeholder" aria-label="Detailed explainer placeholder">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <span>detailed explainer content</span>
      </section>
    </main>
  );
}

function InfoModal({ onClose }) {
  const blocks = [
    {
      head: "what this is",
      body: "45 stages of human evolutionary ancestry, from the origin of cellular life (~4.2 billion years ago) to recent modern humans. Each page represents a stage where a major innovation appeared on our lineage.",
    },
    {
      head: "navigating",
      body: "Use ← → arrow keys, click entries in the sidebar, or use the prev/next buttons at the bottom.",
    },
    {
      head: "timeline strip",
      body: "The thin bar on the far left is linear time. Most entries cluster near the bottom — everything since the Cambrian explosion fits in the last ~13% of life's history.",
    },
    {
      head: "fossils are cousins",
      body: content.project.aboutCaveat,
    },
    {
      head: "confidence badges",
      body: "Reflect how certain placement on our direct lineage is. Green = high, teal = medium-high, amber = medium, orange = medium-low.",
    },
    {
      head: "characteristics",
      body: "Body length (↔), mass (⚖), and generation time (⟳) are approximate. Well-constrained for later vertebrates from fossil material; order-of-magnitude for pre-animal stages.",
    },
  ];

  return (
    <div className="info-modal-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="info-modal"
        role="dialog"
        aria-modal="true"
        aria-label="How to read this visualization"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="info-panel-header">
          <span>how to read this</span>
          <button type="button" onClick={onClose} aria-label="Close info panel">×</button>
        </div>
        {blocks.map((block) => (
          <div className="info-block" key={block.head}>
            <div className="info-block-head">{block.head}</div>
            <div className="info-block-body">{block.body}</div>
          </div>
        ))}
      </aside>
    </div>
  );
}

export default function App() {
  const [idx, setIdx] = useState(0);
  const [infoOpen, setInfoOpen] = useState(true);
  const [swipeHintVisible, setSwipeHintVisible] = useState(true);
  const gestureStartRef = useRef(null);
  const mainShellRef = useRef(null);

  const go = useCallback((dir) => {
    setIdx((previous) => {
      const next = previous + dir;
      if (next < 0) return 0;
      if (next >= ENTRIES.length) return ENTRIES.length - 1;
      if (next !== previous) setSwipeHintVisible(false);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (infoOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setInfoOpen(false);
        }
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        setIdx(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        setIdx(ENTRIES.length - 1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, infoOpen]);

  const startGesture = useCallback((x, y) => {
    if (infoOpen || !isMobileNavigationViewport()) return;
    gestureStartRef.current = { x, y };
  }, [infoOpen]);

  const endGesture = useCallback((x, y) => {
    if (infoOpen || !gestureStartRef.current) return;

    const deltaX = x - gestureStartRef.current.x;
    const deltaY = y - gestureStartRef.current.y;
    gestureStartRef.current = null;

    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    go(deltaX < 0 ? 1 : -1);
  }, [go, infoOpen]);

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    startGesture(touch.clientX, touch.clientY);
  }, [startGesture]);

  const handleTouchEnd = useCallback((event) => {
    if (event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    endGesture(touch.clientX, touch.clientY);
  }, [endGesture]);

  const handleTouchCancel = useCallback(() => {
    gestureStartRef.current = null;
  }, []);

  useEffect(() => {
    const shell = mainShellRef.current;
    if (!shell) return undefined;

    shell.addEventListener("touchstart", handleTouchStart, { passive: true });
    shell.addEventListener("touchend", handleTouchEnd, { passive: true });
    shell.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      shell.removeEventListener("touchstart", handleTouchStart);
      shell.removeEventListener("touchend", handleTouchEnd);
      shell.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [handleTouchCancel, handleTouchEnd, handleTouchStart]);

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === "touch") return;
    startGesture(event.clientX, event.clientY);
  }, [startGesture]);

  const handlePointerUp = useCallback((event) => {
    if (event.pointerType === "touch") return;
    endGesture(event.clientX, event.clientY);
  }, [endGesture]);

  const entry = ENTRIES[idx];
  const era = ERA_CONFIG[entry.era];

  return (
    <div className="app-shell">
      <div className="content-row">
        <div className="sidebar-shell">
          <TimelineStrip current={idx} />
          <EntryList current={idx} onSelect={setIdx} />
        </div>

        <div
          ref={mainShellRef}
          className="main-shell"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <PageContent key={entry.id} entry={entry} />

          {!infoOpen && (
            <button className="info-toggle" type="button" onClick={() => setInfoOpen(true)} aria-label="Open info panel">
              i
            </button>
          )}

          {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
        </div>
      </div>

      <footer className="bottom-nav">
        <button type="button" onClick={() => go(-1)} disabled={idx === 0}>
          ← prev
        </button>

        <div className="stage-counter">
          <span className="stage-counter-dot" style={{ background: era.color }} aria-hidden="true" />
          <span className="stage-counter-current">{idx + 1}</span>
          <span>/</span>
          <span>{ENTRIES.length}</span>
        </div>

        <button type="button" onClick={() => go(1)} disabled={idx === ENTRIES.length - 1}>
          next →
        </button>

        {swipeHintVisible && <span className="swipe-hint">swipe to navigate</span>}
        <span className="app-version">v{APP_VERSION}</span>
      </footer>
    </div>
  );
}
