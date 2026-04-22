# I built a markdown previewer to 10x AI coding experience

AI coding assistants like Claude and Cursor generate a *lot* of Markdown — READMEs, plans, documentation, changelogs. And every time, I'd either squint at raw syntax in the terminal or context-switch to a browser to preview it. That friction adds up fast.

So I built **mdwow**: a live Markdown viewer that runs entirely in your terminal.

---

## The problem

When you're deep in an AI-assisted coding session, leaving the terminal breaks your flow. But reading raw Markdown like this:

```
## Features
- **Live file watching** — edit your Markdown...
### Installation
| Key | Action |
|-----|--------|
```

…is slow and error-prone. You miss structure, miss formatting, miss the point.

---

## The solution

```bash
npx mdwow-cli README.md
```

That's it. mdwow opens any `.md` file as a fully rendered, colorful TUI — right in your terminal. And it **auto-updates the moment the file changes on disk**.

So when Claude writes a `PLAN.md` or updates a `README`, you see the rendered output in real time, without ever leaving your editor or switching tabs.

![mdwow demo](https://raw.githubusercontent.com/tianhaoz95/mdwow/main/asset/demo.gif)

---

## What it does

- **Live reload** — file watcher updates the view instantly as AI rewrites the file
- **Syntax highlighting** — code blocks highlighted for 200+ languages
- **Mermaid diagrams** — architecture diagrams rendered as ASCII art inline
- **Table of contents** — press `b` for a sidebar TOC, jump to any heading
- **Vim-style navigation** — `j`/`k`, `g`/`G`, `u`/`d` — never touch the mouse
- **Full GFM** — tables, task lists, strikethrough, nested blockquotes, all of it
- **Zero config** — no setup, no config file, works instantly

---

## Why it matters for AI coding

AI tools generate structured documents constantly. A `CLAUDE.md` with project context. A multi-step implementation plan. A changelog after a refactor. With mdwow, you can glance at the rendered output in a terminal split without breaking your flow — and since it live-reloads, you watch the document take shape as the AI writes it.

It turns Markdown from a chore to read into a first-class part of your terminal workspace.

---

## Try it

```bash
npx mdwow-cli README.md
```

Or install globally:

```bash
npm install -g mdwow-cli
mdwow README.md
```

The source is on GitHub: [github.com/tianhaoz95/mdwow](https://github.com/tianhaoz95/mdwow)

If it saves you time, consider [sponsoring the project](https://github.com/sponsors/tianhaoz95). ♥
