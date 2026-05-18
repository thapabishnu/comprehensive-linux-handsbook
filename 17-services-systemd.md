# 17 — Services and systemd


---

## 1. Why this matters

On modern Linux, **systemd** is PID 1 — the first process the kernel runs, and the parent of everything else. It manages services, mounts, sockets, timers, and the boot sequence. When something doesn't start, when something keeps dying, when a daemon won't pick up its new config — `systemctl` and `journalctl` are how you find out why.

---

## 2. Mental model

systemd organizes everything into **units**. A unit is a small declarative file that says: "I want this thing to be running, here's how to start it, here's what it depends on."

Unit types you'll meet most:

| Suffix | What it manages |
|---|---|
| `.service` | A long-running process (a daemon) |
| `.timer` | Schedules another unit (modern cron) |
| `.socket` | A listening socket that activates a service on connect |
| `.target` | A group of units (like a runlevel) |
| `.mount` | A filesystem mount |

Two locations to know:

| Path | Purpose |
|---|---|
| `/lib/systemd/system/` (or `/usr/lib/systemd/system/`) | Vendor-shipped unit files |
| `/etc/systemd/system/` | Local admin overrides (highest priority) |

A unit can be **enabled** (start at boot) and/or **active** (running right now). They're independent: a service can be enabled-but-stopped, or running-but-not-enabled.

---

## 3. Core commands

| Command | Effect |
|---|---|
| `systemctl status nginx` | What's `nginx`'s state right now? |
| `systemctl start nginx` | Start now (doesn't enable at boot) |
| `systemctl stop nginx` | Stop |
| `systemctl restart nginx` | Stop + start |
| `systemctl reload nginx` | Send the "reload config" signal (if the unit supports it) |
| `systemctl enable nginx` | Start automatically at boot |
| `systemctl disable nginx` | Don't start at boot |
| `systemctl enable --now nginx` | Enable and start in one step |
| `systemctl is-active nginx` | Just "active" or "inactive" |
| `systemctl is-enabled nginx` | Just "enabled" or "disabled" |
| `systemctl list-units --type=service` | All loaded services |
| `systemctl list-unit-files --type=service` | All known service unit files |
| `systemctl --failed` | Anything in a failed state |
| `systemctl daemon-reload` | Reload systemd's own knowledge after you edit unit files |
| `systemctl cat nginx` | Show the unit file (vendor + overrides combined) |
| `systemctl edit nginx` | Create or edit an override drop-in file |

And the logs side:

| Command | Effect |
|---|---|
| `journalctl -u nginx` | All log entries for the nginx unit |
| `journalctl -u nginx -f` | Follow (like `tail -f`) |
| `journalctl -u nginx --since "10 min ago"` | Time-bounded |
| `journalctl -u nginx -b` | Just from this boot |
| `journalctl -p err` | Only error-priority and above |
| `journalctl -k` | Kernel messages |
| `journalctl -xe` | Last entries with explanation, useful right after a failure |

---

## 4. Anatomy of a unit file

A minimal `.service` looks like:

```
[Unit]
Description=My Web App
After=network.target

[Service]
Type=simple
User=myapp
WorkingDirectory=/srv/myapp
ExecStart=/srv/myapp/run.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Three sections:

- **`[Unit]`** — description and ordering (`After=`, `Before=`, `Requires=`).
- **`[Service]`** — how to run it (`ExecStart=`, `User=`, `Restart=`).
- **`[Install]`** — what `enable` should link it to (usually `multi-user.target`, the multi-user "is up" state).

`Type=simple` is most common; the process runs in the foreground and systemd considers it "started" the moment fork returns. `Type=forking` is for old-style daemons that double-fork. `Type=notify` is when the app explicitly tells systemd "I'm ready" (cleanest for prod).

---

## 5. Guided walkthrough

```sh
# inspect
systemctl status ssh           # or sshd on RHEL
systemctl is-active ssh
systemctl is-enabled ssh
systemctl list-units --type=service | head -10
systemctl --failed             # any broken units?

# logs
journalctl -u ssh --since "1 hour ago"
journalctl -u ssh -f &         # follow in background
sudo systemctl restart ssh
fg                              # see the restart event in the log
[Ctrl+C]

# create your own service
sudo tee /etc/systemd/system/hello.service > /dev/null <<'EOF'
[Unit]
Description=Hello world service
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do echo "hello $(date)"; sleep 30; done'
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now hello
systemctl status hello
journalctl -u hello -f
[Ctrl+C]

# cleanup
sudo systemctl disable --now hello
sudo rm /etc/systemd/system/hello.service
sudo systemctl daemon-reload
```

> **Mentor note:** `systemctl daemon-reload` is required after **any** change to a unit file. Forgetting this is the source of "I edited the unit but the change didn't take effect."

### Drop-in overrides

Don't edit a vendor unit directly — your changes will be overwritten on package upgrade. Instead, use `systemctl edit`:

```sh
sudo systemctl edit nginx
```

This opens an editor and creates `/etc/systemd/system/nginx.service.d/override.conf` — a *drop-in* that adds to or overrides specific directives. Add only what you're changing:

```
[Service]
LimitNOFILE=65536
```

Then `daemon-reload` and `restart`.

---

## 6. Gotchas

- **`systemctl reload` requires the unit to declare `ExecReload=`.** If it doesn't, reload silently does nothing or returns an error. Many services treat reload as "re-read config without restarting" — invaluable for production.
- **`systemctl restart` kills the process and starts a new one.** All in-flight connections drop. `reload` is gentler when supported.
- **`journalctl` shows live + persistent logs only if `/var/log/journal/` exists.** On Debian-style systems it might be configured to be ephemeral (`Storage=volatile` in `/etc/systemd/journald.conf`). Set `Storage=persistent` and `mkdir /var/log/journal` to keep history.
- **Failed units stay failed until you say so.** `systemctl reset-failed nginx` clears the failed state without starting.
- **`After=` is not `Requires=`.** `After=foo` means "start me after foo if foo is started." It does NOT mean "start foo for me." Use `Requires=foo` (hard) or `Wants=foo` (soft) for the dependency.
- **Editing the vendor unit gets blown away on upgrade.** Use `systemctl edit` (drop-in) or copy the whole unit to `/etc/systemd/system/`.

---

## 7. On-the-spot exercises

**E17.1** — Is the SSH service running?

<details><summary>Show answer</summary>

```sh
systemctl is-active ssh         # or sshd on RHEL/Fedora
systemctl status ssh
```
</details>

**E17.2** — List every service that's *failed* on this box.

<details><summary>Show answer</summary>

```sh
systemctl --failed
# or
systemctl list-units --state=failed
```
</details>

**E17.3** — Restart `cron` and confirm it's running.

<details><summary>Show answer</summary>

```sh
sudo systemctl restart cron
systemctl status cron
```
</details>

**E17.4** — Disable `bluetooth` from starting at boot but leave it running for now.

<details><summary>Show answer</summary>

```sh
sudo systemctl disable bluetooth
systemctl is-enabled bluetooth   # → disabled
systemctl is-active bluetooth    # → still active (we only disabled)
```

Use `disable --now` to also stop immediately.
</details>

**E17.5** — Show all log entries from the SSH service in the last 10 minutes.

<details><summary>Show answer</summary>

```sh
journalctl -u ssh --since "10 min ago"
```

Or `--since "2026-05-16 13:00"` for an absolute timestamp.
</details>

**E17.6** — Tail-follow the journal for `nginx`. Stop with Ctrl+C.

<details><summary>Show answer</summary>

```sh
journalctl -u nginx -f
```
</details>

**E17.7** — Reload `nginx`'s config without restarting (assume `ExecReload` is set).

<details><summary>Show answer</summary>

```sh
sudo nginx -t                     # always validate first
sudo systemctl reload nginx
```

`nginx -t` is gold — it parses the config and reports errors *before* you reload. Skipping it has caused outages.
</details>

**E17.8** — Override a service to increase its file-descriptor limit to 65536.

<details><summary>Show answer</summary>

```sh
sudo systemctl edit nginx
```

In the editor:

```
[Service]
LimitNOFILE=65536
```

Save. Then:

```sh
sudo systemctl daemon-reload
sudo systemctl restart nginx
cat /proc/$(pgrep -f 'nginx: master' | head -1)/limits | grep "Max open files"
```
</details>

---

## 8. Real-world sysadmin scenario

**"The website is down."** Standard playbook:

```sh
# 1. Is the service running?
systemctl status nginx
# Active: failed (Result: exit-code) since Fri 2026-05-16 14:32:01 UTC

# 2. Why did it fail?
journalctl -u nginx --since "5 min ago" -p err | tail -20
# nginx: [emerg] unknown directive "wokrer_processes" in /etc/nginx/nginx.conf:1

# 3. Fix the typo
sudo vi /etc/nginx/nginx.conf

# 4. Validate before reload
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 5. Start it back up
sudo systemctl start nginx
systemctl is-active nginx
# active
```

Five commands, ~30 seconds, real diagnosis. **Always** `systemctl status` and `journalctl` *before* you start randomly restarting things.

Another classic — a service is in a restart loop:

```sh
systemctl status myapp
# ...
# Active: activating (auto-restart) (Result: exit-code)
journalctl -u myapp --since "5 min ago" | tail -50
# Repeating: "ENOSPC: no space left on device"
df -h /var
# /var is 100% — root cause found
```

This is the *full* operational loop. systemd doesn't fix bugs; it *exposes them clearly*, which is more valuable.

---

## 9. What to remember

- systemd is PID 1. Units (`.service`, `.timer`, etc.) describe what should run.
- `systemctl status / start / stop / restart / reload / enable / disable`.
- `journalctl -u UNIT` for logs; `-f` to follow, `--since` for time bounds.
- After unit-file changes: `systemctl daemon-reload`.
- Use `systemctl edit` for overrides; never edit vendor units directly.
- `reload` over `restart` when supported. Validate configs (`nginx -t` etc.) before reload.

---

## 10. Next

You can manage services. Now let's understand the network they listen on.

➡ [`18-networking.md`](18-networking.md) — `ip`, `ss`, `dig`, `curl`, the basics.
