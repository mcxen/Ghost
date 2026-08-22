// Koenig parsers return a DOMConversionMap. Tables are only created via the
// slash menu / API, so we don't import arbitrary <table> elements from pasted
// HTML by default — that would conflict with Lexical's own table handling.
export const parseTableNode = (_Class?: unknown) => null;
