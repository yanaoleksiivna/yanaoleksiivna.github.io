# Maintenance guidelines

Be concise. Preserve unrelated changes and keep edits focused on the requested task.

## Design and content

- Keep the custom Jekyll theme lightweight, warm and uncluttered, with pastel colours and Noto Serif headings. Avoid adding dependencies for simple changes.
- Preserve responsive layouts, accessible navigation, visible keyboard focus and descriptive image alt text. Check photo crops on desktop and mobile when changing image styles.
- Use short dashes instead of em dashes in site copy, including articles.
- Use Yana Oleksiivna in English and Portuguese, Яна Алексеевна in Russian, and Яна Олексіївна in Ukrainian. Keep author tags consistent with visible names.
- Keep course pricing and detailed terms on the linked course pages. Do not invent qualifications, health claims, course details or contact information.

## Languages and articles

- Maintain English, Russian, Ukrainian and Portuguese versions of shared interface content in `_data/locales.json`.
- Browser-language detection applies to language-neutral routes, with English fallback and a remembered manual selection. Explicit language URLs must remain stable. Use language names or abbreviations, never flags.
- Add Markdown articles to `_posts/<lang>/YYYY-MM-DD-slug.md`, following an existing article's front matter. Translations share a `translation_key`; journals and feeds show only articles in their own language.
- Use the existing `figure.html` include for captioned images. Apply `relative_url` to local links and assets and `absolute_url` to canonical and SEO URLs.

## Metadata and shared data

- Update shared contact, studio, course and person information in `_data` rather than duplicating it in templates.
- Keep person metadata consistent with the visible biography. Preserve the shared Person identifier and one linked JSON-LD graph per page.
- Keep canonical URLs, language alternates and sitemap entries aligned with published pages.

## Validation

- For changes that affect rendered pages, build with `bundle exec jekyll build` and run `python3 scripts/check-site.py _site`.
- For language-navigation changes, also run `node --test scripts/language.test.cjs`.
- Check relevant desktop and mobile views for visual changes. Documentation-only edits need no site build.

## Public repository

- Keep documentation suitable for public readers. Do not include credentials, private correspondence, account setup details, machine-specific paths or internal troubleshooting history.
- Keep private files, generated output and maintenance documentation out of the published site. Verify exclusions when adding files.
