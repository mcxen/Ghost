// Table rows and columns are positional — their identity IS their (row, col)
// index, so index keys are the correct choice here. Disable the rule for the
// whole file; reordering is not a concern for grid cells.
/* eslint-disable react/no-array-index-key */
import CardContext from '../context/CardContext';
import KoenigComposerContext from '../context/KoenigComposerContext';
import React from 'react';
import {$getNodeByKey} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

export function TableNodeComponent({nodeKey, rows, caption}) {
    const [editor] = useLexicalComposerContext();
    const {isSelected} = React.useContext(CardContext);
    const {isReadOnly} = React.useContext(KoenigComposerContext);

    // rows is the node's array; we render it directly and write back on input.
    // We keep a local React state copy keyed by content to make contentEditable
    // inputs re-render when the node changes externally (e.g. undo/redo).
    const [localRows, setLocalRows] = React.useState(rows);

    React.useEffect(() => {
        setLocalRows(rows);
    }, [rows]);

    const updateCell = (r, c, text) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            const next = node.rows.map((row, ri) =>
                ri === r ? row.map((cell, ci) => (ci === c ? {...cell, text} : cell)) : row
            );
            node.rows = next;
        });
        setLocalRows((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? {...cell, text} : cell)) : row)));
    };

    const addRow = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            const cols = node.rows[0]?.length ?? 2;
            node.rows = [...node.rows, Array.from({length: cols}, () => ({text: ''}))];
        });
    };
    const addCol = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            node.rows = node.rows.map((row) => [...row, {text: ''}]);
        });
    };
    const removeRow = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node.rows.length > 1) node.rows = node.rows.slice(0, -1);
        });
    };
    const removeCol = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ((node.rows[0]?.length ?? 0) > 1) {
                node.rows = node.rows.map((row) => row.slice(0, -1));
            }
        });
    };

    const cols = localRows.reduce((max, row) => Math.max(max, row.length), 0);

    return (
        <div className="kg-table-card-wrapper not-kg-prose">
            {!isReadOnly && isSelected && (
                <div className="kg-table-toolbar" contentEditable={false} suppressContentEditableWarning>
                    <button type="button" onClick={addRow}>+ 行</button>
                    <button type="button" onClick={addCol}>+ 列</button>
                    <button type="button" onClick={removeRow}>− 行</button>
                    <button type="button" onClick={removeCol}>− 列</button>
                </div>
            )}
            <table>
                <tbody>
                    {localRows.map((row, r) => (
                        <tr key={`row-${r}`}>
                            {Array.from({length: cols}).map((_, c) => (
                                <td
                                    key={`cell-${r}-${c}`}
                                    contentEditable={!isReadOnly}
                                    suppressContentEditableWarning
                                    onBlur={(e) => updateCell(r, c, e.currentTarget.textContent ?? '')}
                                >
                                    {row[c]?.text ?? ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {caption ? <figcaption dangerouslySetInnerHTML={{__html: caption}} /> : null}
        </div>
    );
}
