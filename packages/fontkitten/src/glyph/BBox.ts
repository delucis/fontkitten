import { BBOX } from "../types";

/**
 * Represents a glyph bounding box
 */
export default class BBox implements BBOX {
  constructor(
    public minX: number = Infinity,
    public minY: number = Infinity,
    public maxX: number = -Infinity,
    public maxY: number = -Infinity
  ) {}

  get width(): number {
    return this.maxX - this.minX;
  }

  get height(): number {
    return this.maxY - this.minY;
  }

  addPoint(x: number, y: number): void {
    if (Math.abs(x) !== Infinity) {
      if (x < this.minX) {
        this.minX = x;
      }

      if (x > this.maxX) {
        this.maxX = x;
      }
    }

    if (Math.abs(y) !== Infinity) {
      if (y < this.minY) {
        this.minY = y;
      }

      if (y > this.maxY) {
        this.maxY = y;
      }
    }
  }
}
