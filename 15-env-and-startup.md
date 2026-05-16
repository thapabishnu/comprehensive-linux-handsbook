# 15 — Environment, PATH, and startup files

> *Maps to:* NCS 205 Lab 56.

---

## 1. Why this matters

Every shell session inherits an **environment** — a set of named variables (`PATH`, `HOME`, `LANG`, `EDITOR`, etc.) — and runs **startup files** that set aliases, exports, and prompt customizations. When "the command isn't found" or "it works in my shell but not in cron," the answer is almost always in this layer. Once you understand which file gets read when, the mystery disappears.

---

## 2. Mental model

The shell has two big knobs:

- **Environment variables** — name/value pairs exported to *child* processes (e.g. `PATH`, `HOME`, `LANG`). View with `env`. Set with `export NAME=value`.
- **Shell variables** — set in the current shell only, not exported (e.g. `MYVAR=hello` without `export`).

A subshell *inherits* env vars but cannot change its parent's. Crucial:

```
parent shell  → spawns child  → child can read env, change its own, but NOT modify parent
```

That's why `cd` in a script doesn't change your interactive directory.

### Startup file order

When you launch a shell, bash reads different files depending on *how* it was started:

| Shell type | Files read (in order) |
|---|---|
| **Login shell** (SSH, first console) | `/etc/profile` → `/etc/profile.d/*.sh` → first found: `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| **Interactive non-login** (new terminal in GUI) | `/etc/bash.bashrc` → `~/.bashrc` |
| **Non-interactive** (script run by `bash script.sh`) | only `$BASH_ENV` if set |

This is why a `PATH` export in `~/.bashrc` works in your terminal but not under cron — cron's bash is *non-interactive*, doesn't read `~/.bashrc`.

The common practical pattern:

- Put **exports** (`PATH`, language settings) in `~/.profile` or `~/.bash_profile`.
- Put **aliases and functions** in `~/.bashrc`.
- Make `~/.bash_profile` source `~/.bashrc` so they're available in login shells too:

```sh
# ~/.bash_profile
[ -r ~/.bashrc ] && . ~/.bashrc
```

---

## 3. Core commands

| Command | What it does |
|---|---|
| `env` | Show all environment variables |
| `printenv NAME` | Show one |
| `export NAME=value` | Set + export to children |
| `unset NAME` | Remove it |
| `alias` | List aliases |
| `alias ll='ls -la'` | Define one |
| `unalias ll` | Remove |
| `type cmd` | What does the shell think `cmd` is? Alias / function / builtin / file. |
| `which cmd` | Find the file in `$PATH` |
| `command -v cmd` | Same idea; portable; works for aliases too |
| `hash` | Cached path lookups (clear with `hash -r`) |

### Most-used environment variables

| Variable | Purpose |
|---|---|
| `PATH` | Colon-separated dirs where the shell looks for commands |
| `HOME` | Your home directory |
| `USER` / `LOGNAME` | Your username |
| `SHELL` | Your login shell |
| `EDITOR` / `VISUAL` | Default editor (used by `git commit`, `crontab -e`) |
| `LANG` / `LC_ALL` | Locale — affects sort, date formatting, etc. |
| `TERM` | Terminal type — affects colors, screen drawing |
| `TMPDIR` | Where tools write tempfiles (default `/tmp`) |
| `PS1` | Your interactive prompt format |

---

## 4. Guided walkthrough

```sh
# inspect
env | head -10
echo "$PATH"
echo "$HOME"
type cat
type ll        # probably "not found"
which ls
command -v ls

# add a personal bin dir
mkdir -p ~/bin
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.profile
# in a NEW shell:
source ~/.profile
which mytool   # nothing yet — but the dir is on PATH

cat > ~/bin/mytool <<'EOF'
#!/bin/bash
echo "mytool says: $@"
EOF
chmod +x ~/bin/mytool
hash -r        # clear path lookup cache
mytool hi      # works anywhere now

# aliases
echo "alias ll='ls -la --color=auto'" >> ~/.bashrc
echo "alias ..='cd ..'" >> ~/.bashrc
. ~/.bashrc
ll
type ll        # "ll is aliased to ..."

# differentiate login vs non-login
bash -lc 'echo PATH=$PATH'        # login shell — reads ~/.profile
bash -c  'echo PATH=$PATH'        # non-login — reads ~/.bashrc only if interactive
```

> **Mentor note:** never put `cd` or anything *interactive* into your `~/.profile`. SSH-key login can fail silently if a startup file prints to stdout (some tools parse that output). Keep startup files quiet.

---

## 5. Gotchas

- **Cron's environment is minimal.** `PATH` is just `/usr/bin:/bin`. If your script uses tools in `/usr/local/bin` or `~/bin`, it'll fail with "command not found" under cron. Either set `PATH` in your script or use absolute paths.
- **`~/.bashrc` only runs in interactive non-login shells.** `~/.bash_profile` only in login. Have one source the other to avoid double-config.
- **`source` (or `.`) runs in the *current* shell.** `bash script.sh` runs in a *new* shell. Variables set inside a script don't survive — unless you `source` the script.
- **`PATH` ordering matters.** First match wins. Put `$HOME/bin` *before* `/usr/bin` if you want to override.
- **Don't put **`./` in `PATH`.** Running random commands from the current directory is a classic privilege-escalation vector.
- **`unset` doesn't run `unexport`.** Once exported, you can shadow with `local` in functions, but for a true unset use `unset NAME`.
- **`alias` doesn't take arguments.** Use a function. `alias gco='git checkout'` works; `alias mkcd='mkdir $1 && cd $1'` does NOT — the `$1` is literal.

---

## 6. On-the-spot exercises

**E15.1** — Find the full path of the `python3` command.

<details><summary>Show answer</summary>

```sh
which python3
# or
command -v python3
```
</details>

**E15.2** — Print your current `PATH` so each directory is on its own line.

<details><summary>Show answer</summary>

```sh
echo "$PATH" | tr ':' '\n'
```
</details>

**E15.3** — Add `~/scripts` to your `PATH` permanently for login shells.

<details><summary>Show answer</summary>

```sh
echo 'export PATH="$HOME/scripts:$PATH"' >> ~/.profile
# new login or:
source ~/.profile
```
</details>

**E15.4** — Make `vim` your default editor system-wide for *your* user.

<details><summary>Show answer</summary>

```sh
echo 'export EDITOR=vim' >> ~/.profile
echo 'export VISUAL=vim' >> ~/.profile
```

Two vars because some tools check one or the other. Git, crontab, sudoedit all honor `$EDITOR` (and `$VISUAL` when present).
</details>

**E15.5** — Set an alias `g=git` permanently for interactive use.

<details><summary>Show answer</summary>

```sh
echo "alias g='git'" >> ~/.bashrc
. ~/.bashrc
g status
```
</details>

**E15.6** — Write an alias-like *function* `mkcd` that creates a directory and `cd`s into it.

<details><summary>Show answer</summary>

```sh
mkcd() { mkdir -p "$1" && cd "$1"; }
# put in ~/.bashrc to make it permanent
echo 'mkcd() { mkdir -p "$1" && cd "$1"; }' >> ~/.bashrc
```

Functions take arguments; aliases don't. That's the rule of thumb.
</details>

**E15.7** — Tell the shell to forget where it found `ls` (refresh the lookup cache).

<details><summary>Show answer</summary>

```sh
hash -r
```

Useful after installing a new version of a tool to a path that comes earlier in `$PATH`.
</details>

**E15.8** — In `~/.bashrc`, customize the prompt to show user@host and current dir.

<details><summary>Show answer</summary>

```sh
# basic example
export PS1='[\u@\h \W]\$ '
```

`\u` = username, `\h` = short hostname, `\W` = basename of cwd, `\w` = full cwd. Run `man bash` and search `/PROMPTING` for the full vocabulary.
</details>

---

## 7. Real-world sysadmin scenario

**"My cron job worked yesterday, fails today."** The cron entry: `*/5 * * * * /home/you/backup.sh`.

The script:

```sh
#!/bin/bash
set -euo pipefail
mytool --backup
```

In your shell, `mytool` is in `~/bin`. Cron doesn't read `~/.bashrc` or `~/.profile`, so its `PATH` is `/usr/bin:/bin`. The script can't find `mytool`. Fix: either absolute path, or set `PATH` inside the script:

```sh
#!/bin/bash
set -euo pipefail
export PATH="$HOME/bin:/usr/local/bin:/usr/bin:/bin"
mytool --backup
```

Or in the crontab itself:

```
PATH=/home/you/bin:/usr/local/bin:/usr/bin:/bin
*/5 * * * * /home/you/backup.sh
```

Either works. This *one* class of bug is responsible for an enormous fraction of "cron failures" — and once you know the rule, it stops costing you afternoons.

---

## 8. What to remember

- `PATH` is colon-separated; first match wins.
- Login shells read `~/.profile` (et al); interactive shells read `~/.bashrc`.
- Cron is non-interactive — set `PATH` explicitly in scripts.
- Aliases for shortcuts; **functions** when you need arguments.
- `type cmd` tells you exactly what the shell will run.
- Keep startup files quiet; never print to stdout.

---

## 9. Next

You've tuned your environment. Now let's manage *other* users.

➡ [`16-users-and-admin.md`](16-users-and-admin.md) — `/etc/passwd`, useradd, sudo, the privilege model.
