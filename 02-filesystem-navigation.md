# 02 — The filesystem and how to move through it

> *Prerequisites:* you have a working shell (`00-orientation.md`, `01-shell-and-ssh.md`).
> *Maps to:* NCS 205 Lab 2, parts of Lab 5.

---

## 1. Why this matters

In Linux, **everything is a file** — your text documents, your hard drives, your network sockets, even running processes are represented somewhere in the filesystem. If you can navigate it confidently, you can administer the box. If you get lost, you start typing destructive commands in the wrong directory. Most "I accidentally deleted prod" stories start with someone who didn't know where they were.

---

## 2. Mental model

Linux has **one filesystem tree**, rooted at `/`. There are no drive letters (`C:\`, `D:\`) — every storage device, USB stick, or network share is *grafted onto* a directory under `/`.

```
/
├── bin        →  user binaries (ls, cp, ...)
├── etc        →  configuration files
├── home       →  user home directories
│   └── you
├── opt        →  optional/third-party software
├── root       →  the root user's home (yes, separate)
├── tmp        →  scratch space, wiped on reboot
├── usr        →  most installed programs and libs
├── var        →  variable data: logs, mail, caches
└── ...
```

This layout is called the **Filesystem Hierarchy Standard (FHS)**. Every Linux distro mostly follows it. Learning it is like learning street names: once you know where logs live (`/var/log`) and where config files live (`/etc`), you'll know where to look without asking.

### Two ways to name a file: absolute vs relative

- **Absolute path** — starts with `/`. Unambiguous, works from anywhere.
  Example: `/etc/passwd`
- **Relative path** — starts *anywhere else*. Means "from where I currently am."
  Example: `passwd` means "in my current dir." `../passwd` means "in the parent."

Mentally: an absolute path is a street address. A relative path is "two blocks that way."

### Three shortcuts you'll use every day

| Symbol | Meaning |
|---|---|
| `~` | Your home directory (e.g. `/home/you`). `~/notes` means `/home/you/notes`. |
| `.` | The current directory. `./script.sh` runs the script in this dir. |
| `..` | The parent directory. `cd ..` goes up one level. |

> **Mentor note:** `./script.sh` and `script.sh` are *not* the same. Without `./`, the shell looks in `PATH` only. With `./`, you're explicitly telling it "right here." We'll cover `PATH` in module 15.

### Dotfiles

Filenames that begin with `.` are **hidden** — `ls` won't show them by default. This is a convention, not a permission: anyone can list them with `ls -a`. Most config files in your home directory are dotfiles (`.bashrc`, `.ssh/`, `.gitconfig`).

---

## 3. Core commands

| Command | What it does |
|---|---|
| `pwd` | Print working directory (where am I?). |
| `cd <path>` | Change directory. |
| `cd` (no args) | Go home (`~`). |
| `cd -` | Go to the **previous** directory you were in. |
| `cd ..` | Go up one level. |
| `cd ../..` | Up two levels. |
| `ls` | List directory contents. |
| `ls -a` | Include dotfiles. |
| `ls -l` | Long format (perms, owner, size, time). |
| `ls -la` / `ls -al` | Both. |
| `ls -ld <dir>` | Show info about the directory itself, not its contents. |
| `tree` | Visualize the directory tree (install with apt/dnf). |
| `stat <file>` | Detailed metadata: inode, size, all three timestamps. |
| `file <file>` | Tell you what *kind* of file something is. |

---

## 4. Guided walkthrough

```sh
cd                   # go home
pwd                  # confirm we're in /home/you
ls                   # what's here?
ls -a                # include dotfiles — many more!
cd /etc              # absolute path; jump to /etc
pwd                  # /etc
cd ..                # up one level
pwd                  # /
cd -                 # back to /etc (cd - is "previous dir")
ls -l /etc/passwd    # long listing of one file
file /etc/passwd     # "ASCII text"
file /bin/ls         # "ELF 64-bit LSB executable..."
```

Now create a sandbox to play in:

```sh
cd ~
mkdir -p playground/a/b/c
cd playground/a/b/c
pwd                       # /home/you/playground/a/b/c
cd ../..                  # up two levels
pwd                       # /home/you/playground/a
cd ~                      # all the way home
pwd
```

Use **Tab completion** the whole time. `cd /e<Tab>` should complete `/etc/`.

---

## 5. Gotchas

- **`cd` with no arguments goes home.** Not "stay where you are." If you wanted to be a no-op, just press Enter.
- **`cd -` is the back button.** It toggles between the last two directories. Insanely useful when bouncing between `/var/log` and `/etc/nginx`.
- **`cd ~user`** — that's another user's home (e.g. `cd ~root` if you have permission). `cd ~` alone is *your* home.
- **Trailing slashes don't matter for `cd`** but matter for `cp` and `rsync`. `cp dir1 dir2` vs `cp dir1/ dir2/` can behave differently. We'll see that in module 03.
- **Spaces and special chars in paths.** Quote them: `cd "My Documents"` or escape: `cd My\ Documents`. Most server paths avoid spaces precisely to prevent this hassle.
- **You can `cd` into a directory you can't `ls`.** Different permissions (`x` vs `r`). Module 07 covers this.

---

## 6. On-the-spot exercises

**E2.1** — You are in `/var/log`. In *one command*, get to `/etc/nginx/conf.d/` using an absolute path.

<details><summary>Show answer</summary>

```sh
cd /etc/nginx/conf.d/
```

The trailing `/` is optional. The point: absolute paths work the same no matter where you start.
</details>

**E2.2** — You are in `/etc/nginx/conf.d/`. Get to `/etc/nginx/` using a *relative* path.

<details><summary>Show answer</summary>

```sh
cd ..
```

Going *up* is one of the most common operations. Don't always reach for the absolute path when `..` does it.
</details>

**E2.3** — What's the difference between `cd ~`, `cd`, and `cd $HOME`?

<details><summary>Show answer</summary>

Nothing — all three go to your home directory. `~` is shell-expanded to `$HOME` before `cd` ever sees it. `cd` with no args defaults to `$HOME`. They are three idioms for the same action.
</details>

**E2.4** — Run `ls` in your home directory. Now run `ls -a`. Pick one dotfile and explain what it's for. (`man <name>` or `head <name>` might help.)

<details><summary>Show answer</summary>

Common ones:
- `.bashrc` — runs every time you start an interactive non-login shell. Where you put aliases.
- `.profile` / `.bash_profile` — runs at *login*. Where you put `PATH` exports.
- `.ssh/` — your SSH keys, known hosts, and config.
- `.viminfo` — vim's history.
- `.lesshst` — `less`'s search history.

Knowing that *every dotfile is a config file* will help you a lot in module 15.
</details>

**E2.5** — You're at the prompt `you@box:/var/log/nginx$`. Without running `pwd`, what directory are you in?

<details><summary>Show answer</summary>

`/var/log/nginx`. The bit between `:` and `$` is your current directory. Your prompt is doing free `pwd` for you — that's why customizing your prompt is worth a few minutes (module 15).
</details>

**E2.6** — From your home directory, list the contents of `/tmp/` without changing into it.

<details><summary>Show answer</summary>

```sh
ls /tmp/
```

`ls` accepts a path argument — you don't have to `cd` first. This habit alone will speed you up massively.
</details>

**E2.7** — Make a directory tree `~/work/2026/may/` in *one* command.

<details><summary>Show answer</summary>

```sh
mkdir -p ~/work/2026/may/
```

`-p` means "create parents as needed, don't error if they exist." Without `-p`, `mkdir` errors if `~/work` doesn't already exist.
</details>

---

## 7. Real-world sysadmin scenario

**3 AM page.** "Database server is offline." You SSH in. The on-call wiki says config is "somewhere under `/etc`." Where do you look?

```sh
ls /etc | grep -i mysql        # likely candidates
ls /etc | grep -i postgres
ls /etc/systemd/system/*.service | head -10
```

You find `/etc/mysql/`. Inside:

```sh
cd /etc/mysql/
ls
file my.cnf                   # "ASCII text"
ls -la                        # check perms — root? readable?
```

Without changing directory, you peek at the log:

```sh
tail /var/log/mysql/error.log
```

In 60 seconds you've located the config, confirmed it's a normal text file, and read the most recent errors — without ever leaving the shell or guessing. **That's filesystem fluency.**

---

## 8. What to remember

- One tree. Root is `/`. No drive letters.
- Absolute paths start with `/`, relative paths don't.
- `~` is home. `.` is here. `..` is parent. `cd -` is back.
- Dotfiles are hidden by convention. `ls -a` shows them.
- Use **Tab completion** every single time. It's not a luxury, it's a safety net.

---

## 9. Next

You can navigate. Now let's get good at *inspecting and managing* what you find — copy, move, link, delete, all safely.

➡ [`03-listing-and-files.md`](03-listing-and-files.md) — Listing options, file operations, and not deleting prod.
