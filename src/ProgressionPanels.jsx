import React from "react";
import {
  THRONES,
  throneStage,
  resolveThrone,
  storyState,
  storyFlags,
} from "./story";
import { SKILLS, knownSkills, canLearn, learnSkill } from "./progression";
import { REGIONS } from "./data";
export function SkillTree({ state, update }) {
  return (
    <>
      <p className="modal-intro">
        Spend soul essence on lasting disciplines. Each branch costs 720 essence
        to master. Skills survive death; new reserves fill through regeneration
        or rest.
      </p>
      <div className="skill-tree">
        {["Steel", "Veil", "Soul"].map((branch) => (
          <section key={branch}>
            <span className="eyebrow gold">{branch}</span>
            {SKILLS.filter((n) => n.branch === branch).map((n) => (
              <article
                className={`skill-node ${knownSkills(state).includes(n.id) ? "learned" : ""}`}
                key={n.id}
              >
                <h3>{n.name}</h3>
                <p>{n.description}</p>
                <small>
                  {n.requires.length
                    ? `Requires ${SKILLS.find((k) => k.id === n.requires[0]).name}`
                    : "Root discipline"}
                </small>
                <button
                  className="button outline full"
                  disabled={!canLearn(state, n)}
                  onClick={() => update(learnSkill(state, n.id))}
                >
                  {knownSkills(state).includes(n.id)
                    ? "Learned"
                    : `${n.cost} essence`}
                </button>
              </article>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
export function ThroneArcs({ state, update }) {
  const fates = storyState(state).thrones;
  return (
    <>
      <p className="modal-intro">
        A throne awakens after its guardian falls, its memorial is read, and its
        witness has heard your answer. Return to that region to decide. A fate
        cannot be undone.
      </p>
      <div className="throne-grid">
        {THRONES.map((t) => {
          const stage = throneStage(state, t);
          const chosen = t.choices.find((c) => c.id === fates[t.id]);
          return (
            <article className={`throne-card ${stage}`} key={t.id}>
              <span className="eyebrow gold">
                {t.name} · {stage}
              </span>
              <h3>{t.title}</h3>
              <small>{REGIONS[t.region].name}</small>
              {stage !== "sealed" ? (
                <>
                  <p>{t.question}</p>
                  <p className="power-note">
                    {t.power}: {t.powerDescription}
                  </p>
                  {chosen ? (
                    <blockquote>{chosen.epilogue}</blockquote>
                  ) : stage === "awakened" ? (
                    t.choices.map((c) => (
                      <button
                        disabled={state.region !== t.region}
                        key={c.id}
                        className="throne-choice"
                        onClick={() => update(resolveThrone(state, t.id, c.id))}
                      >
                        <b>{c.label}</b>
                        <span>{c.consequence}</span>
                      </button>
                    ))
                  ) : (
                    <p className="muted">
                      Seek the memorial and the region’s witness.
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  The guardian keeps this testimony sealed.
                </p>
              )}
            </article>
          );
        })}
      </div>
      <details className="flag-debug">
        <summary>Story inspector · read-only debug flags</summary>
        <pre>{JSON.stringify(storyFlags(state), null, 2)}</pre>
      </details>
    </>
  );
}
