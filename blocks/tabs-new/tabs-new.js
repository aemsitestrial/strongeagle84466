function createTabButton(title, index, blockId) {
  const button = document.createElement('button');

  button.className = 'tabs-new-tab';
  button.type = 'button';
  button.id = `${blockId}-tab-${index}`;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', `${blockId}-panel-${index}`);
  button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

  if (index === 0) {
    button.classList.add('active');
  }

  button.textContent = title;

  return button;
}

function createTabPanel(content, index, blockId) {
  const panel = document.createElement('div');

  panel.className = 'tabs-new-panel';
  panel.id = `${blockId}-panel-${index}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `${blockId}-tab-${index}`);
  panel.tabIndex = 0;

  if (index !== 0) {
    panel.hidden = true;
  }

  const contentWrapper = document.createElement('div');

  contentWrapper.className = 'tabs-new-content';

  contentWrapper.innerHTML = content;

  panel.append(contentWrapper);

  return panel;
}

function activateTab(block, index) {
  const buttons = [
    ...block.querySelectorAll('.tabs-new-tab'),
  ];

  const panels = [
    ...block.querySelectorAll('.tabs-new-panel'),
  ];

  buttons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;

    button.classList.toggle('active', active);
    button.setAttribute(
      'aria-selected',
      active ? 'true' : 'false',
    );
  });

  panels.forEach((panel, panelIndex) => {
    const active = panelIndex === index;

    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}

function setupTabs(block) {
  const buttons = [
    ...block.querySelectorAll('.tabs-new-tab'),
  ];

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      activateTab(block, index);
    });

    button.addEventListener('keydown', (event) => {
      let newIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          newIndex = (index + 1) % buttons.length;
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          newIndex = (index - 1 + buttons.length) % buttons.length;
          break;

        case 'Home':
          newIndex = 0;
          break;

        case 'End':
          newIndex = buttons.length - 1;
          break;

        default:
          return;
      }

      event.preventDefault();

      buttons[newIndex].focus();
      activateTab(block, newIndex);
    });
  });
}

function getTabData(props) {
  const tabs = [];

  for (let index = 1; index < props.length; index += 2) {
    const titleElement = props[index];
    const teaserElement = props[index + 1];

    if (titleElement && teaserElement) {
      const title = titleElement.textContent.trim();
      const content = teaserElement.innerHTML.trim();

      if (title && content) {
        tabs.push({
          title,
          content,
        });
      }
    }
  }

  return tabs;
}

function createScrollableControls(block, navigation) {
  const previous = document.createElement('button');
  const next = document.createElement('button');

  previous.className = 'tabs-new-scroll-button tabs-new-scroll-button-prev';
  next.className = 'tabs-new-scroll-button tabs-new-scroll-button-next';

  previous.type = 'button';
  next.type = 'button';

  previous.setAttribute('aria-label', 'Previous tabs');
  next.setAttribute('aria-label', 'Next tabs');

  previous.innerHTML = '&#8249;';
  next.innerHTML = '&#8250;';

  previous.addEventListener('click', () => {
    navigation.scrollBy({
      left: -250,
      behavior: 'smooth',
    });
  });

  next.addEventListener('click', () => {
    navigation.scrollBy({
      left: 250,
      behavior: 'smooth',
    });
  });

  block.append(previous);
  block.append(next);
}

export default function decorate(block) {
  const props = [
    ...block.children,
  ].map((row) => row.firstElementChild);

  const tabs = getTabData(props);

  if (!tabs.length) {
    return;
  }

  const blockId = `tabs-new-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const tabsDOM = document.createDocumentFragment();

  const navigation = document.createElement('div');

  navigation.className = 'tabs-new-navigation';
  navigation.setAttribute('role', 'tablist');
  navigation.setAttribute('aria-label', 'Tabs');

  const panels = document.createElement('div');

  panels.className = 'tabs-new-panels';

  tabs.forEach((tab, index) => {
    const button = createTabButton(
      tab.title,
      index,
      blockId,
    );

    const panel = createTabPanel(
      tab.content,
      index,
      blockId,
    );

    navigation.append(button);
    panels.append(panel);
  });

  tabsDOM.append(navigation);
  tabsDOM.append(panels);

  block.textContent = '';
  block.append(tabsDOM);

  setupTabs(block);

  if (block.classList.contains('scrollable')) {
    createScrollableControls(block, navigation);
  }
}
