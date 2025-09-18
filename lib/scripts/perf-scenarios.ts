import { DiagramEngine } from '../diagram-core/DiagramEngine';

export async function spawnElements(engine: DiagramEngine, count: number) {
  for (let i = 0; i < count; i++) {
    engine.addElement({
      type: 'rectangle',
      position: { x: 20 + (i % 50) * 20, y: 20 + Math.floor(i / 50) * 20 },
      size: { width: 16, height: 12 },
      properties: { attrs: { body: { fill: '#ccc' } } },
    } as any);
  }
}

export function sampleFps(windowObj: Window, durationMs = 3000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start: number | null = null;
    function tick(ts: number) {
      if (!start) start = ts;
      frames++;
      if (ts - start < durationMs) {
        windowObj.requestAnimationFrame(tick);
      } else {
        const fps = (frames * 1000) / (ts - start);
        resolve(fps);
      }
    }
    windowObj.requestAnimationFrame(tick);
  });
}
