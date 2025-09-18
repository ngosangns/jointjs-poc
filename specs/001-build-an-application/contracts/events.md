# Events Contract

## selection:changed

- payload: { ids: string[] }

## element:added

- payload: { element: Shape }

## element:updated

- payload: { id: string, patch: Partial<Shape> }

## element:removed

- payload: { id: string }

## link:added

- payload: { link: Link }

## link:updated

- payload: { id: string, patch: Partial<Link> }

## link:removed

- payload: { id: string }

## viewport:changed

- payload: { zoom: number, pan: { x: number, y: number } }

## document:saved | document:loaded

- payload: { documentId: string }
