// ── Scene theme configuration for TravelScene ──────────────────────────────
//
// Controls the visual appearance of the travel scene per chapter:
// - Three base building structures (A, B, C) rotated across chapters
// - Six color palettes cycled so adjacent chapters always look different
// - Character sprite positioning
//
// To customise: edit CHAPTER_THEMES to assign different structures/palettes,
// or add new palettes/structures. CHAPTER_THEMES.length must equal CHAPTERS.length.

// ── Types ────────────────────────────────────────────────────────────────────

interface BuildingWindow {
  dx: number; dy: number; w: number; h: number; opacity: number;
}

interface BuildingDef {
  x: number; y: number; width: number; height: number;
  windows: BuildingWindow[];
}

interface SkylineStructure {
  svgWidth: number;
  svgHeight: number;
  buildings: BuildingDef[];
}

export interface SceneColorPalette {
  skyGradient: string;
  farBuildingColors: [string, string];
  nearBuildingColors: [string, string];
  windowColors: [string, string, string];
  roadGradient: [string, string];
  roadMarkingColor: string;
  starOpacity: number;
}

export interface ChapterSceneTheme {
  structureKey: 'A' | 'B' | 'C';
  palette: SceneColorPalette;
  /** Px from bottom of the scene container. Lower = closer to road. */
  characterBottom: number;
}

// ── SVG generator ────────────────────────────────────────────────────────────

export function generateSvgDataUrl(
  structure: SkylineStructure,
  buildingColors: [string, string],
  windowColors: [string, string, string],
): string {
  let rects = '';
  structure.buildings.forEach((b, i) => {
    rects += `<rect x='${b.x}' y='${b.y}' width='${b.width}' height='${b.height}' fill='${buildingColors[i % 2]}'/>`;
    b.windows.forEach((w, wi) => {
      rects += `<rect x='${b.x + w.dx}' y='${b.y + w.dy}' width='${w.w}' height='${w.h}' fill='${windowColors[wi % 3]}' opacity='${w.opacity}'/>`;
    });
  });
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${structure.svgWidth}' height='${structure.svgHeight}' fill='none'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ── Structure A — "Standard City" (extracted from original hardcoded SVGs) ──

const STRUCTURE_A_FAR: SkylineStructure = {
  svgWidth: 400, svgHeight: 70,
  buildings: [
    { x: 0,   y: 30, width: 28, height: 40, windows: [{ dx: 3, dy: 3, w: 4, h: 3, opacity: 0.3 }, { dx: 12, dy: 8, w: 4, h: 3, opacity: 0.25 }] },
    { x: 35,  y: 15, width: 18, height: 55, windows: [{ dx: 3, dy: 3, w: 3, h: 3, opacity: 0.35 }, { dx: 11, dy: 13, w: 3, h: 3, opacity: 0.2 }] },
    { x: 60,  y: 25, width: 40, height: 45, windows: [{ dx: 5, dy: 3, w: 4, h: 3, opacity: 0.3 }, { dx: 18, dy: 8, w: 4, h: 3, opacity: 0.25 }, { dx: 25, dy: 18, w: 4, h: 3, opacity: 0.3 }] },
    { x: 108, y: 20, width: 22, height: 50, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 12, dy: 14, w: 3, h: 3, opacity: 0.2 }] },
    { x: 138, y: 35, width: 32, height: 35, windows: [{ dx: 4, dy: 3, w: 4, h: 3, opacity: 0.25 }, { dx: 17, dy: 10, w: 4, h: 3, opacity: 0.3 }] },
    { x: 178, y: 12, width: 15, height: 58, windows: [{ dx: 3, dy: 4, w: 3, h: 3, opacity: 0.35 }] },
    { x: 200, y: 28, width: 35, height: 42, windows: [{ dx: 5, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 20, dy: 12, w: 4, h: 3, opacity: 0.2 }] },
    { x: 242, y: 22, width: 20, height: 48, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }] },
    { x: 270, y: 32, width: 38, height: 38, windows: [{ dx: 5, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 20, dy: 10, w: 4, h: 3, opacity: 0.3 }] },
    { x: 316, y: 18, width: 16, height: 52, windows: [{ dx: 3, dy: 4, w: 3, h: 3, opacity: 0.35 }] },
    { x: 340, y: 30, width: 30, height: 40, windows: [{ dx: 5, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 20, dy: 14, w: 4, h: 3, opacity: 0.2 }] },
    { x: 378, y: 24, width: 22, height: 46, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.25 }] },
  ],
};

const STRUCTURE_A_NEAR: SkylineStructure = {
  svgWidth: 360, svgHeight: 90,
  buildings: [
    { x: 0,   y: 20, width: 35, height: 70, windows: [{ dx: 5, dy: 5, w: 5, h: 4, opacity: 0.5 }, { dx: 15, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 5, dy: 15, w: 5, h: 4, opacity: 0.35 }, { dx: 15, dy: 15, w: 5, h: 4, opacity: 0.45 }, { dx: 5, dy: 25, w: 5, h: 4, opacity: 0.3 }, { dx: 15, dy: 25, w: 5, h: 4, opacity: 0.4 }] },
    { x: 40,  y: 5,  width: 25, height: 85, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 17, w: 4, h: 4, opacity: 0.45 }, { dx: 14, dy: 17, w: 4, h: 4, opacity: 0.3 }, { dx: 4, dy: 29, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 29, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 41, w: 4, h: 4, opacity: 0.35 }, { dx: 14, dy: 41, w: 4, h: 4, opacity: 0.45 }] },
    { x: 70,  y: 30, width: 45, height: 60, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 6, dy: 15, w: 5, h: 4, opacity: 0.5 }, { dx: 18, dy: 15, w: 5, h: 4, opacity: 0.4 }, { dx: 30, dy: 25, w: 5, h: 4, opacity: 0.3 }] },
    { x: 122, y: 10, width: 20, height: 80, windows: [{ dx: 4, dy: 4, w: 4, h: 4, opacity: 0.5 }, { dx: 12, dy: 4, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 16, w: 4, h: 4, opacity: 0.45 }, { dx: 12, dy: 16, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 28, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 40, w: 4, h: 4, opacity: 0.3 }] },
    { x: 150, y: 25, width: 40, height: 65, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 6, dy: 17, w: 5, h: 4, opacity: 0.5 }, { dx: 18, dy: 17, w: 5, h: 4, opacity: 0.4 }, { dx: 28, dy: 29, w: 5, h: 4, opacity: 0.3 }] },
    { x: 198, y: 15, width: 22, height: 75, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 12, dy: 5, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 17, w: 4, h: 4, opacity: 0.45 }, { dx: 12, dy: 17, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 29, w: 4, h: 4, opacity: 0.5 }] },
    { x: 228, y: 28, width: 36, height: 62, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 6, dy: 17, w: 5, h: 4, opacity: 0.35 }, { dx: 18, dy: 17, w: 5, h: 4, opacity: 0.5 }] },
    { x: 272, y: 8,  width: 18, height: 82, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 17, w: 4, h: 4, opacity: 0.4 }, { dx: 12, dy: 17, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 29, w: 4, h: 4, opacity: 0.45 }] },
    { x: 298, y: 22, width: 32, height: 68, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 6, dy: 17, w: 5, h: 4, opacity: 0.5 }, { dx: 18, dy: 17, w: 5, h: 4, opacity: 0.4 }] },
    { x: 338, y: 18, width: 22, height: 72, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 17, w: 4, h: 4, opacity: 0.4 }, { dx: 12, dy: 17, w: 4, h: 4, opacity: 0.35 }] },
  ],
};

// ── Structure B — "Varied Heights" (tall towers + squat blocks) ─────────────

const STRUCTURE_B_FAR: SkylineStructure = {
  svgWidth: 400, svgHeight: 70,
  buildings: [
    { x: 5,   y: 8,  width: 12, height: 62, windows: [{ dx: 3, dy: 4, w: 3, h: 3, opacity: 0.35 }, { dx: 3, dy: 18, w: 3, h: 3, opacity: 0.25 }, { dx: 3, dy: 32, w: 3, h: 3, opacity: 0.3 }] },
    { x: 24,  y: 40, width: 45, height: 30, windows: [{ dx: 6, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 22, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 36, dy: 10, w: 4, h: 3, opacity: 0.2 }] },
    { x: 78,  y: 5,  width: 14, height: 65, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.35 }, { dx: 4, dy: 20, w: 3, h: 3, opacity: 0.3 }, { dx: 4, dy: 36, w: 3, h: 3, opacity: 0.25 }] },
    { x: 100, y: 35, width: 38, height: 35, windows: [{ dx: 5, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 18, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 28, dy: 12, w: 4, h: 3, opacity: 0.2 }] },
    { x: 148, y: 10, width: 13, height: 60, windows: [{ dx: 3, dy: 5, w: 3, h: 3, opacity: 0.3 }, { dx: 3, dy: 22, w: 3, h: 3, opacity: 0.35 }, { dx: 3, dy: 38, w: 3, h: 3, opacity: 0.25 }] },
    { x: 170, y: 42, width: 42, height: 28, windows: [{ dx: 6, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 20, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 34, dy: 8, w: 4, h: 3, opacity: 0.2 }] },
    { x: 222, y: 6,  width: 15, height: 64, windows: [{ dx: 4, dy: 5, w: 3, h: 3, opacity: 0.35 }, { dx: 4, dy: 22, w: 3, h: 3, opacity: 0.25 }, { dx: 4, dy: 38, w: 3, h: 3, opacity: 0.3 }] },
    { x: 246, y: 38, width: 40, height: 32, windows: [{ dx: 5, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 20, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 32, dy: 10, w: 4, h: 3, opacity: 0.2 }] },
    { x: 296, y: 8,  width: 12, height: 62, windows: [{ dx: 3, dy: 5, w: 3, h: 3, opacity: 0.3 }, { dx: 3, dy: 22, w: 3, h: 3, opacity: 0.35 }] },
    { x: 318, y: 36, width: 44, height: 34, windows: [{ dx: 6, dy: 5, w: 4, h: 3, opacity: 0.25 }, { dx: 22, dy: 5, w: 4, h: 3, opacity: 0.3 }, { dx: 36, dy: 12, w: 4, h: 3, opacity: 0.2 }] },
    { x: 374, y: 12, width: 14, height: 58, windows: [{ dx: 4, dy: 5, w: 3, h: 3, opacity: 0.3 }, { dx: 4, dy: 20, w: 3, h: 3, opacity: 0.25 }] },
  ],
};

const STRUCTURE_B_NEAR: SkylineStructure = {
  svgWidth: 360, svgHeight: 90,
  buildings: [
    { x: 0,   y: 5,  width: 16, height: 85, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 44, w: 4, h: 4, opacity: 0.35 }] },
    { x: 22,  y: 35, width: 48, height: 55, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 20, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 36, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 6, dy: 18, w: 5, h: 4, opacity: 0.3 }, { dx: 20, dy: 18, w: 5, h: 4, opacity: 0.5 }] },
    { x: 78,  y: 3,  width: 15, height: 87, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 20, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 35, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 50, w: 4, h: 4, opacity: 0.4 }] },
    { x: 100, y: 30, width: 42, height: 60, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 22, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 6, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 22, dy: 18, w: 5, h: 4, opacity: 0.4 }, { dx: 34, dy: 30, w: 5, h: 4, opacity: 0.3 }] },
    { x: 152, y: 8,  width: 16, height: 82, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 20, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 35, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 50, w: 4, h: 4, opacity: 0.4 }] },
    { x: 176, y: 32, width: 46, height: 58, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 22, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 38, dy: 5, w: 5, h: 4, opacity: 0.35 }, { dx: 6, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 22, dy: 18, w: 5, h: 4, opacity: 0.3 }] },
    { x: 230, y: 6,  width: 14, height: 84, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 20, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 35, w: 4, h: 4, opacity: 0.35 }] },
    { x: 252, y: 28, width: 40, height: 62, windows: [{ dx: 6, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 20, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 6, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 20, dy: 18, w: 5, h: 4, opacity: 0.35 }] },
    { x: 300, y: 4,  width: 15, height: 86, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 4, dy: 22, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 39, w: 4, h: 4, opacity: 0.35 }] },
    { x: 322, y: 34, width: 38, height: 56, windows: [{ dx: 5, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 5, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 18, dy: 18, w: 5, h: 4, opacity: 0.5 }] },
  ],
};

// ── Structure C — "Dense Jerusalem" (tightly packed, some stepped tops) ─────

const STRUCTURE_C_FAR: SkylineStructure = {
  svgWidth: 400, svgHeight: 70,
  buildings: [
    { x: 0,   y: 28, width: 24, height: 42, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 14, dy: 4, w: 3, h: 3, opacity: 0.25 }] },
    { x: 27,  y: 18, width: 22, height: 52, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 12, dy: 14, w: 3, h: 3, opacity: 0.25 }] },
    // Stepped top: a narrow rect on top of a wider building
    { x: 55,  y: 22, width: 30, height: 48, windows: [{ dx: 5, dy: 6, w: 4, h: 3, opacity: 0.3 }, { dx: 18, dy: 6, w: 4, h: 3, opacity: 0.25 }, { dx: 5, dy: 16, w: 4, h: 3, opacity: 0.2 }] },
    { x: 63,  y: 15, width: 12, height: 7,  windows: [] }, // dome cap
    { x: 90,  y: 30, width: 20, height: 40, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 12, dy: 12, w: 3, h: 3, opacity: 0.25 }] },
    { x: 114, y: 20, width: 26, height: 50, windows: [{ dx: 4, dy: 4, w: 4, h: 3, opacity: 0.25 }, { dx: 16, dy: 4, w: 4, h: 3, opacity: 0.3 }, { dx: 4, dy: 16, w: 4, h: 3, opacity: 0.2 }] },
    { x: 144, y: 26, width: 22, height: 44, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 14, dy: 10, w: 3, h: 3, opacity: 0.25 }] },
    { x: 170, y: 14, width: 28, height: 56, windows: [{ dx: 5, dy: 5, w: 4, h: 3, opacity: 0.3 }, { dx: 17, dy: 5, w: 4, h: 3, opacity: 0.25 }, { dx: 5, dy: 18, w: 4, h: 3, opacity: 0.2 }] },
    { x: 178, y: 8,  width: 10, height: 6,  windows: [] }, // dome cap
    { x: 202, y: 24, width: 24, height: 46, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 14, dy: 4, w: 3, h: 3, opacity: 0.25 }] },
    { x: 230, y: 16, width: 26, height: 54, windows: [{ dx: 5, dy: 5, w: 4, h: 3, opacity: 0.25 }, { dx: 16, dy: 5, w: 4, h: 3, opacity: 0.3 }, { dx: 5, dy: 18, w: 4, h: 3, opacity: 0.2 }] },
    { x: 260, y: 28, width: 22, height: 42, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 14, dy: 10, w: 3, h: 3, opacity: 0.25 }] },
    { x: 286, y: 20, width: 28, height: 50, windows: [{ dx: 5, dy: 5, w: 4, h: 3, opacity: 0.3 }, { dx: 17, dy: 5, w: 4, h: 3, opacity: 0.25 }] },
    { x: 296, y: 14, width: 8,  height: 6,  windows: [] }, // dome cap
    { x: 318, y: 26, width: 24, height: 44, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.25 }, { dx: 14, dy: 12, w: 3, h: 3, opacity: 0.3 }] },
    { x: 346, y: 18, width: 26, height: 52, windows: [{ dx: 5, dy: 5, w: 4, h: 3, opacity: 0.3 }, { dx: 16, dy: 5, w: 4, h: 3, opacity: 0.25 }, { dx: 5, dy: 18, w: 4, h: 3, opacity: 0.2 }] },
    { x: 376, y: 30, width: 24, height: 40, windows: [{ dx: 4, dy: 4, w: 3, h: 3, opacity: 0.3 }, { dx: 14, dy: 4, w: 3, h: 3, opacity: 0.25 }] },
  ],
};

const STRUCTURE_C_NEAR: SkylineStructure = {
  svgWidth: 360, svgHeight: 90,
  buildings: [
    { x: 0,   y: 20, width: 28, height: 70, windows: [{ dx: 4, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 16, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 16, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 4, dy: 31, w: 5, h: 4, opacity: 0.4 }, { dx: 16, dy: 31, w: 5, h: 4, opacity: 0.45 }] },
    { x: 32,  y: 12, width: 26, height: 78, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.35 }, { dx: 14, dy: 18, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 31, w: 4, h: 4, opacity: 0.35 }] },
    { x: 38,  y: 5,  width: 12, height: 7,  windows: [] }, // stepped top
    { x: 62,  y: 24, width: 30, height: 66, windows: [{ dx: 5, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 5, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 18, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 5, dy: 31, w: 5, h: 4, opacity: 0.4 }] },
    { x: 96,  y: 16, width: 24, height: 74, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.35 }, { dx: 14, dy: 18, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.5 }] },
    { x: 124, y: 22, width: 28, height: 68, windows: [{ dx: 4, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 16, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 4, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 16, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 4, dy: 31, w: 5, h: 4, opacity: 0.4 }, { dx: 16, dy: 31, w: 5, h: 4, opacity: 0.45 }] },
    { x: 132, y: 15, width: 10, height: 7,  windows: [] }, // dome cap
    { x: 156, y: 18, width: 26, height: 72, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.45 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 18, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.45 }] },
    { x: 186, y: 26, width: 30, height: 64, windows: [{ dx: 5, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 18, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 5, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 18, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 5, dy: 31, w: 5, h: 4, opacity: 0.4 }] },
    { x: 220, y: 14, width: 24, height: 76, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.35 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.45 }, { dx: 14, dy: 18, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.5 }] },
    { x: 228, y: 8,  width: 8,  height: 6,  windows: [] }, // dome cap
    { x: 248, y: 20, width: 28, height: 70, windows: [{ dx: 4, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 16, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 16, dy: 18, w: 5, h: 4, opacity: 0.35 }, { dx: 4, dy: 31, w: 5, h: 4, opacity: 0.4 }] },
    { x: 280, y: 16, width: 26, height: 74, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 14, dy: 5, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.35 }, { dx: 14, dy: 18, w: 4, h: 4, opacity: 0.45 }] },
    { x: 310, y: 22, width: 24, height: 68, windows: [{ dx: 4, dy: 5, w: 5, h: 4, opacity: 0.45 }, { dx: 14, dy: 5, w: 5, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 5, h: 4, opacity: 0.5 }, { dx: 14, dy: 18, w: 5, h: 4, opacity: 0.35 }] },
    { x: 338, y: 12, width: 22, height: 78, windows: [{ dx: 4, dy: 5, w: 4, h: 4, opacity: 0.5 }, { dx: 12, dy: 5, w: 4, h: 4, opacity: 0.4 }, { dx: 4, dy: 18, w: 4, h: 4, opacity: 0.35 }, { dx: 12, dy: 18, w: 4, h: 4, opacity: 0.45 }, { dx: 4, dy: 31, w: 4, h: 4, opacity: 0.5 }] },
  ],
};

// ── Exported structures ──────────────────────────────────────────────────────

export const SKYLINE_STRUCTURES: Record<'A' | 'B' | 'C', { far: SkylineStructure; near: SkylineStructure }> = {
  A: { far: STRUCTURE_A_FAR, near: STRUCTURE_A_NEAR },
  B: { far: STRUCTURE_B_FAR, near: STRUCTURE_B_NEAR },
  C: { far: STRUCTURE_C_FAR, near: STRUCTURE_C_NEAR },
};

// ── Color palettes ───────────────────────────────────────────────────────────

export const COLOR_PALETTES: SceneColorPalette[] = [
  { // 0: Sunset (original)
    skyGradient: 'linear-gradient(180deg, #0d0d1a 0%, #1a1040 35%, #2d1060 60%, #4a1a6b 80%, #ff6b35 100%)',
    farBuildingColors: ['#150b30', '#1a0e3d'],
    nearBuildingColors: ['#0d0825', '#0a0620'],
    windowColors: ['#ff6b35', '#ffb347', '#ff8c42'],
    roadGradient: ['#1a1225', '#0f0a18'],
    roadMarkingColor: '#333',
    starOpacity: 0.6,
  },
  { // 1: Night City
    skyGradient: 'linear-gradient(180deg, #020b1a 0%, #0a1628 35%, #0f2847 60%, #1a3a5c 80%, #2dd4bf 100%)',
    farBuildingColors: ['#0a1628', '#0d1a30'],
    nearBuildingColors: ['#060e1f', '#081220'],
    windowColors: ['#2dd4bf', '#67e8f9', '#22d3ee'],
    roadGradient: ['#0f1520', '#080d15'],
    roadMarkingColor: '#2a3a4a',
    starOpacity: 0.8,
  },
  { // 2: Desert Dawn
    skyGradient: 'linear-gradient(180deg, #1a0f08 0%, #3d1f0e 35%, #6b3a1a 60%, #c4722a 80%, #f5a862 100%)',
    farBuildingColors: ['#2d1a0e', '#3d2215'],
    nearBuildingColors: ['#1f1008', '#2a1810'],
    windowColors: ['#f5c842', '#ffd700', '#f5a862'],
    roadGradient: ['#2a1f15', '#1a1208'],
    roadMarkingColor: '#4a3a28',
    starOpacity: 0.3,
  },
  { // 3: Neon
    skyGradient: 'linear-gradient(180deg, #0a0f1a 0%, #0d1a2d 35%, #1a1040 60%, #3d1060 80%, #ff2d78 100%)',
    farBuildingColors: ['#0d0a1a', '#100d20'],
    nearBuildingColors: ['#080618', '#0a0815'],
    windowColors: ['#ff2d78', '#39ff14', '#ff6ec7'],
    roadGradient: ['#15101f', '#0d0a15'],
    roadMarkingColor: '#2d2040',
    starOpacity: 0.5,
  },
  { // 4: Forest Dusk
    skyGradient: 'linear-gradient(180deg, #0a1a0d 0%, #15301a 35%, #1a4020 60%, #2d6030 80%, #c4a832 100%)',
    farBuildingColors: ['#0d2010', '#0a1a0d'],
    nearBuildingColors: ['#081508', '#061006'],
    windowColors: ['#c4a832', '#f5c842', '#e8a020'],
    roadGradient: ['#151f12', '#0d150a'],
    roadMarkingColor: '#2a3a20',
    starOpacity: 0.4,
  },
  { // 5: Ocean
    skyGradient: 'linear-gradient(180deg, #050a1a 0%, #0a1530 35%, #102050 60%, #1a3570 80%, #4ac4d4 100%)',
    farBuildingColors: ['#0a1035', '#0d1540'],
    nearBuildingColors: ['#060a28', '#080d30'],
    windowColors: ['#e0f0ff', '#80c8ff', '#4ac4d4'],
    roadGradient: ['#101828', '#0a1020'],
    roadMarkingColor: '#253550',
    starOpacity: 0.7,
  },
];

// ── Chapter → theme mapping ──────────────────────────────────────────────────
//
// 8 chapters: structures cycle A→B→C, palettes cycle through all 6.
// Adjacent chapters always have different structure AND different palette.

const STRUCTURE_KEYS: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

export const CHAPTER_THEMES: ChapterSceneTheme[] = Array.from({ length: 8 }, (_, i) => ({
  structureKey: STRUCTURE_KEYS[i % 3],
  palette: COLOR_PALETTES[i % COLOR_PALETTES.length],
  characterBottom: 8, // sits on the 18px road (was 14, which floated above)
}));
