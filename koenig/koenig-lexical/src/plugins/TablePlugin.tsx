import React from 'react';
import {$createTableNode, TableNode, INSERT_TABLE_COMMAND, emptyTableRows} from '../nodes/TableNode';
import {COMMAND_PRIORITY_LOW} from 'lexical';
import {INSERT_CARD_COMMAND} from './KoenigBehaviourPlugin';
import {mergeRegister} from '@lexical/utils';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

export const TablePlugin = () => {
    const [editor] = useLexicalComposerContext();

    React.useEffect(() => {
        if (!editor.hasNodes([TableNode])) {
            console.error('TablePlugin: TableNode not registered');
            return;
        }
        return mergeRegister(
            editor.registerCommand(
                INSERT_TABLE_COMMAND,
                async (params) => {
                    const rows = params?.rows ?? 2;
                    const cols = params?.cols ?? 2;
                    const cardNode = $createTableNode({rows: emptyTableRows(rows, cols)});
                    editor.dispatchCommand(INSERT_CARD_COMMAND, {cardNode, openInEditMode: true});
                    return true;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    });

    return null;
};

export default TablePlugin;
