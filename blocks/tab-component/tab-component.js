function getText(element) {
  return element?.textContent?.trim() || '';
}

function getValue(element) {
  if (!element) return '';

  const input = element.querySelector('input, textarea, select');

  if (input) {
    return input.value?.trim() || '';
  }

  return getText(element);
}

function getColor(element) {
  if (!element) return '';

  const input = element.querySelector('input');

  if (input?.value) {
    return input.value.trim();
  }

  return getText(element);
}

function getTabData(block) {
  const rows = [...block.children];

  const values = rows.map((row) => row.firstElementChild);

  const variant = getValue(values[0]).toLowerCase() || 'default';
  const alignment = getValue(values[1]).toLowerCase() || 'left';
  const backgroundColor = getColor(values[2]);
  const textColor = getColor(values[3]);

  const tabs = [
    {
      title: getValue(values[4]),
      content: getValue(values[5]),
    },
    {
      title: getValue(values[6]),
      content: getValue(values[7]),
    },
    {
      title: getValue(values[8]),
      content: getValue(values[9]),
    },
  ].filter((tab) => tab.title);

  return {
    variant,
    alignment,
    backgroundColor,
    textColor,
    tabs,
  };
}

function createTabButton(tab, index) {
  const button = document.createElement('button');

  button.className = 'tab-component-tab';
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
  button.setAttribute('aria-controls', `tab-component-panel-${index}`);
  button.id = `tab-component-tab-${index}`;

  button.textContent = tab.title;

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

    button.setAttribute(
      'aria-selected',
      active ? 'true' : 'false',
    );

    button.classList.toggle('is-active', active);
  });

  panels.forEach((panel, panelIndex) => {
    panel.hidden = panelIndex !== index;
  });
}

export default function decorate(block) {
  const data = getTabData(block);

  if (!data.tabs.length) {
    return;
  }

  block.classList.add(data.variant);
  block.classList.add(`align-${data.alignment}`);

  if (data.backgroundColor) {
    block.style.setProperty(
      '--tab-component-background-color',
      data.backgroundColor,
    );
  }

  if (data.textColor) {
    block.style.setProperty(
      '--tab-component-text-color',
      data.textColor,
    );
  }

  const tabsList = document.createElement('div');

  tabsList.className = 'tab-component-list';
  tabsList.setAttribute('role', 'tablist');

  const content = document.createElement('div');

  content.className = 'tab-component-content';

  data.tabs.forEach((tab, index) => {
    const button = createTabButton(tab, index);
    const panel = createTabPanel(tab, index);

    if (index === 0) {
      button.classList.add('is-active');
    }

    button.addEventListener('click', () => {
      activateTab(block, index);
    });

    tabsList.append(button);
    content.append(panel);
  });

  block.replaceChildren(tabsList, content);
}
