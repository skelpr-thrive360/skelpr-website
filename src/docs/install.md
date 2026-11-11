# Install & activate Skelpr

Skelpr returns repository evidence with `file:line` citations and a context limit.
Use it through your coding agent's MCP connection or the standalone CLI.
Installation is public; running requires activation, with one seat per machine.

This guide covers the published Skelpr 0.3.6 release. Check your installed version
with `skelpr --version`. Earlier releases may require the `mcp`, `ast`, `postgres`
and `vector` extras.

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

Choose the embedding model before indexing. To switch models in 0.3.6, give the
new configuration a distinct `project` name in `.skelpr.yaml` and run
`skelpr index --full`. This builds a separate vector collection. Skelpr refuses
to replace a collection with incompatible dimensions.

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

Activation and check-in send the token, a machine-ID hash, the operating system
and architecture, and the Skelpr version to the license service. These requests
contain no repository source.

A managed lease sets its own check-in interval. Skelpr checks in automatically
when licensed work runs and a check-in is due. If the service is unreachable,
work can continue until the lease expires. Restore the connection and retry a
licensed command or MCP tool to renew the existing seat. Offline-tier leases
renew near expiry when online renewal is allowed.

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

Start Docker, open a terminal in the repository you want to index, and choose a mode.

| Mode | Who generates the answer? | Setup |
|---|---|---|
| MCP search | Your coding agent | `skelpr setup --no-configure --no-sandbox` |
| Standalone CLI | Your configured model provider | `skelpr setup --configure` in an interactive terminal |

### Set up MCP

Use this path when your coding agent supplies the generation model. Set up
PostgreSQL and Qdrant, then create the repository configuration.

```bash
cd <your-repo>
skelpr setup --no-configure --no-sandbox
skelpr init
```

This skips the Docker validation image. Run `skelpr setup --no-configure` if you
also want Docker-backed validation.

### Check the generated config

`skelpr init` writes `.skelpr.yaml` in the repository root. It runs without
prompts or model requests. It uses verified settings saved by the setup wizard
when available. Otherwise it detects your stack and writes defaults, including
validation commands where it recognizes the stack.

For MCP, check the `embeddings` section. If you use a local OpenAI-compatible
server such as LM Studio, start it and match the endpoint and loaded model ID.
The defaults are:

```yaml
embeddings:
  provider: compatible
  endpoint: http://127.0.0.1:1234/v1
  model: text-embedding-nomic-embed-text-v1.5@q8_0
```

For hosted embeddings, set the provider and model and reference the key from
the process environment. For example, in a **new** checkout, set
`SKELPR_EMBEDDING_KEY` securely and use this in place of plain `init`:

```bash
skelpr init --embedding-provider openai --embedding-model text-embedding-3-small --embedding-api-key-env SKELPR_EMBEDDING_KEY
```

The YAML stores `api_key_ref: env:SKELPR_EMBEDDING_KEY`. The MCP client must pass
that variable to its server process. If you used the setup wizard, it stores
provider keys separately and writes references to them.

If `.skelpr.yaml` already exists, `init` refuses to overwrite it. Edit the
existing file, or run the wizard again and use plain `skelpr init --force`
to apply its saved model settings while preserving the other sections.
Review `commands` before running validation. Those commands run code from the checkout.

### Index and connect

After configuring embeddings, build the first index and register your client.

```bash
skelpr index
skelpr install-mcp
```

Wait for `Index complete` and check for `metadata=postgres` and `vectors=qdrant`
in the summary. By default the installer verifies MCP startup and reports index
readiness. Restart or reconnect the client, then run `skelpr_health` and check the
repository path. Ask for a known symbol and verify the returned file and line range.

| Client setup | Command |
|---|---|
| Choose a detected client | `skelpr install-mcp` |
| Configure Codex | `skelpr install-mcp --agent codex` |
| Configure Claude Code | `skelpr install-mcp --agent claude-code` |
| Configure Cursor | `skelpr install-mcp --agent cursor` |
| Configure all detected clients | `skelpr install-mcp --yes` |
| Get a manual JSON entry | `skelpr install-mcp --print` |
| Write to a specific MCP JSON file | `skelpr install-mcp --mcp-config <file>` |

In 0.3.6, Cursor and Claude Code use project settings by default. Codex uses a
user-wide registration pinned to the checkout where you installed it. Tool
calls to a user-wide registration require the matching absolute repository
path. Refresh older user-wide entries from the intended checkout with
`skelpr install-mcp --agent <id> --global --force`, then reconnect.
If the Codex CLI is unavailable, run `skelpr install-mcp --agent codex` and use
the TOML entry it prints. The installer also writes project guidance by default.
Pass `--no-instructions` to skip that step.

### Set up the standalone CLI

Run `skelpr setup --configure` in an interactive terminal. After the Docker
checks, the wizard asks for two model configurations. Use the arrow keys and
Enter, or follow the numbered prompts if shown.

1. **Generation model.** Choose a provider. For **Other**, enter the endpoint.
   Then enter the model ID and API key.
2. **Embedding model.** Repeat those steps for the embedding provider. API keys
   are hidden as you type. With **Other**, leave the key blank if the endpoint
   needs no authentication.
3. **Verify both.** Skelpr sends small synthetic requests. Hosted providers may
   charge for them. If a check fails, retry, edit the settings, or cancel.

When the wizard says both connections verified, write the saved settings into the
repository config, index, and try a question.

```bash
skelpr init
skelpr index
skelpr ask "How does authentication token refresh work?"
```

You can also run `skelpr chat` or check the setup with `skelpr doctor --verbose`.
Starting with `skelpr index` in an interactive terminal can open the same wizard
if both the repository config and saved setup settings are missing.

### MCP tool use

Pass the complete question as `{"query": "your question"}` to `skelpr_search`.
Use `query` for client compatibility. The server accepts `question` when `query`
is absent.
For a guarded user-wide registration in 0.3.6, include
`"repository": "/absolute/path/to/your-repo"` in the tool arguments.
Leave budgets unset for automatic selection, or provide a limit. A context limit
controls response size; it does not guarantee complete evidence.

Cite returned file ranges or original `N|` source-line labels. Ask for missing
evidence with `skelpr_get_context`, using `missing_evidence` and `exclude_span_ids`
to avoid repeating evidence. Live `verification` requests check explicit paths or
literal terms and report scan limits. A bounded search cannot prove absence.

`skelpr_validate` runs configured checks in Docker by default. Host fallback is
explicitly enabled. Unknown check names or no configured checks produce a
configuration error. Inspect skipped checks as well as the overall result.

In 0.3.6, include the current source for the target symbol in `find_context`
when calling `skelpr_apply_ast_patch`. The tool returns a diff for review and
leaves the checkout unchanged.

### Keeping the index fresh

Background indexing is on by default in MCP and `skelpr serve`. MCP starts a
catch-up pass after the first licensed tool call. `skelpr serve` watches its
allowed startup repository.
The watcher detects new, edited, and deleted files and branch switches in Git
checkouts. It needs the configured embedding endpoint, PostgreSQL, and Qdrant.
It retries pending updates when a backend returns.

Use `skelpr watch` to watch from a terminal, or `skelpr index` to refresh
immediately or index a folder outside Git. The default poll interval is one
second, followed by a 1.5-second quiet period and the time needed to index.

An older config with `indexing.watch.enabled: false` keeps watching off. Remove
that setting or change it to `true`, then restart the client. To opt out in 0.3.6,
set:

```yaml
indexing:
  watch:
    enabled: false
```

`SKELPR_AUTO_REINDEX=0` also turns it off for the server process and takes
precedence over YAML. Earlier versions may require you to enable it explicitly.

## Common commands

| Task | Command |
|---|---|
| Export cited source | `skelpr context "where is this defined?" --token-budget 1000` |
| Review the last commit | `skelpr review --diff HEAD~1..HEAD` |
| Generate a patch for review | `skelpr fix --issue "describe the bug"` |
| Run a configured test check | `skelpr validate --only test` |
| Start the optional HTTP API | `skelpr serve --host 127.0.0.1` |
| Check for an update | `skelpr upgrade --check` |

Use `skelpr <command> --help` for flags and examples.

## Check the license

```bash
skelpr license
```

`skelpr license` reads the local state. A refusal or `check-in due` exits with `3`.
For `check-in due`, retry a licensed command or MCP tool with the service
reachable. Failed `skelpr activate` exits with `1`.

## What refuses without activation

| Surface | Behavior |
|---|---|
| CLI work commands | Refuse with exit `3` |
| MCP startup | Missing or invalid activation can refuse with exit `3` |
| MCP with a lease due for check-in | Handshake proceeds, first gated call checks in |
| MCP tools | Refusal content explains the license issue |
| HTTP API | Gated routes refuse, `/health` stays available |

Help, version, activation, deactivation, license inspection and `skelpr doctor`
remain accessible.

## Moving to another machine

Run `skelpr deactivate` on the old machine, then install and activate on the new
one. A lease copied between machines does not authorize the destination.

## Troubleshooting

| Symptom | Action |
|---|---|
| Command missing | Activate the intended environment and check PATH |
| `init` says the config exists | Edit `.skelpr.yaml`, or apply saved wizard settings as described above |
| MCP missing after upgrade | Restart the agent and verify its configured executable |
| MCP reports repository mismatch | Open the pinned checkout or reinstall from the intended repo |
| Agent never calls a tool | Check tool discovery, approval settings and project instructions |
| License refusal | Run `skelpr license` and follow its specific reason |
| Due check-in fails | Restore access to the license service and retry |
| No seats left | Release an old machine or contact the issuer |
| Little or stale evidence | Run `skelpr doctor --verbose`, verify repository identity and index freshness |
| Memory backend reported | Configure persistent metadata and vector services, then index |
| Embedding failure | Check endpoint, model and credential references |
| Verification inconclusive | Inspect reported exclusions, bounds and ripgrep availability |
| Custom-agent list or removal reports `Missing argument 'NAME'` in 0.3.6 | Use `skelpr register-agent unused unused --list` or `skelpr register-agent unused unused --remove <agent-key>` |

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
