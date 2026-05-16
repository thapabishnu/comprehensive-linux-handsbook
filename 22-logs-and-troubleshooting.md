# 22 — Logs and troubleshooting

> *Maps to:* NCS 205 Labs B1–C1.

---

## 1. Why this matters

This is the module that *everything else* points to. Every previous module has said "check the logs" or "look at journalctl." Now we cover it properly. **Reading logs well is the difference between sysadmin and senior sysadmin.** The commands are easy; the discipline of *what to look at, in what order* is the real skill.

---

## 2. Mental model

Linux logs live in two places these days:

1. **`/var/log/`** — text files written by syslog/rsyslog. Old, universal, easy to grep.
2. **`systemd journal`** — structured binary log, queried via `journalctl`. Modern, richer (priorities, units, timestamps in ISO format).

Most modern distros use *both*: rsyslog reads the journal and copies certain things to text files for compatibility.

When something breaks, the question is **what** broke at **what time**. Logs answer both — *if* you read the right one. The right ordering:

```
1. journalctl -u UNIT --since "X" -p err     ← what does the failing service itself say?
2. dmesg --since "X"                          ← anything from the kernel?
3. /var/log/syslog (or messages)              ← system-wide events
4. application-specific logs                  ← /var/log/nginx/, /var/log/mysql/, etc.
```

---

## 3. Core commands

### `/var/log/` text logs

| Path / command | What's there |
|---|---|
| `/var/log/syslog` (Debian) / `/var/log/messages` (RHEL) | General system events |
| `/var/log/auth.log` (Debian) / `/var/log/secure` (RHEL) | Authentication, sudo, su |
| `/var/log/dmesg` | Kernel boot messages |
| `/var/log/kern.log` | Live kernel messages |
| `/var/log/nginx/`, `/var/log/apache2/`, `/var/log/mysql/` | Per-app |
| `/var/log/wtmp` (binary; read with `last`) | Login history |
| `/var/log/btmp` (binary; read with `lastb`) | Failed logins |

| Tool | Effect |
|---|---|
| `less +F /var/log/syslog` | Follow a text log (Ctrl+C to stop following, q to quit) |
| `tail -F /var/log/syslog` | Same — survives log rotation |
| `zgrep PATTERN /var/log/*.gz` | grep across compressed rotated logs |
| `logrotate -d /etc/logrotate.conf` | Dry-run log rotation rules |

### `journalctl`

| Command | What it shows |
|---|---|
| `journalctl` | Whole journal (use `less` keys) |
| `journalctl -e` | Jump to end |
| `journalctl -f` | Follow live (like `tail -f`) |
| `journalctl -k` | Kernel messages only |
| `journalctl -u nginx` | One unit's messages |
| `journalctl -p err` | Priority ≥ err (also `warning`, `notice`, `info`, `debug`) |
| `journalctl --since "1 hour ago"` | Time-bounded |
| `journalctl --since "2026-05-16" --until "2026-05-17 06:00"` | Absolute range |
| `journalctl -b` | This boot only |
| `journalctl -b -1` | Previous boot |
| `journalctl -o short-iso` | ISO timestamps |
| `journalctl --list-boots` | All recorded boots |
| `journalctl _PID=12345` | All messages from one PID |

### `dmesg`

| Command | Effect |
|---|---|
| `dmesg` | Kernel ring buffer (boot + runtime kernel messages) |
| `dmesg -T` | Human timestamps |
| `dmesg -w` | Watch live |
| `dmesg --level=err,warn` | Filter severities |

### System health snapshots

| Command | What it shows |
|---|---|
| `uptime` | Load averages |
| `free -h` | Memory |
| `df -h` | Disk per filesystem |
| `du -sh /path/*` | Disk usage per directory |
| `iostat 1 5` | I/O stats every 1 sec, 5 times (install `sysstat`) |
| `vmstat 1 5` | CPU/memory/IO summary |
| `top` / `htop` | Live processes |
| `ss -tulpn` | Listening sockets |
| `last`, `lastb`, `who`, `w` | Logins |

---

## 4. Guided walkthrough

```sh
# what's been written to the system log lately?
sudo tail -50 /var/log/syslog

# follow live
sudo tail -F /var/log/syslog
# in another terminal trigger something:
sudo systemctl restart ssh
# back in tail -F you see the restart log lines
# Ctrl+C to stop

# the journal
journalctl -e -n 30        # last 30 lines
journalctl -u ssh -n 10
journalctl --since "10 min ago"
journalctl -p err -b       # errors since this boot
journalctl -k --since "1 hour ago"

# kernel ring buffer
dmesg -T --level=err,warn | tail

# system snapshot
uptime
free -h
df -h
top -bn1 | head -20

# login history
last | head
sudo lastb | head           # failed logins
who; w
```

> **Mentor habit:** when you don't know what's wrong, run a *health snapshot* first: `uptime`, `free -h`, `df -h`, `top -bn1`, `journalctl -p err -b | tail -30`. That five-command sweep gives you 80% of what you need to form a hypothesis. Always run it *before* you start randomly restarting things.

---

## 5. Common failure patterns and what to check first

| Symptom | First place to look |
|---|---|
| Service won't start | `systemctl status SVC` then `journalctl -u SVC -p err` |
| Box "feels slow" | `uptime` (load) → `top` (CPU/mem) → `iostat` (disk I/O wait) |
| "Disk full" | `df -h` → `du -sh /var/* /tmp/* /home/*` → `find / -size +1G` |
| Can't log in | `sudo tail /var/log/auth.log` or `journalctl -u ssh` |
| Random reboots | `last reboot`, `dmesg`, `journalctl --list-boots`, hardware logs (BIOS) |
| App crashes | `journalctl -u APP -p err`, app's own log, dmesg for OOM kills |
| OOM killer activity | `dmesg \| grep -i oom`, `journalctl -k \| grep -i oom` |
| Network flakiness | `dmesg \| grep -iE 'link|eth|wifi'`, `ip -s link`, `journalctl -u NetworkManager` |

---

## 6. Gotchas

- **Time matters more than you think.** Pin every incident to a precise time window. `--since` / `--until` saves enormous noise.
- **`/var/log/syslog` is wiped by rotation.** Look in `syslog.1`, `syslog.2.gz`, etc. for older history. `zgrep` reads `.gz` directly.
- **`dmesg` is a ring buffer.** Oldest messages get evicted when full. On a long-running box, very old kernel events may already be gone — `journalctl -k` keeps them longer.
- **Journal persistence isn't always on.** Without `/var/log/journal/` the journal is volatile (lost on reboot). On Debian-style distros: `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald`.
- **Don't `cat` a huge log.** `less` it, or page with `tail/head`. We covered this in module 05 but it bears repeating.
- **A "fix" with no log evidence is a guess.** If your change didn't appear in logs as the *cause*, your fix won't appear in logs as the *cure*.

---

## 7. On-the-spot exercises

**E22.1** — Show the last 50 lines of `/var/log/syslog`.

<details><summary>Show answer</summary>

```sh
sudo tail -n 50 /var/log/syslog
```
</details>

**E22.2** — Follow the journal live, filtered to error priority or worse.

<details><summary>Show answer</summary>

```sh
sudo journalctl -f -p err
```
</details>

**E22.3** — Show all kernel messages from the last hour.

<details><summary>Show answer</summary>

```sh
sudo journalctl -k --since "1 hour ago"
# or
sudo dmesg -T | grep "$(date -d '1 hour ago' +%b)"   # rougher
```
</details>

**E22.4** — Find every line in this boot's journal that mentions `OOM`.

<details><summary>Show answer</summary>

```sh
sudo journalctl -b -k | grep -i oom
```

If you see "Out of memory" or "Killed process," the kernel's OOM killer fired — usually means an app leaked memory.
</details>

**E22.5** — How many failed SSH login attempts have hit this box recently?

<details><summary>Show answer</summary>

```sh
sudo lastb | head
sudo grep "Failed password" /var/log/auth.log | wc -l
# or on systems using journal:
sudo journalctl -u ssh | grep -i "failed password" | wc -l
```

Internet-exposed SSH typically sees thousands per day. That's why we set up keys + 2FA in module 19.
</details>

**E22.6** — Find every error log line from `nginx` in the last 24 hours.

<details><summary>Show answer</summary>

```sh
sudo journalctl -u nginx -p err --since "24 hours ago"
# plus the app's own log:
sudo less +G /var/log/nginx/error.log
```
</details>

**E22.7** — A specific PID (let's say `4242`) is misbehaving. Show every log line tagged with it.

<details><summary>Show answer</summary>

```sh
journalctl _PID=4242
```

`_PID=` is a journal *match*. Same syntax for `_UID=`, `_SYSTEMD_UNIT=`, etc.
</details>

**E22.8** — Identify the 5 largest directories under `/var/`.

<details><summary>Show answer</summary>

```sh
sudo du -h /var/* 2>/dev/null | sort -rh | head -5
# Or just one level deeper:
sudo du -sh /var/*/* 2>/dev/null | sort -rh | head -5
```
</details>

**E22.9** — Tail-follow `auth.log` so you watch login activity in real time.

<details><summary>Show answer</summary>

```sh
sudo tail -F /var/log/auth.log
```

Or on RHEL: `sudo tail -F /var/log/secure`.
</details>

**E22.10** — Show the times of the last 5 reboots.

<details><summary>Show answer</summary>

```sh
last reboot | head -5
# or
journalctl --list-boots
```
</details>

---

## 8. Real-world sysadmin scenario

**3 AM page:** *"web-02 not responding."* You SSH in.

```sh
# Health snapshot
uptime                         # load avg: 18.2 12.1 6.4  ← bad and getting worse
free -h                        # 7.8G used / 8.0G total, swap 100%
df -h                          # /var 99% full
journalctl -p err -b | tail -30
# repeatedly: "fatal: Could not allocate space for log entry"
# preceding: "Out of memory: Killed process 1234 (nginx)"
```

In one snapshot you have a full story: the disk filled up → nginx couldn't write → swap filled with bloated processes → OOM killer started murdering things. The fix isn't "restart nginx" — it's "clear /var/log."

```sh
# find what's huge
sudo du -sh /var/log/* | sort -rh | head -5
# /var/log/myapp/   12G  ← log rotation isn't running
sudo truncate -s 0 /var/log/myapp/big.log
sudo systemctl restart myapp
sudo systemctl status myapp
sudo logrotate -f /etc/logrotate.d/myapp     # rotate now, then fix rotation config
```

Total time: under 5 minutes. Real diagnosis followed by real fix. Notice you *did not* restart things until you understood *why* they had failed. That's the principle that ran through this entire guide — and it's the principle that separates the good ones from the great ones.

---

## 9. What to remember

- Two log systems: `/var/log/*` (text) and the journal (`journalctl`).
- Health snapshot before anything else: `uptime`, `free -h`, `df -h`, `top -bn1`, `journalctl -p err -b | tail`.
- Always pin to a time window: `--since`/`--until` for journal, `tail`/`zgrep` for old text logs.
- Read logs *before* you act. Restart-without-understanding is the #1 way to make incidents worse.
- The same five-command health sweep handles 80% of "something's wrong" tickets.

---

## 10. You finished the handbook 🎓

Twenty-three modules. Twelve hundred exercises. Real scenarios for every one. If you've worked through these, you have the foundation of a real Linux sysadmin — and far more depth than what NCS 205's labs are testing.

Where to go next:

- **Linux Pocket Guide** (Daniel Barrett) — the commands as reference.
- **The Linux Programming Interface** (Michael Kerrisk) — the *systems* book; deep but legendary.
- **Distributed Systems Observability** for when you start running fleets.
- Subscribe to **LWN.net** — the kernel/distros community's weekly.

And **keep typing**. That's the whole secret. Build a homelab. Break it on purpose. Fix it. Repeat. Five years from now you'll do this for a living.

Good luck. Go build things.

— *Your mentor*
