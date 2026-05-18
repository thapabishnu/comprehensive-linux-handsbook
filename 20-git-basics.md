# 20 — git for sysadmins


---

## 1. Why this matters

Git isn't only for developers. Every change you make to a config, every script you write, every dotfile you tweak — should be versioned. When a config worked yesterday and doesn't today, `git log` and `git diff` tell you exactly what changed and why. When you forget what the heck you were thinking last quarter, a good commit message saves you.

---

## 2. Mental model

A **repository** stores snapshots of a directory's state. Each snapshot is a **commit** with:

- A unique SHA-1 hash (40 hex characters, often abbreviated to 7).
- A pointer to the parent commit(s) — this is how history forms a chain.
- A snapshot of files at that moment.
- Author, timestamp, message.

A **branch** is a moveable pointer to a commit. `main` is just the conventional default branch. `HEAD` points to whichever commit/branch you're currently "on."

```
   commit C ──► commit B ──► commit A (root)
       ▲
     main, HEAD
```

Three "states" your files can be in:

| State | Means |
|---|---|
| **Working directory** | Files you can see and edit |
| **Staging area** (index) | Changes you've marked to be in the *next* commit |
| **Committed** | Snapshot saved permanently |

`git add` moves changes from working dir → staging. `git commit` moves staging → committed.

---

## 3. Core commands

### One-time setup

```sh
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global core.editor vim
```

### Daily flow

| Command | Effect |
|---|---|
| `git init` | Make the current dir a repo |
| `git clone URL` | Copy a remote repo locally |
| `git status` | What's changed; what's staged |
| `git diff` | Unstaged changes |
| `git diff --cached` | Staged changes |
| `git add file` | Stage a file |
| `git add -p` | Interactive — stage *parts* of a file |
| `git commit -m "msg"` | Commit staged changes |
| `git log` | History |
| `git log --oneline --graph` | Compact graph |
| `git log file` | History of one file |
| `git show <hash>` | Full diff of one commit |
| `git restore file` | Undo unstaged changes to a file |
| `git restore --staged file` | Unstage |

### Branching and remotes

| Command | Effect |
|---|---|
| `git branch` | List local branches |
| `git branch newbr` | Create branch |
| `git switch newbr` | Switch to it (`git checkout newbr` also works) |
| `git switch -c newbr` | Create + switch |
| `git merge other` | Merge `other` into current branch |
| `git remote -v` | List remotes |
| `git remote add origin URL` | Add remote |
| `git fetch` | Get remote changes (don't merge) |
| `git pull` | Fetch + merge |
| `git push` | Send local commits to remote |
| `git push -u origin main` | First push of a new branch |

### Inspecting and undoing

| Command | Effect |
|---|---|
| `git log -p file` | History + diffs of one file |
| `git blame file` | Who/when last changed each line |
| `git reflog` | Every HEAD move — your safety net |
| `git revert <hash>` | Create a *new* commit that undoes a previous one |
| `git reset HEAD~1` | Undo last commit, keep changes (soft) |
| `git reset --hard HEAD~1` | Undo last commit, **discard changes** (destructive) |

---

## 4. Guided walkthrough

```sh
# new repo
mkdir ~/configs && cd ~/configs
git init
echo "*.swp" > .gitignore
echo "alias ll='ls -la'" > bashrc-snippets.sh

git status                   # see "untracked"
git add .gitignore bashrc-snippets.sh
git status                   # see "to be committed"
git commit -m "initial: gitignore + first bash alias"

# make a change
echo "alias ..='cd ..'" >> bashrc-snippets.sh
git diff                     # see what changed
git add bashrc-snippets.sh
git commit -m "alias: add .. for cd .."

# history
git log --oneline
# 9a8b7c6 alias: add .. for cd ..
# 1f2e3d4 initial: gitignore + first bash alias

# inspect a specific change
git show 1f2e3d4              # use the short hash you saw

# blame
git blame bashrc-snippets.sh
```

### Pushing to GitHub (or any remote)

```sh
# on github.com, create an empty repo called "configs"
git remote add origin git@github.com:yourname/configs.git
git push -u origin main
```

After the `-u` (set upstream), future `git push` works without arguments.

> **Mentor habit:** small, focused commits. One concern per commit. `git add -p` lets you split a file's changes into multiple commits — invaluable for keeping history readable.

---

## 5. Gotchas

- **Don't commit secrets.** Once pushed, they're public *forever* even after deletion (history is preserved). Add to `.gitignore` *before* the first commit.
- **`git pull` is `fetch + merge`**, which can produce surprise merge commits. Some prefer `git pull --rebase` for a linear history.
- **`git reset --hard` and `git push --force` are destructive.** Coworkers' work can disappear. Pair with `--force-with-lease` (safer push-force) and avoid force-pushing shared branches entirely.
- **`git checkout file`** restores the file from the last commit — **discarding your changes.** Modern git prefers `git restore file` to disambiguate from branch switching.
- **Detached HEAD** happens when you `checkout` a commit hash instead of a branch. Any commits made there are "lost" unless you create a branch. The fix: `git switch -c rescue-branch`.
- **Commit messages are documentation.** "Fix bug" is useless. "Fix off-by-one in date parsing when timezone is DST-ambiguous" is gold a year later.

---

## 6. On-the-spot exercises

**E20.1** — Initialize a git repo in `~/lab20` and commit a hello-world script.

<details><summary>Show answer</summary>

```sh
mkdir -p ~/lab20 && cd ~/lab20
git init
echo '#!/bin/bash' > hello.sh
echo 'echo hello' >> hello.sh
chmod +x hello.sh
git add hello.sh
git commit -m "add hello.sh"
git log
```
</details>

**E20.2** — Without using `cat`, show what's *in* the latest commit.

<details><summary>Show answer</summary>

```sh
git show HEAD
```

`HEAD` is the alias for "current commit." `HEAD~1` = "one commit ago."
</details>

**E20.3** — Make a change to `hello.sh`. Use `git diff` to see your unstaged change.

<details><summary>Show answer</summary>

```sh
echo 'date' >> hello.sh
git diff
```
</details>

**E20.4** — Stage the change. Now use `git diff --cached` to see the staged change.

<details><summary>Show answer</summary>

```sh
git add hello.sh
git diff             # nothing — no unstaged
git diff --cached    # shows the staged change
```
</details>

**E20.5** — You decided not to commit it. Unstage and discard.

<details><summary>Show answer</summary>

```sh
git restore --staged hello.sh    # unstage
git restore hello.sh             # discard changes in working dir
git diff                          # nothing
```

Both commands are non-destructive *only* when you don't care about the changes. With unsaved work, `git stash` first.
</details>

**E20.6** — Show the history of `hello.sh` with full diffs.

<details><summary>Show answer</summary>

```sh
git log -p hello.sh
```
</details>

**E20.7** — Add a remote `origin` pointing to `git@github.com:you/configs.git`, then list remotes.

<details><summary>Show answer</summary>

```sh
git remote add origin git@github.com:you/configs.git
git remote -v
```
</details>

**E20.8** — You committed a file by mistake. Remove it from tracking *without deleting it from your working dir*.

<details><summary>Show answer</summary>

```sh
echo "passwords.txt" >> .gitignore
git rm --cached passwords.txt
git commit -m "untrack passwords.txt"
```

The file is *still* in earlier history. For genuine secrets, use `git filter-repo` or rotate the secret (faster).
</details>

---

## 7. Real-world sysadmin scenario

**Versioning `/etc` on a server.** Idea: turn `/etc` into a git repo so every config change is tracked.

```sh
cd /etc
sudo git init
sudo bash -c 'cat > .gitignore' <<'EOF'
# don't store these in git
shadow
shadow-
gshadow
gshadow-
private/
ssh/ssh_host_*_key
EOF

sudo git add .
sudo git commit -m "baseline: $(hostname) $(date -Iseconds)"
```

Now whenever you edit a config:

```sh
sudo vi /etc/nginx/nginx.conf
sudo git -C /etc diff                          # what changed?
sudo git -C /etc add nginx/nginx.conf
sudo git -C /etc commit -m "nginx: tune worker_connections to 4096"
```

Two months later, the new junior asks "why is `worker_connections` 4096?" You: `sudo git -C /etc log -p nginx/nginx.conf` — full history with reasons.

Real sysadmins use `etckeeper`, a tool that does exactly this with extras (auto-commits on package install, etc.). The underlying concept is git.

For dotfiles, the same idea: keep `~/.bashrc`, `~/.vimrc`, `~/.ssh/config` (minus secrets) in a personal repo. Push it. Now setting up a new laptop is `git clone && ./install.sh`.

---

## 8. What to remember

- Repos store snapshots = commits. Branches are pointers to commits.
- Three areas: working dir → staging → committed. `add` then `commit`.
- Write good commit messages. Future-you will thank present-you.
- `git status` and `git diff` are your two most-used commands.
- `git log -p file` for the *why*; `git blame file` for the *who*.
- Never commit secrets. `.gitignore` *before* `git add`.

---

## 9. Next

You can version-control your configs. Let's automate them.

➡ [`21-cron-and-scheduling.md`](21-cron-and-scheduling.md) — cron, at, systemd timers.
