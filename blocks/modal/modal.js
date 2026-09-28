import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';

const FRAGMENT_TYPES = ['fragment', 'large', 'fullscreen'];

/* -----------------------------
   Utilities
------------------------------ */

function getValueCell(row) {
  if (!row) return null;

  return row.children.length > 1
    ? row.children[1]
    : row.firstElementChild || row;
}

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function cellHtml(cell) {
  return cell ? cell.innerHTML.trim() : '';
}

function cellLink(cell) {
  if (!cell) return '';

  const link = cell.querySelector('a[href]');

  return link
    ? link.getAttribute('href')
    : cellText(cell);
}

function cellPicture(cell) {
  const media = cell
    ? cell.querySelector('picture, img')
    : null;

  return media
    ? media.cloneNode(true)
    : null;
}

/* -----------------------------
   Read Fields
------------------------------ */

function readFields(rows) {
  const get = (index) => getValueCell(rows[index]);

  return {
    modalType: cellText(get(0)).toLowerCase() || 'fragment',
    theme: cellText(get(1)).toLowerCase() || 'light',

    buttonText: cellText(get(2)) || 'Open Modal',
    buttonColor: cellText(get(3)),

    fragmentLink: cellLink(get(4)),

    image: cellPicture(get(5)),
    imageAlt: cellText(get(6)),

    videoUrl: cellText(get(7)),

    title: cellText(get(8)),

    description: cellHtml(get(9)),

    primaryCtaText: cellText(get(10)),
    primaryCtaLink: cellLink(get(11)),

    secondaryCtaText: cellText(get(12)),
    secondaryCtaLink: cellLink(get(13)),

    modalCtaText: cellText(get(14)),
    modalCtaLink: cellLink(get(15)),
  };
}

/* -----------------------------
   Placeholder
------------------------------ */

function createPlaceholder(message) {
  const element = document.createElement('p');

  element.classList.add('modal-placeholder');
  element.textContent = message;

  return element;
}

/* -----------------------------
   Video Resolver
------------------------------ */

function resolveVideoSource(url) {
  if (!url) return null;

  let parsed;

  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return null;
  }

  if (/\.(mp4|webm|ogg|ogv|m4v)$/i.test(parsed.pathname)) {
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

  if (host.includes('youtube.com')) {
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
    const id = parsed.pathname
      .split('/')
      .filter(Boolean)
      .pop();

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

/* -----------------------------
   Buttons
------------------------------ */

function createButton(
  text,
  href,
  className = 'button primary',
) {
  if (!text || !href) {
    return null;
  }

  const link = document.createElement('a');

  link.href = href;
  link.textContent = text;
  link.className = className;

  return link;
}

function appendModalCta(wrapper, data) {
  const cta = createButton(
    data.modalCtaText,
    data.modalCtaLink,
    'button primary modal-cta',
  );

  if (cta) {
    wrapper.append(cta);
  }
}

/* -----------------------------
   Shared Content
------------------------------ */

function appendTitleAndDescription(wrapper, data) {
  if (data.title) {
    const title = document.createElement('h2');

    title.classList.add('modal-title');
    title.textContent = data.title;

    wrapper.append(title);
  }

  if (data.description) {
    const description = document.createElement('div');

    description.classList.add('modal-description');
    description.innerHTML = data.description;

    wrapper.append(description);
  }
}

/* -----------------------------
   Fragment Modal
------------------------------ */

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
    nodes.push(
      createPlaceholder('Fragment content unavailable.'),
    );
  }

  const cta = createButton(
    data.modalCtaText,
    data.modalCtaLink,
    'button primary modal-cta',
  );

  if (cta) {
    nodes.push(cta);
  }

  return nodes;
}

/* -----------------------------
   Image Modal
------------------------------ */

function createImageModal(data) {
  const wrapper = document.createElement('div');

  wrapper.classList.add('modal-image-layout');

  appendTitleAndDescription(wrapper, data);

  if (data.image) {
    const media = data.image.cloneNode(true);

    const img = media.tagName === 'IMG'
      ? media
      : media.querySelector('img');

    if (img) {
      img.alt = data.imageAlt || img.alt || '';
    }

    wrapper.append(media);
  } else {
    wrapper.append(
      createPlaceholder('No image configured.'),
    );
  }

  appendModalCta(wrapper, data);

  return wrapper;
}

/* -----------------------------
   Video Modal
------------------------------ */

function createVideoModal(data) {
  const wrapper = document.createElement('div');

  wrapper.classList.add('modal-video-layout');

  appendTitleAndDescription(wrapper, data);

  const source = resolveVideoSource(data.videoUrl);

  if (!source) {
    wrapper.append(
      createPlaceholder('No video configured.'),
    );
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
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;

    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

    iframe.title = data.title || 'Video';

    wrapper.append(iframe);
  }

  appendModalCta(wrapper, data);

  return wrapper;
}

/* -----------------------------
   CTA Modal
------------------------------ */

function createCtaModal(data) {
  const wrapper = document.createElement('div');

  wrapper.classList.add('modal-cta-layout');

  appendTitleAndDescription(wrapper, data);

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

  if (primary) {
    actions.append(primary);
  }

  if (secondary) {
    actions.append(secondary);
  }

  if (actions.childElementCount) {
    wrapper.append(actions);
  }

  return wrapper;
}

/* -----------------------------
   Modal Shell
------------------------------ */

export async function createModal(content, options = {}) {
  await loadCSS(
    `${window.hlx.codeBasePath}/blocks/modal/modal.css`,
  );

  const dialog = document.createElement('dialog');

  dialog.classList.add(
    options.theme || 'light',
  );

  dialog.classList.add(
    options.variant || 'fragment',
  );

  const contentWrapper = document.createElement('div');

  contentWrapper.classList.add('modal-content');

  contentWrapper.append(...content);

  dialog.append(contentWrapper);

  const closeButton = document.createElement('button');

  closeButton.type = 'button';
  closeButton.classList.add('close-button');

  closeButton.setAttribute(
    'aria-label',
    'Close',
  );

  closeButton.innerHTML = '<span class="icon icon-close"></span>';

  closeButton.addEventListener('click', () => {
    dialog.close();
  });

  dialog.prepend(closeButton);

  const block = buildBlock('modal', '');

  document.querySelector('main').append(block);

  decorateBlock(block);
  await loadBlock(block);

  block.textContent = '';
  block.append(dialog);

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  return {
    block,
    showModal() {
      dialog.showModal();

      document.body.classList.add('modal-open');

      closeButton.focus();
    },
  };
}

/* -----------------------------
   Open Modal
------------------------------ */

export async function openModal(data) {
  let content;

  switch (data.modalType) {
    case 'image':
      content = [createImageModal(data)];
      break;

    case 'video':
      content = [createVideoModal(data)];
      break;

    case 'cta':
      content = [createCtaModal(data)];
      break;

    default:
      if (FRAGMENT_TYPES.includes(data.modalType)) {
        content = await createFragmentModal(data);
      } else {
        content = [
          createPlaceholder(
            'Modal configuration invalid.',
          ),
        ];
      }
  }

  const { showModal } = await createModal(
    content,
    {
      variant: data.modalType,
      theme: data.theme,
    },
  );

  showModal();
}

/* -----------------------------
   Decorate
------------------------------ */

export default function decorate(block) {
  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

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
