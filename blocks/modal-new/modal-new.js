export default function decorate(block) {
  const triggerText = block.children[0]?.textContent?.trim() || 'Open Modal';
  const title = block.children[1]?.textContent?.trim() || '';
  const description = block.children[2]?.textContent?.trim() || '';
  const imageSrc = block.children[3]?.querySelector('img')?.src || '';
  const videoUrl = block.children[4]?.textContent?.trim() || '';
  const ctaText = block.children[5]?.textContent?.trim() || '';
  const ctaUrl = block.children[6]?.textContent?.trim() || '';

  block.innerHTML = '';

  const trigger = document.createElement('button');
  trigger.className = 'modal-new-trigger';
  trigger.type = 'button';
  trigger.textContent = triggerText;

  const overlay = document.createElement('div');
  overlay.className = 'modal-new-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const modal = document.createElement('div');
  modal.className = 'modal-new-dialog';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-new-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close Modal');
  closeBtn.innerHTML = '&times;';

  const content = document.createElement('div');
  content.className = 'modal-new-content';

  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    content.appendChild(heading);
  }

  if (imageSrc) {
    const image = document.createElement('img');
    image.src = imageSrc;
    image.alt = title || 'Modal Image';
    content.appendChild(image);
  }

  if (videoUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.title = title || 'Video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    content.appendChild(iframe);
  }

  if (description) {
    const text = document.createElement('p');
    text.textContent = description;
    content.appendChild(text);
  }

  if (ctaText && ctaUrl) {
    const cta = document.createElement('a');
    cta.className = 'modal-new-cta';
    cta.href = ctaUrl;
    cta.textContent = ctaText;
    content.appendChild(cta);
  }

  modal.append(closeBtn, content);
  overlay.append(modal);

  const openModal = () => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-new-open');
  };

  const closeModal = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-new-open');
  };

  trigger.addEventListener('click', openModal);

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeModal();
    }
  });

  block.append(trigger);
  block.append(overlay);
}
