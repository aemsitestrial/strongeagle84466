// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

let cardsBlockCount = 0;

export default async function decorate(block) {
  cardsBlockCount += 1;

  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

  const container = document.createElement('div');
  container.className = 'cards-v1-container';
  container.id = `cards-v1-${cardsBlockCount}`;

  const firstRow = rows[0];

  const sectionTitleElement = firstRow?.querySelector(
    'h1, h2, h3, h4, h5, h6, p',
  );

  if (sectionTitleElement) {
    const header = document.createElement('div');
    header.className = 'cards-v1-header';

    const heading = document.createElement('h2');
    heading.className = 'cards-v1-section-title';
    heading.textContent = sectionTitleElement.textContent.trim();

    header.append(heading);
    container.append(header);

    moveInstrumentation(heading, null);
  }

  const classRow = rows[1];

  if (classRow) {
    const classes = [...classRow.querySelectorAll('li')]
      .map((item) => item.textContent.trim().toLowerCase())
      .filter(Boolean);

    block.classList.add(...classes);
  }

  const grid = document.createElement('div');
  grid.className = 'cards-v1-grid';

  rows.slice(2).forEach((item) => {
    item.classList.add('cards-v1-card');
    grid.append(item);
  });

  container.append(grid);

  block.textContent = '';
  block.append(container);
}
