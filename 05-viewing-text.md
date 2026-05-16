# 05 — Viewing text files

> *Maps to:* NCS 205 Labs 11–13.

---

## 1. Why this matters

Most files a sysadmin reads are text — configs, logs, scripts, data dumps. Picking the wrong viewer is annoying for small files and catastrophic for big ones. `cat`ting a 4 GB log onto your screen will lock your terminal. `less` would handle the same file in under a second. Choosing the right tool is the whole skill.

---

## 2. Mental model

Three questions decide which tool you reach for:

1. **How big is the file?** Tiny (< 1 page) → `cat`. Anything bigger → `less`.
2. **Do I want a fixed slice?** Start of file → `head`. End of file → `tail`. New lines as they arrive → `tail -f`.
3. **Am I building a pipeline?** Use `cat` only when you literally need to concatenate. Otherwise let tools open files themselves: `grep pattern file` is faster than `cat file | grep pattern`.

The last point is the *Useless Use of Cat* award. A surprising amount of "Unix style" is just learning to drop unnecessary `cat`s.

---

## 3. Core commands

| Command | Purpose |
|---|---|
| `cat <f>` | Print whole file to stdout. |
| `cat -n <f>` | With line numbers. |
| `cat -A <f>` | Show non-printing characters (useful for finding stray tabs/CRLFs). |
| `cat f1 f2 > out` | Concatenate multiple files. The *real* job of `cat`. |
| `less <f>` | Page through a file interactively. **Default for any file you didn't write.** |
| `more <f>` | Older, less capable pager. Use `less`. |
| `head <f>` | First 10 lines. |
| `head -n 30 <f>` | First 30 lines. |
| `tail <f>` | Last 10 lines. |
| `tail -n 50 <f>` | Last 50 lines. |
| `tail -f <f>` | **Follow** — keep printing new lines as they're appended. Essential for live logs. |
| `tail -F <f>` | Like `-f` but survives the file being rotated. |
| `wc <f>` | Word, line, and byte counts. |
| `wc -l <f>` | Just line count. |
| `nl <f>` | Number lines (skipping blanks by default). |
| `file <f>` | What *kind* of file is this? |

### `less` keys you must know

| Key | What it does |
|---|---|
| `Space` / `f` | Page down. |
| `b` | Page up. |
| `g` / `G` | Jump to top / bottom. |
| `/pattern` | Search forward. `n` next, `N` previous. |
| `?pattern` | Search backward. |
| `&pattern` | **Filter to lines matching** — incredibly useful in big logs. |
| `q` | Quit. |
| `F` | Switch into follow-mode (like `tail -f` but inside `less`). Ctrl+C exits follow. |

`less` is `vi` for reading. Once these are muscle memory, you'll never `cat` a log again.

---

## 4. Guided walkthrough

```sh
cd ~/ncs205-sandbox/text/

cat lorem.txt              # short file — fine
wc -l access.log
head -3 access.log
tail -3 access.log

# pageable — try the less keys
less access.log
# inside less:
#   /401       search for "401" forward
#   n          next match
#   q          quit

# live tail (simulate writes from another terminal)
tail -f /var/log/syslog &   # background process; we'll meet & in module 11
echo "noise" >> /var/log/syslog 2>/dev/null   # may fail without sudo — that's fine
fg          # bring tail -f back; Ctrl+C to stop
```

`tail -f` is the sysadmin's window into a running app. Open it in a second pane, run the action that you expect to log, watch the lines appear. If they don't — your *first* question is whether you're tailing the right file.

---

## 5. Gotchas

- **`cat` on a big file freezes your terminal.** Always assume "big" unless you know otherwise. `less` first, `cat` only when it's tiny or you're piping somewhere.
- **`cat | grep` is wasteful.** `grep pattern file` is the right form. The only reason to use `cat ... | grep` is when you're concatenating multiple files first.
- **`tail -f` dies when the file is rotated.** `logrotate` moves `app.log` to `app.log.1`, then creates a fresh empty `app.log`. Your `tail -f` was watching the *old* inode. Use `tail -F` to survive rotation.
- **Binary files break your terminal.** If you `cat /bin/ls` you'll see line noise and weird characters; sometimes your prompt is corrupted afterwards. Recover with `reset` (just type it blind and press Enter).
- **CRLF line endings on Windows-edited files.** `cat -A myfile` will show `^M$` at end of lines if Windows touched it. `dos2unix myfile` strips them.
- **`tail -n +N`** (with a `+`) means *start from line N*, not "last N lines." Mistakes here account for 50% of one-liner bugs.

---

## 6. On-the-spot exercises

**E5.1** — Show only the first 5 lines of `~/ncs205-sandbox/text/access.log`.

<details><summary>Show answer</summary>

```sh
head -n 5 ~/ncs205-sandbox/text/access.log
```

(`head -5` also works on most systems but is deprecated by POSIX.)
</details>

**E5.2** — Count how many lines are in `/etc/passwd`.

<details><summary>Show answer</summary>

```sh
wc -l /etc/passwd
```

That number is roughly how many user accounts exist on this box — including system accounts.
</details>

**E5.3** — Show only the last 3 entries from `~/ncs205-sandbox/text/access.log`.

<details><summary>Show answer</summary>

```sh
tail -n 3 ~/ncs205-sandbox/text/access.log
```
</details>

**E5.4** — Pipe `/etc/services` into `less` and search for `ssh` interactively.

<details><summary>Show answer</summary>

```sh
less /etc/services
# inside less:
#   /ssh        searches forward
#   n           next match
#   q           quit
```

You'll see SSH defined on port 22 with both `tcp` and `udp` aliases.
</details>

**E5.5** — Show lines 20–25 of `/etc/services`. (Hint: combine `head` and `tail`.)

<details><summary>Show answer</summary>

```sh
head -n 25 /etc/services | tail -n 6
```

Or with `sed` (you'll meet it in module 13):

```sh
sed -n '20,25p' /etc/services
```
</details>

**E5.6** — Open `/var/log/syslog` and watch new lines appear live.

<details><summary>Show answer</summary>

```sh
sudo tail -f /var/log/syslog
```

(`sudo` may be needed on Ubuntu/Debian to read syslog.) Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to stop. If the file might get rotated mid-watch, use `tail -F`.
</details>

**E5.7** — Confirm the type of file `/usr/bin/ls` and `/etc/passwd`.

<details><summary>Show answer</summary>

```sh
file /usr/bin/ls       # ELF 64-bit LSB pie executable, ...
file /etc/passwd       # ASCII text
```

Running `file` before you `cat` an unknown file is the cheap insurance that keeps your terminal usable.
</details>

---

## 7. Real-world sysadmin scenario

**Customer reports 500 errors on the API.** You don't know which service. Three terminals:

```sh
# Terminal 1 — live-tail nginx access log
sudo tail -F /var/log/nginx/access.log | grep ' 500 '

# Terminal 2 — live-tail the app log
sudo tail -F /var/log/myapp/error.log

# Terminal 3 — reproduce the failing request
curl -i https://api.example.com/v1/orders
```

When you hit the request, line 1 shows the 500 in access.log and line 2 shows the corresponding stack trace. **The whole investigation runs at the speed of your eyeballs**, because you set up the right viewers first.

Two related habits:

```sh
# What changed recently?
ls -ltr /var/log/        # last edited at the bottom

# Quick sanity check before editing a config
wc -l /etc/nginx/nginx.conf
head -3 /etc/nginx/nginx.conf
```

---

## 8. What to remember

- Default pager is `less`. Save `cat` for small files and concatenation.
- `head` / `tail` for fixed slices. `tail -F` for live logs through rotation.
- Inside `less`: `/`, `n`, `q`, `g`, `G`, `F`. Memorize these six keys.
- Avoid `cat foo | grep ...` — `grep ... foo` is the way.
- Run `file` on anything you don't recognize *before* you cat it.

---

## 9. Next

You can read text. Now learn the editor that's on *every* Linux box.

➡ [`06-vi-editor.md`](06-vi-editor.md) — Surviving vi, then mastering it.
