# 03 — Listing files and not deleting prod

> *Maps to:* NCS 205 Labs 5–9.

---

## 1. Why this matters

The most-used command in Linux is `ls`. The second most-used is some flavor of *touch / cp / mv / mkdir / rm*. These are also the commands most likely to ruin your day if you fire them carelessly. The job here is twofold: **read what's on disk fluently**, and **change it on purpose**.

---

## 2. Mental model

A Unix file has three faces:

1. **Name** — what you see in `ls`.
2. **Inode** — an internal ID that owns permissions, owner, size, and pointers to the actual data.
3. **Data** — the bytes.

A "directory" is really just a *file that lists names → inode mappings*. Multiple names can point to the same inode (a **hard link**). A separate kind of file can point to *a name* (a **symlink** or symbolic link).

```
   name "report.txt"  ──►  inode #19237  ──►  data blocks
   name "old-report"  ──►  inode #19237  (hard link — same data)
   name "shortcut"    ──►  "report.txt"  (symlink — points at the name)
```

That model explains everything counterintuitive: why `rm` doesn't always free space, why moving a file across disks is slow (different inode space), why permissions are on the inode not the name.

---

## 3. Core commands

### Reading

| Command | What it does |
|---|---|
| `ls` | Names only. |
| `ls -l` | Long: perms, owner, group, size, mtime, name. |
| `ls -la` | Long + dotfiles. |
| `ls -lh` | Sizes in human units (K, M, G). |
| `ls -lS` | Sort by size, largest first. |
| `ls -lt` | Sort by mtime, newest first. |
| `ls -ltr` | Sort by mtime, **oldest first** — newest at the bottom (great for tailing-style reading). |
| `ls -lR` | Recurse into subdirectories. |
| `ls -li` | Show inode numbers. |
| `stat <f>` | Full inode metadata. |
| `du -sh <dir>` | Disk usage summary for one directory. |
| `df -h` | Disk free per filesystem. |

### Creating

| Command | What it does |
|---|---|
| `touch <f>` | Create an empty file, or update mtime on an existing one. |
| `mkdir <d>` | Make a directory. |
| `mkdir -p a/b/c` | Make a directory tree, parents included. |

### Copying / moving / deleting

| Command | What it does |
|---|---|
| `cp src dst` | Copy a file. |
| `cp -r src/ dst/` | Copy recursively (needed for directories). |
| `cp -a src dst` | Archive copy: preserves perms, timestamps, symlinks. **Default this when in doubt.** |
| `cp -i ...` | Prompt before overwrite. |
| `mv src dst` | Move (or rename, if same dir). |
| `mv -n src dst` | No-clobber: don't overwrite. |
| `rm <f>` | Delete a file. |
| `rm -r <d>` | Delete a directory and contents. |
| `rm -f <f>` | Force — no prompts, no errors for missing files. |
| `rmdir <d>` | Delete an *empty* directory only (safer than `rm -r`). |

### Linking

| Command | What it does |
|---|---|
| `ln target linkname` | Hard link — second name pointing to same inode. |
| `ln -s target linkname` | Symbolic link (a pointer to a path). 99% of the time you want `-s`. |

---

## 4. Guided walkthrough

```sh
cd ~
mkdir -p lab03
cd lab03

# create
touch hello.txt
echo "version 1" > notes.txt
mkdir docs
echo "important" > docs/keep.txt

# read
ls
ls -l
ls -lh
ls -la

# copy
cp notes.txt notes-backup.txt
cp -r docs/ docs-backup/
ls -l

# move (rename)
mv hello.txt greeting.txt
ls

# link
ln -s notes.txt notes-link
ls -l            # see the "->" pointing at notes.txt

# clean up (carefully)
rm notes-backup.txt
rm -r docs-backup/
ls
```

Read every output. Train your eyes on the `ls -l` columns — they'll mean more after module 07 (permissions).

---

## 5. Gotchas

- **`rm` has no recycle bin.** `rm -rf /something/precious` is *immediate and permanent*. Always.
- **`rm -rf /`** classically eats the entire filesystem. Modern GNU `rm` refuses with `--preserve-root` (default), but don't test it.
- **`rm -rf $VAR/...`** when `$VAR` is empty becomes `rm -rf /...`. Always quote and always check: `echo "$VAR"` first.
- **`cp` overwrites silently** by default. Use `cp -i` (interactive) or `cp -n` (no-clobber) to be safe. Or alias `cp='cp -i'` in your `.bashrc`.
- **Trailing slashes on `cp`/`rsync`.** `cp dir/ /tmp/` and `cp dir /tmp/` differ when the destination doesn't exist. Re-read the man page if you're not sure.
- **`mv` across filesystems isn't atomic.** It's actually copy + delete. If the box dies mid-move, you can end up with half a file in each place.
- **Hidden files in globs.** `rm *` does *not* remove dotfiles. `rm * .*` looks safe but the second pattern also matches `.` and `..` — so you'd be saying "remove the parent." Avoid; use `find` for this in module 10.

> **Mentor habit:** before any `rm -r`, run the same path through `ls` first. It costs one second and has saved careers.

---

## 6. On-the-spot exercises

**E3.1** — List all files in `/var/log/`, longest format, including dotfiles, sized in MB/KB.

<details><summary>Show answer</summary>

```sh
ls -lah /var/log/
```

`-h` makes sizes readable. Without it you'll see bytes — fine for tiny files, awful for `/var`.
</details>

**E3.2** — Show the *5 most recently modified* files in `/var/log/`.

<details><summary>Show answer</summary>

```sh
ls -lt /var/log/ | head -5
```

`-t` = sort by mtime, newest first. We'll learn `head` properly in module 05.
</details>

**E3.3** — Copy `/etc/hostname` into your home directory, then rename the copy to `hostname.bak`.

<details><summary>Show answer</summary>

```sh
cp /etc/hostname ~/
mv ~/hostname ~/hostname.bak
```

Or in one step:

```sh
cp /etc/hostname ~/hostname.bak
```

The second form is what a sysadmin actually writes — fewer commands, fewer chances to make a typo.
</details>

**E3.4** — Create the directory tree `~/projects/scripts/utils/` in *one* command.

<details><summary>Show answer</summary>

```sh
mkdir -p ~/projects/scripts/utils
```
</details>

**E3.5** — You see two files with the same content. Check whether they're hard links (same inode) or independent copies.

<details><summary>Show answer</summary>

```sh
ls -li file1 file2
```

If both rows show the **same inode number** in the first column, it's the same data — they're hard links. Two different inodes = two separate copies.

Bonus: the second `ls -l` column on a hard-linked file shows the **link count** > 1.
</details>

**E3.6** — Make a symlink `~/myhost` that points to `/etc/hostname`. Then `cat ~/myhost`.

<details><summary>Show answer</summary>

```sh
ln -s /etc/hostname ~/myhost
cat ~/myhost                  # shows hostname contents — symlink is transparent to most tools
ls -l ~/myhost                # shows "->/etc/hostname"
```

Symlinks are how `/usr/bin/python` "just works" no matter which Python version is installed.
</details>

**E3.7** — Delete `~/myhost` *the symlink*, not what it points to.

<details><summary>Show answer</summary>

```sh
rm ~/myhost
```

`rm` on a symlink removes the *link*, not the target. (`rm` on the target file would leave a dangling symlink — pointing at nothing.) The same is true for `mv`.
</details>

---

## 7. Real-world sysadmin scenario

**Tuesday, 2 PM.** A teammate writes in Slack: *"Disk full on prod-api-04. Can you clean it up?"*

Don't `rm` anything yet. **First, see.**

```sh
ssh prod-api-04
df -h                                   # which filesystem? /var? /var/log? /tmp?
du -sh /var/* 2>/dev/null | sort -h     # rank top-level dirs by size
du -sh /var/log/* | sort -h | tail -5   # top 5 log dirs
ls -lhS /var/log/something/ | head -10  # largest files in the offender
```

Now you have *evidence* of what's huge. Maybe an app log went to 18 GB because rotation broke. The fix isn't `rm` — it's `truncate -s 0 huge.log` (zero it but keep the file descriptor live) or fixing logrotate. **The investigation takes 60 seconds; the wrong fix takes a week to recover from.**

---

## 8. What to remember

- A file is *name → inode → data*. Multiple names can share an inode.
- `ls -l` columns: perms, links, owner, group, size, mtime, name. Memorize this order.
- `ls -ltr` = "what changed most recently, newest at the bottom." Best one-liner for log inspection.
- `cp -a` is the safe default for backups.
- `rm` is permanent. Run the path through `ls` first.
- 99% of the time you want `ln -s` (symlink), not a hard link.

---

## 9. Next

You can read and manipulate individual files. Next we make the shell do the matching for you — wildcards.

➡ [`04-file-globbing.md`](04-file-globbing.md) — Globbing with `*`, `?`, `[]`, `{}` and why it happens before the command runs.
