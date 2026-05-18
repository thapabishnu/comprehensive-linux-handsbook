# 11 — Processes and jobs


---

## 1. Why this matters

Every running thing on Linux — your shell, the web server, your editor, the kernel modules pretending to be files — is or relates to a **process**. Inspecting, signaling, backgrounding, and (carefully) killing them is the bread and butter of operations. A box "running slow" or a service "stuck" almost always has its answer in `ps`, `top`, or `kill`.

---

## 2. Mental model

A process has:

- A **PID** (process ID — a unique integer).
- A **PPID** (parent process ID — the process that spawned it).
- A **UID/GID** (whose privileges it runs with).
- A **state** — Running, Sleeping (idle), Stopped, Zombie (terminated but not yet cleaned up by its parent).
- **Resources** — open file descriptors, CPU/memory usage.

Every process has a parent. Trace up far enough and you reach `PID 1` — `init` or `systemd`, the first thing the kernel runs.

```
   systemd (PID 1)
     ├─ sshd
     │   └─ sshd: yourname@pts/0
     │       └─ bash (your shell)
     │           └─ vim ← this is YOU right now
     ├─ nginx
     │   ├─ nginx: worker 1
     │   └─ nginx: worker 2
     └─ cron
```

You can ask the kernel anything about any process via `/proc/<PID>/` — it's a virtual filesystem of process internals.

### Foreground, background, jobs

When you run a command, by default it runs **in the foreground** — it owns your terminal until it exits. You can:

- Add `&` at the end → runs **in the background**.
- Press `Ctrl+Z` → **suspends** the foreground process (stops it; doesn't kill).
- `bg` → resume a suspended process in the background.
- `fg` → bring a backgrounded job back to the foreground.

A *job* is a shell concept (one or more processes started by one command line). Jobs have job IDs like `%1`, `%2`. Processes have PIDs.

---

## 3. Core commands

### Inspecting

| Command | What it shows |
|---|---|
| `ps` | Your processes in this terminal. |
| `ps -ef` | Every process, full format (POSIX style). |
| `ps aux` | Every process, BSD style (common on Linux). |
| `ps -fU yourname` | Every process owned by you. |
| `ps -e --forest` | Tree view of process parent/child. |
| `pgrep pattern` | PIDs of processes matching name. |
| `pidof program` | PID(s) of running `program`. |
| `top` | Live process view (sorted by CPU). |
| `htop` | Friendlier `top` (install separately). |
| `pstree` | Process tree. |
| `cat /proc/<PID>/status` | Detailed kernel info on a process. |

### Signaling and killing

| Command | Effect |
|---|---|
| `kill PID` | Send default signal (`TERM` — please exit). |
| `kill -9 PID` | Send `KILL` — immediate, unblockable. **Last resort.** |
| `kill -HUP PID` | Reload config (many daemons honor this). |
| `pkill pattern` | Kill by name pattern. |
| `killall name` | Kill all processes with that exact name. |

### Common signals

| Signal | Number | Meaning |
|---|---|---|
| `TERM` | 15 | "Please terminate gracefully." Default. |
| `KILL` | 9 | "Die immediately." Can't be caught or ignored. |
| `HUP` | 1 | "Hang up." Often used to mean "reload config." |
| `INT` | 2 | What `Ctrl+C` sends. Interrupt. |
| `STOP` | 19 | Suspend (can't be caught). |
| `CONT` | 18 | Continue a stopped process. |
| `USR1`, `USR2` | 10, 12 | User-defined; apps choose what they mean. |

### Job control

| Command | Effect |
|---|---|
| `cmd &` | Start in background. |
| `Ctrl+Z` | Suspend current foreground job. |
| `jobs` | List your jobs and their state. |
| `fg %1` | Bring job 1 to foreground. |
| `bg %1` | Continue job 1 in background. |
| `kill %1` | Kill job 1 (note: `%1` not PID). |
| `disown %1` | Detach a job from this shell so it survives logout. |
| `nohup CMD &` | Run a command immune to hangup (survives shell exit). |

For sessions that *must* survive — long deploys, training jobs — use **tmux** or **screen** (full terminal multiplexers). They're worth learning; we touch them lightly here.

---

## 4. Guided walkthrough

```sh
# inspect
ps                  # just your shell + ps
ps -ef | head -10   # everything, first 10
ps aux | wc -l      # how many processes total?
top                 # live; q to quit, k to kill from inside

# job control
sleep 60 &          # background job — prints "[1] 12345"
jobs                # [1]+ Running   sleep 60
fg %1               # bring back; Ctrl+C to kill
sleep 30
[Ctrl+Z]            # suspends sleep — "[1]+ Stopped"
bg %1               # resume in background
jobs                # [1]+ Running   sleep 30 &
wait                # wait for all bg jobs

# find a process and signal it
sleep 999 &
pgrep sleep         # → PID
kill $(pgrep sleep) # graceful TERM
pgrep sleep         # → empty
```

Try the `kill -9` pattern only when you've already tried `kill` and it didn't work. Killing too aggressively can leave temp files and locks around — applications can't clean up if they can't run their shutdown handler.

### nohup vs disown vs tmux

- `nohup CMD &` — runs CMD, redirects output to `nohup.out`, immune to HUP signals. Survives shell exit. Good for fire-and-forget.
- `disown` — used after the fact: `cmd &; disown %1` removes the job from the shell's job table so it won't be HUP'd on logout.
- `tmux` — opens a multiplexed terminal session that *runs on the server even if you disconnect*. Reattach with `tmux attach`. Standard for any work that takes more than 30 seconds.

---

## 5. Gotchas

- **`kill -9` doesn't run cleanup.** No saved data, no released locks. Try `kill` (which is `kill -TERM`) first, give it a few seconds, then escalate.
- **`pkill` matches against names by default; can match too much.** `pkill nginx` is safer than `pkill -f api` (which matches anywhere in the command line including args).
- **The grep-trap.** `ps aux | grep nginx` matches the `grep nginx` process itself. Use `pgrep`, or `ps aux | grep '[n]ginx'` — the bracket trick.
- **Zombies aren't really running.** A zombie is a process that has *exited* but whose parent hasn't read its exit code yet. They take no CPU. They *do* take a PID slot. The fix is fixing the parent, not killing the zombie.
- **`Ctrl+Z` doesn't kill** — it stops. Suspended processes still hold their resources. Use `kill %1` after Ctrl+Z if you want it gone.
- **`top` columns shift across systems.** `htop` is more consistent and friendlier. Worth installing.
- **`nohup` redirects output to `nohup.out` by default.** If you don't want a file, explicitly redirect: `nohup cmd > /tmp/cmd.log 2>&1 &`.

> **Mentor habit:** before `kill -9`, ask yourself, "what is the cost if this app can't run its cleanup handler?" For nginx, low. For a database, high. For an in-progress git push, possibly catastrophic.

---

## 6. On-the-spot exercises

**E11.1** — Show every process owned by your user.

<details><summary>Show answer</summary>

```sh
ps -fU "$USER"
```

`-f` is full format; `-U user` filters by user.
</details>

**E11.2** — How many processes are currently running on this system?

<details><summary>Show answer</summary>

```sh
ps -e --no-headers | wc -l
```
</details>

**E11.3** — Find the PID of `sshd` (the SSH daemon).

<details><summary>Show answer</summary>

```sh
pgrep -a sshd      # shows PIDs and the command line
# or
pidof sshd
```
</details>

**E11.4** — Start `sleep 100` in the background. Confirm with `jobs`. Bring it to the foreground and kill it with `Ctrl+C`.

<details><summary>Show answer</summary>

```sh
sleep 100 &
jobs                # [1]+ Running   sleep 100 &
fg %1               # cursor blocks; press Ctrl+C
```
</details>

**E11.5** — In `top`, sort processes by *memory* instead of CPU.

<details><summary>Show answer</summary>

Inside `top`: press `M` (capital M). Press `P` to return to CPU sort. Press `q` to quit.

`htop` uses F6 to choose the sort field — friendlier UI.
</details>

**E11.6** — A coworker's misbehaving Python script is at PID 4242. Try to terminate it gracefully; if that fails, force-kill.

<details><summary>Show answer</summary>

```sh
kill 4242          # default TERM
# wait a few seconds, check if still running
ps -p 4242         # if still there:
kill -9 4242       # force kill
```
</details>

**E11.7** — Display a process tree showing parent/child relationships, starting at PID 1.

<details><summary>Show answer</summary>

```sh
pstree -p
# or
ps -e --forest
```

`-p` adds PIDs to each node in `pstree`.
</details>

**E11.8** — Run `tail -f /var/log/syslog` in a way that *survives* you logging out.

<details><summary>Show answer</summary>

```sh
nohup tail -f /var/log/syslog > /tmp/syslog-tail.log 2>&1 &
disown
```

Or use tmux:

```sh
tmux new -s logwatch
tail -f /var/log/syslog
# Ctrl-b d  → detach (session keeps running)
# tmux attach -t logwatch  → reattach later
```

tmux is the better pattern for anything you'll want to look at again.
</details>

---

## 7. Real-world sysadmin scenario

**Box is at 100% CPU; no obvious culprit.** You SSH in:

```sh
uptime                       # load: 12.4 12.1 11.8 → sustained high
top -bn1 | head -20          # snapshot of top processes
```

`top` shows `mysqld` at 380% CPU. *That* needs a deeper look:

```sh
pgrep -a mysqld                                 # which PIDs?
ps -o pid,user,%cpu,%mem,start,etime,cmd -p 12345
ls -l /proc/12345/cwd                           # what's its working dir?
cat /proc/12345/status | head -20               # state, parent, threads
```

Now you have *evidence* before touching anything. A bad query is hammering MySQL — the fix is in the DB, not killing the process. If you'd jumped straight to `kill -9`, you'd have lost in-flight transactions, gained 30 seconds of relief, and watched the problem return when the next query started.

For genuinely-stuck services that need to die: `systemctl restart mysql` is gentler than `kill -9`, because it goes through the unit's defined shutdown sequence. We meet systemd in module 17.

---

## 8. What to remember

- Every process has a PID and a parent. `pstree` and `ps --forest` show the family tree.
- Default kill is `TERM` (graceful). `-9 KILL` is last resort.
- `Ctrl+Z` suspends, `fg`/`bg` resumes, `&` backgrounds.
- For long jobs that must survive your shell: `nohup` or **`tmux`**.
- `top` / `htop` first; `ps` for snapshots; `pgrep`/`pkill` for name matches.
- Zombies are dead; fixing the parent is the fix.

---

## 9. Next

You can see and control what's running. Now let's build pipelines that crunch data.

➡ [`12-text-toolbox.md`](12-text-toolbox.md) — cut, sort, uniq, tr, paste, comm, diff.
