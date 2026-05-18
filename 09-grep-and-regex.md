# 09 — grep and regular expressions


---

## 1. Why this matters

Every Linux job you ever do involves "find the lines that match X." Configs, logs, source code, output of other commands. `grep` is how. And `grep`'s pattern language — **regular expressions** — is the most reusable skill in this entire course. Once you know regex, you carry it into Python, JavaScript, every editor, every database, every cloud console. **Five hours of regex pays back for a career.**

---

## 2. Mental model

`grep` reads input line-by-line and prints lines matching a *pattern*. The pattern is either:

- A **fixed string** — `grep error log.txt` (treats `error` literally)
- A **regular expression** — `grep '^ERROR' log.txt` (treats `^` as "start of line")

There are several flavors of regex:

| Flavor | Tool flag | Notes |
|---|---|---|
| **Basic Regex (BRE)** | default `grep` | `?`, `+`, `{}` need backslashes: `\?`, `\+`, `\{\}` |
| **Extended Regex (ERE)** | `grep -E` (or `egrep`) | Modern operators work without escaping |
| **Perl-compat (PCRE)** | `grep -P` | Most powerful; lookaheads, lazy quantifiers, etc. |
| **Fixed string** | `grep -F` (or `fgrep`) | No regex, fastest, safest when you mean a literal |

For most daily work, **ERE (`grep -E`)** is the sweet spot. I'll teach you regex in that flavor.

> **Mentor note:** A pattern is *anchored* (matches at a position) or *floating* (matches anywhere). `^abc` is anchored to the start of a line; `abc` floats. Knowing which you want is half of writing a correct regex.

---

## 3. Core grep flags

| Flag | Meaning |
|---|---|
| `-i` | Case-insensitive |
| `-v` | **Invert** — show lines that *don't* match |
| `-n` | Show line numbers |
| `-c` | Count matching lines |
| `-l` | Just print filenames that have matches |
| `-L` | Filenames that *don't* have matches |
| `-r` | Recursive (descend into directories) |
| `-R` | Recursive following symlinks |
| `-w` | Match whole words only |
| `-x` | Match the **whole line** only |
| `-A N` | Show N lines **after** each match |
| `-B N` | N lines **before** |
| `-C N` | N lines of **context** (before + after) |
| `-E` | Use Extended Regex |
| `-F` | Fixed string (no regex) |
| `--color=auto` | Highlight matches (often default) |
| `-o` | Print only the matched part, not the whole line |
| `-e PAT` | Add another pattern (you can `-e a -e b`) |
| `-f FILE` | Patterns from a file |

---

## 4. Regex building blocks (ERE)

### Single-character matchers

| Pattern | Matches |
|---|---|
| `a` | The literal character `a` |
| `.` | **Any** single character |
| `[abc]` | One of `a`, `b`, `c` |
| `[a-z]` | One lowercase letter |
| `[A-Z0-9]` | One uppercase letter or digit |
| `[^abc]` | One character **not** in the set |
| `\d` | Digit (PCRE only — for grep, use `[0-9]`) |
| `\s` | Whitespace (PCRE only — use `[[:space:]]`) |

### Anchors

| Pattern | Matches |
|---|---|
| `^` | Start of line |
| `$` | End of line |
| `\b` | Word boundary (in many flavors; safer: use `-w`) |

### Quantifiers (how many of the previous thing)

| Pattern | Meaning |
|---|---|
| `*` | Zero or more |
| `+` | One or more (ERE) |
| `?` | Zero or one (ERE) |
| `{n}` | Exactly n |
| `{n,}` | n or more |
| `{n,m}` | Between n and m |

### Grouping and alternation

| Pattern | Meaning |
|---|---|
| `(abc)` | Group — treat as one unit |
| `a\|b` | `a` or `b` (alternation in ERE) |
| `(cat\|dog)` | "cat" or "dog" |

### POSIX character classes (portable)

| Class | Equivalent |
|---|---|
| `[[:digit:]]` | `[0-9]` |
| `[[:alpha:]]` | `[A-Za-z]` |
| `[[:alnum:]]` | `[A-Za-z0-9]` |
| `[[:space:]]` | space, tab, newline |
| `[[:upper:]]` | `[A-Z]` |
| `[[:lower:]]` | `[a-z]` |

> **Mentor note:** in BRE (default grep), `+`, `?`, `{}`, `|`, `()` are *literal characters*. To use them as operators you must backslash: `\+`, `\?`, `\(\)`. ERE (`grep -E`) makes them operators directly. **Use `grep -E` unless you have a reason not to.** Many systems alias `egrep`.

---

## 5. Guided walkthrough

Use the sandbox at `~/linux-sandbox/text/`.

```sh
cd ~/linux-sandbox/text/

# fixed string
grep 200 access.log              # any line containing "200"
grep ' 200 ' access.log          # tighter — must have spaces around (status code)

# inverted
grep -v 200 access.log           # lines NOT containing "200"

# case-insensitive
grep -i error lorem.txt

# anchors
grep '^192' access.log           # lines starting with 192
grep '0 $' access.log            # lines ending with "0 " (note trailing space)
                                 # — use $'...' if you want a literal trailing newline

# character class
grep '^[0-9]' access.log         # starts with a digit
grep -E '^[A-Z][a-z]+' names.txt # capitalized words (ERE)

# alternation
grep -E '401|403|404' access.log # any client-error status

# quantifier — extended
grep -E '20[0-9]{1}' access.log  # 200-209
grep -E ' (4|5)[0-9]{2} ' access.log  # any 4xx or 5xx status

# whole word
grep -w book ~/linux-sandbox/text/lorem.txt    # "book" but not "bookmark"

# count + recursive
grep -rc TODO ~/linux-sandbox/  # how many TODOs per file in the sandbox

# context
grep -n -A 1 -B 1 401 access.log # show 1 line before & after every "401" match

# only the match
grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' access.log | sort -u
# → unique IP addresses found in the log
```

That last line is genuinely useful — `-o` prints only the matched piece, not the whole line. Combined with regex it's a featherweight extractor.

---

## 6. Gotchas

- **Quote your patterns.** Always. `grep ^ERROR file` lets the shell try to interpret `^`. `grep '^ERROR' file` doesn't. Single quotes also protect from `$`, `*`, etc.
- **BRE vs ERE.** `grep '(cat|dog)' file` in BRE is searching for the literal string `(cat|dog)`. Use `-E` or escape the parens/pipe: `\(\)` and `\|`. When in doubt, use `-E`.
- **Greedy vs lazy.** Standard regex `.*` is greedy — matches as much as possible. There's no lazy `?` in BRE/ERE; you need `-P` for that. Often `[^"]*` (between quotes, don't cross another quote) is the workaround.
- **`grep` matches *anywhere on the line* by default.** Use `^...$` to anchor to the whole line, or `-x` to match only complete lines.
- **`grep -v` inverts.** It's "lines NOT matching" — easy to forget mid-pipeline.
- **`grep -F` is faster** than regex grep for fixed strings. If you're searching for a literal IP address, `grep -F '10.0.0.55'` skips the regex engine.
- **Don't grep `ps aux`** for a process when the grep itself shows up: `ps aux | grep nginx` matches the literal `grep nginx` process. Trick: `ps aux | grep '[n]ginx'` — the bracket trick makes the regex *not match itself*.

---

## 7. On-the-spot exercises

These reference the sandbox files at `~/linux-sandbox/text/`.

**E9.1** — In `names.txt`, find every last name beginning with `R`.

<details><summary>Show answer</summary>

```sh
grep '^R' ~/linux-sandbox/text/names.txt
```

`^` = start of line; the file is "Last, First" so last names *are* at the start.
</details>

**E9.2** — Count how many words in `/usr/share/dict/words` (or `/usr/share/dict/american-english`) contain the substring `book`.

<details><summary>Show answer</summary>

```sh
grep -c book /usr/share/dict/words
```

`-c` counts matching *lines* — but since this dict has one word per line, that's the word count.
</details>

**E9.3** — Count words in the same dictionary that *start* with `book`.

<details><summary>Show answer</summary>

```sh
grep -c '^book' /usr/share/dict/words
```

The `^` anchor turns a substring search into a prefix search.
</details>

**E9.4** — From `~/linux-sandbox/text/access.log`, show all 4xx and 5xx responses (client + server errors).

<details><summary>Show answer</summary>

```sh
grep -E ' (4|5)[0-9]{2} ' ~/linux-sandbox/text/access.log
```

The leading and trailing spaces avoid matching "401" inside a longer number.
</details>

**E9.5** — Display only the *active* configuration lines in `/etc/ssh/ssh_config` (skip blank lines and comments).

<details><summary>Show answer</summary>

```sh
grep -Ev '^\s*#|^\s*$' /etc/ssh/ssh_config
```

- `-E` for ERE
- `-v` invert (show what *doesn't* match)
- `^\s*#` lines whose first non-whitespace char is `#`
- `|` or
- `^\s*$` blank lines

Two patterns OR'd, inverted = "only real config lines."
</details>

**E9.6** — Recursively, in `/etc/`, find every file mentioning your username.

<details><summary>Show answer</summary>

```sh
sudo grep -r -l "$USER" /etc/ 2>/dev/null
```

`-l` prints only filenames. `2>/dev/null` silences permission-denied noise.
</details>

**E9.7** — Show the line numbers of every line in `~/.bashrc` that exports something.

<details><summary>Show answer</summary>

```sh
grep -nE '^[[:space:]]*export ' ~/.bashrc
```

`-n` for line numbers, ERE for cleanliness. Allowing leading whitespace makes the regex robust to indented exports.
</details>

**E9.8** — Extract just the unique IP addresses from `access.log`.

<details><summary>Show answer</summary>

```sh
grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' ~/linux-sandbox/text/access.log | sort -u
```

`-o` prints only the matched piece. `^` anchors to start so we don't match status codes that happen to look IP-ish. `sort -u` deduplicates.
</details>

**E9.9** — In `lorem.txt`, find lines that contain *both* `regex` and `pattern`, in any order.

<details><summary>Show answer</summary>

```sh
grep regex ~/linux-sandbox/text/lorem.txt | grep pattern
```

Easiest to express as two greps. There's no AND in regex itself — chain greps via a pipe.
</details>

**E9.10** — Find every line of `/etc/passwd` whose login shell is `/bin/false` or `/usr/sbin/nologin` (i.e., service accounts).

<details><summary>Show answer</summary>

```sh
grep -E ':(/bin/false|/usr/sbin/nologin)$' /etc/passwd
```

Alternation + anchor to end of line. Each row of `/etc/passwd` is `:`-separated, with the shell as the last field.
</details>

---

## 8. Real-world sysadmin scenario

**Incident.** A customer reports 500 errors. You need to know: how many, which endpoints, which IPs.

```sh
sudo zgrep ' 500 ' /var/log/nginx/access.log* | wc -l
```

`zgrep` works on `.gz` rotated logs without un-gzipping them. Total count: 412.

Now break it down:

```sh
sudo zgrep ' 500 ' /var/log/nginx/access.log* \
  | grep -oE '"[A-Z]+ [^"]+"' \
  | sort | uniq -c | sort -rn | head -10
```

- Stage 1: grab 500-status lines.
- Stage 2: extract the request line (the `"GET /path HTTP/1.1"` part).
- Stage 3: count and rank.

In 30 seconds, you have the top 10 endpoints responsible for the 500s. Same recipe for: top IPs hammering the box, the failing user-agent string, the time-of-day pattern. **`grep + sort + uniq -c + sort -rn + head`** is the most useful five-stage incantation in this whole guide.

---

## 9. What to remember

- `grep` reads input line-by-line, prints matches.
- Use `grep -E` (ERE) unless there's a reason not to.
- Anchors: `^` start, `$` end. Char classes: `[abc]`, `[^abc]`, `[a-z]`.
- Quantifiers: `*`, `+`, `?`, `{n}`, `{n,m}`.
- Useful flags: `-i`, `-v`, `-n`, `-c`, `-l`, `-r`, `-w`, `-o`, `-A/-B/-C`.
- Quote your patterns. Always.
- `grep ... | sort | uniq -c | sort -rn` — the incident-investigation pipeline.

A pocket reference: [`reference/cheatsheet-regex.md`](reference/cheatsheet-regex.md).

---

## 10. Next

You can filter by pattern. Now let's find files by *attribute* — name, size, age, type.

➡ [`10-find-and-xargs.md`](10-find-and-xargs.md) — find, xargs, and the rest of the "where is it?" toolbox.
