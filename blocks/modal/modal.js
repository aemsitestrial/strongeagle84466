import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';

const FRAGMENT_TYPES = ['fragment', 'large', 'fullscreen'];

/* Row order must match the field order of the `modal` model in _modal.json. */
const FIELD_ROWS = [
  'modalType',
  'theme',
  'buttonText',
  'buttonColor',
  'fragmentLink',
  'image',
  'imageAlt',
  'videoUrl',
  'title',
  'description',
  'primaryCtaText',
  'primaryCtaLink',
  'secondaryCtaText',
  'secondaryCtaLink',
  'modalCtaText',
  'modalCtaLink',
];

/* A row is either a single value cell or a label/value pair. */
function getValueCell(row) {
  if (!row) return null;
  return row.children.length > 1 ? row.children[1] : row.firstElementChild || row;
}

function getText(row) {
  const cell = getValueCell(row);
  return cell ? cell.textContent.trim() : '';
}

function getLink(row) {
  const cell = getValueCell(row);
  if (!cell) return '';
  const anchor = cell.querySelector('a[href]');
  return anchor ? anchor.getAttribute('href') : cell.textContent.trim();
}

function getHtml(row) {
  const cell = getValueCell(row);
  return cell ? cell.innerHTML.trim() : '';
}

function getPicture(row) {
  const cell = getValueCell(row);
  if (!cell) return null;
  const picture = cell.querySelector('picture');
  if (picture) return picture.cloneNode(true);
  const img = cell.querySelector('img[src]');
  if (img) return img.cloneNode(true);
  const src = cell.textContent.trim();
  if (!src) return null;
  const image = document.createElement('img');
  image.src = src;
  return image;
}

/* Turn shareable YouTube/Vimeo URLs into their embeddable equivalent. */
function toEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.href);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (host.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === 'vimeo.com') {
      return `https://player.vimeo.com/video${parsed.pathname}`;
    }
    return parsed.href;
  } catch (e) {
    return url;
  }
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

    const image = media.tagName === 'IMG' ? media : media.querySelector('img');

    if (image) image.alt = data.imageAlt || image.alt || '';

    wrapper.append(media);
  }

  appendModalCta(wrapper, data);

  return wrapper;
}

function createVideoModal(data) {
  const wrapper = document.createElement('div');

  if (data.videoUrl) {
    if (/\.(mp4|webm|ogv|ogg)(\?|#|$)/i.test(data.videoUrl)) {
      const video = document.createElement('video');
      video.controls = true;
      video.src = data.videoUrl;
      video.preload = 'metadata';
      wrapper.append(video);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = toEmbedUrl(data.videoUrl);
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.title = data.title || 'Video';
      wrapper.append(iframe);
    }
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

  appendModalCta(wrapper, data);

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
  closeButton.ariaLabel = 'Close';

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
    },
  };
}

async function createFragmentModal(data) {
  if (!data.fragmentLink) return [];

  const path = data.fragmentLink.startsWith('http')
    ? new URL(data.fragmentLink, window.location.href).pathname
    : data.fragmentLink;

  const fragment = await loadFragment(path);

  if (!fragment) return [];

  const nodes = [...fragment.childNodes];

  const cta = createButton(data.modalCtaText, data.modalCtaLink, 'button primary modal-cta');
  if (cta) nodes.push(cta);

  return nodes;
}

export async function openModal(data) {
  const { modalType } = data;

  let content = [];

  if (FRAGMENT_TYPES.includes(modalType)) {
    content = await createFragmentModal(data);
  } else if (modalType === 'image') {
    content = [createImageModal(data)];
  } else if (modalType === 'video') {
    content = [createVideoModal(data)];
  } else if (modalType === 'cta') {
    content = [createCtaModal(data)];
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
  const row = (name) => rows[FIELD_ROWS.indexOf(name)];

  const data = {
    modalType: getText(row('modalType')) || 'fragment',
    theme: getText(row('theme')) || 'light',
    buttonText: getText(row('buttonText')),
    buttonColor: getText(row('buttonColor')),
    fragmentLink: getLink(row('fragmentLink')),
    image: getPicture(row('image')),
    imageAlt: getText(row('imageAlt')),
    videoUrl: getLink(row('videoUrl')),
    title: getText(row('title')),
    description: getHtml(row('description')),
    primaryCtaText: getText(row('primaryCtaText')),
    primaryCtaLink: getLink(row('primaryCtaLink')),
    secondaryCtaText: getText(row('secondaryCtaText')),
    secondaryCtaLink: getLink(row('secondaryCtaLink')),
    modalCtaText: getText(row('modalCtaText')),
    modalCtaLink: getLink(row('modalCtaLink')),
  };

  const trigger = document.createElement('button');

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
