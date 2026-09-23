/* eslint-disable */

function getFieldText(field) {
  if (!field) return '';

  // Prefer explicitly stored values if available.
  const dataValue = field.getAttribute?.('data-value');
  if (dataValue) return dataValue.trim();

  const value = field.getAttribute?.('value');
  if (value) return value.trim();

  const input = field.querySelector?.('input, textarea');
  if (input?.value) return input.value.trim();

  const select = field.querySelector?.('select');
  if (select?.value) return select.value.trim();

  return (field.textContent || '').trim();
}

function getFieldLink(field) {
  if (!field) return '';

  const anchor = field.querySelector?.('a[href]');
  if (anchor?.href) return anchor.href;

  const input = field.querySelector?.('input');
  if (input?.value) return input.value.trim();

  const value = field.getAttribute?.('value');
  if (value) return value.trim();

  return getFieldText(field);
}

function normalizeValue(value, fallback = '') {
  if (!value) return fallback;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  return normalized || fallback;
}

function normalizeLayout(value) {
  const normalized = normalizeValue(value, 'default');

  const map = {
    default: 'default',
    'side-panel': 'side-panel',
    side: 'side-panel',
    'full-screen': 'full-screen',
    fullscreen: 'full-screen',
    'bottom-sheet': 'bottom-sheet',
    bottom: 'bottom-sheet',
  };

  return map[normalized] || 'default';
}

function normalizeSize(value) {
  const normalized = normalizeValue(value, 'medium');

  return ['small', 'medium', 'large'].includes(normalized)
    ? normalized
    : 'medium';
}

function normalizeMediaType(value) {
  const normalized = normalizeValue(value, 'none');

  return ['none', 'image', 'video'].includes(normalized)
    ? normalized
    : 'none';
}

function normalizeButtonStyle(value) {
  const normalized = normalizeValue(value, 'solid');

  const map = {
    solid: 'solid',
    outline: 'outline',
    text: 'text',
    primary: 'solid',
    secondary: 'outline',
  };

  return map[normalized] || 'solid';
}

function normalizeButtonColor(value) {
  const normalized = normalizeValue(value, 'primary');

  const map = {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    dark: 'dark',
    light: 'light',
  };

  return map[normalized] || 'primary';
}

function normalizeAlignment(value) {
  const normalized = normalizeValue(value, 'left');

  return ['left', 'center', 'right'].includes(normalized)
    ? normalized
    : 'left';
}

function normalizeBackdrop(value) {
  const normalized = normalizeValue(value, 'default');

  return ['default', 'dark', 'light'].includes(normalized)
    ? normalized
    : 'default';
}

function normalizeRadius(value) {
  const normalized = normalizeValue(value, 'medium');

  const map = {
    none: 'none',
    small: 'small',
    medium: 'medium',
    large: 'large',
    rounded: 'medium',
  };

  return map[normalized] || 'medium';
}

function getImageSource(field) {
  if (!field) return '';

  const image = field.querySelector('img');

  if (image?.currentSrc) return image.currentSrc;
  if (image?.src) return image.src;

  const picture = field.querySelector('picture source[srcset]');
  if (picture?.srcset) {
    return picture.srcset.split(',')[0].trim().split(' ')[0];
  }

  const anchor = field.querySelector('a[href]');
  if (anchor?.href) return anchor.href;

  return getFieldText(field);
}

function getVideoUrl(field) {
  if (!field) return '';

  const anchor = field.querySelector('a[href]');
  if (anchor?.href) return anchor.href;

  const input = field.querySelector('input');
  if (input?.value) return input.value.trim();

  return getFieldText(field);
}

function createYouTubeEmbed(url) {
  try {
    const parsed = new URL(url);

    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace('/', '');
    } else if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v') || '';

      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1];
      }
    }

    if (!videoId) return '';

    return `https://www.youtube.com/embed/${videoId}`;
  } catch (error) {
    return '';
  }
}

function createVimeoEmbed(url) {
  try {
    const parsed = new URL(url);

    if (!parsed.hostname.includes('vimeo.com')) {
      return '';
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    const videoId = parts[parts.length - 1];

    if (!videoId) return '';

    return `https://player.vimeo.com/video/${videoId}`;
  } catch (error) {
    return '';
  }
}

function isDirectVideo(url) {
  if (!url) return false;

  return (
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) ||
    url.includes('/content/dam/')
  );
}

function createMedia(data) {
  const mediaWrapper = document.createElement('div');
  mediaWrapper.className = 'modal-v1-media';

  if (data.mediaType === 'image') {
    const imageUrl = getImageSource(data.image);

    if (!imageUrl) {
      return null;
    }

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = getFieldText(data.imageAlt);
    img.loading = 'lazy';

    mediaWrapper.append(img);

    return mediaWrapper;
  }

  if (data.mediaType === 'video') {
    const videoUrl = getVideoUrl(data.videoUrl);

    if (!videoUrl) {
      return null;
    }

    const posterUrl = getImageSource(data.videoPoster);

    // Direct video file
    if (isDirectVideo(videoUrl)) {
      const video = document.createElement('video');

      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;

      if (posterUrl) {
        video.poster = posterUrl;
      }

      const source = document.createElement('source');
      source.src = videoUrl;

      video.append(source);
      mediaWrapper.append(video);

      return mediaWrapper;
    }

    // YouTube
    const youtubeEmbed = createYouTubeEmbed(videoUrl);

    if (youtubeEmbed) {
      const iframe = document.createElement('iframe');

      iframe.src = youtubeEmbed;
      iframe.title = 'Modal video';
      iframe.loading = 'lazy';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;

      mediaWrapper.append(iframe);

      return mediaWrapper;
    }

    // Vimeo
    const vimeoEmbed = createVimeoEmbed(videoUrl);

    if (vimeoEmbed) {
      const iframe = document.createElement('iframe');

      iframe.src = vimeoEmbed;
      iframe.title = 'Modal video';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;

      mediaWrapper.append(iframe);

      return mediaWrapper;
    }

    // Generic embed URL
    const iframe = document.createElement('iframe');

    iframe.src = videoUrl;
    iframe.title = 'Modal video';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;

    mediaWrapper.append(iframe);

    return mediaWrapper;
  }

  return null;
}

function createAction(text, link, style, color) {
  const cleanText = getFieldText(text);
  const cleanLink = getFieldLink(link);

  // Never render an empty CTA.
  if (!cleanText) {
    return null;
  }

  let element;

  if (cleanLink) {
    element = document.createElement('a');
    element.href = cleanLink;

    // Allow normal navigation.
    if (
      cleanLink.startsWith('http://') ||
      cleanLink.startsWith('https://')
    ) {
      element.target = '_self';
    }
  } else {
    element = document.createElement('button');
    element.type = 'button';
  }

  const buttonStyle = normalizeButtonStyle(style);
  const buttonColor = normalizeButtonColor(color);

  element.className = [
    'modal-v1-button',
    `modal-v1-button-style-${buttonStyle}`,
    `modal-v1-button-color-${buttonColor}`,
  ].join(' ');

  element.textContent = cleanText;

  return element;
}

function normalizeBlock(block) {
  const fields = [...block.children].map(
    (row) => row.firstElementChild || row,
  );

  const [
    layout,
    size,
    mediaType,
    image,
    imageAlt,
    videoUrl,
    videoPoster,
    eyebrow,
    heading,
    content,
    supportingText,
    primaryCtaText,
    primaryCtaLink,
    secondaryCtaText,
    secondaryCtaLink,
    primaryButtonStyle,
    secondaryButtonStyle,
    primaryButtonColor,
    secondaryButtonColor,
    alignment,
    backdrop,
    borderRadius,
    closeLabel,
    triggerText,
  ] = fields;

  return {
    layout: normalizeLayout(getFieldText(layout)),
    size: normalizeSize(getFieldText(size)),
    mediaType: normalizeMediaType(getFieldText(mediaType)),

    image,
    imageAlt,
    videoUrl,
    videoPoster,

    eyebrow,
    heading,
    content,
    supportingText,

    primaryCtaText,
    primaryCtaLink,
    secondaryCtaText,
    secondaryCtaLink,

    primaryButtonStyle,
    secondaryButtonStyle,
    primaryButtonColor,
    secondaryButtonColor,

    alignment: normalizeAlignment(getFieldText(alignment)),
    backdrop: normalizeBackdrop(getFieldText(backdrop)),
    borderRadius: normalizeRadius(getFieldText(borderRadius)),

    closeLabel: getFieldText(closeLabel) || 'Close',
    triggerText: getFieldText(triggerText) || 'Open Modal',
  };
}

function createModal(data, block) {
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

  const closeButton = document.createElement('button');

  closeButton.type = 'button';
  closeButton.className = 'modal-v1-close';
  closeButton.setAttribute('aria-label', data.closeLabel);
  closeButton.textContent = '×';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-v1-content';

  const media = createMedia(data);

  if (media) {
    modalContent.append(media);
  }

  const body = document.createElement('div');
  body.className = 'modal-v1-body';

  const eyebrowText = getFieldText(data.eyebrow);
  const headingText = getFieldText(data.heading);

  if (eyebrowText) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'modal-v1-eyebrow';
    eyebrow.textContent = eyebrowText;
    body.append(eyebrow);
  }

  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = 'modal-v1-heading';
    heading.textContent = headingText;
    body.append(heading);
  }

  const contentText = getFieldText(data.content);

  if (contentText) {
    const contentElement = document.createElement('div');
    contentElement.className = 'modal-v1-main-content';
    contentElement.innerHTML = data.content.innerHTML || '';
    body.append(contentElement);
  }

  const supportingText = getFieldText(data.supportingText);

  if (supportingText) {
    const supportingElement = document.createElement('div');
    supportingElement.className = 'modal-v1-supporting-text';
    supportingElement.innerHTML =
      data.supportingText.innerHTML || supportingText;
    body.append(supportingElement);
  }

  const footer = document.createElement('div');
  footer.className = 'modal-v1-footer';

  const primaryButton = createAction(
    data.primaryCtaText,
    data.primaryCtaLink,
    data.primaryButtonStyle,
    data.primaryButtonColor,
  );

  const secondaryButton = createAction(
    data.secondaryCtaText,
    data.secondaryCtaLink,
    data.secondaryButtonStyle,
    data.secondaryButtonColor,
  );

  if (primaryButton) {
    footer.append(primaryButton);
  }

  if (secondaryButton) {
    footer.append(secondaryButton);
  }

  if (footer.children.length > 0) {
    body.append(footer);
  }

  modalContent.append(body);

  dialog.append(closeButton);
  dialog.append(modalContent);
  overlay.append(dialog);

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-v1-no-scroll');

    // Stop video when modal closes.
    const video = overlay.querySelector('video');

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    const iframe = overlay.querySelector('iframe');

    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      iframe.src = currentSrc;
    }
  }

  function openModal() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-v1-no-scroll');

    requestAnimationFrame(() => {
      closeButton.focus();
    });
  }

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
    if (
      event.key === 'Escape' &&
      overlay.classList.contains('is-open')
    ) {
      closeModal();
    }
  });

  block.append(overlay);

  return {
    openModal,
    closeModal,
  };
}

export default function decorate(block) {
  const data = normalizeBlock(block);

  const trigger = document.createElement('button');

  trigger.type = 'button';
  trigger.className = 'modal-v1-trigger';
  trigger.textContent = data.triggerText;

  // Keep the original block clean.
  block.textContent = '';
  block.append(trigger);

  const modal = createModal(data, block);

  trigger.addEventListener('click', () => {
    modal.openModal();
  });
}
