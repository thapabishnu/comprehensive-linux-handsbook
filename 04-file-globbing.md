# 04 — File globbing: making the shell match files for you

> *Maps to:* NCS 205 Lab 10.

---

## 1. Why this matters

Typing 200 filenames by hand is how interns get fired. The shell has a tiny but powerful pattern language — **globs** — that turns `*.log` into "every .log file in this directory." It happens *before* your command runs: by the time `rm` sees its arguments, the shell has already expanded `*.tmp` into the actual list of files. Understanding that **the shell, not the command, does the matching** is the single most important glob insight.

---

## 2. Mental model

Glob expansion sits between you and the program:

```
   you type:    rm *.tmp
   shell sees:  rm   (and expands *.tmp itself)
   shell runs:  rm file1.tmp file2.tmp old.tmp
   rm sees:     three filename arguments
```

Two huge consequences:

1. **Globs only match files that exist** — at expansion time, the shell looks at the filesystem. If no files match, behavior depends on shell settings (usually the pattern is passed through literally — surprising).
2. **Globs are not regular expressions.** Different syntax, different meaning. `*` in a glob means "any string"; `*` in regex means "zero or more of the previous." We'll meet regex in module 09; don't conflate them.

---

## 3. The four glob operators

| Operator | Matches | Example |
|---|---|---|
| `*` | Zero or more of any character | `*.log` → `a.log`, `b.log`, `today.log` |
| `?` | Exactly one of any character | `file?.txt` → `file1.txt`, `fileA.txt`, but **not** `file12.txt` |
| `[abc]` | One character from the set | `[Aa]uto` → `Auto` or `auto` |
| `[a-z]` | One character from the range | `report-[0-9].pdf` → `report-3.pdf` etc. |
| `[!abc]` or `[^abc]` | One character *not* in the set | `[!.]*` → files not starting with `.` |
| `{a,b,c}` | Brace expansion — **expands to a list** | `{eth0,eth1,wlan0}` → 3 arguments |

A subtle but important fact: **brace expansion `{}` is different from a glob.** Globs check the filesystem; braces are a pure text expansion (they don't need files to exist).

```sh
echo {1,2,3}.txt          # → 1.txt 2.txt 3.txt   (always)
echo *.txt                # → only files actually ending in .txt
```

You can combine them: `cp file.txt{,.bak}` is a slick way to make a backup — it expands to `cp file.txt file.txt.bak`.

### What `*` does NOT do

- **Doesn't match dotfiles** by default. `rm *` won't touch `.bashrc`. Use `.*` (and be careful — it matches `.` and `..` too).
- **Doesn't cross `/` boundaries** in basic globs. `*` matches inside *one* directory, not into subdirectories. For recursive matching: `**` (with `shopt -s globstar` in bash 4+), or use `find` (module 10).

---

## 4. Guided walkthrough

The orientation sandbox at `~/ncs205-sandbox/globbing/` was created for this. If you skipped that, re-run `~/setup-sample-data.sh`.

```sh
cd ~/ncs205-sandbox/globbing/
ls                            # baseline view of the test files
echo ---
ls A*                         # everything starting with A
ls *B*                        # anything containing B
ls A?                         # A followed by exactly one char  → AA AB AC AD
ls [AB]A                      # AA, BA
ls [A-C][A-C]                 # AA AB AC BA BB BC CA CB CC (but only those that exist)
ls *[!,]                      # files NOT ending in comma
```

Watch what happens when you ask for something nonexistent:

```sh
ls Z*
# ls: cannot access 'Z*': No such file or directory   ← glob didn't expand
```

That literal `Z*` got passed through because no file matched. That's bash's default behavior. Different shells (zsh, fish) behave differently.

Brace expansion — pure text:

```sh
echo node-{1,2,3}.example.com
# node-1.example.com node-2.example.com node-3.example.com

mkdir -p logs/{2024,2025,2026}/{jan,feb,mar}
ls -R logs/
```

That last one created 9 directories with one command. Read it carefully — that's the move that wins a sysadmin 20 minutes a day.

---

## 5. Gotchas

- **`rm *` won't kill dotfiles, but `rm * .*` is a foot-cannon.** The second pattern matches `.` and `..`. Modern `rm` refuses to delete those, but don't rely on it. Use `rm -- .[!.]*` if you really need to target dotfiles.
- **Quoting kills the glob.** `rm "*.tmp"` looks for a single literal file *called `*.tmp`*. Without quotes the shell expands it. Single quotes and double quotes both prevent expansion.
- **A literal `*` in a filename** can be matched with `\*` or `'*'` or `[*]`. The sandbox has a file actually named `A*`; `ls 'A*'` lists only that file.
- **`*` is greedy** in the sense of "longest match," but unlike regex it doesn't backtrack. It just matches everything not crossing a `/`.
- **The shell expands before piping.** `ls *.log | grep error` runs `ls` on every `.log` file then pipes file names — not their *contents* — to `grep`. To search log contents, use `grep error *.log`.
- **No matches behavior is configurable.** `shopt -s failglob` makes bash error instead of passing through. `shopt -s nullglob` makes it expand to nothing. Each has its trade-offs in scripts.

---

## 6. On-the-spot exercises

The directory:

```
A   A*   A,   AA   AB   ABC   AC   AD   B,   BA   BB   BC   BD   BE   BF
```

**E4.1** — List only `AB`.

<details><summary>Show answer</summary>

```sh
ls AB
```

When the literal name is unambiguous, you don't need a glob at all.
</details>

**E4.2** — List all files containing a `B` in their name.

<details><summary>Show answer</summary>

```sh
ls *B*
```
</details>

**E4.3** — List only the files `BB`, `BC`, `BD`, `BE`.

<details><summary>Show answer</summary>

```sh
ls B[B-E]
```

A range character class is tighter than `B*` (which would also match `BA` and `BF`).
</details>

**E4.4** — List only the file literally named `A*` (yes, with the star in the name).

<details><summary>Show answer</summary>

```sh
ls 'A*'
```

Or `ls A\*`. Both prevent the shell from expanding `*`.
</details>

**E4.5** — List only `AB` and `A*` together.

<details><summary>Show answer</summary>

```sh
ls AB 'A*'
```

Two separate arguments — give them to `ls`, no need to compress into one glob.
</details>

**E4.6** — List all PDF files in `/opt/pub/ncs205/submit/collected/` (class shell server only) with `lab2` in the name.

<details><summary>Show answer</summary>

```sh
ls /opt/pub/ncs205/submit/collected/*lab2*.pdf
```

The two `*` wildcards let the lab number sit anywhere in the filename.
</details>

**E4.7** — In one command, create a backup of `/etc/hosts` named `hosts.bak` *in the current directory* using brace expansion.

<details><summary>Show answer</summary>

```sh
cp /etc/hosts{,.bak}    # ← won't work directly because both expand from same prefix
```

That actually expands to `cp /etc/hosts /etc/hosts.bak`, which writes to `/etc` (often permission-denied). To land in the current dir, be explicit:

```sh
cp /etc/hosts ./hosts.bak
```

Brace expansion is great for `cp file{,.bak}` *within the same directory*. Across dirs, write it out.
</details>

**E4.8** — List files in `/usr/bin/` with exactly 4-character names.

<details><summary>Show answer</summary>

```sh
ls /usr/bin/????
```

Four `?` = exactly four characters. (Glob doesn't have repetition counts like regex's `{4}`.)
</details>

**E4.9** — List files in `/usr/bin/` with names that start with `s` and end with `t`.

<details><summary>Show answer</summary>

```sh
ls /usr/bin/s*t
```

`*` here means "any characters in between."
</details>

**E4.10** — In `/usr/bin/`, list files whose names start with `a` or `b`.

<details><summary>Show answer</summary>

```sh
ls /usr/bin/[ab]*
```

A character class for the first character; `*` for the rest.
</details>

---

## 7. Real-world sysadmin scenario

**Friday log-cleanup.** Your retention policy says "keep app logs for 30 days, keep audit logs for a year." A naive `rm /var/log/myapp/*.log` would nuke them all. Better:

```sh
ls /var/log/myapp/                              # see what's there
ls /var/log/myapp/*.log.{1..30}.gz              # files rotated 1-30 days ago
find /var/log/myapp/ -name '*.log.*.gz' -mtime +30 -print   # confirm via find
find /var/log/myapp/ -name '*.log.*.gz' -mtime +30 -delete  # actually delete
```

Globs are great when the *naming* makes the answer obvious. When the criterion is *age*, `find` is better than a glob (module 10).

Another classic — rolling out a config to many hosts:

```sh
for host in web-{01..09}.prod.example.com; do
  scp nginx.conf "$host":/etc/nginx/
done
```

`web-{01..09}` brace-expands to nine zero-padded hostnames in one stroke. That same pattern with raw typing is where typos breed.

---

## 8. What to remember

- The **shell** does the matching, not the command.
- `*` = any string (not crossing `/`), `?` = one char, `[abc]` = one of a set, `[a-z]` = range, `[!abc]` = not in set.
- `{a,b,c}` is brace expansion — different from globbing, doesn't need files to exist.
- Globs are not regex. Different syntax, different meaning.
- Quote your patterns when you want them *not* expanded.
- For recursive or attribute-based matching, reach for `find` (module 10).

---

## 9. Next

You can match files. Now let's read what's inside them.

➡ [`05-viewing-text.md`](05-viewing-text.md) — `cat`, `less`, `head`, `tail`, `wc`, and the art of looking before you act.
