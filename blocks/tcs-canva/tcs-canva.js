import { moveInstrumentation } from '../../scripts/scripts.js';

function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';

  let resolvedPath = path;

  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `${
      resolvedPath.startsWith('/') ? '' : '/'
    }${resolvedPath}`;
  }

  return resolvedPath.endsWith('.html')
    ? resolvedPath
    : `${resolvedPath}.html`;
}

export default function decorate(block) {
  const rows = [...block.children];

  const container = document.createElement('div');
  container.className = 'tcs-canva-container';

  const content = document.createElement('div');
  content.className = 'tcs-canva-content';

  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'tcs-canva-cta-container';

  // Heading
  const title = rows[0]?.querySelector('div')?.textContent?.trim()
    || 'How can TCS help you?';

  const heading = document.createElement('h2');
  heading.className = 'tcs-canva-title';
  heading.textContent = title;

  // Description
  const descriptionContent = rows[1]?.querySelector('div')?.innerHTML
    || 'Describe or select a challenge, opportunity or ambition';

  const description = document.createElement('div');
  description.className = 'tcs-canva-description';
  description.innerHTML = descriptionContent;

  // Empty search placeholder space
  const placeholder = document.createElement('div');
  placeholder.className = 'tcs-canva-placeholder';

  content.append(heading);
  content.append(description);
  content.append(placeholder);

  // CTA Rows
  rows.slice(2).forEach((row) => {
    const cells = [...row.children];

    const label = cells[0]?.textContent?.trim();
    if (!label) return;

    const href = cells[1]?.querySelector('a')?.getAttribute('href') || '#';
    const target = cells[2]?.textContent?.trim() || '_self';

    const cta = document.createElement('a');
    cta.className = 'tcs-canva-cta';
    cta.href = formatHtmlPath(href);
    cta.target = target;
    cta.textContent = label;

    moveInstrumentation(cells[0], cta);

    ctaContainer.append(cta);
  });

  content.append(ctaContainer);
  container.append(content);

  block.innerHTML = '';
  block.append(container);
}
