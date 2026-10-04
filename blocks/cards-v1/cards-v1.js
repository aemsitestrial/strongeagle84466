// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

let cardsBlockCount = 0;

export default async function decorate(block) {
  cardsBlockCount += 1;

  const rows = [...block.children];

  const container = document.createElement('div');
  container.className = 'cards-v1-container';
  container.id = `cards-v1-${cardsBlockCount}`;

  const titleRow = rows[0];

  if (titleRow) {
    const heading = document.createElement('h2');
    heading.className = 'cards-v1-section-title';
    heading.textContent = titleRow.textContent.trim();

    const header = document.createElement('div');
    header.className = 'cards-v1-header';
    header.append(heading);

    moveInstrumentation(heading, null);

    container.append(header);
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
