# Install & activate Skelpr

Skelpr returns repository evidence with `file:line` citations and a context limit.
Use it through your coding agent's MCP connection or the standalone CLI.
Installation is public; running requires activation, with one seat per machine.

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

MCP uses your agent for generation. The agent decides when to call tools and may
require approval. Connecting Skelpr does not guarantee automatic use.

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

Configure the embedding provider before indexing. If it becomes unavailable,
search can return reduced evidence from an existing index.

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

Changing embedding models requires rebuilding the vector index, even when their
dimensions match. Configure the intended provider before indexing.

## Get a token

Open the [access section](/#waitlist) and choose **Request a token** to email Skelpr. The
waitlist is for release updates. Keep your activation token private.

## Install

From 0.3.6, plain installation includes the CLI, MCP integration and database
clients. The optional HTTP API uses the `server` extra.

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

Structured code support covers Python, JavaScript, TypeScript, Go, Rust, Java,
Ruby, C, C++ and C#. Other indexed text remains searchable; source structure
support varies by language and syntax.

### Offline package installation

A vendor-supplied wheel can be installed directly. Offline installation also needs
local copies of its dependencies for your Python version and operating system.

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

Activation registers this machine and stores its lease. Local state defaults to `~/.skelpr`, or
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
| Hosted generation provider | Prompts, selected source, diffs and task context |
| Remote index storage | File paths, symbols, source excerpts and vectors |
| Repository integration | Review findings, comments and source locations |
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

Start Docker and the configured embedding endpoint. Choose a mode:

| Mode | Who generates the answer? | Setup |
|---|---|---|
| MCP | Your coding agent | `skelpr setup --no-configure` |
| Standalone CLI | Your configured model provider | `skelpr setup` in an interactive terminal |

For MCP, run these commands from the repository you want to search:

```bash
cd <your-repo>
skelpr setup --no-configure
skelpr init
```

Check the embedding endpoint and model in `.skelpr.yaml` before indexing. Then run:

```bash
skelpr index
skelpr install-mcp
```

Reconnect the agent and confirm it lists `skelpr_search`.

| Client setup | Command |
|---|---|
| Choose a detected client | `skelpr install-mcp` |
| Configure Codex | `skelpr install-mcp --agent codex` |
| Configure Claude Code | `skelpr install-mcp --agent claude-code` |
| Configure Cursor | `skelpr install-mcp --agent cursor` |
| Configure all detected clients | `skelpr install-mcp --yes` |
| Get a manual JSON entry | `skelpr install-mcp --print` |

Some clients use their own configuration commands. Codex uses user scope.

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
Use `query` for client compatibility; the server also accepts `question`.
Leave budgets unset for automatic selection, or provide a limit. A context limit
controls response size; it does not guarantee complete evidence.

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

Watch indexes once, then checks for added, changed and removed files and branch
changes. Updates take the polling interval, a quiet debounce period and indexing
time. Enable background updates explicitly for MCP and `serve`:

```yaml
indexing:
  watch:
    enabled: true
    poll_seconds: 1.0
    debounce_seconds: 1.5
```

`SKELPR_AUTO_REINDEX=1` also enables background updates for the process. Failed
updates can leave an incomplete index. Check diagnostics and finish a successful
indexing pass after restoring the service.

## Check the license

```bash
skelpr license
```

The output identifies credential sources, license and lease terms, seat and status.
A license refusal exits with `3`; failed activation exits with `1`.
Expiry and renewal follow the license terms.

## What refuses without activation

| Surface | Behavior |
|---|---|
| CLI work commands | Refuse with exit `3` |
| MCP startup | Missing or invalid activation can refuse with exit `3` |
| MCP with a lease due for check-in | Handshake proceeds, first gated call checks in |
| MCP tools | Refusal content explains the license issue |
| HTTP API | Gated routes refuse, `/health` stays available |

Help, version, activation, deactivation and license inspection remain accessible.

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

The [benchmark section](/#benchmark) includes two separate case studies:

- **Sock Shop (September 2026):** the historical report shows 59.3% fewer tokens across seven
  tasks. Some retained artifacts do not reproduce its aggregate or architecture
  row. It remains published with those limitations.
- **Django (November 2026):** ten retained Codex comparisons:

| Django metric | Native tools | With Skelpr MCP |
|---|---:|---:|
| Total tokens (all input, including cached input, plus output) | 437,997 | 274,749 (37.27% fewer) |
| Native search/read calls, excluding tests | 28 | 9 |
| Combined rubric score | 89/96 | 91/96 |
| Summed wall time | 534.40 s | 521.25 s |

Six Django tasks finished faster; four were slower. These comparisons used
successive Skelpr builds informed by the questions, seeded defects in two isolated
edit tasks, and uncontrolled provider caching. They do not measure one frozen
release or guarantee results on other repositories.

[Download the Django metrics](/benchmarks/django-case-study-20261109/metrics.json).

## Uninstall

1. Run `skelpr uninstall-mcp` while the installation is still available.
2. Run `skelpr deactivate` to request release of this machine's seat.
3. Run `python -m pip uninstall skelpr` in the environment that owns it.
4. Remove local state only after checking whether other Skelpr installations use it.

Database volumes and repository indexes are separate from the Python package.
