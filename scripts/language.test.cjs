const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('assets/js/language.js', 'utf8');
function visit({ languages, language, saved, gateway = 'home', baseurl = '', storageBlocked = false, articleTargets = {}, search = '', hash = '' } = {}) {
  let redirect; let handler; let stored;
  const context = {
    document: {
      documentElement: { dataset: { localeGateway: gateway, baseurl } },
      querySelector(selector) { const match = selector.match(/locale-target-(\w+)/); const content = match && articleTargets[match[1]]; return content ? { content } : null; },
      addEventListener(event, listener) { if (event === 'click') handler = listener; },
    },
    navigator: { languages, language },
    localStorage: {
      getItem() { if (storageBlocked) throw new Error('disabled'); return saved; },
      setItem(key, value) { if (storageBlocked) throw new Error('disabled'); stored = [key, value]; },
    },
    location: { search, hash, replace(url) { redirect = url; } },
  };
  vm.runInNewContext(code, context);
  return { redirect, click(lang) { handler({ target: { closest() { return { dataset: { language: lang } }; } } }); return stored; } };
}
test('matches supported browser languages and regional variants', () => {
  for (const [language, expected] of [['ru-RU','ru'], ['uk-UA','uk'], ['pt-PT','pt'], ['pt-BR','pt'], ['en-GB','en']]) {
    assert.equal(visit({ languages: [language] }).redirect, `/${expected}/`);
  }
});
test('uses the first supported browser preference, falling back to English', () => {
  assert.equal(visit({ languages: ['fr-FR', 'uk-UA', 'ru-RU'] }).redirect, '/uk/');
  assert.equal(visit({ languages: ['de-DE', 'fr'] }).redirect, '/en/');
  assert.equal(visit({ languages: [], language: 'pt-PT' }).redirect, '/pt/');
  assert.equal(visit().redirect, '/en/');
});
test('a valid manual choice overrides browser preference; invalid values do not', () => {
  assert.equal(visit({ saved: 'en', languages: ['ru'] }).redirect, '/en/');
  assert.equal(visit({ saved: 'invalid', languages: ['uk'] }).redirect, '/uk/');
});
test('storage restrictions do not prevent detection or manual language navigation', () => {
  const result = visit({ storageBlocked: true, languages: ['pt'] });
  assert.equal(result.redirect, '/pt/');
  assert.doesNotThrow(() => result.click('ru'));
});
test('preserves route, baseurl, query, and fragment', () => {
  assert.equal(visit({ languages: ['ru'], gateway: 'studio', baseurl: '/yana', search: '?ref=friend', hash: '#photos' }).redirect, '/yana/ru/studio/?ref=friend#photos');
});
test('explicit language pages do not redirect, and choosing a language is remembered', () => {
  const explicit = visit({ gateway: '', languages: ['ru'], saved: 'uk' });
  assert.equal(explicit.redirect, undefined);
  assert.deepEqual(explicit.click('pt'), ['yana-language', 'pt']);
  assert.deepEqual(explicit.click('not-a-language'), ['yana-language', 'pt']);
});
test('legacy article links use a published translation or the localized journal fallback', () => {
  assert.equal(visit({ gateway: 'article', languages: ['uk'], articleTargets: { uk: '/uk/journal/a-translated-slug/' } }).redirect, '/uk/journal/a-translated-slug/');
  assert.equal(visit({ gateway: 'article', languages: ['pt'], articleTargets: { pt: '/pt/journal/' } }).redirect, '/pt/journal/');
});
