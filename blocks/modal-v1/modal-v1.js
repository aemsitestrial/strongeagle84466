/* eslint-disable */

/*
 * ============================================================
 * MODAL V1
 * ============================================================
 *
 * Field order MUST match _modal-v1.json:
 *
 * 1  layout
 * 2  size
 * 3  mediaType
 * 4  image
 * 5  imageAlt
 * 6  videoUrl
 * 7  videoPoster
 * 8  eyebrow
 * 9  heading
 * 10 content
 * 11 supportingText
 * 12 primaryCtaText
 * 13 primaryCtaLink
 * 14 secondaryCtaText
 * 15 secondaryCtaLink
 * 16 primaryButtonStyle
 * 17 secondaryButtonStyle
 * 18 primaryButtonColor
 * 19 secondaryButtonColor
 * 20 alignment
 * 21 backdrop
 * 22 borderRadius
 * 23 closeLabel
 * 24 triggerText
 */


/* ============================================================
   FIELD HELPERS
   ============================================================ */

/**
 * Read a TEXT field.
 *
 * IMPORTANT:
 * Never read an <a href> from here.
 *
 * This prevents:
 *
 * https://example.com
 *
 * from accidentally becoming the CTA button text.
 */
function getTextValue(field) {
  if (!field) return '';

  const input = field.querySelector('input, textarea');

  if (input && input.value) {
    return input.value.trim();
  }

  /*
   * For select-like fields, prefer the actual selected value
   * when available.
   */
  const select = field.querySelector('select');

  if (select && select.value) {
    return select.value.trim();
  }

  /*
   * IMPORTANT:
   * Do NOT look for <a href> here.
   */
  return (field.textContent || '').trim();
}


/**
 * Read a LINK field.
 *
 * This function is ONLY used for CTA links and video URLs.
 */
function getLinkValue(field) {
  if (!field) return '';

  const anchor = field.querySelector('a[href]');

  if (anchor && anchor.href) {
    return anchor.href;
  }

  const input = field.querySelector('input');

  if (input && input.value) {
    return input.value.trim();
  }

  return (field.textContent || '').trim();
}


/**
 * Get all block fields in positional order.
 */
function getFields(block) {
  return [...block.children].map(
    (row) => row.firstElementChild || row,
  );
}


/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalize(value, fallback) {
  if (!value) return fallback;

  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}


/* ============================================================
   IMAGE
   ============================================================ */

function getImageUrl(field) {
  if (!field) return '';

  const img = field.querySelector('img');

  if (img) {
    return img.currentSrc || img.src || '';
  }

  const source = field.querySelector('source[srcset]');

  if (source && source.srcset) {
    return source.srcset.split(',')[0].trim().split(' ')[0];
  }

  return getTextValue(field);
}


/* ============================================================
   VIDEO
   ============================================================ */

function createVideo(url, poster) {
  if (!url) return null;

  const wrapper = document.createElement('div');

  wrapper.className = 'modal-v1-media';

  /*
   * Direct video file.
   */
  if (
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) ||
    url.includes('/content/dam/')
  ) {
    const video = document.createElement('video');

    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;

    if (poster) {
      video.poster = poster;
    }

    const source = document.createElement('source');

    source.src = url;

    video.append(source);
    wrapper.append(video);

    return wrapper;
  }

  /*
   * Convert YouTube/Vimeo URLs to embed URLs.
   */
  let embedUrl = url;

  try {
    const parsed = new URL(url);

    /* YouTube */

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');

      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.substring(1);

      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    /* Vimeo */

    if (parsed.hostname.includes('vimeo.com')) {
      const parts = parsed.pathname
        .split('/')
        .filter(Boolean);

      const videoId = parts[parts.length - 1];

      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch (error) {
    // Use original URL.
  }

  const iframe = document.createElement('iframe');

  iframe.src = embedUrl;
  iframe.title = 'Modal video';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  iframe.allow =
    'autoplay; fullscreen; picture-in-picture';

  wrapper.append(iframe);

  return wrapper;
}


/* ============================================================
   IMAGE MEDIA
   ============================================================ */

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


/* ============================================================
   BUTTON
   ============================================================ */

function createButton(
  text,
  link,
  style,
  color,
) {
  /*
   * Most important check:
   *
   * If there is no CTA TEXT,
   * do NOT create a button.
   */
  if (!text || !text.trim()) {
    return null;
  }

  const button = link
    ? document.createElement('a')
    : document.createElement('button');

  if (link) {
    button.href = link;
  } else {
    button.type = 'button';
  }

  const normalizedStyle =
    normalize(style, 'solid');

  const normalizedColor =
    normalize(color, 'primary');

  button.className = [
    'modal-v1-button',
    `modal-v1-button-style-${normalizedStyle}`,
    `modal-v1-button-color-${normalizedColor}`,
  ].join(' ');

  /*
   * VERY IMPORTANT:
   *
   * Only CTA TEXT goes here.
   *
   * Never use link/style/color here.
   */
  button.textContent = text.trim();

  return button;
}


/* ============================================================
   BUILD MODAL
   ============================================================ */

function buildModal(data) {
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
    `modal-v1-radius-${data.radius}`,
  ].join(' ');

  dialog.setAttribute(
    'role',
    'dialog',
  );

  dialog.setAttribute(
    'aria-modal',
    'true',
  );


  /* ==========================================================
     CLOSE BUTTON
     ========================================================== */

  const close = document.createElement('button');

  close.type = 'button';
  close.className = 'modal-v1-close';

  close.setAttribute(
    'aria-label',
    data.closeLabel,
  );

  close.textContent = '×';


  /* ==========================================================
     MEDIA
     ========================================================== */

  let media = null;

  if (data.mediaType === 'image') {
    media = createImage(
      data.image,
      data.imageAlt,
    );
  }

  if (data.mediaType === 'video') {
    media = createVideo(
      data.videoUrl,
      data.videoPoster,
    );
  }

  if (media) {
    dialog.append(media);
  }


  /* ==========================================================
     BODY
     ========================================================== */

  const body = document.createElement('div');

  body.className = 'modal-v1-body';


  /* EYEBROW */

  if (data.eyebrow) {
    const eyebrow = document.createElement('div');

    eyebrow.className =
      'modal-v1-eyebrow';

    eyebrow.textContent =
      data.eyebrow;

    body.append(eyebrow);
  }


  /* HEADING */

  if (data.heading) {
    const heading = document.createElement('h2');

    heading.className =
      'modal-v1-heading';

    heading.textContent =
      data.heading;

    body.append(heading);
  }


  /* CONTENT */

  if (data.content) {
    const content = document.createElement('div');

    content.className =
      'modal-v1-main-content';

    content.innerHTML =
      data.contentHTML;

    body.append(content);
  }


  /* SUPPORTING TEXT */

  if (data.supportingText) {
    const supporting =
      document.createElement('div');

    supporting.className =
      'modal-v1-supporting-text';

    supporting.innerHTML =
      data.supportingTextHTML;

    body.append(supporting);
  }


  /* ==========================================================
     FOOTER
     ========================================================== */

  const footer = document.createElement('div');

  footer.className =
    'modal-v1-footer';


  /* PRIMARY */

  const primary = createButton(
    data.primaryText,
    data.primaryLink,
    data.primaryStyle,
    data.primaryColor,
  );

  if (primary) {
    footer.append(primary);
  }


  /* SECONDARY */

  const secondary = createButton(
    data.secondaryText,
    data.secondaryLink,
    data.secondaryStyle,
    data.secondaryColor,
  );

  if (secondary) {
    footer.append(secondary);
  }


  if (footer.children.length > 0) {
    body.append(footer);
  }


  /* ==========================================================
     FINISH DIALOG
     ========================================================== */

  dialog.append(close);
  dialog.append(body);

  overlay.append(dialog);


  return {
    overlay,
    close,
  };
}


/* ============================================================
   DECORATE
   ============================================================ */

export default function decorate(block) {

  /*
   * Read fields BEFORE clearing the block.
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


  /* ==========================================================
     DATA
     ========================================================== */

  const data = {

    layout: normalize(
      getTextValue(layoutField),
      'default',
    ),

    size: normalize(
      getTextValue(sizeField),
      'medium',
    ),

    mediaType: normalize(
      getTextValue(mediaTypeField),
      'none',
    ),


    image: getImageUrl(imageField),

    imageAlt: getTextValue(
      imageAltField,
    ),


    /*
     * LINK FIELD
     */
    videoUrl: getLinkValue(
      videoUrlField,
    ),

    videoPoster: getImageUrl(
      videoPosterField,
    ),


    /*
     * TEXT FIELDS
     */
    eyebrow: getTextValue(
      eyebrowField,
    ),

    heading: getTextValue(
      headingField,
    ),

    content: getTextValue(
      contentField,
    ),

    contentHTML:
      contentField?.innerHTML || '',


    supportingText:
      getTextValue(
        supportingTextField,
      ),

    supportingTextHTML:
      supportingTextField?.innerHTML || '',


    /*
     * CTA TEXT
     */
    primaryText:
      getTextValue(
        primaryTextField,
      ),

    /*
     * CTA LINK
     */
    primaryLink:
      getLinkValue(
        primaryLinkField,
      ),


    /*
     * SECONDARY CTA
     */
    secondaryText:
      getTextValue(
        secondaryTextField,
      ),

    secondaryLink:
      getLinkValue(
        secondaryLinkField,
      ),


    /*
     * BUTTON STYLE
     */
    primaryStyle:
      getTextValue(
        primaryStyleField,
      ),

    secondaryStyle:
      getTextValue(
        secondaryStyleField,
      ),


    /*
     * BUTTON COLOR
     */
    primaryColor:
      getTextValue(
        primaryColorField,
      ),

    secondaryColor:
      getTextValue(
        secondaryColorField,
      ),


    /*
     * APPEARANCE
     */
    alignment: normalize(
      getTextValue(alignmentField),
      'left',
    ),

    backdrop: normalize(
      getTextValue(backdropField),
      'default',
    ),

    radius: normalize(
      getTextValue(radiusField),
      'medium',
    ),


    /*
     * CLOSE + TRIGGER
     */
    closeLabel:
      getTextValue(closeLabelField) ||
      'Close',

    triggerText:
      getTextValue(triggerTextField) ||
      'Open Modal',
  };


  /* ==========================================================
     VALIDATION
     ========================================================== */

  const layouts = [
    'default',
    'side-panel',
    'full-screen',
    'bottom-sheet',
  ];

  if (!layouts.includes(data.layout)) {
    data.layout = 'default';
  }


  const sizes = [
    'small',
    'medium',
    'large',
  ];

  if (!sizes.includes(data.size)) {
    data.size = 'medium';
  }


  const mediaTypes = [
    'none',
    'image',
    'video',
  ];

  if (!mediaTypes.includes(data.mediaType)) {
    data.mediaType = 'none';
  }


  const alignments = [
    'left',
    'center',
    'right',
  ];

  if (!alignments.includes(data.alignment)) {
    data.alignment = 'left';
  }


  const backdrops = [
    'default',
    'dark',
    'light',
  ];

  if (!backdrops.includes(data.backdrop)) {
    data.backdrop = 'default';
  }


  const radiuses = [
    'none',
    'small',
    'medium',
    'large',
  ];

  if (!radiuses.includes(data.radius)) {
    data.radius = 'medium';
  }


  /* ==========================================================
     TRIGGER
     ========================================================== */

  const trigger =
    document.createElement('button');

  trigger.type = 'button';

  trigger.className =
    'modal-v1-trigger';

  trigger.textContent =
    data.triggerText;


  /* ==========================================================
     MODAL
     ========================================================== */

  const modal = buildModal(data);

  const {
    overlay,
    close,
  } = modal;


  /*
   * Clear authored rows.
   */

  block.textContent = '';


  block.append(trigger);
  block.append(overlay);


  /* ==========================================================
     OPEN
     ========================================================== */

  function openModal() {

    overlay.classList.add(
      'is-open',
    );

    overlay.setAttribute(
      'aria-hidden',
      'false',
    );

    document.body.classList.add(
      'modal-v1-no-scroll',
    );

    requestAnimationFrame(() => {
      close.focus();
    });
  }


  /* ==========================================================
     CLOSE
     ========================================================== */

  function closeModal() {

    overlay.classList.remove(
      'is-open',
    );

    overlay.setAttribute(
      'aria-hidden',
      'true',
    );

    document.body.classList.remove(
      'modal-v1-no-scroll',
    );

    const video =
      overlay.querySelector('video');

    if (video) {
      video.pause();
    }
  }


  /* ==========================================================
     EVENTS
     ========================================================== */

  trigger.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      openModal();
    },
  );


  close.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      closeModal();
    },
  );


  overlay.addEventListener(
    'click',
    (event) => {
      if (
        event.target === overlay
      ) {
        closeModal();
      }
    },
  );


  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        overlay.classList.contains(
          'is-open',
        )
      ) {
        closeModal();
      }
    },
  );
}
