# vi / vim cheatsheet

> Print this. Tape it next to your monitor.

---

## Modes

| From | To | Press |
|---|---|---|
| Normal | Insert | `i` (before), `a` (after), `I` (line start), `A` (line end), `o` (open below), `O` (open above) |
| Any | Normal | `Esc` |
| Normal | Command-line | `:` |
| Normal | Visual char / line / block | `v` / `V` / `Ctrl+v` |

## Survival kit

| Action | Press |
|---|---|
| Save | `:w` |
| Quit | `:q` |
| Save + quit | `:wq` or `ZZ` |
| Quit, discard | `:q!` |
| Undo / redo | `u` / `Ctrl+R` |
| Repeat last edit | `.` |

## Motion (Normal mode)

| Move | Key |
|---|---|
| Left/down/up/right | `h` `j` `k` `l` |
| Word forward / back | `w` / `b` |
| Word end | `e` |
| Beginning of line | `0` (col 0), `^` (first non-blank) |
| End of line | `$` |
| Top / bottom of file | `gg` / `G` |
| Line N | `:N` (or `Ngg`) |
| Page down / up | `Ctrl+f` / `Ctrl+b` |
| Half-page | `Ctrl+d` / `Ctrl+u` |
| Match bracket / paren | `%` |
| Find char on line | `f<char>`, `;` next, `,` previous |
| Find word under cursor | `*` (forward), `#` (backward) |

## Editing (Normal mode)

| Action | Keys |
|---|---|
| Delete char | `x` |
| Delete line | `dd` |
| Delete N lines | `Ndd` |
| Delete to end of line | `d$` or `D` |
| Delete word | `dw` |
| Yank (copy) line | `yy` |
| Yank N lines | `Nyy` |
| Yank word | `yw` |
| Paste | `p` (after), `P` (before) |
| Change line | `cc` |
| Change word | `cw` |
| Replace one char | `r<char>` |
| Join lines | `J` |
| Indent / dedent line | `>>` / `<<` |
| Toggle case | `~` |

## The grammar

`[count][operator][motion]` — most edit commands fit this pattern.

- `5dd` — delete 5 lines
- `d3w` — delete 3 words
- `y$` — yank to end of line
- `c2j` — change 2 lines downward

Operators: `d` delete, `y` yank, `c` change, `>` indent, `<` dedent, `=` reformat.

## Search & replace

| Command | Effect |
|---|---|
| `/pattern` | Search forward — `n` next, `N` prev |
| `?pattern` | Search backward |
| `:%s/old/new/g` | Replace all in file |
| `:%s/old/new/gc` | All in file, confirm each |
| `:5,20s/old/new/g` | In lines 5–20 |
| `:noh` | Clear highlight |

## Visual mode

Press `v`, `V`, or `Ctrl+v` for char / line / block visual. Then:

- `d` — delete
- `y` — yank
- `>` / `<` — indent / dedent
- `c` — change
- `=` — auto-format

## Files / windows

| Command | Effect |
|---|---|
| `:e file` | Open another file |
| `:w newname` | Save as |
| `:sp` / `:vsp` | Split horizontal / vertical |
| `Ctrl+w h/j/k/l` | Move between splits |
| `Ctrl+w c` | Close split |
| `:tabnew file` | Open in new tab |
| `gt` / `gT` | Next / previous tab |

## Useful `:set`

| Command | Effect |
|---|---|
| `:set number` | Line numbers |
| `:set nonumber` | Off |
| `:set hlsearch` / `:set nohlsearch` | Highlight searches on/off |
| `:set ignorecase` | Case-insensitive search |
| `:set paste` / `:set nopaste` | Disable auto-indent for paste |
| `:set list` | Show whitespace |
| `:syntax on` / `:syntax off` | Syntax highlighting |

## Useful ex commands

| Command | Effect |
|---|---|
| `:!cmd` | Run a shell command |
| `:r file` | Insert file contents |
| `:r !cmd` | Insert command output |
| `:earlier 10m` / `:later 10m` | Time-travel through undo history |

## Minimal `~/.vimrc`

```vim
syntax on
set number
set hlsearch
set incsearch
set ignorecase smartcase
set autoindent
set expandtab
set shiftwidth=4
set tabstop=4
set ruler
set showcmd
set wildmenu
```

---

[← back to home](../README.md)
