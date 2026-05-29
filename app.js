/**
 * TRNTBEE Software Technology Company
 * Core Interactive Application Engine (Custom Minimalist Edition)
 */

// ==========================================================================
// Direction-Aware Hover (DAH) Engine for Premium 3D Project Cubes
// ==========================================================================
class DAH {
    constructor(nodes) {
        this.nodes = [];
        Array.from(nodes).forEach(node => {
            this.nodes.push(new Node(node));
        });
        this._bindEvents();
    }

    _bindEvents() {
        this._resizeHandler = this._resizeHandler.bind(this);
        window.addEventListener('resize', this._resizeHandler, { passive: true });
    }

    _resizeHandler() {
        this.nodes.forEach(node => node.update());
    }
}

class Node {
    constructor(node) {
        this.element = node;
        this._bindEvents();
        this.update();
    }

    update() {
        const rect = this.element.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.l = rect.left + window.scrollX;
        this.t = rect.top + window.scrollY;
        this.element.style.setProperty('--card-depth', `${this.h}px`);
    }

    _bindEvents() {
        this._mouseEnterHandler = this._mouseEnterHandler.bind(this);
        this._mouseOutHandler = this._mouseOutHandler.bind(this);
        this.element.addEventListener('mouseenter', this._mouseEnterHandler, { passive: true });
        this.element.addEventListener('mouseleave', this._mouseOutHandler, { passive: true });
        return this;
  }
  
    _mouseEnterHandler(ev) {
        this.update(); // Re-measure on enter to guarantee perfect bounding coordinates
        this._addClass(ev, 'in');
    }

    _mouseOutHandler(ev) {
        this._addClass(ev, 'out');
    }

    _addClass(ev, state) {
        const direction = this._getDirection(ev);
        let class_suffix = '';

        switch (direction) {
            case 0: class_suffix = '-top'; break;
            case 1: class_suffix = '-right'; break;
            case 2: class_suffix = '-bottom'; break;
            case 3: class_suffix = '-left'; break;
        }

        // Clean previous direction-aware classes
        this.element.classList.forEach(cls => {
            if (cls.startsWith('in-') || cls.startsWith('out-')) {
                this.element.classList.remove(cls);
            }
        });
        this.element.classList.add(state + class_suffix);
    }

    _getDirection(ev) {
        const w = this.w,
              h = this.h,
              x = (ev.pageX - this.l - (w / 2) * (w > h ? (h / w) : 1)),
              y = (ev.pageY - this.t - (h / 2) * (h > w ? (w / h) : 1)),
              d = Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4;

        return d;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. Background Video Controller (Native Seamless Loop & Zero-Lag)
    // ==========================================================================
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Fallback triggers: guarantee visibility regardless of readyState race timings
        const showVideo = () => {
            heroVideo.style.opacity = '0.95'; // Brightened value matching CSS overrides
        };

        heroVideo.play()
            .then(showVideo)
            .catch(err => {
                console.log('Autoplay pending user action:', err);
                showVideo(); // Fallback so the video element starts rendering immediately
            });

        // Event triggers as secondary backup
        if (heroVideo.readyState >= 2) {
            showVideo();
        } else {
            heroVideo.addEventListener('loadeddata', showVideo, { once: true });
        }
    }

    // Keep mobile sections aligned to the visible browser height instead of the
    // unstable 100vh value used by handset browser chrome.
    const setAppHeight = () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.visualViewport?.addEventListener('resize', setAppHeight);

    // ==========================================================================
    // 2. Scroll Progress Bar
    // ==========================================================================
    const progressBar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? (window.scrollY / h) * 100 : 0;
        if (progressBar) progressBar.style.width = p + '%';
    }, { passive: true });

    // ==========================================================================
    // 3. Glassmorphic Navbar Scrolling State
    // ==========================================================================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }
    }, { passive: true });

    // ==========================================================================
    // 4. Responsive Mobile Drawer Navigation
    // ==========================================================================
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    let videoModal = null;

    const updateBodyLock = () => {
        const shouldLock = mobileMenu?.classList.contains('open') || videoModal?.classList.contains('active');
        document.body.classList.toggle('menu-open', Boolean(shouldLock));
    };

    const toggleMenu = (forceState) => {
        if (!hamburger || !mobileMenu) return;
        const isOpen = mobileMenu.classList.contains('open');
        const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
        hamburger.classList.toggle('open', nextState);
        hamburger.setAttribute('aria-expanded', String(nextState));
        mobileMenu.classList.toggle('open', nextState);
        updateBodyLock();
    };

    if (hamburger && mobileMenu) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Toggle navigation');
        hamburger.addEventListener('click', () => toggleMenu());
        document.querySelectorAll('.mob-link').forEach(l => {
            l.addEventListener('click', () => toggleMenu(false));
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) toggleMenu(false);
        });
    }

    // ==========================================================================
    // 5. Hero Text Reveal Animations
    // ==========================================================================
    setTimeout(() => {
        document.getElementById('h1-l1')?.classList.add('in');
    }, 300);
    setTimeout(() => {
        document.getElementById('h1-l2')?.classList.add('in');
    }, 500);

    // ==========================================================================
    // 6. Scroll Reveal & Metric Counter Animations
    // ==========================================================================
    function animCount(el, target, suffix, delay) {
        setTimeout(() => {
            const dur = 1800, start = performance.now();
            function frame(now) {
                const p = Math.min((now - start) / dur, 1);
                const ease = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.floor(ease * target) + suffix;
                if (p < 1) requestAnimationFrame(frame);
                else el.textContent = target + suffix;
            }
            requestAnimationFrame(frame);
        }, delay);
    }

    // Scroll Reveal Observers
    const revealEls = document.querySelectorAll('.reveal');
    const staggerEls = document.querySelectorAll('.stagger');
    const metricEls = [
        { el: document.getElementById('m1'), target: 150, suffix: '+' },
        { el: document.getElementById('m2'), target: 10,  suffix: '+' },
        { el: document.getElementById('m3'), target: 99,  suffix: '%' },
    ];
    let metricsDone = false;

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObs.observe(el));

    const staggerObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const children = e.target.querySelectorAll(':scope > *');
                children.forEach((ch, i) => setTimeout(() => ch.classList.add('in'), i * 90));
                staggerObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    staggerEls.forEach(el => staggerObs.observe(el));

    const metricsObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting && !metricsDone) {
                metricsDone = true;
                metricEls.forEach((m, i) => { if (m.el) animCount(m.el, m.target, m.suffix, i * 150); });
                metricsObs.disconnect();
            }
        });
    }, { threshold: 0.3 });
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) metricsObs.observe(metricsGrid);

    // Give each major section a "currently in focus" state so the page reads
    // like a guided story instead of a stack of unrelated panels.
    const storySections = Array.from(document.querySelectorAll('.section[data-step]'));
    let sectionFocusTicking = false;

    const updateSectionFocus = () => {
        sectionFocusTicking = false;
        if (!storySections.length) return;

        const viewportAnchor = window.innerHeight * 0.46;
        let activeSection = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        storySections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visible = rect.bottom > window.innerHeight * 0.18 && rect.top < window.innerHeight * 0.82;
            if (!visible) return;

            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(sectionCenter - viewportAnchor);
            if (distance < bestDistance) {
                bestDistance = distance;
                activeSection = section;
            }
        });

        storySections.forEach(section => {
            section.classList.toggle('section-focus', section === activeSection);
        });
    };

    const requestSectionFocusUpdate = () => {
        if (sectionFocusTicking) return;
        sectionFocusTicking = true;
        requestAnimationFrame(updateSectionFocus);
    };

    updateSectionFocus();
    window.addEventListener('scroll', requestSectionFocusUpdate, { passive: true });
    window.addEventListener('resize', requestSectionFocusUpdate, { passive: true });

    // ==========================================================================
    // 7. Modular Swapper Tab Filtering Engine (Commercial & Research grids)
    // ==========================================================================
    function setupTabFiltering(tabContainerId, gridContainerId) {
        const tabs = document.querySelectorAll(`${tabContainerId} .tab-btn`);
        const cards = document.querySelectorAll(`${gridContainerId} .project-card`);
        if (!tabs.length || !cards.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                cards.forEach(card => {
                    const cat = card.dataset.cat;
                    const show = filter === 'all' || cat === filter;
                    card.style.display = show ? '' : 'none';
                    if (show) {
                        card.style.opacity = '0'; 
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => { 
                            card.style.transition = 'opacity 0.4s var(--ease-out), transform 0.4s var(--ease-out)'; 
                            card.style.opacity = '1'; 
                            card.style.transform = 'none'; 
                        }, 20);
                    }
                });
            });
        });
    }

    window.setupTabFiltering = setupTabFiltering;

    setupTabFiltering('#tabs', '#projects-grid');
    setupTabFiltering('#research-tabs', '#research-grid');

    // ==========================================================================
    // 8. Custom Projects Lightbox Details Portal
    // ==========================================================================
    videoModal = document.getElementById('videoModal');
    const closeVideoBtn = document.getElementById('closeVideoBtn');
    const videoModalBackdrop = document.getElementById('videoModalBackdrop');
    
    // Details Elements
    const videoTitle = document.getElementById('videoTitle');
    const videoDesc = document.getElementById('videoDesc');
    const vizIcon = document.getElementById('vizIcon');

    // Project Details Mapping
    const projectDetails = {
        'beeprepare': {
            title: "BeePrepare • EdTech Exam Generator",
            desc: "An automated PDF exam paper generator designed for teachers and students. Renders beautifully formatted, print-ready question sheets using dynamic client-side templating libraries. Solves the overhead of test preparation instantly.",
            icon: "fa-graduation-cap"
        },
        'trekvana': {
            title: "TrekVana • Premium Travel Bookings",
            desc: "A full-scale tour and holiday reservations platform. Integrates lightning-fast geolocation query filters, dynamic itinerary generators, and secure payment integrations, creating a frictionless B2C reservation funnel.",
            icon: "fa-map"
        },
        '5indshow': {
            title: "5IndShow • Movie & Series Catalog",
            desc: "A movie search and discovery platform powered by TMDB cinematic APIs. Features rapid dynamic search filters, responsive grids, and detailed catalog information dialog cards.",
            icon: "fa-film"
        },
        'letscook': {
            title: "LetsCook • Recipe Explorer Dashboard",
            desc: "An interactive recipe explorer app equipped with automatic ingredient portion scaling and weight unit calculators. Built to demonstrate advanced asynchronous API data handling and state management.",
            icon: "fa-utensils"
        },
        'unigames': {
            title: "UniGames • Social Gaming Hub",
            desc: "A social gaming web portal containing 50+ lightweight mini-games built directly in HTML5 Canvas. Engineered for fast, low-overhead runs and real-time score keeping via WebSocket connectivity.",
            icon: "fa-gamepad"
        },
        'onepunch': {
            title: "OnePunch Fall • Unity Mobile Runner",
            desc: "A high-octane 3D mobile running game compiled with Unity. Highly optimized for memory layout allocations, low texture overhead, and fluid physics computations on low-spec portable smartphones.",
            icon: "fa-fist-raised"
        },
        'rephrasebee': {
            title: "RephraseBee • AI Copywriting Tool",
            desc: "An AI-powered document sentence rephrasing utility, utilizing advanced language model APIs. Delivers instantaneous formatting variations, custom text metrics analytics, and clean document layouts.",
            icon: "fa-brain"
        },
        'beefile': {
            title: "BeeFile • Document Toolkit",
            desc: "A client-side utility suite allowing users to merge, split, compress, and convert PDF documents locally. Runs completely offline in the client browser utilizing high-speed compiled WebAssembly.",
            icon: "fa-file-pdf"
        },
        'hivemind': {
            title: "HiveMind • Multi-AI Answer Analysis",
            desc: "A decentralized dashboard that concurrently processes queries across multiple LLM APIs. Compiles and analyzes response consistency using automated scoring and consensus mappings.",
            icon: "fa-network-wired"
        },
        'scp01': {
            title: "Swarm Consensus Protocol (SCP-01)",
            desc: "A proprietary, patent-pending decentralized consensus protocol designed for multi-AI agent swarms. SCP-01 facilitates sub-millisecond network consensus mapping and automated validation of unstructured text queries, achieving 99% answer reliability across distributed LLM nodes.",
            icon: "fa-network-wired"
        },
        'wasm_compiler': {
            title: "Client-Side WASM PDF Compiler",
            desc: "Our patent-pending, serverless WebAssembly compilation architecture. Compiles document parsing and rendering schemas natively in the client browser, securing user data completely offline and achieving a 5x rendering speed-up over standard node.js cloud parsers.",
            icon: "fa-file-pdf"
        },
        'canvas_sync': {
            title: "60fps Canvas Sync Protocol",
            desc: "An IEEE-compliant research publication detailing our custom graphics frame synchronization algorithm. Establishes sub-millisecond state synchronization across client browsers over low-bandwidth WebSocket channels, optimizing Canvas rendering pipelines to guarantee a lock-solid 60fps on mobile browsers.",
            icon: "fa-gauge-high"
        },
        'trekvana_iot': {
            title: "Trek Vana • IoT Trail Design Patent",
            desc: "A smart IoT-integrated trail design framework covering live route sensing, trail bookings, and outdoor itinerary coordination for the TrekVana platform. Currently disclosed and under review.",
            icon: "fa-mountain-sun"
        },
        'thrufter_patent': {
            title: "Thrufter • Vulnerability Checker Patent",
            desc: "A secured automated vulnerability detection and penetration-reporting system designed to map threat surfaces, detect weaknesses, and streamline protected audit workflows. Filing remains in progress.",
            icon: "fa-shield-halved"
        },
        'thrufter_paper': {
            title: "Thrufter • Security Research Paper",
            desc: "An active research paper documenting automated penetration surface mapping, vulnerability detection pipelines, and secured reporting benchmarks tied to the Thrufter system architecture.",
            icon: "fa-bug-slash"
        }
    };

    // Modular helper to open details modal and populate action links dynamically
    function openProjectModal(demoId, triggerButton = null) {
        const data = projectDetails[demoId] || { title: "PROJECT DETAIL", desc: "No specification details found.", icon: "fa-code" };
        const sourceButton = triggerButton || document.querySelector(`.demo-btn[data-demo-id="${demoId}"]`);
        const sourceCard = sourceButton?.closest('.project-card');
        const fallbackLink = sourceCard?.querySelector('.project-links a.project-link:not(.demo-btn)');
        const primaryLabel = sourceButton?.dataset.modalPrimaryLabel || (fallbackLink ? 'Open Live App' : 'Launching Soon');
        const primaryHref = sourceButton?.dataset.modalPrimaryHref || fallbackLink?.getAttribute('href') || '';
        const primaryDisabled = sourceButton?.dataset.modalPrimaryDisabled === 'true' || !primaryHref || primaryHref === '#';
        const secondaryLabel = sourceButton?.dataset.modalSecondaryLabel || 'Get in Touch';
        const secondaryHref = sourceButton?.dataset.modalSecondaryHref || '#contact';
        const primaryTarget = !primaryDisabled && /^https?:\/\//i.test(primaryHref) ? ' target="_blank" rel="noreferrer"' : '';
        
        // Set dynamic attributes
        if (videoTitle) videoTitle.textContent = data.title;
        if (videoDesc) videoDesc.textContent = data.desc;
        if (vizIcon) vizIcon.className = `fa-solid ${data.icon} viz-center-icon`;
        
        // Populate links inside the details modal dynamically!
        const modalLinks = document.getElementById('modalLinks');
        if (modalLinks) {
            modalLinks.innerHTML = `
                ${primaryDisabled
                    ? `<button type="button" class="project-link project-link-disabled" disabled>${primaryLabel} <i class="fa-solid fa-hourglass-half"></i></button>`
                    : `<a href="${primaryHref}"${primaryTarget} class="project-link project-link-primary">${primaryLabel} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
                }
                <a href="${secondaryHref}" class="project-link project-link-secondary modal-contact-link">${secondaryLabel} <i class="fa-solid fa-envelope"></i></a>
            `;
            
            const contactLink = modalLinks.querySelector('.modal-contact-link');
            if (contactLink) {
                contactLink.addEventListener('click', (e) => {
                    const href = contactLink.getAttribute('href');
                    if (href?.startsWith('#')) {
                        e.preventDefault();
                        closeVideoModal();
                        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
        }
        
        videoModal?.classList.add('active');
        updateBodyLock();
    }

    window.openProjectModal = openProjectModal;

    const bindProjectDemoButtons = (scope = document) => {
        scope.querySelectorAll('.demo-btn').forEach(btn => {
            if (btn.dataset.modalBound === 'true') return;
            btn.dataset.modalBound = 'true';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const demoId = btn.getAttribute('data-demo-id');
                openProjectModal(demoId, btn);
            });
        });
    };

    window.bindProjectDemoButtons = bindProjectDemoButtons;
    bindProjectDemoButtons();

    // Close Lightbox Modal
    function closeVideoModal() {
        videoModal?.classList.remove('active');
        updateBodyLock();
    }

    window.closeVideoModal = closeVideoModal;

    if (closeVideoBtn) closeVideoBtn.addEventListener('click', closeVideoModal);
    if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleMenu(false);
            closeVideoModal();
        }
    });

    // ==========================================================================
    // 9. FAQ Accordions Height Toggles
    // ==========================================================================
    document.querySelectorAll('.accordion-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.accordion-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });


    // ==========================================================================
    // 10. Admin access via direct URL: /admin.html  (no login UI on main site)
    // ==========================================================================



    // ==========================================================================
    // 11. Anchor Navigation Smooth Scrolling
    // ==========================================================================
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const href = a.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            toggleMenu(false);
            const target = document.querySelector(href);
            if (target) { 
                target.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
            }
        });
    });

    // ==========================================================================
    // 12. Activate 3D Direction Aware Hover Swarm Nodes
    // ==========================================================================
    window.initializeProjectCards = (selector = '.project-card') => {
        const canUseHoverCards = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (canUseHoverCards) {
            new DAH(document.querySelectorAll(selector));
        }
    };

    window.initializeProjectCards();

});
