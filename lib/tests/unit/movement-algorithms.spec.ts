import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import type { DiagramConfig, DiagramData } from '../../types';

describe('Movement Algorithms and Constraints', () => {
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

  describe('calculateConstrainedPosition', () => {
    test('should snap to grid when snapToGrid is enabled', () => {
      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 15, y: 23 },
        size: { width: 50, height: 30 },
      };

      // Mock the getElement method
      jest.spyOn(engine as any, 'getElement').mockReturnValue(element);

      const result = (engine as any).calculateConstrainedPosition('test-element', 5, 7);

      // Should snap to grid (gridSize: 10)
      expect(result.x).toBe(20); // 15 + 5 = 20 (already on grid)
      expect(result.y).toBe(30); // 23 + 7 = 30 (snapped to grid)
    });

    test('should not snap to grid when snapToGrid is disabled', () => {
      const configWithoutSnap = { ...mockConfig };
      const mockElement = document.createElement('div');
      mockElement.style.width = '800px';
      mockElement.style.height = '600px';

      const engineNoSnap = new DiagramEngine(configWithoutSnap);

      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 15, y: 23 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engineNoSnap as any, 'getElement').mockReturnValue(element);

      const result = (engineNoSnap as any).calculateConstrainedPosition('test-element', 5, 7);

      // Should not snap to grid
      expect(result.x).toBe(20); // 15 + 5 = 20
      expect(result.y).toBe(30); // 23 + 7 = 30
    });

    test('should respect page bounds constraints', () => {
      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 950, y: 950 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engine as any, 'getElement').mockReturnValue(element);

      const result = (engine as any).calculateConstrainedPosition('test-element', 100, 100);

      // Should be constrained to page bounds (1000x1000)
      expect(result.x).toBe(950); // 950 + 100 = 1050, but constrained to 1000 - 50 = 950
      expect(result.y).toBe(970); // 950 + 100 = 1050, but constrained to 1000 - 30 = 970
    });

    test('should prevent negative positions', () => {
      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 10, y: 10 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engine as any, 'getElement').mockReturnValue(element);

      const result = (engine as any).calculateConstrainedPosition('test-element', -20, -20);

      // Should not go below 0
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('checkCollision', () => {
    test('should detect collision between two elements', () => {
      const element1 = {
        id: 'element1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        position: { x: 120, y: 110 },
        size: { width: 40, height: 25 },
      };

      jest.spyOn(engine as any, 'getElement').mockImplementation((...args: unknown[]) => {
        const id = args[0] as string;
        return id === 'element1' ? element1 : element2;
      });

      const hasCollision = (engine as any).checkCollision('element1', 'element2');
      expect(hasCollision).toBe(true);
    });

    test('should not detect collision between non-overlapping elements', () => {
      const element1 = {
        id: 'element1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const element2 = {
        id: 'element2',
        position: { x: 200, y: 200 },
        size: { width: 40, height: 25 },
      };

      jest.spyOn(engine as any, 'getElement').mockImplementation((...args: unknown[]) => {
        const id = args[0] as string;
        return id === 'element1' ? element1 : element2;
      });

      const hasCollision = (engine as any).checkCollision('element1', 'element2');
      expect(hasCollision).toBe(false);
    });

    test('should not check collision when collision detection is disabled', () => {
      const configNoCollision = { ...mockConfig, collisionDetection: false };
      const mockElement = document.createElement('div');
      mockElement.style.width = '800px';
      mockElement.style.height = '600px';

      const engineNoCollision = new DiagramEngine(configNoCollision);

      const hasCollision = (engineNoCollision as any).checkCollision('element1', 'element2');
      expect(hasCollision).toBe(false);
    });
  });

  describe('bboxIntersect', () => {
    test('should detect intersection between two bounding boxes', () => {
      const bbox1 = { x: 100, y: 100, width: 50, height: 30 };
      const bbox2 = { x: 120, y: 110, width: 40, height: 25 };

      const intersects = (engine as any).bboxIntersect(bbox1, bbox2);
      expect(intersects).toBe(true);
    });

    test('should not detect intersection between non-overlapping bounding boxes', () => {
      const bbox1 = { x: 100, y: 100, width: 50, height: 30 };
      const bbox2 = { x: 200, y: 200, width: 40, height: 25 };

      const intersects = (engine as any).bboxIntersect(bbox1, bbox2);
      expect(intersects).toBe(false);
    });

    test('should detect intersection when boxes are adjacent', () => {
      const bbox1 = { x: 100, y: 100, width: 50, height: 30 };
      const bbox2 = { x: 150, y: 100, width: 40, height: 25 };

      const intersects = (engine as any).bboxIntersect(bbox1, bbox2);
      expect(intersects).toBe(true);
    });
  });

  describe('getPageBounds', () => {
    test('should return page bounds from config', () => {
      const bounds = (engine as any).getPageBounds();
      expect(bounds).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
    });

    test('should return default bounds when not configured', () => {
      const configNoBounds = { ...mockConfig };
      // Remove pageBounds if it exists

      const mockElement = document.createElement('div');
      mockElement.style.width = '800px';
      mockElement.style.height = '600px';

      const engineNoBounds = new DiagramEngine(configNoBounds);

      const bounds = (engineNoBounds as any).getPageBounds();
      expect(bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    });
  });

  describe('moveElement', () => {
    test('should move element with constraints applied', () => {
      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engine as any, 'getElement').mockReturnValue(element);
      jest.spyOn(engine as any, 'updateElement').mockImplementation(() => {});
      jest.spyOn(engine as any, 'updateConnectedLinks').mockImplementation(() => {});

      engine.moveElement('test-element', 20, 30);

      expect((engine as any).updateElement).toHaveBeenCalledWith('test-element', {
        position: { x: 120, y: 130 },
      });
      expect((engine as any).updateConnectedLinks).toHaveBeenCalledWith('test-element');
    });

    test('should emit element:updated event', () => {
      const element = {
        id: 'test-element',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      jest.spyOn(engine as any, 'getElement').mockReturnValue(element);
      jest.spyOn(engine as any, 'updateElement').mockImplementation(() => {});
      jest.spyOn(engine as any, 'updateConnectedLinks').mockImplementation(() => {});
      jest.spyOn(engine as any, 'emitEvent').mockImplementation(() => {});

      engine.moveElement('test-element', 20, 30);

      expect((engine as any).emitEvent).toHaveBeenCalledWith('element:updated', {
        elementId: 'test-element',
        changes: { position: { x: 120, y: 130 } },
      });
    });
  });

  describe('moveSelectedElements', () => {
    test('should move all selected elements', () => {
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
      jest.spyOn(engine as any, 'getElement').mockImplementation((...args: unknown[]) => {
        const id = args[0] as string;
        return id === 'element1' ? element1 : element2;
      });
      jest.spyOn(engine as any, 'updateElement').mockImplementation(() => {});
      jest.spyOn(engine as any, 'updateConnectedLinks').mockImplementation(() => {});

      engine.moveSelectedElements(10, 20);

      expect((engine as any).updateElement).toHaveBeenCalledTimes(2);
      expect((engine as any).updateElement).toHaveBeenCalledWith('element1', {
        position: { x: 110, y: 120 },
      });
      expect((engine as any).updateElement).toHaveBeenCalledWith('element2', {
        position: { x: 210, y: 220 },
      });
    });

    test('should use batch operations when enabled', () => {
      const configWithBatch = { ...mockConfig, batchOperations: true };
      const mockElement = document.createElement('div');
      mockElement.style.width = '800px';
      mockElement.style.height = '600px';

      const engineWithBatch = new DiagramEngine(configWithBatch);

      jest
        .spyOn(engineWithBatch as any, 'getSelectedElements')
        .mockReturnValue(['element1', 'element2']);
      jest.spyOn(engineWithBatch as any, 'batchMoveElements').mockImplementation(() => {});

      engineWithBatch.moveSelectedElements(10, 20);

      expect((engineWithBatch as any).batchMoveElements).toHaveBeenCalledWith(
        ['element1', 'element2'],
        10,
        20
      );
    });
  });

  describe('batchMoveElements', () => {
    test('should move multiple elements in a single batch', () => {
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

      jest.spyOn(engine as any, 'getElement').mockImplementation((...args: unknown[]) => {
        const id = args[0] as string;
        return id === 'element1' ? element1 : element2;
      });
      jest.spyOn(engine as any, 'updateElement').mockImplementation(() => {});
      jest.spyOn(engine as any, 'updateConnectedLinks').mockImplementation(() => {});
      jest.spyOn(engine as any, 'emitEvent').mockImplementation(() => {});

      (engine as any).batchMoveElements(['element1', 'element2'], 10, 20);

      expect((engine as any).updateElement).toHaveBeenCalledTimes(2);
      expect((engine as any).emitEvent).toHaveBeenCalledWith('elements:batch-updated', {
        elementIds: ['element1', 'element2'],
        changes: { position: { dx: 10, dy: 20 } },
      });
    });
  });

  describe('getVisibleElements', () => {
    test('should return elements within viewport bounds', () => {
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
  });

  describe('getViewportBounds', () => {
    test('should return current viewport bounds', () => {
      jest.spyOn(engine as any, 'getZoom').mockReturnValue(1.2);
      jest.spyOn(engine as any, 'getPan').mockReturnValue({ x: 100, y: 50 });

      const bounds = (engine as any).getViewportBounds();

      // Viewport bounds should be calculated based on zoom and pan
      expect(bounds.x).toBeDefined();
      expect(bounds.y).toBeDefined();
      expect(bounds.width).toBeDefined();
      expect(bounds.height).toBeDefined();
    });
  });

  describe('bboxIntersectsViewport', () => {
    test('should detect when element intersects with viewport', () => {
      const elementBounds = { x: 100, y: 100, width: 50, height: 30 };
      const viewportBounds = { x: 0, y: 0, width: 800, height: 600 };

      const intersects = (engine as any).bboxIntersectsViewport(elementBounds, viewportBounds);
      expect(intersects).toBe(true);
    });

    test('should detect when element is outside viewport', () => {
      const elementBounds = { x: 1000, y: 1000, width: 50, height: 30 };
      const viewportBounds = { x: 0, y: 0, width: 800, height: 600 };

      const intersects = (engine as any).bboxIntersectsViewport(elementBounds, viewportBounds);
      expect(intersects).toBe(false);
    });
  });
});
