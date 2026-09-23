/* eslint-disable */

function getValue(field) {
  if (!field) return '';

  const input = field.querySelector('input, textarea, select');

  if (input && input.value) {
    return input.value.trim();
  }

  const link = field.querySelector('a[href]');

  if (link) {
    return link.href;
  }

  return field.textContent.trim();
}

function getLink(field) {
  if (!field) return '';

  const link = field.querySelector('a[href]');

  if (link) {
    return link.href;
  }

  const input = field.querySelector('input');

  if (input && input.value) {
    return input.value.trim();
  }

  return field.textContent.trim();
}

function normalize(value, fallback) {
  if (!value) return fallback;

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getFields(block) {
  return [...block.children].map((row) => {
    return row.firstElementChild || row;
  });
}

function createVideo(url, poster) {
  if (!url) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'modal-v1-media';

  if (
    url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ||
    url.includes('/content/dam/')
  ) {
    const video = document.createElement('video');

    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';

    if (poster) {
      video.poster = poster;
    }

    const source = document.createElement('source');
    source.src = url;

    video.append(source);
    wrapper.append(video);

    return wrapper;
  }

  let embedUrl = url;

  // YouTube
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');

      if (id) {
        embedUrl = `https://www.youtube.com/embed/${id}`;
      }
    }

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.substring(1);

      if (id) {
        embedUrl = `https://www.youtube.com/embed/${id}`;
      }
    }

    // Vimeo
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();

      if (id) {
        embedUrl = `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch (error) {
    // Keep original URL.
  }

  const iframe = document.createElement('iframe');

  iframe.src = embedUrl;
  iframe.title = 'Modal video';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';

  wrapper.append(iframe);

  return wrapper;
}

function createImage(url, alt) {
  if (!url) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'modal-v1-media';

  const img = document.createElement('img');

  img.src = url;
  img.alt = alt || '';
  img.loading = 'lazy';

  wrapper.append(img);

  return wrapper;
}

function createButton(text, link, style, color) {
  if (!text) return null;

  const button = link
    ? document.createElement('a')
    : document.createElement('button');

  if (link) {
    button.href = link;
  } else {
    button.type = 'button';
  }

  button.className = [
    'modal-v1-button',
    `modal-v1-button-style-${normalize(style, 'solid')}`,
    `modal-v1-button-color-${normalize(color, 'primary')}`,
  ].join(' ');

  button.textContent = text;

  return button;
}

function buildModal(data) {
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
    `modal-v1-radius-${data.radius}`,
  ].join(' ');

  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const close = document.createElement('button');

  close.type = 'button';
  close.className = 'modal-v1-close';
  close.setAttribute('aria-label', data.closeLabel);
  close.textContent = '×';

  /* MEDIA */

  let media = null;

  if (data.mediaType === 'image') {
    media = createImage(data.image, data.imageAlt);
  }

  if (data.mediaType === 'video') {
    media = createVideo(data.videoUrl, data.videoPoster);
  }

  if (media) {
    dialog.append(media);
  }

  /* CONTENT */

  const body = document.createElement('div');
  body.className = 'modal-v1-body';

  if (data.eyebrow) {
    const eyebrow = document.createElement('div');

    eyebrow.className = 'modal-v1-eyebrow';
    eyebrow.textContent = data.eyebrow;

    body.append(eyebrow);
  }

  if (data.heading) {
    const heading = document.createElement('h2');

    heading.className = 'modal-v1-heading';
    heading.textContent = data.heading;

    body.append(heading);
  }

  if (data.content) {
    const content = document.createElement('div');

    content.className = 'modal-v1-main-content';
    content.innerHTML = data.contentHTML;

    body.append(content);
  }

  if (data.supportingText) {
    const supporting = document.createElement('div');

    supporting.className = 'modal-v1-supporting-text';
    supporting.innerHTML = data.supportingTextHTML;

    body.append(supporting);
  }

  /* FOOTER */

  const footer = document.createElement('div');

  footer.className = 'modal-v1-footer';

  const primary = createButton(
    data.primaryText,
    data.primaryLink,
    data.primaryStyle,
    data.primaryColor,
  );

  const secondary = createButton(
    data.secondaryText,
    data.secondaryLink,
    data.secondaryStyle,
    data.secondaryColor,
  );

  if (primary) {
    footer.append(primary);
  }

  if (secondary) {
    footer.append(secondary);
  }

  if (footer.children.length) {
    body.append(footer);
  }

  dialog.append(close);
  dialog.append(body);
  overlay.append(dialog);

  return {
    overlay,
    close,
  };
}

export default function decorate(block) {
  /*
   * IMPORTANT:
   * Read the authored fields before replacing block contents.
   */

  const fields = getFields(block);

  const [
    layoutField,
    sizeField,
    mediaTypeField,
    imageField,
    imageAltField,
    videoUrlField,
    videoPosterField,
    eyebrowField,
    headingField,
    contentField,
    supportingTextField,
    primaryTextField,
    primaryLinkField,
    secondaryTextField,
    secondaryLinkField,
    primaryStyleField,
    secondaryStyleField,
    primaryColorField,
    secondaryColorField,
    alignmentField,
    backdropField,
    radiusField,
    closeLabelField,
    triggerTextField,
  ] = fields;

  const data = {
    layout: normalize(getValue(layoutField), 'default'),
    size: normalize(getValue(sizeField), 'medium'),
    mediaType: normalize(getValue(mediaTypeField), 'none'),

    image:
      imageField?.querySelector('img')?.currentSrc ||
      imageField?.querySelector('img')?.src ||
      getValue(imageField),

    imageAlt: getValue(imageAltField),

    videoUrl: getLink(videoUrlField),

    videoPoster:
      videoPosterField?.querySelector('img')?.currentSrc ||
      videoPosterField?.querySelector('img')?.src ||
      getValue(videoPosterField),

    eyebrow: getValue(eyebrowField),

    heading: getValue(headingField),

    content: getValue(contentField),
    contentHTML: contentField?.innerHTML || '',

    supportingText: getValue(supportingTextField),
    supportingTextHTML: supportingTextField?.innerHTML || '',

    primaryText: getValue(primaryTextField),
    primaryLink: getLink(primaryLinkField),

    secondaryText: getValue(secondaryTextField),
    secondaryLink: getLink(secondaryLinkField),

    primaryStyle: normalize(getValue(primaryStyleField), 'solid'),
    secondaryStyle: normalize(getValue(secondaryStyleField), 'outline'),

    primaryColor: normalize(getValue(primaryColorField), 'primary'),
    secondaryColor: normalize(getValue(secondaryColorField), 'secondary'),

    alignment: normalize(getValue(alignmentField), 'left'),
    backdrop: normalize(getValue(backdropField), 'default'),
    radius: normalize(getValue(radiusField), 'medium'),

    closeLabel: getValue(closeLabelField) || 'Close',
    triggerText: getValue(triggerTextField) || 'Open Modal',
  };

  /*
   * Make sure unsupported layout values don't break the modal.
   */

  const validLayouts = [
    'default',
    'side-panel',
    'full-screen',
    'bottom-sheet',
  ];

  if (!validLayouts.includes(data.layout)) {
    data.layout = 'default';
  }

  const validSizes = ['small', 'medium', 'large'];

  if (!validSizes.includes(data.size)) {
    data.size = 'medium';
  }

  const validMedia = ['none', 'image', 'video'];

  if (!validMedia.includes(data.mediaType)) {
    data.mediaType = 'none';
  }

  const validAlignment = ['left', 'center', 'right'];

  if (!validAlignment.includes(data.alignment)) {
    data.alignment = 'left';
  }

  const validBackdrop = ['default', 'dark', 'light'];

  if (!validBackdrop.includes(data.backdrop)) {
    data.backdrop = 'default';
  }

  const validRadius = ['none', 'small', 'medium', 'large'];

  if (!validRadius.includes(data.radius)) {
    data.radius = 'medium';
  }

  /*
   * Create trigger.
   */

  const trigger = document.createElement('button');

  trigger.type = 'button';
  trigger.className = 'modal-v1-trigger';
  trigger.textContent = data.triggerText;

  /*
   * Build modal BEFORE clearing block.
   */

  const modal = buildModal(data);

  const { overlay, close } = modal;

  /*
   * Clear the original authored block content.
   */

  block.textContent = '';

  block.append(trigger);
  block.append(overlay);

  /*
   * OPEN
   */

  function openModal() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    document.body.classList.add('modal-v1-no-scroll');

    requestAnimationFrame(() => {
      close.focus();
    });
  }

  /*
   * CLOSE
   */

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');

    document.body.classList.remove('modal-v1-no-scroll');

    const video = overlay.querySelector('video');

    if (video) {
      video.pause();
    }
  }

  /*
   * Trigger
   */

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    openModal();
  });

  /*
   * Close button
   */

  close.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    closeModal();
  });

  /*
   * Click backdrop.
   */

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  /*
   * Escape key.
   */

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}
