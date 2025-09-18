## Luồng tương tác trên Paper: Toggle Grid, Kéo (Drag) phần tử, Chọn (Select) phần tử

Tài liệu này mô tả ngắn gọn cách các luồng tương tác chính hoạt động trong hệ thống, bao gồm vị trí triển khai và chuỗi sự kiện giữa các lớp: `PaperManager`, `GraphManager`, `EventManager`, `DiagramEngine`, `DiagramService`, và component Angular `DiagramCanvasComponent`.

### 1) Toggle Grid (Bật/tắt lưới)

- **Điểm khởi phát (UI):** `DiagramCanvasComponent.onToggleGrid()` trong `src/app/components/diagram-canvas/diagram-canvas.ts` gọi `DiagramService.toggleGrid()` để đổi trạng thái lưới và cập nhật Drop Zone.
- **Service:** `DiagramService.toggleGrid()` trong `src/app/services/diagram.ts` ủy quyền cho `DiagramEngine.grid.toggle()` và trả về trạng thái mới.
- **Engine:** `DiagramEngine.grid.toggle()` trong `lib/diagram-core/DiagramEngine.ts`
  - Đổi cờ trong `ToolsManager` (trạng thái lưới) và gọi `PaperManager.setGrid(paper, next)` để áp dụng lên Paper.
  - Trước khi set grid, engine lưu lại `scale` và `translate` hiện tại, sau đó khôi phục để không làm thay đổi viewport của người dùng.
  - Gọi `emitViewportChanged()` để phát sự kiện `viewport:changed` (zoom, pan hiện tại) thông qua `EventManager`.
- **Paper:** `PaperManager.setGrid()` trong `lib/diagram-core/managers/PaperManager.ts` cập nhật `drawGrid` và `gridSize` trên `dia.Paper`, rồi `render()` lại nền lưới mà không đụng vào cell.
- **Sự kiện/Hiển thị:** `DiagramCanvasComponent` lắng nghe `viewport:changed` để cập nhật `currentZoom`/`currentPan`; `isGridEnabled` được bind từ `DiagramService.isGridEnabled()`.

Tóm tắt chuỗi gọi: UI → DiagramService.toggleGrid → DiagramEngine.grid.toggle → PaperManager.setGrid → emit `viewport:changed` → UI cập nhật.

### 2) Kéo (Drag) phần tử

- **Khởi phát (chuột):** Trong `PaperManager.setupPaperEvents()` (`lib/diagram-core/managers/PaperManager.ts`)
  - `element:pointerdown`: đánh dấu khả năng kéo, đặt `origin`, và phát `element:selected` ngay lập tức với `{ id, element, position }`.
  - Hỗ trợ “press-hold” (nhấn giữ) và ngưỡng di chuyển `dragStartThresholdPx` để bắt đầu kéo ngay cả khi di chuyển ít.
  - `element:pointermove`: khi vượt ngưỡng hoặc đang kéo, phát `element:dragging` kèm vị trí con trỏ.
  - `element:pointerup`: nếu đang kéo, phát `element:drag-end`.
- **Bắc cầu sự kiện:** `EventManager` (`lib/diagram-core/managers/EventManager.ts`) khởi tạo và duy trì listener, nhưng luồng kéo chi tiết do `PaperManager` chủ động `emitEvent()` các sự kiện logic: `element:selected`, `element:dragging`, `element:drag-end`.
- **Xử lý trong Engine:** `DiagramEngine` (`lib/diagram-core/DiagramEngine.ts`)
  - Đăng ký handler trong `setupKeyboardEventHandlers()`:
    - `element:dragging` → `handleElementDrag(data)`
      - Ghi nhớ trạng thái kéo lần đầu (id, startPosition), tính `dx, dy` theo vị trí hiện tại trừ gốc, rồi gọi `moveElement(id, dx, dy)`.
      - `moveElement()` áp dụng ràng buộc (biên trang, snapping lưới nếu bật, kiểm tra va chạm nếu không tắt), cập nhật `position`, phát `element:updated`, và đồng bộ các liên kết nối (`updateConnectedLinks`).
    - `element:drag-end` → `handleElementDragEnd()` đặt lại trạng thái kéo.
- **Cập nhật đồ thị:** Việc thay đổi vị trí trên `dia.Element` sẽ kích hoạt các sự kiện JointJS (`change:position`) được `GraphManager.setupGraphEvents()` bắt và phát tiếp dưới dạng `element:moved`, `element:resized`, v.v. qua `EventManager`.
- **Hiển thị/UI:** Angular không kéo trực tiếp; UI nhận các sự kiện để cập nhật state (ví dụ số lượng chọn), còn hành vi kéo và vẽ do Paper/JointJS đảm nhiệm.

Chuỗi sự kiện chính: pointerdown → (press-hold/threshold) → pointermove → emit `element:dragging` → Engine `moveElement` (ràng buộc + snapping + cập nhật link) → pointerup → emit `element:drag-end`.

### 3) Chọn (Select) phần tử

- **Khởi phát (chuột):** `PaperManager.setupPaperEvents()`
  - `element:pointerdown` phát `element:selected` kèm `{ id, element, position }` ngay khi nhấn.
  - `blank:pointerdown` phát `canvas:clicked` (đồng thời dùng để pan trống bằng chuột trái; pan trống cập nhật `viewport:changed`).
- **Bắc cầu sự kiện:** `EventManager` cũng lắng nghe một số sự kiện JointJS mặc định (trong `setupJointJSEventListeners`), nhưng trong luồng chọn, `PaperManager` đã chủ động phát sự kiện giàu dữ liệu phục vụ app.
- **Xử lý trong Engine:** `DiagramEngine`
  - Lắng nghe `element:selected` → `handleElementSelection(data)`: thêm `id` vào `selectedElements` (tập hợp trong Engine) rồi gọi `updateSelectionState()`.
  - `updateSelectionState()` phát `selection:changed` với `{ elementIds, linkIds, hasSelection }`; nếu không còn gì, phát `selection:cleared`.
- **Service và UI:**
  - `DiagramService.attachToElement()` đăng ký lắng nghe `selection:changed`/`selection:cleared` để cập nhật `selection$` (`BehaviorSubject`).
  - `DiagramCanvasComponent.setupEventListeners()` lắng nghe `element:selected` và `canvas:clicked` để gọi `updateSelectionState()` cục bộ (đọc từ `DiagramService.getSelectedElements()`), đồng thời binding số lượng chọn (`selectedCount`).

Chuỗi chính: pointerdown trên element → emit `element:selected` → Engine cập nhật tập `selectedElements` → emit `selection:changed` → `DiagramService.selection$` và UI cập nhật.

### Liên quan khác

- `viewport:changed` được phát từ nhiều điểm: pan/zoom ở `PaperManager.setupPaperEvents()` (chuột, chạm), và từ `DiagramEngine.emitViewportChanged()` sau các thao tác zoom/pan hoặc khi đổi lưới để UI đồng bộ thông tin zoom/pan.
- `GraphManager` chịu trách nhiệm bắc cầu các thay đổi trên `dia.Graph` thành các sự kiện mức cao như `element:added/removed/changed/moved/resized`, bổ trợ cho việc theo dõi trạng thái.

### Tệp nguồn liên quan

- `lib/diagram-core/managers/PaperManager.ts`: Khởi tạo Paper, thiết lập sự kiện chuột/chạm, pan/zoom, phát sự kiện logic.
- `lib/diagram-core/managers/GraphManager.ts`: Bắc cầu sự kiện thay đổi cell của JointJS thành sự kiện ứng dụng.
- `lib/diagram-core/managers/EventManager.ts`: Quản lý đăng ký/emit sự kiện, bắc cầu cơ bản JointJS → app.
- `lib/diagram-core/DiagramEngine.ts`: Nơi xử lý nghiệp vụ (drag, select, move, grid, zoom/pan, history, perf...).
- `src/app/services/diagram.ts`: Service Angular ủy quyền gọi vào Engine, cung cấp stream selection và API cho UI.
- `src/app/components/diagram-canvas/diagram-canvas.ts`: Component UI; gắn engine vào DOM, lắng nghe sự kiện, thao tác nút (zoom, grid, v.v.).
