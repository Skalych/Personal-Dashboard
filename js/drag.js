/**
 * Drag.js - Handles drag and drop logic for widgets
 */
import { store } from './store.js';


class DragParams {
    constructor() {
        this.active = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.item = null;
    }
}

function initDragAndDrop() {
    let activeItem = null;
    let initialX, initialY;
    let xOffset = 0, yOffset = 0;

    const dashboard = document.getElementById('dashboard');

    dashboard.addEventListener('mousedown', dragStart);
    dashboard.addEventListener('mouseup', dragEnd);
    dashboard.addEventListener('mousemove', drag);

    function dragStart(e) {
        // Find the closest widget ancestor
        const widget = e.target.closest('.widget');

        // Don't start drag if clicking on controls or interactive elements
        if (!widget || e.target.closest('button') || e.target.closest('input') || e.target.closest('i')
            || e.target.closest('textarea') || e.target.closest('select') || e.target.closest('li')
            || e.target.closest('a') || e.target.closest('label') || e.target.closest('[data-no-drag]')) {
            return;
        }

        activeItem = widget;

        // Get current transform values to calculate offset
        const style = window.getComputedStyle(activeItem);
        const matrix = new DOMMatrixReadOnly(style.transform);

        // We track the offset from the mouse click to the element's top-left corner
        // But since we are using translate for position, we need to map mouse pos to translate values
        // Actually, simpler approach:
        // We know the element's current X/Y (from store or DOM)
        // We save the mouse start position.

        initialX = e.clientX;
        initialY = e.clientY;

        const currentTransform = {
            x: matrix.m41,
            y: matrix.m42
        };

        xOffset = currentTransform.x;
        yOffset = currentTransform.y;

        activeItem.classList.add('dragging');
    }

    function drag(e) {
        if (activeItem) {
            e.preventDefault();

            const currentX = e.clientX - initialX;
            const currentY = e.clientY - initialY;

            const newX = xOffset + currentX;
            const newY = yOffset + currentY;

            setTranslate(newX, newY, activeItem);
        }
    }

    function dragEnd(e) {
        if (!activeItem) return;

        initialX = e.clientX;
        initialY = e.clientY;

        // Snap to grid
        const style = window.getComputedStyle(activeItem);
        const matrix = new DOMMatrixReadOnly(style.transform);
        let finalX = matrix.m41;
        let finalY = matrix.m42;

        const gridSize = 20; // 20px grid
        finalX = Math.round(finalX / gridSize) * gridSize;
        finalY = Math.round(finalY / gridSize) * gridSize;

        // Ensure not negative
        if (finalX < 0) finalX = 0;
        if (finalY < 0) finalY = 0;

        setTranslate(finalX, finalY, activeItem);

        activeItem.classList.remove('dragging');

        // Update store
        const id = activeItem.getAttribute('data-id');
        store.updateWidget(id, { x: finalX, y: finalY });

        activeItem = null;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

export { initDragAndDrop };
