# I built a markdown previewer to 10x AI coding experience

Okay so hear me out.

You're in the zone. Claude just wrote you a beautiful `PLAN.md` — 200 lines of structured thinking, headers, tables, a Mermaid diagram. You open it in the terminal and see… this:

```
## Phase 1
- **Setup** — blah blah
| Step | Status |
|------|--------|
| Init | done |
```

Raw. Ugly. Completely unreadable. So you open a browser tab, paste it into some online previewer, and by the time you're back — the vibe is gone. Your flow is dead.

I got tired of this. So I built something.

---

## Meet mdwow

```bash
npx mdwow-cli README.md
```

It's a live Markdown viewer for your terminal. Beautiful colors, syntax-highlighted code blocks, rendered tables, even Mermaid diagrams as ASCII art. And the best part? **It auto-updates the second the file changes on disk.**

So when Claude is writing that plan in real time, you're watching it render in real time. In a terminal split. Without ever leaving your keyboard.

![mdwow demo](https://raw.githubusercontent.com/tianhaoz95/mdwow/main/asset/demo.gif)

Yeah, it looks like that. In your terminal. I'm pretty happy with it.

---

## Why this actually matters for AI coding

Here's the thing about AI assistants — they *love* Markdown. Every plan, every README update, every `CHANGELOG`, every `CLAUDE.md` context file. It's all Markdown.

And if you can't read it comfortably without leaving the terminal, you're context-switching dozens of times a day. That's the kind of death-by-a-thousand-cuts that quietly kills your productivity.

With mdwow open in a split, the workflow becomes:

1. Ask Claude to write/update a doc
2. Watch it render live on the other side of your screen
3. Never open a browser tab for this again

It's a small thing. But small things compound.

---

## The fun stuff it can do

Beyond just rendering text, mdwow has a few tricks:

- **Press `b`** — a table of contents sidebar slides in. Jump to any heading instantly.
- **Mermaid diagrams** — those `flowchart` and `sequenceDiagram` blocks? Rendered inline as ASCII art. It's delightful.
- **Vim keys** — `j`/`k` to scroll, `g`/`G` for top/bottom, `u`/`d` for pages. Your fingers never leave home row.
- **Click links** — hover a link and its URL pins to the status bar. Cmd+click to open. Works great for AI-generated docs with references.
- **Light/dark theme** — press `t` to toggle. Yes, there's a light mode. No, I won't judge you.

---

## Zero setup. Seriously.

No config file. No `.mdwowrc`. No `mdwow.config.js`. Just:

```bash
npx mdwow-cli any-file.md
```

If you want it permanently:

```bash
npm install -g mdwow-cli
mdwow any-file.md
```

That's the whole install guide.

---

## Go try it

The project is open source: [github.com/tianhaoz95/mdwow](https://github.com/tianhaoz95/mdwow)

If you use AI coding tools daily and live in the terminal, I think you'll like this. Give it a star if it sparks joy, and if it saves you enough time to buy a coffee — consider [sponsoring](https://github.com/sponsors/tianhaoz95) so I can keep building. ♥

Now go close that browser tab you were using to preview Markdown.
