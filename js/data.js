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
      id: 'cascade', viz: 'cascade',
      label: 'Cascade · Under IP review',
      title: 'Use the cheapest model that is good enough, and prove it.',
      body: 'Cascade sends each question to the cheapest model or tool that can answer it within a set error limit, checks the answer, and only moves up a level when it has to. When a model changes underneath it, it re-checks itself instead of quietly getting worse.',
      facts: [['Rules', 'before models'], ['Checked', 'every answer'], ['Repairs', 'itself on change']],
      status: 'Research build',
      caption: 'Simulated traffic. Numbers are illustrative, not measurements.'
    },
    {
      id: 'thrufter', viz: 'scan',
      label: 'Thrufter · Patent filing in progress',
      title: 'A security tool that explains the fix, not just the bug.',
      body: 'Most scanners check code against a list of known problems. Thrufter keeps learning from trusted security sources, works out how an attack would actually play out in your app, and suggests a fix written for the stack you use.',
      facts: [['Learns', 'from new advisories'], ['Simulates', 'real attack paths'], ['Fixes', 'for your stack']],
      status: 'Patent filing in progress',
      caption: 'Example finding on a small Express route.'
    },
    {
      id: 'trekvana', viz: 'trip',
      label: 'TrekVana · Patent disclosed, in process',
      title: 'A trip planner that re-plans itself when things change.',
      body: 'TrekVana plans a whole trip from your starting point to your destination: transport, stays, food and sightseeing. When a train runs late or the weather turns, it changes the plan for you. It also suggests greener ways to travel, tracks the trip’s carbon footprint, and keeps working offline.',
      facts: [['End to end', 'trip planning'], ['Live', 're-planning'], ['Offline', 'maps and plans']],
      status: 'Patent disclosed, in process',
      caption: 'Example trip. The disruption and numbers are illustrative.'
    },
    {
      id: 'sih', viz: 'flood',
      label: 'Smart India Hackathon 2026 · Problem 26161',
      title: 'When a dam fails, how long does a village have?',
      body: 'Pick any of 5,749 dams and barriers in India and our model works out which villages flood, how deep the water gets, and how many minutes each one has before it arrives. Under the hood: river tracing, terrain clean-up, breach physics, a 2D flood solver and a machine-learning shortcut that makes it fast enough to use in an emergency.',
      facts: [['5,749', 'dams and barriers'], ['20', 'pipeline stages'], ['2D', 'flood solver + ML']],
      status: 'In active development',
      caption: 'A simplified breach running live in your browser. Tap the map to move the dam up or down the river.'
    }
  ],

  patents: [
    { title: 'Thrufter: secured vulnerability checker', status: 'Patent in progress' },
    { title: 'TrekVana: smart trip planning system', status: 'Disclosed, in process' },
    { title: 'Thrufter: automated vulnerability analysis', status: 'Paper in progress' }
  ],

  /* 02 — TRNT BEE Digital Solutions */
  solutions: [
    {
      id: 'zeta', title: 'ZETA', featured: true, status: 'soon', year: '2026',
      kicker: 'Tri-City AI Hackathon',
      desc: 'Type what you want automated, like "when someone registers, add them to a sheet and email them", and ZETA builds the workflow. Every run gets a receipt anyone can check.',
      url: '', art: 'zeta'
    },
    {
      id: 'inspire', title: 'Inspire', featured: true, status: 'live', year: '2026',
      kicker: 'Website + college ERP',
      desc: 'The public site and staff ERP for Inspire Junior College. Admissions, fees, salaries and reports for four campuses in one place.',
      url: 'https://inspirehnk.org', image: 'images/projects/inspire.webp'
    },
    {
      id: 'voidfall', title: 'VoidFall', featured: true, status: 'dev', year: '2026',
      kicker: '3D endless runner',
      desc: 'Run down a 38° hillside from daylight above the clouds into the dark. Built from scratch on Three.js with five rigged characters. Drag the model to spin it.',
      url: '', model: 'images/projects/voidfall-flame.glb', image: 'images/projects/voidfall.webp'
    },
    { id: 'beeprepare', title: 'BeePrepare', status: 'live', kicker: 'EdTech', desc: 'Exam paper generator for teachers.', url: 'https://beeprepare.in', image: 'images/beeprepare_mockup.webp' },
    { id: '5indshow', title: '5IndShow', status: 'live', kicker: 'Entertainment', desc: 'Find where to watch any movie or series.', url: 'https://5ind-show.vercel.app', image: 'images/5indshow_mockup.webp' },
    { id: 'trekvana', title: 'TrekVana', status: 'dev', kicker: 'Travel', desc: 'Tour bookings and trip planning.', url: '', image: 'images/trekvana_mockup.webp' },
    { id: 'hivemind', title: 'HiveMind', status: 'dev', kicker: 'AI', desc: 'Ask several AI models at once and compare answers.', url: '', image: 'images/hivemind_mockup.webp' },
    { id: 'rephrasebee', title: 'RephraseBee', status: 'dev', kicker: 'AI', desc: 'Rewrite sentences and documents.', url: '', image: 'images/rephrasebee_mockup.webp' },
    { id: 'beefile', title: 'BeeFile', status: 'dev', kicker: 'Productivity', desc: 'PDF tools that work offline.', url: '', image: 'images/beefile_mockup.webp' },
    { id: 'letscook', title: 'LetsCook', status: 'dev', kicker: 'Food', desc: 'Recipes with portion scaling.', url: '', image: 'images/letscook_mockup.webp' },
    { id: 'unigames', title: 'UniPlay', status: 'dev', kicker: 'Games', desc: '50+ small browser games.', url: '', image: 'images/unigames_mockup.webp' },
    { id: 'onepunch', title: 'OnePunch Fall', status: 'dev', kicker: 'Games', desc: 'Mobile runner built in Unity.', url: '', image: 'images/onepunch_mockup.webp' }
  ]
  /* Merchandise lives in store/products.js */
};
