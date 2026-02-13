/**
 * Resize.js - Handles widget resizing from any edge/corner
 * Maintains aspect ratio during resize
 */
import { store } from './store.js';

function initResize() {
    const dashboard = document.getElementById('dashboard');
    const EDGE_SIZE = 8; // px zone for edge detection
    const GRID = 20;
    // Standard size is 2x2 grid units: (2 * 20 * 10) - 24 = 376px
    const MIN_W = 376;
    const MIN_H = 376;
    const MAX_W = 1200;
    const MAX_H = 800;

    let resizing = false;
    let resizeWidget = null;
    let resizeDir = '';
    let startX, startY, startW, startH, startLeft, startTop, aspectRatio;

    // Detect which edge/corner the mouse is near
    function getResizeDir(e, widget) {
        const rect = widget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        const onLeft = x < EDGE_SIZE;
        const onRight = x > w - EDGE_SIZE;
        const onTop = y < EDGE_SIZE;
        const onBottom = y > h - EDGE_SIZE;

        if (onTop && onLeft) return 'nw';
        if (onTop && onRight) return 'ne';
        if (onBottom && onLeft) return 'sw';
        if (onBottom && onRight) return 'se';
        if (onTop) return 'n';
        if (onBottom) return 's';
        if (onLeft) return 'w';
        if (onRight) return 'e';
        return '';
    }

    function getCursorStyle(dir) {
        const cursors = {
            'n': 'ns-resize', 's': 'ns-resize',
            'e': 'ew-resize', 'w': 'ew-resize',
            'nw': 'nwse-resize', 'se': 'nwse-resize',
            'ne': 'nesw-resize', 'sw': 'nesw-resize'
        };
        return cursors[dir] || '';
    }

    // Update cursor when hovering edges
    dashboard.addEventListener('mousemove', (e) => {
        if (resizing) {
            doResize(e);
            return;
        }

        const widget = e.target.closest('.widget');
        if (!widget) {
            document.body.style.cursor = '';
            return;
        }

        // Don't show resize cursor on interactive elements
        if (e.target.closest('input') || e.target.closest('textarea') ||
            e.target.closest('button') || e.target.closest('li') ||
            e.target.closest('.widget-controls')) {
            document.body.style.cursor = '';
            return;
        }

        const dir = getResizeDir(e, widget);
        document.body.style.cursor = getCursorStyle(dir);
    });

    dashboard.addEventListener('mousedown', (e) => {
        const widget = e.target.closest('.widget');
        if (!widget) return;

        // Don't resize from interactive elements
        if (e.target.closest('input') || e.target.closest('textarea') ||
            e.target.closest('button') || e.target.closest('li') || e.target.closest('i') ||
            e.target.closest('.widget-controls')) {
            return;
        }

        const dir = getResizeDir(e, widget);
        if (!dir) return; // Not on an edge, let drag handle it

        e.preventDefault();
        e.stopPropagation(); // Prevent drag from starting

        resizing = true;
        resizeWidget = widget;
        resizeDir = dir;
        startX = e.clientX;
        startY = e.clientY;

        const rect = widget.getBoundingClientRect();
        startW = rect.width;
        startH = rect.height;
        aspectRatio = startW / startH;

        // Get current translate position
        const style = window.getComputedStyle(widget);
        const matrix = new DOMMatrixReadOnly(style.transform);
        startLeft = matrix.m41;
        startTop = matrix.m42;

        widget.classList.add('resizing');
        document.body.style.cursor = getCursorStyle(dir);
    });

    function doResize(e) {
        if (!resizing || !resizeWidget) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newW = startW;
        let newH = startH;
        let newX = startLeft;
        let newY = startTop;

        // Calculate new dimensions based on direction
        if (resizeDir.includes('e')) newW = startW + dx;
        if (resizeDir.includes('w')) { newW = startW - dx; newX = startLeft + dx; }
        if (resizeDir.includes('s')) newH = startH + dy;
        if (resizeDir.includes('n')) { newH = startH - dy; newY = startTop + dy; }

        // Maintain aspect ratio
        if (resizeDir === 'e' || resizeDir === 'w') {
            newH = newW / aspectRatio;
            if (resizeDir === 'w') newY = startTop + (startH - newH);
        } else if (resizeDir === 'n' || resizeDir === 's') {
            newW = newH * aspectRatio;
            if (resizeDir === 'n') newX = startLeft;
        } else {
            // Corner — use the larger delta to drive
            const ratioW = newW / startW;
            const ratioH = newH / startH;
            const scale = Math.max(ratioW, ratioH);
            newW = startW * scale;
            newH = startH * scale;

            if (resizeDir.includes('w')) newX = startLeft + (startW - newW);
            if (resizeDir.includes('n')) newY = startTop + (startH - newH);
        }

        // Enforce limits
        if (newW < MIN_W) { newW = MIN_W; newH = newW / aspectRatio; }
        if (newH < MIN_H) { newH = MIN_H; newW = newH * aspectRatio; }
        if (newW > MAX_W) { newW = MAX_W; newH = newW / aspectRatio; }
        if (newH > MAX_H) { newH = MAX_H; newW = newH * aspectRatio; }

        resizeWidget.style.width = `${newW}px`;
        resizeWidget.style.height = `${newH}px`;
        resizeWidget.style.transform = `translate(${newX}px, ${newY}px)`;
    }

    document.addEventListener('mouseup', (e) => {
        if (!resizing || !resizeWidget) return;

        // Snap to grid (considering gap offset)
        const GAP = 24;

        // Use getBoundingClientRect to get actual pixel width/height (handling 'calc' strings safely)
        const rect = resizeWidget.getBoundingClientRect();

        // Width/Height logic: (Size + Gap) should align to Grid
        let targetGridW = Math.round((rect.width + GAP) / GRID) * GRID;
        let targetGridH = Math.round((rect.height + GAP) / GRID) * GRID;

        let finalW = targetGridW - GAP;
        let finalH = targetGridH - GAP;

        // Position logic: X/Y simply align to Grid
        const style = window.getComputedStyle(resizeWidget);
        const matrix = new DOMMatrixReadOnly(style.transform);
        let finalX = Math.round(matrix.m41 / GRID) * GRID;
        let finalY = Math.round(matrix.m42 / GRID) * GRID;

        if (finalX < 0) finalX = 0;
        if (finalY < 0) finalY = 0;

        if (finalW < MIN_W) finalW = MIN_W;
        if (finalH < MIN_H) finalH = MIN_H;
        if (finalW > MAX_W) finalW = MAX_W;
        if (finalH > MAX_H) finalH = MAX_H;

        resizeWidget.style.width = `${finalW}px`;
        resizeWidget.style.height = `${finalH}px`;
        resizeWidget.style.transform = `translate(${finalX}px, ${finalY}px)`;

        resizeWidget.classList.remove('resizing');

        // Save to store
        // w/h in store are grid columns (1 col space = 200px including gap)
        // Formula: width_px = w * 200 - 24  =>  w = (width_px + 24) / 200
        const id = resizeWidget.getAttribute('data-id');
        store.updateWidget(id, {
            x: finalX,
            y: finalY,
            w: (finalW + GAP) / (GRID * 10),
            h: (finalH + GAP) / (GRID * 10)
        });

        resizing = false;
        resizeWidget = null;
        resizeDir = '';
        document.body.style.cursor = '';
    });
    // ── ResizeObserver for responsive size classes ──
    const SIZE_CLASSES = ['widget-xs', 'widget-sm', 'widget-md', 'widget-lg'];
    const BREAKPOINTS = [
        { max: 200, cls: 'widget-xs' },
        { max: 300, cls: 'widget-sm' },
        { max: 450, cls: 'widget-md' },
        { max: Infinity, cls: 'widget-lg' }
    ];

    const sizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const w = entry.contentRect.width;
            const el = entry.target;
            const newCls = BREAKPOINTS.find(b => w <= b.max).cls;

            // Only update if class changed
            if (!el.classList.contains(newCls)) {
                el.classList.remove(...SIZE_CLASSES);
                el.classList.add(newCls);
            }
        }
    });

    // Observe all existing widgets
    document.querySelectorAll('.widget').forEach(w => sizeObserver.observe(w));

    // Auto-observe new widgets added to dashboard
    const dashMutObs = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('widget')) {
                    sizeObserver.observe(node);
                }
            });
        }
    });
    dashMutObs.observe(dashboard, { childList: true });
}

export { initResize };
