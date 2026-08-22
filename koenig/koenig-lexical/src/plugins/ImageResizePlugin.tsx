import KoenigComposerContext from '../context/KoenigComposerContext';
import React from 'react';
import {$getRoot} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

const MIN_WIDTH = 80;
const MAX_WIDTH = 4096;
const HANDLE_SELECTOR = '.kg-image-resize-handle';

function normalizeWidth(value: number | null | undefined): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value)));
}

function getImageCards(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-kg-card="image"]'));
}

function getCardImage(card: HTMLElement): HTMLImageElement | null {
    return card.querySelector<HTMLImageElement>('img[src]');
}

function getImageHost(image: HTMLImageElement): HTMLElement | null {
    return image.closest<HTMLElement>('[class~="group/image"]') ?? image.parentElement;
}

function applyImageWidth(image: HTMLImageElement, width: number | null) {
    if (width === null) {
        if (image.dataset.kgImageWidth) {
            image.style.removeProperty('width');
            image.style.removeProperty('max-width');
            image.style.removeProperty('height');
            delete image.dataset.kgImageWidth;
        }
        return;
    }
    image.style.width = `${width}px`;
    image.style.maxWidth = '100%';
    image.style.height = 'auto';
    image.dataset.kgImageWidth = String(width);
}

function positionHandle(image: HTMLImageElement, handle: HTMLButtonElement) {
    handle.style.right = 'auto';
    handle.style.bottom = 'auto';
    handle.style.left = `${image.offsetLeft + image.offsetWidth - 10}px`;
    handle.style.top = `${image.offsetTop + image.offsetHeight - 10}px`;
}

function resizeLimit(card: HTMLElement, image: HTMLImageElement): { width: number; maxWidth: number } {
    const width = image.getBoundingClientRect().width;
    const cardWidth = card.getBoundingClientRect().width;
    return {
        width: Math.max(width, MIN_WIDTH),
        maxWidth: Math.max(width, cardWidth, MIN_WIDTH)
    };
}

function occurrenceOf(root: HTMLElement, image: HTMLImageElement): number {
    const src = image.getAttribute('src') ?? '';
    return getImageCards(root)
        .map(getCardImage)
        .filter((c): c is HTMLImageElement => c !== null)
        .slice(0, getImageCards(root).map(getCardImage).filter((c): c is HTMLImageElement => c !== null).indexOf(image))
        .filter((c) => (c.getAttribute('src') ?? '') === src).length;
}

// Walk top-level Lexical nodes (image cards live at the root level) and read
// displayWidth by src + occurrence order, without importing the node class.
function readDisplayWidth(editor: ReturnType<typeof useLexicalComposerContext>[0], src: string, occurrence: number): number | null {
    let value: number | null = null;
    let seen = 0;
    editor.getEditorState().read(() => {
        for (const node of $getRoot().getChildren()) {
            const type = (node as { getType?: () => string }).getType?.();
            if (type !== 'image') continue;
            const n = node as unknown as { src?: string; displayWidth?: number | null };
            if (n.src !== src) continue;
            if (seen === occurrence) {
                value = n.displayWidth ?? null;
                return;
            }
            seen++;
        }
    });
    return value;
}

function writeDisplayWidth(editor: ReturnType<typeof useLexicalComposerContext>[0], src: string, occurrence: number, width: number | null) {
    editor.update(() => {
        let seen = 0;
        for (const node of $getRoot().getChildren()) {
            const type = (node as { getType?: () => string }).getType?.();
            if (type !== 'image') continue;
            const n = node as unknown as { src?: string; displayWidth?: number | null };
            if (n.src !== src) continue;
            if (seen === occurrence) {
                n.displayWidth = width;
                return;
            }
            seen++;
        }
    });
}

type ResizeSession = {
    handle: HTMLButtonElement;
    image: HTMLImageElement;
    src: string;
    occurrence: number;
    width: number;
    onMove: (event: PointerEvent) => void;
    onFinish: () => void;
};

export function ImageResizePlugin() {
    const [editor] = useLexicalComposerContext();
    const {editorContainerRef, isReadOnly} = React.useContext(KoenigComposerContext);

    React.useEffect(() => {
        const root = editorContainerRef.current;
        if (!root || isReadOnly) return undefined;

        let activeResize: ResizeSession | null = null;
        let syncQueued = false;
        let syncing = false;

        const finishResize = () => {
            if (!activeResize) return;
            const current = activeResize;
            activeResize = null;
            window.removeEventListener('pointermove', current.onMove);
            window.removeEventListener('pointerup', current.onFinish);
            window.removeEventListener('pointercancel', current.onFinish);
            current.handle.classList.remove('is-resizing');
            root.classList.remove('is-image-resizing');
            applyImageWidth(current.image, current.width);
            writeDisplayWidth(editor, current.src, current.occurrence, current.width);
            scheduleSync();
        };

        const startResize = (event: PointerEvent) => {
            if (isReadOnly || activeResize) return;
            const handle = event.currentTarget as HTMLButtonElement;
            const card = handle.closest<HTMLElement>('[data-kg-card="image"]');
            const image = card ? getCardImage(card) : null;
            if (!card || !image) return;
            const src = image.getAttribute('src') ?? '';
            const occurrence = occurrenceOf(root, image);

            event.preventDefault();
            event.stopPropagation();
            const bounds = resizeLimit(card, image);
            const rect = image.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const aspect = rect.height > 0 ? rect.width / rect.height : 1;
            const leftGap = rect.left - cardRect.left;
            const rightGap = cardRect.right - rect.right;
            const horizontalFactor = Math.abs(leftGap - rightGap) < 2 ? 2 : 1;
            const onMove = (moveEvent: PointerEvent) => {
                moveEvent.preventDefault();
                const deltaX = (moveEvent.clientX - event.clientX) * horizontalFactor;
                const deltaY = (moveEvent.clientY - event.clientY) * aspect;
                const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
                const nextWidth = Math.min(bounds.maxWidth, Math.max(MIN_WIDTH, bounds.width + delta));
                const width = normalizeWidth(nextWidth) ?? bounds.width;
                if (activeResize) {
                    activeResize.width = width;
                    applyImageWidth(image, width);
                    positionHandle(image, activeResize.handle);
                }
            };
            const onFinish = () => finishResize();

            activeResize = { handle, image, src, occurrence, width: bounds.width, onMove, onFinish };
            handle.classList.add('is-resizing');
            root.classList.add('is-image-resizing');
            handle.setPointerCapture?.(event.pointerId);
            window.addEventListener('pointermove', onMove, { passive: false });
            window.addEventListener('pointerup', onFinish, { once: true });
            window.addEventListener('pointercancel', onFinish, { once: true });
        };

        const adjustWithKeyboard = (event: KeyboardEvent) => {
            if (isReadOnly) return;
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            const handle = event.currentTarget as HTMLButtonElement;
            const card = handle.closest<HTMLElement>('[data-kg-card="image"]');
            const image = card ? getCardImage(card) : null;
            if (!card || !image) return;
            const src = image.getAttribute('src') ?? '';
            const occurrence = occurrenceOf(root, image);

            event.preventDefault();
            event.stopPropagation();
            const bounds = resizeLimit(card, image);
            const step = event.shiftKey ? 64 : 16;
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const width = normalizeWidth(Math.min(bounds.maxWidth, Math.max(MIN_WIDTH, bounds.width + direction * step)));
            if (width === null) return;
            applyImageWidth(image, width);
            writeDisplayWidth(editor, src, occurrence, width);
            scheduleSync();
        };

        const createHandle = (image: HTMLImageElement): HTMLButtonElement | null => {
            const host = getImageHost(image);
            if (!host) return null;
            host.classList.add('kg-image-resize-host');
            let handle = host.querySelector<HTMLButtonElement>(HANDLE_SELECTOR);
            if (!handle) {
                handle = document.createElement('button');
                handle.type = 'button';
                handle.className = 'kg-image-resize-handle';
                handle.setAttribute('aria-label', '调整图片宽度');
                handle.title = '拖动调整图片宽度';
                handle.addEventListener('pointerdown', startResize);
                handle.addEventListener('keydown', adjustWithKeyboard);
                host.appendChild(handle);
            }
            positionHandle(image, handle);
            return handle;
        };

        const sync = () => {
            if (syncing || activeResize) return;
            syncing = true;
            const cards = getImageCards(root);
            cards.forEach((card, index) => {
                const image = getCardImage(card);
                if (!image) {
                    card.querySelectorAll(HANDLE_SELECTOR).forEach((handle) => handle.remove());
                    return;
                }
                const src = image.getAttribute('src') ?? '';
                const occurrence = cards
                    .slice(0, index)
                    .map(getCardImage)
                    .filter((c): c is HTMLImageElement => c !== null)
                    .filter((c) => (c.getAttribute('src') ?? '') === src).length;
                applyImageWidth(image, readDisplayWidth(editor, src, occurrence));
                const selected = card.getAttribute('data-kg-card-selected') === 'true';
                if (isReadOnly || !selected) {
                    card.querySelectorAll(HANDLE_SELECTOR).forEach((handle) => handle.remove());
                    return;
                }
                createHandle(image);
            });
            syncing = false;
        };

        const scheduleSync = () => {
            if (syncQueued) return;
            syncQueued = true;
            window.requestAnimationFrame(() => {
                syncQueued = false;
                sync();
            });
        };

        const observer = new MutationObserver(() => {
            if (!activeResize) scheduleSync();
        });
        observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-kg-card-selected', 'data-kg-card-width', 'src']
        });
        window.addEventListener('resize', scheduleSync);
        scheduleSync();

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', scheduleSync);
            if (activeResize) {
                const current = activeResize;
                activeResize = null;
                window.removeEventListener('pointermove', current.onMove);
                window.removeEventListener('pointerup', current.onFinish);
                window.removeEventListener('pointercancel', current.onFinish);
            }
            root.querySelectorAll(HANDLE_SELECTOR).forEach((handle) => handle.remove());
            root.querySelectorAll<HTMLElement>('.kg-image-resize-host').forEach((host) => {
                host.classList.remove('kg-image-resize-host');
            });
        };
    }, [editor, editorContainerRef, isReadOnly]);

    return null;
}

export default ImageResizePlugin;
