# Install & activate Skelpr

Skelpr supplies cited repository evidence to coding agents through MCP, or uses your
configured generation provider through the standalone CLI. Installing is public.
Running requires activation, with one seat per machine.

This guide describes the 0.3.6 source and installation changes. Check the installed
version with `skelpr --version`. Earlier releases may require the `mcp`, `ast`,
`postgres` and `vector` extras.

## Prerequisites

| Requirement | Needed for |
|---|---|
| Python 3.10 or newer | Installing and running Skelpr |
| Git on PATH | Diff, review, patch and Git-aware indexing |
| ripgrep on PATH | Explicit live-checkout text and path verification |
| A running Docker daemon | Standard `skelpr setup` and isolated validation |
| An embedding endpoint | Semantic indexing and vector retrieval |
| A generation provider | Standalone `ask`, `chat`, `review` and `fix` |

MCP uses your agent for generation. The agent chooses when to call Skelpr and may
require tool approval. Installation guidance encourages use without guaranteeing it.

### Docker services

`skelpr setup` checks Docker, starts the databases and builds the validation image.
Docker Desktop works on Windows/macOS. Docker Engine also works on Linux.

| Component | Default |
|---|---|
| PostgreSQL 16 | `localhost:5434` |
| Qdrant | `localhost:6333`, gRPC `6334` |
| Sandbox image | `skelpr-runner:latest` |

Setup resumes stopped containers. Newly created database containers use named
volumes `skelpr-postgres-data` and `skelpr-qdrant-data`. Existing container storage
is reused. Removing a data volume removes its index data.

You can configure external PostgreSQL and Qdrant services instead of Docker.
In-memory fallbacks last only for the current process, so a separate `index`
command cannot populate a later MCP process through memory alone. Host validation
requires `sandbox.allow_local_fallback: true` and executes commands on your machine.

### The embedding model

Indexing embeds source chunks. Vector search embeds questions. BM25 and symbol
retrieval can continue when vector retrieval is unavailable, with reduced recall.

The default local endpoint is `http://127.0.0.1:1234/v1`, with model
`text-embedding-nomic-embed-text-v1.5@q8_0`. Load the model in an OpenAI-compatible
server, then match the model ID in `.skelpr.yaml`.

```bash
curl -s http://127.0.0.1:1234/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"input":["hi"],"model":"text-embedding-nomic-embed-text-v1.5@q8_0"}'
```

Hosted providers require their endpoint, model and credentials. An eligible lease
can obtain a credential for the configured Skelpr hosted embedding endpoint.
Simply activating a token does not select that endpoint.

Keyless non-strict initialization can fall back to deterministic hashing.
Strict indexing, credentialed endpoints and the watcher refuse this substitution.
Changing embedding models requires rebuilding the vector index, even when their
dimensions match. Configure the intended provider before indexing.

## Get a token

Request access at [skelpr.com](/#waitlist). Your personal bearer token has the form
`LDX1.<payload>.<signature>` and includes identity, features, expiry and seat terms.
Keep it private.

## Install

From 0.3.6, the default package includes the CLI, MCP SDK, PostgreSQL/Qdrant clients
and local AST grammars. The optional HTTP API uses the `server` extra.

```bash
python -m pip install --upgrade skelpr
skelpr --version
skelpr --help
```

Use `python3` on Linux/macOS or `py` on Windows if that selects your intended Python.
A virtual environment keeps the installation isolated. If the `skelpr` command is
missing, activate that environment or add its scripts directory to PATH.

```bash
python -m pip install "skelpr[server]"   # optional HTTP API
```

AST grammars cover Python, JavaScript, TypeScript, Go, Rust, Java, Ruby, C, C++ and
C#. Parser loading is lazy and uses installed grammars. Unsupported syntax can
fall back to regex extraction and line chunks, with less structural precision.
BM25 operates over indexed text independently of language.

### Install without an index

A vendor-supplied wheel can be installed directly. Offline installation also needs
local copies of its dependencies for your Python version and operating system.

`x.x.x` is whatever your install reports: this page does not pin a release number, which
changes with every publish.

```bash
python -m pip install --no-index --find-links ./wheelhouse skelpr
```

`--version` and `--help` work before activation.

## Activate

```bash
skelpr activate <token>
skelpr license
```

To keep the token out of shell command history, read it from a private file.

```bash
skelpr activate --file token.txt
```

Activation verifies the token, requests a seat from the service and stores the
returned machine-bound lease. Local state defaults to `~/.skelpr`, or
`%USERPROFILE%\.skelpr` on Windows. `SKELPR_HOME` relocates it. `SKELPR_LICENSE`
and `SKELPR_LEASE` override stored credentials, which can explain why a newly
saved activation is not the one being used.

### What activation sends

Activation and check-in send the token and a machine-id hash to the license
service. Managed leases check in automatically during use, about every ten
minutes. A due check-in that cannot reach the service prevents licensed work.
Offline-tier leases renew near expiry when online renewal is allowed.

Other connections depend on configuration.

| Connection | Data that may leave the machine |
|---|---|
| Hosted embedding provider | Indexed source text and search queries |
| Standalone generation provider | Prompts, selected source, diffs and task context |
| Optional Langfuse tracing | Inputs, outputs, source, citations and operational metadata |
| Hosted embedding credential service | Credential request and usage counters |
| Release check | Request for the published package version |
| Coding agent | Whatever its own model and tool policies allow |

Local endpoints keep those provider requests local. Langfuse requires its SDK and
credentials. Secret screening reduces exposure but does not guarantee removal of
all sensitive content. `SKELPR_OFFLINE=1` blocks licensing and release checks, not
separately configured model, database or telemetry connections.

### Seats

- Each activated machine occupies one seat. Re-activating the same machine reuses it.
- `skelpr deactivate` requests seat release and removes the local lease.
- If the service is unreachable during deactivation, ask the issuer to release the seat.
- Deactivate before retiring a machine or deleting its Skelpr state.

## First run

Start the embedding endpoint and Docker first. For an agent installation, skip
standalone generation setup.

```bash
cd <your-repo>
skelpr setup --no-configure
skelpr init
skelpr index
skelpr install-mcp
```

Reconnect the agent and confirm it lists `skelpr_search`. To target one client,
use `skelpr install-mcp --agent codex`, `--agent claude-code` or `--agent cursor`.
`--yes` configures all detected clients. `--print` emits a manual JSON entry.
Some clients use their own CLI configuration writer. Codex uses user scope.

For standalone CLI, run `skelpr setup` interactively to verify and save generation
and embedding settings, then `skelpr init` and `skelpr index`.

```bash
skelpr ask "how does authentication token refresh work?"
skelpr chat
skelpr doctor --verbose
```

`init` detects language and validation commands. Review `.skelpr.yaml` before
running validation because those commands execute code from the checkout.

### MCP tool use

Pass the complete question as `{"query": "your question"}` to `skelpr_search`.
`question` is an accepted alias, although clients can require canonical `query`
before sending. Leave budgets unset for automatic selection, or provide a limit.
Budgets and dependency traversal are bounded and cannot guarantee full coverage.

Cite returned file ranges or original `N|` source-line labels. Ask for missing
evidence with `skelpr_get_context`, using `missing_evidence` and `exclude_span_ids`
to avoid repeating evidence. Live `verification` requests check explicit paths or
literal terms and report scan limits. A bounded search cannot prove absence.

`skelpr_validate` runs configured checks in Docker by default. Host fallback is
explicitly enabled. Unknown check names or no configured checks produce a
configuration error. Inspect skipped checks as well as the overall result.

### Keeping the index fresh

```bash
skelpr watch
skelpr watch --poll 1 --debounce 1.5
```

Watch indexes once and then detects added, changed and removed files and HEAD
changes. It polls repository state with a filesystem fallback outside Git.
Detection is followed by a quiet debounce interval and indexing time, so it is
not instantaneous. It is opt-in inside MCP and `serve`.

```yaml
indexing:
  watch:
    enabled: true
    poll_seconds: 1.0
    debounce_seconds: 1.5
```

`SKELPR_AUTO_REINDEX=1` enables it for the process. Strict embedding failures trigger
backoff. PostgreSQL and Qdrant updates are not one cross-store transaction, so a
failure partway through indexing can leave partial updates. Inspect diagnostics
and complete a successful indexing pass after recovery.

## Check the license

```bash
skelpr license
```

The output identifies credential sources, license and lease terms, seat and status.
Exit `0` means active or explicit development mode. Exit `3` means unavailable.
`activate` exits `1` when activation fails. The signed terms and issuer policy
determine expiry and renewal behavior.

## What refuses without activation

| Surface | Behavior |
|---|---|
| CLI work commands | Refuse with exit `3` |
| MCP startup | Missing or invalid activation can refuse with exit `3` |
| MCP with a lease due for check-in | Handshake proceeds, first gated call checks in |
| MCP tools | Refusal content explains the license issue |
| HTTP API | Gated routes refuse, `/health` stays available |

Help, version, activation, deactivation and license inspection remain accessible.
`SKELPR_DEV=1` is an explicit development bypass. The Python client is not tamper-proof.

## Moving to another machine

Run `skelpr deactivate` on the old machine, then install and activate on the new
one. A lease copied between machines does not authorize the destination.

## Troubleshooting

| Symptom | Action |
|---|---|
| Command missing | Activate the intended environment and check PATH |
| MCP missing after upgrade | Restart the agent and verify its configured executable |
| Agent never calls a tool | Check tool discovery, approval settings and project instructions |
| License refusal | Run `skelpr license` and follow its specific reason |
| Due check-in fails | Restore access to the license service and retry |
| No seats left | Release an old machine or contact the issuer |
| Little or stale evidence | Run `skelpr doctor --verbose`, verify repository identity and index freshness |
| Memory backend reported | Configure persistent metadata and vector services, then index |
| Embedding failure | Check endpoint, model and credential references |
| Verification inconclusive | Inspect reported exclusions, bounds and ripgrep availability |

## Benchmark scope

The historical Sock Shop report claimed 59% fewer agent tokens across seven tasks.
Some retained artifacts do not reproduce its aggregate or architecture row, so the
report is historical evidence with known reconciliation gaps.

The separate 2026-11-09 Django case study retained ten Codex comparisons with
37.27% fewer total tokens, native search/read calls falling from 28 to 9, and
combined rubric scores rising from 89/96 to 91/96. Summed wall time fell 2.46%.
These were successive builds informed by the questions, with seeded defects in
two isolated edit tasks and uncontrolled provider caching. They are not a frozen
release evaluation or a guarantee for other repositories.

## Uninstall

1. Run `skelpr uninstall-mcp` while the installation is still available.
2. Run `skelpr deactivate` to request release of this machine's seat.
3. Run `python -m pip uninstall skelpr` in the environment that owns it.
4. Remove local state only after checking whether other Skelpr installations use it.

Database volumes and repository indexes are separate from the Python package.
