# 01 — The shell, SSH, and what your prompt is telling you

> *Prerequisites:* you've done [`00-orientation.md`](00-orientation.md) and have a working Linux shell.
> *Maps to:* NCS 205 Lab 1, Lab 2 (Q1), parts of Lab 64.

---

## 1. Why this matters

The shell is the **single most important tool you'll learn** as a Linux user. It's how every other tool you'll meet — `grep`, `vi`, `find`, `systemctl` — actually runs. Most servers in production today have **no GUI at all**. If you can't operate a shell, you can't operate a Linux server.

SSH is how you reach those shells from anywhere in the world. If you can read a prompt and SSH in, you can administer a server in Frankfurt from a laptop in Buffalo. That's the leverage we're after.

---

## 2. Mental model

Three layers to keep straight:

```
  YOU ──► (keyboard) ──► terminal emulator ──► shell ──► kernel ──► hardware
```

- **Terminal emulator** — the *window* (e.g. WSL's Ubuntu window, PuTTY, iTerm2, GNOME Terminal). Just draws characters and reads keys.
- **Shell** — the *program* that reads what you type and runs it. On modern Linux: **bash** (Bourne Again Shell). Older Unix: **sh** (the Bourne shell). Other popular: **zsh**, **fish**.
- **Kernel** — the OS itself, talking to hardware.

When you type `ls` and hit Enter:

1. The terminal sent your keystrokes to the shell.
2. The shell parsed `ls`, located the program (`/usr/bin/ls`), forked a child process, replaced it with the `ls` program (`exec`), and waited.
3. `ls` asked the kernel for the contents of the current directory.
4. `ls` printed them to its **standard output**, which the terminal displayed.
5. `ls` exited; the shell printed your prompt again, ready for the next command.

That cycle — **read input → execute → print prompt** — is called the **REPL**. Everything you do is some variation of it.

### SSH in one picture

```
  your laptop's terminal ──── encrypted TCP tunnel ──── remote shell on server
                            (port 22, public-key crypto)
```

SSH (**Secure SHell**) is just *a way to get your keystrokes into a shell that's running on another machine*, securely. Once you're connected, **the experience is identical to a local shell** — same commands, same rules.

---

## 3. Core commands & syntax

### Getting in and out

| Command | What it does |
|---|---|
| `ssh user@host` | Open a shell on `host` as `user`. Default port 22. |
| `ssh -p 2222 user@host` | Specify a non-default port. |
| `ssh -i ~/.ssh/mykey user@host` | Use a specific private key file. |
| `exit` (or `logout`, or `Ctrl+D`) | End the session and return to where you came from. |
| `scp file user@host:/path/` | **S**ecure **c**o**p**y — upload a file to remote. |
| `scp user@host:/path/file .` | Download a remote file to current dir. |
| `sftp user@host` | Interactive secure FTP-like file transfer. |

### Inspecting your session

| Command | What it tells you |
|---|---|
| `whoami` | Your username. |
| `hostname` | The machine's name. |
| `pwd` | The directory you're currently in. |
| `id` | Your numeric UID, GID, and group memberships. |
| `tty` | Which terminal device you're attached to (e.g. `/dev/pts/0`). |
| `who` | Who else is logged in. |
| `w` | Who else is logged in **and what they're doing**. |
| `last` | Recent login history. |
| `uptime` | How long the box has been running + load averages. |
| `uname -a` | Kernel, hostname, architecture. |
| `passwd` | Change *your* password (current first, then new twice). |

### Useful keyboard shortcuts (memorize early)

| Keys | Effect |
|---|---|
| `Tab` | Autocomplete a command, filename, or path. **Double-Tab** shows candidates. |
| `↑` / `↓` | Walk through command history. |
| `Ctrl+R` | Reverse-search history. Type a few letters; press `Ctrl+R` again to cycle. |
| `Ctrl+A` / `Ctrl+E` | Jump to beginning / end of the line. |
| `Ctrl+U` / `Ctrl+K` | Kill text before / after cursor. |
| `Ctrl+W` | Kill the word before cursor. |
| `Ctrl+L` | Clear the screen (same as `clear` but faster). |
| `Ctrl+C` | Cancel the current command / line. |
| `Ctrl+D` | EOF — exits the shell if the line is empty. |
| `Ctrl+Z` | Suspend the running program (we'll use this in module 11). |

Tab-completion alone will save you hours per week. **Use it constantly.**

---

## 4. Guided walkthrough

Open your shell. Follow along. Read every output line.

### Step 1 — Confirm where you are

```sh
whoami
hostname
pwd
```

You should see your username, the box name, and `/home/yourusername`. That's your **home directory**, abbreviated as `~`.

### Step 2 — Read your prompt

Your prompt likely looks something like:

```
yourname@hostname:~$
```

Let's decode it:

| Piece | Meaning |
|---|---|
| `yourname` | Logged-in user (= `whoami`) |
| `@` | Separator, literal |
| `hostname` | The machine (= `hostname`) |
| `:` | Separator, literal |
| `~` | Current directory (= `pwd`, but `~` means "my home") |
| `$` | You're a **regular user**. (If it's `#`, you're **root** — be careful.) |

> **Mentor note:** That single-character difference — `$` vs `#` — is one of the most important signals in this entire course. `#` means *unrestricted power*. We'll dig into that more in module 16.

### Step 3 — Inspect who's on the box

```sh
who
w
last | head -5
```

- `who` lists active logins (just name, terminal, login time).
- `w` adds: what command each user is running, how idle they are, system load.
- `last` is historical: shows logins going back through `/var/log/wtmp`.

If you're on a shared server, you'll see classmates. On WSL or a personal VM, just you.

### Step 4 — Open a second session (the magic of SSH)

If you have a second machine or can install an SSH server on your VM:

```sh
# On the remote box, install and start the SSH service (Ubuntu/Debian):
sudo apt install -y openssh-server
sudo systemctl enable --now ssh

# On the remote box, find its IP:
ip -4 addr show | grep inet

# From your laptop:
ssh yourname@<that-IP>
```

Now type `w` on the remote side. You'll see yourself logged in *twice* (your original session + this SSH one). This is exactly how a real sysadmin works — multiple sessions open at once.

`exit` will close the SSH session and drop you back to the original shell.

### Step 5 — Move a file with `scp`

From your laptop's shell (not the remote one):

```sh
echo "hello from my laptop" > greeting.txt
scp greeting.txt yourname@<that-IP>:~/
```

Then on the remote box, `cat greeting.txt` to see it. Reverse direction:

```sh
scp yourname@<that-IP>:~/greeting.txt ./greeting-back.txt
```

`scp` is being deprecated in favor of `sftp`/`rsync` for new code, but it's still everywhere and will be tested on labs.

---

## 5. Gotchas

These are the traps I'd flag for a junior:

### `#` vs `$` — root vs regular

If your prompt suddenly shows `#`, **you are root**. A wrong `rm` will erase files no normal user could. Always confirm with `whoami` if you're unsure. We'll cover `sudo` and how people end up as root in module 16.

### Closing your laptop kills your SSH session

By default, when your SSH connection drops (Wi-Fi dies, laptop sleeps), every command you started in that session dies too. We'll fix this with `tmux` / `screen` in module 11. For now: **don't start a 4-hour job in a fragile SSH session**.

### `ssh user@host` with the wrong host fingerprint

The first time you SSH to a new host, SSH asks you to confirm its fingerprint. If you blindly type `yes`, you trust whatever's there. If you later see *"WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED"*, **stop**. It either means the server was rebuilt (legitimate) or someone is intercepting your connection (very not legitimate). Confirm out-of-band before you continue.

### Forgetting `exit`

If you SSH from server A → server B and then run more SSH commands, you can stack 4 deep without realizing it. `exit` peels off **one** layer. Use `who am i` or look at your prompt's hostname to keep track.

### Tab-completion teaches you typos

If `ls -al /etc/passw<Tab>` doesn't complete, the file you think exists doesn't. *Trust Tab over your memory.*

### Password change requires you to type your **current** password first

`passwd` asks for your current password first, then the new one twice. Get the current one wrong and it just bails — no harm done. On the class server, the first time you run `passwd` may force you to change it.

---

## 6. On-the-spot exercises

Do these in your terminal now. Try before peeking.

**E1.1** — Print your username, hostname, current directory, and the time the system booted, in one command per line.

<details><summary>Show answer</summary>

```sh
whoami
hostname
pwd
uptime -s         # boot time, e.g. "2026-05-15 09:12:33"
```

`uptime` without `-s` gives load averages and uptime duration; `uptime -s` is the boot timestamp. Knowing the boot time matters: "Did this box reboot last night?" is often the first question during an incident.
</details>

**E1.2** — Show all users currently logged in, including what they're running.

<details><summary>Show answer</summary>

```sh
w
```

`who` would also list logins but without the running-command column.
</details>

**E1.3** — Look at the last 10 logins to this system. Are any from IPs you don't recognize?

<details><summary>Show answer</summary>

```sh
last -n 10
```

On a shared box, the IPs you don't recognize are probably your classmates' homes. On a server you own, an IP you don't recognize is a security-investigation starter. Knowing your own login pattern is half the battle.
</details>

**E1.4** — Use only keyboard shortcuts to: type `ls /var/log`, jump to the beginning of the line, change it to `sudo ls /var/log`, then run it.

<details><summary>Show answer</summary>

1. Type `ls /var/log` — don't hit Enter yet.
2. `Ctrl+A` — cursor jumps to the start of the line.
3. Type `sudo ` (with the space) — it inserts before `ls`.
4. `Ctrl+E` — cursor jumps to end (not strictly needed but good habit).
5. `Enter` — runs `sudo ls /var/log`.

`/var/log` is mostly world-readable, but in a habit-forming sense, `Ctrl+A` is one of the most useful shortcuts you'll learn.
</details>

**E1.5** — Find the most recent command in your history that contained the word `pwd`. Run it again without retyping it.

<details><summary>Show answer</summary>

`Ctrl+R`, then type `pwd`. Bash searches backwards through your history. Press `Enter` to run, or `→` to edit before running.

Alternative: `history | grep pwd`, find the number, then `!<number>` to re-run.
</details>

**E1.6** — Open a second terminal/SSH session to the same box. In session A, type a multi-line command (don't press Enter). In session B, run `w`. Does session A's incomplete command appear?

<details><summary>Show answer</summary>

No. `w` shows the *currently running* process per terminal — and while you're still typing into the prompt, the **bash process itself** is what's running. The text you've typed lives in bash's in-memory buffer, not in any process list. This is reassuring: you can compose a long command without other users on a shared box seeing it half-formed.
</details>

**E1.7** — Without leaving your current shell, SSH from your local box to itself (yes, really): `ssh yourname@localhost`. Run `w`. How many of "you" are logged in?

<details><summary>Show answer</summary>

You should see two entries for your username — the original local shell and the new SSH session. This is exactly how nested SSH works on real systems. `exit` peels one off. You can chain `ssh A → ssh B → ssh C` and `exit` brings you back one hop at a time.

If `ssh localhost` says "Connection refused," the SSH server isn't running. On Ubuntu: `sudo systemctl status ssh` to check, `sudo systemctl enable --now ssh` to start it.
</details>

**E1.8** — Change your password to something *different*, then change it back.

<details><summary>Show answer</summary>

```sh
passwd
# Old: <type your current password — no characters shown, that's normal>
# New: <type the new one>
# Retype new: <type it again>

passwd
# Now reverse it back to the original.
```

If the system complains "password too similar" or "based on a dictionary word," it's PAM's password-quality module doing its job. Pick something more complex.

**Important:** in the lab worksheet, you need to paste the output of `passwd`. The output won't include the passwords themselves — just lines like "Changing password for yourname / Current password: / New password: / Retype new password: / passwd: password updated successfully". That last line is what proves it worked.
</details>

---

## 7. Real-world sysadmin scenario

**Tuesday, 11:30 AM.** You start your shift. Slack has a message from the night-before sysadmin: *"Did some patching on web-03 last night, looks fine."*

You SSH in:

```sh
ssh you@web-03
```

You're at the prompt. **Now what?**

The textbook answer is "trust your colleague and move on." The *good sysadmin* answer is **verify cheaply**:

```sh
whoami                     # confirm I'm me, not stuck as someone's session
uptime                     # uptime: 8 hours.  Reboot last night — checks out.
last reboot | head -3      # confirm only one recent reboot, nothing weird.
w                          # who else is on?  Just me.  Good.
systemctl --failed         # any unit that didn't come back?  (Module 17.)
df -h                      # any filesystem above 80%?  Patching can fill /boot.
```

Total time: 30 seconds. In return:

- You **caught it in advance** if a service silently failed to restart.
- You have a **written paper trail** if something breaks later: "I checked at 11:30 and these were fine."
- You've **proven to your fingers** that you can do this routine without thinking — so when there's a real incident, the diagnostic loop is already muscle memory.

That habit is the difference between *a person who knows commands* and *a sysadmin*.

---

## 8. What to remember

- The shell is a **REPL** — read input, run program, print prompt, repeat.
- `$` prompt = regular user; `#` prompt = root. Watch this constantly.
- SSH is just "a way to get to a remote shell" — once connected, everything else is the same.
- The opening of every session: `whoami`, `hostname`, `pwd`. Cheap, fast, prevents disasters.
- `Tab` and `Ctrl+R` will save you more time than any other shortcuts.
- A dropped SSH session kills its child processes — for long jobs we'll need `tmux` (module 11).

---

## 9. Next

You can log in and you know what your prompt is telling you. Now let's understand the world you've logged *into* — the Unix filesystem.

➡ [`02-filesystem-navigation.md`](02-filesystem-navigation.md) — Paths, the FHS, and moving around like you've been here for years.
