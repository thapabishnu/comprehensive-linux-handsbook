/* NCS 205 handbook — site behavior
   - sidebar rendered from one data source (MODULES below)
   - theme toggle (persists to localStorage)
   - per-code-block copy buttons
   - scrollspy for the right-rail TOC
   - mobile sidebar menu
*/
(function () {
  'use strict';

  /* ---------- single source of truth for navigation ---------- */
  const SECTIONS = [
    {
      title: 'Foundations',
      modules: [
        { num: '00', file: '00-orientation.html',           title: 'Orientation & setup' },
        { num: '01', file: '01-shell-and-ssh.html',         title: 'Shell access & SSH' },
        { num: '02', file: '02-filesystem-navigation.html', title: 'Filesystem navigation' },
        { num: '03', file: '03-listing-and-files.html',     title: 'Listing & file operations' },
        { num: '04', file: '04-file-globbing.html',         title: 'File globbing' },
        { num: '05', file: '05-viewing-text.html',          title: 'Viewing text' },
        { num: '06', file: '06-vi-editor.html',             title: 'The vi / vim editor' },
        { num: '07', file: '07-permissions.html',           title: 'Permissions' },
        { num: '08', file: '08-redirection-pipes.html',     title: 'Redirection & pipes' },
      ],
    },
    {
      title: 'Text & search',
      modules: [
        { num: '09', file: '09-grep-and-regex.html',        title: 'grep & regular expressions' },
        { num: '10', file: '10-find-and-xargs.html',        title: 'find & xargs' },
        { num: '11', file: '11-processes-and-jobs.html',    title: 'Processes & jobs' },
        { num: '12', file: '12-text-toolbox.html',          title: 'Text-processing toolbox' },
        { num: '13', file: '13-sed-and-awk.html',           title: 'sed & awk' },
      ],
    },
    {
      title: 'Sysadmin',
      modules: [
        { num: '14', file: '14-shell-scripting.html',       title: 'Shell scripting' },
        { num: '15', file: '15-env-and-startup.html',       title: 'Environment & startup' },
        { num: '16', file: '16-users-and-admin.html',       title: 'Users & admin' },
        { num: '17', file: '17-services-systemd.html',      title: 'Services & systemd' },
        { num: '18', file: '18-networking.html',            title: 'Networking' },
        { num: '19', file: '19-ssh-keys-and-2fa.html',      title: 'SSH keys & 2FA' },
        { num: '20', file: '20-git-basics.html',            title: 'git for sysadmins' },
        { num: '21', file: '21-cron-and-scheduling.html',   title: 'cron & scheduling' },
        { num: '22', file: '22-logs-and-troubleshooting.html', title: 'Logs & troubleshooting' },
      ],
    },
    {
      title: 'Reference',
      modules: [
        { num: '·',  file: 'reference/cheatsheet-shortcuts.html', title: 'Keyboard cheatsheet' },
        { num: '·',  file: 'reference/cheatsheet-vi.html',        title: 'vi cheatsheet' },
        { num: '·',  file: 'reference/cheatsheet-regex.html',     title: 'Regex cheatsheet' },
      ],
    },
  ];

  /* ---------- render sidebar ---------- */
  function renderSidebar() {
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const inSubdir = location.pathname.toLowerCase().includes('/reference/');
    const prefix = inSubdir ? '../' : '';
    const indexHref = prefix + 'index.html';

    let html = '';
    SECTIONS.forEach((sec, i) => {
      if (i === 0) {
        html += `<div class="sidebar-title"><a href="${indexHref}" style="border:none;color:inherit;">${sec.title}</a></div>`;
      } else {
        html += `<div class="nav-group">${sec.title}</div>`;
      }
      html += '<ol>';
      sec.modules.forEach(m => {
        const href = prefix + m.file;
        const isCurrent = m.file.toLowerCase() === page ||
                          (inSubdir && m.file.toLowerCase().endsWith(page));
        const curAttr = isCurrent ? ' aria-current="page"' : '';
        html += `<li><a href="${href}"${curAttr}><span class="nav-num">${m.num}</span><span class="nav-ttl">${m.title}</span></a></li>`;
      });
      html += '</ol>';
    });
    sb.innerHTML = html;
  }

  /* ---------- theme ---------- */
  const THEME_KEY = 'ncs205.theme';
  const root = document.documentElement;

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      const lbl = btn.querySelector('.label');
      const ico = btn.querySelector('.icon');
      btn.setAttribute('aria-pressed', t === 'light');
      if (lbl) lbl.textContent = t === 'dark' ? 'PAPER' : 'DARK';
      if (ico) ico.textContent = t === 'dark' ? '☼' : '☾';
    }
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(saved || 'dark');
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const cur = root.getAttribute('data-theme') || 'dark';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }
  }

  /* ---------- copy buttons on <pre> blocks ---------- */
  function initCopyButtons() {
    document.querySelectorAll('pre').forEach(pre => {
      if (pre.dataset.nocopy === 'true') return;
      if (pre.querySelector('.code-head')) return;
      const lang = pre.dataset.lang ||
        (pre.querySelector('code')?.className.match(/lang-([\w-]+)/)?.[1]) ||
        'shell';
      const head = document.createElement('div');
      head.className = 'code-head';
      const langSpan = document.createElement('span');
      langSpan.className = 'lang';
      langSpan.textContent = lang;
      head.appendChild(langSpan);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.textContent = 'COPY';
      head.appendChild(btn);
      pre.insertBefore(head, pre.firstChild);

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        const text = code.textContent;
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add('copied');
          btn.textContent = 'COPIED';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = 'COPY';
          }, 1400);
        } catch (e) {
          const range = document.createRange();
          range.selectNodeContents(code);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          btn.textContent = 'SELECT+⌘C';
          setTimeout(() => { btn.textContent = 'COPY'; }, 1800);
        }
      });
    });
  }

  /* ---------- right-rail TOC scrollspy ---------- */
  function initScrollspy() {
    const tocList = document.querySelector('.toc ul');
    if (!tocList) return;
    const links = tocList.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    const byId = new Map();
    const targets = [];
    links.forEach(a => {
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      const t = document.getElementById(id);
      if (t) { byId.set(id, a); targets.push(t); }
    });
    if (!targets.length) return;

    let activeId = null;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          if (en.target.id === activeId) return;
          activeId = en.target.id;
          links.forEach(l => l.classList.remove('active'));
          const a = byId.get(activeId);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-72px 0px -68% 0px', threshold: 0 });
    targets.forEach(t => obs.observe(t));
  }

  /* ---------- mobile sidebar ---------- */
  function initMobileMenu() {
    const btn = document.querySelector('.menu-btn');
    const sb = document.querySelector('.sidebar');
    if (!btn || !sb) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = sb.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => {
      if (sb.classList.contains('open') &&
          !sb.contains(e.target) &&
          !btn.contains(e.target)) {
        sb.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    initTheme();
    initCopyButtons();
    initScrollspy();
    initMobileMenu();
  });
})();
