import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';

const MODAL_TYPES = ['fragment', 'image', 'video', 'cta', 'large', 'fullscreen'];
const THEMES = ['light', 'dark'];
const FRAGMENT_TYPES = ['fragment', 'large', 'fullscreen'];

/* Text-valued fields the author can fill, per modal type, in model order. */
const TEXT_FIELDS = {
  fragment: ['buttonText', 'modalCtaText'],
  large: ['buttonText', 'modalCtaText'],
  fullscreen: ['buttonText', 'modalCtaText'],

  image: [
    'buttonText',
    'imageAlt',
    'description',
    'modalCtaText',
  ],

  video: [
    'buttonText',
    'description',
    'modalCtaText',
  ],

  cta: [
    'buttonText',
    'title',
    'primaryCtaText',
    'secondaryCtaText',
  ],
};

/* URL-valued fields the author can fill, per modal type, in model order. */
const LINK_FIELDS = {
  fragment: ['fragmentLink', 'modalCtaLink'],
  large: ['fragmentLink', 'modalCtaLink'],
  fullscreen: ['fragmentLink', 'modalCtaLink'],
  image: ['modalCtaLink'],
  video: ['videoUrl', 'modalCtaLink'],
  cta: ['primaryCtaLink', 'secondaryCtaLink'],
};

/* A row is either a single value cell or a label/value pair. */
function getValueCell(row) {
  if (!row) return null;
  return row.children.length > 1 ? row.children[1] : row.firstElementChild || row;
}

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function cellLink(cell) {
  if (!cell) return '';
  const anchor = cell.querySelector('a[href]');
  return anchor ? anchor.getAttribute('href') : cellText(cell);
}

function cellPicture(cell) {
  const media = cell ? cell.querySelector('picture, img[src]') : null;
  return media ? media.cloneNode(true) : null;
}

function looksLikeLink(cell) {
  if (cell.querySelector('a[href]')) return true;
  return /^(https?:\/\/|www\.|\/|#|mailto:|tel:)/i.test(cellText(cell));
}

function looksRich(cell) {
  return !!cell.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, br, strong, em');
}

/*
 * The xwalk renderer may omit rows for unauthored fields, so a fixed row index
 * is not reliable. Rows are classified by shape, then assigned to the fields
 * valid for the detected modal type, in model order.
 */
function readFields(rows) {
  const fields = {};
  const rest = [];

  rows.map(getValueCell).filter(Boolean).forEach((cell) => {
    const value = cellText(cell).toLowerCase();

    if (!fields.modalType && MODAL_TYPES.includes(value)) {
      fields.modalType = value;
    } else if (!fields.theme && THEMES.includes(value)) {
      fields.theme = value;
    } else if (!fields.buttonColor && value.startsWith('tcs-background-')) {
      fields.buttonColor = value;
    } else if (!fields.image && cell.querySelector('picture, img[src]')) {
      fields.image = cellPicture(cell);
    } else {
      rest.push(cell);
    }
  });

  const type = fields.modalType || 'fragment';
  const links = rest.filter(looksLikeLink);
  const texts = rest.filter((cell) => !looksLikeLink(cell) && cellText(cell));

  if (type === 'cta') {
    const richIndex = texts.findIndex(looksRich);
    if (richIndex > -1) {
      fields.description = texts.splice(richIndex, 1)[0].innerHTML.trim();
    }
  }

  TEXT_FIELDS[type].forEach((name, i) => {
    if (!texts[i]) return;

    fields[name] = cellText(texts[i]);
  });

  if (
    type === 'cta'
    && fields.buttonText
    && fields.title
    && fields.buttonText.includes('Join')
  ) {
    const tmp = fields.buttonText;
    fields.buttonText = fields.title;
    fields.title = tmp;
  }

  LINK_FIELDS[type].forEach((name, i) => {
    if (links[i]) fields[name] = cellLink(links[i]);
  });

  fields.modalType = type;
  fields.theme = fields.theme || 'light';

  return fields;
}

function createPlaceholder(message) {
  const notice = document.createElement('p');
  notice.classList.add('modal-placeholder');
  notice.textContent = message;
  return notice;
}

/* Returns { type: 'file' | 'embed', src } or null when unusable. */
function resolveVideoSource(url) {
  if (!url) return null;

  let parsed;

  try {
    parsed = new URL(url, window.location.href);
  } catch (e) {
    return null;
  }

  if (/\.(mp4|webm|ogv|ogg|m4v)$/i.test(parsed.pathname)) {
    return {
      type: 'file',
      src: parsed.href,
    };
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    return {
      type: 'embed',
      src: `https://www.youtube.com/embed${parsed.pathname}`,
    };
  }

  if (host.endsWith('youtube.com')) {
    const id = parsed.searchParams.get('v');

    if (id) {
      return {
        type: 'embed',
        src: `https://www.youtube.com/embed/${id}`,
      };
    }

    if (parsed.pathname.startsWith('/embed/')) {
      return {
        type: 'embed',
        src: parsed.href,
      };
    }
  }

  if (host === 'vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean).pop();

    if (id) {
      return {
        type: 'embed',
        src: `https://player.vimeo.com/video/${id}`,
      };
    }
  }

  return {
    type: 'embed',
    src: parsed.href,
  };
}

function createButton(text, href, className = 'button primary') {
  if (!text || !href) return null;

  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  link.className = className;

  return link;
}

function appendModalCta(wrapper, data) {
  const cta = createButton(data.modalCtaText, data.modalCtaLink, 'button primary modal-cta');
  if (cta) wrapper.append(cta);
}

function createImageModal(data) {
  const wrapper = document.createElement('div');

  if (data.image) {
    const media = data.image.cloneNode(true);

    const image = media.tagName === 'IMG'
      ? media
      : media.querySelector('img');

    if (image) {
      image.alt = data.imageAlt || image.alt || '';
    }

    wrapper.append(media);
  } else {
    wrapper.append(createPlaceholder('No image configured.'));
  }

  if (data.description) {
    const description = document.createElement('div');
    description.classList.add('modal-description');
    description.textContent = data.description;
    wrapper.append(description);
  }

  appendModalCta(wrapper, data);

  return wrapper;
}

function createVideoModal(data) {
  const wrapper = document.createElement('div');
  const source = resolveVideoSource(data.videoUrl);

  if (!source) {
    wrapper.append(createPlaceholder('No video configured.'));
  } else if (source.type === 'file') {
    const video = document.createElement('video');

    video.src = source.src;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';

    wrapper.append(video);
  } else {
    const iframe = document.createElement('iframe');

    iframe.src = source.src;
    iframe.title = 'Video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';

    wrapper.append(iframe);
  }

  if (data.description) {
    const description = document.createElement('div');
    description.classList.add('modal-description');
    description.textContent = data.description;
    wrapper.append(description);
  }

  appendModalCta(wrapper, data);

  return wrapper;
}

function createCtaModal(data) {
  const wrapper = document.createElement('div');

  if (data.title) {
    const title = document.createElement('h2');
    title.textContent = data.title;
    wrapper.append(title);
  }

  if (data.description) {
    const description = document.createElement('div');
    description.classList.add('modal-description');
    description.innerHTML = data.description;
    wrapper.append(description);
  }

  const actions = document.createElement('div');
  actions.classList.add('modal-actions');

  const primary = createButton(
    data.primaryCtaText,
    data.primaryCtaLink,
    'button primary',
  );

  const secondary = createButton(
    data.secondaryCtaText,
    data.secondaryCtaLink,
    'button secondary',
  );

  if (primary) actions.append(primary);
  if (secondary) actions.append(secondary);

  if (actions.childElementCount) wrapper.append(actions);

  return wrapper;
}

export async function createModal(contentNodes = [], options = {}) {
  await loadCSS(
    `${window.hlx.codeBasePath}/blocks/modal/modal.css`,
  );

  const {
    variant = 'fragment',
    theme = 'light',
  } = options;

  const dialog = document.createElement('dialog');
  dialog.classList.add(theme);
  dialog.classList.add(variant);

  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');

  dialogContent.append(...contentNodes);

  dialog.append(dialogContent);

  const closeButton = document.createElement('button');

  closeButton.classList.add('close-button');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');

  closeButton.innerHTML = '<span class="icon icon-close"></span>';

  closeButton.addEventListener('click', () => {
    dialog.close();
  });

  dialog.prepend(closeButton);

  const block = buildBlock('modal', '');

  document.querySelector('main').append(block);

  decorateBlock(block);
  await loadBlock(block);

  dialog.addEventListener('click', (e) => {
    const {
      left,
      right,
      top,
      bottom,
    } = dialog.getBoundingClientRect();

    const { clientX, clientY } = e;

    if (
      clientX < left
      || clientX > right
      || clientY < top
      || clientY > bottom
    ) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.textContent = '';
  block.append(dialog);

  return {
    block,
    showModal() {
      dialog.showModal();

      setTimeout(() => {
        dialogContent.scrollTop = 0;
      }, 0);

      document.body.classList.add('modal-open');
      closeButton.focus();
    },
  };
}

async function createFragmentModal(data) {
  const nodes = [];

  let fragment = null;

  if (data.fragmentLink) {
    const path = data.fragmentLink.startsWith('http')
      ? new URL(data.fragmentLink, window.location.href).pathname
      : data.fragmentLink;
    fragment = await loadFragment(path);
  }

  if (fragment && fragment.childNodes.length) {
    nodes.push(...fragment.childNodes);
  } else {
    nodes.push(createPlaceholder('Fragment content unavailable.'));
  }

  const cta = createButton(data.modalCtaText, data.modalCtaLink, 'button primary modal-cta');
  if (cta) nodes.push(cta);

  return nodes;
}

export async function openModal(data) {
  const { modalType } = data;

  let content;

  if (modalType === 'image') {
    content = [createImageModal(data)];
  } else if (modalType === 'video') {
    content = [createVideoModal(data)];
  } else if (modalType === 'cta') {
    content = [createCtaModal(data)];
  } else if (FRAGMENT_TYPES.includes(modalType)) {
    content = await createFragmentModal(data);
  } else {
    content = [createPlaceholder('Fragment content unavailable.')];
  }

  const { showModal } = await createModal(
    content,
    {
      variant: modalType,
      theme: data.theme,
    },
  );

  showModal();
}

export default function decorate(block) {
  const rows = [...block.children];

  // createModal() appends an empty placeholder block that must not be decorated.
  if (!rows.length) return;

  const data = readFields(rows);

  const trigger = document.createElement('button');

  trigger.type = 'button';
  trigger.classList.add('modal-trigger');

  if (data.buttonColor) {
    trigger.classList.add(data.buttonColor);
  }

  trigger.textContent = data.buttonText || 'Open Modal';

  trigger.addEventListener('click', () => {
    openModal(data);
  });

  block.textContent = '';
  block.append(trigger);
}
