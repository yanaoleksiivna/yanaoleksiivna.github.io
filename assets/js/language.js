(() => {
  const supported = ['en', 'ru', 'uk', 'pt'];
  const storageKey = 'yana-language';
  const root = document.documentElement;
  const gateway = root.dataset.localeGateway;
  if (gateway) {
    let preferred;
    try { preferred = localStorage.getItem(storageKey); } catch (_) { /* Storage can be disabled. */ }
    if (!supported.includes(preferred)) {
      const browserLanguages = navigator.languages && navigator.languages.length
        ? navigator.languages : [navigator.language || 'en'];
      preferred = browserLanguages.map(language => language.toLowerCase().split(/[-_]/)[0])
        .find(language => supported.includes(language)) || 'en';
    }
    const route = gateway === 'home' ? '' : `${gateway}/`;
    const articleTarget = document.querySelector(`meta[name="locale-target-${preferred}"]`);
    const target = articleTarget ? articleTarget.content : `${root.dataset.baseurl || ''}/${preferred}/${route}`;
    location.replace(`${target}${location.search}${location.hash}`);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-language]');
    if (!link || !supported.includes(link.dataset.language)) return;
    try { localStorage.setItem(storageKey, link.dataset.language); } catch (_) { /* The link still works. */ }
  });
})();
