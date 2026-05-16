# The Mentor's Guide to Linux

> A learn-by-doing companion to SUNY Polytechnic Institute's NCS 205 (Introduction to Linux, Spring 2026).
> The labs ask you to *prove* you know Linux. **This guide teaches you Linux.**

---

## What is this

22 modules + 3 cheatsheets, each authored as Markdown (for browsing here on GitHub) and rendered to a polished standalone HTML page (open `index.html` in any browser — no build step). Each module covers:

1. **Why this matters** — real-world framing
2. **Mental model** — how to think about it
3. **Core commands & syntax** — the toolbox
4. **Guided walkthrough** — type along
5. **Gotchas** — traps to avoid
6. **On-the-spot exercises** — with collapsible answers
7. **Real-world sysadmin scenario** — incident-style case
8. **What to remember** — one-screen recap
9. **Next** — pointer to the next module

---

## How to use

### On GitHub (read mode)

Click any module file below. GitHub renders the Markdown nicely, including the `<details>` exercise answers (click to expand).

### As a local site (interactive mode)

Open `index.html` in a browser. You get a sidebar, the right-rail "on this page" TOC, copy-to-clipboard buttons on every code block, light/dark theme toggle, and full keyboard navigation.

```sh
# clone and open
git clone <repo-url> mentors-guide
cd mentors-guide
xdg-open index.html       # Linux
open index.html           # macOS
start index.html          # Windows
```

No server, no build. Open from `file://` and everything works.

### As your sandbox

`reference/setup-sample-data.sh` creates the practice files (`~/ncs205-sandbox/`) every drill references. Run it once on whatever Linux box you'll practice on.

```sh
bash reference/setup-sample-data.sh
```

---

## The learning path

### Foundations
Build a working environment, navigate a Unix system, and read your shell prompt without flinching.

| # | Module | Lab(s) |
|---|---|---|
| 00 | [Orientation & setup](00-orientation.md) | — |
| 01 | [Shell access & SSH](01-shell-and-ssh.md) | 1, 2, 64 |
| 02 | [Filesystem navigation](02-filesystem-navigation.md) | 2, 5 |
| 03 | [Listing & file operations](03-listing-and-files.md) | 5–9 |
| 04 | [File globbing](04-file-globbing.md) | 10 |
| 05 | [Viewing text files](05-viewing-text.md) | 11–13 |
| 06 | [The vi/vim editor](06-vi-editor.md) | 14–15 |
| 07 | [Permissions](07-permissions.md) | 16–18 |
| 08 | [Redirection & pipes](08-redirection-pipes.md) | 19 |

### Text & search
The Unix philosophy in action — small tools, pipelines, text as the universal interface.

| # | Module | Lab(s) |
|---|---|---|
| 09 | [grep & regular expressions](09-grep-and-regex.md) | 20–22 |
| 10 | [find & xargs](10-find-and-xargs.md) | 23 |
| 11 | [Processes & jobs](11-processes-and-jobs.md) | 24–26 |
| 12 | [Text-processing toolbox](12-text-toolbox.md) | 31–32 |
| 13 | [sed & awk](13-sed-and-awk.md) | 33–35 |

### Sysadmin
Real work. Real boxes. Things that page you at 3 AM.

| # | Module | Lab(s) |
|---|---|---|
| 14 | [Shell scripting](14-shell-scripting.md) | 51–55 |
| 15 | [Environment & startup](15-env-and-startup.md) | 56 |
| 16 | [Users & admin](16-users-and-admin.md) | 57–58 |
| 17 | [Services & systemd](17-services-systemd.md) | 59–60 |
| 18 | [Networking basics](18-networking.md) | 61 |
| 19 | [SSH keys & 2FA](19-ssh-keys-and-2fa.md) | 62–64 |
| 20 | [git for sysadmins](20-git-basics.md) | 36 |
| 21 | [cron & scheduling](21-cron-and-scheduling.md) | A1 |
| 22 | [Logs & troubleshooting](22-logs-and-troubleshooting.md) | B1–C1 |

### Reference

- [Keyboard shortcuts](reference/cheatsheet-shortcuts.md)
- [vi / vim](reference/cheatsheet-vi.md)
- [Regex](reference/cheatsheet-regex.md)
- [Sample-data setup script](reference/setup-sample-data.sh)

---

## File layout

```
.
├── README.md                       ← you are here
├── index.html                      ← landing page for the rendered site
├── 00-orientation.md / .html       ← module 00, Markdown source + HTML render
├── 01-shell-and-ssh.md / .html     ← ...
├── ... (modules 02–22)
├── reference/
│   ├── cheatsheet-shortcuts.md / .html
│   ├── cheatsheet-vi.md / .html
│   ├── cheatsheet-regex.md / .html
│   └── setup-sample-data.sh
└── assets/
    ├── styles.css                  ← shared design
    └── site.js                     ← sidebar nav, copy buttons, scrollspy, theme
```

**Every module is committed twice:** `module.md` (source-of-truth, edits here propagate everywhere) and `module.html` (the polished, browser-ready render with the design template).

---

## Philosophy

There is no shortcut to being good at Linux. There is only **type, read, think, repeat**. This guide makes the path as efficient as I can — but the keyboard part is on you. If a command doesn't make sense, run it. If it still doesn't make sense, **break it on purpose** and see what happens. Linux is one of the few systems where you learn fastest by deliberately messing things up in a safe sandbox.

---

## Acknowledgements

Built around the lab worksheets of NCS 205 (SUNY Polytechnic Institute, Spring 2026). The course material itself remains the property of SUNY Poly and its instructors; this companion fills a teaching gap they left open by design.

Set in **Fraunces** (display), **Newsreader** (body), and **JetBrains Mono** (code).

---

[**Start here → Module 00**](00-orientation.md)
