# Data Model

**Status**: ✅ Current implementation reflects this model with JointJS integration

## Entities

### Diagram

- id (string, uuid)
- title (string)
- pages (Page[])
- settings (DocumentSettings)
- metadata (createdAt, updatedAt, author?)

### Page

- id (string)
- name (string)
- size (width, height, units)
- background (color, grid: enabled, spacing)
- layers (Layer[])
- elements (Shape[])
- links (Link[])

### Shape (Element)

- id (string)
- type (enum/category)
- geometry (x, y, width, height, rotation)
- style (Style)
- text (value, font, size, color, align)
- ports (Port[])
- layerId (string)
- locked (bool)

### Port

- id (string)
- position (top, right, bottom, left, or coordinates)
- magnet (bool)

### Link (Connector)

- id (string)
- source (elementId, portId?)
- target (elementId, portId?)
- router (orthogonal|manhattan|straight)
- vertices (Point[])
- labels (Label[])
- style (Style)
- layerId (string)
- locked (bool)

### Label

- id (string)
- text (string)
- position (relative position along link)
- style (Style)

### Layer

- id (string)
- name (string)
- visible (bool)
- locked (bool)
- zIndex (number)

### Group

- id (string)
- elementIds (string[])

### Style

- strokeColor, strokeWidth, strokeDash
- fillColor, opacity
- fontFamily, fontSize, fontStyle, textColor
- markerStart, markerEnd

### Template

- id (string)
- name (string)
- elements (Shape[])
- links (Link[])

### DocumentSettings

- gridEnabled (bool)
- gridSpacing (number)
- defaultStyle (Style)
- pageSize (A4, Letter, custom)
- backgroundColor (string)

## Validation Rules

- Element and link IDs unique within page.
- Links must reference existing source/target elements and optional ports.
- Layer IDs referenced by elements/links must exist and be visible for rendering.
- Geometry must be non-negative sizes; rotation normalized [0,360).
- Autosave version increments per write; schema version stored.

## Implementation Notes

- **JointJS Integration**: Uses JointJS standard `graph.toJSON()` format with custom format support
- **Shape Types**: Maps to JointJS cell namespaces (e.g., 'basic.Rect', 'network.Router')
- **Event System**: Leverages JointJS built-in `mvc.Events` with custom event mapping
- **Tools Management**: Uses JointJS `elementTools` and `linkTools` for interactive features
- **Persistence**: IndexedDB storage with autosave every 5 seconds or 20 operations

## Relationships

- Diagram 1..\* Page
- Page 1.._ Layer, 0.._ Shape, 0..\* Link
- Shape 0..\* Port, belongs to one Layer
- Link connects two Shapes (or ports), belongs to one Layer
- Group references multiple Shapes
