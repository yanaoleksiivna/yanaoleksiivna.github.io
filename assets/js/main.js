(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    document.documentElement.classList.add('js');
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', toggle.dataset.labelOpen);
      nav.classList.remove('is-open');
    };
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
      nav.classList.toggle('is-open', isOpen);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);
  }
  const languageMenu = document.querySelector('.language-menu');
  if (languageMenu) {
    document.addEventListener('click', event => {
      if (!languageMenu.contains(event.target)) languageMenu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && languageMenu.open) {
        languageMenu.open = false;
        languageMenu.querySelector('summary').focus();
      }
    });
  }
  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.journal-archive [data-category]');
  const count = document.querySelector('.story-count');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) visible++;
    });
    if (count) count.textContent = (visible === 1 ? count.dataset.countOne : count.dataset.countMany).replace('%count%', visible);
  }));
})();
