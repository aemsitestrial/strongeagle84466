/* eslint-disable */

/*
 * ============================================================
 * MODAL V1
 * ============================================================
 *
 * FIELD ORDER
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
   BASIC FIELD HELPERS
   ============================================================ */

function getFields(block) {
  return [...block.children].map(
    (row) => row.firstElementChild || row,
  );
}


/*
 * Text fields:
 *
 * IMPORTANT:
 * This function NEVER reads an <a href>.
 *
 * Therefore a CTA link cannot accidentally become
 * the CTA button text.
 */
function getTextValue(field) {
  if (!field) return '';

  const input = field.querySelector(
    'input, textarea',
  );

  if (input && input.value) {
    return input.value.trim();
  }

  const select = field.querySelector('select');

  if (select && select.value) {
    return select.value.trim();
  }

  return (field.textContent || '').trim();
}


/*
 * Link fields:
 *
 * Only use this function for fields that are
 * actually supposed to contain URLs.
 */
function getLinkValue(field) {
  if (!field) return '';

  const anchor = field.querySelector(
    'a[href]',
  );

  if (anchor && anchor.href) {
    return anchor.href;
  }

  const input = field.querySelector('input');

  if (input && input.value) {
    return input.value.trim();
  }

  return (field.textContent || '').trim();
}


/*
 * Rich text HTML.
 */
function getFieldHTML(field) {
  if (!field) return '';

  return field.innerHTML || '';
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
   VALUE CHECKERS
   ============================================================ */

function isUrl(value) {
  if (!value) return false;

  const text = value.trim();

  return (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('/') ||
    text.startsWith('#') ||
    text.startsWith('mailto:') ||
    text.startsWith('tel:')
  );
}


function isButtonStyle(value) {
  const normalized = normalize(
    value,
    '',
  );

  return [
    'solid',
    'outline',
    'text',
  ].includes(normalized);
}


function isButtonColor(value) {
  const normalized = normalize(
    value,
    '',
  );

  return [
    'primary',
    'secondary',
    'accent',
    'dark',
    'light',
  ].includes(normalized);
}


/* ============================================================
   IMAGE
   ============================================================ */

function getImageUrl(field) {
  if (!field) return '';

  const image = field.querySelector('img');

  if (image) {
    return (
      image.currentSrc ||
      image.src ||
      ''
    );
  }

  const source = field.querySelector(
    'source[srcset]',
  );

  if (source && source.srcset) {
    return source.srcset
      .split(',')[0]
      .trim()
      .split(' ')[0];
  }

  return getTextValue(field);
}


/* ============================================================
   VIDEO
   ============================================================ */

function createVideo(url, poster) {
  if (!url) return null;

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'modal-v1-media';


  /*
   * Direct video files.
   */
  if (
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) ||
    url.includes('/content/dam/')
  ) {
    const video =
      document.createElement('video');

    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;

    if (poster) {
      video.poster = poster;
    }

    const source =
      document.createElement('source');

    source.src = url;

    video.append(source);
    wrapper.append(video);

    return wrapper;
  }


  /*
   * Embedded video.
   */
  let embedUrl = url;

  try {
    const parsed = new URL(url);


    /* YouTube */

    if (
      parsed.hostname.includes(
        'youtube.com',
      )
    ) {
      const id =
        parsed.searchParams.get('v');

      if (id) {
        embedUrl =
          `https://www.youtube.com/embed/${id}`;
      }
    }


    if (
      parsed.hostname.includes(
        'youtu.be',
      )
    ) {
      const id =
        parsed.pathname.substring(1);

      if (id) {
        embedUrl =
          `https://www.youtube.com/embed/${id}`;
      }
    }


    /* Vimeo */

    if (
      parsed.hostname.includes(
        'vimeo.com',
      )
    ) {
      const parts =
        parsed.pathname
          .split('/')
          .filter(Boolean);

      const id =
        parts[parts.length - 1];

      if (id) {
        embedUrl =
          `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch (error) {
    /*
     * If URL parsing fails,
     * use the original URL.
     */
  }


  const iframe =
    document.createElement('iframe');

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

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'modal-v1-media';

  const image =
    document.createElement('img');

  image.src = url;
  image.alt = alt || '';
  image.loading = 'lazy';

  wrapper.append(image);

  return wrapper;
}


/* ============================================================
   CTA BUTTON
   ============================================================ */

function createButton(
  text,
  link,
  style,
  color,
) {
  const buttonText =
    (text || '').trim();


  /*
   * Don't create an empty button.
   */
  if (!buttonText) {
    return null;
  }


  /*
   * CRITICAL PROTECTION:
   *
   * These values are styling values,
   * NOT button labels.
   */
  if (
    isButtonStyle(buttonText) ||
    isButtonColor(buttonText)
  ) {
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
    isButtonStyle(style)
      ? normalize(style, 'solid')
      : 'solid';


  const normalizedColor =
    isButtonColor(color)
      ? normalize(color, 'primary')
      : 'primary';


  button.className = [
    'modal-v1-button',
    `modal-v1-button-style-${normalizedStyle}`,
    `modal-v1-button-color-${normalizedColor}`,
  ].join(' ');


  /*
   * ONLY actual CTA text goes here.
   */
  button.textContent = buttonText;


  return button;
}


/* ============================================================
   BUILD MODAL
   ============================================================ */

function buildModal(data) {
  const overlay =
    document.createElement('div');

  overlay.className = [
    'modal-v1-overlay',
    `modal-v1-backdrop-${data.backdrop}`,
  ].join(' ');

  overlay.setAttribute(
    'aria-hidden',
    'true',
  );


  const dialog =
    document.createElement('div');

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
     CLOSE
     ========================================================== */

  const close =
    document.createElement('button');

  close.type = 'button';

  close.className =
    'modal-v1-close';

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

  const body =
    document.createElement('div');

  body.className =
    'modal-v1-body';


  /* EYEBROW */

  if (data.eyebrow) {
    const eyebrow =
      document.createElement('div');

    eyebrow.className =
      'modal-v1-eyebrow';

    eyebrow.textContent =
      data.eyebrow;

    body.append(eyebrow);
  }


  /* HEADING */

  if (data.heading) {
    const heading =
      document.createElement('h2');

    heading.className =
      'modal-v1-heading';

    heading.textContent =
      data.heading;

    body.append(heading);
  }


  /* CONTENT */

  if (data.content) {
    const content =
      document.createElement('div');

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
     CTA FOOTER
     ========================================================== */

  const footer =
    document.createElement('div');

  footer.className =
    'modal-v1-footer';


  /* PRIMARY CTA */

  const primary =
    createButton(
      data.primaryText,
      data.primaryLink,
      data.primaryStyle,
      data.primaryColor,
    );

  if (primary) {
    footer.append(primary);
  }


  /* SECONDARY CTA */

  const secondary =
    createButton(
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
     DIALOG
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
   * Read all authored fields BEFORE clearing block.
   */

  const fields =
    getFields(block);


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

    primaryCtaTextField,
    primaryCtaLinkField,

    secondaryCtaTextField,
    secondaryCtaLinkField,

    primaryButtonStyleField,
    secondaryButtonStyleField,

    primaryButtonColorField,
    secondaryButtonColorField,

    alignmentField,
    backdropField,
    radiusField,

    closeLabelField,
    triggerTextField,
  ] = fields;


  /* ==========================================================
     BASIC VALUES
     ========================================================== */

  const layout =
    normalize(
      getTextValue(layoutField),
      'default',
    );

  const size =
    normalize(
      getTextValue(sizeField),
      'medium',
    );

  const mediaType =
    normalize(
      getTextValue(mediaTypeField),
      'none',
    );


  /* ==========================================================
     CONTENT
     ========================================================== */

  const data = {

    layout: [
      'default',
      'side-panel',
      'full-screen',
      'bottom-sheet',
    ].includes(layout)
      ? layout
      : 'default',

    size: [
      'small',
      'medium',
      'large',
    ].includes(size)
      ? size
      : 'medium',

    mediaType: [
      'none',
      'image',
      'video',
    ].includes(mediaType)
      ? mediaType
      : 'none',


    /* MEDIA */

    image:
      getImageUrl(
        imageField,
      ),

    imageAlt:
      getTextValue(
        imageAltField,
      ),

    videoUrl:
      getLinkValue(
        videoUrlField,
      ),

    videoPoster:
      getImageUrl(
        videoPosterField,
      ),


    /* TEXT */

    eyebrow:
      getTextValue(
        eyebrowField,
      ),

    heading:
      getTextValue(
        headingField,
      ),

    content:
      getTextValue(
        contentField,
      ),

    contentHTML:
      getFieldHTML(
        contentField,
      ),

    supportingText:
      getTextValue(
        supportingTextField,
      ),

    supportingTextHTML:
      getFieldHTML(
        supportingTextField,
      ),


    /* CTA */

    primaryText:
      getTextValue(
        primaryCtaTextField,
      ),

    primaryLink:
      getLinkValue(
        primaryCtaLinkField,
      ),

    secondaryText:
      getTextValue(
        secondaryCtaTextField,
      ),

    secondaryLink:
      getLinkValue(
        secondaryCtaLinkField,
      ),


    /* BUTTON STYLE */

    primaryStyle:
      getTextValue(
        primaryButtonStyleField,
      ),

    secondaryStyle:
      getTextValue(
        secondaryButtonStyleField,
      ),


    /* BUTTON COLOR */

    primaryColor:
      getTextValue(
        primaryButtonColorField,
      ),

    secondaryColor:
      getTextValue(
        secondaryButtonColorField,
      ),


    /* APPEARANCE */

    alignment:
      normalize(
        getTextValue(
          alignmentField,
        ),
        'left',
      ),

    backdrop:
      normalize(
        getTextValue(
          backdropField,
        ),
        'default',
      ),

    radius:
      normalize(
        getTextValue(
          radiusField,
        ),
        'medium',
      ),


    /* CLOSE / TRIGGER */

    closeLabel:
      getTextValue(
        closeLabelField,
      ) || 'Close',

    triggerText:
      getTextValue(
        triggerTextField,
      ) || 'Open Modal',
  };


  /* ==========================================================
     NORMALIZE BUTTON STYLE
     ========================================================== */

  if (
    !isButtonStyle(
      data.primaryStyle,
    )
  ) {
    data.primaryStyle =
      'solid';
  }

  if (
    !isButtonStyle(
      data.secondaryStyle,
    )
  ) {
    data.secondaryStyle =
      'outline';
  }


  /* ==========================================================
     NORMALIZE BUTTON COLORS
     ========================================================== */

  if (
    !isButtonColor(
      data.primaryColor,
    )
  ) {
    data.primaryColor =
      'primary';
  }

  if (
    !isButtonColor(
      data.secondaryColor,
    )
  ) {
    data.secondaryColor =
      'secondary';
  }


  /* ==========================================================
     NORMALIZE ALIGNMENT
     ========================================================== */

  if (
    ![
      'left',
      'center',
      'right',
    ].includes(
      data.alignment,
    )
  ) {
    data.alignment =
      'left';
  }


  /* ==========================================================
     NORMALIZE BACKDROP
     ========================================================== */

  if (
    ![
      'default',
      'dark',
      'light',
    ].includes(
      data.backdrop,
    )
  ) {
    data.backdrop =
      'default';
  }


  /* ==========================================================
     NORMALIZE RADIUS
     ========================================================== */

  if (
    ![
      'none',
      'small',
      'medium',
      'large',
    ].includes(
      data.radius,
    )
  ) {
    data.radius =
      'medium';
  }


  /* ==========================================================
     CTA SAFETY
     ========================================================== */

  /*
   * If a styling value somehow entered a CTA text field,
   * NEVER display it as the button label.
   */

  if (
    isButtonStyle(
      data.primaryText,
    ) ||
    isButtonColor(
      data.primaryText,
    )
  ) {
    data.primaryText = '';
  }


  if (
    isButtonStyle(
      data.secondaryText,
    ) ||
    isButtonColor(
      data.secondaryText,
    )
  ) {
    data.secondaryText = '';
  }


  /*
   * If the link field isn't actually a link,
   * don't use it as href.
   */

  if (
    data.primaryLink &&
    !isUrl(data.primaryLink)
  ) {
    data.primaryLink = '';
  }

  if (
    data.secondaryLink &&
    !isUrl(data.secondaryLink)
  ) {
    data.secondaryLink = '';
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
     BUILD MODAL
     ========================================================== */

  const modal =
    buildModal(data);

  const {
    overlay,
    close,
  } = modal;


  /* ==========================================================
     REPLACE AUTHORED CONTENT
     ========================================================== */

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
      overlay.querySelector(
        'video',
      );

    if (video) {
      video.pause();
    }
  }


  /* ==========================================================
     TRIGGER EVENT
     ========================================================== */

  trigger.addEventListener(
    'click',
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      openModal();
    },
  );


  /* ==========================================================
     CLOSE EVENT
     ========================================================== */

  close.addEventListener(
    'click',
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      closeModal();
    },
  );


  /* ==========================================================
     BACKDROP CLICK
     ========================================================== */

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


  /* ==========================================================
     ESCAPE
     ========================================================== */

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
