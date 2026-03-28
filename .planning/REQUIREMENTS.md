# Requirements: FreelanceOS

**Defined:** 2026-03-28
**Core Value:** A freelancer can manage their entire client lifecycle -- from proposal to invoice -- without leaving Claude Code.

## v1.1 Requirements

Requirements for Marketing & Monetization Launch. Each maps to roadmap phases.

### Distribution

- [ ] **DIST-01**: Package published to npm with correct structure (dist/, skills/, plugin manifest, .mcp.json)
- [ ] **DIST-02**: README.md includes install instructions, feature showcase, and payment links
- [ ] **DIST-03**: Plugin installable via `claude plugin install freelance-os` with working MCP connection
- [ ] **DIST-04**: Package listed on MCP server registries (mcp.so, glama.ai/mcp, smithery.ai)

### Landing Page

- [ ] **LAND-01**: Landing page at root URL with product description, feature list, and pricing
- [ ] **LAND-02**: Landing page includes both payment links (monthly and lifetime) with clear CTAs
- [ ] **LAND-03**: Landing page is mobile-responsive
- [ ] **LAND-04**: Page includes meta tags for SEO (title, description, Open Graph, Twitter Card)

### Conversion

- [ ] **CONV-01**: Monthly plan supports 7-day free trial via Stripe checkout
- [x] **CONV-02**: Checkout success page displays API key with copy button and setup instructions (PRE-COMPLETED)
- [x] **CONV-03**: Customer portal accessible for subscription management (cancel, update payment) (PRE-COMPLETED)

### Launch Content

- [ ] **LNCH-01**: X/Twitter launch thread draft (demo-focused, tags @AnthropicAI @ClaudeCode)
- [ ] **LNCH-02**: Reddit post drafts for r/ClaudeAI and r/freelance
- [ ] **LNCH-03**: Hacker News Show HN post draft
- [ ] **LNCH-04**: Launch content includes install command, feature highlights, and payment link

### Monitoring

- [x] **MNTR-01**: Health endpoint returns server version and uptime status (PRE-COMPLETED)
- [ ] **MNTR-02**: Webhook events logged with structured output for debugging
- [ ] **MNTR-03**: Expired API key deliveries cleaned up automatically

## v2 Requirements

### Growth

- **GRWTH-01**: Email drip sequence for new subscribers (onboarding, tips, feature highlights)
- **GRWTH-02**: Referral program (existing users get credit for referrals)
- **GRWTH-03**: Usage analytics dashboard for admin (active users, tool call counts, retention)

### Content

- **CONT-01**: Blog with SEO-optimized articles (freelance tips, Claude Code workflows)
- **CONT-02**: Video demo on YouTube (60-second install + first proposal)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom domain (freelanceos.dev) | Railway URL sufficient for launch; custom domain is a DNS task, not code |
| Paid advertising (Google Ads, etc.) | Organic-first strategy; paid ads premature before product-market fit |
| Affiliate program | Too complex for initial launch; revisit after 100+ users |
| A/B testing framework | Premature optimization; ship one version, iterate on feedback |
| Mobile app | Claude Code is desktop-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIST-01 | Phase 8 | Pending |
| DIST-02 | Phase 8 | Pending |
| DIST-03 | Phase 8 | Pending |
| DIST-04 | Phase 11 | Pending |
| LAND-01 | Phase 9 | Pending |
| LAND-02 | Phase 9 | Pending |
| LAND-03 | Phase 9 | Pending |
| LAND-04 | Phase 9 | Pending |
| CONV-01 | Phase 10 | Pending |
| CONV-02 | Phase 10 | Pre-completed |
| CONV-03 | Phase 10 | Pre-completed |
| LNCH-01 | Phase 12 | Pending |
| LNCH-02 | Phase 12 | Pending |
| LNCH-03 | Phase 12 | Pending |
| LNCH-04 | Phase 12 | Pending |
| MNTR-01 | Phase 13 | Pre-completed |
| MNTR-02 | Phase 13 | Pending |
| MNTR-03 | Phase 13 | Pending |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0
- Pre-completed: 3 (CONV-02, CONV-03, MNTR-01)

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
