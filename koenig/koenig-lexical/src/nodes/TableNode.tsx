import KoenigCardWrapper from '../components/KoenigCardWrapper';
import {TableNode as BaseTableNode, emptyTableRows} from '@tryghost/kg-default-nodes';
import {TableNodeComponent} from './TableNodeComponent';
import {createCommand} from 'lexical';

// Simple inline SVG icon kept local to avoid touching the asset pipeline.
const TableCardIcon = () => (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="16">
        <rect height="18" rx="2" width="18" x="3" y="3" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
);

export const INSERT_TABLE_COMMAND = createCommand();

export class TableNode extends BaseTableNode {
    static kgMenu = [{
        label: '表格',
        desc: '简单可编辑表格',
        Icon: TableCardIcon,
        insertCommand: INSERT_TABLE_COMMAND,
        insertParams: {rows: 2, cols: 2},
        matches: ['table'],
        priority: 10,
        shortcut: '/table'
    }];

    getIcon() {
        return TableCardIcon;
    }

    decorate() {
        return (
            <KoenigCardWrapper nodeKey={this.getKey()}>
                <TableNodeComponent
                    caption={this.caption}
                    nodeKey={this.getKey()}
                    rows={this.rows}
                />
            </KoenigCardWrapper>
        );
    }
}

export const $createTableNode = (dataset) => {
    if (dataset && !dataset.rows && dataset.cols && dataset.rows !== 0) {
        // support {rows: count, cols: count} shape from insertParams fallback
    }
    return new TableNode(dataset);
};

export function $isTableNode(node) {
    return node instanceof TableNode;
}

export {emptyTableRows};
