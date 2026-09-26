import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';

function createButton(text, href, className = 'button primary') {
  if (!text || !href) return null;

  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  link.className = className;

  return link;
}

function createImageModal(data) {
  const wrapper = document.createElement('div');

  const image = document.createElement('img');
  image.src = data.image;
  image.alt = data.imageAlt || '';

  wrapper.append(image);

  const cta = createButton(data.modalCtaText, data.modalCtaLink);

  if (cta) {
    wrapper.append(cta);
  }

  return wrapper;
}

function createVideoModal(data) {
  const wrapper = document.createElement('div');

  const iframe = document.createElement('iframe');
  iframe.src = data.videoUrl;
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';

  wrapper.append(iframe);

  const cta = createButton(data.modalCtaText, data.modalCtaLink);

  if (cta) {
    wrapper.append(cta);
  }

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

  wrapper.append(actions);

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

export async function openModal(data) {
  const {
    modalType,
  } = data;

  let content;

  if (
    modalType === 'fragment'
    || modalType === 'large'
    || modalType === 'fullscreen'
  ) {
    const path = data.fragmentLink.startsWith('http')
      ? new URL(
        data.fragmentLink,
        window.location,
      ).pathname
      : data.fragmentLink;

    const fragment = await loadFragment(path);

    content = [...fragment.childNodes];
  }

  if (modalType === 'image') {
    content = [
      createImageModal(data),
    ];
  }

  if (modalType === 'video') {
    content = [
      createVideoModal(data),
    ];
  }

  if (modalType === 'cta') {
    content = [
      createCtaModal(data),
    ];
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

  const data = {
    modalType:
      rows[0]?.textContent?.trim() || 'fragment',
    theme:
      rows[1]?.textContent?.trim() || 'light',
    buttonText:
      rows[2]?.textContent?.trim(),
    buttonColor:
      rows[3]?.textContent?.trim(),
    fragmentLink:
      rows[4]?.querySelector('a')?.href || '',
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
