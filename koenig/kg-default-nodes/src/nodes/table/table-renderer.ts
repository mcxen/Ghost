import {addCreateDocumentOption} from '../../utils/add-create-document-option.js';
import {renderEmptyContainer} from '../../utils/render-empty-container.js';
import type {ExportDOMOptions} from '../../export-dom.js';
import type {TableRow} from './TableNode.js';

interface TableNodeData {
    rows: TableRow[];
    caption: string;
}

export function renderTableNode(node: TableNodeData, options: ExportDOMOptions & {[key: string]: unknown} = {}) {
    addCreateDocumentOption(options);
    const document = (options as {createDocument: () => Document}).createDocument();

    if (!node.rows || node.rows.length === 0) {
        return renderEmptyContainer(document);
    }

    const figure = document.createElement('figure');
    figure.setAttribute('class', 'kg-card kg-table-card');

    const table = document.createElement('table');

    const cols = node.rows.reduce((max, row) => Math.max(max, row.length), 0);

    for (const row of node.rows) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const cell = row[c];
            const td = document.createElement('td');
            td.textContent = cell?.text ?? '';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    figure.appendChild(table);

    if (node.caption) {
        const caption = document.createElement('figcaption');
        caption.innerHTML = node.caption;
        figure.appendChild(caption);
    }

    return {element: figure, type: 'outer' as const};
}
