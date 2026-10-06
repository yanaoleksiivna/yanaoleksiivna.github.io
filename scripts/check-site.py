"""Verify a built multilingual site; usage: check-site.py OUTPUT [BASEURL]."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.h1=0; self.ids=set(); self.lang=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html': self.lang=a.get('lang')
        if tag=='h1': self.h1+=1
        if 'id' in a: self.ids.add(a['id'])
        if tag=='img': assert 'alt' in a, 'Image missing alt'
        for key in ('href','src'):
            if key in a: self.refs.append(a[key])

root=Path(sys.argv[1] if len(sys.argv)>1 else '_site').resolve()
baseurl=sys.argv[2] if len(sys.argv)>2 else ''
languages=['en','ru','uk','pt']
refs=0
pages=list(root.rglob('*.html'))
for f in pages:
    text=f.read_text(); p=Page(); p.feed(text)
    json_ld=re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)
    assert len(json_ld)==1, f'{f}: expected one structured-data graph'
    graph=json.loads(json_ld[0])['@graph']
    people=[node for node in graph if node.get('@type')=='Person']
    assert len(people)==1, f'{f}: duplicate or missing person'
    person=people[0]
    assert 'Yana Oleksiivna Nesterenko' in person['alternateName'], f'{f}: missing full author name'
    assert urlsplit(person['@id']).path==baseurl+'/' and urlsplit(person['@id']).fragment=='yana', f'{f}: inconsistent person identity'
    assert person['image'].endswith('/assets/images/IMG_1215.jpeg'), f'{f}: incorrect author portrait'
    assert person['sameAs']==['https://www.instagram.com/yanastretch_ing/','https://t.me/yanastretch_ing'], f'{f}: incorrect author social profiles'
    page_nodes=[node for node in graph if node.get('@type') in ('WebPage','ProfilePage','BlogPosting')]
    assert len(page_nodes)==1, f'{f}: duplicate or missing page entity'
    entity=page_nodes[0]
    assert entity['author']['@id']==person['@id'], f'{f}: unlinked author'
    assert p.h1==1, f'{f}: expected one h1, got {p.h1}'
    assert '{{' not in text and '{%' not in text, f'{f}: unresolved Liquid'
    for ref in p.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc: continue
        path=unquote(u.path)
        if not path: target=f
        elif path.startswith('/'):
            assert path.startswith(baseurl+'/'), f'{f}: incorrect baseurl: {path}'
            target=root/path[len(baseurl):].lstrip('/')
        else: target=f.parent/path
        if target.is_dir(): target=target/'index.html'
        assert target.exists(), f'{f}: broken reference: {ref}'
        if u.fragment and target.suffix=='.html':
            t=Page();t.feed(target.read_text());assert u.fragment in t.ids,f'{f}: broken anchor: {ref}'
        refs+=1
    relative=f.relative_to(root)
    if relative.parts[0] in languages:
        lang=relative.parts[0]
        assert p.lang==lang, f'{f}: incorrect HTML language'
        expected_name={'en':'Yana Oleksiivna','pt':'Yana Oleksiivna','ru':'Яна Алексеевна','uk':'Яна Олексіївна'}[lang]
        assert person['name']==expected_name and entity['inLanguage']==lang, f'{f}: incorrect person language'
        assert person['url'].endswith(baseurl+'/'+lang+'/about/'), f'{f}: incorrect profile URL'
        assert f'<meta name="author" content="{expected_name}"' in text, f'{f}: incorrect author meta tag'
        if relative.parts[1:]==('about','index.html'):
            assert entity['@type']=='ProfilePage' and entity['mainEntity']['@id']==person['@id'], f'{f}: incorrect profile entity'
        if len(relative.parts)>3 and relative.parts[1]=='journal':
            assert entity['@type']=='BlogPosting' and entity['headline'] and entity['datePublished'], f'{f}: incorrect article entity'
        for card in re.findall(r'<article class="post-card".*?</article>',text,re.S):
            assert all(url.startswith(baseurl+'/'+lang+'/journal/') for url in re.findall(r'href="([^"]+)"',card)), f'{f}: other-language article card'
        if len(relative.parts)>2 and relative.parts[1]=='journal':
            assert 'data-locale-gateway' not in text, f'{f}: explicit article should not auto-redirect'
        assert not re.search('[\U0001F1E6-\U0001F1FF]',text), f'{f}: country flag in interface'

ns={'a':'http://www.w3.org/2005/Atom'}
for lang in languages:
    feed=ET.parse(root/lang/'feed.xml').getroot()
    assert feed.attrib['{http://www.w3.org/XML/1998/namespace}lang']==lang
    entries=feed.findall('a:entry',ns)
    for entry in entries:
        path=urlsplit(entry.find('a:id',ns).text).path
        assert path.startswith(baseurl+'/'+lang+'/journal/'), f'Other-language post in {lang} feed'
    for route in ['','about','journal','studio','courses','online-training']:
        f=root/lang/route/'index.html'; assert f.exists(), f'Missing {f}'
    studio=(root/lang/'studio/index.html').read_text()
    slots=len(re.findall(r'class="studio-photo(?: is-placeholder)?"',studio))
    assert 3<=slots<=5, f'{lang} studio needs 3–5 photo slots, got {slots}'
    journal=(root/lang/'journal/index.html').read_text()
    card_count=len(re.findall(r'<article class="post-card"',journal))
    assert min(card_count,20)==len(entries), f'{lang}: journal/feed article count mismatch'
    print(f'{lang}: localized pages, {card_count} articles, language-only feed, {slots} studio photo slots')
ET.parse(root/'sitemap.xml')
assert not (root/'docs').exists() and not (root/'scripts').exists(), 'Private authoring files leaked into site'
print(f'Checked {len(pages)} pages and {refs} internal references.')
