# 00 — Orientation: setting up & thinking like a sysadmin

> *Before* the first command, we need three things: a real Linux box, a sample-data folder for drills, and the mindset.

---

## 1. Why this matters

Reading about Linux is roughly as effective as reading about swimming. You will not actually learn until your fingers are on the keyboard, watching a real shell respond to you. The next 10 minutes set up that loop.

You also need a sysadmin's mindset. A sysadmin's job is rarely "type the right command." It's:

1. Observe carefully (what *exactly* did the system say?)
2. Form a hypothesis (what could cause that?)
3. Test it cheaply (run something safe that confirms or refutes)
4. Only then change state (the dangerous step — `rm`, `kill`, `chmod`, restart)

If you skip steps 1–3 and jump to step 4, you'll make outages worse. Every module in this guide is going to drill that loop into you.

---

## 2. Pick your Linux environment

You need *somewhere* to run real Linux. Pick one. You can change later.

### Option A — WSL on Windows (recommended for this course)

You're on Windows 11. WSL gives you a real Ubuntu kernel without a VM. Open PowerShell **as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Reboot when it asks. After reboot it'll open an Ubuntu terminal and ask you to make a username and password. Pick something you'll remember. **Write down the password** — you'll need it for `sudo`.

From then on, just type `wsl` in PowerShell or open "Ubuntu" from the Start menu.

### Option B — A Linux VM (VirtualBox / VMware / Hyper-V)

Download an **Ubuntu Server 22.04 LTS** ISO and create a VM. Give it 2 CPU, 2 GB RAM, 20 GB disk. Install with default options, **enable OpenSSH server** when the installer asks.

### Option C — A cloud VPS

DigitalOcean, Linode, Vultr, Hetzner, AWS Lightsail — any of them. A $5/month box is plenty for everything in this guide. Pick **Ubuntu 22.04 LTS** or **Debian 12**.

> **Mentor note:** I recommend Option A for daily practice — WSL is instant, offline, and you can break it freely on your laptop. If you also have a cloud VPS (Option C), use it later for anything that involves real networking or systemd timers.

---

## 3. First sanity check

Once you have a Linux shell open, run these — exactly:

```sh
whoami
hostname
uname -a
pwd
```

You should see your username, the box's name, the kernel version, and your current directory (probably `/home/<your-username>`). If those work, **you're set**.

---

## 4. Set up the practice sandbox

Throughout this guide we'll reference a small set of practice files. Let's create them now, once, so every drill has something to chew on.

Save this as `~/setup-sample-data.sh` (we'll cover how to create files properly in module 03 — for now just paste it in via `nano ~/setup-sample-data.sh`, then save with `Ctrl+O Enter Ctrl+X`):

```sh
#!/bin/bash
# Linux mentor handbook — practice sandbox setup
set -euo pipefail

SANDBOX="$HOME/linux-sandbox"
echo "Creating practice sandbox at $SANDBOX"
mkdir -p "$SANDBOX"
cd "$SANDBOX"

# --- module 04 globbing files ---
mkdir -p globbing
cd globbing
touch A 'A*' 'A,' AA AB ABC AC AD 'B,' BA BB BC BD BE BF
cd ..

# --- text files for grep / sed / awk ---
mkdir -p text
cat > text/names.txt <<'EOF'
Anderson, Sarah
Brown, James
Chen, Mei
Davis, Robert
Evans, Priya
Foster, Liam
Garcia, Sofia
Hassan, Omar
Ito, Yuki
Jackson, Kira
Khan, Aisha
Lopez, Carlos
Mason, Emma
Nguyen, Linh
O'Brien, Sean
Patel, Raj
Quinn, Maya
Robinson, Marcus
Sato, Hana
Tanaka, Akira
EOF

cat > text/access.log <<'EOF'
192.168.1.10 - - [16/May/2026:10:01:22 +0000] "GET /index.html HTTP/1.1" 200 1842
192.168.1.10 - - [16/May/2026:10:01:23 +0000] "GET /style.css HTTP/1.1" 200 442
10.0.0.55 - - [16/May/2026:10:02:01 +0000] "POST /api/login HTTP/1.1" 401 87
10.0.0.55 - - [16/May/2026:10:02:09 +0000] "POST /api/login HTTP/1.1" 401 87
10.0.0.55 - - [16/May/2026:10:02:14 +0000] "POST /api/login HTTP/1.1" 401 87
10.0.0.55 - - [16/May/2026:10:02:18 +0000] "POST /api/login HTTP/1.1" 200 421
192.168.1.10 - - [16/May/2026:10:03:00 +0000] "GET /dashboard HTTP/1.1" 200 9831
172.16.4.7 - - [16/May/2026:10:03:45 +0000] "GET /admin HTTP/1.1" 403 162
172.16.4.7 - - [16/May/2026:10:04:01 +0000] "GET /etc/passwd HTTP/1.1" 404 28
192.168.1.11 - - [16/May/2026:10:05:30 +0000] "GET /index.html HTTP/1.1" 500 0
EOF

cat > text/employees.csv <<'EOF'
id,name,dept,salary,start_date
101,Anderson,eng,95000,2019-03-15
102,Brown,sales,72000,2020-06-01
103,Chen,eng,110000,2017-11-08
104,Davis,hr,65000,2021-02-19
105,Evans,eng,98000,2022-08-30
106,Foster,sales,68000,2023-01-12
107,Garcia,eng,120000,2016-04-22
108,Hassan,ops,88000,2020-10-05
109,Ito,ops,91000,2018-09-14
110,Jackson,sales,74000,2024-03-01
EOF

cat > text/lorem.txt <<'EOF'
The quick brown fox jumps over the lazy dog.
Linux is the kernel; GNU is the userland.
Permissions are read, write, and execute.
Stdin, stdout, and stderr are the three standard streams.
A pipe sends one program's stdout to another's stdin.
Regular expressions describe patterns in text.
sed is a stream editor; awk is a pattern-action language.
Cron runs jobs on a schedule; systemd timers do the same thing better.
Logs live under /var/log on most distributions.
The root user can do anything; sudo lets others borrow that power.
EOF

# --- a directory tree for find drills ---
mkdir -p tree/a/b/c
mkdir -p tree/a/b/d
mkdir -p tree/x/y
touch tree/a/b/c/deep.txt
touch tree/a/b/d/notes.md
touch tree/a/old.log
touch tree/x/y/report.csv
touch tree/x/y/report.tmp
touch tree/readme.md

echo "Done. Explore with:  cd $SANDBOX && ls -R"
```

Then run it:

```sh
chmod +x ~/setup-sample-data.sh
~/setup-sample-data.sh
```

You should see `~/linux-sandbox/` with `globbing/`, `text/`, and `tree/` subdirectories. **Every drill in this guide assumes that sandbox exists.** If you delete it or move it, just re-run the script.

---

## 5. The sysadmin mindset, in five rules

I'll mention these often. Tattoo them in:

1. **Read the error message.** The system told you exactly what's wrong. Most of the time the answer is in the text you skimmed past.
2. **Know where you are before you act.** `pwd` before `rm`. Always.
3. **Look before you leap.** `ls` before `cp`. `cat` before `>`. `--dry-run` if the tool supports it.
4. **Smallest change first.** If you have a hypothesis, test it with the cheapest, most reversible thing you can do. Don't reboot until you've at least looked at the logs.
5. **Leave a trail.** When you change something on a production box, leave a note (`/root/CHANGELOG`, a git commit, a Slack message — anything). Future-you and your teammates will thank you.

---

## 6. Tools that make your life better

While you have a fresh box, install these now. They'll make every following module faster.

```sh
# Debian/Ubuntu/WSL:
sudo apt update
sudo apt install -y vim less tree htop curl wget jq man-db git tmux

# RHEL/Fedora:
sudo dnf install -y vim less tree htop curl wget jq man-db git tmux
```

- **`tree`** — visualize directory trees (we'll use it a lot)
- **`less`** — better pager than `more`
- **`htop`** — much nicer `top`
- **`jq`** — JSON processor for when you start hitting APIs
- **`tmux`** — survive disconnects in long SSH sessions
- **`man-db`** — full man pages (`man ls`, `man bash`, etc.) — your most important reference

---

## 7. On-the-spot exercises

You're not getting away from drills even in the orientation. Try these now:

**E0.1** — Run `whoami`, `hostname`, and `pwd` and write down what each returns. Why are those three the first things a sysadmin checks when they log into a new box?

<details><summary>Show answer</summary>

`whoami` — proves *which user* you are. Critical because `rm -rf /` as `root` ends careers; the same command as a normal user usually fails harmlessly.
`hostname` — proves *which box* you're on. SSH'd into the wrong server is one of the most common ways to take down production.
`pwd` — proves *which directory* you're in. Many destructive commands operate on the current directory.

Together they answer: "Who am I, where am I, what am I about to do?" — the start of the observe step.
</details>

**E0.2** — Run `man man`. What's section 1 of the manual? What's section 5? What's section 8?

<details><summary>Show answer</summary>

- **Section 1** — user commands (everyday programs like `ls`, `grep`)
- **Section 5** — file formats (like `man 5 passwd` for the layout of `/etc/passwd`)
- **Section 8** — sysadmin/system commands (like `useradd`, `mount`)

You'll see the section number in parentheses after a command name: `ls(1)` means "ls, section 1." Knowing the sections lets you disambiguate things like `passwd(1)` (the command) vs `passwd(5)` (the file).
</details>

**E0.3** — Without looking it up, predict what `uname -a` shows vs `uname -r`. Then run both and check.

<details><summary>Show answer</summary>

`uname -a` — **all** info: kernel name, hostname, kernel release, kernel version, machine architecture, OS.
`uname -r` — only the **release** (kernel version string like `5.15.0-91-generic`).

`-r` is what you want when you're looking up "is my kernel old enough to be affected by CVE-XXXX?"
</details>

**E0.4** — Create a file called `practice.txt` in your home directory with the line "Hello, Linux." inside. Don't worry about which method yet; we'll do this many ways later.

<details><summary>Show answer</summary>

Many valid ways — any of these work:

```sh
echo "Hello, Linux." > ~/practice.txt
```

```sh
nano ~/practice.txt        # type the text, Ctrl+O, Enter, Ctrl+X
```

```sh
cat > ~/practice.txt
Hello, Linux.
[Ctrl+D]
```

We'll meet `>` (redirection) in module 08 and `nano`/`vi` editors in module 06. For now, just confirm the file exists with `cat ~/practice.txt`.
</details>

**E0.5** — Your boss messages you: *"Server feels slow. Can you check?"* You SSH in. What are the **first three commands** you'd run? (No rigid answer — think about it.)

<details><summary>Show one good answer</summary>

A solid opening:

1. `uptime` — load averages over 1/5/15 min. If 1-min is way higher than 15-min, it's a recent spike.
2. `top` (or `htop`) — what's eating CPU and memory *right now*?
3. `df -h` — is a disk full? A full `/` or `/var` causes "slow" symptoms even when CPU looks fine.

The point isn't this exact list — the point is you start by **observing** before you start doing things. We'll come back to this in module 22.
</details>

---

## 8. Real-world sysadmin scenario

**Friday, 4:55 PM.** You're packing up. Slack pings: *"Customer portal is down."*

You SSH in. Your first instinct is to restart the web service. Don't.

A senior sysadmin does this instead:

```sh
ssh prod-web-01
whoami       # confirm I'm not root yet (good — less likely to fat-finger)
hostname     # confirm I'm on the right box
uptime       # has it been up for a while? recent reboot?
df -h        # is the disk full? (extremely common cause of "down")
journalctl -u nginx --since "10 min ago" | tail -50   # what does nginx say?
```

Within 60 seconds, you have *evidence*. Maybe `/var` is at 100% because logs grew. Maybe nginx is fine but the upstream app crashed. Maybe the box was rebooted by autopatch and a service didn't come back. **Each of those needs a different fix.** Restarting blindly would mask the symptom *or* make it worse (e.g., if it was an OOM kill from a memory leak, restarting buys 30 minutes before the next page).

We'll cover every command in that snippet — `journalctl`, `df`, `systemctl` — in later modules. For now, just internalize: **diagnose, then act.**

---

## 9. What to remember

- You need a real Linux environment. WSL on this Windows box is the fastest path.
- The `~/linux-sandbox/` is set up — keep it; every drill uses it.
- The five rules: read the error, know where you are, look before you leap, smallest change first, leave a trail.
- "Who am I? Where am I? What am I doing?" — the opening of every troubleshooting session.

---

## 10. Next

Now that you have a shell, let's understand what's actually happening when you log in to it.

➡ [`01-shell-and-ssh.md`](01-shell-and-ssh.md) — Shell access, SSH, and what your prompt is telling you.
