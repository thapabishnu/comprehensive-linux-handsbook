# 18 — Networking basics


---

## 1. Why this matters

Production Linux *is* a networking platform. Web servers, databases, microservices — they all talk over IP. When "it works on localhost but not from outside," when DNS misbehaves, when a port shows as open from one machine but closed from another, you reach for the shell tools below. They're the difference between guessing and *knowing*.

---

## 2. Mental model

Networking has layers; for sysadmin work, four of them matter:

```
   L7  HTTP / SSH / SMTP / DNS              ← what apps speak
   L4  TCP / UDP / ports (16-bit numbers)   ← connections
   L3  IP addresses, routes                 ← addressing
   L2  MAC addresses, the local link        ← Ethernet/Wi-Fi
```

When something doesn't work, you go *bottom-up*: is the cable up (L2), do I have an IP (L3), is the port open (L4), is the protocol responding (L7)? Each layer has a tool.

---

## 3. Core commands

### Layer 2 / 3 — links, addresses, routes

| Command | What it shows |
|---|---|
| `ip link` | Network interfaces (up/down, MAC) |
| `ip -4 addr` | IPv4 addresses on each interface |
| `ip -6 addr` | IPv6 |
| `ip route` | Routing table — where packets to a given IP would go |
| `ip neigh` | ARP table (which MAC ↔ IP locally) |
| `nmcli` (NetworkManager) | Higher-level config: connections, profiles |
| `ping host` | "Is this reachable, and how fast?" |
| `traceroute host` | The hops between you and host |
| `mtr host` | Continuous traceroute + latency stats |

### Layer 4 — TCP/UDP, ports

| Command | What it shows |
|---|---|
| `ss -tulpn` | Listening sockets (TCP/UDP, with PID, port, program) |
| `ss -tan` | All TCP connections (numeric, no DNS) |
| `nc -zv host port` | Test if a remote port is open |
| `nc -lv -p 12345` | Open a listener for testing |
| `ufw status` / `iptables -L` | Show firewall rules |

`netstat` is the old version of `ss` — same idea, slower, sometimes missing on modern systems. Use `ss`.

### DNS

| Command | What it shows |
|---|---|
| `dig example.com` | Authoritative-style DNS query |
| `dig +short example.com` | Just the answer |
| `dig MX example.com` | Mail server records |
| `dig @8.8.8.8 example.com` | Query a specific resolver |
| `nslookup example.com` | Older, simpler |
| `getent hosts example.com` | What the system resolver thinks |

### Layer 7 — HTTP, etc.

| Command | What it does |
|---|---|
| `curl https://example.com` | GET; print body |
| `curl -I https://example.com` | HEAD; print headers only |
| `curl -v https://example.com` | Verbose — TLS handshake, headers, body |
| `curl -L ...` | Follow redirects |
| `curl -o file URL` | Save to file |
| `wget URL` | Download (alternative to curl) |
| `openssl s_client -connect host:443` | Inspect the TLS certificate handshake |

---

## 4. Guided walkthrough

```sh
# Layer 2/3 — what links and addresses do we have?
ip link
ip -4 addr
ip route
ip route get 8.8.8.8         # which interface would I use to reach 8.8.8.8?

# Reachability
ping -c 4 8.8.8.8            # IP — tests L3
ping -c 4 google.com         # name — tests DNS too

# Layer 4 — what's listening on this box?
sudo ss -tulpn
# Common services you'll see:
#   :22  sshd
#   :80  nginx / apache
#   :443 nginx / apache
#   :53  systemd-resolve (a local DNS stub)

# Is a remote port open?
nc -zv example.com 443       # tests TCP 443 reachability
nc -zv example.com 22 2>&1 | head -1

# DNS
dig +short example.com
dig +short MX example.com
getent hosts example.com

# HTTP
curl -I https://example.com
curl -v https://example.com 2>&1 | head -30
```

> **Mentor habit:** when an app can't reach a service, *start at L3*. Can you ping it? If not, the problem is routing/firewall — not a config or an auth issue. Many wasted hours come from debugging at L7 when the issue is at L3.

---

## 5. Gotchas

- **`ifconfig` is deprecated.** Use `ip`. They're not 1:1 — `ip -4 addr show eth0`, not `ifconfig eth0`.
- **`ping` can be blocked by firewall.** A box that doesn't `ping` may still serve HTTP fine. Don't conclude "down" from ping alone.
- **`nc -zv` doesn't prove the service is alive** — only that *something* is accepting on that port. Use a protocol-aware test (curl, dig) for L7.
- **DNS caching.** Your system, your browser, and the upstream resolver all cache. Changes can take time. `sudo systemd-resolve --flush-caches` or `sudo systemctl restart systemd-resolved`.
- **Port 80/443 require root** to bind (anything below 1024 does). That's why services drop privileges *after* binding.
- **`ss -tulpn` needs root to see PIDs.** Without sudo you'll see the sockets but not which process owns them.
- **IPv6 surprises.** Many tools default to IPv4 unless told otherwise (`curl -6`, `dig AAAA`, etc.). If a service binds only `::1` (IPv6 localhost), connections to `127.0.0.1` will fail.

---

## 6. On-the-spot exercises

**E18.1** — What IPv4 address(es) does this box have?

<details><summary>Show answer</summary>

```sh
ip -4 addr | grep inet
# or
hostname -I
```
</details>

**E18.2** — What's the default gateway (where packets to the internet go)?

<details><summary>Show answer</summary>

```sh
ip route | grep default
# or
ip route show default
```
</details>

**E18.3** — Is `sshd` listening on this box? Which port?

<details><summary>Show answer</summary>

```sh
sudo ss -tulpn | grep ssh
```

Usually port 22. If it's something else, you've discovered a hardened SSH config.
</details>

**E18.4** — From this box, can you reach `example.com:443`?

<details><summary>Show answer</summary>

```sh
nc -zv example.com 443
# or
curl -I https://example.com   # if curl works, port is reachable + TLS works
```
</details>

**E18.5** — What's `example.com`'s IPv4 address (according to the public resolver)?

<details><summary>Show answer</summary>

```sh
dig +short example.com @8.8.8.8
# or shorter for the system resolver:
dig +short example.com
```
</details>

**E18.6** — Trace the route from here to `1.1.1.1`. Stop after 8 hops.

<details><summary>Show answer</summary>

```sh
traceroute -m 8 1.1.1.1
# or interactively:
mtr -n 1.1.1.1
```

`mtr` is much friendlier — continuous output with packet-loss stats per hop.
</details>

**E18.7** — Show the TLS certificate for `example.com`.

<details><summary>Show answer</summary>

```sh
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -subject -dates -issuer
```

The `echo |` closes stdin so `s_client` exits after the handshake. You get the cert subject, validity dates, and issuer.
</details>

**E18.8** — Run a tiny HTTP listener on port 8000 and curl it from another terminal.

<details><summary>Show answer</summary>

```sh
# Terminal 1
python3 -m http.server 8000

# Terminal 2
curl -I http://localhost:8000/
```

Useful for quick file shares or testing reverse-proxy configs.
</details>

---

## 7. Real-world sysadmin scenario

**"Web app can't reach the database."** Classic layered debug:

```sh
# 1. Is the DB host name resolving?
dig +short db.internal

# 2. Can I reach the DB IP at all (L3)?
ping -c 2 db.internal

# 3. Is the DB port open from this box (L4)?
nc -zv db.internal 5432

# 4. Is the DB *responding* on that port (L7)?
psql -h db.internal -U appuser -d appdb -c 'SELECT 1;'
```

Each step rules out one whole layer of bug. By step 4 you've localized the problem to: DNS, network/firewall, port-not-listening, or wrong credentials. Compare that to opening up application logs and guessing — totally different speed of fix.

Another classic — **"SSH suddenly stopped working."** Same loop:

```sh
ping target-host            # L3
nc -zv target-host 22       # L4 (also catches "they moved SSH to 2222")
ssh -v target-host          # L7 — verbose ssh shows handshake details
```

Verbose `ssh -v` is gold; it'll tell you "auth method publickey failed" vs "Connection refused" vs "Permission denied (publickey)" — three completely different problems with the same surface symptom.

---

## 8. What to remember

- Debug bottom-up: link → IP → port → protocol.
- `ip` replaces `ifconfig`; `ss` replaces `netstat`.
- `ss -tulpn` is your "what's listening" one-liner.
- `dig +short` for DNS without ceremony.
- `curl -v` for HTTP; `openssl s_client` for TLS.
- `ping` succeeds ≠ service alive. `nc -zv` is L4; you still need an L7 test.

---

## 9. Next

You can probe networks. Time to lock down access to your boxes.

➡ [`19-ssh-keys-and-2fa.md`](19-ssh-keys-and-2fa.md) — Keys, agents, 2FA, hardening.
