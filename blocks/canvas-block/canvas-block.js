import { moveInstrumentation } from '../../scripts/scripts.js';

const FIELD_ORDER = [
  'canvasTitle',
  'canvasDescription',
  'motionType',
  'maximumOptions',
];

// Block items render as plain rows after the parent field rows.
function isCtaRow(row, index) {
  return row.classList.contains('canvas-block-cta')
    || row.classList.contains('cta')
    || row.dataset.aueModel === 'canvas-block-cta'
    || index >= FIELD_ORDER.length;
}

function normalizeKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function extractValue(cell) {
  const link = cell?.querySelector('a');

  if (link) {
    return link.getAttribute('href')
      || link.href
      || link.textContent.trim();
  }

  return cell?.textContent?.trim() || '';
}

function extractData(block) {
  const data = {};
  const parentRows = [...block.children]
    .filter((row, index) => !isCtaRow(row, index));

  parentRows.forEach((row, index) => {
    const cells = [...row.children];

    if (!cells.length) return;

    const key = normalizeKey(cells[0].textContent);
    const fieldName = FIELD_ORDER.find(
      (field) => normalizeKey(field) === key,
    );

    if (fieldName && cells.length > 1) {
      const valueCell = cells[1];

      data[fieldName] = fieldName === 'canvasDescription'
        ? valueCell.innerHTML.trim()
        : extractValue(valueCell);

      return;
    }

    const fallbackField = FIELD_ORDER[index];

    if (!fallbackField) return;

    data[fallbackField] = fallbackField === 'canvasDescription'
      ? cells[0].innerHTML.trim()
      : extractValue(cells[0]);
  });

  return data;
}

function getCtaFieldValue(ctaBlock, index, fallback = '') {
  const field = ctaBlock.children[index];

  if (!field) return fallback;

  return field.textContent?.trim() || fallback;
}

function getCtaLinkValue(ctaBlock, index) {
  const field = ctaBlock.children[index];

  if (!field) return '';

  const link = field.querySelector('a[href]');

  return link?.getAttribute('href')
    || link?.href
    || field.textContent?.trim()
    || '';
}

/**
 * Read Canvas CTA child items before the block clears its original markup.
 *
 * CTA field positions:
 * 0: text_cta
 * 1: ctaLink
 * 4: linkTarget
 */
function extractCtaOptions(ctaBlocks) {
  return ctaBlocks
    .map((ctaBlock) => {
      const renderedLink = ctaBlock.querySelector('.cta-link, a[href]');

      if (renderedLink && ctaBlock.children.length === 1) {
        return {
          label: renderedLink
            .querySelector('.cta-text')
            ?.textContent
            ?.trim()
            || renderedLink.textContent?.trim()
            || '',
          url: renderedLink.getAttribute('href')
            || renderedLink.href
            || '',
          target: renderedLink.target === '_blank'
            ? '_blank'
            : '',
          source: ctaBlock,
        };
      }

      const label = getCtaFieldValue(ctaBlock, 0);
      const url = getCtaLinkValue(ctaBlock, 1);
      const linkTarget = getCtaFieldValue(
        ctaBlock,
        4,
        'default',
      );

      return {
        label,
        url,
        target: linkTarget === 'new-window'
          ? '_blank'
          : '',
        source: ctaBlock,
      };
    })
    .filter((option) => option.label && option.url);
}

function normalizeMotionType(value) {
  const motion = String(value || 'none')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  return ['none', 'fade', 'slide-up'].includes(motion)
    ? motion
    : 'none';
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed)
    ? fallback
    : Math.max(parsed, 0);
}

async function fetchDefaultOptions(maximumOptions) {
  try {
    const response = await fetch(
      '/blocks/canvas-block/dummy.json',
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data.options)) {
      return [];
    }

    return data.options
      .filter((option) => option?.label && option?.url)
      .map((option) => ({
        label: String(option.label).trim(),
        url: String(option.url).trim(),
        target: '',
      }))
      .slice(0, maximumOptions);
  } catch {
    return [];
  }
}

/**
 * Authored-first behavior:
 *
 * Valid CTA children exist:
 * → Return authored CTA data.
 * → Do not request dummy.json.
 *
 * No valid CTA children:
 * → Fetch default pills from dummy.json.
 */
async function resolveOptions(authoredOptions, maximumOptions) {
  const validAuthoredOptions = authoredOptions
    .filter((option) => option.label && option.url)
    .slice(0, maximumOptions);

  if (validAuthoredOptions.length > 0) {
    return validAuthoredOptions;
  }

  return fetchDefaultOptions(maximumOptions);
}

function attachMotion(block) {
  if (block.dataset.motionType === 'none') return;

  const observer = new IntersectionObserver((entries) => {
    const isVisible = entries.some(
      (entry) => entry.isIntersecting,
    );

    if (!isVisible) return;

    block.classList.add('is-motion-visible');
    observer.disconnect();
  });

  observer.observe(block);
}

function renderOptionPills(optionsContainer, options) {
  options.forEach((item, index) => {
    const rowIndex = Math.floor(index / 3);
    let row = optionsContainer.children[rowIndex];

    if (!row) {
      row = document.createElement('div');
      row.className = 'canvas-block-options-row';
      optionsContainer.appendChild(row);
    }

    const link = document.createElement('a');

    link.className = 'canvas-block-option-pill';
    link.href = item.url;
    link.textContent = item.label;

    if (item.target === '_blank') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    if (item.source) moveInstrumentation(item.source, link);

    row.appendChild(link);
  });
}

async function render(block, data, authoredOptions) {
  const section = document.createElement('section');
  section.className = 'canvas-block-stage';

  const glowYellow = document.createElement('div');
  glowYellow.className = [
    'canvas-block-glow',
    'canvas-block-glow-yellow',
  ].join(' ');

  const glowBlue = document.createElement('div');
  glowBlue.className = [
    'canvas-block-glow',
    'canvas-block-glow-blue',
  ].join(' ');

  section.append(glowYellow, glowBlue);

  const content = document.createElement('div');
  content.className = 'canvas-block-content';

  if (data.canvasTitle) {
    const title = document.createElement('h2');

    title.className = 'canvas-block-title';
    title.textContent = data.canvasTitle;

    content.appendChild(title);
  }

  if (data.canvasDescription) {
    const description = document.createElement('div');

    description.className = 'canvas-block-description';
    description.innerHTML = data.canvasDescription;

    content.appendChild(description);
  }

  const searchSlot = document.createElement('div');
  searchSlot.className = 'canvas-block-search-slot';
  content.appendChild(searchSlot);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'canvas-block-options';

  const maximumOptions = Math.min(
    5,
    positiveInteger(data.maximumOptions, 5),
  );

  const configuredOptions = await resolveOptions(
    authoredOptions,
    maximumOptions,
  );

  renderOptionPills(
    optionsContainer,
    configuredOptions,
  );

  content.appendChild(optionsContainer);
  section.appendChild(content);
  block.appendChild(section);

  attachMotion(block);
}

export default async function decorate(block) {
  /*
   * Read the parent fields and CTA children before clearing
   * the original authored markup.
   */
  const data = extractData(block);

  const ctaBlocks = [...block.children].filter(isCtaRow);

  const authoredOptions = extractCtaOptions(ctaBlocks);

  block.replaceChildren();
  block.classList.add('canvas-block');

  block.dataset.motionType = normalizeMotionType(
    data.motionType,
  );

  await render(
    block,
    data,
    authoredOptions,
  );
}
