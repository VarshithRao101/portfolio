/**
 * TRNTBEE SITE DATA STORE
 * All site content lives here. Admin edits are written to localStorage.
 * index.html reads from here on load and applies overrides to the DOM.
 */

const STORE_KEY = 'trntbee_sitedata';

const DEFAULT_DATA = {
  founder: {
    name: 'Varshith',
    title: 'Swarm Founder & Lead Architect',
    bio: 'Architecting revenue-generating software products and coordinating the open collaborative swarms of BEE SOCIETY. Bridging college engineering swarms with scalable commercial deployment pipelines.',
    photo: 'images/adminphoto.jpg',
    socials: [
      { icon: 'fa-brands fa-github',    url: 'https://github.com/varshithrao101',          label: 'GitHub' },
      { icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/vars.101',         label: 'Instagram' },
      { icon: 'fa-solid fa-envelope',   url: 'mailto:ravindarraodevarneni@gmail.com',       label: 'Email' }
    ]
  },
  contact: {
    instagramBee: 'https://www.instagram.com/beesociety101',
    whatsapp:     'https://chat.whatsapp.com/KTangyVdEt9AZdgoTCUPyY',
    emailBee:     'beesociety101@gmail.com'
  },
  footer: {
    socials: [
      { icon: 'fa-brands fa-github',       url: 'https://github.com/varshithrao101',                label: 'GitHub' },
      { icon: 'fa-brands fa-instagram',    url: 'https://www.instagram.com/vars.101',               label: 'Personal Instagram' },
      { icon: 'fa-brands fa-instagram',    url: 'https://www.instagram.com/beesociety101',          label: 'BEE SOCIETY Instagram' },
      { icon: 'fa-brands fa-youtube',      url: 'https://youtube.com/@beesociety-d6y',              label: 'YouTube' },
      { icon: 'fa-brands fa-discord',      url: 'https://discord.gg/wmfEVHTS',                      label: 'Discord' },
      { icon: 'fa-solid fa-envelope',      url: 'mailto:ravindarraodevarneni@gmail.com',            label: 'Email' }
    ]
  },
  projects: [
    {
      id: 'beeprepare', title: 'BeePrepare', cat: 'startup', inDev: false,
      desc: 'High-performance EdTech exam paper generator platform.',
      descLong: 'High-performance EdTech exam paper generator platform. Build, compile, and format question databases for teachers instantly.',
      image: 'images/beeprepare_mockup.png', appUrl: 'https://beeprepare.in',
      tags: ['React / NextJS', 'Node PDF', 'SaaS Core']
    },
    {
      id: 'trekvana', title: 'TrekVana', cat: 'startup', inDev: true,
      desc: 'Premium tour bookings and holiday itinerary management platform.',
      descLong: 'Premium tour bookings and holiday itinerary management platform with high-speed geographic queries and Stripe billing.',
      image: 'images/trekvana_mockup.png', appUrl: '#',
      tags: ['NextJS', 'Geolocation API', 'Stripe']
    },
    {
      id: '5indshow', title: '5IndShow', cat: 'community', inDev: false,
      desc: 'Movie and series discovery platform with deep-link indexing.',
      descLong: 'Movie and series discovery platform with deep-link indexing algorithms and sleek catalog exploration layouts.',
      image: 'images/5indshow_mockup.png', appUrl: 'https://5ind-show.vercel.app',
      tags: ['HTML5 / CSS3', 'TMDB API']
    },
    {
      id: 'letscook', title: 'LetsCook', cat: 'community', inDev: true,
      desc: 'Interactive recipe explorer and portion scale dashboard.',
      descLong: 'Interactive recipe discovery and kitchen measurement converter dashboard with custom ingredient card filters.',
      image: 'images/letscook_mockup.png', appUrl: '#',
      tags: ['ES6 JS', 'MealDB API']
    },
    {
      id: 'unigames', title: 'UniGames', cat: 'community', inDev: true,
      desc: 'Social web portal featuring 50+ modular lightweight mini-games.',
      descLong: 'Social web portal featuring 50+ lightweight modular mini-games built in canvas, designed for swift latency-free runs on mobile.',
      image: 'images/unigames_mockup.png', appUrl: '#',
      tags: ['Canvas JS', 'WebSocket']
    },
    {
      id: 'onepunch', title: 'OnePunch Fall', cat: 'community', inDev: true,
      desc: 'High-octane 3D Unity mobile game, optimized for portability.',
      descLong: 'High-octane 3D Unity mobile runner game, optimized for lightweight texture loads and seamless physics on lower-spec hardware.',
      image: 'images/onepunch_mockup.png', appUrl: '#',
      tags: ['Unity 3D', 'C# Script']
    },
    {
      id: 'rephrasebee', title: 'RephraseBee', cat: 'community', inDev: true,
      desc: 'AI sentence copywriting interface with lightning fast responses.',
      descLong: 'AI sentence and document rephrasing interface backed by lightning-fast API responses and custom formatting metrics.',
      image: 'images/rephrasebee_mockup.png', appUrl: '#',
      tags: ['HuggingFace', 'RegEx Parse']
    },
    {
      id: 'beefile', title: 'BeeFile', cat: 'community', inDev: true,
      desc: 'Client-side offline PDF manipulation suite using WebAssembly.',
      descLong: 'High-speed client-side PDF manipulation toolkit — merge, split, convert, and compress files entirely offline.',
      image: 'images/beefile_mockup.png', appUrl: '#',
      tags: ['PDFLib JS', 'WASM Core']
    },
    {
      id: 'hivemind', title: 'HiveMind', cat: 'community', inDev: true,
      desc: 'Decentralized multi-AI agent consensus answer dashboard.',
      descLong: 'Decentralized multi-AI agent consensus dashboard querying and mapping answer profiles across models concurrently.',
      image: 'images/hivemind_mockup.png', appUrl: '#',
      tags: ['AI Swarms', 'JSON Schema']
    }
  ],
  research: [
    {
      id: 'trekvana_iot', title: 'Trek Vana — IoT Trail Design System', type: 'patent',
      desc: 'Disclosed. A smart IoT-integrated design framework for trail bookings and real-time outdoor itinerary management.',
      descLong: 'A disclosed innovation covering IoT-sensor-driven trail navigation and smart booking integration for the TrekVana platform. Patent application filed and currently in process with the IP office. Full specification under review.',
      icon: 'fa-solid fa-mountain-sun', status: 'Disclosed · In Process', inProgress: true,
      tags: ['IoT Sensors', 'Trail Navigation', 'Disclosed · In Process']
    },
    {
      id: 'thrufter_patent', title: 'Thrufter System — Vulnerability Checker', type: 'patent',
      desc: 'A secured, automated vulnerability detection and penetration-reporting system. Patent filing in progress.',
      descLong: 'Thrufter is a proprietary secured vulnerability checker designed to automate threat detection, penetration surface mapping, and security audit reporting. Patent application currently in progress — architecture and core algorithms under IP protection.',
      icon: 'fa-solid fa-shield-halved', status: 'In Progress', inProgress: true,
      tags: ['Cybersecurity', 'Pen Testing', 'In Progress']
    },
    {
      id: 'canvas_sync', title: '60fps Canvas Sync Protocol', type: 'paper',
      desc: 'Sub-millisecond latency frame rendering and state synchronization protocol for browser game hubs.',
      descLong: 'A research publication detailing our sub-millisecond state synchronization across client browsers over WebSocket channels for real-time game hubs.',
      icon: 'fa-solid fa-gauge-high', status: 'Published', inProgress: false,
      tags: ['WebSocket Syncer', 'Research', 'Graphics Engine']
    },
    {
      id: 'thrufter_paper', title: 'Thrufter — Automated Vulnerability Analysis', type: 'paper',
      desc: 'Research paper on automated penetration surface mapping and secured vulnerability detection pipelines. In progress.',
      descLong: 'An ongoing research paper documenting the architecture, methodology, and detection benchmarks of the Thrufter vulnerability checking system. Covers automated threat modeling, surface analysis, and audit report generation. Currently in progress — expected submission pending patent clearance.',
      icon: 'fa-solid fa-bug-slash', status: 'In Progress', inProgress: true,
      tags: ['Security Research', 'Vulnerability Mapping', 'In Progress']
    }
  ]
};

// ---- Public API ----

window.SiteData = {
  get() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (!stored) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      // Deep merge stored over defaults so new default fields always appear
      return JSON.parse(stored);
    } catch(e) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  },

  save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  },

  reset() {
    localStorage.removeItem(STORE_KEY);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  },

  getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
};
