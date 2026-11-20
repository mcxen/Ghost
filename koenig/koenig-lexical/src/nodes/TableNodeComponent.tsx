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

    const updateCell = React.useCallback((r, c, text) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (!node) {
                return;
            }
            const next = node.rows.map((row, ri) =>
                ri === r ? row.map((cell, ci) => (ci === c ? {...cell, text} : cell)) : row
            );
            node.rows = next;
        });
        setLocalRows((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? {...cell, text} : cell)) : row)));
    }, [editor, nodeKey]);

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

    const handleCellInput = (event, r, c) => {
        if ('isComposing' in event.nativeEvent && event.nativeEvent.isComposing) {
            return;
        }
        updateCell(r, c, event.currentTarget.textContent ?? '');
    };

    const moveCellFocus = (event, r, c) => {
        if (event.key !== 'Tab') {
            return;
        }

        const cells = Array.from(event.currentTarget.closest('table')?.querySelectorAll('[data-kg-table-cell]') ?? []);
        const current = (r * cols) + c;
        const next = current + (event.shiftKey ? -1 : 1);
        const target = cells[next];
        if (!(target instanceof HTMLElement)) {
            return;
        }

        event.preventDefault();
        target.focus();
    };

    return (
        <div className="kg-table-card-wrapper not-kg-prose" data-kg-allow-clickthrough="true">
            {!isReadOnly && isSelected && (
                <div aria-label="表格操作" className="kg-table-toolbar" contentEditable={false} data-kg-allow-clickthrough="false" role="toolbar" suppressContentEditableWarning>
                    <button aria-label="添加行" title="添加行" type="button" onClick={addRow}>+ 行</button>
                    <button aria-label="添加列" title="添加列" type="button" onClick={addCol}>+ 列</button>
                    <button aria-label="删除末行" disabled={localRows.length <= 1} title="删除末行" type="button" onClick={removeRow}>− 行</button>
                    <button aria-label="删除末列" disabled={cols <= 1} title="删除末列" type="button" onClick={removeCol}>− 列</button>
                </div>
            )}
            <div className="kg-table-scroll">
                <table style={{minWidth: `${Math.max(cols, 1) * 120}px`}}>
                    <tbody>
                        {localRows.map((row, r) => (
                            <tr key={`row-${r}`}>
                                {Array.from({length: cols}).map((_, c) => (
                                    <td
                                        key={`cell-${r}-${c}`}
                                        aria-label={`第 ${r + 1} 行，第 ${c + 1} 列`}
                                        contentEditable={!isReadOnly}
                                        data-kg-allow-clickthrough="true"
                                        data-kg-table-cell
                                        suppressContentEditableWarning
                                        onCompositionEnd={(event) => updateCell(r, c, event.currentTarget.textContent ?? '')}
                                        onInput={(event) => handleCellInput(event, r, c)}
                                        onKeyDown={(event) => moveCellFocus(event, r, c)}
                                    >
                                        {row[c]?.text ?? ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {caption ? <figcaption dangerouslySetInnerHTML={{__html: caption}} /> : null}
        </div>
    );
}
