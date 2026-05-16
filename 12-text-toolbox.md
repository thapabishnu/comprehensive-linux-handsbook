# 12 — The text-processing toolbox

> *Maps to:* NCS 205 Labs 31–32.

---

## 1. Why this matters

Once you can pipe (mod 08) and filter by pattern (mod 09), the missing piece is *transformation*. The classic Unix tools — `cut`, `sort`, `uniq`, `tr`, `paste`, `comm`, `diff` — each do *one* thing well. Stacked into pipelines, they replace Excel for many real sysadmin and data tasks. *Top IPs from a log. Unique users from a CSV. Diff between two configs.* All become one-liners.

---

## 2. Mental model

Each tool transforms a stream. Visualize a pipeline as a small assembly line:

```
   cat data.csv | cut -d, -f1 | sort | uniq -c | sort -rn | head -5
   └ source      └ extract     └ group  └ count  └ rank      └ top 5
```

Six stages, each doing exactly one job. Build the pipeline incrementally — run after each `|` to inspect intermediate results. That's how senior people *write* pipelines: stage by stage, not all at once.

---

## 3. Core commands

### `cut` — extract columns or character ranges

| Form | Effect |
|---|---|
| `cut -d',' -f1 file` | Field 1, delimiter = comma |
| `cut -d':' -f1,3 /etc/passwd` | Username + UID |
| `cut -c1-10 file` | Characters 1 through 10 |
| `cut -f2 file` | Tab-delimited by default — field 2 |

### `sort` — sort lines

| Form | Effect |
|---|---|
| `sort file` | Lexical ascending |
| `sort -r file` | Reverse |
| `sort -n file` | Numeric |
| `sort -h file` | Human-numeric (1K, 2M, 5G…) |
| `sort -u file` | Unique (no dupes) |
| `sort -k2 file` | Sort by field 2 |
| `sort -t',' -k3,3n file` | Comma-separated, key field 3, numeric |

### `uniq` — collapse adjacent duplicates

| Form | Effect |
|---|---|
| `uniq file` | Adjacent dupes collapsed |
| `uniq -c` | With counts |
| `uniq -d` | Only show duplicates |
| `uniq -u` | Only show non-duplicated lines |

`uniq` only sees *adjacent* duplicates. **Always pipe through `sort` first.** `sort | uniq -c` is the most-used pair in this whole guide.

### `tr` — translate characters

| Form | Effect |
|---|---|
| `tr 'a-z' 'A-Z'` | Lowercase → uppercase |
| `tr -d '\r'` | Delete carriage returns (Windows line endings) |
| `tr -s ' '` | Squeeze repeats — many spaces → one |
| `tr ',' '\n'` | Replace commas with newlines |

`tr` reads stdin and writes stdout. It doesn't take a filename — use `tr ... < file`.

### `paste` — join lines side-by-side

| Form | Effect |
|---|---|
| `paste a b` | tab-joined columns from a and b |
| `paste -d',' a b` | Comma-joined |
| `paste -s file` | Serial — fold all lines onto one, tab-separated |

### `comm` — compare two sorted files

| Form | Effect |
|---|---|
| `comm a b` | Three columns: only-in-a, only-in-b, both |
| `comm -12 a b` | Only show "both" (intersection) |
| `comm -23 a b` | Only show "in a but not b" |

Both inputs *must be sorted*. Otherwise the output is garbage.

### `diff` — show what's different

| Form | Effect |
|---|---|
| `diff a b` | Default change-list output |
| `diff -u a b` | Unified format (what `git diff` uses) |
| `diff -y a b` | Side-by-side |
| `diff -r dir1 dir2` | Recursive directory diff |

Pair with `patch` to apply diffs — but that's beyond NCS 205.

### Honorable mentions

- `nl` — number lines.
- `rev` — reverse each line character-by-character.
- `cat -n` — number every line (simpler than `nl`).
- `column -t` — pretty-print whitespace-separated columns.
- `tac` — `cat` backwards (last line first).

---

## 4. Guided walkthrough

```sh
cd ~/ncs205-sandbox/text/

# cut — extract the salary column from the CSV
cut -d',' -f4 employees.csv

# sort the salaries numerically, descending
cut -d',' -f4 employees.csv | tail -n +2 | sort -rn

# top 3 highest-paid
cut -d',' -f4 employees.csv | tail -n +2 | sort -rn | head -3

# uniq + sort to count unique departments
cut -d',' -f3 employees.csv | tail -n +2 | sort | uniq -c | sort -rn

# top 3 most active IPs in access.log (classic pipeline)
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -3
# (we'll meet awk properly in module 13 — for now it just picks field 1)

# tr — uppercase a file
tr 'a-z' 'A-Z' < lorem.txt

# strip Windows line endings
tr -d '\r' < broken.txt > fixed.txt

# paste — line up two files as columns
seq 1 5 > nums.txt
seq 11 15 > more.txt
paste nums.txt more.txt

# comm — set operations on sorted files
sort < <(seq 1 10) > a.txt
sort < <(seq 5 15) > b.txt
comm -12 a.txt b.txt        # intersection: 5..10
comm -23 a.txt b.txt        # only in a:    1..4

# diff — what changed
echo "foo
bar
baz" > v1.txt
echo "foo
bar
quux" > v2.txt
diff -u v1.txt v2.txt
```

> **Mentor habit:** when you build a long pipeline, copy and run it stage-by-stage. Stop after every `|`. See what's flowing. The mental model of *streams of lines* gets sharper with that habit.

---

## 5. Gotchas

- **`uniq` only collapses adjacent lines.** Sort first or you'll get duplicates anyway.
- **`sort` is locale-dependent.** Capital letters may sort before or after lowercase depending on `LC_ALL`. Set `LC_ALL=C sort ...` for predictable, byte-level sorting in scripts.
- **CSVs with quoted fields break `cut`.** A field like `"Smith, John"` contains the delimiter. For real CSV processing, use `awk` (module 13) or proper tools like `csvkit` / `xsv`.
- **`tr` doesn't take a filename.** Always `tr ... < file` (or pipe into it).
- **`comm` needs sorted inputs.** Sort with the same locale on both sides.
- **`diff` exit code is 1 when files differ.** Useful in scripts: `diff a b > /dev/null && echo same || echo different`.

---

## 6. On-the-spot exercises

**E12.1** — From `~/ncs205-sandbox/text/employees.csv`, print just the names column.

<details><summary>Show answer</summary>

```sh
cut -d',' -f2 ~/ncs205-sandbox/text/employees.csv
```

To skip the header: pipe through `tail -n +2`.
</details>

**E12.2** — List all unique departments in the CSV.

<details><summary>Show answer</summary>

```sh
cut -d',' -f3 ~/ncs205-sandbox/text/employees.csv | tail -n +2 | sort -u
```
</details>

**E12.3** — Show the count of employees per department.

<details><summary>Show answer</summary>

```sh
cut -d',' -f3 ~/ncs205-sandbox/text/employees.csv | tail -n +2 | sort | uniq -c | sort -rn
```

`sort | uniq -c | sort -rn` — the most useful pipeline triple in operations work.
</details>

**E12.4** — Top 5 IP addresses in `access.log` by request count.

<details><summary>Show answer</summary>

```sh
cut -d' ' -f1 ~/ncs205-sandbox/text/access.log | sort | uniq -c | sort -rn | head -5
```
</details>

**E12.5** — Uppercase the contents of `lorem.txt`.

<details><summary>Show answer</summary>

```sh
tr 'a-z' 'A-Z' < ~/ncs205-sandbox/text/lorem.txt
```
</details>

**E12.6** — Replace every space in `lorem.txt` with a newline, then count distinct words.

<details><summary>Show answer</summary>

```sh
tr ' ' '\n' < ~/ncs205-sandbox/text/lorem.txt | sort -u | wc -l
```

You can refine this — strip punctuation first with `tr -d`, lowercase with `tr 'A-Z' 'a-z'`, etc.
</details>

**E12.7** — Compare `/etc/services` to a sorted version of itself — are they the same?

<details><summary>Show answer</summary>

```sh
diff /etc/services <(sort /etc/services)
```

The `<(...)` is *process substitution* — runs `sort` and feeds its output to `diff` as if it were a file. Useful for one-shot comparisons.
</details>

**E12.8** — Two sorted lists `users-tuesday.txt` and `users-wednesday.txt` show people logged in each day. Find who logged in *both* days.

<details><summary>Show answer</summary>

```sh
comm -12 users-tuesday.txt users-wednesday.txt
```

`-12` suppresses columns 1 and 2 (only-in-a and only-in-b), leaving the "both" column.
</details>

---

## 7. Real-world sysadmin scenario

**Audit:** "Make a CSV of every user account on this box and their primary group."

```sh
cut -d':' -f1,4 /etc/passwd \
  | sort \
  | tr ':' ',' \
  > /tmp/user-group.csv
```

That's it. `cut` extracts the right columns from `/etc/passwd`, `sort` orders them, `tr` swaps `:` for `,`. Pipe it through `column -t -s,` to display nicely:

```sh
cat /tmp/user-group.csv | column -t -s,
```

A more involved one: **"Which IPs accessed the API more than 5 times?"**

```sh
cut -d' ' -f1 /var/log/nginx/access.log \
  | sort | uniq -c \
  | awk '$1 > 5 {print $2 " (" $1 ")"}'
```

You'll meet `awk` formally next module. The point: the toolbox tools chain into solutions that look intimidating on a slide but are *trivial* to build incrementally.

---

## 8. What to remember

- One tool, one job. The pipeline is where the power is.
- `sort | uniq -c | sort -rn` — your single most useful triple.
- `cut -d X -fN` for delimited data; `cut -cN-M` for fixed columns.
- `tr` for character-level translation; takes only stdin.
- `comm` for set ops on sorted files; `diff` for changes.
- Build pipelines stage by stage. Watch what flows.

---

## 9. Next

You can chain filters. Now meet the two oldest, most powerful text-processing tools: `sed` and `awk`.

➡ [`13-sed-and-awk.md`](13-sed-and-awk.md) — Stream editors and pattern-action languages.
