#!/bin/bash
# Linux mentor handbook — practice sandbox setup
# Creates ~/linux-sandbox with the files used by drills throughout the handbook.
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
