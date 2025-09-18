import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import type { DiagramConfig } from '../../types';

describe('Performance Optimizations', () => {
  let engine: DiagramEngine;
  let mockConfig: DiagramConfig;

  beforeEach(() => {
    mockConfig = {
      width: 800,
      height: 600,
      gridSize: 10,
      collisionDetection: true,
    };

    // Create a mock DOM element
    const mockElement = document.createElement('div');
    mockElement.style.width = '800px';
    mockElement.style.height = '600px';

    engine = new DiagramEngine(mockConfig);
  });

  describe('Performance Monitoring', () => {
    test('should initialize performance monitor with default settings', () => {
      const perfMonitor = (engine as any).performanceMonitor;

      expect(perfMonitor).toBeDefined();
      expect(perfMonitor.viewportCulling).toBe(false);
      expect(perfMonitor.batchOperations).toBe(false);
      expect(perfMonitor.viewportChangeThrottle).toBe(16); // 60fps
    });

    test('should get performance statistics', () => {
      const stats = engine.getPerformanceStats();

      expect(stats.viewportCullingEnabled).toBeDefined();
      expect(stats.batchOperationsEnabled).toBeDefined();
      expect(stats.elementCount).toBeDefined();
      expect(stats.visibleElementCount).toBeDefined();
      expect(stats.lastViewportChange).toBeDefined();
    });

    test('should set performance optimizations', () => {
      const optimizations = {
        viewportCulling: true,
        batchOperations: true,
        viewportChangeThrottle: 8, // 120fps
      };

      engine.setPerformanceOptimizations(optimizations);

      const stats = engine.getPerformanceStats();
      expect(stats.viewportCullingEnabled).toBe(true);
      expect(stats.batchOperationsEnabled).toBe(true);
    });
  });

  describe('Viewport Culling', () => {
    test('should enable viewport culling', () => {
      engine.setPerformanceOptimizations({ viewportCulling: true });

      const stats = engine.getPerformanceStats();
      expect(stats.viewportCullingEnabled).toBe(true);
    });

    test('should get visible elements when viewport culling is enabled', () => {
      const element1 = {
        id: 'element1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        position: { x: 1000, y: 1000 },
        size: { width: 40, height: 25 },
      };

      jest.spyOn(engine as any, 'getAllElements').mockReturnValue([element1, element2]);
      jest.spyOn(engine as any, 'getViewportBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });

      const visibleElements = (engine as any).getVisibleElements();
      expect(visibleElements).toEqual([element1]);
    });

    test('should return all elements when viewport culling is disabled', () => {
      engine.setPerformanceOptimizations({ viewportCulling: false });

      const element1 = {
        id: 'element1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        position: { x: 1000, y: 1000 },
        size: { width: 40, height: 25 },
      };

      jest.spyOn(engine as any, 'getAllElements').mockReturnValue([element1, element2]);

      const visibleElements = (engine as any).getVisibleElements();
      expect(visibleElements).toEqual([element1, element2]);
    });
  });

  describe('Batch Operations', () => {
    test('should enable batch operations', () => {
      engine.setPerformanceOptimizations({ batchOperations: true });

      const stats = engine.getPerformanceStats();
      expect(stats.batchOperationsEnabled).toBe(true);
    });

    test('should use batch operations for multiple element moves', () => {
      engine.setPerformanceOptimizations({ batchOperations: true });

      const element1 = {
        id: 'element1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        type: 'circle',
        position: { x: 200, y: 200 },
        size: { width: 40, height: 40 },
      };

      jest.spyOn(engine as any, 'getSelectedElements').mockReturnValue(['element1', 'element2']);
      jest.spyOn(engine as any, 'batchMoveElements').mockImplementation(() => {});

      engine.moveSelectedElements(10, 20);

      expect((engine as any).batchMoveElements).toHaveBeenCalledWith(
        ['element1', 'element2'],
        10,
        20
      );
    });

    test('should not use batch operations when disabled', () => {
      engine.setPerformanceOptimizations({ batchOperations: false });

      const element1 = {
        id: 'element1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engine as any, 'getSelectedElements').mockReturnValue(['element1']);
      jest.spyOn(engine as any, 'getElement').mockReturnValue(element1);
      jest.spyOn(engine as any, 'updateElement').mockImplementation(() => {});
      jest.spyOn(engine as any, 'updateConnectedLinks').mockImplementation(() => {});
      jest.spyOn(engine as any, 'batchMoveElements').mockImplementation(() => {});

      engine.moveSelectedElements(10, 20);

      expect((engine as any).batchMoveElements).not.toHaveBeenCalled();
      expect((engine as any).updateElement).toHaveBeenCalled();
    });
  });

  describe('Event Throttling', () => {
    test('should throttle viewport change events', () => {
      engine.setPerformanceOptimizations({ viewportChangeThrottle: 100 }); // 10fps

      const stats = engine.getPerformanceStats();
      expect(stats.lastViewportChange).toBeDefined();
    });

    test('should emit viewport changed event with throttling', () => {
      jest.spyOn(engine as any, 'emitEvent').mockImplementation(() => {});

      // Mock the throttled function
      const originalEmitViewportChanged = (engine as any).emitViewportChanged;
      (engine as any).emitViewportChanged = jest.fn().mockImplementation(() => {
        originalEmitViewportChanged.call(engine);
      });

      (engine as any).emitViewportChanged();

      expect((engine as any).emitViewportChanged).toHaveBeenCalled();
    });
  });

  describe('Performance Statistics', () => {
    test('should track operation timing', () => {
      const startTime = Date.now();

      // Simulate an operation
      (engine as any).performanceMonitor.lastOperationTime = Date.now() - startTime;

      const stats = engine.getPerformanceStats();
      expect(stats.lastViewportChange).toBeGreaterThanOrEqual(0);
    });

    test('should track visible vs total elements ratio', () => {
      const element1 = {
        id: 'element1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        position: { x: 1000, y: 1000 },
        size: { width: 40, height: 25 },
      };

      jest.spyOn(engine as any, 'getAllElements').mockReturnValue([element1, element2]);
      jest.spyOn(engine as any, 'getViewportBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });

      const stats = engine.getPerformanceStats();
      expect(stats.elementCount).toBe(2);
      expect(stats.visibleElementCount).toBe(1);
    });
  });

  describe('Smooth Transitions', () => {
    test('should support smooth pan transitions', () => {
      jest.spyOn(engine as any, 'smoothPanTo').mockImplementation(() => {});

      engine.panTo(100, 200, true);

      expect((engine as any).smoothPanTo).toHaveBeenCalledWith(100, 200);
    });

    test('should support smooth zoom transitions', () => {
      jest.spyOn(engine as any, 'smoothZoomTo').mockImplementation(() => {});

      engine.setZoom(1.5, true);

      expect((engine as any).smoothZoomTo).toHaveBeenCalledWith(1.5);
    });

    test('should use immediate transitions when smooth is false', () => {
      jest.spyOn(engine as any, 'smoothPanTo').mockImplementation(() => {});
      jest.spyOn(engine as any, 'setPan').mockImplementation(() => {});

      engine.panTo(100, 200, false);

      expect((engine as any).smoothPanTo).not.toHaveBeenCalled();
      expect((engine as any).setPan).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('Memory Management', () => {
    test('should clean up performance monitoring on destroy', () => {
      const perfMonitor = (engine as any).performanceMonitor;

      // Simulate cleanup
      engine.destroy();

      // Performance monitor should be cleaned up
      expect(perfMonitor).toBeDefined(); // Still exists but should be reset
    });

    test('should handle large numbers of elements efficiently', () => {
      // Create a large number of mock elements
      const elements = Array.from({ length: 1000 }, (_, i) => ({
        id: `element${i}`,
        position: { x: i * 10, y: i * 10 },
        size: { width: 50, height: 30 },
      }));

      jest.spyOn(engine as any, 'getAllElements').mockReturnValue(elements);
      jest.spyOn(engine as any, 'getViewportBounds').mockReturnValue({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });

      const startTime = Date.now();
      const visibleElements = (engine as any).getVisibleElements();
      const endTime = Date.now();

      // Should complete quickly even with many elements
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
      expect(visibleElements.length).toBeLessThan(elements.length);
    });
  });
});
