import { validateDiagramModel } from '../../diagram-core/validators/validateDiagram';
import { validatePageModel } from '../../diagram-core/validators/validatePage';
import { validateElementModel } from '../../diagram-core/validators/validateElement';
import { validateLinkModel } from '../../diagram-core/validators/validateLink';

describe('Validators', () => {
  it('validateDiagramModel should require id and pages array', () => {
    expect(validateDiagramModel({ id: 'd1', pages: [] } as any)).toBe(true);
    expect(validateDiagramModel({ id: '', pages: [] } as any)).toBe(false);
    expect(validateDiagramModel({ id: 'd1' } as any)).toBe(false);
  });

  it('validatePageModel should require id and name', () => {
    expect(validatePageModel({ id: 'p1', name: 'Page 1' } as any)).toBe(true);
    expect(validatePageModel({ id: '', name: 'x' } as any)).toBe(false);
    expect(validatePageModel({ id: 'p1', name: '' } as any)).toBe(false);
  });

  it('validateElementModel should require geometry non-negative', () => {
    expect(
      validateElementModel({ id: 'e1', type: 'rect', geometry: { x: 0, y: 0, width: 10, height: 10 } } as any)
    ).toBe(true);
    expect(
      validateElementModel({ id: 'e1', type: 'rect', geometry: { x: 0, y: 0, width: -1, height: 10 } } as any)
    ).toBe(false);
  });

  it('validateLinkModel should require endpoints', () => {
    expect(
      validateLinkModel({ id: 'l1', source: { elementId: 'e1' }, target: { elementId: 'e2' } } as any)
    ).toBe(true);
    expect(validateLinkModel({ id: 'l1', source: { elementId: 'e1' } } as any)).toBe(false);
  });
});


