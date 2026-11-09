import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  Flame,
  Swords,
  Sword,
  Shield,
  Compass,
  Map,
  BookOpen,
  User,
  Backpack,
  ChevronRight,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Check,
  Lock,
  Heart,
  Zap,
  Sparkles,
  Sun,
  Moon,
  CloudFog,
  Footprints,
  Skull,
  Wind,
  Target,
  RotateCcw,
  Scroll,
  Eye,
  Mountain,
  Gem,
  Move,
  Search,
  HelpCircle,
  Anvil,
  Play,
  Pause,
  ChevronsUp,
  Feather,
  Droplets,
  Save,
} from "lucide-react";
import { regionProfile } from "./regions";
import { SkillTree, ThroneArcs } from "./ProgressionPanels";
import { endingCoda } from "./story";
import { gearRarity, bonuses, spellFocusCost } from "./progression";
import { encodeSave } from "./saveTransport";
import { RecoveryBoundary, installErrorLogging } from "./RecoveryBoundary";
import { SoulAudio } from "./audio";
const World = lazy(() => import("./World"));
const CharacterViewer = lazy(() => import("./CharacterViewer"));
import SettingsPanel from "./SettingsPanel";
import { loadPreferences, savePreferences } from "./preferences";
import { unseal, SECRET_GATES, secretOpen } from "./exploration";

import {
  CHAPTERS,
  ECHOES,
  NPC_TOPICS,
  campaignState,
  currentChapter,
  chapterObjective,
  chapterReady,
  rememberEcho,
  claimChapter,
  chapterConclusion,
} from "./campaign";
import {
  CLASSES,
  ATTRS,
  REGIONS,
  WEAPONS,
  ARMOURS,
  SPELLS,
  DIFFICULTIES,
} from "./data";
import {
  createCharacter,
  loadSave,
  saveGame,
  limits,
  levelCost,
  flaskCount,
  spendLevel,
  SAVE_KEY,
  saveHealth,
} from "./state";
import "./style.css";
const Icon = ({ name, ...props }) => {
  const C =
    {
      shield: Shield,
      swords: Swords,
      axe: Sword,
      sparkles: Sparkles,
      wand: Sparkles,
      sword: Sword,
      sun: Sun,
      flame: Flame,
    }[name] || Flame;
  return <C {...props} />;
};
function Modal({ title, eyebrow, children, onClose, wide = false }) {
  const dialog = useRef();
  useEffect(() => {
    const prior = document.activeElement;
    const root = dialog.current;
    const controls = () =>
      [
        ...root.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        ),
      ].filter((el) => !el.disabled && el.getClientRects().length);
    controls()[0]?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = controls(),
          first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    let menuFrame;
    const padNow = () =>
      Array.from(navigator.getGamepads?.() || []).find(
        (p) => p?.connected && p.mapping === "standard",
      );
    let previousButtons = padNow()?.buttons.map((b) => b.pressed) || [],
      lastMove = 0;
    const menuPad = (now) => {
      const pad = padNow();
      if (pad) {
        const pressed = (i) => pad.buttons[i]?.pressed && !previousButtons[i];
        const list = controls();
        const direction =
          pad.buttons[13]?.pressed || pad.axes[1] > 0.55
            ? 1
            : pad.buttons[12]?.pressed || pad.axes[1] < -0.55
              ? -1
              : 0;
        if (direction && now - lastMove > 250) {
          lastMove = now;
          const current = list.indexOf(document.activeElement);
          const next = list[(current + direction + list.length) % list.length];
          next?.focus();
          next?.scrollIntoView({ block: "nearest" });
        }
        if (pressed(0)) document.activeElement?.click();
        if (pressed(1) || pressed(9)) onClose();
        previousButtons = pad.buttons.map((b) => b.pressed);
      } else previousButtons = [];
      menuFrame = requestAnimationFrame(menuPad);
    };
    menuFrame = requestAnimationFrame(menuPad);
    return () => {
      cancelAnimationFrame(menuFrame);
      window.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="close icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        <div className="eyebrow gold">{eyebrow || "THE FALLEN REALM"}</div>
        <h2>{title}</h2>
        <div className="ornament">
          <span />◆<span />
        </div>
        {children}
      </section>
    </div>
  );
}
const nodeCoords = [
  [23, 61],
  [18, 35],
  [42, 45],
  [37, 78],
  [38, 17],
  [53, 64],
  [65, 30],
  [57, 87],
  [70, 73],
  [67, 12],
  [84, 57],
  [85, 28],
  [89, 11],
];
function RealmMap({ state, large = false, onSelect }) {
  const region = state?.region || 0;
  return (
    <div className={`realm-map ${large ? "large-map" : ""}`}>
      <svg className="map-art" viewBox="0 0 400 270" preserveAspectRatio="none">
        <defs>
          <pattern
            id="grain"
            width="35"
            height="35"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M3 6l5-3m15 18l3-5M12 32h4"
              stroke="#8d8056"
              strokeWidth=".4"
              opacity=".3"
            />
          </pattern>
          <radialGradient id="land">
            <stop stopColor="#4b4c35" />
            <stop offset="1" stopColor="#292e26" />
          </radialGradient>
        </defs>
        <rect width="400" height="270" fill="#202721" />
        <path
          d="M64 78L102 38 146 51 160 13 206 25 221 65 282 34 335 47 362 81 346 120 371 160 332 217 282 203 256 252 220 220 164 244 121 207 65 225 31 177 45 131Z"
          fill="url(#land)"
          stroke="#81734d"
          strokeWidth="1.2"
        />
        <path
          d="M61 91l45-34 39 12 18-33 34 7 12 42 60-23 56 10 23 25-17 31 23 32-27 41-45-13-30 45-30-32-53 26-46-38-50 22-29-38 20-40z"
          fill="none"
          stroke="#7e734f"
          opacity=".22"
        />
        <path
          d="M194 48q-35 38 15 64t12 87M94 106q50 12 73 55t107 15"
          fill="none"
          stroke="#759492"
          strokeWidth="2"
          opacity=".3"
        />
        {Array.from({ length: 27 }, (_, i) => {
          const x = 80 + ((i * 67) % 240),
            y = 50 + ((i * 37) % 160);
          return (
            <g key={i} opacity=".22" stroke="#b0a47d" fill="none">
              <path d={`M${x} ${y + 10}l6-11 6 11m-9-5l3-6 4 6`} />
            </g>
          );
        })}
        <rect width="400" height="270" fill="url(#grain)" />
        {REGIONS.map((r, i) =>
          r.links
            .filter((j) => j > i)
            .map((j) => (
              <path
                key={`${i}-${j}`}
                d={`M${nodeCoords[i][0] * 4} ${nodeCoords[i][1] * 2.7}L${nodeCoords[j][0] * 4} ${nodeCoords[j][1] * 2.7}`}
                stroke={i === region || j === region ? "#c9ad6c" : "#8b825d"}
                strokeWidth="1"
                strokeDasharray="3 5"
                opacity={large ? 0.45 : 0.3}
              />
            )),
        )}
        <text x="350" y="245" fill="#a79870" fontSize="12" fontFamily="serif">
          N
        </text>
        <path d="M355 248v-33m-5 10l5-10 5 10" stroke="#a79870" fill="none" />
      </svg>
      {REGIONS.map((r, i) => {
        const discovered = state?.discovered.includes(i) || i === 0;
        return (
          <button
            key={r.id}
            className={`map-node ${i === region ? "current" : ""} ${discovered ? "known" : ""}`}
            style={{
              left: `${nodeCoords[i][0]}%`,
              top: `${nodeCoords[i][1]}%`,
            }}
            title={r.name}
            onClick={() => onSelect(i)}
            aria-label={`${r.name}${discovered ? " · discovered" : ""}`}
          >
            {i === region ? (
              <Flame size={large ? 18 : 12} />
            ) : discovered ? (
              <span>◆</span>
            ) : (
              <span>◇</span>
            )}
            {large && <label>{r.name}</label>}
          </button>
        );
      })}
      {!large && <div className="map-caption">THE FALLEN REALM</div>}
    </div>
  );
}
function CharacterCreation({ onCreate, onClose }) {
  const [step, setStep] = useState(0),
    [className, setClass] = useState("Knight"),
    [name, setName] = useState(""),
    [difficulty, setDifficulty] = useState("Normal"),
    [origin, setOrigin] = useState("Ashen Exile"),
    [gender, setGender] = useState("Unbound"),
    [appearance, setAppearance] = useState("Ash"),
    [history, setHistory] = useState("");
  const cl = CLASSES.find((c) => c.name === className);
  return (
    <Modal
      title={
        step === 0
          ? "Before the last light fades."
          : "Who will the ashes remember?"
      }
      eyebrow={
        step === 0 ? "PROLOGUE · THE GREAT FRACTURE" : "CREATE YOUR WANDERER"
      }
      onClose={onClose}
      wide
    >
      {step === 0 ? (
        <div className="prologue">
          <div className="prologue-emblem">
            <Flame size={55} />
          </div>
          <p>
            Before the first kingdom, seven thrones held the world in balance.
          </p>
          <p>Then Creation shattered.</p>
          <p>
            The sky broke. The dead returned. And the gods learned what it meant
            to die.
          </p>
          <p className="muted">
            Nine hundred years later, you awaken beside a fire you do not
            remember lighting. In your hand, a shard of something that should
            not exist.
          </p>
          <blockquote>
            “When the last light fades, seek the one who casts no shadow.”
          </blockquote>
          <button className="button primary" onClick={() => setStep(1)}>
            Awaken from the ashes <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="creation-top">
            <label>
              Your name
              <input
                autoFocus
                maxLength={24}
                placeholder="The Unnamed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Origin
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              >
                {[
                  "Ashen Exile",
                  "Crownfall Deserter",
                  "Drowned Scholar",
                  "Nameless Pilgrim",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Identity
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                {["Unbound", "Woman", "Man", "Nonbinary"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="section-label">
            CHOOSE YOUR BEGINNING{" "}
            <span>Classes shape your start. Your path is your own.</span>
          </div>
          <div className="classes">
            {CLASSES.map((c) => (
              <button
                className={`class-card ${className === c.name ? "selected" : ""}`}
                key={c.name}
                onClick={() => setClass(c.name)}
              >
                <Icon name={c.icon} size={27} />
                <strong>{c.name}</strong>
                <small>{c.desc}</small>
              </button>
            ))}
          </div>
          <div className="creation-detail">
            <div>
              <Icon name={cl.icon} size={30} />
              <div>
                <h3>{cl.name}</h3>
                <p>
                  {cl.weapon} · {cl.armour}
                </p>
              </div>
            </div>
            <div className="mini-stats">
              {ATTRS.map((a, i) => (
                <span key={a}>
                  {a.slice(0, 3).toUpperCase()} <b>{cl.stats[i]}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="creation-bottom">
            <div className="creation-option">
              <span>Difficulty</span>
              <div className="segment">
                {Object.keys(DIFFICULTIES).map((d) => (
                  <button
                    className={difficulty === d ? "selected" : ""}
                    key={d}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <small>
                Fixed for this campaign.{" "}
                {difficulty === "Story"
                  ? "Forgiving damage and six healing flasks."
                  : difficulty === "Normal"
                    ? "A fair challenge. Four healing flasks."
                    : difficulty === "Veteran"
                      ? "Stronger enemies. Three healing flasks."
                      : "Unforgiving enemies. Two healing flasks."}
              </small>
            </div>
            <div className="creation-option">
              <span>Appearance</span>
              <div className="segment">
                {["Ash", "Ember", "Frost"].map((x) => (
                  <button
                    className={appearance === x ? "selected" : ""}
                    onClick={() => setAppearance(x)}
                    key={x}
                  >
                    <span className={`swatch ${x.toLowerCase()}`} />
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label>
            What remains of your past? <span className="muted">(optional)</span>
            <textarea
              placeholder="A memory, an oath, a name you cannot forget…"
              value={history}
              maxLength={400}
              onChange={(e) => setHistory(e.target.value)}
            />
          </label>
          <button
            className="button primary full"
            onClick={() =>
              onCreate({
                name,
                className,
                difficulty,
                origin,
                gender,
                appearance,
                history,
              })
            }
          >
            Enter the fallen realm <ArrowRight size={17} />
          </button>
        </>
      )}
    </Modal>
  );
}
function App() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let mounted = true;
    const check = () => {
      if (!navigator.serviceWorker.controller) return;
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
      }, 1500);
      channel.port1.onmessage = (e) => {
        clearTimeout(timeout);
        if (mounted) setOfflineReady(e.data?.ready === true);
        channel.port1.close();
      };
      navigator.serviceWorker.controller.postMessage(
        { type: "SOUL_CACHE_STATUS" },
        [channel.port2],
      );
    };
    navigator.serviceWorker.ready.then(check);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", check);
    };
  }, []);
  const [recovered] = useState(() => saveHealth() === "recovered");
  useEffect(() => {
    savePreferences(preferences);
    audioRef.current?.setMix(preferences);
  }, [preferences]);
  const [state, setState] = useState(() => loadSave()),
    [panel, setPanel] = useState(null),
    [active, setActive] = useState(false),
    [tab, setTab] = useState("World"),
    [epoch, setEpoch] = useState(0),
    [target, setTarget] = useState({
      interaction: "Explore the old pilgrim road",
    }),
    [notices, setNotices] = useState([]),
    [audio, setAudio] = useState(false),
    [expanded, setExpanded] = useState(false),
    [invCategory, setInvCategory] = useState("Weapons"),
    [selectedItem, setSelectedItem] = useState(null),
    [mapSelection, setMapSelection] = useState(null),
    [saved, setSaved] = useState(true),
    [npcInput, setNpcInput] = useState(""),
    [npcReply, setNpcReply] = useState(""),
    [sanctTab, setSanctTab] = useState("Rest");
  const stateRef = useRef(state),
    actionRef = useRef(),
    audioRef = useRef(),
    sceneRef = useRef(),
    stickRef = useRef(),
    moodRef = useRef();
  moodRef.current = {
    region: state?.region || 0,
    boss: !!target.enemy?.boss,
    combat: !!target.enemy,
    paused: !!panel || !active,
  };
  useEffect(() => {
    const previous = document.body.style.overflow;
    if (panel || expanded) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [panel, expanded]);
  useEffect(() => {
    const visibility = () => {
      const ctx = audioRef.current?.ctx;
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      audioRef.current?.close();
    };
  }, []);
  const region = REGIONS[state?.region || 0];
  const chapter = currentChapter(state);
  const campaign = campaignState(state);
  const regionalChapter = CHAPTERS.find((c) => c.region === state?.region);
  const max = state ? limits(state) : { hp: 228, stamina: 112, focus: 90 };
  const notify = (text, type = "info", spatial = null) => {
    audioRef.current?.cue(type, text, spatial);
    setNotices((n) => [
      ...n.slice(-2),
      { text, type, id: Date.now() + Math.random() },
    ]);
  };
  const update = (next) => {
    const s = typeof next === "function" ? next(stateRef.current) : next;
    stateRef.current = s;
    setState(s);
  };
  useEffect(() => {
    const timer = setInterval(() => {
      if (stateRef.current) setSaved(saveGame(stateRef.current));
    }, 2000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const save = () => {
      if (stateRef.current) saveGame(stateRef.current);
    };
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, []);
  useEffect(() => {
    if (!notices.length) return;
    const t = setTimeout(() => setNotices((n) => n.slice(1)), 4500);
    return () => clearTimeout(t);
  }, [notices]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && active) setPanel("pause");
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [active]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape" && !panel && active) setPanel("pause");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [panel, active]);
  const open = (p) => {
    setPanel(p);
    if (p === "npc") {
      setNpcInput("");
      setNpcReply("");
    }
  };
  const interact = (kind) => {
    if (kind === "respawn") {
      setEpoch((x) => x + 1);
      setTarget({ interaction: "Rest at the sanctuary" });
      return;
    }
    open(kind === "travel" ? "map" : kind);
  };
  const travel = (i) => {
    const s = stateRef.current;
    if (!s) {
      notify("Begin your journey to explore the realm.");
      return;
    }
    if (!s.discovered.includes(i) && !REGIONS[s.region].links.includes(i)) {
      notify("Discover a connecting road before venturing here.");
      return;
    }
    setLoadingRegion(true);
    update({
      ...s,
      region: i,
      position: { x: 0, z: 9 },
      discovered: [...new Set([...s.discovered, i])],
      events: [...s.events.slice(-15), `Entered ${REGIONS[i].name}.`],
    });
    setPanel(null);
    setTarget({ interaction: "Rest at the sanctuary" });
    setMapSelection(null);
    setActive(true);
    notify(`Discovered · ${REGIONS[i].name}`, "reward");
  };
  const rest = () => {
    const s = stateRef.current;
    update({
      ...s,
      hp: max.hp,
      stamina: max.stamina,
      focus: max.focus,
      flasks: flaskCount(s),
      sanctuary: s.region,
      time: (s.time + 5) % 24,
      worldDay: s.worldDay + 1,
      events: [
        ...s.events.slice(-15),
        s.worldDay % 2
          ? "The Crownfall militia has withdrawn to the inner walls."
          : "A caravan has vanished beneath the Hollowwood.",
      ],
    });
    setEpoch((x) => x + 1);
    notify(
      "Sanctuary kindled. Your wounds fade; the hollow rise again.",
      "reward",
    );
  };
  const chooseNPC = (choice) => {
    const s = stateRef.current;
    if (s.choices[s.region]) return;
    const mercy = choice === "mercy";
    const gained =
      s.region === 0
        ? "Cinderheart"
        : s.region === 1
          ? "Widow’s Kiss"
          : s.region === 5
            ? "Oracle’s Eye"
            : "Witness’s Relic";
    update({
      ...s,
      choices: { ...s.choices, [s.region]: choice },
      mercy: s.mercy + (mercy ? 1 : 0),
      quests: {
        ...s.quests,
        [s.region]: mercy ? "An oath made" : "A bargain struck",
      },
      essence: s.essence + (mercy ? 75 : 175),
      relics: [...new Set([...s.relics, gained])],
      events: [
        ...s.events.slice(-15),
        `${region.npc}: ${s.region === 2 ? (mercy ? "the refuge gate was opened. Refugees will send an extra flask to every sanctuary." : "the confession was made. Edrin’s iron guard reduces blocked damage.") : mercy ? "you offered your aid." : "you claimed the forbidden knowledge."}`,
      ],
    });
    setNpcReply("");
    notify(
      mercy
        ? "An oath is remembered. A relic entrusted."
        : "Forbidden knowledge has a price. The realm remembers.",
      "reward",
    );
  };
  const toggleAudio = () => {
    if (audioRef.current) {
      audioRef.current.close();
      audioRef.current = null;
      setAudio(false);
      return;
    }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    audioRef.current = new SoulAudio(C, () => ({
      ...moodRef.current,
      paused: document.hidden || moodRef.current.paused,
    }));
    audioRef.current.setMix(preferences);
    audioRef.current.ctx.resume().catch(() => {});
    setAudio(true);
  };
  const keyLabel = (action) =>
    preferences.bindings[action] === " "
      ? "SPACE"
      : preferences.bindings[action].toUpperCase();
  const nav = (t) => {
    setTab(t);
    if (t === "World") setPanel(null);
    else if (!state) setPanel("create");
    else setPanel(t.toLowerCase());
  };
  const full = () => setExpanded((x) => !x);
  const item =
    WEAPONS.find((w) => w.name === selectedItem) ||
    WEAPONS.find((w) => w.name === state?.weapon) ||
    WEAPONS[0];
  return (
    <div
      className={`app ${preferences.highContrast ? "high-contrast" : ""} ${preferences.reducedMotion ? "reduced-motion" : ""}`}
      data-vision={preferences.colorblind}
    >
      <header className="header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav("World");
          }}
        >
          <div className="brand-symbol">
            <Flame size={27} />
          </div>
          <div>
            SOUL LAND<span>THE FALLEN REALM</span>
          </div>
        </a>
        <nav>
          {[
            { n: "World", i: Compass },
            { n: "Inventory", i: Backpack },
            { n: "Character", i: User },
            { n: "Journal", i: BookOpen },
          ].map(({ n, i: I }) => (
            <button
              key={n}
              className={tab === n ? "active" : ""}
              onClick={() => nav(n)}
            >
              <I size={16} />
              <span>{n}</span>
            </button>
          ))}
        </nav>
        <div className="header-right">
          <div className="essence">
            <Gem size={17} />
            <b>{(state?.essence || 0).toLocaleString()}</b>
            <span>SOUL ESSENCE</span>
          </div>
          <span className="header-divider" />
          <button
            className="icon-button settings"
            aria-label="Settings"
            onClick={() => open("settings")}
          >
            <Settings size={18} />
          </button>
          <button
            className="avatar"
            aria-label="Open character"
            onClick={() => nav("Character")}
          >
            <User size={19} />
            <span className="online-dot" />
          </button>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="tiny-line" /> YOUR JOURNEY INTO THE UNKNOWN
            </div>
            <h1>The world has not forgotten.</h1>
            <p>
              Seven thrones. A shattered realm. A story only you can finish.
            </p>
          </div>
          <button
            className="button outline map-button"
            onClick={() => open("map")}
          >
            <Map size={16} /> Realm map <ArrowUpRight size={15} />
          </button>
        </section>
        <div className="main-grid">
          <section
            ref={sceneRef}
            className={`game-card ${expanded ? "expanded" : ""} ${active ? "playing" : ""}`}
          >
            <Suspense
              fallback={
                <div className="realm-loading" role="status">
                  Gathering the realm…
                </div>
              }
            >
              <World
                preferences={preferences}
                onReady={() => setLoadingRegion(false)}
                state={state}
                stateRef={stateRef}
                active={active}
                paused={!!panel}
                onChange={update}
                onEvent={notify}
                onTarget={(v) => setTarget((t) => ({ ...t, ...v }))}
                onInteract={interact}
                actionRef={actionRef}
                epoch={epoch}
              />
            </Suspense>
            {loadingRegion && (
              <div className="realm-loading" role="status">
                Opening the pilgrim road…
              </div>
            )}
            {!active && <div className="hero-art" />}
            <div className="scene-vignette" />
            <div className="scene-top">
              <div className="location-chip">
                <span className="live-dot" />
                <span>{active ? "EXPLORING" : "YOUR JOURNEY BEGINS"}</span>
                <span className="chip-divider" />
                {region.name}
              </div>
              <div className="scene-tools">
                <button
                  className="glass-button"
                  title={audio ? "Mute ambience" : "Enable ambience"}
                  aria-label={audio ? "Mute ambience" : "Enable ambience"}
                  onClick={toggleAudio}
                >
                  {audio ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  className="glass-button"
                  aria-label={
                    expanded ? "Exit expanded view" : "Expand game view"
                  }
                  onClick={full}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                {active && (
                  <button
                    className="glass-button"
                    aria-label="Pause game"
                    onClick={() => open("pause")}
                  >
                    <Pause size={16} />
                  </button>
                )}
              </div>
            </div>
            {active && state ? (
              <>
                <div className="player-hud">
                  <div className="hud-sigil">
                    <Flame size={24} />
                  </div>
                  <div>
                    <strong>
                      {state.name}
                      <span>LV. {state.level}</span>
                    </strong>
                    {[
                      ["Vitality", state.hp, max.hp, "hp"],
                      ["Stamina", state.stamina, max.stamina, "stamina"],
                      ["Focus", state.focus, max.focus, "focus"],
                    ].map(([label, value, total, color]) => (
                      <div
                        className="hud-bar"
                        key={label}
                        title={`${label}: ${Math.ceil(value)} / ${total}`}
                      >
                        <div
                          className={color}
                          style={{
                            width: `${Math.max(0, (value / total) * 100)}%`,
                          }}
                        />
                        <label>
                          {label} {Math.ceil(value)} / {total}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {target.enemy && (
                  <div
                    className={`enemy-hud ${target.enemy.boss ? "boss" : ""}`}
                  >
                    <div>
                      {target.enemy.locked ? "◎ " : ""}
                      {target.enemy.name}
                      <small>
                        {target.enemy.boss
                          ? `PHASE ${target.enemy.phase} · ${target.enemy.stance}`
                          : `${target.enemy.stance} · ${target.enemy.distance}m`}
                        {target.enemy.status && ` · ${target.enemy.status}`}
                      </small>
                    </div>
                    <div className="enemy-bar">
                      <span
                        style={{
                          width: `${(target.enemy.hp / target.enemy.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="interaction">
                  <button onClick={() => actionRef.current?.action("interact")}>
                    <kbd>{keyLabel("interact")}</kbd>
                    {target.interaction}
                  </button>
                </div>
                <div className="flask-hud">
                  <div>
                    <Droplets size={25} />
                    <b>{state.flasks}</b>
                  </div>
                  <span>
                    Cinder flask <kbd>{keyLabel("heal")}</kbd>
                  </span>
                </div>
                <div className="touch-controls">
                  <div
                    className="joystick"
                    ref={stickRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const r = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - r.left - r.width / 2) / 35,
                        z = (e.clientY - r.top - r.height / 2) / 35,
                        len = Math.max(1, Math.hypot(x, z));
                      actionRef.current?.move(x / len, z / len);
                      actionRef.current?.action(
                        Math.hypot(x, z) > 0.9 ? "sprint-on" : "sprint-off",
                      );
                      e.currentTarget.style.setProperty(
                        "--stick-x",
                        `${(x / len) * 18}px`,
                      );
                      e.currentTarget.style.setProperty(
                        "--stick-y",
                        `${(z / len) * 18}px`,
                      );
                    }}
                    onPointerMove={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId))
                        return;
                      const r = e.currentTarget.getBoundingClientRect();
                      let x = (e.clientX - r.left - r.width / 2) / 35,
                        z = (e.clientY - r.top - r.height / 2) / 35;
                      const len = Math.max(1, Math.hypot(x, z));
                      actionRef.current?.move(x / len, z / len);
                      actionRef.current?.action(
                        Math.hypot(x, z) > 0.9 ? "sprint-on" : "sprint-off",
                      );
                      e.currentTarget.style.setProperty(
                        "--stick-x",
                        `${(x / len) * 18}px`,
                      );
                      e.currentTarget.style.setProperty(
                        "--stick-y",
                        `${(z / len) * 18}px`,
                      );
                    }}
                    onPointerUp={(e) => {
                      actionRef.current?.move(0, 0);
                      actionRef.current?.action("sprint-off");
                      e.currentTarget.style.setProperty("--stick-x", "0px");
                      e.currentTarget.style.setProperty("--stick-y", "0px");
                    }}
                    onPointerCancel={(e) => {
                      actionRef.current?.move(0, 0);
                      actionRef.current?.action("sprint-off");
                      e.currentTarget.style.setProperty("--stick-x", "0px");
                      e.currentTarget.style.setProperty("--stick-y", "0px");
                    }}
                  >
                    <Move size={25} />
                  </div>
                  <div className="touch-actions">
                    {[
                      ["parry", Shield, "Parry"],
                      ["magic", Sparkles, "Magic"],
                      ["heal", Droplets, "Heal"],
                      ["heavy", Sword, "Heavy"],
                      ["light", Swords, "Attack"],
                      ["dodge", Wind, "Dodge"],
                    ].map(([a, I, l]) => (
                      <button
                        key={a}
                        aria-label={l}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.currentTarget.dataset.pressed = String(
                            performance.now(),
                          );
                          actionRef.current?.action(a);
                        }}
                        onPointerUp={(e) => {
                          if (
                            a === "heavy" &&
                            performance.now() -
                              Number(e.currentTarget.dataset.pressed) >
                              1000
                          )
                            actionRef.current?.action("charged");
                        }}
                      >
                        <I size={20} />
                        <span>
                          {l}
                          {a === "heavy" ? " / hold" : ""}
                        </span>
                      </button>
                    ))}
                    <button
                      aria-label="Block"
                      onPointerDown={() =>
                        actionRef.current?.action("block-on")
                      }
                      onPointerUp={() => actionRef.current?.action("block-off")}
                      onPointerLeave={() =>
                        actionRef.current?.action("block-off")
                      }
                      onPointerCancel={() =>
                        actionRef.current?.action("block-off")
                      }
                    >
                      <Shield size={20} />
                      <span>Block</span>
                    </button>
                    <button
                      aria-label="Weapon skill"
                      onClick={() => actionRef.current?.action("skill")}
                    >
                      <Flame size={20} />
                      <span>Skill</span>
                    </button>
                    <button
                      aria-label="Lock target"
                      onClick={() => actionRef.current?.action("lock")}
                    >
                      <Target size={20} />
                      <span>Lock</span>
                    </button>
                  </div>
                </div>
                <div className="desktop-actions">
                  <span>
                    <kbd>
                      {["up", "left", "down", "right"].map(keyLabel).join(" ")}
                    </kbd>{" "}
                    Move
                  </span>
                  <span>
                    <kbd>{keyLabel("light")}</kbd> Attack
                  </span>
                  <span>
                    <kbd>{keyLabel("heavy")}</kbd> Heavy
                  </span>
                  <span>
                    <kbd>{keyLabel("dodge")}</kbd> Dodge
                  </span>
                  <button onClick={() => open("controls")}>
                    All controls <HelpCircle size={13} />
                  </button>
                </div>
              </>
            ) : (
              <div className="hero-content">
                <div className="chapter">
                  <span /> CHAPTER I <span />
                </div>
                <h2>
                  Ashes of a<br />
                  forgotten age.
                </h2>
                <p>
                  The old gods are silent. The dead refuse to rest.
                  <br />
                  And somewhere in the ashes, your story begins.
                </p>
                <button
                  className="button primary journey-button"
                  onClick={() => (state ? setActive(true) : open("create"))}
                >
                  <Flame size={18} />
                  {state ? "Continue your journey" : "Begin your journey"}
                  <ArrowRight size={17} />
                </button>
                <div className="hero-note">
                  <span className="small-diamond" />
                  {state
                    ? `${state.name} · Level ${state.level} ${state.className}`
                    : "Your choices will echo through eternity."}
                </div>
              </div>
            )}
            {!active && (
              <div className="hero-bottom">
                <div>
                  <Flame size={13} /> SANCTUARY OF THE NAMELESS
                </div>
                <span>900 YEARS AFTER THE GREAT FRACTURE</span>
              </div>
            )}
            <div className="scene-corner tl" />
            <div className="scene-corner br" />
            {notices.some((n) => n.type === "death") && (
              <div className="death-overlay">
                YOU DIED<small>The fire still remembers your name.</small>
              </div>
            )}
          </section>
          <aside className="sidebar">
            <section className="panel region-panel">
              <div className="panel-heading">
                <span>
                  <Compass size={15} /> THE REALM
                </span>
                <button
                  title="Open realm map"
                  aria-label="Open realm map"
                  onClick={() => open("map")}
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <RealmMap
                state={state}
                onSelect={(i) => {
                  setMapSelection(i);
                  open("map");
                }}
              />
              <div className="region-info">
                <div className="eyebrow gold">
                  {state
                    ? `REGION ${String(state.region + 1).padStart(2, "0")}`
                    : "YOUR FIRST FOOTSTEPS"}
                </div>
                <h3>{region.name}</h3>
                <p>{region.sub}</p>
                <div className="region-meta">
                  <span>
                    <Flame size={12} />
                    {state?.discovered.length || 1} / 13 discovered
                  </span>
                  <span>
                    <span className="live-dot" /> Open world
                  </span>
                </div>
              </div>
            </section>
            <section className="panel quest-panel">
              <div className="panel-heading">
                <span>
                  <Scroll size={15} /> THE THREAD OF FATE
                </span>
                <span className="small-diamond" />
              </div>
              <div className="quest-body">
                <span className="quest-type">
                  MAIN QUEST{" "}
                  <span>
                    {String(CHAPTERS.indexOf(chapter) + 1).padStart(2, "0")}
                  </span>
                </span>
                <h3>{chapter.title}</h3>
                <p>
                  {state
                    ? chapter.intro
                    : "A fading flame. A nameless grave. Someone has been waiting for you."}
                </p>
                <div className="quest-objective">
                  <span className="objective-circle" />
                  {chapterObjective(state)}
                </div>
                <div
                  className="chapter-dots"
                  aria-label={`${campaign.claimed.length} of 6 chapters completed`}
                >
                  {CHAPTERS.map((c) => (
                    <i
                      key={c.region}
                      className={
                        campaign.claimed.includes(c.region)
                          ? "complete"
                          : chapter.region === c.region
                            ? "current"
                            : ""
                      }
                    />
                  ))}
                </div>
                <button
                  className="text-button"
                  onClick={() => (state ? nav("Journal") : open("create"))}
                >
                  Open journal <ArrowRight size={14} />
                </button>
              </div>
            </section>
          </aside>
        </div>
        <section className="bottom-grid">
          <article className="panel wanderer-panel">
            <div className="panel-heading">
              <span>
                <User size={15} /> {state ? "YOUR WANDERER" : "THE UNWRITTEN"}
              </span>
              <button
                aria-label="Character details"
                onClick={() => nav("Character")}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="wanderer-body">
              <div className="portrait">
                <Icon
                  name={
                    CLASSES.find((c) => c.name === state?.className)?.icon ||
                    "shield"
                  }
                  size={43}
                />
                <span>
                  {state ? String(state.level).padStart(2, "0") : "—"}
                </span>
              </div>
              <div>
                <h3>{state?.name || "A soul yet unnamed"}</h3>
                <p>
                  {state
                    ? `${state.className} · ${state.origin}`
                    : "Your past is ash. Your future is unwritten."}
                </p>
                <div className="character-tags">
                  <span>
                    <Sword size={12} />
                    {state?.weapon || "8 starting classes"}
                  </span>
                  <span>
                    <Shield size={12} />
                    {state?.difficulty || "Choose your path"}
                  </span>
                </div>
              </div>
            </div>
          </article>
          <article className="panel whisper-panel">
            <div className="panel-heading">
              <span>
                <BookOpen size={15} /> WHISPERS OF THE PAST
              </span>
              <span className="whisper-index">I / VII</span>
            </div>
            <div className="whisper-body">
              <span className="quote-mark">“</span>
              <blockquote>
                The thrones did not fall.
                <br />
                They were abandoned.
              </blockquote>
              <span className="attribution">
                — A FRAGMENT OF THE FIRST ACCOUNT
              </span>
            </div>
          </article>
          <article className="panel world-panel">
            <div className="panel-heading">
              <span>
                <Sun size={15} /> A WORLD STILL TURNING
              </span>
              <span className="live-dot" />
            </div>
            <div className="world-details">
              <div>
                <CloudFog size={24} />
                <span>
                  WEATHER<strong>{region.weather}</strong>
                </span>
                <div className="weather-bars">▂ ▄ ▆ ▄ ▂</div>
              </div>
              <div>
                <Sun size={23} />
                <span>
                  WORLD TIME
                  <strong>
                    {state
                      ? state.time >= 18 || state.time < 6
                        ? "Nightfall"
                        : state.time < 12
                          ? "Early morning"
                          : "Late afternoon"
                      : "Early morning"}
                  </strong>
                </span>
                <span className="world-day">
                  DAY {String(state?.worldDay || 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          </article>
        </section>
        <footer>
          <div className="footer-mark">
            <Flame size={13} /> Not all who wander seek the light.
          </div>
          <div>
            <span className={`save-dot ${saved ? "" : "error"}`} />
            {saved
              ? "Progress saved on this device"
              : "Storage unavailable · keep this tab open"}
            <span className="footer-divider" />
            <button onClick={() => open("controls")}>
              Guide & controls <ArrowUpRight size={12} />
            </button>
            <button onClick={() => open("settings")}>
              Settings & saves <Settings size={12} />
            </button>
          </div>
        </footer>
      </main>
      <div className="notices" aria-live="polite">
        {notices
          .filter(
            (n) =>
              n.type !== "death" &&
              (preferences.subtitles || n.type !== "combat"),
          )
          .map((n) => (
            <div className={`notice ${n.type}`} key={n.id}>
              {n.type === "victory" ? (
                <Flame size={20} />
              ) : n.type === "reward" ? (
                <Gem size={16} />
              ) : (
                <span className="small-diamond" />
              )}
              {n.text}
            </div>
          ))}
      </div>
      {panel === "create" && (
        <CharacterCreation
          onClose={() => setPanel(null)}
          onCreate={(c) => {
            const s = createCharacter(c);
            update(s);
            setSaved(saveGame(s));
            setActive(true);
            setPanel(null);
            setEpoch((x) => x + 1);
            notify("You awaken in the Ashen Veil. The fire is still warm.");
          }}
        />
      )}
      {panel === "map" && (
        <Modal
          title="A realm in fragments"
          eyebrow="THE PILGRIM’S ATLAS"
          wide
          onClose={() => setPanel(null)}
        >
          <p className="modal-intro">
            Thirteen lands, bound by old roads and older secrets. Follow a
            connecting road or return to a discovered sanctuary.
          </p>
          <RealmMap state={state} large onSelect={setMapSelection} />
          <div className="map-legend">
            <span>
              <Flame size={13} /> You are here
            </span>
            <span>◆ Discovered</span>
            <span>◇ Unexplored</span>
          </div>
          {mapSelection !== null ? (
            <div className="travel-detail">
              <div>
                <div className="eyebrow gold">
                  {REGIONS[mapSelection].type} · DANGER{" "}
                  {REGIONS[mapSelection].level}
                </div>
                <h3>{REGIONS[mapSelection].name}</h3>
                <p>{REGIONS[mapSelection].sub}</p>
                <small>{REGIONS[mapSelection].mechanic}</small>
              </div>
              <button
                className="button primary"
                disabled={
                  !state ||
                  (!state.discovered.includes(mapSelection) &&
                    !region.links.includes(mapSelection))
                }
                onClick={() => travel(mapSelection)}
              >
                {state?.discovered.includes(mapSelection)
                  ? "Travel to sanctuary"
                  : region.links.includes(mapSelection)
                    ? "Follow the road"
                    : "Road not discovered"}
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <p className="center muted">
              Select a place to chart your next steps.
            </p>
          )}
        </Modal>
      )}
      {panel === "inventory" && state && (
        <Modal
          title="What you carry"
          eyebrow="INVENTORY & EQUIPMENT"
          wide
          onClose={() => {
            setPanel(null);
            setTab("World");
          }}
        >
          <div className="segment inventory-tabs">
            {["Weapons", "Armour", "Spells", "Materials", "Relics"].map((c) => (
              <button
                key={c}
                className={invCategory === c ? "selected" : ""}
                onClick={() => {
                  setInvCategory(c);
                  setSelectedItem(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          {invCategory === "Weapons" ? (
            <div className="inventory-layout">
              <div className="item-list">
                {WEAPONS.filter((w) => state.inventory.includes(w.name)).map(
                  (w) => (
                    <button
                      className={item.name === w.name ? "selected" : ""}
                      key={w.name}
                      onClick={() => setSelectedItem(w.name)}
                    >
                      <Sword size={22} />
                      <span>
                        <strong>
                          {w.name}
                          {state.weapon === w.name && " ✧"}
                        </strong>
                        <small>{w.type}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ),
                )}
              </div>
              <div className="item-detail">
                <Sword size={65} />
                <div className="eyebrow gold">{item.type}</div>
                <h3>
                  {item.name}
                  {state.weapon === item.name ? ` +${state.upgrade}` : ""}
                </h3>
                <span
                  className={`rarity rarity-${gearRarity(item.name, REGIONS).toLowerCase()}`}
                >
                  {gearRarity(item.name, REGIONS)} · origin tier
                </span>
                <blockquote>“{item.lore}”</blockquote>
                <div className="stat-grid">
                  <span>
                    Base damage <b>{item.damage}</b>
                  </span>
                  <span>
                    Scaling <b>{item.scaling}</b>
                  </span>
                  <span>
                    Requirement <b>{item.requirement}</b>
                  </span>
                  <span>
                    Stamina <b>{item.stamina}</b>
                  </span>
                  <span>
                    Reach <b>{item.reach}m</b>
                  </span>
                  <span>
                    Weapon skill <b>{item.skill}</b>
                  </span>
                </div>
                <button
                  className="button primary full"
                  disabled={state.attrs[item.scaling] < item.requirement}
                  onClick={() => {
                    if (state.weapon !== item.name)
                      update({
                        ...state,
                        weapon: item.name,
                        upgrade: state.weaponUpgrades?.[item.name] || 0,
                        weaponUpgrades: {
                          ...state.weaponUpgrades,
                          [state.weapon]: state.upgrade,
                        },
                      });
                    notify(`${item.name} equipped.`);
                  }}
                >
                  {state.weapon === item.name
                    ? "Equipped"
                    : state.attrs[item.scaling] < item.requirement
                      ? `Requires ${item.requirement} ${item.scaling}`
                      : "Equip weapon"}
                </button>
              </div>
            </div>
          ) : invCategory === "Armour" ? (
            <div className="armour-grid">
              {ARMOURS.filter((a) => state.inventory.includes(a.name)).map(
                (a) => (
                  <div className="equipment-card" key={a.name}>
                    <Shield size={44} />
                    <h3>{a.name}</h3>
                    <p>{Math.round(a.defence * 100)}% damage reduction</p>
                    <p>
                      Weight {a.weight} ·{" "}
                      {a.weight > 20 ? "Shorter dodge window" : "Agile dodge"}
                    </p>
                    <button
                      className="button outline"
                      onClick={() => update({ ...state, armour: a.name })}
                    >
                      {state.armour === a.name ? "Equipped" : "Equip armour"}
                    </button>
                  </div>
                ),
              )}
            </div>
          ) : invCategory === "Spells" ? (
            <div className="armour-grid">
              {SPELLS.filter((s) => state.spells.includes(s.name)).map((s) => (
                <div className="equipment-card" key={s.name}>
                  <Sparkles size={34} />
                  <div className="eyebrow gold">{s.type}</div>
                  <h3>{s.name}</h3>
                  <p>
                    {spellFocusCost(state, s)} focus · {s.damage || "Healing"}{" "}
                    base power
                  </p>
                  <small>
                    Scales with {s.scaling} · Range 17m · Cast recovery 0.9s
                  </small>
                  <button
                    className="button outline"
                    onClick={() => update({ ...state, spell: s.name })}
                  >
                    {state.spell === s.name ? "Attuned" : "Attune spell"}
                  </button>
                </div>
              ))}
            </div>
          ) : invCategory === "Materials" ? (
            <div className="armour-grid">
              <div className="equipment-card">
                <Flame size={36} />
                <h3>Smithing embers</h3>
                <p>{state.materials} held</p>
                <small>
                  Recovered from fallen enemies and hidden caches. Upgrade
                  weapons at a sanctuary.
                </small>
              </div>
              <div className="equipment-card">
                <Droplets size={36} />
                <h3>Cinder flask</h3>
                <p>
                  {state.flasks} / {flaskCount(state)} charges
                </p>
                <small>
                  Rest at a sanctuary to replenish. Restore{" "}
                  {Math.round((0.55 + bonuses(state).healing) * 100)}% vitality
                  per charge.
                </small>
              </div>
              <div className="equipment-card">
                <Feather size={36} />
                <h3>Focus tincture</h3>
                <p>Craft for 2 embers</p>
                <button
                  className="button outline"
                  disabled={state.materials < 2 || state.focus >= max.focus}
                  onClick={() =>
                    update({
                      ...state,
                      materials: state.materials - 2,
                      focus: Math.min(max.focus, state.focus + 65),
                    })
                  }
                >
                  Craft & restore focus
                </button>
              </div>
            </div>
          ) : (
            <div className="armour-grid">
              {state.relics.length ? (
                state.relics.map((r) => (
                  <div className="equipment-card" key={r}>
                    <Gem size={40} />
                    <h3>{r}</h3>
                    <span
                      className={`rarity rarity-${gearRarity(r, REGIONS).toLowerCase()}`}
                    >
                      {gearRarity(r, REGIONS)}
                    </span>
                    <p>A remembrance carried through the Fracture.</p>
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  No relics yet. Trust is sometimes rewarded with more than
                  words.
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
      {panel === "character" && state && (
        <Modal
          title={state.name}
          eyebrow={`LEVEL ${state.level} · ${state.className} · ${state.origin}`}
          wide
          onClose={() => {
            setPanel(null);
            setTab("World");
          }}
        >
          <div className="panel-actions">
            <button
              className="button outline"
              onClick={() => setPanel("skills")}
            >
              Disciplines & skill tree
            </button>
            <button
              className="button outline"
              onClick={() => setPanel("thrones")}
            >
              The seven Soul Thrones
            </button>
          </div>
          <div className="character-layout">
            <div className="character-art">
              <Suspense fallback={<p>Gathering the wanderer…</p>}>
                <CharacterViewer
                  state={state}
                  reducedMotion={preferences.reducedMotion}
                />
              </Suspense>
              <p>
                {state.gender} · {state.appearance}
              </p>
              <blockquote>
                {state.history || "The ashes kept no record of who you were."}
              </blockquote>
              <div className="difficulty-badge">
                {state.difficulty} difficulty
              </div>
            </div>
            <div>
              <h3>Attributes</h3>
              <p className="muted">
                Grow at a sanctuary. Costs increase with each level; scaling
                softens after 30.
              </p>
              {ATTRS.map((a) => (
                <div className="attribute-row" key={a}>
                  <span>
                    {a}
                    <small>
                      {
                        {
                          Vigor: "Maximum vitality",
                          Endurance: "Stamina & resistance",
                          Strength: "Heavy weapon scaling",
                          Dexterity: "Precision weapon scaling",
                          Intelligence: "Sorcery & moonsteel",
                          Faith: "Sacred magic & hammers",
                          Arcana: "Occult spell damage",
                          Mind: "Maximum focus",
                        }[a]
                      }
                    </small>
                  </span>
                  <div className="attribute-track">
                    <i
                      style={{
                        width: `${Math.min(100, (state.attrs[a] / 40) * 100)}%`,
                      }}
                    />
                  </div>
                  <b>{state.attrs[a]}</b>
                </div>
              ))}
              <div className="stat-grid">
                <span>
                  Vitality<b>{max.hp}</b>
                </span>
                <span>
                  Stamina<b>{max.stamina}</b>
                </span>
                <span>
                  Focus<b>{max.focus}</b>
                </span>
                <span>
                  Soul Shards<b>{state.shards} / 7</b>
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {panel === "skills" && state && (
        <Modal
          title="Disciplines of the fallen"
          eyebrow={`${state.essence} SOUL ESSENCE`}
          wide
          onClose={() => setPanel("character")}
        >
          <SkillTree state={state} update={update} />
        </Modal>
      )}
      {panel === "thrones" && state && (
        <Modal
          title="Seven powers. No ordained answer."
          eyebrow="THE SOUL THRONES"
          wide
          onClose={() => setPanel("journal")}
        >
          <ThroneArcs state={state} update={update} />
        </Modal>
      )}
      {panel === "journal" && state && (
        <Modal
          title="Threads of a broken world"
          eyebrow="YOUR JOURNAL"
          wide
          onClose={() => {
            setPanel(null);
            setTab("World");
          }}
        >
          <button
            className="button outline full"
            onClick={() => setPanel("thrones")}
          >
            The seven Soul Thrones · fates & powers
          </button>
          <div className="journal-grid">
            <div>
              {CHAPTERS.filter(
                (c, i) =>
                  i <= CHAPTERS.indexOf(chapter) ||
                  campaign.claimed.includes(c.region),
              ).map((c) => (
                <article
                  className={`journal-quest ${campaign.claimed.includes(c.region) ? "resolved" : ""}`}
                  key={c.region}
                >
                  <div className="eyebrow gold">{c.subtitle}</div>
                  <h3>{c.title}</h3>
                  <p>{c.intro}</p>
                  <span className="quest-status">
                    {campaign.claimed.includes(c.region)
                      ? "Testimony recovered"
                      : chapterObjective(state, c)}
                  </span>
                  {campaign.claimed.includes(c.region) && (
                    <blockquote>{chapterConclusion(state, c)}</blockquote>
                  )}
                </article>
              ))}
              <h3 className="lore-heading">Memories of the Fracture</h3>
              {campaign.echoes.length ? (
                campaign.echoes.map((i) => (
                  <details className="memory-entry" key={i}>
                    <summary>
                      {ECHOES[i][0]} <span>{REGIONS[i].name}</span>
                    </summary>
                    <p>{ECHOES[i][1]}</p>
                  </details>
                ))
              ) : (
                <p className="muted">
                  Read the standing stones beside the pilgrim roads. Their names
                  survive when histories do not.
                </p>
              )}
              <h3 className="lore-heading">The hidden roads</h3>
              <p className="muted">
                Ashen Veil braziers: {campaign.braziers.length} / 3 · Nacreth
                pillars: {campaign.pillars.length} / 3
              </p>
              <p className="muted">{SECRET_GATES[state.region].clue}</p>
              <span className="quest-status">
                {secretOpen(state)
                  ? "A hidden way is open"
                  : "The seal endures"}
              </span>
              <h3 className="lore-heading">Field notes</h3>
              {Object.entries(state.defeatedCounts || {}).map(
                ([name, count]) => (
                  <div className="bestiary-entry" key={name}>
                    <Skull size={16} />
                    <span>{name}</span>
                    <b>{count} felled</b>
                  </div>
                ),
              )}
              {!Object.keys(state.defeatedCounts || {}).length && (
                <p className="muted">Your encounters will be recorded here.</p>
              )}
            </div>
            <div>
              <h3>The world remembers</h3>
              {state.events.length ? (
                state.events
                  .slice()
                  .reverse()
                  .map((e, i) => (
                    <p className="event-line" key={i}>
                      <span className="small-diamond" />
                      {e}
                    </p>
                  ))
              ) : (
                <p className="muted">Your first page is still blank.</p>
              )}
              <h3 className="lore-heading">
                {regionProfile(state.region).biome}
              </h3>
              <blockquote>{region.lore}</blockquote>
              <p className="muted">
                {state.bosses.length} guardians defeated · {state.secret.length}{" "}
                remnants found
              </p>
            </div>
          </div>
        </Modal>
      )}
      {panel === "sanctuary" && state && (
        <Modal
          title="Sanctuary of the Nameless"
          eyebrow="A SMALL DEFIANCE AGAINST THE DARK"
          wide
          onClose={() => setPanel(null)}
        >
          <div className="segment">
            {["Rest", "Level up", "Forge"].map((t) => (
              <button
                key={t}
                className={sanctTab === t ? "selected" : ""}
                onClick={() => setSanctTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {sanctTab === "Rest" ? (
            <div className="sanctuary-content">
              <Flame size={64} />
              <p>
                The fire leans toward you. For a moment, the world is quiet.
              </p>
              <p className="muted">
                Restore vitality, stamina, focus, and flasks. Set your
                checkpoint here. Ordinary enemies will rise again; defeated
                guardians remain fallen.
              </p>
              <button className="button primary" onClick={rest}>
                Rest at the flame <Flame size={16} />
              </button>
              <button
                className="button outline"
                onClick={() => setPanel("map")}
              >
                Travel to a sanctuary <Map size={16} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setInvCategory("Spells");
                  setPanel("inventory");
                }}
              >
                Attune spells & manage equipment <ArrowRight size={14} />
              </button>
              {state.region === 12 &&
                state.shards >= 7 &&
                state.bosses.includes(12) && (
                  <button
                    className="button primary"
                    onClick={() => setPanel("ending")}
                  >
                    Approach the empty thrones
                  </button>
                )}
            </div>
          ) : sanctTab === "Level up" ? (
            <>
              <p className="modal-intro">
                Give your hard-won essence to the flame. Next level:{" "}
                <b className="gold">{levelCost(state)} essence</b> · Held:{" "}
                {state.essence}
              </p>
              {ATTRS.map((a) => (
                <div className="attribute-row" key={a}>
                  <span>{a}</span>
                  <b>{state.attrs[a]}</b>
                  <button
                    className="icon-button"
                    aria-label={`Level ${a}`}
                    disabled={state.essence < levelCost(state)}
                    onClick={() => update(spendLevel(stateRef.current, a))}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="sanctuary-content">
              <Anvil size={55} />
              <h3>
                {state.weapon} +{state.upgrade}
              </h3>
              <p>Temper this weapon with the embers of the fallen.</p>
              <p className="muted">
                +15% damage per upgrade. Costs {2 + state.upgrade} embers and{" "}
                {(state.upgrade + 1) * 100} essence.
              </p>
              <button
                className="button primary"
                disabled={
                  state.materials < 2 + state.upgrade ||
                  state.essence < (state.upgrade + 1) * 100 ||
                  state.upgrade >= 10
                }
                onClick={() => {
                  const s = stateRef.current;
                  update({
                    ...s,
                    upgrade: s.upgrade + 1,
                    weaponUpgrades: {
                      ...s.weaponUpgrades,
                      [s.weapon]: s.upgrade + 1,
                    },
                    materials: s.materials - (2 + s.upgrade),
                    essence: s.essence - (s.upgrade + 1) * 100,
                  });
                  notify(
                    "The iron remembers the heat. Weapon strengthened.",
                    "reward",
                  );
                }}
              >
                Temper weapon <Plus size={15} />
              </button>
              <div>
                <p className="muted">Infusion · 3 embers & 150 essence</p>
                <div className="segment">
                  {["Physical", "Flame", "Sacred", "Occult"].map((infusion) => (
                    <button
                      key={infusion}
                      className={state.infusion === infusion ? "selected" : ""}
                      disabled={
                        state.infusion !== infusion &&
                        (state.materials < 3 || state.essence < 150)
                      }
                      onClick={() => {
                        if (state.infusion === infusion) return;
                        update({
                          ...state,
                          infusion,
                          materials: state.materials - 3,
                          essence: state.essence - 150,
                        });
                        notify(
                          `${infusion} infusion bound to your weapon.`,
                          "reward",
                        );
                      }}
                    >
                      {infusion}
                    </button>
                  ))}
                </div>
                <small className="muted">
                  Physical scales with your weapon. Flame uses Intelligence,
                  Sacred uses Faith, and Occult uses Arcana.
                </small>
              </div>
              <p className="muted">
                Held: {state.materials} embers · {state.essence} essence
              </p>
            </div>
          )}
        </Modal>
      )}
      {panel === "echo" && state && (
        <Modal
          title={ECHOES[state.region][0]}
          eyebrow={`A MEMORY IN STONE · ${region.name}`}
          onClose={() => setPanel(null)}
        >
          <div className="echo-sigil">
            <Eye size={40} />
          </div>
          <p className="echo-text">{ECHOES[state.region][1]}</p>
          <p className="muted">
            The stone is warm beneath the ash. No voice tells you what to
            believe.
          </p>
          <button
            className="button primary full"
            onClick={() => {
              const next = rememberEcho(stateRef.current, state.region);
              update(next);
              setPanel(null);
              notify(
                next === state
                  ? "A familiar memory."
                  : "Memory inscribed in your journal.",
                "reward",
              );
            }}
          >
            <BookOpen size={16} />
            {campaign.echoes.includes(state.region)
              ? "Leave the memorial"
              : "Carry this memory"}
          </button>
        </Modal>
      )}
      {panel === "npc" && state && (
        <Modal
          title={region.npc}
          eyebrow="A VOICE AMONG THE RUINS"
          onClose={() => setPanel(null)}
        >
          <div className="npc-portrait">
            <User size={45} />
          </div>
          <blockquote className="dialogue">
            “
            {state.choices[state.region]
              ? state.choices[state.region] === "mercy"
                ? "I remember your promise. Even if this world forgets, I will not. The road ahead is yours to choose."
                : "You have what you asked for. Do not mistake knowledge for absolution. We are done here."
              : state.region === 11
                ? state.choices[2] === "mercy"
                  ? "The refugees still leave a cup beside every fire. They think I cannot see it. You opened one gate, and they have spent every morning opening another."
                  : state.choices[2] === "knowledge"
                    ? "I read the confession every morning. There are more names in it now. The gates are still sealed. So am I."
                    : "I once knew a captain who thought a city needed a king’s permission to die. I have spent nine hundred years trying to forgive him."
                : region.npcText}
            ”
          </blockquote>
          <p className="muted">
            {state.choices[state.region]
              ? "This choice has become part of the world."
              : "Your answer will be remembered."}
          </p>
          {npcReply && (
            <blockquote className="npc-reply">“{npcReply}”</blockquote>
          )}
          <form
            className="npc-form"
            onSubmit={(e) => {
              e.preventDefault();
              const text = npcInput.trim().toLowerCase();
              if (!text) return;
              if (
                /\b(help|promise|protect|aid|mercy)\b/.test(text) &&
                !state.choices[state.region]
              )
                chooseNPC("mercy");
              else if (
                /\b(truth|bargain|knowledge|demand)\b/.test(text) &&
                !state.choices[state.region]
              )
                chooseNPC("knowledge");
              else if (/\b(secret|hidden|passage|road)\b/.test(text))
                setNpcReply(SECRET_GATES[state.region].clue);
              else if (/\b(history|throne|fracture|past|why|who)\b/.test(text))
                setNpcReply(region.lore);
              else if (/\b(attack|kill|threaten)\b/.test(text))
                setNpcReply(
                  "Steel is a poor language for this place. If you came for blood, you will find only ashes.",
                );
              else
                setNpcReply(
                  "I hear you, wanderer. Ask about these ruins, the thrones, or the hidden roads. If you offer your aid or demand the truth, I will remember.",
                );
              setNpcInput("");
            }}
          >
            <label htmlFor="npc-speech">Speak in your own words</label>
            <div>
              <input
                id="npc-speech"
                value={npcInput}
                onChange={(e) => setNpcInput(e.target.value)}
                maxLength={250}
                placeholder="Ask about the ruins, offer aid, seek a secret…"
              />
              <button
                className="button outline"
                type="submit"
                disabled={!npcInput.trim()}
              >
                Speak <ArrowRight size={14} />
              </button>
            </div>
          </form>
          {state.region === 10 && !secretOpen(state) && (
            <button
              className="button outline full"
              onClick={() => {
                update(unseal(stateRef.current, "silence"));
                setNpcReply(
                  "The Unwritten smiles. For the first time, the archive has nothing to add. A passage opens without a sound.",
                );
              }}
            >
              Remain silent
            </button>
          )}
          <div className="npc-topics">
            {(
              NPC_TOPICS[state.region] || [
                ["This place", region.lore],
                ["The hidden road", region.secret],
              ]
            ).map(([label, text]) => (
              <button
                className="topic-button"
                key={label}
                onClick={() => setNpcReply(text)}
              >
                <Scroll size={13} />
                {label}
              </button>
            ))}
          </div>
          {regionalChapter && campaign.claimed.includes(state.region) && (
            <div className="story-resolution">
              <span className="eyebrow gold">TESTIMONY RECOVERED</span>
              <p>{chapterConclusion(state, regionalChapter)}</p>
            </div>
          )}
          {regionalChapter && chapterReady(state, regionalChapter) && (
            <div className="story-resolution">
              <h3>The guardian is gone. The memory remains.</h3>
              <p>{region.npc} has something more to tell you.</p>
              <button
                className="button primary full"
                onClick={() => {
                  const next = claimChapter(stateRef.current);
                  if (next === stateRef.current) return;
                  update(next);
                  notify(
                    `Chapter completed · +${regionalChapter.reward} essence · +2 embers`,
                    "victory",
                  );
                }}
              >
                Hear the testimony <ArrowRight size={15} />
              </button>
            </div>
          )}
          {state.region === 2 && !state.choices[2] && (
            <p className="choice-consequence">
              Opening the refuge earns one extra flask at every sanctuary.
              Demanding a confession teaches Edrin’s iron guard, reducing damage
              received while blocking. Your choice also shapes the final
              testimony.
            </p>
          )}
          {!state.choices[state.region] && (
            <div className="dialogue-choices">
              <button onClick={() => chooseNPC("mercy")}>
                {state.region === 2
                  ? "“Open the refuge gate. Help those who can still leave.”"
                  : "“I will help you. Tell me what you need.”"}{" "}
                <Feather size={16} />
              </button>
              <button onClick={() => chooseNPC("knowledge")}>
                {state.region === 2
                  ? "“Keep the gates sealed. Tell the living what you did.”"
                  : "“Keep your promises. Give me the truth.”"}{" "}
                <Eye size={16} />
              </button>
            </div>
          )}
          <button className="text-button" onClick={() => setPanel(null)}>
            Leave in silence <ArrowRight size={14} />
          </button>
        </Modal>
      )}
      {panel === "ending" && state && (
        <Modal
          title="What will you make of the silence?"
          eyebrow="THE LAST THRESHOLD"
          wide
          onClose={() => setPanel(null)}
        >
          {state.ending ? (
            <div className="prologue">
              <Flame size={60} />
              <h3>{state.ending}</h3>
              <p>
                {state.ending === "The Truth Behind the Fracture"
                  ? "You leave the lock unmade. For the first time, the world is allowed to grow without a hand around its throat."
                  : "The thrones answer your choice. Far below, a child wakes to a sky that has never existed before. The age you chose has begun."}
              </p>
              <p className="muted">
                {endingCoda(state)} Your journey remains yours. The realm is
                still open.
              </p>
              <button className="button primary" onClick={() => setPanel(null)}>
                Return to the realm
              </button>
            </div>
          ) : (
            <>
              <p className="modal-intro">
                The Witness falls silent. Seven shards circle an empty seat. No
                prophecy can make this choice for you.
              </p>
              <div className="ending-choices">
                {[
                  {
                    title: "Rebirth of the Seven Thrones",
                    action: "Return the fragments to their ancient seats.",
                  },
                  {
                    title: "The Eternal Eclipse",
                    action: "Entrust the thrones to the night.",
                    condition: !!state.choices[11],
                  },
                  {
                    title: "Humanity’s Ascension",
                    action: "Give the fragments to the people.",
                    condition: state.mercy >= 3,
                  },
                  {
                    title: "The Age of Nothingness",
                    action: "Let the last light go out.",
                  },
                  {
                    title: "The Broken Cycle",
                    action: "Shatter the thrones for the final time.",
                    condition: state.bosses.length >= 10,
                  },
                  {
                    title: "The New Creator",
                    action: "Take the empty seat.",
                    condition: state.level >= 12,
                  },
                  {
                    title: "The Truth Behind the Fracture",
                    action: "Refuse the question. Unmake the lock.",
                    condition: state.mercy >= 7 && state.secret.length >= 12,
                  },
                ]
                  .filter((e) => e.condition === undefined || !!e.condition)
                  .map((e) => (
                    <button
                      key={e.title}
                      onClick={() => {
                        update({
                          ...state,
                          ending: e.title,
                          events: [
                            ...state.events,
                            `An age begins: ${e.title}.`,
                          ],
                        });
                        saveGame({ ...state, ending: e.title });
                      }}
                    >
                      {e.action}
                      <ArrowRight size={16} />
                    </button>
                  ))}
              </div>
            </>
          )}
        </Modal>
      )}
      {panel === "controls" && (
        <Modal
          title="Learn the rhythm of survival"
          eyebrow="THE WANDERER’S GUIDE"
          wide
          onClose={() => setPanel(null)}
        >
          <p className="modal-intro">
            Enemies mark their windup with a red ring. Roll out, parry as the
            strike lands, or block to soften the blow. Heavy attacks break
            poise. A staggered enemy is vulnerable to a critical riposte.
          </p>
          <div className="controls-grid">
            {[
              [
                ["up", "left", "down", "right"].map(keyLabel).join(" ") +
                  " / Arrows",
                "Move",
              ],
              [keyLabel("sprint") + " + move", "Sprint"],
              [
                `${keyLabel("light")} / Hold ${keyLabel("light")}`,
                "Light / charged attack",
              ],
              [keyLabel("heavy"), "Heavy attack"],
              [
                `${keyLabel("dodge")} / ${keyLabel("backstep")}`,
                "Dodge / backstep",
              ],
              [`${keyLabel("block")} (hold)`, "Block"],
              [keyLabel("parry"), "Parry"],
              [keyLabel("jump"), "Jump attack"],
              [keyLabel("skill"), "Weapon skill"],
              [keyLabel("magic"), "Cast attuned spell"],
              [keyLabel("heal"), "Drink healing flask"],
              [keyLabel("lock"), "Lock target"],
              [keyLabel("interact"), "Interact / gather / recover"],
              ["Esc", "Pause"],
            ].map(([k, v]) => (
              <div key={k}>
                <kbd>{k}</kbd>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <p className="modal-intro">
            On phones, drag the left thumbstick to move and use the action
            buttons on the right. Tap the interaction prompt to speak, rest, or
            gather. Expand the game for more room.
          </p>
          <h3>Every death leaves a trace</h3>
          <p className="muted">
            Unspent essence waits where you fell. Die again before recovering it
            and it is lost. Your level, equipment, discoveries, choices, and
            defeated guardians persist. Save data lives in this browser.
          </p>
          <p className="engine-credit">
            Built with the MIT-licensed{" "}
            <a
              href="https://github.com/mrdoob/three.js"
              target="_blank"
              rel="noreferrer"
            >
              Three.js engine <ArrowUpRight size={12} />
            </a>
            . Original procedural world assets. Overlook artwork: The Abbey in
            the Oakwood (1809–1810), Caspar David Friedrich, public domain, via
            Wikimedia Commons. No account or server required.
          </p>
        </Modal>
      )}
      {panel === "pause" && (
        <Modal
          title="Even embers need to rest."
          eyebrow="JOURNEY PAUSED"
          onClose={() => setPanel(null)}
        >
          <div className="pause-options">
            <button
              className="button primary full"
              onClick={() => setPanel(null)}
            >
              <Play size={17} /> Resume journey
            </button>
            <button
              className="button outline full"
              onClick={() => setPanel("settings")}
            >
              <Settings size={17} />
              Settings & saves
            </button>
            <button
              className="button outline full"
              onClick={() => setPanel("controls")}
            >
              <BookOpen size={17} /> Guide & controls
            </button>
            <button
              className="button outline full"
              onClick={() => {
                if (state) saveGame(state);
                setActive(false);
                setPanel(null);
                setExpanded(false);
              }}
            >
              Save & return to the overlook
            </button>
          </div>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal
          title="At your own pace"
          eyebrow="SETTINGS"
          onClose={() => setPanel(null)}
        >
          <div className="settings-row">
            <div>
              <h3>Realm ambience</h3>
              <p>
                An original adaptive score, with combat and discovery sounds.
              </p>
            </div>
            <button className="button outline" onClick={toggleAudio}>
              {audio ? "On" : "Off"}
              {audio ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          <SettingsPanel preferences={preferences} onChange={setPreferences} />
          <div className="settings-row">
            <div>
              <h3>Campaign difficulty</h3>
              <p>Chosen at the beginning of your journey.</p>
            </div>
            <span className="gold">{state?.difficulty || "Not chosen"}</span>
          </div>
          <div className="settings-row">
            <div>
              <h3>
                Local save ·{" "}
                {offlineReady
                  ? "Offline ready"
                  : import.meta.env.DEV
                    ? "Development preview"
                    : "Preparing offline cache"}
              </h3>
              <p>
                {recovered
                  ? "Recovered the last good snapshot after detecting a damaged save."
                  : "Saved every two seconds, with a last-good recovery copy."}
              </p>
            </div>
            <Save size={20} />
          </div>
          <div className="save-tools">
            {state && (
              <button
                className="button outline"
                onClick={() => {
                  const data = new Blob([encodeSave(stateRef.current)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(data);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "soul-land-save.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  notify(
                    "Journey exported. Keep this file to restore your progress.",
                    "reward",
                  );
                }}
              >
                <Save size={15} />
                Export journey
              </button>
            )}
            <label className="button outline import-save">
              Import journey
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    notify("This save file is too large.");
                    return;
                  }
                  try {
                    const text = await file.text();
                    const restored = loadSave({ getItem: () => text });
                    if (!restored) {
                      notify("This file is not a valid Soul Land save.");
                      return;
                    }
                    update(restored);
                    saveGame(restored);
                    setEpoch((x) => x + 1);
                    setActive(false);
                    setPanel(null);
                    setExpanded(false);
                    notify(`${restored.name}’s journey restored.`, "reward");
                  } catch {
                    notify("The save could not be read.");
                  }
                }}
              />
            </label>
          </div>
          <p className="muted">
            Import replaces this browser’s journey. Export first to keep a
            backup. Save files can move between the temporary link and the
            permanent site.
          </p>
          <button
            className="button outline full"
            onClick={() => setPanel("controls")}
          >
            Open guide & controls <ArrowUpRight size={15} />
          </button>
          {state && (
            <button
              className="text-button danger"
              onClick={() => setPanel("reset")}
            >
              Begin a new story <RotateCcw size={13} />
            </button>
          )}
        </Modal>
      )}
      {panel === "reset" && (
        <Modal
          title="Leave this story behind?"
          eyebrow="A NEW BEGINNING"
          onClose={() => setPanel(null)}
        >
          <p className="modal-intro">
            Creating a new wanderer will replace {state?.name}’s local save.
            Your current journey stays safe until you enter the realm with a new
            character.
          </p>
          <button
            className="button primary full"
            onClick={() => setPanel("create")}
          >
            Create a new wanderer <ArrowRight size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
installErrorLogging();
createRoot(document.getElementById("root")).render(
  <RecoveryBoundary>
    <App />
  </RecoveryBoundary>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL("sw.js", document.baseURI))
      .catch(() => {
        /* The game remains playable if caching is unavailable. */
      });
  });
}
