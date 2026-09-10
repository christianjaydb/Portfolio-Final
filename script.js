  // ---------- page preloader ----------
  (function(){
    const loader = document.getElementById('pageLoader');
    if(!loader) return;
    const greetEl = document.getElementById('loaderGreet');
    const greetings = ['Hello','Kumusta','Hola','Bonjour','Ciao','Hallo','こんにちは','안녕하세요'];
    let gi = 0;
    let greetTimer = null;

    if(greetEl){
      greetEl.textContent = greetings[0];
      greetTimer = setInterval(() => {
        gi = (gi + 1) % greetings.length;
        greetEl.classList.add('fade-out');
        setTimeout(() => {
          greetEl.textContent = greetings[gi];
          greetEl.classList.remove('fade-out');
        }, 350);
      }, 900);
    }

    let hidden = false;
    function hideLoader(){
      if(hidden) return;
      hidden = true;
      if(greetTimer) clearInterval(greetTimer);
      loader.classList.add('loader-hidden');
      document.documentElement.classList.remove('loading-lock');
      setTimeout(() => { loader.remove(); }, 950);
      initMainSite();
    }

    window.addEventListener('load', () => {
      // small minimum display time so it doesn't just flash on fast connections
      setTimeout(hideLoader, 900);
    });
    // safety net in case 'load' never fires for some reason
    setTimeout(hideLoader, 6000);
  })();

  // ---------- light / dark mode: set immediately, not gated behind the ----------
  // loader, so the loader itself (which uses the --bg variable) always
  // matches the visitor's theme instead of flashing dark-then-light.
  const root = document.documentElement;
  function setTheme(mode){
    if(mode === 'light'){ root.setAttribute('data-theme','light'); }
    else { root.removeAttribute('data-theme'); }
  }
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  setTheme(prefersLight ? 'light' : 'dark');

  // ============================================================
  // Everything below sets up the actual site — nav, animations,
  // typing effect, lazy image loading, modals, etc. It's wrapped
  // in a function and only called once the loader has finished
  // (see hideLoader() above), so none of it runs, animates, or
  // starts fetching images while the loader is still covering
  // the page.
  // ============================================================
  function initMainSite(){

  // ---------- scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // ---------- "Home" links scroll to the very top, same as back-to-top ----------
  document.querySelectorAll('a[href="#home"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState(null, '', '#home');
    });
  });

  // ---------- year ----------
  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- mobile nav toggle ----------
  const navPill = document.getElementById('navPill');
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.getElementById('navLinks');
  const themeToggleEl = document.getElementById('themeToggle');

  function closeNav(){
    navLinksEl.classList.remove('open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded','false');
    closeProjectsDropdown();
  }
  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    if (!a.classList.contains('nav-drop-trigger')) a.addEventListener('click', closeNav);
  });

  // ---------- fit-based nav collapse ----------
  // Rather than switching to the hamburger at one fixed viewport breakpoint
  // (which leaves odd in-between widths where the links wrap to a second
  // line — the pill growing tall instead of collapsing), measure whether
  // the links actually fit on one row and flip to compact mode the instant
  // they don't, at any width.
  function measureNavRequiredWidth(){
    // Measure in expanded (non-compact) layout terms, regardless of the
    // pill's current mode, so the .nav-compact-scoped rules never leak
    // into the clone's layout.
    const wasCompact = navPill.classList.contains('nav-compact');
    if (wasCompact) navPill.classList.remove('nav-compact');

    const clone = navLinksEl.cloneNode(true);
    clone.classList.remove('open');
    clone.style.cssText = 'position:absolute; visibility:hidden; pointer-events:none; left:-9999px; top:0; right:auto; display:flex; flex-direction:row; flex-wrap:nowrap; align-items:center; width:auto; max-height:none; white-space:nowrap; background:none; border:none; box-shadow:none; padding:0; margin:0; opacity:1; transform:none;';
    navPill.appendChild(clone);
    const width = clone.scrollWidth;
    navPill.removeChild(clone);

    if (wasCompact) navPill.classList.add('nav-compact');
    return width;
  }

  function updateNavFit(){
    const wasCompact = navPill.classList.contains('nav-compact');
    // Measure against the pill's full inner width (padding excluded) as if
    // expanded — the toggle button is hidden in expanded mode so it doesn't
    // need to be reserved for. The theme switch stays visible in both
    // modes, so its width (plus its own margin and the row gap) must be
    // reserved too, or it can get pushed onto its own line instead of the
    // pill collapsing to the hamburger.
    const pillStyle = getComputedStyle(navPill);
    const innerWidth = navPill.clientWidth - parseFloat(pillStyle.paddingLeft) - parseFloat(pillStyle.paddingRight);
    const rowGap = parseFloat(pillStyle.columnGap || pillStyle.gap) || 0;

    let themeWidth = 0;
    if (themeToggleEl) {
      const themeStyle = getComputedStyle(themeToggleEl);
      themeWidth = themeToggleEl.getBoundingClientRect().width + parseFloat(themeStyle.marginLeft) + rowGap;
    }

    const required = measureNavRequiredWidth() + themeWidth;
    const fits = required <= innerWidth + 4;

    navPill.classList.toggle('nav-compact', !fits);
    navToggle.setAttribute('aria-hidden', String(fits));

    if (fits && wasCompact) closeNav();
  }

  let navFitRAF = null;
  function scheduleNavFit(){
    if (navFitRAF) cancelAnimationFrame(navFitRAF);
    navFitRAF = requestAnimationFrame(updateNavFit);
  }

  scheduleNavFit();
  window.addEventListener('resize', scheduleNavFit);
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleNavFit).observe(navPill);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleNavFit).catch(() => {});
  }

  // close the mobile menu when tapping/clicking anywhere outside the nav pill
  document.addEventListener('click', (e) => {
    if(!navLinksEl.classList.contains('open')) return;
    const navPill = navToggle.closest('nav.pill');
    if(navPill && !navPill.contains(e.target)) closeNav();
  });

  // close the mobile menu (and its Projects dropdown) as soon as the page
  // itself is scrolled while the menu is left open — scrolling *inside*
  // the nav-links list (its own overflow-y:auto) doesn't fire this, since
  // that's a separate element's scroll, not the window's.
  window.addEventListener('scroll', () => {
    if(navLinksEl.classList.contains('open')) closeNav();
  }, { passive: true });

  // ---------- nav active state on scroll ----------
  // The Projects trigger's own section (#projects) is tracked here so that
  // Leadership's gold highlight doesn't stay stuck once you scroll past it
  // into the Projects section header — but the trigger itself is excluded
  // from ever receiving the gold "active" pill (it's a dropdown opener, not
  // a real destination, and painting it gold read as visually noisy). Net
  // effect: no top-level pill is gold while you're in the Projects header;
  // gold picks back up once you reach a submenu-tracked subsection
  // (Websites/Designs/Case Studies).
  const navLinks = [...document.querySelectorAll('nav.pill a')];
  const highlightable = navLinks.filter(a => !a.classList.contains('nav-drop-trigger'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  window.addEventListener('scroll', () => {
    let current = sections[0];
    sections.forEach(s => { if (s && window.scrollY >= s.offsetTop - 140) current = s; });
    highlightable.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  });

  // ---------- projects dropdown (click + touch support, not just hover) ----------
  const projectsDropdown = document.getElementById('projectsDropdown');
  const projectsTrigger = projectsDropdown.querySelector('.nav-drop-trigger');

  function closeProjectsDropdown(){
    projectsDropdown.classList.remove('open');
    projectsTrigger.setAttribute('aria-expanded', 'false');
  }

  projectsTrigger.addEventListener('click', (e) => {
    // Decide purely on isCompact (the hamburger/mobile layout), which JS
    // measures directly from actual content width — reliable regardless of
    // device. The previous version also required matchMedia('hover: hover')
    // to be false before allowing click-to-toggle; some touchscreen tablets
    // and hybrid laptops misreport that media feature as true even though
    // they're being used by touch, which made the compact-mode branch
    // unreachable on those devices and left the dropdown stuck closed (it
    // would instead just navigate straight to #projects). isCompact alone
    // is enough: in compact mode we always want click-to-toggle; outside of
    // it, CSS hover already handles opening on desktop.
    const isCompact = navPill.classList.contains('nav-compact');
    if (!isCompact) {
      closeProjectsDropdown();
      return;
    }
    e.preventDefault();
    e.stopPropagation(); // keep this click from also being seen by the
                          // document-level "click outside" listener below
                          // in the same tick, on the same event.
    const isOpen = projectsDropdown.classList.toggle('open');
    projectsTrigger.setAttribute('aria-expanded', String(isOpen));
  });

  projectsDropdown.querySelectorAll('.nav-drop-menu a').forEach(a => {
    a.addEventListener('click', closeProjectsDropdown);
  });

  document.addEventListener('click', (e) => {
    if (!projectsDropdown.contains(e.target)) closeProjectsDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectsDropdown();
  });

  // ---------- typewriter roles ----------
  // Pulled live from the Technical Skills section (#skills .skill-tag),
  // so editing your skills list automatically updates the hero's flashing text.
  const skillWords = [...document.querySelectorAll('#skills .skill-tag')]
    .map(tag => tag.textContent.trim())
    .filter(Boolean);
  const roles = skillWords.length
    ? skillWords
    : ["IT Support Specialist", "Data Analyst", "Cybersecurity Enthusiast", "Full-Stack Developer"];
  const roleEl = document.getElementById('roleText');
  let ri = 0, ci = 0, deleting = false;

  function typeLoop(){
    const word = roles[ri];
    if(!deleting){
      ci++;
      roleEl.textContent = word.slice(0, ci);
      if(ci === word.length){ deleting = true; setTimeout(typeLoop, 1400); return; }
    } else {
      ci--;
      roleEl.textContent = word.slice(0, ci);
      if(ci === 0){ deleting = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(typeLoop, deleting ? 45 : 85);
  }
  typeLoop();

  // ============================================================
  // PHOTOS — the filename for each spot is set directly on its
  // <img src="..."> tag in the HTML above. Just edit that
  // attribute with your file's name (it must sit in the same
  // folder as this HTML file). Loading/fallback is handled by
  // the onload/onerror attributes already on each <img> tag.
  // ============================================================

  // ---------- light / dark mode: toggle button ----------
  const themeBtn = document.getElementById('themeToggle');
  const tsThumb = document.getElementById('tsThumb');

  themeBtn.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  // ---------- designs grid: pooled/staggered image sourcing ----------
  // Instead of letting every thumbnail race to fetch as soon as it's
  // merely close to the viewport (what native loading="lazy" does, and
  // what caused the request/decode burst -> masonry reflow lag while
  // scrolling), this queues tiles as they approach the viewport and only
  // sources a few at a time. Each image still keeps its natural size once
  // loaded — nothing about the masonry/resize behavior changes.
  (function(){
    const lazyImgs = [...document.querySelectorAll('.media-lazy')];
    if(!lazyImgs.length) return;

    const POOL_SIZE = 3;
    let active = 0;
    const queue = [];

    function pump(){
      while(active < POOL_SIZE && queue.length){
        const img = queue.shift();
        active++;
        const done = () => {
          active--;
          img.classList.add('loaded');
          pump();
        };
        img.addEventListener('load', done, { once:true });
        img.addEventListener('error', done, { once:true });
        img.src = img.dataset.src;
      }
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          queue.push(entry.target);
          io.unobserve(entry.target);
        }
      });
      pump();
    }, { rootMargin: '600px 0px', threshold: 0 });

    lazyImgs.forEach(img => io.observe(img));
  })();

  // ---------- CV preview modal ----------
  (function(){
    const openBtn = document.getElementById('cvPreviewOpen');
    const overlay = document.getElementById('cvModalOverlay');
    const closeBtn = document.getElementById('cvModalClose');
    const frame = document.getElementById('cvModalFrame');
    const statusEl = document.getElementById('cvModalStatus');
    const spinnerEl = document.getElementById('cvModalSpinner');
    const statusTextEl = document.getElementById('cvModalStatusText');
    const CV_FILE = 'src/CV_Belen.pdf';
    let lastFocused = null;
    let checked = false;

    function showStatus(html, showSpinner){
      statusTextEl.innerHTML = html;
      spinnerEl.style.display = showSpinner ? 'block' : 'none';
      statusEl.classList.remove('hidden');
    }
    function hideStatus(){ statusEl.classList.add('hidden'); }

    function loadPreview(){
      if(checked) return;
      checked = true;
      showStatus('Loading preview…', true);

      fetch(CV_FILE, { method:'HEAD' })
        .then(res => {
          if(!res.ok) throw new Error('not found');
          frame.src = CV_FILE + '#toolbar=0&navpanes=0';
          frame.addEventListener('load', hideStatus, { once:true });
          // safety fallback in case 'load' doesn't fire reliably for the PDF viewer
          setTimeout(hideStatus, 900);
        })
        .catch(() => {
          showStatus(
            '<strong>Preview unavailable</strong>' +
            '<span>Make sure <code>' + CV_FILE + '</code> is sitting in the same folder as this page.</span>' +
            '<a href="' + CV_FILE + '" target="_blank" rel="noopener">Try opening it directly →</a>',
            false
          );
        });
    }

    function openModal(){
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
      loadPreview();
    }

    function closeModal(){
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if(lastFocused) lastFocused.focus();
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  })();

  // ---------- role modals (work experience & leadership responsibilities) ----------
  const ROLE_DATA = {
    'tesda-admin': {
      title: 'Administrative Intern',
      org: 'TESDA Provincial Training Center — Lipa City, Batangas',
      dates: 'February 2026 – May 2026',
      bullets: [
        'Processed and audited documentation for 300+ participants while managing the inventory of tools and supplies.',
        'Improved administrative processes through cross-functional support and staff-trainee coordination.',
        'Created publication materials (pubmats) for training programs, announcements, and organizational activities.'
      ]
    },
    'ttec-it': {
      title: 'Information Technology Intern',
      org: 'TTEC Philippines — Lipa City, Batangas',
      dates: 'August 2025 – November 2025',
      bullets: [
        'Resolved hardware, software, and network issues through systematic troubleshooting and diagnostic procedures.',
        'Deployed and configured 100+ PC units while ensuring proper setup, functionality, and compliance with IT standards.',
        'Maintained and audited IT asset inventory, ensuring accurate records, proper asset tracking, and accountability.'
      ]
    },
    'mcdo-maintenance': {
      title: 'Maintenance Crew',
      org: "McDonald's Philippines — Lipa City, Batangas",
      dates: 'October 2021 – October 2022',
      bullets: [
        'Performed routine maintenance and sanitation procedures to ensure workplace safety, cleanliness, and compliance.',
        'Diagnosed equipment issues and conducted minor repairs to minimize disruptions and maintain operational efficiency.',
        'Improved internal audit ratings by 15% through consistent compliance, attention to detail, and maintenance.',
        'Standout Performer of the Month.',
        'Quality Expert of the Month.',
        'Best in Maintenance.'
      ]
    },
    'sets-rep': {
      title: 'Fourth Year Representative',
      org: 'Society of Engineering Technology Students (SETS), BatStateU – The NEU, Lipa City',
      dates: 'August 2025 – July 2026',
      bullets: [
        'Represented 120+ fourth-year students in academic, organizational, and welfare concerns, ensuring needs were given.',
        'Coordinated events, meetings, and student activities to strengthen engagement, participation, and involvement.',
        'Facilitated communication between students and administration to promote efficient information flow.'
      ]
    },
    'sets-bm': {
      title: 'Business Manager',
      org: 'Society of Engineering Technology Students (SETS), BatStateU – The NEU, Lipa City',
      dates: 'August 2024 – August 2025',
      bullets: [
        'Oversaw daily business operations and effectively managed resources for organizational activities and programs.',
        'Assisted in planning and successfully implementing key initiatives with fellow officers and student members.',
        'Supported efficient organizational operations and contributed to the successful execution of projects and events.'
      ]
    },
    'acets-pro': {
      title: 'Public Relations Officer I',
      org: 'Association of Computer Engineering Technology Students (ACETS), BatStateU – The NEU, Lipa City',
      dates: 'August 2024 – August 2025',
      bullets: [
        'Managed social media accounts and promotional campaigns to strengthen organizational visibility and engagement.',
        'Designed and distributed publicity materials for events, programs, announcements, and organizational initiatives.',
        'Maintained positive relationships with stakeholders, faculty, and students to support effective communication.'
      ]
    },
    'cet-block': {
      title: 'Block Representative, CPET 2102–2202',
      org: 'College of Engineering Technology (CET), BatStateU – The NEU, Lipa City',
      dates: 'August 2023 – August 2024',
      bullets: [
        'Represented student concerns and feedback to faculty and administration to facilitate communication and resolution.',
        'Managed communications, updates, and announcements to ensure students received accurate and timely information.',
        'Supported and coordinated 21+ student activities, events, and initiatives to promote collaboration and participation.'
      ]
    }
  };

  (function(){
    const overlay = document.getElementById('roleModalOverlay');
    const titleEl = document.getElementById('roleModalTitle');
    const orgEl = document.getElementById('roleModalOrg');
    const datesEl = document.getElementById('roleModalDates');
    const listEl = document.getElementById('roleModalList');
    const closeBtn = document.getElementById('roleModalClose');
    let lastFocused = null;

    function openModal(id){
      const data = ROLE_DATA[id];
      if(!data) return;
      titleEl.textContent = data.title;
      orgEl.textContent = data.org;
      datesEl.textContent = data.dates;
      listEl.innerHTML = '';
      data.bullets.forEach(b => {
        const li = document.createElement('li');
        li.textContent = b;
        listEl.appendChild(li);
      });
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeModal(){
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if(lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.role-clickable').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.role));
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  })();

  // ---------- background music toggle ----------
  (function(){
    const btn = document.getElementById('musicToggle');
    const audio = document.getElementById('bgMusic');
    const label = document.getElementById('musicBtnLabel');
    if(!btn || !audio) return;

    function setPlayingUI(isPlaying){
      btn.classList.toggle('playing', isPlaying);
      btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      btn.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
      label.textContent = isPlaying ? 'Pause Music' : 'Play Music';
    }

    btn.addEventListener('click', () => {
      if(audio.paused){
        audio.play()
          .then(() => setPlayingUI(true))
          .catch(() => {
            label.textContent = 'Add music.mp3';
            setPlayingUI(false);
          });
      } else {
        audio.pause();
        setPlayingUI(false);
      }
    });

    audio.addEventListener('ended', () => setPlayingUI(false)); // won't fire while loop=true, kept as a safety net
    audio.addEventListener('pause', () => setPlayingUI(false));
    audio.addEventListener('play', () => setPlayingUI(true));
  })();

  // ---------- back to top (shows near end of page) ----------
  const backBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 260);
    backBtn.classList.toggle('show', nearBottom);
  });
  backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  } // end initMainSite
