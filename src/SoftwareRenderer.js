import * as T from "three";
// CPU projection keeps the Three.js scene playable on browsers without WebGL.
// Static mesh transforms are cached; grass uses inexpensive projected strokes.
export class SoftwareRenderer {
  constructor() {
    this.domElement = document.createElement("canvas");
    this.ctx = this.domElement.getContext("2d", { alpha: false });
    this.shadowMap = {};
    this.cache = new WeakMap();
    this.ratio = 1;
    this.width = 1;
    this.height = 1;
    this.frame = 0;
  }
  setPixelRatio(r) {
    this.ratio = Math.min(r, 1.25);
  }
  setSize(w, h) {
    this.width = w;
    this.height = h;
    this.domElement.width = Math.round(w * this.ratio);
    this.domElement.height = Math.round(h * this.ratio);
    this.domElement.style.width = w + "px";
    this.domElement.style.height = h + "px";
    this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
  }
  dispose() {
    this.cache = new WeakMap();
  }
  render(scene, camera) {
    const ctx = this.ctx,
      w = this.width,
      h = this.height;
    if (!w || !h) return;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const matrix = new T.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    const fog = scene.fog?.color || new T.Color("#7b8271");
    const project = (v) => {
      const p = v.clone().applyMatrix4(matrix);
      return { x: (p.x * 0.5 + 0.5) * w, y: (-0.5 * p.y + 0.5) * h, z: p.z };
    };
    if (scene.background?.image)
      ctx.drawImage(scene.background.image, 0, 0, w, h);
    else {
      ctx.fillStyle = "#798272";
      ctx.fillRect(0, 0, w, h);
    }
    const faces = [],
      grasses = [],
      points = [];
    const light = new T.Vector3(-0.45, 1, -0.65).normalize();
    scene.traverse((m) => {
      if (!m.visible) return;
      let parent = m.parent;
      while (parent) {
        if (!parent.visible) return;
        parent = parent.parent;
      }
      if (m.isPoints) {
        points.push(m);
        return;
      }
      if (!m.isMesh) return;
      if (m.isInstancedMesh) {
        if (!this.grass) {
          this.grass = [];
          const mat = new T.Matrix4(),
            p = new T.Vector3();
          for (let i = 0; i < m.count; i++) {
            m.getMatrixAt(i, mat);
            p.setFromMatrixPosition(mat);
            if (Math.abs(mat.elements[0]) + Math.abs(mat.elements[2]) < 0.1)
              continue;
            this.grass.push(p.clone());
          }
        }
        for (let i = 0; i < this.grass.length; i += 2) {
          const p = this.grass[i],
            s = project(p);
          if (
            s.z > 0 &&
            s.z < 1 &&
            s.x > -5 &&
            s.x < w + 5 &&
            s.y > 0 &&
            s.y < h
          ) {
            const depth = p.distanceTo(camera.position);
            grasses.push({
              x: s.x,
              y: s.y,
              size: Math.min(15, 260 / depth),
              alpha: Math.max(0.1, 1 - depth * 0.012),
            });
          }
        }
        return;
      }
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (mat.opacity === 0) return;
      const geo = m.geometry,
        pos = geo.attributes.position,
        index = geo.index;
      let cached = this.cache.get(m);
      const key = m.matrixWorld.elements.join(",");
      if (!cached || key !== cached.key) {
        const verts = [];
        for (let i = 0; i < pos.count; i++)
          verts.push(
            new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(
              m.matrixWorld,
            ),
          );
        const tri = [];
        const n = index ? index.count : pos.count;
        for (let i = 0; i < n; i += 3) {
          const a = index ? index.getX(i) : i,
            b = index ? index.getX(i + 1) : i + 1,
            c = index ? index.getX(i + 2) : i + 2;
          if (!verts[c]) continue;
          const normal = new T.Vector3()
            .subVectors(verts[b], verts[a])
            .cross(new T.Vector3().subVectors(verts[c], verts[a]))
            .normalize();
          const center = verts[a]
            .clone()
            .add(verts[b])
            .add(verts[c])
            .multiplyScalar(1 / 3);
          tri.push({ a, b, c, normal, center });
        }
        cached = { key, verts, tri };
        this.cache.set(m, cached);
      }
      const projected = cached.verts.map(project);
      for (const f of cached.tri) {
        const a = projected[f.a],
          b = projected[f.b],
          c = projected[f.c];
        if (a.z < 0 || b.z < 0 || c.z < 0 || a.z > 1 || b.z > 1 || c.z > 1)
          continue;
        if (
          (a.x < 0 && b.x < 0 && c.x < 0) ||
          (a.x > w && b.x > w && c.x > w) ||
          (a.y < 0 && b.y < 0 && c.y < 0) ||
          (a.y > h && b.y > h && c.y > h)
        )
          continue;
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        if (mat.side !== T.DoubleSide && cross >= 0) continue;
        const depth = f.center.distanceTo(camera.position);
        let shade = mat.isMeshBasicMaterial
          ? 1
          : 0.52 + Math.max(0, f.normal.dot(light)) * 0.5;
        const col = mat.color
          .clone()
          .multiplyScalar(shade * (scene.userData.lightFactor || 1));
        const fogAlpha =
          1 - Math.exp(-Math.pow(depth * (scene.fog?.density || 0.018), 2));
        col.lerp(fog, Math.min(0.94, fogAlpha));
        faces.push({
          a,
          b,
          c,
          depth,
          layer: m.renderOrder || 0,
          color: col.getStyle(),
          opacity: mat.transparent ? mat.opacity : 1,
        });
      }
    });
    faces.sort((a, b) => a.layer - b.layer || b.depth - a.depth);
    for (const f of faces) {
      ctx.globalAlpha = f.opacity;
      ctx.beginPath();
      ctx.moveTo(f.a.x, f.a.y);
      ctx.lineTo(f.b.x, f.b.y);
      ctx.lineTo(f.c.x, f.c.y);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.fill();
      if (f.opacity === 1) {
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (const g of grasses) {
      ctx.globalAlpha = g.alpha * 0.5;
      ctx.strokeStyle = "#64704c";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(g.x - 2, g.y);
      ctx.lineTo(g.x - 3, g.y - g.size * 0.8);
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + 1, g.y - g.size);
      ctx.moveTo(g.x + 2, g.y);
      ctx.lineTo(g.x + 4, g.y - g.size * 0.65);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const m of points) {
      const attr = m.geometry.attributes.position;
      ctx.fillStyle = "#e6d59a";
      for (let i = 0; i < attr.count; i++) {
        const p = project(
          new T.Vector3(attr.getX(i), attr.getY(i), attr.getZ(i)),
        );
        if (p.z > 0 && p.z < 1) {
          ctx.globalAlpha = 0.25 + (i % 4) * 0.12;
          ctx.fillRect(p.x, p.y, 1.2, 1.2);
        }
      }
    }
    ctx.globalAlpha = 1;
    // Soft sun haze adds depth without obscuring the navigable scene.
    const glow = ctx.createRadialGradient(
      w * 0.7,
      h * 0.15,
      0,
      w * 0.7,
      h * 0.15,
      w * 0.5,
    );
    glow.addColorStop(0, "rgba(228,210,160,.09)");
    glow.addColorStop(1, "rgba(228,210,160,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
}
