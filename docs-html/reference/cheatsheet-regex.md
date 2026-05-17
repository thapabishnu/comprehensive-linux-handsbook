# Regex cheatsheet

> For `grep -E`, `sed -E`, `awk`, vim's `/`, and most languages' regex libraries.

---

## Single-character matchers

| Pattern | Matches |
|---|---|
| `a` | The literal `a` |
| `.` | Any single character (except newline by default) |
| `[abc]` | One of `a`, `b`, `c` |
| `[a-z]` | One lowercase letter |
| `[A-Z0-9]` | One uppercase letter or digit |
| `[^abc]` | One char NOT in the set |

## Anchors

| Pattern | Matches |
|---|---|
| `^` | Start of line |
| `$` | End of line |
| `\b` | Word boundary (most flavors) |
| `\B` | Not a word boundary |

## Quantifiers

| Pattern | Means |
|---|---|
| `*` | Zero or more |
| `+` | One or more (ERE) |
| `?` | Zero or one (ERE) |
| `{n}` | Exactly n |
| `{n,}` | n or more |
| `{n,m}` | Between n and m |

## Grouping / alternation

| Pattern | Means |
|---|---|
| `(abc)` | Group; capture group #1 |
| `(?:abc)` | Non-capturing group (PCRE only) |
| `a|b` | `a` or `b` (ERE) |

## POSIX character classes (portable)

| Class | Equivalent | What |
|---|---|---|
| `[[:digit:]]` | `[0-9]` | Digit |
| `[[:alpha:]]` | `[A-Za-z]` | Letter |
| `[[:alnum:]]` | `[A-Za-z0-9]` | Letter or digit |
| `[[:lower:]]` / `[[:upper:]]` | `[a-z]` / `[A-Z]` | Letter case |
| `[[:space:]]` | ` \t\n\r\f\v` | Whitespace |
| `[[:punct:]]` | punctuation | |
| `[[:xdigit:]]` | hex digit | `[0-9A-Fa-f]` |

## PCRE shortcuts (`grep -P` and most modern langs)

| Pattern | Matches |
|---|---|
| `\d` / `\D` | Digit / non-digit |
| `\w` / `\W` | Word char (letter/digit/_) / non-word |
| `\s` / `\S` | Whitespace / non-whitespace |
| `\n` `\t` `\r` | Newline, tab, carriage return |

## Lookaround (PCRE; `grep -P`)

| Pattern | Matches |
|---|---|
| `(?=X)` | Lookahead — followed by X (X not consumed) |
| `(?!X)` | Negative lookahead |
| `(?<=X)` | Lookbehind |
| `(?<!X)` | Negative lookbehind |

## Common recipes

| Goal | Pattern |
|---|---|
| IPv4 | `[0-9]{1,3}(\.[0-9]{1,3}){3}` (loose) |
| Email-ish | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` |
| URL-ish | `https?://[^\s]+` |
| Hex color | `#[0-9A-Fa-f]{6}` |
| Date YYYY-MM-DD | `[0-9]{4}-[0-9]{2}-[0-9]{2}` |
| ISO timestamp | `[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z?` |
| Whitespace line | `^[[:space:]]*$` |
| Comment + blank line | `^[[:space:]]*(#|$)` |
| Trim trailing space | replace `[[:space:]]+$` with empty |
| Match between quotes | `"[^"]*"` |
| Match between parens | `\([^)]*\)` |

## Flavors at a glance

| Tool | Default | "Extended" mode | Lookarounds |
|---|---|---|---|
| `grep` | BRE | `grep -E` (ERE) | `grep -P` (PCRE) |
| `sed` | BRE | `sed -E` (ERE) | no |
| `awk` | ERE | n/a | no |
| `vim` | "magic" (mostly BRE) | `\v` very-magic | no |
| Python `re` | PCRE-like | yes | yes |
| JavaScript | PCRE-ish | yes | yes |

**In BRE, you must escape `?`, `+`, `{`, `}`, `|`, `(`, `)` with `\` to use them as operators.** Easier: just use ERE (`-E`).

---

## Always

- Quote your pattern in the shell: `'^[A-Z]+$'`.
- Anchor when you mean to: `^pattern` or `pattern$` or both.
- Greedy is the default. Use `[^X]*` (negated class) for "lazy-ish" in BRE/ERE.

---

[← back to home](../README.md)
