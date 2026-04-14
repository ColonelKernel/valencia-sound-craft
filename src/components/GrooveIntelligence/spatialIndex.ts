/**
 * Quadtree spatial index for O(log n) point queries on 10k+ grooves.
 */

export interface Bounded {
  cx: number;
  cy: number;
  id: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function contains(r: Rect, px: number, py: number) {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

function intersects(a: Rect, b: Rect) {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

const MAX_ITEMS = 16;
const MAX_DEPTH = 8;

class QTNode<T extends Bounded> {
  bounds: Rect;
  items: T[] = [];
  children: QTNode<T>[] | null = null;
  depth: number;

  constructor(bounds: Rect, depth: number) {
    this.bounds = bounds;
    this.depth = depth;
  }

  subdivide() {
    const { x, y, w, h } = this.bounds;
    const hw = w / 2, hh = h / 2;
    const d = this.depth + 1;
    this.children = [
      new QTNode<T>({ x, y, w: hw, h: hh }, d),
      new QTNode<T>({ x: x + hw, y, w: hw, h: hh }, d),
      new QTNode<T>({ x, y: y + hh, w: hw, h: hh }, d),
      new QTNode<T>({ x: x + hw, y: y + hh, w: hw, h: hh }, d),
    ];
  }

  insert(item: T) {
    if (!contains(this.bounds, item.cx, item.cy)) return;

    if (this.children) {
      for (const c of this.children) c.insert(item);
      return;
    }

    this.items.push(item);
    if (this.items.length > MAX_ITEMS && this.depth < MAX_DEPTH) {
      this.subdivide();
      for (const it of this.items) {
        for (const c of this.children!) c.insert(it);
      }
      this.items = [];
    }
  }

  queryRect(rect: Rect, out: T[]) {
    if (!intersects(this.bounds, rect)) return;
    if (this.children) {
      for (const c of this.children) c.queryRect(rect, out);
    } else {
      for (const it of this.items) {
        if (contains(rect, it.cx, it.cy)) out.push(it);
      }
    }
  }

  queryRadius(px: number, py: number, r: number, out: T[]) {
    const rect: Rect = { x: px - r, y: py - r, w: r * 2, h: r * 2 };
    if (!intersects(this.bounds, rect)) return;
    if (this.children) {
      for (const c of this.children) c.queryRadius(px, py, r, out);
    } else {
      const r2 = r * r;
      for (const it of this.items) {
        const dx = it.cx - px, dy = it.cy - py;
        if (dx * dx + dy * dy <= r2) out.push(it);
      }
    }
  }
}

export class SpatialIndex<T extends Bounded> {
  private root: QTNode<T>;

  constructor() {
    this.root = new QTNode<T>({ x: -0.1, y: -0.1, w: 1.2, h: 1.2 }, 0);
  }

  rebuild(items: T[]) {
    this.root = new QTNode<T>({ x: -0.1, y: -0.1, w: 1.2, h: 1.2 }, 0);
    for (const it of items) this.root.insert(it);
  }

  queryViewport(x: number, y: number, w: number, h: number): T[] {
    const out: T[] = [];
    this.root.queryRect({ x, y, w, h }, out);
    return out;
  }

  queryNearest(px: number, py: number, radius: number): T[] {
    const out: T[] = [];
    this.root.queryRadius(px, py, radius, out);
    return out;
  }
}
