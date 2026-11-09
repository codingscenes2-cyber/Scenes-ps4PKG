import React from "react";
export function logError(error, source = "runtime") {
  try {
    const key = "soul-land-errors";
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(
      key,
      JSON.stringify([
        ...old.slice(-19),
        {
          at: new Date().toISOString(),
          source,
          message: String(error?.message || error).slice(0, 500),
        },
      ]),
    );
  } catch {
    /* Storage may be unavailable; reporting must never crash gameplay. */
  }
}
export function installErrorLogging() {
  window.addEventListener("error", (e) => logError(e.error || e.message));
  window.addEventListener("unhandledrejection", (e) =>
    logError(e.reason, "promise"),
  );
}
export class RecoveryBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    logError(error, "react");
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="recovery-screen">
        <span className="eyebrow gold">THE EMBER ENDURES</span>
        <h1>The realm lost its footing.</h1>
        <p>Your last saved journey is still in this browser.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload the realm
        </button>
        <a className="button outline" href="guide.html">
          Open field guide
        </a>
      </main>
    );
  }
}
