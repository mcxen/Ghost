import {LexicalHTMLRenderer} from '@tryghost/kg-lexical-html-renderer';
import type {SerializedEditorState} from 'lexical';
import type {ExportDOMDom} from '@tryghost/kg-default-nodes';
import {
    // base node classes from kg-default-nodes — these carry exportDOM +
    // renderXxxNode (the static HTML renderers) but NO React decorate(),
    // so the renderer chunk stays free of editor components.
    ImageNode,
    CodeBlockNode,
    MarkdownNode,
    AudioNode,
    VideoNode,
    CalloutNode,
    AsideNode,
    HorizontalRuleNode,
    HtmlNode,
    ToggleNode,
    ButtonNode,
    BookmarkNode,
    FileNode,
    HeaderNode,
    PaywallNode,
    ProductNode,
    EmbedNode,
    EmailNode,
    GalleryNode,
    EmailCtaNode,
    SignupNode,
    TableNode,
    TransistorNode,
    CallToActionNode,
    ExtendedTextNode,
    ExtendedHeadingNode,
    ExtendedQuoteNode,
    extendedTextNodeReplacement,
    extendedHeadingNodeReplacement,
    extendedQuoteNodeReplacement,
    AtLinkNode,
    AtLinkSearchNode,
    ZWNJNode,
    TKNode
} from '@tryghost/kg-default-nodes';

export interface KoenigRenderOptions {
    target?: 'html' | 'email' | 'plaintext';
    /** Browser callers should pass {window: {document}} to avoid loading jsdom. */
    dom?: ExportDOMDom;
}

// Node set for static rendering. LexicalHTMLRenderer adds Heading/ListNode/
// ListItem/Quote/Link internally; we add the kg-default-nodes base classes
// (incl. BluePrint TableNode + image displayWidth renderer) and the extended
// text/heading/quote replacements.
const RENDERER_NODES = [
    ExtendedTextNode,
    extendedTextNodeReplacement,
    ExtendedHeadingNode,
    extendedHeadingNodeReplacement,
    ExtendedQuoteNode,
    extendedQuoteNodeReplacement,
    AsideNode,
    CodeBlockNode,
    HorizontalRuleNode,
    ImageNode,
    MarkdownNode,
    AudioNode,
    VideoNode,
    CalloutNode,
    HtmlNode,
    FileNode,
    ButtonNode,
    CallToActionNode,
    ToggleNode,
    HeaderNode,
    BookmarkNode,
    PaywallNode,
    ProductNode,
    EmailNode,
    EmailCtaNode,
    EmbedNode,
    GalleryNode,
    SignupNode,
    TableNode,
    TransistorNode,
    TKNode,
    AtLinkNode,
    AtLinkSearchNode,
    ZWNJNode
];

let renderer: LexicalHTMLRenderer | null = null;

function getRenderer(): LexicalHTMLRenderer {
    if (!renderer) {
        renderer = new LexicalHTMLRenderer({
            nodes: RENDERER_NODES,
            onError: () => {}
        });
    }
    return renderer;
}

/**
 * Render Koenig/Lexical JSON to static HTML the way Ghost's public reading
 * view does. Resolves dynamic-data cards (embed/bookmark). Never throws —
 * returns '' on invalid input so a single bad card can't blank a share page.
 */
export async function renderKoenigHtml(
    content: string | SerializedEditorState | null | undefined,
    options: KoenigRenderOptions = {}
): Promise<string> {
    if (!content) {
        return '';
    }
    if (typeof content === 'string' && !content.trim()) {
        return '';
    }
    const dom: ExportDOMDom = options.dom ?? {window: {document}};
    try {
        return await getRenderer().render(content, {
            target: options.target ?? 'html',
            dom
        });
    } catch {
        return '';
    }
}

export {RENDERER_NODES};
