function getValue(element) {
  if (!element) return '';

  const input = element.querySelector('input, textarea, select');

  if (input) {
    return input.value?.trim() || '';
  }

  return element.textContent?.trim() || '';
}

function getColor(element) {
  if (!element) return '';

  const input = element.querySelector('input');

  if (input?.value) {
    return input.value.trim();
  }

  return element.textContent?.trim() || '';
}

function getSettings(block) {
  const settingsRows = [...block.children].filter(
    (child) => !child.classList.contains('tab-item'),
  );

  return {
    variant: getValue(settingsRows[0]).toLowerCase() || 'default',
    alignment: getValue(settingsRows[1]).toLowerCase() || 'left',
    backgroundColor: getColor(settingsRows[2]),
    textColor: getColor(settingsRows[3]),
  };
}

function getTabItems(block) {
  return [...block.children].filter(
    (child) => child.classList.contains('tab-item'),
  );
}

function getTabData(item) {
  const fields = [...item.children];

  return {
    title: getValue(fields[0]),
    content: getValue(fields[1]),
  };
}

function createTabButton(tab, index) {
  const button = document.createElement('button');

  button.className = 'tab-component-tab';
  button.type = 'button';

  button.setAttribute('role', 'tab');
  button.setAttribute(
    'aria-selected',
    index === 0 ? 'true' : 'false',
  );

  button.setAttribute(
    'aria-controls',
    `tab-component-panel-${index}`,
  );

  button.id = `tab-component-tab-${index}`;

  button.textContent = tab.title;

  if (index === 0) {
    button.classList.add('is-active');
  }

  return button;
}

function createTabPanel(tab, index) {
  const panel = document.createElement('div');

  panel.className = 'tab-component-panel';

  panel.id = `tab-component-panel-${index}`;

  panel.setAttribute('role', 'tabpanel');

  panel.setAttribute(
    'aria-labelledby',
    `tab-component-tab-${index}`,
  );

  if (index !== 0) {
    panel.hidden = true;
  }

  if (tab.content) {
    panel.textContent = tab.content;
  }

  return panel;
}

function activateTab(block, index) {
  const buttons = [
    ...block.querySelectorAll('.tab-component-tab'),
  ];

  const panels = [
    ...block.querySelectorAll('.tab-component-panel'),
  ];

  buttons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;

    button.classList.toggle('is-active', active);

    button.setAttribute(
      'aria-selected',
      active ? 'true' : 'false',
    );
  });

  panels.forEach((panel, panelIndex) => {
    panel.hidden = panelIndex !== index;
  });
}

export default function decorate(block) {
  const settings = getSettings(block);

  const tabs = getTabItems(block)
    .map(getTabData)
    .filter((tab) => tab.title);

  if (!tabs.length) {
    return;
  }

  /*
   * Add the authored variation and alignment
   * as classes on the block.
   */
  block.classList.add(settings.variant);
  block.classList.add(`align-${settings.alignment}`);

  /*
   * Apply authored colors as CSS variables.
   */
  if (settings.backgroundColor) {
    block.style.setProperty(
      '--tab-component-background-color',
      settings.backgroundColor,
    );
  }

  if (settings.textColor) {
    block.style.setProperty(
      '--tab-component-text-color',
      settings.textColor,
    );
  }

  /*
   * Create tab navigation.
   */
  const tabsList = document.createElement('div');

  tabsList.className = 'tab-component-list';

  tabsList.setAttribute('role', 'tablist');

  /*
   * Create tab content container.
   */
  const content = document.createElement('div');

  content.className = 'tab-component-content';

  /*
   * Create all tabs dynamically.
   *
   * This means there is no fixed limit of
   * three tabs.
   */
  tabs.forEach((tab, index) => {
    const button = createTabButton(tab, index);
    const panel = createTabPanel(tab, index);

    button.addEventListener('click', () => {
      activateTab(block, index);
    });

    tabsList.append(button);
    content.append(panel);
  });

  /*
   * Replace the authored structure with
   * the final Tabs markup.
   */
  block.replaceChildren(tabsList, content);
}
