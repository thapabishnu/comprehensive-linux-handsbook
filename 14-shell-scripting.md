# 14 — Shell scripting

> *Maps to:* NCS 205 Labs 51–55.

---

## 1. Why this matters

A shell script is a one-liner that **kept its job**. Every recurring task — daily backups, log rollups, deploy sequences, the cron job that emails the team a Friday report — is someone's shell script. Writing a clean, defensive, portable script is one of the highest-leverage skills in this whole guide. Five hundred lines of Python will be replaced; a tight 30-line bash script lives for a decade.

---

## 2. Mental model

A shell script is just a file the shell reads top to bottom. Same syntax as the prompt. The shebang on line 1 picks the interpreter:

```sh
#!/bin/bash
# this is bash
set -euo pipefail
echo "hello"
```

- `#!/bin/bash` — run with bash.
- `#!/bin/sh` — run with the POSIX shell (more portable; some bash features unavailable).
- `set -e` — exit on the first error.
- `set -u` — error on unset variables.
- `set -o pipefail` — a pipeline fails if any stage fails.

`set -euo pipefail` on line 2 is the single biggest improvement most scripts could get. It turns silent failures into loud ones.

---

## 3. Core building blocks

### Variables and quoting

```sh
name="Sarah"
echo "Hello, $name"            # "Hello, Sarah"
echo 'Hello, $name'            # 'Hello, $name'   ← single quotes don't expand
echo "Hello, ${name}!"         # braces disambiguate

# Command substitution
today=$(date +%F)
echo "Today is $today"

# Math (bash)
count=$((3 + 4))
```

**Quote your variables.** `"$file"` not `$file`. Otherwise a filename with a space becomes two arguments.

### Conditionals

```sh
if [[ -f /etc/hosts ]]; then
  echo "exists"
elif [[ -d /etc ]]; then
  echo "/etc is a dir"
else
  echo "neither"
fi

# String comparison
[[ "$name" == "Sarah" ]] && echo "hi Sarah"

# Numeric comparison
(( count > 5 )) && echo "big"
```

`[[ ... ]]` is bash's improved test. Use it over the old `[ ... ]` when you can.

Common file tests:

| Test | True if |
|---|---|
| `-e f` | exists |
| `-f f` | regular file |
| `-d f` | directory |
| `-r f` | readable |
| `-w f` | writable |
| `-x f` | executable |
| `-s f` | non-empty |
| `f1 -nt f2` | f1 newer than f2 |

### Loops

```sh
# for over a list
for h in web-01 web-02 web-03; do
  echo "$h"
done

# for over glob (carefully)
for log in /var/log/*.log; do
  [[ -f "$log" ]] || continue
  echo "$log"
done

# while reading lines
while IFS= read -r line; do
  echo "got: $line"
done < /etc/hostname

# numeric C-style
for ((i=1; i<=5; i++)); do echo $i; done
```

### Arguments and exit codes

```sh
#!/bin/bash
set -euo pipefail

# Positional args
echo "script: $0"
echo "first arg: $1"
echo "all args: $@"
echo "count: $#"

# Defaults
: "${TIMEOUT:=30}"
echo "timeout is $TIMEOUT"

# Functions
greet() {
  local who="$1"
  echo "hi, $who"
}
greet "world"

# Exit codes
exit 0      # success
exit 1      # general failure
# 0 = success, anything else = failure
```

Inspect the previous command's exit code with `$?`.

```sh
mycmd
if (( $? != 0 )); then
  echo "mycmd failed"
fi
```

### Useful idioms

```sh
# default if unset
: "${LOG:=/tmp/script.log}"

# log to both file and stdout
exec > >(tee -a "$LOG") 2>&1

# trap cleanup on exit
cleanup() {
  rm -f /tmp/myscript.$$.tmp
}
trap cleanup EXIT

# require root
[[ $EUID -eq 0 ]] || { echo "must run as root" >&2; exit 1; }

# require a command exists
command -v jq >/dev/null 2>&1 || { echo "needs jq"; exit 1; }
```

---

## 4. Guided walkthrough

Make a real script — `~/bin/dailyreport.sh`. Create the dir if needed.

```sh
mkdir -p ~/bin
cat > ~/bin/dailyreport.sh <<'EOF'
#!/bin/bash
set -euo pipefail

# === defaults ===
: "${LOG_DIR:=/var/log}"
: "${OUT_FILE:=$HOME/daily-$(date +%F).txt}"

# === main ===
{
  echo "Daily report — $(date)"
  echo "host: $(hostname)"
  echo
  echo "## disk usage"
  df -h | grep -E '^/dev|Filesystem'
  echo
  echo "## top 5 largest files in $LOG_DIR"
  sudo find "$LOG_DIR" -type f -size +1M -printf '%s %p\n' 2>/dev/null \
    | sort -rn | head -5 \
    | awk '{ printf "  %6.1fM  %s\n", $1/1024/1024, $2 }'
  echo
  echo "## recent failed logins"
  sudo lastb -n 5 2>/dev/null || echo "  (lastb unavailable)"
} > "$OUT_FILE"

echo "wrote $OUT_FILE"
EOF

chmod +x ~/bin/dailyreport.sh
~/bin/dailyreport.sh
cat ~/daily-*.txt
```

Read every line. `{ ... } > file` is **command grouping with redirection** — every command inside the braces writes to the same file. That's how you build small "section-based" reports.

---

## 5. Gotchas

- **Word splitting on unquoted variables.** `cp $file /tmp/` breaks if `$file` has a space. Always `cp "$file" /tmp/`.
- **`==` vs `=`.** Inside `[[ ... ]]`, both work for equality. Inside `[ ... ]` (legacy), only `=` is portable.
- **`[[ ... ]]` is bash.** Not POSIX `sh`. If your shebang is `#!/bin/sh`, use `[ ... ]`.
- **`set -e` doesn't catch errors inside `if`/`||`/`&&`.** This is by design (so you can test commands), but surprises beginners.
- **Pipes mask errors.** `cmd1 | cmd2` exit code is cmd2's. Use `set -o pipefail` and check `${PIPESTATUS[@]}`.
- **`$IFS` controls splitting.** When reading line-by-line, set `IFS=` so leading whitespace isn't stripped: `while IFS= read -r line; do ...`.
- **`bash -n script.sh`** is a syntax check without running. Use it before deploying.
- **`shellcheck`** is the script-linter you should install. It catches 90% of bash bugs *before* you ship. Get it: `sudo apt install shellcheck`.

> **Mentor habit:** every non-trivial script should start with `#!/bin/bash`, `set -euo pipefail`, a usage function, and a top-of-file comment explaining what it does. Ten extra seconds; pays for itself the first time you come back to it six months later.

---

## 6. On-the-spot exercises

**E14.1** — Write a script `~/bin/hello.sh` that prints "hello from <hostname>" and exits 0. Make it executable.

<details><summary>Show answer</summary>

```sh
cat > ~/bin/hello.sh <<'EOF'
#!/bin/bash
echo "hello from $(hostname)"
EOF
chmod +x ~/bin/hello.sh
~/bin/hello.sh
```
</details>

**E14.2** — Extend it: if a name is passed as `$1`, greet that name; otherwise greet "world."

<details><summary>Show answer</summary>

```sh
#!/bin/bash
who="${1:-world}"
echo "hello, $who, from $(hostname)"
```

`${1:-world}` = "use $1 if set, otherwise default to 'world'." Bash's parameter expansion is one of the underused superpowers.
</details>

**E14.3** — Write a script that takes a directory and prints how many `.log` files it contains. Error out if the directory doesn't exist.

<details><summary>Show answer</summary>

```sh
#!/bin/bash
set -euo pipefail

dir="${1:-}"
[[ -d "$dir" ]] || { echo "usage: $0 <dir>" >&2; exit 1; }

count=$(find "$dir" -maxdepth 1 -name '*.log' -type f | wc -l)
echo "$count .log files in $dir"
```
</details>

**E14.4** — Write a one-liner that prints "OK" if `/etc/hostname` exists and is readable, else "MISSING".

<details><summary>Show answer</summary>

```sh
[[ -r /etc/hostname ]] && echo OK || echo MISSING
```

Two file tests in one shot via `&& ... || ...`. Concise; watch out — if the `&&` branch fails too, `||` still fires.
</details>

**E14.5** — Loop over every user in `/etc/passwd` and print "username -> home".

<details><summary>Show answer</summary>

```sh
while IFS=':' read -r user _ _ _ _ home _; do
  echo "$user -> $home"
done < /etc/passwd
```

`IFS=':'` lets the line split on colons. `_` is the conventional name for "I don't care about this field."
</details>

**E14.6** — Backup helper: copy a file to `<file>.bak.YYYY-MM-DD`. Refuse if the source doesn't exist.

<details><summary>Show answer</summary>

```sh
#!/bin/bash
set -euo pipefail

src="${1:-}"
[[ -f "$src" ]] || { echo "usage: $0 <file>" >&2; exit 1; }

dst="${src}.bak.$(date +%F)"
cp -p "$src" "$dst"
echo "backup: $dst"
```

`cp -p` preserves perms and timestamps.
</details>

**E14.7** — Write a function `confirm` that prompts "Continue? [y/N]" and exits non-zero unless the answer is `y` or `Y`.

<details><summary>Show answer</summary>

```sh
confirm() {
  read -r -p "Continue? [y/N] " ans
  [[ "$ans" =~ ^[yY]$ ]]
}

confirm && echo "going!" || { echo "abort"; exit 1; }
```

`=~` is bash's regex match operator inside `[[ ... ]]`.
</details>

**E14.8** — Run `shellcheck` on your `dailyreport.sh` (install if needed) and fix anything it flags.

<details><summary>Show answer</summary>

```sh
sudo apt install -y shellcheck
shellcheck ~/bin/dailyreport.sh
```

shellcheck will point out quoting issues, unset variables, command substitution warnings — listen to it. The few things it can't fix are usually noted with `# shellcheck disable=SCxxxx` comments.
</details>

---

## 7. Real-world sysadmin scenario

**Your team needs a "before I deploy" preflight script.** It must:

1. Confirm the user is on the deploy box (not their laptop).
2. Confirm there's a clean git working tree.
3. Run tests.
4. Refuse to continue if any of the above fail.

```sh
#!/bin/bash
# preflight.sh — gate before deploy
set -euo pipefail

EXPECTED_HOST="deploy-01.prod"

# 1. host check
[[ "$(hostname)" == "$EXPECTED_HOST" ]] || {
  echo "ERROR: must run on $EXPECTED_HOST, you're on $(hostname)" >&2
  exit 1
}

# 2. clean working tree
cd /srv/app
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: working tree is dirty" >&2
  git status --short
  exit 2
fi

# 3. tests
if ! ./run-tests.sh; then
  echo "ERROR: tests failed" >&2
  exit 3
fi

echo "OK — preflight passed at $(date -Iseconds)"
```

This 25-line script has saved real deployments. Note the **distinct exit codes** — your wrapper (`Makefile`, CI step, etc.) can decide what to do based on *which* check failed.

---

## 8. What to remember

- Top of every script: `#!/bin/bash` and `set -euo pipefail`.
- **Quote your variables.** Always.
- `[[ ... ]]` for tests in bash; `(( ... ))` for math.
- `${VAR:-default}`, `${VAR:?error}`, `${VAR%suffix}` — learn parameter expansion gradually; it's powerful.
- `trap cleanup EXIT` for cleanup on exit (success or failure).
- Run `shellcheck` on every script you write.
- Define exit codes deliberately — they're your script's API.

---

## 9. Next

Scripts run inside an environment. Let's tune it.

➡ [`15-env-and-startup.md`](15-env-and-startup.md) — `PATH`, aliases, startup files.
