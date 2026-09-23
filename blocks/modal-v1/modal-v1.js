import { createOptimizedPicture } from '../../scripts/aem.js';

const SUPPORTED_LAYOUTS = [
  'default',
  'side',
  'full-screen',
  'bottom-sheet',
];

const SUPPORTED_SIZES = [
  'small',
  'medium',
  'large',
];

const SUPPORTED_MEDIA_TYPES = [
  'none',
  'image',
  'video',
];

const SUPPORTED_ALIGNMENTS = [
  'left',
  'center',
  'right',
];

const SUPPORTED_BACKDROPS = [
  'default',
  'dark',
  'light',
];

const SUPPORTED_RADIUS = [
  'small',
  'medium',
  'large',
];

const SUPPORTED_BUTTON_STYLES = [
  'solid',
  'outline',
  'text',
];

const SUPPORTED_BUTTON_COLORS = [
  'primary',
  'secondary',
  'accent',
  'dark',
  'light',
];

let modalId = 0;

function asText(value) {
  return value?.textContent?.trim() || '';
}

function getCellValue(cell) {
  return cell?.firstElementChild || cell;
}

function normalize(value, supported, fallback) {
  const normalized = String(value || '').trim().toLowerCase();

  return supported.includes(normalized)
    ? normalized
    : fallback;
}

function getImageSource(element) {
  const image = element?.querySelector('img');

  return image?.src || '';
}

function normalizeBlock(block) {
  const data = {
    layout: 'default',
    size: 'medium',
    mediaType: 'none',
    image: '',
    imageAlt: '',
    video: '',
    poster: '',
    eyebrow: '',
    title: '',
    content: '',
    supportingText: '',
    primaryCtaText: '',
    primaryCta: '',
    secondaryCtaText: '',
    secondaryCta: '',
    primaryButtonStyle: 'solid',
    secondaryButtonStyle: 'outline',
    primaryButtonColor: 'primary',
    secondaryButtonColor: 'secondary',
    alignment: 'left',
    backdrop: 'dark',
    borderRadius: 'medium',
    closeLabel: 'Close',
    triggerText: 'Open Modal',
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children || []];

    if (cells.length < 2) {
      return;
    }

    const key = asText(cells[0]).toLowerCase();
    const value = getCellValue(cells[1]);

    switch (key) {
      case 'layout':
        data.layout = normalize(
          asText(value),
          SUPPORTED_LAYOUTS,
          'default',
        );
        break;

      case 'size':
        data.size = normalize(
          asText(value),
          SUPPORTED_SIZES,
          'medium',
        );
        break;

      case 'mediatype':
      case 'media type':
        data.mediaType = normalize(
          asText(value),
          SUPPORTED_MEDIA_TYPES,
          'none',
        );
        break;

      case 'image':
        data.image = getImageSource(value);
        break;

      case 'imagealt':
      case 'image description':
        data.imageAlt = asText(value);
        break;

      case 'video':
      case 'video url':
        data.video = asText(value);
        break;

      case 'poster':
      case 'video poster':
        data.poster = getImageSource(value) || asText(value);
        break;

      case 'eyebrow':
        data.eyebrow = asText(value);
        break;

      case 'title':
      case 'heading':
        data.title = value?.innerHTML?.trim() || '';
        break;

      case 'content':
        data.content = value?.innerHTML?.trim() || '';
        break;

      case 'supportingtext':
      case 'supporting text':
        data.supportingText = value?.innerHTML?.trim() || '';
        break;

      case 'primaryctatext':
      case 'primary cta text':
        data.primaryCtaText = asText(value);
        break;

      case 'primarycta':
      case 'primary cta link':
        data.primaryCta = value?.querySelector('a')?.href || asText(value);
        break;

      case 'secondaryctatext':
      case 'secondary cta text':
        data.secondaryCtaText = asText(value);
        break;

      case 'secondarycta':
      case 'secondary cta link':
        data.secondaryCta = value?.querySelector('a')?.href || asText(value);
        break;

      case 'primarybuttonstyle':
      case 'primary button style':
        data.primaryButtonStyle = normalize(
          asText(value),
          SUPPORTED_BUTTON_STYLES,
          'solid',
        );
        break;

      case 'secondarybuttonstyle':
      case 'secondary button style':
        data.secondaryButtonStyle = normalize(
          asText(value),
          SUPPORTED_BUTTON_STYLES,
          'outline',
        );
        break;

      case 'primarybuttoncolor':
      case 'primary button color':
        data.primaryButtonColor = normalize(
          asText(value),
          SUPPORTED_BUTTON_COLORS,
          'primary',
        );
        break;

      case 'secondarybuttoncolor':
      case 'secondary button color':
        data.secondaryButtonColor = normalize(
          asText(value),
          SUPPORTED_BUTTON_COLORS,
          'secondary',
        );
        break;

      case 'alignment':
      case 'content alignment':
        data.alignment = normalize(
          asText(value),
          SUPPORTED_ALIGNMENTS,
          'left',
        );
        break;

      case 'backdrop':
        data.backdrop = normalize(
          asText(value),
          SUPPORTED_BACKDROPS,
          'dark',
        );
        break;

      case 'borderradius':
      case 'border radius':
        data.borderRadius = normalize(
          asText(value),
          SUPPORTED_RADIUS,
          'medium',
        );
        break;

      case 'closelabel':
      case 'close button label':
        data.closeLabel = asText(value) || 'Close';
        break;

      case 'triggertext':
      case 'trigger text':
        data.triggerText = asText(value) || 'Open Modal';
        break;

      default:
        break;
    }
  });

  return data;
}

function createElement(tagName, className, content = '') {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (content) {
    element.innerHTML = content;
  }

  return element;
}

function createImage(src, alt) {
  if (!src) {
    return null;
  }

  const picture = createOptimizedPicture(
    src,
    alt || '',
    false,
    [{ width: '1360' }],
  );

  picture.className = 'modal-v1-image';

  return picture;
}

function createVideo(src, poster) {
  if (!src) {
    return null;
  }

  const video = document.createElement('video');

  video.className = 'modal-v1-video';
  video.controls = true;
  video.preload = 'metadata';

  if (poster) {
    video.poster = poster;
  }

  const source = document.createElement('source');

  source.src = src;

  video.append(source);

  return video;
}

function createMedia(data) {
  if (data.mediaType === 'image' && data.image) {
    const media = document.createElement('div');

    media.className = 'modal-v1-media';

    const image = createImage(
      data.image,
      data.imageAlt,
    );

    if (image) {
      media.append(image);
      return media;
    }
  }

  if (data.mediaType === 'video' && data.video) {
    const media = document.createElement('div');

    media.className = 'modal-v1-media';

    const video = createVideo(
      data.video,
      data.poster,
    );

    if (video) {
      media.append(video);
      return media;
    }
  }

  return null;
}

function createAction(
  text,
  href,
  style,
  color,
  type,
) {
  if (!text) {
    return null;
  }

  const link = document.createElement('a');

  link.className = [
    'modal-v1-button',
    `modal-v1-button-${style}`,
    `modal-v1-button-${color}`,
    `modal-v1-button-${type}`,
  ].join(' ');

  link.textContent = text;

  if (href) {
    link.href = href;
  }

  return link;
}

function createActions(data) {
  const actions = document.createElement('div');

  actions.className = 'modal-v1-actions';

  const primary = createAction(
    data.primaryCtaText,
    data.primaryCta,
    data.primaryButtonStyle,
    data.primaryButtonColor,
    'primary',
  );

  const secondary = createAction(
    data.secondaryCtaText,
    data.secondaryCta,
    data.secondaryButtonStyle,
    data.secondaryButtonColor,
    'secondary',
  );

  if (primary) {
    actions.append(primary);
  }

  if (secondary) {
    actions.append(secondary);
  }

  return actions.childElementCount
    ? actions
    : null;
}

function createModal(data) {
  modalId += 1;

  const titleId = `modal-v1-title-${modalId}`;

  const overlay = document.createElement('div');

  overlay.className = [
    'modal-v1-overlay',
    `modal-v1-backdrop-${data.backdrop}`,
  ].join(' ');

  overlay.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');

  dialog.className = [
    'modal-v1-dialog',
    `modal-v1-layout-${data.layout}`,
    `modal-v1-size-${data.size}`,
    `modal-v1-align-${data.alignment}`,
    `modal-v1-radius-${data.borderRadius}`,
  ].join(' ');

  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  if (data.title) {
    dialog.setAttribute(
      'aria-labelledby',
      titleId,
    );
  }

  const closeButton = document.createElement('button');

  closeButton.className = 'modal-v1-close';
  closeButton.type = 'button';
  closeButton.setAttribute(
    'aria-label',
    data.closeLabel,
  );
  closeButton.innerHTML = '&times;';

  dialog.append(closeButton);

  const media = createMedia(data);

  if (media) {
    dialog.append(media);
  }

  const content = document.createElement('div');

  content.className = 'modal-v1-content';

  if (data.eyebrow) {
    const eyebrow = document.createElement('div');

    eyebrow.className = 'modal-v1-eyebrow';
    eyebrow.textContent = data.eyebrow.toUpperCase();

    content.append(eyebrow);
  }

  if (data.title) {
    const title = createElement(
      'h2',
      'modal-v1-title',
      data.title,
    );

    title.id = titleId;

    content.append(title);
  }

  if (data.content) {
    const body = createElement(
      'div',
      'modal-v1-body',
      data.content,
    );

    content.append(body);
  }

  if (data.supportingText) {
    const supportingText = createElement(
      'div',
      'modal-v1-supporting-text',
      data.supportingText,
    );

    content.append(supportingText);
  }

  const actions = createActions(data);

  if (actions) {
    content.append(actions);
  }

  dialog.append(content);
  overlay.append(dialog);

  return {
    overlay,
    dialog,
    closeButton,
  };
}

function setupModal(
  overlay,
  dialog,
  closeButton,
  trigger,
) {
  let previousFocus;

  const getFocusableElements = () => [
    ...dialog.querySelectorAll(
      'a[href], button:not([disabled]), '
      + 'input:not([disabled]), textarea:not([disabled]), '
      + 'select:not([disabled]), '
      + '[tabindex]:not([tabindex="-1"])',
    ),
  ];

  const closeModal = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-v1-open');

    if (
      previousFocus
      && typeof previousFocus.focus === 'function'
    ) {
      previousFocus.focus();
    }
  };

  const openModal = () => {
    previousFocus = document.activeElement;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-v1-open');

    closeButton.focus();
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  closeButton.addEventListener(
    'click',
    closeModal,
  );

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();

    if (!focusableElements.length) {
      event.preventDefault();
      closeButton.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[
      focusableElements.length - 1
    ];

    if (
      event.shiftKey
      && document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey
      && document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  });

  return {
    openModal,
    closeModal,
  };
}

export function generateModalDOM(data) {
  const {
    overlay,
    dialog,
    closeButton,
  } = createModal(data);

  const trigger = document.createElement('button');

  trigger.className = 'modal-v1-trigger';
  trigger.type = 'button';
  trigger.textContent = data.triggerText;

  setupModal(
    overlay,
    dialog,
    closeButton,
    trigger,
  );

  const fragment = document.createDocumentFragment();

  fragment.append(trigger);
  fragment.append(overlay);

  return fragment;
}

export default function decorate(block) {
  const data = normalizeBlock(block);

  if (
    !data.title
    && !data.content
    && !data.image
    && !data.video
    && !data.eyebrow
    && !data.primaryCtaText
    && !data.secondaryCtaText
  ) {
    block.remove();
    return;
  }

  block.textContent = '';

  block.append(
    generateModalDOM(data),
  );
}
