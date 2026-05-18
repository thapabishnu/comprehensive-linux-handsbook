# 16 — Users, groups, and sudo


---

## 1. Why this matters

Multi-user is Linux's deep DNA. The privilege model — *who* can do *what* — is what keeps systems safe. Every audit, every breach investigation, every "why can't I access this?" ticket starts here. Knowing `/etc/passwd`, `/etc/shadow`, groups, and `sudo` gives you the keys.

---

## 2. Mental model

A **user** has a numeric **UID**. UID `0` is root — unrestricted. System accounts have low UIDs (1–999); real humans usually start at UID 1000.

A **group** has a numeric **GID**. Every user has one *primary* group and zero or more *supplementary* groups.

The kernel checks access against UID + groups + permission bits (module 07). That's it. Everything else — `sudo`, PAM, ACLs — sits on top of this core model.

### The four key files

| File | Contains |
|---|---|
| `/etc/passwd` | Account info — username, UID, GID, home, shell. World-readable. |
| `/etc/shadow` | Hashed passwords + aging info. Root-readable only. |
| `/etc/group` | Group definitions and members. |
| `/etc/sudoers` (and `/etc/sudoers.d/`) | Who can `sudo`, to do what, as whom. **Edit with `visudo`, never directly.** |

A line in `/etc/passwd`:

```
sarah:x:1001:1001:Sarah Anderson:/home/sarah:/bin/bash
└┬─┘ │ └─┬┘ └─┬┘ └────┬─────┘ └────┬───┘ └──┬──┘
 │   │   │    │       │            │        └ login shell
 │   │   │    │       │            └ home directory
 │   │   │    │       └ "GECOS" — full name (historical name)
 │   │   │    └ primary GID
 │   │   └ UID
 │   └ password placeholder (real hash is in /etc/shadow)
 └ username
```

---

## 3. Core commands

### Inspecting accounts

| Command | What it shows |
|---|---|
| `whoami` | Your username |
| `id` | Your UID, GID, supplementary groups |
| `id alice` | Same for another user |
| `groups` | Groups you're in |
| `getent passwd alice` | Like grepping `/etc/passwd` but also queries LDAP/AD if configured |
| `last alice` | Recent logins by alice |
| `lastlog` | Last login of every user |
| `w` | Who's currently logged in and doing what |

### Creating, modifying, deleting

| Command | Effect |
|---|---|
| `sudo useradd -m -s /bin/bash -G sudo alice` | Create user `alice` with home dir, bash shell, in group `sudo` |
| `sudo passwd alice` | Set/reset alice's password |
| `sudo usermod -aG devs alice` | **Append** to supplementary group `devs` (always use `-a`!) |
| `sudo usermod -L alice` | Lock the account (disable password login) |
| `sudo usermod -U alice` | Unlock |
| `sudo userdel -r alice` | Delete user and their home directory |
| `sudo groupadd devs` | Create a group |
| `sudo groupdel devs` | Delete |
| `chage -l alice` | Show password aging info for alice |

### Privilege escalation

| Command | Effect |
|---|---|
| `sudo cmd` | Run `cmd` as root (if you're in sudoers) |
| `sudo -u alice cmd` | Run `cmd` as alice |
| `sudo -i` | Start an interactive *login* root shell |
| `sudo -s` | Start a root shell, keep your env |
| `sudo -l` | List what `sudo` rights you have |
| `su -` | Switch to root (requires root password) |
| `su - alice` | Switch to alice (requires alice's password, or sudo) |
| `visudo` | Safely edit `/etc/sudoers` (syntax-checks before save) |
| `visudo -f /etc/sudoers.d/myrule` | Edit a drop-in fragment |

---

## 4. Guided walkthrough

```sh
# inspect yourself
whoami
id
groups

# look at /etc/passwd
grep "$USER" /etc/passwd

# create a test user (needs sudo)
sudo useradd -m -s /bin/bash -c "Test User" testdev
sudo passwd testdev          # set a password

# inspect the new account
id testdev
sudo getent passwd testdev
sudo ls -ld /home/testdev    # home dir was created (because -m)

# add to a group
sudo groupadd devs
sudo usermod -aG devs testdev
id testdev                   # see "devs" in groups
groups testdev

# switch to that user
sudo su - testdev
exit

# delete (cleanup)
sudo userdel -r testdev
sudo groupdel devs
```

> **Mentor note:** `usermod -G devs alice` *replaces* alice's supplementary groups with just `devs`. Use `-aG` (`append`) to add without removing. Watching someone strip a teammate out of `sudo` by forgetting `-a` is a once-and-never-again lesson.

### sudo configuration

To allow `alice` to run *anything* as root without a password (handy on a dev VM — never on prod):

```sh
sudo visudo -f /etc/sudoers.d/alice
```

Inside:

```
alice ALL=(ALL) NOPASSWD: ALL
```

For finer control — alice can only restart nginx:

```
alice ALL=(root) NOPASSWD: /bin/systemctl restart nginx
```

`visudo` syntax-checks before saving. **Never** edit `/etc/sudoers` directly — a syntax error there can lock you out of root entirely.

---

## 5. Gotchas

- **`/etc/passwd` is world-readable.** That's by design — many tools need to map UIDs to names. But it means anything in the `GECOS` field is public.
- **Password hashes live in `/etc/shadow`.** Never `cat` it in front of someone or paste it into a chat log.
- **`-aG` vs `-G`.** Reread above. This bug costs careers.
- **Removing a user doesn't clean up their files.** `userdel -r` removes their home dir; their files in `/tmp` or `/srv` you must hunt down.
- **`sudo` keeps its own environment.** `sudo CMD` doesn't see your aliases or functions; `sudo -E CMD` preserves env vars. Some things (`PATH`) are filtered for security via `secure_path` in `/etc/sudoers`.
- **`su` vs `sudo -i`.** `su -` becomes root, requiring root's password. `sudo -i` becomes root using *your* password (via sudoers). Most modern systems disable direct root login entirely — use sudo.
- **Locked vs disabled.** `passwd -l alice` locks the password (alice can't log in with it but SSH keys still work). `usermod -L` is the same. To fully prevent login, also set shell to `/sbin/nologin` and disable SSH access for that user.

---

## 6. On-the-spot exercises

**E16.1** — What's your UID and primary GID?

<details><summary>Show answer</summary>

```sh
id -u            # UID
id -g            # primary GID
```

Or just `id` for everything.
</details>

**E16.2** — List every account on the system whose shell is `/bin/bash`.

<details><summary>Show answer</summary>

```sh
grep '/bin/bash$' /etc/passwd | cut -d':' -f1
```

That's roughly your set of human users (system accounts usually have `/usr/sbin/nologin`).
</details>

**E16.3** — Add yourself to group `docker` (assuming it exists).

<details><summary>Show answer</summary>

```sh
sudo usermod -aG docker "$USER"
# log out and back in for the new group to take effect
```

You can also use `newgrp docker` in your current shell to switch primary group temporarily.
</details>

**E16.4** — Show how many days until your password expires.

<details><summary>Show answer</summary>

```sh
chage -l "$USER"
```

Look at "Password expires." Returns "never" on most systems unless aging is configured.
</details>

**E16.5** — Create a service account `backup-svc` that has no shell login but can own files.

<details><summary>Show answer</summary>

```sh
sudo useradd -r -s /usr/sbin/nologin -m -d /var/lib/backup-svc backup-svc
```

- `-r` = system account (low UID, no password aging)
- `-s /usr/sbin/nologin` = no interactive login
- `-m -d` = create home dir at specified path
</details>

**E16.6** — List exactly what sudo rights *you* have.

<details><summary>Show answer</summary>

```sh
sudo -l
```

Reads the relevant sudoers rules and prints what you're allowed to do.
</details>

**E16.7** — Switch to user `nobody` and run a command (then return).

<details><summary>Show answer</summary>

```sh
sudo -u nobody whoami
# returns "nobody"; you're back in your shell immediately
```

`sudo -u USER CMD` runs one command and returns. Use `sudo -i -u USER` to drop into a full shell as them.
</details>

**E16.8** — Configure `alice` to be able to restart `nginx` via `sudo` without a password, but nothing else.

<details><summary>Show answer</summary>

```sh
sudo visudo -f /etc/sudoers.d/alice-nginx
```

Inside:

```
alice ALL=(root) NOPASSWD: /bin/systemctl restart nginx, /bin/systemctl reload nginx
```

The `visudo` syntax check saves you from typos that would break sudo entirely.
</details>

---

## 7. Real-world sysadmin scenario

**New engineer joining.** You need to create their account, add them to the right groups, and grant the team's standard sudo rights.

```sh
# 1. create the account
sudo adduser jamie        # interactive: sets password, fills GECOS
# (or non-interactive:)
sudo useradd -m -s /bin/bash -c "Jamie Lee" jamie
sudo passwd jamie

# 2. add to groups
sudo usermod -aG devs,docker,sudo jamie

# 3. install their SSH key (if you have it)
sudo install -d -m 700 -o jamie -g jamie /home/jamie/.ssh
printf '%s\n' "ssh-ed25519 AAAA... jamie@laptop" | \
  sudo install -m 600 -o jamie -g jamie /dev/stdin /home/jamie/.ssh/authorized_keys

# 4. confirm
id jamie
sudo -u jamie -i whoami    # smoke-test their account
```

When jamie leaves:

```sh
sudo passwd -l jamie                    # lock immediately
sudo usermod -e $(date +%F) jamie       # expire account today
# preserve home dir for handover
sudo tar -cJf /backup/jamie-home.tar.xz /home/jamie
sudo userdel -r jamie
```

Lock first (immediate), then back up, then delete. Order matters: a contractor whose account is "going to be deleted next Tuesday" can do a lot in the meantime if you don't lock first.

---

## 8. What to remember

- Linux is multi-user from the kernel up. UID/GID + permission bits = whole privilege model.
- `id`, `groups`, `getent` — your inspectors.
- `useradd -m -s /bin/bash NAME` is the standard create.
- **`usermod -aG`** when adding to groups. Don't forget `-a`.
- `visudo` only; never edit `/etc/sudoers` directly.
- `sudo -l` shows what you can do.
- Lock-then-delete when offboarding.

---

## 9. Next

You manage users. Next, manage services.

➡ [`17-services-systemd.md`](17-services-systemd.md) — `systemctl`, unit files, `journalctl`.
