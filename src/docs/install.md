# Install & activate Skelpr

Skelpr has two halves, and they are gated differently. **Installing is open** — `pip` finds the
package and puts the commands on your `PATH` with no account at all. **Running is licensed** — the
first command that does real work asks for a token, and every machine that activates takes one seat
on it.

This page is the first hour, in full: what to have running, how to install, how to activate the
machine, and the output to expect at each step.

## Prerequisites

Put these in place before you install anything. The first two are the ones that fail *quietly* when
missing, which is why they lead.

| Requirement | Needed for | Notes |
|---|---|---|
| **Python 3.10 or newer** | everything | `python3 --version`; on Windows, `py --version`. |
| **`git` on your `PATH`** | `review`, `diff` and `fix` | indexing and `ask` still work without it. |
| **`ripgrep`** | fast lexical search | optional — a pure-Python fallback is used when it is absent. |
| **Docker Desktop, running** | `skelpr setup`, and sandboxed `validate` | start it and let it finish booting; `skelpr setup` checks the daemon and stops at step 1 if it is down. |
| **An embeddings server** | `skelpr index` and vector retrieval — in **both** modes | by default, LM Studio serving `nomic-embed-text-v1.5` at `http://127.0.0.1:1234/v1`. |
| **A generation model, or a provider key** | `ask`, `chat`, `review`, `fix` | not needed in MCP mode — your agent brings its own model. |

> **Without Docker** the core still runs end to end on in-memory fallbacks. You lose the
> production-grade stores and the sandbox that `validate` runs in — not the assistant.

### Docker services

`skelpr setup` starts two services and builds one image:

| Service | Address |
|---|---|
| PostgreSQL 16 | `localhost:5434` |
| Qdrant | `localhost:6333` and `localhost:6334` |
| Sandbox image | `skelpr-runner:latest` |

### The embedding model

Indexing and retrieval both embed your query, so the embeddings server matters in **both** modes —
the MCP server has no language model of its own, but its search still has to turn text into vectors.

1. In LM Studio, download and load **`nomic-ai/nomic-embed-text-v1.5`** — GGUF, `Q8_0`, about 146 MB.
2. Start the local server on port **1234**.
3. Check it answers *before* you index:

```bash
curl -s http://127.0.0.1:1234/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"input":["hi"],"model":"text-embedding-nomic-embed-text-v1.5@q8_0"}'
```

> Leave it down and indexing still runs — over a deterministic hashing embedder. That is why the
> symptom is quietly worse recall rather than an error message, and why it is worth the check.

## Get a token

Request access at **[skelpr.com](/#waitlist)**. You are issued a personal
**token** that looks like this:

```
LDX1.<payload>.<signature>
```

It records your name, your email, the features you may use, an expiry date, and a **seat count**.
A seat counts a **machine** — not a person, not a repository — so the number on the token is how far
it can travel.

## Install

### 1. Point pip at the release channel

Skelpr is not on PyPI. Add the vendor's index once, and every `pip install` afterwards finds it:

| Platform | File |
|---|---|
| Linux / macOS | `~/.config/pip/pip.conf` |
| Windows | `%APPDATA%\pip\pip.ini` |

```ini
[global]
extra-index-url = https://skelpr-packages.storage.googleapis.com/simple/
```

`extra-index-url`, **never** `index-url`: the channel carries `skelpr` and nothing else, so replacing
PyPI outright would leave its dependencies unresolvable. The line goes in once — not per project.

### 2. Install the package

```bash
python3 -m pip install skelpr
```

Optional extras, when you want the production backends or the MCP server:

```bash
pip install "skelpr[postgres,vector,ast,server]"   # production stores and the HTTP API
pip install "skelpr[mcp]"                          # MCP server for coding agents
pip install "skelpr[all]"                          # everything
```

### Install on Linux or macOS

```bash
python3 -m pip install skelpr
skelpr --version
```

If `python3` is not the interpreter you meant, `python3 -m pip` installs for the one it resolves to,
which is the same one the `skelpr` command will then use.

### Install on Windows

In **PowerShell**:

```powershell
py -m pip install skelpr
skelpr --version
```

If `skelpr` is not recognised, the `Scripts` folder inside your Python installation is not on
`PATH`. Add it, then open a **new** terminal — an already-open one keeps the old environment.

### Install without an index

On a machine that cannot reach the index — air-gapped, or behind a proxy that will not allow it —
install the wheel the vendor sent you instead:

```bash
pip install ./skelpr-<version>-py3-none-any.whl
```

### 3. Check it installed

```bash
skelpr --version
```

```
skelpr 0.1.2
```

```bash
skelpr --help
```

```
 Usage: skelpr [OPTIONS] COMMAND [ARGS]...

 Skelpr -- Fully local AI dev assistant (PR review, fix, patch, test, index).

╭─ Commands ───────────────────────────────────────────────────────────────╮
│ init             Create .skelpr.yaml and detect the stack.               │
│ index            Build/refresh the hybrid knowledge base.                │
│ ask              Ask a grounded question about the repo.                 │
│ chat             Interactive loop for ask/fix - no shell quoting needed. │
│ context          Export token-optimized context chunks to stdout.        │
│ review           Review a git diff and emit structured findings.         │
│ fix              Diagnose an issue and generate a minimal patch.         │
│ validate         Run configured test/lint/typecheck in the sandbox.      │
│ serve            Start the local FastAPI server.                         │
│ setup            Build Docker sandbox and verify dependencies.           │
│ install-mcp      Auto-configure MCP server for detected agents.          │
│ uninstall-mcp    Remove Skelpr MCP config from detected agents.          │
│ register-agent   Register a custom MCP-compatible agent.                 │
│ activate         Bind this machine to your token, or renew its lease.    │
│ license          Show the license state of this machine.                 │
│ deactivate       Release this machine's seat at the license service.     │
│ github           GitHub integration commands (opt-in).                   │
╰──────────────────────────────────────────────────────────────────────────╯
```

**`--version` and `--help` are never gated.** They work before a token exists, on purpose: help that
refuses to be read is no help at all.

## Activate

Activation is one command and the only step that needs the network. Paste the token from your email:

```bash
skelpr activate <the token from your email>
```

Or read it from a file you saved it in, or pipe it in:

```bash
skelpr activate --file token.txt
cat token.txt | skelpr activate
```

A successful activation prints:

```
Activating for Acme Corp …
Activated.
  issued to : dev@acme.example
  seat      : machine 1 of 3
  lease     : managed: re-authorizes every 10 minutes, and cannot run at all without reaching it
  stored at : ~/.skelpr/lease.key
```

On Windows the last line is `%USERPROFILE%\.skelpr\lease.key`.

The token's signature is verified **offline first**, so a mistyped, expired or revoked token fails
while the email is still open — before anything is stored. Only then does the machine ask the
service for a **seat**, and receive back a **lease**: a small signed document that binds the token to
*this* machine and expires on its own.

### What activation sends

The token, and a hash of a machine id. No hostname, no file paths, no code, no usage. Retrieval,
indexing and review all run locally; a machine on an `offline` token never calls again after this.

### Seats

A **seat is a machine**:

- a second machine takes a second seat, up to the count on the token;
- activating twice on one machine takes one seat — reinstalling is not a second machine;
- `skelpr deactivate` hands the seat back at the service and clears the local lease, so a retired
  laptop does not hold one hostage. Do it before wiping a machine;
- a machine that comes back after deactivating gets its same seat number.

`skelpr activate` says so when the last seat is taken. Out of seats, ask for one to be freed or for a
token with a bigger count — nothing else about the install changes.

## First run

```bash
cd <your-repo>

skelpr setup        # start Postgres, Qdrant and the sandbox — Docker must be running
skelpr init         # write .skelpr.yaml and detect the stack
skelpr index        # build the hybrid knowledge base
skelpr ask "how does authentication token refresh work?"
```

Rather than run a model locally, hand `init` a provider key:

```bash
skelpr init --gemini YOUR_KEY      # Google Gemini
skelpr init --openai sk-proj-...   # OpenAI
skelpr init --anthropic sk-ant-... # Anthropic
skelpr init --openrouter YOUR_KEY  # OpenRouter
skelpr init --groq gsk_...         # Groq
skelpr init --local                # a model server on your own machine (the default)
```

`skelpr init` writes `.skelpr.yaml` and reports what it found:

```
Wrote <your-repo>/.skelpr.yaml
Detected language: typescript
Provider: local (qwen2.5-14b-instruct)
Test: npm test  Lint: npx eslint .  Typecheck: npx tsc --noEmit
Next: skelpr index
```

The language, test, lint and typecheck lines are detected from *your* repository, so they differ
from repo to repo.

## Check the license

```bash
skelpr license
```

An activated machine reports:

```
Skelpr license
  status   : active
  licensed : Acme Corp
  email    : dev@acme.example
  seat     : machine 1 of 3
  machine  : <a hash of this machine>
  lease    : managed: re-authorizes every 10 minutes, and cannot run at all without reaching it
  edition  : standard
  features : core
  token    : expires 2027-09-30 (365 days remaining)
  source   : ~/.skelpr/lease.key
```

`skelpr license` also works as a scriptable predicate:

| Exit code | Meaning |
|---|---|
| `0` | this machine is activated |
| `3` | this machine is not activated |

So `skelpr license >/dev/null \|\| echo "not activated"` is a usable check.

## What refuses without activation

| Surface | Behaviour |
|---|---|
| CLI | every command that does work — `init`, `index`, `ask`, `review`, `fix`, `validate`, `serve`, `setup`, `install-mcp` — exits **3** with the reason and the route in |
| MCP server | refuses to start: exit **3**, with the reason on stderr |
| HTTP API | every route answers **403**; `/health` keeps answering |
| Token unusable | the token handed to `activate` could not be used, or the service refused it — exit **1** |

An unactivated machine explains itself rather than failing silently:

```
$ skelpr index
error: license required: this machine is not activated (lease lapsed 3 minutes ago —
this machine has not checked in) — run `skelpr activate` to bind it (the token's
seats are counted when you do)
Skelpr runs on an activated machine, and each machine takes one seat on your token.
Request access at https://skelpr.com/#waitlist; you will be issued a personal token.
    skelpr activate <token>     # binds this machine (needs network; one call)
    skelpr license              # state, seats used, and the lease's expiry
Activation sends only the token and a hash of this machine's id.
```

Always available, activated or not: `skelpr --version`, `--help`, `skelpr activate`,
`skelpr deactivate` and `skelpr license`.

## Moving to another machine

```bash
skelpr deactivate
```

That releases the seat at the service and clears the lease locally — run it before retiring or
wiping a machine, so the seat is not held by a laptop nobody uses.

## Troubleshooting

| Symptom | What it means |
|---|---|
| `skelpr: command not found` | pip's script directory is not on your `PATH`. Add it and open a new terminal. |
| `No matches found` from pip, or no distribution found | The `extra-index-url` line is missing, or in the wrong file for your platform. |
| `error: license required: this machine is not activated` | The token is installed but `activate` has not run on *this* machine. A token alone does not open the gate. |
| `That token cannot be used` | Expired, revoked, or signed by another key. Send it back to the vendor. |
| `No seats left` | Every seat is in use. `skelpr deactivate` on a machine you no longer use, or ask for a bigger count. |
| `This build carries no activation key` | The build predates activation. Install the current release from the channel. |
| `This lease was issued for a different machine` | A lease file was copied between machines. Run `skelpr activate` here. |
| `skelpr index` runs, but answers cite almost nothing | The embedding server is not reachable; indexing fell back to keyword-only. Re-check the port-1234 call above. |
| It worked yesterday, not today | Run `skelpr license` first — it names an expired lease or a revocation before anything else guesses. |

## Uninstall

Three things to undo, in order:

1. **Remove the agent configuration**, if you registered Skelpr with an agent:

   ```bash
   skelpr uninstall-mcp
   ```

2. **Uninstall the package**:

   ```bash
   pip uninstall skelpr
   ```

3. **Remove the local state** — the token, the lease and the machine id:

   | Platform | Directory |
   |---|---|
   | Linux / macOS | `~/.skelpr` |
   | Windows | `%USERPROFILE%\.skelpr` |

   If you are giving up the machine, run `skelpr deactivate` **before** deleting the directory, so
   the seat is released rather than left dangling.
