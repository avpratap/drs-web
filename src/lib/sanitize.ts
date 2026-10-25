import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * CMS bodies are stored as raw HTML (the backend deliberately doesn't sanitize them), so
 * they are cleaned here before rendering: a small allow-list of editorial tags, no scripts,
 * styles, iframes, forms or event handlers; links are http(s)/mailto/tel only and external
 * ones open safely in a new tab; images must be https (or site-relative).
 */
export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "hr",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "details",
      "summary",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    // An image whose src was unsafe (and so removed) is dropped entirely.
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    transformTags: {
      // h1 belongs to the page; demote any in the body.
      h1: "h2",
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" } : attribs,
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", alt: attribs.alt ?? "" },
      }),
    },
  });
}

/** Plain text from CMS HTML (meta descriptions, JSON-LD). */
export function htmlToText(html: string, max = 160): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
