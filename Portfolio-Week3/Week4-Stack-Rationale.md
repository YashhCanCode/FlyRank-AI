# Week 4 — Pick the Stack: Rationale

## My four constraints

- **Free only.** No paid hosting or tools.
- **Skill level (honest).** I'm a backend engineer — comfortable with Node, Express, git, Docker, and SQL, and fluent in JavaScript. React/Next is newer to me but well within reach. I'm not a designer, which is why I lean on a tight identity kit to do the design work.
- **What the portfolio needs to do.** Greet with a one-line claim, lead with my Task Manager API case study, support long-form case-study reading, link out to GitHub repos, and show an architecture diagram plus real screenshots. Content is mostly static today.
- **How my work must be shown.** Code repos (links), long-form reading, and diagrams/screenshots — not image galleries. I also want the option to embed a live demo of my API later.
- **Dynamic yet?** Not for the content itself. The only maybe-dynamic pieces are a contact form and an embedded live API demo, and neither is needed on day one.

## The three roads

**1. Plain HTML/CSS (simplest).**
Build by hand, host free on Netlify or GitHub Pages, no backend. Trade-off: zero learning and I already have it live, but repeating the header/footer across the home page and every case study is copy-paste that drifts out of sync as I add projects.

**2. Astro (middle).**
Components plus Markdown case studies, ships zero JS by default, host free on Netlify/Vercel, no backend. Trade-off: clean and fast with a small learning curve, but it's built for static content — the day I want a serverless contact form or an interactive demo, I'm bolting extras on or migrating.

**3. Next.js / React (most powerful).**
Component-based pages (MDX for case studies), host free on Vercel, no backend required now but serverless functions available on demand. Trade-off: the most capable and the most to maintain — React and a build pipeline for content that is currently static.

## Pressure-testing the front-runner (Next.js)

- **What do I maintain if I pick the most powerful?** A React/Next dependency tree and a build step. Occasional framework and package updates, and more moving parts than a hand-written page. As a developer who already runs Docker and npm daily, that's maintenance I'm equipped for, not a wall.
- **Can I finish in two weeks?** Yes. I'll keep it mostly static pages with MDX case studies and the identity kit as CSS variables — no over-engineering. The framework doesn't force complexity I don't use.
- **Does it show my work the way it needs to be shown?** Yes, and it's the only option that covers the *future* shape too: long-form case studies in MDX, code links, images/diagrams, and — the deciding factor — a clean path to embed a **live demo of my backend API** or a serverless contact form without migrating later.
- **What breaks if I'd picked the simplest?** Plain HTML has no components, so my header, footer, and case-study layout get duplicated and drift; and there's no runway for the live demo I want.

## Decision

**Chosen: Next.js on Vercel (free tier).**

I picked the most powerful road with my eyes open. As a backend engineer, React's overhead is a cost I can absorb, and the payoff is that the one thing that would make me *migrate* later — showing a live, running demo of my API, or wiring a serverless contact form — is built in from the start. My proof is backend systems, so a stack that can eventually run one is the right frame for the work.

**Can I maintain this?** Yes. Dependency updates and a build pipeline are things I already do; this isn't unfamiliar territory the way visual design is.

**Does it show my work well?** Yes — MDX case studies for long-form reading, image support for my architecture diagram and screenshots, and prominent repo links, with room to embed a live API demo.

**Backend, honestly?** Not yet. The content is static and needs no backend today. Next.js gives me serverless functions *when* I want the contact form or demo — I'm choosing the option, not building it now.

**Why not the other two.** Plain HTML I already have live and it's the fastest to ship, but it has no components (duplicated markup that drifts) and no path to the live demo — fine for "empty but live," not for the finished site. Astro was the close runner-up: components plus Markdown, calm and fast — I passed on it only because it's static-first, and I'd rather not migrate off it the day I add something dynamic. Next.js costs me a bit more maintenance now to save a migration later.
