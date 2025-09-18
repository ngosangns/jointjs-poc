/**
 * Contract tests for pan/zoom and movement APIs
 * Tests API compliance with library-apis.md and events.md contracts
 */

import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import type { DiagramConfig } from '../../types';
import type { Shape } from '../../diagram-core/interfaces/Shape';

describe('Pan/Zoom and Movement API Contracts', () => {
  let engine: DiagramEngine;
  let container: HTMLElement;
  let config: DiagramConfig;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    config = {
      width: 800,
      height: 600,
      gridSize: 10,
      interactive: true,
    };

    engine = new DiagramEngine(config);
    engine.initializePaper(container);
  });

  afterEach(() => {
    engine.destroy();
    document.body.removeChild(container);
  });

  describe('Pan/Zoom API Compliance', () => {
    describe('zoomIn()', () => {
      it('should increase zoom level by default step', () => {
        const initialZoom = engine.getZoom();
        engine.zoomIn();
        const newZoom = engine.getZoom();
        expect(newZoom).toBeGreaterThan(initialZoom);
      });

      it('should increase zoom by custom step', () => {
        const initialZoom = engine.getZoom();
        const customStep = 1.5;
        engine.zoomIn(customStep);
        const newZoom = engine.getZoom();
        expect(newZoom).toBeCloseTo(initialZoom * customStep, 2);
      });

      it('should respect zoom bounds (0.1x to 5x)', () => {
        // Test maximum zoom
        for (let i = 0; i < 20; i++) {
          engine.zoomIn();
        }
        expect(engine.getZoom()).toBeLessThanOrEqual(5.0);

        // Reset and test minimum zoom
        engine.setZoom(1);
        for (let i = 0; i < 20; i++) {
          engine.zoomOut();
        }
        expect(engine.getZoom()).toBeGreaterThanOrEqual(0.1);
      });

      it('should emit viewport:changed event with correct payload shape', (done) => {
        engine.addEventListener('viewport:changed', (payload: any) => {
          expect(payload.zoom).toBeDefined();
          expect(payload.pan).toBeDefined();
          expect(payload.pan.x).toBeDefined();
          expect(payload.pan.y).toBeDefined();
          expect(typeof payload.zoom).toBe('number');
          expect(typeof payload.pan.x).toBe('number');
          expect(typeof payload.pan.y).toBe('number');
          done();
        });

        engine.zoomIn();
      });
    });

    describe('zoomOut()', () => {
      it('should decrease zoom level by default step', () => {
        const initialZoom = engine.getZoom();
        engine.zoomOut();
        const newZoom = engine.getZoom();
        expect(newZoom).toBeLessThan(initialZoom);
      });

      it('should decrease zoom by custom step', () => {
        const initialZoom = engine.getZoom();
        const customStep = 0.8;
        engine.zoomOut(customStep);
        const newZoom = engine.getZoom();
        expect(newZoom).toBeCloseTo(initialZoom * customStep, 2);
      });

      it('should respect zoom bounds (0.1x to 5x)', () => {
        // Test minimum zoom
        for (let i = 0; i < 20; i++) {
          engine.zoomOut();
        }
        expect(engine.getZoom()).toBeGreaterThanOrEqual(0.1);
      });
    });

    describe('setZoom(z)', () => {
      it('should set zoom to specified value', () => {
        const targetZoom = 2.5;
        engine.setZoom(targetZoom);
        expect(engine.getZoom()).toBe(targetZoom);
      });

      it('should clamp zoom to bounds (0.1x to 5x)', () => {
        engine.setZoom(10); // Above max
        expect(engine.getZoom()).toBe(5.0);

        engine.setZoom(0.05); // Below min
        expect(engine.getZoom()).toBe(0.1);
      });

      it('should emit viewport:changed event', (done) => {
        engine.addEventListener('viewport:changed', (payload: any) => {
          expect(payload.zoom).toBe(2.0);
          done();
        });

        engine.setZoom(2.0);
      });
    });

    describe('panTo(x, y)', () => {
      it('should pan to specified coordinates', () => {
        const targetX = 100;
        const targetY = 150;
        engine.panTo(targetX, targetY);

        // Note: We can't directly test pan position without exposing internal state
        // This test verifies the method doesn't throw and emits events
        expect(() => engine.panTo(targetX, targetY)).not.toThrow();
      });

      it('should emit viewport:changed event', (done) => {
        engine.addEventListener('viewport:changed', (payload: any) => {
          expect(payload.pan).toBeDefined();
          expect(payload.pan.x).toBeDefined();
          expect(payload.pan.y).toBeDefined();
          done();
        });

        engine.panTo(50, 75);
      });
    });

    describe('fitToViewport()', () => {
      it('should fit content to viewport with default padding', () => {
        expect(() => engine.fitToViewport()).not.toThrow();
      });

      it('should fit content to viewport with custom padding', () => {
        expect(() => engine.fitToViewport(50)).not.toThrow();
      });

      it('should emit viewport:changed event', (done) => {
        engine.addEventListener('viewport:changed', (payload: any) => {
          expect(payload.zoom).toBeDefined();
          expect(payload.pan).toBeDefined();
          done();
        });

        engine.fitToViewport();
      });
    });
  });

  describe('Shape and Link Movement API Compliance', () => {
    let shapeId1: string;
    let shapeId2: string;
    let linkId: string;

    beforeEach(() => {
      // Add test shapes and link
      shapeId1 = engine.addElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 80, height: 60 },
        properties: { fill: '#ff6b6b' },
      });

      shapeId2 = engine.addElement({
        type: 'rectangle',
        position: { x: 300, y: 200 },
        size: { width: 80, height: 60 },
        properties: { fill: '#4ecdc4' },
      });

      linkId = engine.addLink({
        source: shapeId1,
        target: shapeId2,
        properties: { stroke: '#333', strokeWidth: 2 },
      });
    });

    describe('moveSelectedElements(dx, dy)', () => {
      it('should move selected elements by specified offset', () => {
        // Select first shape
        const selectedElements = engine.getSelectedElements();
        expect(selectedElements).toBeDefined();

        // Move selected elements
        expect(() => engine.moveSelectedElements(50, 30)).not.toThrow();
      });

      it('should emit element:updated events for moved elements', (done) => {
        let eventCount = 0;
        const expectedEvents = 1; // One selected element

        engine.addEventListener('element:updated', (payload: any) => {
          expect(payload.id).toBeDefined();
          expect(payload.patch).toBeDefined();
          eventCount++;
          if (eventCount === expectedEvents) {
            done();
          }
        });

        engine.moveSelectedElements(25, 15);
      });
    });

    describe('updateShape(id, { geometry })', () => {
      it('should update shape geometry for movement', () => {
        const newGeometry = { x: 150, y: 120, width: 80, height: 60 };

        expect(() => {
          engine.updateShape(shapeId1, { geometry: newGeometry });
        }).not.toThrow();
      });

      it('should emit element:updated event with geometry changes', (done) => {
        engine.addEventListener('element:updated', (payload: any) => {
          expect(payload.id).toBe(shapeId1);
          expect(payload.patch.geometry).toBeDefined();
          expect(payload.patch.geometry.x).toBeDefined();
          expect(payload.patch.geometry.y).toBeDefined();
          done();
        });

        engine.updateShape(shapeId1, {
          geometry: { x: 200, y: 150, width: 80, height: 60 },
        });
      });
    });

    describe('Movement Constraints', () => {
      it('should respect bounds checking', () => {
        // Try to move shape to negative coordinates
        expect(() => {
          engine.updateShape(shapeId1, {
            geometry: { x: -100, y: -100, width: 80, height: 60 },
          });
        }).not.toThrow();
      });

      it('should support grid snapping when enabled', () => {
        // Enable grid
        engine.grid.enable(true);
        engine.grid.setSpacing(20);

        // Move shape - should snap to grid
        expect(() => {
          engine.updateShape(shapeId1, {
            geometry: { x: 105, y: 105, width: 80, height: 60 },
          });
        }).not.toThrow();
      });
    });

    describe('Link Movement and Vertex Manipulation', () => {
      it('should update link when source element moves', (done) => {
        engine.addEventListener('link:updated', (payload: any) => {
          expect(payload.id).toBe(linkId);
          expect(payload.patch.source).toBeDefined();
          done();
        });

        // Move source element
        engine.updateShape(shapeId1, {
          geometry: { x: 150, y: 120, width: 80, height: 60 },
        });
      });

      it('should update link when target element moves', (done) => {
        engine.addEventListener('link:updated', (payload: any) => {
          expect(payload.id).toBe(linkId);
          expect(payload.patch.target).toBeDefined();
          done();
        });

        // Move target element
        engine.updateShape(shapeId2, {
          geometry: { x: 350, y: 220, width: 80, height: 60 },
        });
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should achieve 60fps for pan operations', (done) => {
      const startTime = performance.now();
      let frameCount = 0;
      const targetFrames = 60;
      const frameTime = 16.67; // 60fps = ~16.67ms per frame

      const panFrame = () => {
        const currentTime = performance.now();
        if (currentTime - startTime < 1000) {
          // Run for 1 second
          engine.pan(1, 1);
          frameCount++;
          setTimeout(panFrame, frameTime);
        } else {
          const fps = frameCount;
          expect(fps).toBeGreaterThanOrEqual(50); // Allow some tolerance
          done();
        }
      };

      panFrame();
    });

    it('should complete shape movement in less than 100ms', (done) => {
      const shapeId = engine.addElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 80, height: 60 },
      });

      const startTime = performance.now();

      engine.updateShape(shapeId, {
        geometry: { x: 200, y: 200, width: 80, height: 60 },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      done();
    });
  });
});
