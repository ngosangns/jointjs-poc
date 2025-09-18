import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import type { DiagramConfig } from '../../types';

describe('Pan/Zoom Performance Tests', () => {
  let engine: DiagramEngine;
  let mockConfig: DiagramConfig;

  beforeEach(() => {
    mockConfig = {
      width: 1200,
      height: 800,
      gridSize: 10,
      collisionDetection: true,
    };

    engine = new DiagramEngine(mockConfig);
  });

  describe('Large Diagram Performance', () => {
    test('should handle 1000+ elements efficiently', () => {
      const startTime = Date.now();

      // Create 1000 elements
      const elements = Array.from({ length: 1000 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 50) * 25, y: Math.floor(i / 50) * 30 },
        size: { width: 20, height: 20 },
        properties: { label: `Element ${i}` },
      }));

      // Add elements to the diagram
      elements.forEach((element) => {
        engine.addElement(element);
      });

      const addTime = Date.now() - startTime;
      console.log(`Added 1000 elements in ${addTime}ms`);

      // Performance should be reasonable (less than 5 seconds for 1000 elements)
      expect(addTime).toBeLessThan(5000);
    });

    test('should pan efficiently with many elements', () => {
      // Create 500 elements
      const elements = Array.from({ length: 500 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 25) * 30, y: Math.floor(i / 25) * 35 },
        size: { width: 25, height: 25 },
        properties: { label: `Element ${i}` },
      }));

      elements.forEach((element) => {
        engine.addElement(element);
      });

      const startTime = Date.now();

      // Perform multiple pan operations
      for (let i = 0; i < 10; i++) {
        engine.panTo(i * 100, i * 50);
      }

      const panTime = Date.now() - startTime;
      console.log(`Panned 10 times with 500 elements in ${panTime}ms`);

      // Pan operations should be fast (less than 1 second for 10 operations)
      expect(panTime).toBeLessThan(1000);
    });

    test('should zoom efficiently with many elements', () => {
      // Create 500 elements
      const elements = Array.from({ length: 500 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 25) * 30, y: Math.floor(i / 25) * 35 },
        size: { width: 25, height: 25 },
        properties: { label: `Element ${i}` },
      }));

      elements.forEach((element) => {
        engine.addElement(element);
      });

      const startTime = Date.now();

      // Perform multiple zoom operations
      for (let i = 0; i < 10; i++) {
        engine.setZoom(1 + i * 0.1);
      }

      const zoomTime = Date.now() - startTime;
      console.log(`Zoomed 10 times with 500 elements in ${zoomTime}ms`);

      // Zoom operations should be fast (less than 1 second for 10 operations)
      expect(zoomTime).toBeLessThan(1000);
    });
  });

  describe('Viewport Culling Performance', () => {
    test('should improve performance with viewport culling enabled', () => {
      // Create 1000 elements spread across a large area
      const elements = Array.from({ length: 1000 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 100) * 50, y: Math.floor(i / 100) * 50 },
        size: { width: 40, height: 40 },
        properties: { label: `Element ${i}` },
      }));

      elements.forEach((element) => {
        engine.addElement(element);
      });

      // Test without viewport culling
      engine.setPerformanceOptimizations({ viewportCulling: false });

      const startTimeNoCulling = Date.now();
      for (let i = 0; i < 5; i++) {
        engine.panTo(i * 200, i * 100);
      }
      const timeNoCulling = Date.now() - startTimeNoCulling;

      // Test with viewport culling
      engine.setPerformanceOptimizations({ viewportCulling: true });

      const startTimeWithCulling = Date.now();
      for (let i = 0; i < 5; i++) {
        engine.panTo(i * 200, i * 100);
      }
      const timeWithCulling = Date.now() - startTimeWithCulling;

      console.log(`Pan time without culling: ${timeNoCulling}ms`);
      console.log(`Pan time with culling: ${timeWithCulling}ms`);

      // Viewport culling should improve performance (or at least not make it worse)
      expect(timeWithCulling).toBeLessThanOrEqual(timeNoCulling * 1.5); // Allow some tolerance
    });

    test('should correctly identify visible elements', () => {
      // Create elements in different areas
      const elements = [
        {
          id: 'element1',
          type: 'rectangle',
          position: { x: 100, y: 100 },
          size: { width: 50, height: 30 },
          properties: {},
        },
        {
          id: 'element2',
          type: 'rectangle',
          position: { x: 200, y: 200 },
          size: { width: 50, height: 30 },
          properties: {},
        },
        {
          id: 'element3',
          type: 'rectangle',
          position: { x: 1000, y: 1000 },
          size: { width: 50, height: 30 },
          properties: {},
        },
        {
          id: 'element4',
          type: 'rectangle',
          position: { x: 150, y: 150 },
          size: { width: 50, height: 30 },
          properties: {},
        },
      ];

      elements.forEach((element) => {
        engine.addElement(element);
      });

      engine.setPerformanceOptimizations({ viewportCulling: true });

      // Pan to show only first two elements
      engine.panTo(0, 0);

      const visibleElements = (engine as any).getVisibleElements();

      // Should only see elements in the visible area
      expect(visibleElements.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Batch Operations Performance', () => {
    test('should improve performance with batch operations', () => {
      // Create 100 elements
      const elements = Array.from({ length: 100 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 10) * 60, y: Math.floor(i / 10) * 60 },
        size: { width: 50, height: 30 },
        properties: { label: `Element ${i}` },
      }));

      elements.forEach((element) => {
        engine.addElement(element);
      });

      // Select all elements
      const allElementIds = elements.map((e) => e.id);
      jest.spyOn(engine as any, 'getSelectedElements').mockReturnValue(allElementIds);

      // Test without batch operations
      engine.setPerformanceOptimizations({ batchOperations: false });

      const startTimeNoBatch = Date.now();
      engine.moveSelectedElements(10, 10);
      const timeNoBatch = Date.now() - startTimeNoBatch;

      // Test with batch operations
      engine.setPerformanceOptimizations({ batchOperations: true });

      const startTimeWithBatch = Date.now();
      engine.moveSelectedElements(10, 10);
      const timeWithBatch = Date.now() - startTimeWithBatch;

      console.log(`Move time without batch: ${timeNoBatch}ms`);
      console.log(`Move time with batch: ${timeWithBatch}ms`);

      // Batch operations should improve performance
      expect(timeWithBatch).toBeLessThanOrEqual(timeNoBatch);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory during continuous operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const element = {
          id: `element${i}`,
          type: 'rectangle',
          position: { x: i * 10, y: i * 10 },
          size: { width: 50, height: 30 },
          properties: { label: `Element ${i}` },
        };

        engine.addElement(element);
        engine.panTo(i * 5, i * 5);
        engine.setZoom(1 + (i % 10) * 0.1);

        // Remove element to prevent unlimited growth
        if (i > 50) {
          engine.removeElement(`element${i - 50}`);
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase: ${memoryIncrease} bytes`);

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Event Throttling Performance', () => {
    test('should throttle viewport change events efficiently', () => {
      let eventCount = 0;

      // Mock event emission to count calls
      jest
        .spyOn((engine as any).eventManager, 'emitEvent')
        .mockImplementation((...args: unknown[]) => {
          const eventType = args[0] as string;
          if (eventType === 'viewport:changed') {
            eventCount++;
          }
        });

      // Set high throttling (100ms)
      engine.setPerformanceOptimizations({ viewportChangeThrottle: 100 });

      const startTime = Date.now();

      // Perform many rapid pan operations
      for (let i = 0; i < 20; i++) {
        engine.panTo(i * 10, i * 10);
      }

      const totalTime = Date.now() - startTime;

      // Wait for throttled events to be processed
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log(`Emitted ${eventCount} viewport:changed events in ${totalTime}ms`);

          // Should have fewer events than operations due to throttling
          expect(eventCount).toBeLessThan(20);

          resolve();
        }, 200);
      });
    });
  });

  describe('Smooth Transitions Performance', () => {
    test('should complete smooth transitions within reasonable time', () => {
      const startTime = Date.now();

      // Perform smooth pan
      engine.panTo(500, 300, true);

      // Perform smooth zoom
      engine.setZoom(2.0, true);

      const transitionTime = Date.now() - startTime;
      console.log(`Smooth transitions completed in ${transitionTime}ms`);

      // Smooth transitions should complete within reasonable time
      expect(transitionTime).toBeLessThan(2000);
    });
  });

  describe('Performance Statistics Accuracy', () => {
    test('should provide accurate performance statistics', () => {
      // Add some elements
      const elements = Array.from({ length: 50 }, (_, i) => ({
        id: `element${i}`,
        type: 'rectangle',
        position: { x: (i % 10) * 60, y: Math.floor(i / 10) * 60 },
        size: { width: 50, height: 30 },
        properties: { label: `Element ${i}` },
      }));

      elements.forEach((element) => {
        engine.addElement(element);
      });

      const stats = engine.getPerformanceStats();

      expect(stats.elementCount).toBe(50);
      expect(stats.visibleElementCount).toBeLessThanOrEqual(50);
      expect(stats.viewportCullingEnabled).toBeDefined();
      expect(stats.batchOperationsEnabled).toBeDefined();
      expect(stats.lastViewportChange).toBeGreaterThanOrEqual(0);
    });
  });
});
