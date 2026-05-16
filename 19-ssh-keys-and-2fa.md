# 19 — SSH keys and 2FA

> *Maps to:* NCS 205 Labs 62–64.

---

## 1. Why this matters

Passwords on SSH are weak — they're guessable, phishable, and shared across machines. Keys solve guessability; 2FA solves the "key got stolen" problem. Together they're the modern minimum for any server you actually care about. The class lab on Google Authenticator (Lab 64) walks you straight into this.

---

## 2. Mental model

**Public-key authentication** is a math trick: you have a *private* key (a long secret on your laptop) and a *public* key (mathematically derived, safe to share). The server stores your public key in `~/.ssh/authorized_keys`. When you connect, the server sends a challenge that only your private key can answer correctly. **The private key never leaves your laptop.**

**2FA** (two-factor authentication) layers on a *time-based one-time password* (TOTP). After your key proves "what you have" (the laptop), the TOTP proves "what you also have right now" (your phone with Google Authenticator).

```
        ┌── factor 1: SSH key on laptop        ──┐
        │                                        ├──► access
        └── factor 2: TOTP code from phone (30s) ─┘
```

---

## 3. Core commands

### Keys

| Command | Effect |
|---|---|
| `ssh-keygen -t ed25519 -C "you@laptop"` | Generate a modern keypair |
| `ssh-keygen -t rsa -b 4096 -C "you@laptop"` | Older but universal |
| `ssh-keygen -p` | Change passphrase on an existing key |
| `ssh-keygen -l -f ~/.ssh/id_ed25519` | Show key fingerprint |
| `ssh-copy-id user@host` | Install your public key on the server |
| `cat ~/.ssh/id_ed25519.pub` | Print your public key (safe to share) |

### Agent (so you don't retype the passphrase)

| Command | Effect |
|---|---|
| `eval "$(ssh-agent -s)"` | Start the agent |
| `ssh-add ~/.ssh/id_ed25519` | Load the key (asks passphrase once) |
| `ssh-add -l` | List loaded keys |
| `ssh-add -D` | Drop all keys from the agent |

### SSH client config

`~/.ssh/config` lets you save per-host aliases:

```
Host prod-web
  HostName web-01.example.com
  User deploy
  Port 22
  IdentityFile ~/.ssh/id_ed25519
  ForwardAgent no

Host *
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

Then `ssh prod-web` is enough.

---

## 4. Guided walkthrough — passwordless login

```sh
# 1. Generate a key (skip if you already have one)
ssh-keygen -t ed25519 -C "you@$(hostname)"
# accept default path ~/.ssh/id_ed25519
# choose a passphrase — yes, really

# 2. View the public key
cat ~/.ssh/id_ed25519.pub

# 3. Install on the remote
ssh-copy-id you@remote-host
# (or manually: append the .pub line to ~/.ssh/authorized_keys on remote)

# 4. Verify
ssh you@remote-host
# should not prompt for password

# 5. Permissions sanity check (on remote)
ls -ld ~/.ssh ~/.ssh/authorized_keys
# expect:
# drwx------  ~/.ssh
# -rw-------  ~/.ssh/authorized_keys
```

If permissions are wrong, OpenSSH silently refuses to use the key. We hit this in module 07's scenario.

### Loading into ssh-agent (so you only type the passphrase once)

```sh
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519     # asks passphrase
ssh-add -l                     # see it loaded
ssh you@remote                 # no passphrase prompt now
```

Most desktop sessions start the agent for you automatically.

---

## 5. Adding Google Authenticator 2FA on a server

The lab's setup, on Debian/Ubuntu:

```sh
sudo apt install -y libpam-google-authenticator

# Run per-user setup
google-authenticator
# answer: y to time-based, y to update file, y to disallow reuse, n to rate limiting
# scan QR with the Google Authenticator app
# SAVE the emergency codes shown
```

Then tell SSH to use it. Two edits:

```sh
sudo vi /etc/pam.d/sshd
```

Add at the top:

```
auth required pam_google_authenticator.so
```

```sh
sudo vi /etc/ssh/sshd_config
```

Set:

```
ChallengeResponseAuthentication yes
UsePAM yes
AuthenticationMethods publickey,keyboard-interactive
```

That last directive requires **both**: the SSH key AND the TOTP code. Then:

```sh
sudo systemctl restart ssh
```

> **Mentor caution:** open a *second* SSH session before restarting `sshd` — if you've miswritten the config, the first session stays alive while you fix it. A locked-out box is a very long Saturday.

Test in a *new* shell:

```sh
ssh you@server
# now asks for the 6-digit code from your phone
```

---

## 6. Gotchas

- **`~/.ssh` must be 700, `authorized_keys` 600, your private key 600.** Otherwise OpenSSH refuses to use them.
- **Don't share `id_ed25519`** — that's your private key. Share `id_ed25519.pub`.
- **Passphrase your key.** "But I'd rather not type it" — that's what `ssh-agent` is for. An unpassphrased key is a single point of failure.
- **Disable password auth** after keys work: in `/etc/ssh/sshd_config`, set `PasswordAuthentication no`. Now the only way in is keys + (optionally) 2FA. Test before logging out.
- **Always keep a second session open** when changing `sshd` config.
- **Time skew breaks 2FA.** TOTP codes are 30-second windows. If your server's clock drifts, codes fail. `timedatectl status` should show "NTP synchronized: yes."
- **`AuthorizedKeysFile %h/.ssh/authorized_keys`** is the default. Don't change it unless you have a good reason; misconfigurations here have left servers wide open.

---

## 7. On-the-spot exercises

**E19.1** — Generate a new SSH key called `~/.ssh/id_test_ed25519`.

<details><summary>Show answer</summary>

```sh
ssh-keygen -t ed25519 -f ~/.ssh/id_test_ed25519 -C "test"
```

`-f` specifies the output filename. `-C` is a comment (useful for identifying which key is which when you have many).
</details>

**E19.2** — Show the fingerprint of your default key.

<details><summary>Show answer</summary>

```sh
ssh-keygen -l -f ~/.ssh/id_ed25519
```

Fingerprints are how humans verify "is this the key I think it is" — they're short enough to compare visually.
</details>

**E19.3** — Print the *public* portion of your default key.

<details><summary>Show answer</summary>

```sh
cat ~/.ssh/id_ed25519.pub
```

Safe to paste anywhere — into a GitHub web form, an `authorized_keys` file, a Slack message to your sysadmin.
</details>

**E19.4** — Install your public key on `localhost` so you can SSH to yourself without a password.

<details><summary>Show answer</summary>

```sh
ssh-copy-id "$USER@localhost"
ssh "$USER@localhost" whoami     # should NOT prompt for password
```
</details>

**E19.5** — Load your key into the agent, list, then remove it.

<details><summary>Show answer</summary>

```sh
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l
ssh-add -d ~/.ssh/id_ed25519
```
</details>

**E19.6** — Write a `~/.ssh/config` entry so `ssh box` connects to `192.168.1.50` on port 2222 as user `admin` with key `~/.ssh/id_box`.

<details><summary>Show answer</summary>

```sh
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat >> ~/.ssh/config <<'EOF'
Host box
  HostName 192.168.1.50
  Port 2222
  User admin
  IdentityFile ~/.ssh/id_box
EOF
chmod 600 ~/.ssh/config
```
</details>

**E19.7** — On a server, disable password authentication after confirming keys work.

<details><summary>Show answer</summary>

```sh
# First confirm keys work — open a second session in parallel
ssh you@server
# In the second session:
sudo sed -i.bak 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sshd -t                                # validate config — never skip
sudo systemctl reload ssh
```

If anything breaks, the *original* SSH session is still open — fix and re-reload from there.
</details>

**E19.8** — Set up 2FA for your account using Google Authenticator. (Follow the walkthrough in §5.)

<details><summary>Show answer</summary>

Follow §5 step-by-step. Test in a *new* shell while keeping the original logged in. The order to validate:

1. `ssh-key-only` still works for non-2FA users (don't break others)
2. Your account now requires both key + code
3. Save the emergency recovery codes off the server
</details>

---

## 8. Real-world sysadmin scenario

**You inherited a fleet of 30 servers** that still use password SSH. Migration plan:

```sh
# 1. On your laptop: generate one strong key, passphrase it
ssh-keygen -t ed25519 -C "you@$(hostname)"

# 2. Get the public key onto every box
for host in $(cat hosts.txt); do
  ssh-copy-id you@"$host"
done

# 3. Verify
for host in $(cat hosts.txt); do
  ssh -o BatchMode=yes -o StrictHostKeyChecking=no you@"$host" hostname 2>/dev/null \
    || echo "FAIL: $host"
done

# 4. Once all green, disable password SSH on each box
for host in $(cat hosts.txt); do
  ssh you@"$host" "
    sudo sed -i.bak 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config &&
    sudo sshd -t &&
    sudo systemctl reload ssh
  "
done
```

`BatchMode=yes` forces SSH to fail rather than prompt — useful for scripted checks. After step 4 your fleet is keys-only.

For the *very* sensitive servers, layer 2FA on top using the §5 procedure. Now even a stolen key can't get in.

---

## 9. What to remember

- Public key on the server (`~/.ssh/authorized_keys`); private key on your laptop only.
- Permissions: `~/.ssh` = 700, files inside = 600. Or OpenSSH refuses.
- Passphrase your key. Use `ssh-agent`.
- `~/.ssh/config` saves you from typing hostnames and flags.
- 2FA via Google Authenticator + PAM + `AuthenticationMethods publickey,keyboard-interactive`.
- Always keep a second SSH session open when changing `sshd` config.

---

## 10. Next

You can lock down access. Now let's version-control the configs you've been editing.

➡ [`20-git-basics.md`](20-git-basics.md) — git for sysadmins.
