import {generateDecoratorNode, type DecoratorNodeData, type DecoratorNodePropertyMap} from '../../generate-decorator-node.js';
import {parseTableNode} from './table-parser.js';
import {renderTableNode} from './table-renderer.js';

export interface TableCell {
    text: string;
}

export type TableRow = TableCell[];

const tableProperties = {
    rows: {default: [] as TableRow[]},
    caption: {default: '', wordCount: true}
} satisfies DecoratorNodePropertyMap;

export type TableData = DecoratorNodeData<typeof tableProperties>;

export class TableNode extends generateDecoratorNode({
    nodeType: 'table',
    properties: tableProperties,
    defaultRenderFn: renderTableNode
}) {
    /* @override */
    static importDOM() {
        return parseTableNode(this);
    }

    hasEditMode() {
        return true;
    }

    // keep rows/caption out of the editor's text content to avoid double
    // counting; caption wordCount already feeds the count via its property
    getTextContent() {
        return this.rows
            .map((row: TableRow) => row.map((cell: TableCell) => cell.text).join(' '))
            .join('\n');
    }
}

export const $createTableNode = (dataset?: TableData) => new TableNode(dataset);

export function $isTableNode(node: unknown): node is TableNode {
    return node instanceof TableNode;
}

// helper used by the koenig-lexical layer to build empty rows on insert
export function emptyTableRows(rows: number, cols: number): TableRow[] {
    return Array.from({length: rows}, () => Array.from({length: cols}, () => ({text: ''})));
}
