# Data Model

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

### HistoryEntry

- id (string)
- timestamp (number)
- action (type)
- payload (diff)

## Validation Rules

- Element and link IDs unique within page.
- Links must reference existing source/target elements and optional ports.
- Layer IDs referenced by elements/links must exist and be visible for rendering.
- Geometry must be non-negative sizes; rotation normalized [0,360).
- Autosave version increments per write; schema version stored.

## Relationships

- Diagram 1..\* Page
- Page 1.._ Layer, 0.._ Shape, 0..\* Link
- Shape 0..\* Port, belongs to one Layer
- Link connects two Shapes (or ports), belongs to one Layer
- Group references multiple Shapes
