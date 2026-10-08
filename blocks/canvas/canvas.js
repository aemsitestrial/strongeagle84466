/**
 * Escape author entered content.
 */
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extract block data.
 */
function extractData(block) {
  const data = {};

  [...block.children].forEach((row) => {
    const cells = [...row.children];

    if (cells.length < 2) return;

    const key = cells[0].textContent
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    data[key] = cells[1].textContent.trim();
  });

  return data;
}

/**
 * Shared search bar.
 */
function createSearchBar({
  watermark,
  showNavigation,
  showMicrophone,
}) {
  const wrapper = document.createElement('div');

  wrapper.className = 'canvas-search';

  wrapper.innerHTML = `
    ${showNavigation ? `
      <button
        type="button"
        class="canvas-menu-btn"
        aria-label="Menu">
        ☰
      </button>
    ` : ''}

    <div class="canvas-search-container">
      <div class="canvas-search-input">

        <span class="canvas-placeholder">
          ${escapeHtml(watermark)}
        </span>

        <div class="canvas-controls">

          ${showMicrophone ? `
            <button
              type="button"
              class="canvas-mic-btn"
              aria-label="Microphone">
              🎤
            </button>
          ` : ''}

          <button
            type="button"
            class="canvas-submit-btn"
            aria-label="Submit">
            →
          </button>

        </div>
      </div>
    </div>
  `;

  return wrapper;
}

/**
 * Search Canvas
 */
function renderSearchCanvas(block, data) {
  const search = createSearchBar({
    watermark:
      data.canvassearchwatermark || 'Ask Deloitte...',
    showNavigation:
      data.shownavigation !== 'false',
    showMicrophone:
      data.showmicrophone !== 'false',
  });

  block.append(search);
}

/**
 * Intent Canvas
 */
function renderIntentCanvas(block, data) {
  const section = document.createElement('section');

  section.className = 'canvas-intent';

  section.innerHTML = `
    <div class="canvas-glow canvas-glow-yellow"></div>
    <div class="canvas-glow canvas-glow-blue"></div>

    <div class="canvas-intent-content">

      <h2 class="canvas-title">
        ${escapeHtml(data.canvastitle || '')}
      </h2>

      <div class="canvas-description">
        ${escapeHtml(data.canvasdescription || '')}
      </div>

      <div class="canvas-search-slot"></div>

      <div class="canvas-options"></div>

    </div>
  `;

  block.append(section);

  const enableSearch = data.enablesearch !== 'false';

  if (enableSearch) {
    const searchSlot = section.querySelector(
      '.canvas-search-slot',
    );

    searchSlot.append(
      createSearchBar({
        watermark:
          data.canvassearchwatermark
          || 'Ask Deloitte...',
        showNavigation:
          data.shownavigation !== 'false',
        showMicrophone:
          data.showmicrophone !== 'false',
      }),
    );
  }

  const optionsContainer = section.querySelector('.canvas-options');

  const maxOptions = Number(
    data.maximumoptions || 5,
  );

  for (let i = 1; i <= maxOptions; i += 1) {
    const pill = document.createElement('button');

    pill.className = 'canvas-option-pill';
    pill.type = 'button';

    pill.textContent = `Option ${i}`;

    optionsContainer.append(pill);
  }
}

/**
 * Main decorator.
 */
export default function decorate(block) {
  const data = extractData(block);

  block.textContent = '';

  const canvasType = data.canvastype || 'search';

  const canvasStyle = (data.canvasstyle || 'default')
    .toLowerCase()
    .replace(/\s+/g, '-');

  block.classList.add('canvas');
  block.classList.add(`canvas-${canvasStyle}`);

  if (canvasType === 'intent') {
    renderIntentCanvas(block, data);
    return;
  }

  renderSearchCanvas(block, data);
}
