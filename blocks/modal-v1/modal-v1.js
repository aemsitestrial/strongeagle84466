import { createOptimizedPicture } from '../../scripts/aem.js';

const CLASS_PREFIX = 'modal-v1';

function getText(row) {
  return row?.textContent?.trim() || '';
}

function getHTML(row) {
  return row?.innerHTML?.trim() || '';
}

function getLink(row) {
  return row?.querySelector('a[href]')?.getAttribute('href') || '';
}

function getLinkText(row) {
  const link = row?.querySelector('a[href]');
  return link?.textContent?.trim() || getText(row);
}

function getImageSource(row) {
  const image = row?.querySelector('img[src]');
  return image?.getAttribute('src') || '';
}

function createButton(text, href, style, color, type) {
  if (!text) {
    return null;
  }

  const button = document.createElement(href ? 'a' : 'button');

  button.className = [
    `${CLASS_PREFIX}-button`,
    `${CLASS_PREFIX}-button-${style || 'solid'}`,
    `${CLASS_PREFIX}-button-${color || 'primary'}`,
    `${CLASS_PREFIX}-button-${type}`,
  ].join(' ');

  button.textContent = text;

  if (href) {
    button.href = href;

    if (/^https?:\/\//i.test(href)) {
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
    }
  } else {
    button.type = 'button';
  }

  return button;
}

function getVariantClasses(data) {
  return [
    `${CLASS_PREFIX}-layout-${data.layout || 'default'}`,
    `${CLASS_PREFIX}-size-${data.size || 'medium'}`,
    `${CLASS_PREFIX}-align-${data.alignment || 'left'}`,
    `${CLASS_PREFIX}-backdrop-${data.backdrop || 'dark'}`,
    `${CLASS_PREFIX}-radius-${data.borderRadius || 'medium'}`,
  ];
}

function createImage(src, alt) {
  if (!src) {
    return null;
  }

  const picture = createOptimizedPicture(src, alt || '', false, [
    {
      media: '(min-width: 1200px)',
      width: '1200',
    },
    {
      media: '(min-width: 768px)',
      width: '900',
    },
    {
      width: '600',
    },
  ]);

  picture.classList.add(`${CLASS_PREFIX}-media-image`);

  return picture;
}

function createVideo(src, poster) {
  if (!src) {
    return null;
  }

  const wrapper = document.createElement('div');

  wrapper.className = `${CLASS_PREFIX}-video-wrapper`;

  const iframe = document.createElement('iframe');

  iframe.className = `${CLASS_PREFIX}-video`;
  iframe.src = src;
  iframe.title = 'Modal video';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;

  if (poster) {
    iframe.dataset.poster = poster;
  }

  wrapper.append(iframe);

  return wrapper;
}

function createCloseButton(label) {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = `${CLASS_PREFIX}-close`;
  button.setAttribute('aria-label', label || 'Close');
  button.innerHTML = '<span aria-hidden="true">&times;</span>';

  return button;
}

function createModalDOM(data, block) {
  const overlay = document.createElement('div');

  overlay.className = [
    `${CLASS_PREFIX}-overlay`,
    ...getVariantClasses(data),
  ].join(' ');

  overlay.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');

  dialog.className = [
    `${CLASS_PREFIX}-dialog`,
    ...getVariantClasses(data),
  ].join(' ');

  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const closeButton = createCloseButton(data.closeLabel || 'Close');

  const body = document.createElement('div');

  body.className = `${CLASS_PREFIX}-body`;

  const media = document.createElement('div');

  media.className = `${CLASS_PREFIX}-media`;

  /*
   * Media is rendered only according to mediaType.
   *
   * Image + mediaType=image  -> image renders
   * Video + mediaType=video  -> video renders
   * Anything else             -> no media
   */
  if (data.mediaType === 'image' && data.image) {
    const image = createImage(data.image, data.imageAlt);

    if (image) {
      media.append(image);
    }
  }

  if (data.mediaType === 'video' && data.video) {
    const video = createVideo(data.video, data.poster);

    if (video) {
      media.append(video);
    }
  }

  if (media.children.length) {
    dialog.append(media);
  }

  if (data.eyebrow) {
    const eyebrow = document.createElement('div');

    eyebrow.className = `${CLASS_PREFIX}-eyebrow`;
    eyebrow.textContent = data.eyebrow;

    body.append(eyebrow);
  }

  if (data.title) {
    const title = document.createElement('h2');

    title.className = `${CLASS_PREFIX}-title`;
    title.textContent = data.title;

    const titleId = `${CLASS_PREFIX}-title-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    title.id = titleId;
    dialog.setAttribute('aria-labelledby', titleId);

    body.append(title);
  }

  if (data.content) {
    const content = document.createElement('div');

    content.className = `${CLASS_PREFIX}-content`;
    content.innerHTML = data.content;

    body.append(content);
  }

  if (data.supportingText) {
    const supportingText = document.createElement('div');

    supportingText.className = `${CLASS_PREFIX}-supporting-text`;
    supportingText.innerHTML = data.supportingText;

    body.append(supportingText);
  }

  const actions = document.createElement('div');

  actions.className = `${CLASS_PREFIX}-actions`;

  const primaryButton = createButton(
    data.primaryCtaText,
    data.primaryCta,
    data.primaryButtonStyle,
    data.primaryButtonColor,
    'primary',
  );

  const secondaryButton = createButton(
    data.secondaryCtaText,
    data.secondaryCta,
    data.secondaryButtonStyle,
    data.secondaryButtonColor,
    'secondary',
  );

  if (primaryButton) {
    actions.append(primaryButton);
  }

  if (secondaryButton) {
    actions.append(secondaryButton);
  }

  if (actions.children.length) {
    body.append(actions);
  }

  dialog.append(body);
  dialog.prepend(closeButton);
  overlay.append(dialog);
  block.append(overlay);

  return {
    overlay,
    dialog,
    closeButton,
  };
}

function setupModal(block, modalDOM, trigger) {
  const {
    overlay,
    dialog,
    closeButton,
  } = modalDOM;

  let previousFocusedElement = null;

  const closeModal = () => {
    overlay.classList.remove(`${CLASS_PREFIX}-is-open`);
    overlay.setAttribute('aria-hidden', 'true');
    block.classList.remove(`${CLASS_PREFIX}-is-active`);

    if (previousFocusedElement instanceof HTMLElement) {
      previousFocusedElement.focus();
    } else {
      trigger.focus();
    }
  };

  const openModal = () => {
    previousFocusedElement = document.activeElement;

    overlay.classList.add(`${CLASS_PREFIX}-is-open`);
    overlay.setAttribute('aria-hidden', 'false');
    block.classList.add(`${CLASS_PREFIX}-is-active`);

    requestAnimationFrame(() => {
      closeButton.focus();
    });
  };

  trigger.addEventListener('click', openModal);

  closeButton.addEventListener('click', closeModal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  dialog.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains(`${CLASS_PREFIX}-is-open`)) {
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

    const focusableElements = dialog.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
}

export default function decorate(block) {
  const rows = [...block.children];

  const data = {
    layout: getText(rows[0]),
    size: getText(rows[1]),
    mediaType: getText(rows[2]),
    image: getImageSource(rows[3]),
    imageAlt: getText(rows[4]),
    video: getText(rows[5]),
    poster: getImageSource(rows[6]),
    eyebrow: getText(rows[7]),
    title: getText(rows[8]),
    content: getHTML(rows[9]),
    supportingText: getHTML(rows[10]),
    primaryCtaText: getLinkText(rows[11]),
    primaryCta: getLink(rows[11]),
    secondaryCtaText: getLinkText(rows[12]),
    secondaryCta: getLink(rows[12]),
    primaryButtonStyle: getText(rows[13]),
    secondaryButtonStyle: getText(rows[14]),
    primaryButtonColor: getText(rows[15]),
    secondaryButtonColor: getText(rows[16]),
    alignment: getText(rows[17]),
    backdrop: getText(rows[18]),
    borderRadius: getText(rows[19]),
    closeLabel: getText(rows[20]),
    triggerText: getText(rows[21]),
  };

  block.innerHTML = '';

  const trigger = document.createElement('button');

  trigger.type = 'button';
  trigger.className = `${CLASS_PREFIX}-trigger`;
  trigger.textContent = data.triggerText || 'Open Modal';

  block.append(trigger);

  const modalDOM = createModalDOM(data, block);

  setupModal(block, modalDOM, trigger);
}
