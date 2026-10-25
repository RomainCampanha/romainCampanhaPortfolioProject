import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Matrix4,
  Euler,
  PlaneGeometry,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";

// Petit atelier de modelage low-poly : les décors, obstacles et monuments sont assemblés à
// partir de primitives (boîtes, cylindres, cônes, boules, tores, prismes) colorées par sommet,
// puis fusionnés en UNE géométrie par lot -> un seul appel de dessin par lot, un seul matériau
// mat partagé. Normales calculées par face (rendu à facettes « pâte à modeler » sans dérivées
// dans le shader). Géométries unitaires gardées en cache (CPU seulement, jamais envoyées au GPU).

export type Pose = {
  rx?: number;
  ry?: number;
  rz?: number;
  /** Échelle supplémentaire (uniforme puis par axe). */
  s?: number;
  sx?: number;
  sy?: number;
  sz?: number;
};

const units = new Map<string, Float32Array>();

/** Positions non indexées d'une géométrie unitaire (créée une fois). */
function unit(key: string, make: () => BufferGeometry): Float32Array {
  let positions = units.get(key);
  if (!positions) {
    const made = make();
    const flat = made.index ? made.toNonIndexed() : made;
    positions = Float32Array.from(flat.getAttribute("position").array as ArrayLike<number>);
    made.dispose();
    if (flat !== made) flat.dispose();
    units.set(key, positions);
  }
  return positions;
}

const colorCache = new Map<string, [number, number, number]>();
const scratch = new Color();
function linear(hex: string): [number, number, number] {
  let rgb = colorCache.get(hex);
  if (!rgb) {
    scratch.set(hex); // sRGB -> espace de travail linéaire (ColorManagement)
    rgb = [scratch.r, scratch.g, scratch.b];
    colorCache.set(hex, rgb);
  }
  return rgb;
}

const euler = new Euler();
const quat = new Quaternion();
const vPos = new Vector3();
const vScale = new Vector3();
const local = new Matrix4();
const full = new Matrix4();

const r3 = (n: number) => Math.round(n * 1000) / 1000;

type Layer = { positions: number[]; colors: number[] };

export type Built = { lit: BufferGeometry | null; glow: BufferGeometry | null };

export class Kit {
  /** Couche éclairée (argile mate) et couche « lumineuse » (non éclairée : néons, fenêtres le soir). */
  private readonly layers: [Layer, Layer] = [
    { positions: [], colors: [] },
    { positions: [], colors: [] },
  ];
  private layer = 0;
  private stack: Matrix4[] = [new Matrix4()];

  get vertexCount(): number {
    return (this.layers[0].positions.length + this.layers[1].positions.length) / 3;
  }

  /** Les pièces ajoutées dans `build` vont dans la couche non éclairée (elles « brillent »). */
  glow(build: () => void): void {
    const previous = this.layer;
    this.layer = 1;
    try {
      build();
    } finally {
      this.layer = previous;
    }
  }

  /** Repère local (position, lacet, échelle) pour modeler un objet puis le poser. */
  at(x: number, y: number, z: number, build: () => void, pose: Pose = {}): void {
    const parent = this.stack[this.stack.length - 1];
    euler.set(pose.rx ?? 0, pose.ry ?? 0, pose.rz ?? 0);
    quat.setFromEuler(euler);
    const s = pose.s ?? 1;
    vScale.set(s * (pose.sx ?? 1), s * (pose.sy ?? 1), s * (pose.sz ?? 1));
    vPos.set(x, y, z);
    this.stack.push(parent.clone().multiply(new Matrix4().compose(vPos, quat, vScale)));
    try {
      build();
    } finally {
      this.stack.pop();
    }
  }

  /** Ajoute une pièce : positions unitaires, taille (sx, sy, sz), puis pose et position. */
  piece(positions: Float32Array, color: string, size: [number, number, number], x: number, y: number, z: number, pose: Pose = {}) {
    euler.set(pose.rx ?? 0, pose.ry ?? 0, pose.rz ?? 0);
    quat.setFromEuler(euler);
    const s = pose.s ?? 1;
    vScale.set(size[0] * s * (pose.sx ?? 1), size[1] * s * (pose.sy ?? 1), size[2] * s * (pose.sz ?? 1));
    vPos.set(x, y, z);
    local.compose(vPos, quat, vScale);
    full.multiplyMatrices(this.stack[this.stack.length - 1], local);
    const e = full.elements;
    const flip = full.determinant() < 0;
    const [r, g, b] = linear(color);
    const { positions: out, colors: col } = this.layers[this.layer];
    for (let i = 0; i < positions.length; i += 9) {
      for (const k of flip ? [0, 6, 3] : [0, 3, 6]) {
        const px = positions[i + k];
        const py = positions[i + k + 1];
        const pz = positions[i + k + 2];
        out.push(
          e[0] * px + e[4] * py + e[8] * pz + e[12],
          e[1] * px + e[5] * py + e[9] * pz + e[13],
          e[2] * px + e[6] * py + e[10] * pz + e[14],
        );
        col.push(r, g, b);
      }
    }
  }

  /** Boîte posée sur y (pivot au centre de sa base). */
  box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    this.piece(unit("box", () => new BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), color, [w, h, d], x, y, z, pose);
  }

  /** Boîte centrée en (x, y, z) (pivot au centre : losanges, pièces inclinées). */
  cbox(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    this.piece(unit("cbox", () => new BoxGeometry(1, 1, 1)), color, [w, h, d], x, y, z, pose);
  }

  /** Rectangle plat tourné vers la caméra (+z), centré : fenêtres, affiches, bandes (2 triangles). */
  quad(w: number, h: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    this.piece(unit("quad", () => new PlaneGeometry(1, 1)), color, [w, h, 1], x, y, z, pose);
  }

  /** Rectangle plat posé à plat (vers +y), centré : joints du dallage, reflets sur l'eau. */
  flat(w: number, d: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    this.piece(unit("flat", () => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), color, [w, 1, d], x, y, z, pose);
  }

  /** Cylindre (ou tronc de cône) posé sur y ; `seg` faces autour. */
  cyl(rTop: number, rBottom: number, h: number, color: string, x = 0, y = 0, z = 0, seg = 8, pose?: Pose) {
    const big = Math.max(rTop, rBottom) || 1;
    const key = `cyl:${r3(rTop / big)}:${r3(rBottom / big)}:${seg}`;
    const positions = unit(key, () => new CylinderGeometry(rTop / big, rBottom / big, 1, seg).translate(0, 0.5, 0));
    this.piece(positions, color, [big, h, big], x, y, z, pose);
  }

  cone(r: number, h: number, color: string, x = 0, y = 0, z = 0, seg = 8, pose?: Pose) {
    this.cyl(0, r, h, color, x, y, z, seg, pose);
  }

  /** Boule à facettes centrée en (x, y, z) ; detail 0 = 20 faces, 1 = 80 faces. */
  ball(r: number, color: string, x = 0, y = 0, z = 0, pose?: Pose, detail = 1) {
    this.piece(unit(`ico:${detail}`, () => new IcosahedronGeometry(1, detail)), color, [r, r, r], x, y, z, pose);
  }

  /** Sphère UV (segments réglables : dômes, coques). `part` = 0.5 : demi-sphère (dôme). */
  sphere(r: number, color: string, x = 0, y = 0, z = 0, pose?: Pose, w = 10, h = 7, part = 1) {
    const key = `sph:${w}:${h}:${part}`;
    this.piece(unit(key, () => new SphereGeometry(1, w, h, 0, Math.PI * 2, 0, Math.PI * part)), color, [r, r, r], x, y, z, pose);
  }

  /** Tore dans le plan XY (axe Z), centré ; `arc` < 2π : arche. */
  torus(r: number, tube: number, color: string, x = 0, y = 0, z = 0, pose?: Pose, arc = Math.PI * 2, radial = 5, tubular = 14) {
    const key = `tor:${r3(tube / r)}:${r3(arc)}:${radial}:${tubular}`;
    this.piece(unit(key, () => new TorusGeometry(1, tube / r, radial, tubular, arc)), color, [r, r, r], x, y, z, pose);
  }

  /** Prisme triangulaire (toit à deux pans) : base d (z) × hauteur h, long de w (x), posé sur y. */
  gable(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    const positions = unit("gable", () => {
      const shape = new Shape();
      shape.moveTo(-0.5, 0);
      shape.lineTo(0.5, 0);
      shape.lineTo(0, 1);
      shape.closePath();
      // Extrusion le long de z, puis rotation : arête du toit le long de x.
      return new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5).rotateY(Math.PI / 2);
    });
    this.piece(positions, color, [w, h, d], x, y, z, pose);
  }

  /** Tronc de pyramide à base carrée (toit mansardé, socle) : base w × d, sommet × top, posé sur y. */
  frustum(w: number, h: number, d: number, top: number, color: string, x = 0, y = 0, z = 0, pose?: Pose) {
    const key = `fru:${r3(top)}`;
    const positions = unit(key, () =>
      new CylinderGeometry(top * Math.SQRT1_2, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
    );
    this.piece(positions, color, [w, h, d], x, y, z, pose);
  }

  /** Forme 2D extrudée (épaisseur en z, centrée), mise en cache sous `key`. */
  shape(key: string, make: () => Shape, depth: number, color: string, x = 0, y = 0, z = 0, pose?: Pose, bevel = 0) {
    const positions = unit(`shape:${key}:${depth}:${bevel}`, () =>
      new ExtrudeGeometry(make(), {
        depth,
        bevelEnabled: bevel > 0,
        bevelSize: bevel,
        bevelThickness: bevel,
        bevelSegments: 1,
        curveSegments: 5,
      }).translate(0, 0, -depth / 2),
    );
    this.piece(positions, color, [1, 1, 1], x, y, z, pose);
  }

  /** Géométries finales (null si vides) : positions, couleurs, normales par face. */
  build(): Built {
    const [lit, glow] = this.layers.map((layer) => {
      if (layer.positions.length === 0) return null;
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(new Float32Array(layer.positions), 3));
      geometry.setAttribute("color", new BufferAttribute(new Float32Array(layer.colors), 3));
      geometry.computeVertexNormals(); // non indexée : normale de la face
      geometry.computeBoundingSphere();
      layer.positions = [];
      layer.colors = [];
      return geometry;
    });
    return { lit, glow };
  }
}

/**
 * Lots découpés le long de la course (tranches de `chunk` m) : chaque tranche est un seul
 * appel de dessin, et les tranches hors champ sont écartées par la caméra (frustum culling).
 */
export class Batch {
  private readonly kits = new Map<number, Kit>();
  constructor(private readonly chunk = 40) {}

  at(x: number): Kit {
    const key = Math.floor(x / this.chunk);
    let kit = this.kits.get(key);
    if (!kit) {
      kit = new Kit();
      this.kits.set(key, kit);
    }
    return kit;
  }

  build(): { lit: BufferGeometry[]; glow: BufferGeometry[] } {
    const lit: BufferGeometry[] = [];
    const glow: BufferGeometry[] = [];
    for (const kit of this.kits.values()) {
      const built = kit.build();
      if (built.lit) lit.push(built.lit);
      if (built.glow) glow.push(built.glow);
    }
    this.kits.clear();
    return { lit, glow };
  }
}
