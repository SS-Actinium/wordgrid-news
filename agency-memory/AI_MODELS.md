# AI Models Knowledge Base

**Research Department dossier**  
**As of:** 2026-08-01  
**Purpose:** Route workloads to the right model family; never pretend one model wins all tasks.  
**Caveat:** Rankings move monthly. For high-stakes architecture decisions, re-run live research.

---

## 1. How to use this file

When recommending or integrating models:

1. Classify the **workload** (code agent, chat product, multimodal, local, cost-sensitive, realtime)  
2. Pick **primary + fallback** from the routing table  
3. Note **hosting** (API vs self-host) and **data sensitivity**  
4. Plan **evals** (golden tasks) before production lock-in  
5. Document model IDs, rate limits, and cost assumptions  

---

## 2. Frontier LLM families (2026 landscape)

### OpenAI
| Model line | Role |
|------------|------|
| GPT-5 / 5.2 / 5.4 / 5.5 / Pro | Flagship general + reasoning product line |
| o3 / o4-mini | Reasoning-focused variants |
| Codex variants (5.x Codex) | Coding-specialized paths |
| GPT-4o (legacy still referenced) | Multimodal baseline in older stacks |

**Best for:** Broad knowledge work, productization, math/science strong tiers, ecosystem (Assistants/tools history).  
**Watch:** Pricing tiers; reasoning effort knobs change latency/cost.

### Anthropic (Claude)
| Model line | Role |
|------------|------|
| Claude Fable 5 | Frontier reasoning/coding tier (2026) |
| Claude Opus 4.6–4.8 | Top coding / agent / architecture workhorses |
| Claude Sonnet 4.6 / 5 | Best cost-performance daily coding |
| Claude 3.5/3.7 (legacy) | Older stacks |

**Best for:** Software engineering agents, long multi-step coding, terminal/SWE benches, careful writing.  
**Watch:** METR-style long-horizon agent tasks often favor Claude tiers.

### Google (Gemini)
| Model line | Role |
|------------|------|
| Gemini 3.1 Pro / 3 Pro | Frontier multimodal + reasoning |
| Gemini 3.5 Flash / 3 Flash | Fast / cheap high volume |
| Gemini 2.5 Pro | Prior strong long-context workhorse |
| Gemini 1.5/2.0 (legacy) | Older integrations |

**Best for:** Multimodal, long context (~1M class), geo/visual tasks, Workspace/Vertex ecosystems.  
**Watch:** Adaptive thinking levels; regional availability.

### xAI (Grok)
| Model line | Role |
|------------|------|
| **Grok 4.5** | Current Grok Build / SpaceXAI runtime for this agency |
| Grok 4 / 4.1 Fast | Prior/fast variants |
| Grok Imagine | Image gen/edit; video tools in this environment |

**Best for:** Real-time web/X grounding, agentic tool use in this CLI, opinionated engineering sessions.  
**Watch:** Use full tool stack (shell, subagents, workflows, MCP) — that is the product differentiator.

### Open / efficient / regional
| Family | Notes |
|--------|--------|
| **Meta Llama 4** (e.g. Maverick) | Open weights; self-host; customize |
| **DeepSeek** V4 / R1 / Speciale | Strong price-performance; coding/reasoning value |
| **Qwen 3.x / 3.7 Max** | Competitive coding arenas; multilingual |
| **Kimi K2.x** | Long-context / coding specialists |
| **GLM-5 / 5.1** | Competitive general/coding tiers |
| **MiniMax-M3** | Additional frontier contender |

---

## 3. Benchmark signals (illustrative, Jul 2026 independent benches)

Use as **relative strength signals**, not absolute truth:

| Workload signal | Often strong (snapshot) |
|-----------------|-------------------------|
| SWE-bench Verified / coding agents | Claude Opus 4.7-class, GPT-5.5-class close |
| Terminal-Bench | Claude Opus 4.7-class leading snapshot |
| Text Arena (web/coding preference) | Claude Opus 4.x family strong |
| Humanity's Last Exam | Gemini 3.1 Pro / GPT-5.4 Pro class |
| GPQA Diamond (PhD science) | GPT-5.x Pro / Gemini 3.1 Pro |
| SimpleBench (common-sense traps) | Claude Fable 5 / Gemini 3.1 |
| Long-horizon agents (METR minutes) | Claude Mythos/Opus tiers high on snapshot |
| Long fiction/context recall | o3 / GPT-5 / Grok 4 historically strong |
| Visual/geo | Gemini 3.x frequently leads |

**Rule:** Never claim "best model in the world" without workload + date + source.

---

## 4. Routing table (agency default)

| Workload | Primary recommendation | Strong alternatives |
|----------|------------------------|---------------------|
| Multi-file coding agent / refactors | Claude Opus / Fable tier | GPT-5.x, DeepSeek V4 |
| Architecture + long reasoning | Claude Fable/Opus or GPT-5.x Pro | Gemini 3.1 Pro |
| Realtime research + social pulse | **Grok 4.x / 4.5** | Perplexity-class products |
| Multimodal vision / video understanding | Gemini 3.x | GPT-5.x multimodal |
| 1M-token corpus analysis | Gemini 2.5/3.x long context | Claude long-context tiers |
| Local / air-gapped | Llama 4, Gemma via Ollama/MLX (DJcode pattern) | Qwen local |
| Cost-sensitive high volume | Flash/Sonnet/DeepSeek mid tiers | Open weights on own GPUs |
| Math contest / research math | GPT-5.x Pro, Claude Fable max | Specialist co-mathematician tools |
| Consumer chatbot product | Route by brand + latency + safety policy | Multi-model gateway |
| Image generation (here) | **Grok Imagine** | Midjourney / Flux externally |
| Video generation (here) | Grok video tools | Veo / Runway / Kling externally |

---

## 5. Multi-model architecture patterns

### A. Single-model product
Simplest ops. Lock model ID + version pin. Evaluate monthly.

### B. Router / cascade
```
cheap classifier → mid model → expensive frontier only if needed
```
Saves cost; needs confidence thresholds and evals.

### C. Specialist ensemble
- Coder model for PRs  
- Writer model for docs/marketing  
- Vision model for media  
- Realtime model for news/social  

### D. Local + cloud hybrid
Sensitive data local (Llama/Gemma); general tasks cloud. Aligns with DJcode-style local-first ethos.

### E. Agentic workforce (lineage-aligned)
Multiple agents with roles, shared memory, tools, evals, deploy — the Darshankumar / Know AI style standard this agency prefers for serious systems.

---

## 6. Integration checklist (Security + DevOps)

- [ ] API keys in secret manager / env — never commit  
- [ ] Per-tenant rate limits and spend caps  
- [ ] Prompt injection defenses on tool-using agents  
- [ ] PII redaction where required  
- [ ] Model version pinning + rollback plan  
- [ ] Structured outputs + schema validation  
- [ ] Observability: latency, cost, error, quality samples  
- [ ] Offline/fallback model for outages  

---

## 7. This runtime (Grok Build)

| Property | Value |
|----------|--------|
| Model | Grok 4.5 |
| Role | Primary agency brain for Smit Joshi |
| Tools | Files, shell, web, X, subagents, workflows, Imagine, MCP |
| Memory | `~/.grok/memory` + project `AGENTS.md` + `agency-memory/` |
| Standard | Enterprise AI Agency OS |

When Smit asks "which model?", answer with **workload-specific routing**, not fanboy rankings.

---

## 8. Creative / non-LLM models (awareness)

| Category | Examples |
|----------|----------|
| Image | Grok Imagine, Midjourney, Flux, SDXL/SD3 family, Ideogram |
| Video | Grok video tools, Veo, Runway, Kling, Luma |
| Audio/music | Suno, Udio, Whisper-class STT, ElevenLabs-class TTS |
| Embeddings | Provider embedding APIs; open sentence-transformers (e.g. mpnet-class) for local RAG |

Always: **brief before generate** (composition, style, lighting, type, palette, aspect, audience).

---

## 9. Refresh cadence

| Trigger | Action |
|---------|--------|
| New major model release | Update this file + global MEMORY snippet |
| Client model selection | Live search + benchmark check |
| Quarterly | Research Department full pass |

**Last full research pass:** 2026-08-01
