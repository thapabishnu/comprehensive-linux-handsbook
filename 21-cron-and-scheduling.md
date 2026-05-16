# 21 — cron and scheduling

> *Maps to:* NCS 205 Lab A1.

---

## 1. Why this matters

A surprising amount of every Linux server's job runs on a schedule: backups, log rotation, cert renewal, monitoring scripts, daily reports. The two tools to know are **cron** (40 years of "good enough") and **systemd timers** (modern, more capable). Together they handle every "run this every X" use case.

---

## 2. Mental model

A **cron job** has two parts:

1. A **schedule** (5 time fields).
2. A **command** to run when the schedule fires.

Each user has their own crontab; root has the system one in `/etc/crontab` and `/etc/cron.d/*`.

The five fields, in order:

```
   ┌───────────── minute (0–59)
   │ ┌─────────── hour (0–23)
   │ │ ┌───────── day of month (1–31)
   │ │ │ ┌─────── month (1–12)
   │ │ │ │ ┌───── day of week (0–6, Sun=0)
   │ │ │ │ │
   * * * * *  command-to-run
```

Each field can be:

- A number: `5` = exactly that value.
- `*` — every value.
- A list: `1,15,30`.
- A range: `9-17`.
- A step: `*/15` — every 15 minutes.

```
   */15 * * * *           every 15 minutes
   0 2 * * *              02:00 every day
   0 9 * * 1-5            09:00 weekdays
   30 4 1 * *             04:30 on the 1st of each month
   0 0 * * 0              midnight Sunday
```

---

## 3. Core commands

### Cron

| Command | Effect |
|---|---|
| `crontab -l` | List your crontab |
| `crontab -e` | Edit (in `$EDITOR`) |
| `crontab -r` | Remove (careful — no confirmation) |
| `crontab file.txt` | Replace crontab with the contents of `file.txt` |
| `sudo crontab -u alice -l` | Inspect another user's crontab |
| `cat /etc/crontab` | The system crontab |
| `ls /etc/cron.d/` | Drop-in system jobs |
| `ls /etc/cron.{hourly,daily,weekly,monthly}/` | Pre-defined schedule directories |

### One-shot

| Command | Effect |
|---|---|
| `at 10pm` | Schedule a command to run once at 10pm |
| `at 'now + 5 minutes'` | Run 5 min from now (then type the command, Ctrl+D) |
| `atq` | List pending at-jobs |
| `atrm N` | Cancel job N |

### systemd timers (modern alternative)

A timer is a `.timer` unit that triggers a `.service` unit on a schedule. Two files; richer features than cron (calendar specs, missed-run handling, dependency on other units).

| Command | Effect |
|---|---|
| `systemctl list-timers` | All active timers |
| `systemctl status mybackup.timer` | One timer's state |
| `systemctl enable --now mybackup.timer` | Activate |

---

## 4. Guided walkthrough — cron

```sh
# create a small script
cat > ~/bin/log-uptime.sh <<'EOF'
#!/bin/bash
echo "$(date -Iseconds)  uptime: $(uptime -p)" >> "$HOME/uptime.log"
EOF
chmod +x ~/bin/log-uptime.sh

# add a cron entry (runs every 5 minutes)
crontab -e
# in the editor, add:
#   */5 * * * * /home/yourname/bin/log-uptime.sh
# save & quit

crontab -l                    # confirm
# wait 5 minutes...
tail -5 ~/uptime.log          # should see new lines
```

### `at` for one-shot

```sh
echo "shutdown -r" | at now + 5 minutes     # reboot in 5 (don't actually run this!)
atq
atrm 1
```

---

## 5. systemd timers — quick taste

Two files, in `/etc/systemd/system/`:

**`mybackup.service`** (what to run):

```
[Unit]
Description=My backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

**`mybackup.timer`** (when to run):

```
[Unit]
Description=Daily 02:00 backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Then:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now mybackup.timer
systemctl list-timers --all | grep mybackup
journalctl -u mybackup.service     # see past runs
```

`Persistent=true` means if the machine was off at 02:00, the timer runs the *next time it boots* — cron can't do that without help.

---

## 6. Gotchas

- **Cron's environment is minimal.** No `PATH` beyond `/usr/bin:/bin`, no aliases, no `~/.bashrc`. Either set `PATH` in the crontab or the script (module 15).
- **Cron emails output by default.** If `MAILTO=` isn't set, cron tries to mail you stdout/stderr. On most systems mail isn't configured, so cron just logs "trying to send mail." Best practice: redirect inside the cron entry: `>> /var/log/myjob.log 2>&1`.
- **Cron uses `/bin/sh`, not `/bin/bash`.** Your bash-isms (`[[ ]]`, `${VAR:-default}`) may fail in a one-liner. Wrap in `bash -c '...'` or just call a script.
- **Crontab has no `\` line continuation.** One job = one line.
- **`crontab -r`** deletes your entire crontab silently. Always `crontab -l` first or back up: `crontab -l > /tmp/crontab-backup.txt`.
- **`at` requires `atd` to be running.** `systemctl status atd` to check; `sudo apt install at` if missing.
- **systemd timers don't fire if the unit is failed.** Use `systemctl reset-failed mybackup.service` after fixing a bug.

---

## 7. On-the-spot exercises

**E21.1** — Write the cron schedule for "every weekday at 5 PM."

<details><summary>Show answer</summary>

```
0 17 * * 1-5
```

`5 PM` = hour 17, weekdays 1–5.
</details>

**E21.2** — Schedule for "every 10 minutes."

<details><summary>Show answer</summary>

```
*/10 * * * *
```
</details>

**E21.3** — Add a cron entry that runs `/usr/local/bin/backup.sh` at 2 AM daily and logs to `/var/log/backup.log`.

<details><summary>Show answer</summary>

```
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

Critical: redirect both streams or you'll lose stderr.
</details>

**E21.4** — Show your current crontab without editing it.

<details><summary>Show answer</summary>

```sh
crontab -l
```
</details>

**E21.5** — Back up your crontab to `/tmp/crontab.txt`, then restore from it.

<details><summary>Show answer</summary>

```sh
crontab -l > /tmp/crontab.txt
crontab /tmp/crontab.txt        # replace from file
```

Run *before* any `crontab -r` or major edit.
</details>

**E21.6** — Schedule "reboot at 3 AM tomorrow" as a one-shot.

<details><summary>Show answer</summary>

```sh
echo "/sbin/reboot" | sudo at 3am tomorrow
```

(Don't run this on a real box you care about right now.)
</details>

**E21.7** — List active systemd timers and find the next time `logrotate.timer` will fire.

<details><summary>Show answer</summary>

```sh
systemctl list-timers
systemctl list-timers --all | grep logrotate
```
</details>

**E21.8** — A cron job runs but does nothing visible. Where would you check?

<details><summary>Show answer</summary>

```sh
# syslog records cron firing
sudo grep CRON /var/log/syslog | tail -20
# (On RHEL: /var/log/cron)

# if you redirected output, check that log
tail /tmp/myjob.log

# manually run the script with the same env as cron
env -i PATH=/usr/bin:/bin /path/to/myjob.sh
```

`env -i` clears the environment — a great way to reproduce "works in my shell, fails in cron."
</details>

---

## 8. Real-world sysadmin scenario

**"The nightly backup didn't run last night."** Standard playbook:

```sh
# 1. Did cron fire?
sudo grep -E 'CRON.*(backup|root)' /var/log/syslog | tail -20

# 2. If yes, what did it output?
ls -lt /var/log/backup.log
tail -50 /var/log/backup.log

# 3. Reproduce with cron's environment
sudo env -i PATH=/usr/bin:/bin /usr/local/bin/backup.sh

# 4. If you spot the bug, fix; if not, look for resource starvation
journalctl --since "yesterday 02:00" --until "yesterday 02:30"
```

The two leading reasons for "cron didn't run":

1. The script worked in your shell because of your PATH, but cron's PATH is bare.
2. The cron entry has a typo or comment-out you forgot.

A more modern pattern: use a **systemd timer with `OnFailure=`** to alert you when a scheduled job fails:

```
[Unit]
Description=Daily backup
OnFailure=alert@%n.service     # custom unit that sends notification
```

That's the kind of detail that distinguishes "a cron job" from "a production-quality scheduled task."

---

## 9. What to remember

- 5 fields: `min hour dom mon dow`. Use `*/N` for "every N."
- Cron's env is minimal. Set `PATH` and redirect output.
- `crontab -l > backup.txt` before any risky edit.
- For anything serious in 2026: **systemd timer** > cron (persistence, dependencies, journal).
- Both still common. Read both.

---

## 10. Next

You can schedule things. Now let's read what they leave behind.

➡ [`22-logs-and-troubleshooting.md`](22-logs-and-troubleshooting.md) — `/var/log`, journalctl, and triage.
