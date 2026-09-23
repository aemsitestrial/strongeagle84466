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

function normalize(value, supported, fallback) {
  const normalized = String(value || '').trim().toLowerCase();

  return supported.includes(normalized)
    ? normalized
    : fallback;
}

function getImageSource(value) {
  const image = value?.querySelector('img');

  return image?.src || '';
}

function getLink(value) {
  const link = value?.querySelector('a');

  return link?.href || asText(value);
}

function normalizeBlock(block) {
  /*
   * Follow the same positional structure as Teaser.
   *
   * Each authoring field is one row with one cell.
   */
  const props = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const [
    layout,
    size,
    mediaType,
    image,
    imageAlt,
    video,
    poster,
    eyebrow,
    title,
    content,
    supportingText,
    primaryCtaText,
    primaryCta,
    secondaryCtaText,
    secondaryCta,
    primaryButtonStyle,
    secondaryButtonStyle,
    primaryButtonColor,
    secondaryButtonColor,
    alignment,
    backdrop,
    borderRadius,
    closeLabel,
    triggerText,
  ] = props;

  return {
    layout: normalize(
      asText(layout),
      SUPPORTED_LAYOUTS,
      'default',
    ),

    size: normalize(
      asText(size),
      SUPPORTED_SIZES,
      'medium',
    ),

    mediaType: normalize(
      asText(mediaType),
      SUPPORTED_MEDIA_TYPES,
      'none',
    ),

    image: getImageSource(image),

    imageAlt: asText(imageAlt),

    video: asText(video),

    poster: getImageSource(poster) || asText(poster),

    eyebrow: asText(eyebrow),

    title: title?.innerHTML?.trim() || '',

    content: content?.innerHTML?.trim() || '',

    supportingText:
      supportingText?.innerHTML?.trim() || '',

    primaryCtaText: asText(primaryCtaText),

    primaryCta: getLink(primaryCta),

    secondaryCtaText: asText(secondaryCtaText),

    secondaryCta: getLink(secondaryCta),

    primaryButtonStyle: normalize(
      asText(primaryButtonStyle),
      SUPPORTED_BUTTON_STYLES,
      'solid',
    ),

    secondaryButtonStyle: normalize(
      asText(secondaryButtonStyle),
      SUPPORTED_BUTTON_STYLES,
      'outline',
    ),

    primaryButtonColor: normalize(
      asText(primaryButtonColor),
      SUPPORTED_BUTTON_COLORS,
      'primary',
    ),

    secondaryButtonColor: normalize(
      asText(secondaryButtonColor),
      SUPPORTED_BUTTON_COLORS,
      'secondary',
    ),

    alignment: normalize(
      asText(alignment),
      SUPPORTED_ALIGNMENTS,
      'left',
    ),

    backdrop: normalize(
      asText(backdrop),
      SUPPORTED_BACKDROPS,
      'dark',
    ),

    borderRadius: normalize(
      asText(borderRadius),
      SUPPORTED_RADIUS,
      'medium',
    ),

    closeLabel: asText(closeLabel) || 'Close',

    triggerText: asText(triggerText) || 'Open Modal',
  };
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
  /*
   * Media Type is the source of truth.
   *
   * Image → only image
   * Video → only video
   * None  → nothing
   */

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

  return actions.childElementCount > 0
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

  overlay.setAttribute(
    'aria-hidden',
    'true',
  );

  const dialog = document.createElement('div');

  dialog.className = [
    'modal-v1-dialog',
    `modal-v1-layout-${data.layout}`,
    `modal-v1-size-${data.size}`,
    `modal-v1-align-${data.alignment}`,
    `modal-v1-radius-${data.borderRadius}`,
  ].join(' ');

  dialog.setAttribute(
    'role',
    'dialog',
  );

  dialog.setAttribute(
    'aria-modal',
    'true',
  );

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
    const supporting = createElement(
      'div',
      'modal-v1-supporting-text',
      data.supportingText,
    );

    content.append(supporting);
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
      + 'input:not([disabled]), '
      + 'textarea:not([disabled]), '
      + 'select:not([disabled]), '
      + '[tabindex]:not([tabindex="-1"])',
    ),
  ];

  const closeModal = () => {
    overlay.classList.remove(
      'is-open',
    );

    overlay.setAttribute(
      'aria-hidden',
      'true',
    );

    document.body.classList.remove(
      'modal-v1-open',
    );

    if (
      previousFocus
      && typeof previousFocus.focus === 'function'
    ) {
      previousFocus.focus();
    }
  };

  const openModal = () => {
    previousFocus = document.activeElement;

    overlay.classList.add(
      'is-open',
    );

    overlay.setAttribute(
      'aria-hidden',
      'false',
    );

    document.body.classList.add(
      'modal-v1-open',
    );

    closeButton.focus();
  };

  trigger.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      openModal();
    },
  );

  closeButton.addEventListener(
    'click',
    closeModal,
  );

  overlay.addEventListener(
    'click',
    (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (
        !overlay.classList.contains(
          'is-open',
        )
      ) {
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
    },
  );
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

  /*
   * Keep the original EDS block and
   * replace only its authored content.
   */
  block.textContent = '';

  const modalDOM = generateModalDOM(data);

  block.append(modalDOM);
}
