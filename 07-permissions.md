# 07 — Permissions

> *Maps to:* NCS 205 Labs 16–18.

---

## 1. Why this matters

Linux permissions are the difference between "I can read this" and "I can pwn this." Every breach post-mortem you'll ever read includes a sentence about a file being too permissive. Every "why can't I run this?" support ticket boils down to the same nine bits. Master `rwx` and you control who does what on your machine.

---

## 2. Mental model

For every file (and directory), the kernel asks three questions:

1. **Who's trying to access it?** Are they the *owner*, in the file's *group*, or *other* (everyone else)?
2. **What are they trying to do?** Read, write, or execute?
3. **Does the matching permission bit allow it?**

That gives **nine bits per file**: 3 actions × 3 classes.

```
        u (user/owner)        g (group)            o (other)
        ┌──┬──┬──┐            ┌──┬──┬──┐           ┌──┬──┬──┐
        │ r│ w│ x│            │ r│ w│ x│           │ r│ w│ x│
        └──┴──┴──┘            └──┴──┴──┘           └──┴──┴──┘
```

`ls -l` shows them as a 10-character string:

```
-rwxr-xr--   1  alice  devs  4096  May 10 10:23  report.sh
│└──┬──┘└──┬──┘└──┬──┘
│   u    g    o
│
└── file type:  -  regular file
                d  directory
                l  symbolic link
                c  character device, b  block device, p  pipe, s  socket
```

Read that example as: *"owner can read/write/execute; group can read/execute; others can only read."*

### Three classes, three actions — for **directories**, the meanings shift

| Bit | On a file | On a directory |
|---|---|---|
| `r` | Read contents | List names of files inside |
| `w` | Modify contents | Create / delete / rename files inside |
| `x` | Execute as a program | `cd` into it, access files inside by name |

The directory rules are subtle and matter:

- A directory with `r-x` lets you `ls` *and* `cd` and read files (if those files allow it).
- A directory with `--x` lets you `cd` and access files *if you already know their names* — but **`ls` fails** because you can't list names. (This is a common security pattern: hide the contents but allow known paths.)
- A directory with `r--` lets you `ls` but you **can't** access any of the listed files (no `x`).

### Octal: the same bits, in three numbers

| Octal digit | Binary | Means |
|---|---|---|
| `0` | `---` | nothing |
| `1` | `--x` | execute only |
| `2` | `-w-` | write only |
| `3` | `-wx` | write + execute |
| `4` | `r--` | read only |
| `5` | `r-x` | read + execute |
| `6` | `rw-` | read + write |
| `7` | `rwx` | all three |

A file with `rwxr-xr--` is **754**. A file with `rw-r--r--` is **644**. A directory you can read and traverse but not write is **755**. Memorize: 644, 755, 600 — these cover 90% of what you ever set.

---

## 3. Core commands

| Command | What it does |
|---|---|
| `ls -l <f>` | Show perms, owner, group. |
| `chmod <bits> <f>` | Change permissions. |
| `chmod u+x f` | Add execute for owner. |
| `chmod go-w f` | Remove write for group and other. |
| `chmod a+r f` | Add read for all (a = ugo). |
| `chmod 755 f` | Set explicitly to `rwxr-xr-x`. |
| `chmod -R 755 dir/` | Recurse into a tree. |
| `chown user f` | Change owner. |
| `chown user:group f` | Change owner and group. |
| `chgrp group f` | Change group only. |
| `umask` | Show default-permission mask for newly created files. |
| `umask 022` | Set the mask (new files = 666 - mask; new dirs = 777 - mask). |
| `stat f` | Permissions, ownership, timestamps, inode. |

### Three special bits

| Name | Symbol | Octal | Effect |
|---|---|---|---|
| **setuid** | `s` in owner's `x` slot | 4xxx | When the file runs, it runs *as the owner* (typically root). Used by `passwd`, `sudo`. |
| **setgid** | `s` in group's `x` slot | 2xxx | On a directory: new files inherit the directory's group. On a file: runs as the group. |
| **sticky bit** | `t` in other's `x` slot | 1xxx | On a directory: only the file's owner can delete their files. Used on `/tmp`. |

You'll see them in `ls -l` as `s` or `t` where you'd expect an `x`. Set with `chmod 4755 thing` or `chmod u+s thing`.

---

## 4. Guided walkthrough

```sh
cd ~
mkdir -p lab07 && cd lab07
touch demo.sh
ls -l demo.sh
# -rw-r--r-- 1 you you 0 ... demo.sh        → octal 644

# add an executable bit for the owner
chmod u+x demo.sh
ls -l demo.sh
# -rwxr--r--                                → 744

# convert to octal directly
chmod 755 demo.sh
ls -l demo.sh
# -rwxr-xr-x                                → 755

# make a private file
touch secret.txt
chmod 600 secret.txt
ls -l secret.txt
# -rw-------                                → 600 ("only owner can read or write")

# new directory perms
mkdir public
ls -ld public
# drwxr-xr-x                                → 755 (default for dirs on most systems)

# tighten it
chmod 700 public
ls -ld public
# drwx------                                → only owner can enter

# umask experiment
umask
# 0022   (default on most desktops)
touch a.txt
ls -l a.txt        # -rw-r--r--   (666 & ~022 = 644)

umask 077
touch b.txt
ls -l b.txt        # -rw-------   (666 & ~077 = 600)

# revert umask for this session
umask 0022
```

> **Mentor note:** `umask` is the *default* applied to newly created files in this shell. It's a *mask* — bits set in the umask are *removed* from the permissions. Most people don't realize how much risk lives in a wrong default until a private key gets created world-readable.

---

## 5. Gotchas

- **`chmod 777`** is rarely the right answer. It's usually a band-aid for "I don't understand why this doesn't work." Find the real reason — almost always it's a directory `x` issue or wrong ownership.
- **You can `chmod` a file you can't `cat`.** Permissions are checked separately: if you own the file, you can change its bits even if you can't read it.
- **`chown` requires root.** Regular users can't give files away. (`chgrp` works if you're a member of the target group.)
- **Recursive `chmod` on a tree mixes file and dir perms.** `chmod -R 755 .` makes every text file *executable*, which is usually wrong. Better: use `find` to set differently:

  ```sh
  find . -type f -exec chmod 644 {} \;
  find . -type d -exec chmod 755 {} \;
  ```

- **The setuid bit on a script is *ignored* by Linux.** It only applies to binaries. People assume "I can't make this script run as root with chmod 4755" — correct, that's by design (script-level setuid is too easy to subvert). Use `sudo` instead.
- **A file inside `/tmp` can be deleted by you only.** That's the sticky bit doing its job. `ls -ld /tmp` shows `drwxrwxrwt` — the `t` at the end.

---

## 6. On-the-spot exercises

**E7.1** — Create `cmd.sh`. Make it readable and executable by anyone, writable only by you.

<details><summary>Show answer</summary>

```sh
touch cmd.sh
chmod 755 cmd.sh
ls -l cmd.sh        # -rwxr-xr-x
```

`755` is the default for executables. Use it unless there's a reason not to.
</details>

**E7.2** — Make a file `~/secret.txt` that only you can read or write.

<details><summary>Show answer</summary>

```sh
touch ~/secret.txt
chmod 600 ~/secret.txt
ls -l ~/secret.txt   # -rw-------
```

`600` is the right answer for private files like `~/.ssh/id_rsa`.
</details>

**E7.3** — Translate to octal: `rwxr-x---`.

<details><summary>Show answer</summary>

`750`. Owner = `rwx` = 7. Group = `r-x` = 5. Other = `---` = 0.
</details>

**E7.4** — Translate to symbolic: `640`.

<details><summary>Show answer</summary>

`rw-r-----` (owner read/write, group read, others nothing).
</details>

**E7.5** — A friend can't read your shared script even though they're in the right group. What's the most likely cause?

<details><summary>Show answer</summary>

Either (a) the file's group permissions don't include `r`, or (b) one of the **directories** along the path doesn't grant `x` to that group, so they can't traverse into where the file lives.

Check both:

```sh
ls -l shared.sh                 # file perms
namei -m /path/to/shared.sh     # all ancestor dirs and their perms
```

`namei -m` is gold for diagnosing path-permission problems.
</details>

**E7.6** — Set up `~/dropbox/` so any user can put files in but only the file's owner can delete them.

<details><summary>Show answer</summary>

```sh
mkdir ~/dropbox
chmod 1777 ~/dropbox        # rwxrwxrwt  — sticky bit
ls -ld ~/dropbox
```

`1777` = sticky + world-writable. This is the same pattern as `/tmp`.
</details>

**E7.7** — Find every file under `~/` that's world-writable.

<details><summary>Show answer</summary>

```sh
find ~ -type f -perm -o+w 2>/dev/null
```

`-perm -o+w` means "has at least the 'other-write' bit set." World-writable files are a common security audit finding.
</details>

**E7.8** — Make a fresh directory `~/team/` and have new files inside automatically belong to the group `devs` (without users needing to remember).

<details><summary>Show answer</summary>

```sh
sudo groupadd devs                # if it doesn't exist
mkdir ~/team
sudo chgrp devs ~/team
chmod 2775 ~/team                 # the 2 is setgid
ls -ld ~/team                     # drwxrwsr-x — note the 's' in group's x slot
```

Now any file or subdir created inside `~/team` inherits group `devs`, no matter who creates it. This is the classic shared-team-folder pattern.
</details>

---

## 7. Real-world sysadmin scenario

**Security audit, Monday morning.** Compliance wants a list of every world-writable file outside `/tmp`:

```sh
sudo find / -xdev -type f -perm -o+w \
    -not -path '/tmp/*' -not -path '/var/tmp/*' \
    -not -path '/proc/*' 2>/dev/null
```

That one command becomes the audit report. For each hit, you `ls -l` to see the actual perms, decide whether it's intentional, and `chmod o-w` the ones that aren't.

A second classic: an SSH key with wrong perms causes a confusing "permission denied" *before* you ever fail authentication:

```sh
ssh -i ~/.ssh/id_rsa user@host
# Permissions 0644 for '/home/you/.ssh/id_rsa' are too open.
# It is recommended that your private key files are NOT accessible by others.
```

The fix:

```sh
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh
```

OpenSSH refuses to use a private key unless `600` *and* the parent directory is `700`. Knowing this saves you 30 minutes of "but the key works on my laptop."

---

## 8. What to remember

- Nine bits: `rwx` × `user/group/other`. Octal: 644, 755, 600, 700.
- For directories: `r` lists, `w` modifies, `x` traverses. Subtle but critical.
- `chmod`, `chown`, `chgrp`, `umask`. That's the toolkit.
- Setuid/setgid/sticky are real bits. Sticky on `/tmp` is why your tempfiles are safe.
- `chmod 777` is almost never right. Find the real cause.
- SSH keys: `~/.ssh` = 700, `id_rsa` = 600. Or it won't work.

---

## 9. Next

You can lock down files. Now let's get fluent at wiring commands together.

➡ [`08-redirection-pipes.md`](08-redirection-pipes.md) — stdin, stdout, stderr, and the pipe.
