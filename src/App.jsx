import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import content from "../content/stages.json";

const ENTRIES = content.stages;
const MAX_MYA = 4200;

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

const myaToPercent = (mya) => (1 - mya / MAX_MYA) * 100;

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
  const era = ERA_CONFIG[entry.era];
  const PAD = 12;

  // Patched from the original JSX. The first version used CSS calc() multiplication
  // with mixed units, which is invalid/fragile. These helpers move the multiplication
  // into JS and leave CSS with simple percentage + px or percentage - px expressions.
  const timelinePos = (pct) => `calc(${pct}% + ${PAD - (pct / 100) * PAD * 2}px)`;
  const timelineHeight = (pct) => `calc(${pct}% - ${(pct / 100) * PAD * 2}px)`;

  return (
    <div className="timeline-strip" aria-hidden="true">
      {ERA_ORDER.map((key) => {
        const e = ERA_CONFIG[key];
        const top = myaToPercent(e.startMya);
        const bottom = myaToPercent(e.endMya);
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

      {ENTRIES.map((candidate, index) => {
        const pct = myaToPercent(candidate.mya);
        const isCurrent = index === current;
        const color = ERA_CONFIG[candidate.era].color;
        return (
          <div
            key={candidate.id}
            className="timeline-dot"
            style={{
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
        style={{ top: timelinePos(myaToPercent(entry.mya)), background: era.color }}
      />

      <div className="timeline-label timeline-label-now">now</div>
      <div className="timeline-label timeline-label-deep">4.2Ga</div>
    </div>
  );
}

function EntryList({ current, onSelect }) {
  const activeRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activeRef.current || !scrollRef.current) return;
    const container = scrollRef.current;
    const active = activeRef.current;
    const top = active.offsetTop - container.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
    container.scrollTo({ top, behavior: "smooth" });
  }, [current]);

  const grouped = useMemo(() => {
    const items = [];
    let lastEra = null;
    ENTRIES.forEach((entry, index) => {
      if (entry.era !== lastEra) {
        items.push({ type: "era", era: entry.era });
        lastEra = entry.era;
      }
      items.push({ type: "entry", entry, index });
    });
    return items;
  }, []);

  return (
    <nav className="entry-list" aria-label="Ancestor stages">
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
              ref={active ? activeRef : null}
              type="button"
              className={`entry-list-item ${active ? "is-active" : ""}`}
              style={{ borderLeftColor: active ? cfg.color : "transparent" }}
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

function InfoPanel({ onClose }) {
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
    <aside className="info-panel" aria-label="How to read this visualization">
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
  );
}

export default function App() {
  const [idx, setIdx] = useState(0);
  const [infoOpen, setInfoOpen] = useState(true);

  const go = useCallback((dir) => {
    setIdx((previous) => {
      const next = previous + dir;
      if (next < 0) return 0;
      if (next >= ENTRIES.length) return ENTRIES.length - 1;
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (event) => {
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
  }, [go]);

  const entry = ENTRIES[idx];
  const era = ERA_CONFIG[entry.era];

  return (
    <div className="app-shell">
      <div className="content-row">
        <div className="sidebar-shell">
          <TimelineStrip current={idx} />
          <EntryList current={idx} onSelect={setIdx} />
        </div>

        <div className="main-shell">
          <PageContent key={entry.id} entry={entry} />

          {!infoOpen && (
            <button className="info-toggle" type="button" onClick={() => setInfoOpen(true)} aria-label="Open info panel">
              i
            </button>
          )}

          {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
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
      </footer>
    </div>
  );
}
