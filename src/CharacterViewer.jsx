import React, { useRef, useState, useEffect } from "react";
import * as T from "three";
import {
  createActor,
  animateActor,
  playClip,
  disposeActor,
} from "./characters";
import { SoftwareRenderer } from "./SoftwareRenderer";
export default function CharacterViewer({ state }) {
  const ref = useRef(),
    rig = useRef(),
    [clip, setClip] = useState("idle");
  useEffect(() => {
    const mount = ref.current,
      scene = new T.Scene();
    scene.background = new T.Color("#1b251f");
    scene.fog = new T.FogExp2("#1b251f", 0.06);
    const probe = document.createElement("canvas");
    let gl = false;
    try {
      gl = !!probe.getContext("webgl2");
    } catch {}
    const renderer = gl
      ? new T.WebGLRenderer({ antialias: true })
      : new SoftwareRenderer();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    mount.append(renderer.domElement);
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 30);
    camera.position.set(3, 2.8, 5);
    camera.lookAt(0, 1.2, 0);
    scene.add(new T.HemisphereLight("#ece3c2", "#30423d", 3));
    const light = new T.DirectionalLight("#f6c986", 3);
    light.position.set(-3, 5, 4);
    scene.add(light);
    const actor = createActor({
      className: state.className,
      weapon: state.weapon,
      armour: state.armour,
      color:
        state.appearance === "Ember"
          ? "#a2846d"
          : state.appearance === "Frost"
            ? "#91a9b5"
            : undefined,
    });
    rig.current = actor;
    scene.add(actor);
    const platform = new T.Mesh(
      new T.CylinderGeometry(1.15, 1.25, 0.15, 32),
      new T.MeshStandardMaterial({
        color: "#4a5345",
        metalness: 0.3,
        roughness: 0.9,
      }),
    );
    platform.position.y = -0.12;
    scene.add(platform);
    let angle = 0,
      drag = false,
      lastX = 0;
    const down = (e) => {
      drag = true;
      lastX = e.clientX;
      mount.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (drag) {
        angle += (e.clientX - lastX) * 0.015;
        lastX = e.clientX;
      }
    };
    const up = () => (drag = false);
    mount.addEventListener("pointerdown", down);
    mount.addEventListener("pointermove", move);
    mount.addEventListener("pointerup", up);
    mount.addEventListener("pointercancel", up);
    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();
    let frame,
      last = performance.now(),
      t = 0,
      draw = 0;
    function tick(now) {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (!drag) angle += dt * 0.16;
      actor.rotation.y = angle;
      animateActor(actor, dt, t, {
        moving: rig.current?.userData.previewWalk ? 1 : 0,
      });
      if (now - draw > 33) {
        renderer.render(scene, camera);
        draw = now;
      }
    }
    tick(last);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mount.removeEventListener("pointerdown", down);
      mount.removeEventListener("pointermove", move);
      mount.removeEventListener("pointerup", up);
      mount.removeEventListener("pointercancel", up);
      disposeActor(actor);
      platform.geometry.dispose();
      platform.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [state.className, state.weapon, state.appearance, state.armour]);
  return (
    <div className="model-viewer">
      <div
        className="model-stage"
        ref={ref}
        aria-label={`Rotatable animated ${state.className} model`}
      />
      <span className="model-hint">DRAG TO ROTATE · ORIGINAL 3D MODEL</span>
      <div className="model-clips">
        {["idle", "walk", "light", "cast", "roll"].map((c) => (
          <button
            key={c}
            className={clip === c ? "selected" : ""}
            onClick={() => {
              setClip(c);
              if (rig.current) {
                rig.current.userData.previewWalk = c === "walk";
                playClip(rig.current, c === "walk" ? "idle" : c, 0.8);
              }
            }}
          >
            {c === "light" ? "Attack" : c[0].toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
