const DEFAULT_SEARCH_WATERMARK = 'Ask a question...';

const FIELD_ALIASES = {
  canvastype: 'canvasType',
  canvassearchwatermark: 'searchWatermark',
  searchwatermark: 'searchWatermark',
  searchicon: 'searchIcon',
  canvassearchicon: 'searchIcon',
  menuicon: 'menuIcon',
  canvasmenuicon: 'menuIcon',
  canvasstyle: 'canvasStyle',
  canvastitle: 'canvasTitle',
  canvasdescription: 'canvasDescription',
  shownavigation: 'showNavigation',
  showmicrophone: 'showMicrophone',
  enablesearch: 'enableSearch',
  maximumoptions: 'maximumOptions',
  options: 'optionsType',
  optionstype: 'optionsType',
  canvasnavrootpath: 'canvasNavRootPath',
  navrootpath: 'canvasNavRootPath',
  canvasnavdepth: 'canvasNavDepth',
  navdepth: 'canvasNavDepth',
};

function normalizeFieldKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function extractCellValue(cell) {
  if (!cell) return '';

  const image = cell.querySelector('img');
  if (image) return image;

  const picture = cell.querySelector('picture');
  if (picture) {
    const pictureImage = picture.querySelector('img');
    if (pictureImage) return pictureImage;
  }

  const link = cell.querySelector('a');
  if (link) return link.href || link.textContent.trim();

  const checkbox = cell.querySelector('input[type="checkbox"]');
  if (checkbox) return checkbox.checked ? 'true' : 'false';

  return cell.textContent.trim();
}

function extractData(block) {
  const data = {};

  [...block.children].forEach((row) => {
    const cells = [...row.children];

    if (cells.length < 2) return;

    const rawKey = cells[0]?.textContent?.trim() || '';
    const rawValue = extractCellValue(cells[1]);
    const normalizedKey = normalizeFieldKey(rawKey);
    const canonicalKey = FIELD_ALIASES[normalizedKey] || normalizedKey;

    data[canonicalKey] = rawValue;
  });

  return data;
}

function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') return value;

  const normalized = String(value).trim().toLowerCase();

  if (['true', 'yes', 'on', '1'].includes(normalized)) return true;
  if (['false', 'no', 'off', '0'].includes(normalized)) return false;

  return fallback;
}

function toPositiveInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(parsed, 0);
}

function createImageElement(source, altText) {
  if (!source) return null;

  if (source instanceof Element) {
    const image = source.matches('img') ? source : source.querySelector('img');
    if (image) {
      image.alt = image.alt || altText || 'Canvas icon';
      image.setAttribute('loading', 'lazy');
      return image;
    }
    return null;
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('<')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = trimmed;
      const image = wrapper.querySelector('img');
      if (image) {
        image.alt = image.alt || altText || 'Canvas icon';
        image.setAttribute('loading', 'lazy');
        return image;
      }
      return null;
    }

    if (trimmed.startsWith('/') || trimmed.startsWith('http') || trimmed.startsWith('data:')) {
      const image = document.createElement('img');
      image.src = trimmed;
      image.alt = altText || 'Canvas icon';
      image.setAttribute('loading', 'lazy');
      return image;
    }
  }

  return null;
}

function createIconButton({
  className,
  label,
  iconSource,
  fallbackText,
}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);

  const icon = createImageElement(iconSource, label);

  if (icon) {
    button.appendChild(icon);
    return button;
  }

  const fallback = document.createElement('span');
  fallback.className = 'canvas-icon-fallback';
  fallback.textContent = fallbackText || label;
  button.appendChild(fallback);

  return button;
}

function normalizeNavigationPath(value = '') {
  if (!value) return '/';

  const candidate = String(value).trim();
  if (!candidate) return '/';

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    try {
      return new URL(candidate).pathname || '/';
    } catch (error) {
      return '/';
    }
  }

  return candidate.startsWith('/')
    ? candidate.replace(/\/+$/, '') || '/'
    : `/${candidate.replace(/\/+$/, '')}`;
}

function buildNavigationCandidates(rootPath, depth = 3) {
  const normalizedRoot = normalizeNavigationPath(rootPath);
  const paths = new Set();

  if (normalizedRoot && normalizedRoot !== '/') {
    paths.add(normalizedRoot);
    paths.add(`${normalizedRoot}/`);
    paths.add(`${normalizedRoot}/.nav.json`);
    paths.add(`${normalizedRoot}/nav.json`);
    paths.add(`${normalizedRoot}/nav`);
    paths.add(`${normalizedRoot}/navigation.json`);
    paths.add(`${normalizedRoot}/index.json`);
    paths.add(`${normalizedRoot}.json`);
  }

  paths.add('/nav');
  paths.add('/nav.json');
  paths.add('/.nav.json');
  paths.add('/content.json');

  const maxDepth = Math.max(1, Number.isFinite(depth) ? depth : 3);
  if (maxDepth > 1) {
    paths.add(
      `/${normalizedRoot
        .replace(/^\//, '')
        .split('/')
        .filter(Boolean)
        .slice(0, maxDepth)
        .join('/')}`,
    );
  }

  return [...paths].filter(Boolean);
}

function extractNavItemsFromJson(payload) {
  if (!payload) return [];

  const nodes = Array.isArray(payload)
    ? payload
    : payload.items || payload.children || payload.data || payload.nav || payload.navigation || [];

  if (!Array.isArray(nodes)) {
    return [];
  }

  const items = [];

  const walk = (list, depth = 0, maxDepth = 3) => {
    if (!Array.isArray(list) || depth > maxDepth) return;

    list.forEach((item) => {
      if (!item) return;

      const title = item.title || item.name || item.label || item.text || '';
      const href = item.path || item.href || item.url || item.link || '';

      if (title && href) {
        items.push({ title: String(title).trim(), href: String(href).trim() });
      }

      const children = item.items || item.children || item.subItems || item.subitems || [];
      if (children.length) {
        walk(children, depth + 1, maxDepth);
      }
    });
  };

  walk(nodes);

  return items.filter((item, index, array) => {
    const key = `${item.title}|${item.href}`;
    return array.findIndex((entry) => `${entry.title}|${entry.href}` === key) === index;
  });
}

async function fetchNavigationData(rootPath, depth = 3) {
  const candidates = buildNavigationCandidates(rootPath, depth);

  const results = await Promise.all(candidates.map(async (candidate) => {
    try {
      const url = candidate.startsWith('http')
        ? candidate
        : `${window.location.origin}${candidate}`;
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) return [];

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!text) return [];

      if (contentType.includes('application/json')
        || text.trim().startsWith('{')
        || text.trim().startsWith('[')) {
        try {
          const payload = JSON.parse(text);
          const items = extractNavItemsFromJson(payload);
          if (items.length) return items;
        } catch (error) {
          // ignore malformed JSON and continue to next candidate
        }
      }

      const doc = new DOMParser().parseFromString(text, 'text/html');
      const scriptPattern = /^javascript:/i;
      const links = [...doc.querySelectorAll('a[href]')]
        .map((link) => ({
          title: link.textContent.trim(),
          href: link.getAttribute('href') || '',
        }))
        .filter((item) => item.title && item.href && !scriptPattern.test(item.href))
        .map((item) => ({
          title: item.title,
          href: item.href.startsWith('/')
            ? item.href
            : new URL(item.href, window.location.origin).href,
        }));

      return links.length ? links.slice(0, 10) : [];
    } catch (error) {
      return [];
    }
  }));

  return results.find((items) => items.length) || [];
}

async function renderNavigationMenu(menuButton, data) {
  const navPanel = menuButton.parentElement?.querySelector('.canvas-nav-panel');

  if (navPanel && navPanel.dataset.loaded === 'true') {
    navPanel.classList.toggle('is-open');
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'canvas-nav-panel';

  const list = document.createElement('ul');
  list.className = 'canvas-nav-list';

  const rootPath = normalizeNavigationPath(data.canvasNavRootPath || '/');
  const depth = toPositiveInt(data.canvasNavDepth, 3);
  const items = await fetchNavigationData(rootPath, depth);

  if (!items.length) {
    const fallbackItem = document.createElement('li');
    fallbackItem.className = 'canvas-nav-item';
    const fallbackLink = document.createElement('a');
    fallbackLink.href = '/';
    fallbackLink.textContent = 'Home';
    fallbackItem.appendChild(fallbackLink);
    list.appendChild(fallbackItem);
  } else {
    items.forEach((item) => {
      const navItem = document.createElement('li');
      navItem.className = 'canvas-nav-item';
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.title;
      navItem.appendChild(link);
      list.appendChild(navItem);
    });
  }

  panel.appendChild(list);
  panel.dataset.loaded = 'true';

  if (navPanel) {
    navPanel.replaceWith(panel);
  } else {
    menuButton.parentElement.appendChild(panel);
  }

  panel.classList.add('is-open');
}

function createSearchBar({
  watermark,
  showNavigation,
  showMicrophone,
  menuIcon,
  searchIcon,
  data,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-search';

  if (showNavigation) {
    const menuButton = createIconButton({
      className: 'canvas-menu-btn',
      label: 'Open navigation',
      iconSource: menuIcon,
      fallbackText: 'Menu',
    });

    menuButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await renderNavigationMenu(menuButton, data);
    });

    wrapper.append(menuButton);
  }

  const container = document.createElement('div');
  container.className = 'canvas-search-container';

  const searchInput = document.createElement('div');
  searchInput.className = 'canvas-search-input';

  const placeholder = document.createElement('span');
  placeholder.className = 'canvas-placeholder';
  placeholder.textContent = watermark || DEFAULT_SEARCH_WATERMARK;
  searchInput.appendChild(placeholder);

  const controls = document.createElement('div');
  controls.className = 'canvas-controls';

  if (showMicrophone) {
    controls.append(
      createIconButton({
        className: 'canvas-mic-btn',
        label: 'Use microphone',
        iconSource: searchIcon,
        fallbackText: 'Mic',
      }),
    );
  }

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'canvas-submit-btn';
  submit.setAttribute('aria-label', 'Submit search');
  submit.textContent = '→';
  controls.appendChild(submit);

  searchInput.appendChild(controls);
  container.appendChild(searchInput);
  wrapper.appendChild(container);

  document.addEventListener('click', (event) => {
    const navPanel = wrapper.querySelector('.canvas-nav-panel');
    if (!navPanel || !wrapper.contains(event.target)) {
      navPanel?.classList.remove('is-open');
    }
  });

  return wrapper;
}

function renderSearchCanvas(block, data) {
  const search = createSearchBar({
    watermark: data.searchWatermark || DEFAULT_SEARCH_WATERMARK,
    showNavigation: toBoolean(data.showNavigation, true),
    showMicrophone: toBoolean(data.showMicrophone, true),
    menuIcon: data.menuIcon,
    searchIcon: data.searchIcon,
    data,
  });

  block.appendChild(search);
}

function renderIntentCanvas(block, data, optionList = []) {
  const section = document.createElement('section');
  section.className = 'canvas-intent';

  const glowYellow = document.createElement('div');
  glowYellow.className = 'canvas-glow canvas-glow-yellow';
  const glowBlue = document.createElement('div');
  glowBlue.className = 'canvas-glow canvas-glow-blue';
  section.append(glowYellow, glowBlue);

  const content = document.createElement('div');
  content.className = 'canvas-intent-content';

  const title = data.canvasTitle || '';
  if (title) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'canvas-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }

  const description = data.canvasDescription || '';
  if (description) {
    const descriptionEl = document.createElement('div');
    descriptionEl.className = 'canvas-description';
    descriptionEl.innerHTML = description;
    content.appendChild(descriptionEl);
  }

  const searchSlot = document.createElement('div');
  searchSlot.className = 'canvas-search-slot';

  if (toBoolean(data.enableSearch, true)) {
    searchSlot.append(
      createSearchBar({
        watermark: data.searchWatermark || DEFAULT_SEARCH_WATERMARK,
        showNavigation: toBoolean(data.showNavigation, true),
        showMicrophone: toBoolean(data.showMicrophone, true),
        menuIcon: data.menuIcon,
        searchIcon: data.searchIcon,
        data,
      }),
    );
  }

  content.appendChild(searchSlot);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'canvas-options';

  const maxOptions = Math.max(0, toPositiveInt(data.maximumOptions, 5));
  const optionsToRender = optionList.slice(0, maxOptions || optionList.length);

  if (optionsToRender.length) {
    optionsToRender.forEach((item) => {
      const label = item.dataset?.optionlabel
        || item.dataset?.optionLabel
        || item.querySelector('h1,h2,h3,h4,h5,h6,p,a,span')?.textContent?.trim()
        || item.textContent?.trim()
        || 'Option';

      const href = item.dataset?.optionlink || item.dataset?.optionLink || item.querySelector('a')?.href || '#';
      const option = document.createElement('a');
      option.className = 'canvas-option-pill';
      option.href = href;
      option.textContent = label;
      optionsContainer.appendChild(option);
    });
  } else {
    Array.from({ length: maxOptions }, (_, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'canvas-option-pill';
      option.textContent = `Option ${index + 1}`;
      return option;
    }).forEach((option) => {
      optionsContainer.appendChild(option);
    });
  }

  content.appendChild(optionsContainer);
  section.appendChild(content);
  block.appendChild(section);
}

export default function decorate(block) {
  const rawBlockHtml = block.innerHTML;
  const data = extractData(block);
  const optionList = [...block.querySelectorAll('.canvas-option')];

  console.group('Canvas');
  console.log('Raw Block', rawBlockHtml);
  console.log('Extracted Data', data);
  console.groupEnd();

  block.innerHTML = '';

  const canvasType = String(data.canvasType || 'search').trim().toLowerCase();
  const normalizedCanvasType = canvasType === 'intent' ? 'intent' : 'search';
  const canvasStyle = String(data.canvasStyle || 'default').trim().toLowerCase();

  block.classList.add('canvas');
  block.classList.add(`canvas-${normalizedCanvasType}`);

  if (canvasStyle === 'floating-sticky' || canvasStyle === 'floatingsticky') {
    block.classList.add('canvas-floating-sticky');
  } else {
    block.classList.add('canvas-default');
  }

  if (normalizedCanvasType === 'intent') {
    renderIntentCanvas(block, data, optionList);
    return;
  }

  renderSearchCanvas(block, data);
}
