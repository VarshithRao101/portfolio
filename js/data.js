/* TRNT BEE — all site content in one place.
   Edit this file to add projects or merch; the pages render from it. */

window.TB = {
  socials: {
    github: 'https://github.com/varshithrao101',
    instagram: 'https://www.instagram.com/vars.101',
    instagramBee: 'https://www.instagram.com/beesociety101',
    youtube: 'https://youtube.com/@beesociety-d6y',
    discord: 'https://discord.gg/wmfEVHTS',
    whatsapp: 'https://chat.whatsapp.com/KTangyVdEt9AZdgoTCUPyY',
    email: 'ravindarraodevarneni@gmail.com',
    emailBee: 'beesociety101@gmail.com'
  },

  /* 01 — TRNT BEE Technologies (R&D) */
  research: [
    {
      id: 'sih',
      code: 'SIH 2026',
      title: 'Dam Break Inundation Modelling',
      kicker: 'Smart India Hackathon 2026 · PS 26161',
      desc: 'Pick any of 5,749 Indian dams and barriers, and the model tells you which villages flood, how deep, and how long they have. A twenty-stage pipeline: river tracing, terrain conditioning, breach physics, a 2D flood solver, an ML surrogate, damage and evacuation planning.',
      tags: ['Hydrodynamics', 'SPH + 2D solver', 'ML surrogate', 'Geospatial'],
      status: 'Active research',
      art: 'flood'
    },
    {
      id: 'thrufter',
      code: 'THRUFTER',
      title: 'AI Security Intelligence',
      kicker: 'Cybersecurity · Patent in progress',
      desc: 'Not just a vulnerability scanner. Thrufter learns from trusted security sources, turns that into structured intelligence, simulates realistic attacks against an app in its own architectural context, and recommends fixes that fit the stack.',
      tags: ['AppSec', 'Attack simulation', 'Auto-remediation', 'Self-evolving'],
      status: 'Patent filing',
      art: 'shield'
    },
    {
      id: 'cascade',
      code: 'CASCADE',
      title: 'Risk-Certified LLM Orchestration',
      kicker: 'AI infrastructure · Under IP review',
      desc: 'Every query goes to the cheapest model or tool that can answer it within a certified error limit. Answers are verified and escalated when needed, and quality is never allowed to degrade silently when models or traffic change.',
      tags: ['LLM routing', 'Verification', 'Self-healing', 'Cost control'],
      status: 'Research build',
      art: 'cascade'
    }
  ],

  patents: [
    { title: 'Thrufter — Secured Vulnerability Checker', status: 'Patent in progress' },
    { title: 'TrekVana — IoT Trail Design System', status: 'Disclosed · In process' },
    { title: 'Thrufter — Automated Vulnerability Analysis', status: 'Paper in progress' }
  ],

  /* 02 — TRNT BEE Digital Solutions */
  solutions: [
    {
      id: 'zeta', title: 'ZETA', featured: true, status: 'live-soon',
      kicker: 'AI-thon · Automation',
      desc: 'Describe an automation in plain English and the AI Copilot builds it on a visual canvas. Every run gets a cryptographic receipt anchored on Polygon that anyone can verify.',
      tags: ['Next.js', 'AI Copilot', 'Polygon'], url: '', art: 'zeta'
    },
    {
      id: 'inspire', title: 'Inspire', featured: true, status: 'live',
      kicker: 'PDemo 101 · Website + ERP',
      desc: 'Public website and internal ERP for a four-campus junior college group: admissions, fees, salaries, expenditure and reporting behind role-based staff portals.',
      tags: ['React 19', 'Express', 'MongoDB'], url: 'https://inspirehnk.org', image: 'images/projects/inspire.webp'
    },
    {
      id: 'voidfall', title: 'VoidFall', featured: true, status: 'dev',
      kicker: 'Game · 3D endless runner',
      desc: 'Out of the clouds, down the hill, into the void. A 3D runner on a 38° hillside, built on Three.js with no engine, and five rigged characters. Web, PC, Android and iOS from one codebase.',
      tags: ['Three.js', 'Blender', 'WebAudio'], url: '', model: 'images/projects/voidfall-flame.glb', image: 'images/projects/voidfall.webp'
    },
    { id: 'beeprepare', title: 'BeePrepare', status: 'live', kicker: 'EdTech', desc: 'Exam paper generator: build, compile and format question banks for teachers in minutes.', tags: ['Next.js', 'PDF', 'SaaS'], url: 'https://beeprepare.in', image: 'images/beeprepare_mockup.webp' },
    { id: '5indshow', title: '5IndShow', status: 'live', kicker: 'Entertainment', desc: 'Movie and series discovery with deep-link indexing and a fast catalogue.', tags: ['JS', 'TMDB API'], url: 'https://5ind-show.vercel.app', image: 'images/5indshow_mockup.webp' },
    { id: 'trekvana', title: 'TrekVana', status: 'dev', kicker: 'Travel', desc: 'Tour bookings and holiday itinerary management.', tags: ['Next.js', 'Geo', 'Payments'], url: '', image: 'images/trekvana_mockup.webp' },
    { id: 'hivemind', title: 'HiveMind', status: 'dev', kicker: 'AI', desc: 'Ask several AI models at once and see where their answers agree.', tags: ['Multi-agent', 'AI'], url: '', image: 'images/hivemind_mockup.webp' },
    { id: 'rephrasebee', title: 'RephraseBee', status: 'dev', kicker: 'AI', desc: 'Fast sentence and document rephrasing.', tags: ['NLP'], url: '', image: 'images/rephrasebee_mockup.webp' },
    { id: 'beefile', title: 'BeeFile', status: 'dev', kicker: 'Productivity', desc: 'Merge, split, convert and compress PDFs entirely offline in the browser.', tags: ['WASM', 'PDF'], url: '', image: 'images/beefile_mockup.webp' },
    { id: 'letscook', title: 'LetsCook', status: 'dev', kicker: 'Lifestyle', desc: 'Recipe explorer with portion scaling and ingredient filters.', tags: ['JS', 'MealDB'], url: '', image: 'images/letscook_mockup.webp' },
    { id: 'unigames', title: 'UniPlay', status: 'dev', kicker: 'Gaming', desc: 'A portal of 50+ lightweight canvas mini-games built for mobile.', tags: ['Canvas', 'WebSocket'], url: '', image: 'images/unigames_mockup.webp' },
    { id: 'onepunch', title: 'OnePunch Fall', status: 'dev', kicker: 'Gaming', desc: 'A 3D Unity mobile runner tuned for low-spec phones.', tags: ['Unity', 'C#'], url: '', image: 'images/onepunch_mockup.webp' }
  ],

  /* 03 — TRNT BEE Merchandise.
     To add a product photo: drop it in images/merch/ and set `image`. */
  merch: [
    {
      id: 'drop-01', name: 'Hive Drop 01', type: 'Apparel',
      price: null, // set a number (INR) when pricing is final
      image: '', // e.g. 'images/merch/drop-01.webp'
      desc: 'Description coming soon.',
      sizes: ['S', 'M', 'L', 'XL'], status: 'Coming soon'
    },
    {
      id: 'drop-02', name: 'Hive Drop 02', type: 'Apparel',
      price: null,
      image: '',
      desc: 'Description coming soon.',
      sizes: ['S', 'M', 'L', 'XL'], status: 'Coming soon'
    }
  ]
};
