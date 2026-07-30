# Source Type: Website / URL(s)

## Fetching

Use `WebFetch` per page/URL, with a prompt that asks for the full content rather than a summary — WebFetch runs its own summarization pass internally, so be explicit: "return the full content verbatim, including all code examples, tables, and configuration options; do not summarize or omit sections."

For a single doc page, one fetch is enough. For a multi-page docs site (e.g. "wikify the vLLM structured-outputs docs" or "wikify our internal Confluence space"), fetch each page you plan to cover, and check whether the site has a sitemap, table of contents, or nav sidebar you can fetch first to know what pages exist before committing to a decomposition plan — don't decompose based on one page assuming it's representative of the whole site.

## What to preserve

- **Code examples and command-line snippets verbatim.** Docs sites are often consulted for exact syntax — don't paraphrase a config flag or CLI invocation into prose.
- **Version/date context.** Web docs change; note the fetch date in each file's `timestamp` field, and put the source URL in `resource` so a future session can check whether the live page has since diverged.
- **The site's own information architecture as a starting point.** If the site organizes itself into "Getting Started / Concepts / API Reference / Troubleshooting", that's usually a fine starting point for the wiki's own directory names — you're not obligated to invent a better structure than the source already has, though you can improve on it if the site's own organization is poor (e.g. everything crammed onto one long page).

## Handling marketing/fluff content

Web sources often mix substantive technical content with marketing copy, testimonials, or navigation cruft that WebFetch may include. Don't wikify the fluff — extract the technical substance (what the tool does, how to configure it, what the tradeoffs are) and skip boilerplate ("trusted by thousands of companies", cookie notices, etc.).

## Cross-linking to existing bundles

If this web material relates to an existing OKF bundle in the workspace (e.g. wikifying a serving framework's docs when a paper bundle about a related mechanism already exists, add the cross-links in both directions: from the new bundle into the relevant old files, and from the old files into the new bundle. This is what makes a growing collection of OKF bundles actually useful as a knowledge base rather than a pile of disconnected folders.
