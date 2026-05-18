# 13 — sed and awk


---

## 1. Why this matters

`sed` and `awk` are the *grown-up* text tools. When `cut`/`sort`/`uniq` aren't enough — when you need substitutions across files, line-range edits, fielded transforms, conditionals — these two cover it. They're 50-year-old, on every Unix system, and used in production pipelines every day. You don't need to master either; you need *literacy* — read someone else's `sed` and `awk` without panic, write a useful one yourself.

---

## 2. Mental model

- **`sed`** = **s**tream **ed**itor. Reads input line by line, applies *editing commands* to lines that match an *address*, prints the result.
- **`awk`** = pattern-action language. For each line, finds *fields* split on whitespace (or your chosen separator), then runs *actions* on lines matching *patterns*.

```
   sed:   [address]command/...      e.g.  s/old/new/g     1,5d
   awk:   pattern { action }        e.g.  $3 > 100 { print $1 }
```

Both have full programming features (variables, loops). For everyday use, you'll write one-liners.

---

## 3. sed essentials

### Syntax shape

```
sed [-n] [-i] [-E] 'addr command' file
```

- `-n` — suppress automatic printing (use with `p`).
- `-i` — edit *in place* (modifies the file).
- `-E` — Extended Regex (recommended).

### Most-used commands

| Command | Effect |
|---|---|
| `s/old/new/` | Substitute first `old` per line |
| `s/old/new/g` | Substitute **every** occurrence per line |
| `s/old/new/2` | Only the 2nd occurrence per line |
| `s/old/new/I` | Case-insensitive substitution |
| `d` | Delete matching lines |
| `p` | Print matching lines (use with `-n`) |
| `q` | Quit immediately |
| `Nd` | Delete line N |
| `1,5d` | Delete lines 1 through 5 |
| `/pat/d` | Delete lines matching `pat` |
| `/start/,/end/p` | Print from line matching `start` to line matching `end` |

### Examples

```sh
sed 's/error/ERROR/g' log.txt          # uppercase the word "error" everywhere
sed -E 's/[0-9]+/N/g' data.txt         # replace every number with literal N
sed -n '5,10p' file.txt                # print only lines 5-10
sed '/^#/d' /etc/ssh/ssh_config        # delete comment lines
sed -i.bak 's/old/new/g' file.txt      # in-place edit; backup to file.txt.bak
```

> **Mentor note:** `sed -i` modifies the file. Always pair with `-i.bak` (or do a dry-run without `-i` first) — irreversibly mangling configs is a classic 2 AM mistake.

### Multi-command sed

Use `-e` for each command, or chain with `;`:

```sh
sed -e 's/foo/bar/g' -e 's/baz/quux/g' file.txt
sed 's/foo/bar/g; s/baz/quux/g' file.txt
```

---

## 4. awk essentials

### Syntax shape

```
awk 'BEGIN { ... } pattern { action } END { ... }' file
```

- **BEGIN** block — runs once before any input.
- **pattern { action }** — runs `action` for every line where `pattern` matches.
- **END** block — runs once after all input.

If you omit the pattern, the action runs on every line. If you omit the action, the default is `{ print }`.

### Built-in variables

| Variable | Meaning |
|---|---|
| `$0` | The whole line |
| `$1`, `$2`, … | Field 1, 2, … (whitespace-separated by default) |
| `NF` | Number of fields on this line |
| `$NF` | The **last** field |
| `NR` | Number of records (lines) read so far |
| `FS` | Field separator (default: whitespace) |
| `OFS` | Output field separator (default: space) |
| `FILENAME` | Current input filename |

### Useful patterns

| Pattern | Matches |
|---|---|
| `/regex/` | Lines matching regex |
| `$3 > 100` | Lines where field 3 > 100 |
| `NR == 1` | Just the first line |
| `NR > 1` | Skip the header |
| `$1 == "alice"` | Where field 1 equals "alice" |
| `NR >= 5 && NR <= 10` | Lines 5–10 |

### Examples

```sh
# Print the second field of every line
awk '{print $2}' file.txt

# Use comma as field separator
awk -F',' '{print $1, $3}' employees.csv

# Sum a numeric column
awk -F',' 'NR > 1 {sum += $4} END {print sum}' employees.csv

# Print lines where col 3 (department) is "eng"
awk -F',' '$3 == "eng"' employees.csv

# Top 3 IPs from a log
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -3

# Print last field of every line (useful for paths)
awk '{print $NF}' /etc/passwd

# Format output with printf
awk -F',' 'NR>1 {printf "%-12s %8d\n", $2, $4}' employees.csv
```

### The Hello World of awk

```sh
awk 'BEGIN { print "start"; total=0 }
     NR > 1 { total += $4 }
     END { print "total:", total }' \
  /path/to/data.csv
```

That's a complete awk program. Pattern blocks, accumulator, summary at the end. Compare to writing the same thing in Python — awk is *terse*.

---

## 5. Guided walkthrough

```sh
cd ~/linux-sandbox/text/

# --- sed ---
sed 's/Anderson/Andersen/g' names.txt      # find & replace, no edit yet
sed -n '5p' names.txt                      # only print line 5
sed '/^A/d' names.txt                      # delete lines starting with A
sed -n '/Khan/,/Lopez/p' names.txt         # print range between two patterns

# Edit a config-like file (dry run, then in place with backup)
cp lorem.txt lorem.bak
sed -E 's/^[a-z]/X/' lorem.bak             # preview
sed -E -i.bak 's/^[a-z]/X/' lorem.bak      # in place, backup .bak

# --- awk ---
awk -F',' '{print $1, $2}' employees.csv         # columns 1 and 2
awk -F',' 'NR>1 && $3=="eng" {print $2}' employees.csv  # eng-dept names
awk -F',' 'NR>1 {sum+=$4; n++} END {print "avg:", sum/n}' employees.csv

# Group salary totals by department
awk -F',' 'NR>1 {total[$3] += $4} END {
  for (d in total) printf "%-8s %d\n", d, total[d]
}' employees.csv | sort -k2 -rn
```

That last one is a one-line *group-by-sum*. In SQL: `SELECT dept, SUM(salary) FROM employees GROUP BY dept`. In awk: nine words.

---

## 6. Gotchas

- **`sed -i` is permanent.** Pair with `.bak` until you trust it: `sed -i.bak ...`.
- **macOS `sed` differs from GNU `sed`.** On macOS, `-i` requires an argument (use `-i ''` for no backup). On Linux, `-i` alone is fine. This bites people moving between laptop and server.
- **Quote your `sed` programs.** Single quotes prevent the shell from eating special characters.
- **awk's field separator is whitespace by default.** For CSV use `-F','`. For colon-delimited files like `/etc/passwd`, `-F':'`.
- **awk's `$2 > 100` does numeric comparison automatically.** But `$2 > "100"` would do string compare. Be explicit if mixing types: `+$2 > 100`.
- **Floating-point in awk is locale-aware.** Some locales use `,` as the decimal separator. `LC_NUMERIC=C awk ...` for predictable behavior in scripts.

---

## 7. On-the-spot exercises

**E13.1** — Use `sed` to replace every `Anderson` with `Andersen` in `names.txt`, printing the result (don't modify the file).

<details><summary>Show answer</summary>

```sh
sed 's/Anderson/Andersen/g' ~/linux-sandbox/text/names.txt
```

`/g` ensures every occurrence, not just the first per line.
</details>

**E13.2** — Use `sed` to delete every comment line (starting with `#`) and blank line from `/etc/ssh/ssh_config`.

<details><summary>Show answer</summary>

```sh
sed -E '/^\s*(#|$)/d' /etc/ssh/ssh_config
```

Two patterns OR'd inside the address: starts with `#`, or end-of-line right at the start (empty line).
</details>

**E13.3** — Use `awk` to print just the *names* and *salaries* from `employees.csv`.

<details><summary>Show answer</summary>

```sh
awk -F',' '{print $2, $4}' ~/linux-sandbox/text/employees.csv
```
</details>

**E13.4** — Print only the *engineers* (department = "eng") with their salaries.

<details><summary>Show answer</summary>

```sh
awk -F',' '$3=="eng" {print $2, $4}' ~/linux-sandbox/text/employees.csv
```

You don't need an explicit `if`; the pattern `$3=="eng"` is the condition.
</details>

**E13.5** — Compute the average salary across all employees (skip the header row).

<details><summary>Show answer</summary>

```sh
awk -F',' 'NR>1 {sum+=$4; n++} END {print sum/n}' ~/linux-sandbox/text/employees.csv
```
</details>

**E13.6** — Show the line numbers of every active config line (not blank, not comment) in `/etc/ssh/ssh_config`.

<details><summary>Show answer</summary>

```sh
awk '!/^\s*(#|$)/ {print NR": "$0}' /etc/ssh/ssh_config
```

`!/.../ ` is "doesn't match." Then we print the line number and the full line.
</details>

**E13.7** — Convert `/etc/passwd` into a CSV with header `username,uid,gid,home,shell`.

<details><summary>Show answer</summary>

```sh
{
  echo "username,uid,gid,home,shell"
  awk -F':' '{print $1","$3","$4","$6","$7}' /etc/passwd
} > /tmp/users.csv
```

The braces group `echo` and `awk` so their combined output is redirected. We'll explore command grouping more in module 14.
</details>

**E13.8** — From `access.log`, print all GET requests that returned 200, formatted as "TIME PATH":

<details><summary>Show answer</summary>

```sh
awk '$6 ~ /"GET/ && $9 == 200 { print $4, $7 }' ~/linux-sandbox/text/access.log
```

`~` is "matches regex." `$6` is the start of the request quote, `$9` is the status. Common log format makes this trivial.
</details>

---

## 8. Real-world sysadmin scenario

**Mass config update.** Marketing wants every web server's nginx log format changed. You don't have a config management tool — just SSH. The file is `/etc/nginx/nginx.conf` and you need to change:

```
log_format main '$remote_addr - $remote_user [$time_local] ...';
```

into:

```
log_format main '$remote_addr - $remote_user - $request_id [$time_local] ...';
```

across 20 servers. One sed line:

```sh
for h in web-{01..20}.prod; do
  ssh "$h" "sudo sed -i.bak 's/\\\$remote_user \\[/\\\$remote_user - \\\$request_id [/' /etc/nginx/nginx.conf && sudo nginx -t && sudo systemctl reload nginx"
done
```

The escaping is *ugly* (every `$` is escaped twice: once for local shell, once for remote shell). But it's idempotent — `.bak` backups are made — and `nginx -t` validates before reload. A 3-minute change instead of 20 manual edits.

A simpler awk one: **count nginx 5xx responses by endpoint, last hour:**

```sh
awk '$9 ~ /^5/ { gsub(/"/, "", $7); count[$7]++ }
     END { for (p in count) print count[p], p }' \
   /var/log/nginx/access.log | sort -rn | head
```

A whole report in three lines. That's why `awk` survives — it's a *programming language* that fits in your head.

---

## 9. What to remember

- `sed` for line-level edits (substitution, delete, print ranges).
- `awk` for field-aware work (CSV, logs, structured text).
- Quote your programs. Single quotes are friendlier than double.
- `sed -i.bak` for safe in-place edits.
- `awk '$3 > 100 {print $1}'` is the basic shape — pattern, then action.
- For group-by-sum analyses, awk's associative arrays make it shine.

---

## 10. Next

You can chain transformations. Now let's package them into reusable scripts.

➡ [`14-shell-scripting.md`](14-shell-scripting.md) — Variables, conditionals, loops, exit codes — and how a script becomes a tool.
