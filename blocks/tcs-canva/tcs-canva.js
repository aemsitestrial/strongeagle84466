import { moveInstrumentation } from '../../scripts/scripts.js';

function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';

  let resolvedPath = path;

  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `/content/2026/39/briskdeer43959${
      resolvedPath.startsWith('/') ? '' : '/'
    }${resolvedPath}`;
  }

  return resolvedPath.endsWith('.html')
    ? resolvedPath
    : `${resolvedPath}.html`;
}

export default function decorate(block) {
  const rows = [...block.children];

  const section = document.createElement('div');
  section.className = 'tcs-canva-container';

  const content = document.createElement('div');
  content.className = 'tcs-canva-content';

  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'tcs-canva-cta-container';

  rows.forEach((row, index) => {
    const cells = [...row.children];

    // Header
    if (index === 0) {
      const title = document.createElement('h2');
      title.className = 'tcs-canva-title';
      title.textContent = cells[0]?.textContent.trim() || 'How can TCS help you?';

      content.append(title);
      return;
    }

    // Description
    if (index === 1) {
      const description = document.createElement('p');
      description.className = 'tcs-canva-description';
      description.textContent = cells[0]?.textContent.trim()
        || 'Describe or select a challenge, opportunity or ambition';

      content.append(description);

      const placeholder = document.createElement('div');
      placeholder.className = 'tcs-canva-placeholder';

      content.append(placeholder);

      return;
    }

    // CTA Rows
    const label = cells[0]?.textContent.trim();
    const linkElement = cells[1]?.querySelector('a');

    if (!label) return;

    const link = formatHtmlPath(linkElement?.getAttribute('href') || '#');

    const cta = document.createElement('a');
    cta.className = 'tcs-canva-cta';
    cta.href = link;
    cta.textContent = label;

    if (cells[0]) {
      moveInstrumentation(cells[0], cta);
    }

    ctaContainer.append(cta);
  });

  content.append(ctaContainer);

  section.append(content);

  block.textContent = '';
  block.append(section);
}
