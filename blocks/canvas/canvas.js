function renderSearchCanvas(
  block,
  data,
  showNavigation,
  showMicrophone,
) {
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-search';

  wrapper.innerHTML = `
    ${
  showNavigation
    ? `
      <button class="canvas-menu-btn" aria-label="Navigation Menu">
        ${
  data.menuicon
    ? `${data.menuicon}`
    : '☰'
}
      </button>
    `
    : ''
}

    <div class="canvas-search-container">
      <div class="canvas-search-input">
        <span class="canvas-placeholder">
          ${data.searchwatermark || 'Ask TCS...'}
        </span>

        <div class="canvas-controls">
          ${
  showMicrophone
    ? `
            <button class="canvas-mic-btn" aria-label="Microphone">
              🎤
            </button>
          `
    : ''
}

          <button class="canvas-submit-btn" aria-label="Submit">
            →
          </button>
        </div>
      </div>
    </div>
  `;

  block.append(wrapper);
}

function renderIntentCanvas(
  block,
  data,
  showNavigation,
  showMicrophone,
  enableSearch,
) {
  const wrapper = document.createElement('section');
  wrapper.className = 'canvas-intent';

  wrapper.innerHTML = `
    <div class="canvas-glow canvas-glow-yellow"></div>
    <div class="canvas-glow canvas-glow-blue"></div>

    <div class="canvas-intent-content">

      ${
  data.canvastitle
    ? `
        <h2 class="canvas-title">
          ${data.canvastitle}
        </h2>
      `
    : ''
}

      ${
  data.canvasdescription
    ? `
        <div class="canvas-description">
          ${data.canvasdescription}
        </div>
      `
    : ''
}

      ${
  enableSearch
    ? `
        <div class="canvas-intent-search">
          ${
  showNavigation
    ? `
            <button class="canvas-menu-btn">
              ${data.menuicon ? `${data.menuicon}` : '☰'}
            </button>
          `
    : ''
}

          <div class="canvas-search-container">
            <div class="canvas-search-input">
              <span class="canvas-placeholder">
                ${data.searchwatermark || 'Ask TCS...'}
              </span>

              <div class="canvas-controls">

                ${
  showMicrophone
    ? `
                  <button class="canvas-mic-btn">
                    🎤
                  </button>
                `
    : ''
}

                <button class="canvas-submit-btn">
                  →
                </button>

              </div>
            </div>
          </div>
        </div>
      `
    : ''
}

      <div class="canvas-options"></div>

    </div>
  `;

  block.append(wrapper);

  const optionsContainer = wrapper.querySelector('.canvas-options');

  [...block.querySelectorAll('.canvas-option')].forEach((item) => {
    const label = item.dataset.optionlabel
      || item.querySelector('h1,h2,h3,h4,h5,h6,p')?.textContent
      || item.textContent;

    const link = item.dataset.optionlink || '#';

    const option = document.createElement('a');

    option.className = 'canvas-option-pill';
    option.href = link;
    option.textContent = label;

    optionsContainer.append(option);
  });
}

export default async function decorate(block) {
  const data = Object.fromEntries(
    [...block.children].map((row) => {
      const cells = [...row.children];
      return [
        cells[0]?.textContent?.trim(),
        cells[1]?.textContent?.trim(),
      ];
    }),
  );

  const canvasType = data.canvastype || 'search';
  const showNavigation = data.shownavigation !== 'false';
  const showMicrophone = data.showmicrophone !== 'false';
  const enableSearch = data.enablesearch !== 'false';
  const canvasStyle = data.canvasstyle || 'default';

  block.innerHTML = '';

  block.classList.add(`canvas-${canvasType}`);
  block.classList.add(`canvas-${canvasStyle}`);

  if (canvasType === 'search') {
    renderSearchCanvas(
      block,
      data,
      showNavigation,
      showMicrophone,
    );
    return;
  }

  renderIntentCanvas(
    block,
    data,
    showNavigation,
    showMicrophone,
    enableSearch,
  );
}
