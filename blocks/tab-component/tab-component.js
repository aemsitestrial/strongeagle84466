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
  const firstRow = block.firstElementChild;

  if (!firstRow) {
    return {
      variant: 'default',
      alignment: 'left',
      backgroundColor: '',
      textColor: '',
    };
  }

  const cells = [...firstRow.children];

  return {
    variant: getValue(cells[0]).toLowerCase() || 'default',
    alignment: getValue(cells[1]).toLowerCase() || 'left',
    backgroundColor: getColor(cells[2]),
    textColor: getColor(cells[3]),
  };
}

function getTabItems(block) {
  const rows = [...block.children].slice(1);

  const tabs = [];

  /*
   * XWalk/container representation:
   *
   * One row can contain:
   *   Title | Content
   *
   * DA representation:
   *
   * Title
   * Content
   *
   * Therefore support both structures.
   */

  let index = 0;

  while (index < rows.length) {
    const row = rows[index];

    if (!row) {
      index += 1;
    } else {
      const cells = [...row.children];

      /*
       * Two-column child item.
       */
      if (cells.length >= 2) {
        const title = getValue(cells[0]);
        const content = getValue(cells[1]);

        if (title) {
          tabs.push({
            title,
            content,
          });
        }

        index += 1;
      } else {
        /*
         * Two-row DA child item.
         *
         * Row 1 = title
         * Row 2 = content
         */
        const title = getValue(cells[0]);

        const contentRow = rows[index + 1];

        const content = contentRow
          ? getValue(contentRow.firstElementChild)
          : '';

        if (title) {
          tabs.push({
            title,
            content,
          });
        }

        index += 2;
      }
    }
  }

  return tabs;
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
  const tabs = getTabItems(block);

  if (!tabs.length) {
    return;
  }

  /*
   * Apply variation.
   */
  block.classList.add(settings.variant);

  /*
   * Apply alignment.
   */
  block.classList.add(`align-${settings.alignment}`);

  /*
   * Apply authored background color.
   */
  if (settings.backgroundColor) {
    block.style.setProperty(
      '--tab-component-background-color',
      settings.backgroundColor,
    );
  }

  /*
   * Apply authored text color.
   */
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
   * Create content.
   */
  const content = document.createElement('div');

  content.className = 'tab-component-content';

  /*
   * Create all tabs dynamically.
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
   * Replace authored rows with final markup.
   */
  block.replaceChildren(tabsList, content);
}
