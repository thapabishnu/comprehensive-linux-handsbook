# 08 — Redirection and pipes

> *Maps to:* NCS 205 Lab 19.

---

## 1. Why this matters

Unix's superpower isn't any one tool — it's that small tools **compose**. The mechanism that makes them composable is **redirection** (sending a program's input or output to a file) and **piping** (sending one program's output directly into another's input). Once you internalize the three standard streams and the operators that bend them, you stop seeing commands as isolated and start seeing pipelines.

---

## 2. Mental model

Every program has three open file descriptors by default:

| FD | Name | Default destination |
|---|---|---|
| `0` | **stdin** (standard input) | Your keyboard |
| `1` | **stdout** (standard output) | Your terminal |
| `2` | **stderr** (standard error) | Your terminal |

You can redirect any of them:

```
    program  ──1──►  stdout       │  redirect with  >   >>
    program  ──2──►  stderr       │  redirect with  2>  2>>
    program  ◄──0──  stdin        │  redirect with  <
```

And you can wire one program's stdout into another's stdin — that's the pipe:

```
    cmd1  ──1──►  ──0──►  cmd2  ──1──►  ──0──►  cmd3
                  pipe              pipe
```

Two huge insights:

1. **stdout and stderr are separate.** A command that fails *quietly* on the terminal is often complaining loudly on stderr — you just merged them so you don't notice. To see them apart: `cmd > out 2> err`.
2. **Pipes only connect stdout to stdin.** If you want stderr in the pipeline too, you have to merge it first: `cmd 2>&1 | next`.

---

## 3. Core operators

| Operator | Effect |
|---|---|
| `cmd > file` | stdout → file (overwrite) |
| `cmd >> file` | stdout → file (append) |
| `cmd 2> file` | stderr → file |
| `cmd 2>> file` | stderr append |
| `cmd > out 2> err` | split stdout and stderr to separate files |
| `cmd > file 2>&1` | both to same file (note: order matters!) |
| `cmd &> file` | bash shorthand for `> file 2>&1` |
| `cmd 2>&1 \| next` | feed both streams into the pipeline |
| `cmd < file` | read stdin from a file |
| `cmd1 \| cmd2` | stdout of cmd1 → stdin of cmd2 |
| `cmd \| tee file` | print to terminal **and** save to file |
| `cmd \| tee -a file` | same, but append |
| `cmd > /dev/null` | discard stdout |
| `cmd 2> /dev/null` | discard stderr (useful with `find` to skip "Permission denied") |
| `cmd >/dev/null 2>&1` | discard everything (the classic "silence" idiom) |

> **Mentor note:** `2>&1` says "send fd 2 to wherever fd 1 currently goes." That's why `cmd > file 2>&1` works but `cmd 2>&1 > file` does not — in the second form, `2>&1` is set up *before* `>` moves fd 1, so stderr still ends up on the terminal.

---

## 4. Guided walkthrough

```sh
# stdout to a file
echo "hello" > greeting.txt
cat greeting.txt

# overwrite
echo "again" > greeting.txt
cat greeting.txt           # only "again"

# append
echo "and again" >> greeting.txt
cat greeting.txt

# stderr separately
ls /nonexistent 2> errors.log
cat errors.log

# merge both streams
ls /etc /nonexistent > combined.log 2>&1
cat combined.log

# discard noise
find / -name passwd 2>/dev/null | head -5

# piping
ls /etc | wc -l            # how many entries in /etc?
ls -lt /var/log | head -5  # 5 most recently modified logs

# tee — see and save
echo "deployed" | tee -a /tmp/deploy.log

# input redirection
wc -l < /etc/passwd        # same lines, but wc reads from a redirected stdin
```

Try this drill: count how many of your `man` pages are in section 5 (file formats):

```sh
man -k . 2>/dev/null | grep '(5)' | wc -l
```

That's a three-stage pipeline doing real work in a single line.

---

## 5. Gotchas

- **`>` truncates instantly.** Even if the command fails. `echo > important.txt` *empties* `important.txt` *before* `echo` runs. Use `>>` if you mean append, and `set -o noclobber` (then `>|` to force) in scripts.
- **The order of `>` and `2>&1`.** Always put `2>&1` *after* `> file`. Otherwise stderr won't follow stdout into the file.
- **`tee` doesn't capture stderr.** `cmd | tee log` only tees stdout. To tee both: `cmd 2>&1 | tee log`.
- **Pipelines run in parallel.** `cmd1 | cmd2` doesn't wait for cmd1 to finish — both run, with the pipe acting as a streaming buffer. For very large input this is fine; for ordered processing keep that in mind.
- **Exit codes in pipelines.** By default the pipeline's exit code is `cmd2`'s. To check cmd1 failed: `set -o pipefail` (in bash) makes the pipeline fail if *any* stage fails. Critical for scripts.
- **Reading from `/dev/stdin` vs `-`.** Many tools accept `-` as a filename meaning "read from stdin." Some don't. RTM if unsure.

---

## 6. On-the-spot exercises

**E8.1** — Save the output of `ls /etc` to a file called `etc-listing.txt`.

<details><summary>Show answer</summary>

```sh
ls /etc > etc-listing.txt
```
</details>

**E8.2** — Append today's date to `~/work.log`.

<details><summary>Show answer</summary>

```sh
date >> ~/work.log
```

`>>` (not `>`!) — otherwise you'd overwrite the log.
</details>

**E8.3** — Run `ls /etc /nope` and put the listing in `out.txt`, the errors in `err.txt`.

<details><summary>Show answer</summary>

```sh
ls /etc /nope > out.txt 2> err.txt
```
</details>

**E8.4** — Same command, but combine *everything* into `all.log`.

<details><summary>Show answer</summary>

```sh
ls /etc /nope > all.log 2>&1
# or bash shorthand:
ls /etc /nope &> all.log
```
</details>

**E8.5** — Count how many `.conf` files are directly under `/etc/`.

<details><summary>Show answer</summary>

```sh
ls /etc/*.conf | wc -l
```

You're using globbing (mod 04) + a pipe + `wc`.
</details>

**E8.6** — Show all 200 responses from the access.log sandbox, then count them.

<details><summary>Show answer</summary>

```sh
grep ' 200 ' ~/ncs205-sandbox/text/access.log
grep ' 200 ' ~/ncs205-sandbox/text/access.log | wc -l
```

Or chain into one display:

```sh
grep ' 200 ' ~/ncs205-sandbox/text/access.log | tee /tmp/200s.log | wc -l
```

`tee` lets you save the matches AND print the count.
</details>

**E8.7** — Discard `find`'s noisy "Permission denied" errors while searching `/etc` for files containing "host" in the name.

<details><summary>Show answer</summary>

```sh
find /etc -name '*host*' 2>/dev/null
```

`2>/dev/null` is the classic noise filter. `/dev/null` is the bit bucket — anything sent there is destroyed.
</details>

**E8.8** — Without using `cat`, send the contents of `~/ncs205-sandbox/text/names.txt` into `wc -l`.

<details><summary>Show answer</summary>

```sh
wc -l < ~/ncs205-sandbox/text/names.txt
```

`<` redirects the file in as stdin. You can also just give `wc` the filename — but `<` is the *redirection* form, which is what the exercise is asking for.
</details>

**E8.9** — Build a one-liner: "the 3 most active IPs in the access log."

<details><summary>Show answer</summary>

```sh
awk '{print $1}' ~/ncs205-sandbox/text/access.log \
  | sort | uniq -c | sort -rn | head -3
```

That's 5 stages: extract field, sort to group, count duplicates, sort numerically descending, take top 3. We'll meet `awk` properly in module 13. The point: a problem too gnarly for any single command is trivial with a pipeline.
</details>

---

## 7. Real-world sysadmin scenario

**Long-running deploy script.** A teammate writes a script that runs for 20 minutes and you want to know:

1. Did it succeed?
2. What did it print?
3. Were there any errors that didn't make it to the visible output?

```sh
./deploy.sh > /tmp/deploy.out 2> /tmp/deploy.err
echo "Exit: $?"
```

If `$?` is `0`, success. The two files contain stdout and stderr separately. If you wanted to *watch* in real time AND keep a record:

```sh
./deploy.sh 2>&1 | tee /tmp/deploy.log
echo "Pipeline exit: ${PIPESTATUS[0]}"
```

`PIPESTATUS[0]` gives the *first* stage's exit code (the deploy script). Without that, `$?` would only tell you that `tee` succeeded — which is almost always true. This is the kind of detail that distinguishes "I ran the script" from "I ran the script *and know whether it worked*."

---

## 8. What to remember

- Three streams: stdin (0), stdout (1), stderr (2). Memorize the numbers.
- `>` overwrites, `>>` appends. `2>` for stderr.
- `2>&1` after the stdout redirect, never before.
- `|` connects stdout → stdin. Use `2>&1 |` to pipe both streams.
- `tee` shows AND saves. `/dev/null` is the silence switch.
- In scripts, `set -o pipefail` and `${PIPESTATUS[@]}` are how you check pipeline failures.

---

## 9. Next

You can route data. Now let's filter it by pattern.

➡ [`09-grep-and-regex.md`](09-grep-and-regex.md) — grep, regex, and reading text like a sysadmin.
