# Keyboard cheatsheet

> The shortcuts that buy you the most time.

---

## Command-line editing

| Keys | What |
|---|---|
| `Tab` | Autocomplete; **double-Tab** to see candidates |
| `Ctrl+R` | Reverse-search history (press again to cycle) |
| `Ctrl+A` / `Ctrl+E` | Beginning / end of line |
| `Ctrl+U` / `Ctrl+K` | Kill before / after cursor |
| `Ctrl+W` | Kill the word before cursor |
| `Ctrl+Y` | Paste (yank) what you killed |
| `Alt+F` / `Alt+B` | Forward / back one word |
| `Ctrl+L` | Clear screen |
| `Ctrl+C` | Cancel current line |
| `Ctrl+D` | EOF / logout when line is empty |
| `Ctrl+Z` | Suspend foreground process; resume with `fg` |
| `Up` / `Down` | Walk history |
| `!!` | Re-run previous command |
| `!N` | Re-run history entry N |
| `^old^new` | Re-run previous with `old` → `new` substitution |

## less / man (pagers)

| Keys | What |
|---|---|
| `Space` / `f` | Page down |
| `b` | Page up |
| `g` / `G` | Top / bottom |
| `/pattern` | Search forward — `n` next, `N` previous |
| `?pattern` | Search backward |
| `&pattern` | Show only matching lines |
| `q` | Quit |
| `F` | Live-tail mode (`Ctrl+C` exits live mode) |

## vi/vim

See [`cheatsheet-vi.md`](cheatsheet-vi.md).

## tmux (terminal multiplexer)

| Keys | What |
|---|---|
| `tmux new -s NAME` | Start named session |
| `tmux attach -t NAME` | Re-attach |
| `tmux ls` | List sessions |
| `Ctrl+b d` | Detach (session keeps running) |
| `Ctrl+b c` | New window |
| `Ctrl+b n` / `Ctrl+b p` | Next / previous window |
| `Ctrl+b "` / `Ctrl+b %` | Split horizontal / vertical pane |
| `Ctrl+b o` | Cycle panes |
| `Ctrl+b z` | Zoom current pane to full size |
| `Ctrl+b [` | Copy/scroll mode (then `q` to exit) |
| `Ctrl+b ?` | Help — all key bindings |

## SSH at the prompt

| Keys | What |
|---|---|
| `~.` | Force-close a stuck SSH session (must follow a newline) |
| `~Ctrl+Z` | Suspend SSH and drop to local shell; `fg` returns |
| `~?` | Show SSH escape help |

---

[← back to home](../README.md)
