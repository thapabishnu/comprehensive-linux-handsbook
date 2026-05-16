# 10 — find and xargs

> *Maps to:* NCS 205 Lab 23.

---

## 1. Why this matters

Globs (module 04) match files in *one directory*. `find` walks an entire tree and matches by *any* criterion you can name: name, type, size, age, ownership, permission. Then it can run a command on each match. The combination of `find` and `xargs` is how sysadmins do bulk operations safely: "delete all the 30-day-old log files," "set every directory to mode 755 but every file to 644," "tar up everything modified yesterday."

---

## 2. Mental model

`find` has a slightly weird syntax that throws beginners. It's actually quite consistent once you see the structure:

```
   find  STARTING_PATH(s)   TESTS   ACTION
   ────  ────────────────   ─────   ──────
   find  /var/log           -name '*.gz' -mtime +7   -delete
```

- **Starting path** — where to begin walking (you can give several).
- **Tests** — filters that must all match. `-name '*.gz'` and `-mtime +7` and (implied AND).
- **Action** — what to do with each match. Defaults to `-print`. Others: `-delete`, `-exec`, `-ls`.

`find` is exhaustive by default — it descends into every subdirectory. That power is why it's useful and why you must point it carefully.

---

## 3. Core find tests

| Test | Matches |
|---|---|
| `-name 'pattern'` | Glob match on the base filename (quote it!) |
| `-iname 'pattern'` | Case-insensitive name match |
| `-path 'glob'` | Glob against the *full* path |
| `-type f` | Regular files |
| `-type d` | Directories |
| `-type l` | Symbolic links |
| `-type s/p/b/c` | Socket / pipe / block / char device |
| `-size +1M` | Larger than 1 MB. Also `c` bytes, `k` KB, `M` MB, `G` GB. |
| `-size -100k` | Smaller than 100 KB |
| `-mtime -7` | Modified less than 7 days ago |
| `-mtime +30` | Modified more than 30 days ago |
| `-mmin -60` | Modified less than 60 minutes ago |
| `-newer otherfile` | Newer than `otherfile` |
| `-user alice` | Owned by user alice |
| `-group devs` | Owned by group devs |
| `-perm 644` | Exactly permissions 644 |
| `-perm -o+w` | At least world-writable |
| `-empty` | Zero-sized files or empty dirs |
| `-not <test>` | Logical NOT (or `!`) |
| `<test> -o <test>` | Logical OR (default is implicit AND) |
| `\( ... \)` | Group expressions (parens) |

### Actions

| Action | What it does |
|---|---|
| `-print` | Print the path (default) |
| `-print0` | Print paths separated by NUL (safe for filenames with spaces) |
| `-ls` | Long-format listing like `ls -l` |
| `-delete` | Delete the match |
| `-exec CMD {} \;` | Run CMD per match. `{}` is the path. `\;` ends the command. |
| `-exec CMD {} +` | Same but batches many paths per CMD invocation (faster) |
| `-quit` | Stop after the first match (useful for tests) |

> **Mentor note:** `find` with `-delete` is *immediate and permanent*. Always run the same command with `-print` first to *see* what would be deleted. Then change `-print` to `-delete`.

---

## 4. xargs — the partner tool

`xargs` reads lines from stdin and turns them into arguments for a command. It's what you reach for when:

- A tool only accepts arguments (not stdin).
- You want to parallelize work.
- `find -exec` is too slow.

```sh
find . -name '*.log' | xargs gzip       # gzip every match
find . -name '*.log' -print0 | xargs -0 gzip   # NUL-safe
```

Key flags:

| Flag | Effect |
|---|---|
| `-0` | Input separated by NUL (pair with `find -print0`) |
| `-n N` | Up to N args per command call |
| `-P N` | Run up to N copies in parallel |
| `-I {}` | Use `{}` as placeholder (so you can put it in the middle of a command) |
| `-r` | Don't run if no input (don't run empty `gzip`) |

---

## 5. Guided walkthrough

```sh
cd ~/ncs205-sandbox/tree/

# the simplest find
find .                              # every path, recursively

# filter by name
find . -name '*.md'                 # markdown files
find . -iname '*.MD'                # case-insensitive

# filter by type
find . -type f
find . -type d

# combine tests (AND is implicit)
find . -type f -name '*.log'

# size
find . -type f -size +1c            # at least 1 byte

# negate
find . -not -name '*.md'

# OR — must group expressions
find . \( -name '*.log' -o -name '*.tmp' \) -type f

# show full listing
find . -type f -ls

# run a command per match — old style
find . -type f -exec wc -l {} \;

# run once with many args — faster
find . -type f -exec wc -l {} +

# safer alternative with xargs
find . -type f -print0 | xargs -0 wc -l

# age-based cleanup (DRY-RUN FIRST)
find ~/ncs205-sandbox -name '*.tmp' -mtime +0 -print    # show
# find ~/ncs205-sandbox -name '*.tmp' -mtime +0 -delete # actually delete
```

Note the *print-then-delete* pattern. Bake it into your habits.

---

## 6. Gotchas

- **Quote the `-name` argument.** `find . -name *.log` will let the shell expand `*.log` *before* find runs, breaking the command (or matching only files in the current dir). Use `-name '*.log'`.
- **`-mtime N` is days; `-mmin N` is minutes.** A leading `+` means more than, `-` means less than, no sign means exactly N. `-mtime 0` matches files modified in the last 24 hours.
- **`-delete` is final.** Always `-print` first.
- **`-exec ... \;` runs the command once per file.** Slow. `-exec ... +` batches — way faster.
- **Spaces in filenames break naive xargs.** `find ... | xargs` splits on whitespace, so "report v2.txt" becomes two args. Use `find ... -print0 | xargs -0` to be safe.
- **Be careful with `-perm`.** `-perm 644` means *exactly* 644. `-perm -644` means *at least* those bits set. `-perm /644` means *any* of those bits.
- **`find /` can be slow** because it traverses every mount including network ones. Use `-xdev` to stay on one filesystem.
- **`find -name` only matches the basename.** To match against the whole path, use `-path` or `-wholename`.

---

## 7. On-the-spot exercises

Use the sandbox tree at `~/ncs205-sandbox/tree/`.

**E10.1** — List every `.md` file under the tree.

<details><summary>Show answer</summary>

```sh
find ~/ncs205-sandbox/tree -name '*.md'
```
</details>

**E10.2** — List every *directory* under the tree.

<details><summary>Show answer</summary>

```sh
find ~/ncs205-sandbox/tree -type d
```
</details>

**E10.3** — Find every file modified in the last 7 days under your home directory.

<details><summary>Show answer</summary>

```sh
find ~ -type f -mtime -7
```

`-7` = "less than 7 days ago," `+7` = "more than 7 days ago."
</details>

**E10.4** — Find every empty file under `/tmp/`.

<details><summary>Show answer</summary>

```sh
find /tmp/ -type f -empty 2>/dev/null
```
</details>

**E10.5** — Find every `.log` or `.tmp` file in `/var/`. (You'll need parens + `-o`.)

<details><summary>Show answer</summary>

```sh
sudo find /var/ \( -name '*.log' -o -name '*.tmp' \) -type f 2>/dev/null
```

Without the parens, the precedence is wrong: `-o` binds looser than `-type`, and the meaning shifts.
</details>

**E10.6** — Show the size and path of every file over 1 MB in `/var/log/`.

<details><summary>Show answer</summary>

```sh
sudo find /var/log/ -type f -size +1M -ls
```

Or just the paths:

```sh
sudo find /var/log/ -type f -size +1M -print
```
</details>

**E10.7** — Delete every `*.tmp` file in `~/ncs205-sandbox/tree/`. **First print** what would be deleted, then delete.

<details><summary>Show answer</summary>

```sh
find ~/ncs205-sandbox/tree -name '*.tmp' -print     # confirm list
find ~/ncs205-sandbox/tree -name '*.tmp' -delete    # actually delete
```

This is the print-then-delete habit. Internalize it.
</details>

**E10.8** — Recursively `chmod 644` every file (but not directory) under `~/ncs205-sandbox/`.

<details><summary>Show answer</summary>

```sh
find ~/ncs205-sandbox -type f -exec chmod 644 {} +
```

`+` batches paths per `chmod` invocation, way faster than `\;`.
</details>

**E10.9** — Find every file in `/etc/` owned by you (probably none — but the command should work either way).

<details><summary>Show answer</summary>

```sh
find /etc -user "$USER" 2>/dev/null
```
</details>

**E10.10** — Count the total disk usage of all `.log` files under `/var/log/` using `find` + `xargs`.

<details><summary>Show answer</summary>

```sh
sudo find /var/log -type f -name '*.log' -print0 \
  | xargs -0 du -ch \
  | tail -1
```

`du -ch` prints sizes plus a grand total; `tail -1` keeps only the total line.
</details>

---

## 8. Real-world sysadmin scenario

**The dreaded "disk filling up"** — but smartly this time.

```sh
# Top 10 biggest files anywhere on the system (skipping /proc and /sys)
sudo find / -xdev -type f -not -path '/proc/*' -not -path '/sys/*' \
    -printf '%s %p\n' 2>/dev/null \
  | sort -rn | head -10 \
  | awk '{ printf "%6.1fM  %s\n", $1/1024/1024, $2 }'
```

That's the kind of one-liner you copy into your runbook. `-printf` lets you pull metadata into the output without spawning a separate `stat` per file. Once you have the top 10 list, you decide *which* to act on — and `find` can take that action too:

```sh
# Rotate (compress) all .log files in /var/log/myapp older than 7 days
sudo find /var/log/myapp -type f -name '*.log' -mtime +7 -exec gzip {} +
```

This is the daily operational reality of running a Linux server. Globs handle the easy patterns; `find` handles everything else.

---

## 9. What to remember

- `find PATH TESTS ACTION` — that's the whole pattern.
- Quote `-name` patterns. `find . -name '*.log'`.
- `-print` first, `-delete` second. Always.
- `-exec CMD {} +` is the modern, fast form. Avoid `\;` unless you must.
- `xargs -0` paired with `find -print0` is the safe way to pipe filenames.
- `-mtime N` (days) and `-mmin N` (minutes) with `+`/`-` for older/newer.
- For one-filesystem searches, add `-xdev`.

---

## 10. Next

You can find anything on disk. Now let's understand what's running in memory.

➡ [`11-processes-and-jobs.md`](11-processes-and-jobs.md) — Processes, signals, and background jobs.
