/**
 * Escape HTML.
 * @param {string} value
 * @returns {string}
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
 * Extract authored block data.
 * @param {HTMLElement} block
 * @returns {Object}
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

    const value = cells[1].textContent.trim();

    data[key] = value;
  });

  return data;
}

/**
 * Creates search area.
 * @param {Object} config
 * @returns {HTMLElement}
 */
function createSearch(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-search';

  wrapper.innerHTML = `
    ${config.showNavigation ? `
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
          ${escapeHtml(config.watermark)}
        </span>

        <div class="canvas-controls">

          ${config.showMicrophone ? `
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
 * Render Search Canvas.
 */
function renderSearchCanvas(block, data) {
  const search = createSearch({
    watermark: data.canvassearchwatermark || 'Ask TCS...',
    showNavigation: data.shownavigation !== 'false',
    showMicrophone: data.showmicrophone !== 'false',
  });

  block.append(search);
}

/**
 * Render Intent Canvas.
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

      <div class="canvas-search-placeholder"></div>

      <div class="canvas-options"></div>

    </div>
  `;

  block.append(section);

  if (data.enablesearch !== 'false') {
    const searchContainer = section.querySelector(
      '.canvas-search-placeholder',
    );

    searchContainer.append(
      createSearch({
        watermark:
          data.canvassearchwatermark || 'Ask TCS...',
        showNavigation:
          data.shownavigation !== 'false',
        showMicrophone:
          data.showmicrophone !== 'false',
      }),
    );
  }

  const optionsContainer = section.querySelector('.canvas-options');

  const maximumOptions = Number(
    data.maximumoptions || 5,
  );

  for (let i = 1; i <= maximumOptions; i += 1) {
    const pill = document.createElement('button');

    pill.type = 'button';
    pill.className = 'canvas-option-pill';

    pill.textContent = `Option ${i}`;

    optionsContainer.append(pill);
  }
}

/**
 * Main Decorator.
 */
export default function decorate(block) {
  const data = extractData(block);

  const canvasType = data.canvastype?.toLowerCase() || 'search';

  block.textContent = '';

  block.classList.add('canvas');

  const canvasStyle = data.canvasstyle?.toLowerCase()
    ?.replace(/\s+/g, '-')
      || 'default';

  block.classList.add(`canvas-${canvasStyle}`);

  if (canvasType.includes('intent')) {
    renderIntentCanvas(block, data);
    return;
  }

  renderSearchCanvas(block, data);
}
