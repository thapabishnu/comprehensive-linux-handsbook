# 06 — The vi / vim editor


---

## 1. Why this matters

Every Linux system has `vi`. Not "almost every." **Every.** You will SSH into a stripped-down container or a rescue boot environment where `nano` doesn't exist, and `vi` will be your only editor. Even when you have nicer options, `vi`'s modal editing model is so efficient that millions of professionals keep using it as their daily driver. Five minutes of learning gets you "I can save and quit." Two hours gets you faster than any GUI editor.

---

## 2. Mental model

`vi` is **modal**. Every keypress means different things depending on which mode you're in:

```
                ┌──────────────┐
       Esc      │   NORMAL     │  i / a / o / I / A / O      
   ┌──────────► │  (default)   ├────────────────────────────┐
   │            │ — moves &    │                            │
   │            │   commands   │                            ▼
   │            └──────┬───────┘                    ┌──────────────┐
   │                   │                            │   INSERT     │
   │                   │ :                          │  (typing)    │
   │                   ▼                            └──────────────┘
   │            ┌──────────────┐
   │            │  COMMAND-LINE│      Enter
   │            │      :       │
   └──────────  │ (save, quit, │
                │  search)     │
                └──────────────┘
```

- **Normal mode** (default) — keys are commands. `j` moves down, `dd` deletes a line, `x` deletes a character. You spend most of your time here.
- **Insert mode** — keys insert text. Pressed `i` to enter, `Esc` to leave.
- **Command-line mode** — `:` followed by an ex command. `:w` save, `:q` quit, `:s/foo/bar/g` substitute.

The reason vi feels alien is that you're not "typing into a document." You're issuing commands to a tiny programming language *whose only data is the buffer*.

---

## 3. The survival kit

If you remember nothing else, remember these:

| To do this | Press |
|---|---|
| Open a file | `vi filename` |
| Enter insert mode (start typing) | `i` |
| Leave insert mode | `Esc` |
| Save | `:w` then Enter |
| Quit | `:q` then Enter |
| Save & quit | `:wq` then Enter |
| Quit *without saving* | `:q!` then Enter |
| Undo | `u` |
| Redo | `Ctrl+R` |

That's enough to never be stranded.

---

## 4. Core commands by category

### Movement (Normal mode)

| Keys | Move |
|---|---|
| `h` `j` `k` `l` | Left, down, up, right (use these — arrows work too but break the flow) |
| `w` / `b` | Forward / back one word |
| `0` / `^` | Beginning of line (`0` = column 0; `^` = first non-blank) |
| `$` | End of line |
| `gg` / `G` | Top / bottom of file |
| `:N` | Jump to line N (e.g. `:42` → line 42) |
| `Ctrl+f` / `Ctrl+b` | Page down / up |
| `%` | Jump to matching bracket/paren |
| `*` | Search forward for word under cursor |

### Editing (Normal mode)

| Keys | Effect |
|---|---|
| `i` / `a` | Insert before / after cursor |
| `I` / `A` | Insert at beginning / end of line |
| `o` / `O` | Open new line below / above |
| `x` | Delete character under cursor |
| `dd` | Delete current line (and yank it to register) |
| `dw` | Delete from cursor to end of word |
| `d$` | Delete to end of line |
| `D` | Same as `d$` |
| `yy` | Yank (copy) current line |
| `yw` | Yank word |
| `p` / `P` | Paste after / before cursor |
| `r<char>` | Replace one character |
| `R` | Enter replace (overstrike) mode |
| `cw` | Change word (delete + enter insert) |
| `cc` | Change whole line |
| `u` / `Ctrl+R` | Undo / redo |
| `.` | **Repeat last edit** — incredibly powerful |

### Search & replace (Command-line mode)

| Command | Effect |
|---|---|
| `/foo` | Search forward for `foo`. `n` next, `N` previous. |
| `?foo` | Search backward. |
| `:%s/foo/bar/g` | Replace every `foo` with `bar` in the whole file. |
| `:%s/foo/bar/gc` | Same, but **confirm** each replacement. |
| `:5,20s/foo/bar/g` | Only between lines 5 and 20. |
| `:noh` | Clear search highlight. |

### File / window commands

| Command | Effect |
|---|---|
| `:w` | Write (save). |
| `:w newname` | Save *as*. |
| `:q` | Quit. Errors if buffer is modified. |
| `:q!` | Quit, discard changes. |
| `:wq` or `ZZ` | Write and quit. |
| `:e other.txt` | Open another file in this window. |
| `:sp` / `:vsp` | Split horizontally / vertically. |
| `Ctrl+W h/j/k/l` | Move between splits. |

### The grammar (this is where vi gets fast)

Most edit commands follow `[count] operator motion`:

- `5dd` — delete 5 lines.
- `d3w` — delete 3 words.
- `y$` — yank to end of line.
- `2cc` — change 2 lines.

Memorize the **operators** (`d` delete, `y` yank, `c` change) and the **motions** (`w` word, `$` EOL, `gg` top), and you can compose dozens of commands.

---

## 5. Guided walkthrough

Open a scratch file:

```sh
vi ~/vi-practice.txt
```

You're in Normal mode. Type these in order — watch what happens:

```
i                   ← enter insert mode
The quick brown fox
jumps over the lazy dog
[Esc]               ← back to Normal
gg                  ← top of file
yy                  ← yank (copy) the first line
p                   ← paste below — now there are 3 lines
:                   ← command-line mode
%s/fox/cat/g        ← every "fox" becomes "cat"
[Enter]
u                   ← undo (cat → fox)
Ctrl+R              ← redo
:w                  ← save
:q                  ← quit
```

You just edited a file using nothing but `vi`. That's the survival kit *plus* a substitution, an undo, and a yank-paste.

### A more practical drill

Edit `/etc/hosts` (read-only first — we'll undo any change):

```sh
sudo vi /etc/hosts
```

Inside:

- `gg` — top of file
- `/127` — find the first `127.`
- `n` — next match
- `:q!` — quit without saving (no harm done)

---

## 6. Gotchas

- **Caps-Lock is your enemy.** `J` joins lines; `K` opens the man page. Many of vi's "weird" behaviors are you accidentally in caps.
- **Esc returns to Normal.** When in doubt, press it. Twice if you're really lost.
- **`:q` refuses to quit when you've made changes.** Use `:q!` to discard, or `:wq` to save first.
- **`Ctrl+S` freezes your terminal.** XOFF. Press `Ctrl+Q` to unfreeze. (Old TTY thing — vi inherited it.)
- **You're in `vi`, but you wanted `vim`.** `vi` on minimal systems is the original BSD `vi` (no syntax highlight, no Ctrl+R redo). On most Linux, `vi` is symlinked to `vim` — but not always. `vim --version` will confirm.
- **`.` repeats *the last edit*, not the last *motion*.** So after `dw`, pressing `.` deletes another word. After `j`, pressing `.` repeats whatever edit you did *before* the `j`.
- **`:set paste` before pasting from the clipboard.** Otherwise vim's auto-indent rewrites your text into a mess. `:set nopaste` to turn off.

> **Mentor note:** the day `.` clicks for you is the day vi becomes *fun*. "Make the change once, navigate, press `.` to repeat" is the editing pattern that makes vim genuinely fast.

---

## 7. On-the-spot exercises

**E6.1** — Open `~/vi-practice.txt` (create it if needed), type three lines of text, save, and quit.

<details><summary>Show answer</summary>

```
vi ~/vi-practice.txt        ← opens
i                           ← insert mode
line one
line two
line three
[Esc]
:wq                         ← write + quit
```
</details>

**E6.2** — Re-open the file. Move to line 2. Delete it. Save.

<details><summary>Show answer</summary>

```
vi ~/vi-practice.txt
:2          ← jump to line 2
dd          ← delete the line
:w          ← save (or :wq to save + quit)
```
</details>

**E6.3** — In the same file, replace every occurrence of "line" with "row".

<details><summary>Show answer</summary>

```
:%s/line/row/g
```

`%` = "all lines in the file." `g` = "every occurrence on each line" (without `g`, only the first per line).
</details>

**E6.4** — Undo the substitution.

<details><summary>Show answer</summary>

```
u
```

`u` undoes the last change. Press `Ctrl+R` to redo.
</details>

**E6.5** — Yank the first line, paste it three times at the end of the file.

<details><summary>Show answer</summary>

```
gg          ← top
yy          ← yank line 1
G           ← bottom
p           ← paste below current line
p
p
```
</details>

**E6.6** — Search for "row" and jump through every match. Quit without saving.

<details><summary>Show answer</summary>

```
/row[Enter]
n           ← next match
n           ← next
:q!         ← quit, discard
```
</details>

**E6.7** — Open `/etc/hosts` in read-only mode (don't risk editing it).

<details><summary>Show answer</summary>

```
view /etc/hosts       ← read-only mode of vi
```

Equivalent to `vi -R /etc/hosts`. The `:q` works as normal; the file is marked read-only so accidental edits won't save.
</details>

**E6.8** — In `~/vi-practice.txt`, indent every line by 4 spaces. (Hint: visual mode `V` + `>` operator + count.)

<details><summary>Show answer</summary>

Several routes. Simplest with visual line mode:

```
gg          ← top
V           ← visual line mode
G           ← extend to bottom — now all lines highlighted
>           ← shift right (indent) one shiftwidth
:set shiftwidth=4   ← if not already 4
```

Or with `:%`:

```
:%s/^/    /
```

(That's a `:%s` substitution replacing the start of every line with four spaces.)
</details>

---

## 8. Real-world sysadmin scenario

**Production push goes wrong.** A coworker SSHs you screen-share: *"Can you change the timeout in this nginx config?"* You have one `vi` window, a flaky connection, and no time to learn.

You do this:

```
vi /etc/nginx/conf.d/api.conf      ← open
/proxy_read_timeout                ← search for the line
n                                  ← skip to the right occurrence
$                                  ← end of line
cw                                 ← change word (the value)
60s[Esc]                           ← type new value, leave insert
:w                                 ← save
:q                                 ← quit
```

Then back in shell:

```sh
sudo nginx -t          # validate syntax
sudo systemctl reload nginx
```

If syntax check fails, you go right back to vi: `vi /etc/nginx/conf.d/api.conf`, fix the typo, save, validate, reload. **The whole loop runs entirely in your terminal.** No mouse. No window switching.

This is the loop you'll run hundreds of times in your career. Make `vi` cheap.

---

## 9. What to remember

- Vi is **modal**. Normal = commands, Insert = typing, Command-line = `:` operations.
- Survival kit: `i`, `Esc`, `:w`, `:q`, `:wq`, `:q!`, `u`, `Ctrl+R`.
- Editing grammar: `[count] operator motion` (`5dd`, `d3w`, `y$`).
- `.` repeats the last edit — the secret weapon.
- `view` opens read-only. Use it when you only mean to look.
- For substitutions: `:%s/old/new/g` over the whole file; `c` flag to confirm.

A printable companion: see [`reference/cheatsheet-vi.md`](reference/cheatsheet-vi.md).

---

## 10. Next

You can edit. Now let's understand who's allowed to read, write, or run those files.

➡ [`07-permissions.md`](07-permissions.md) — `rwx`, octal, ownership, and the bits that quietly run the system.
