// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

let cardsBlockCount = 0;

function createCard(cardItem) {
  const card = document.createElement('article');
  card.className = 'cards-v1-card';

  const cells = [...cardItem.children];

  const picture = cardItem.querySelector('picture');

  const imageRatio = cells[0]?.textContent?.trim() || 'ratio-16-9';
  const title = cells[cells.length - 1]?.textContent?.trim() || '';

  if (picture) {
    const imageContainer = document.createElement('div');
    imageContainer.className = `cards-v1-image-container ${imageRatio}`;

    imageContainer.append(picture.cloneNode(true));

    card.append(imageContainer);
  }

  const content = document.createElement('div');
  content.className = 'cards-v1-content-container';

  if (title) {
    const heading = document.createElement('h3');
    heading.className = 'cards-v1-title';
    heading.textContent = title;

    content.append(heading);
  }

  card.append(content);

  return card;
}

export default async function decorate(block) {
  cardsBlockCount += 1;

  const rows = [...block.children];

  const sectionTitleRow = rows[0];
  const classesRow = rows[1];
  const cardItems = rows.slice(2);

  const sectionTitle = sectionTitleRow?.textContent?.trim() || '';

  if (classesRow) {
    const classes = [...classesRow.querySelectorAll('li')]
      .map((item) => item.textContent.trim().toLowerCase())
      .filter(Boolean);

    block.classList.add(...classes);
  }

  const container = document.createElement('div');
  container.className = 'cards-v1-container';
  container.id = `cards-v1-${cardsBlockCount}`;

  if (sectionTitle) {
    const header = document.createElement('div');
    header.className = 'cards-v1-header';

    const heading = document.createElement('h2');
    heading.className = 'cards-v1-section-title';
    heading.textContent = sectionTitle;

    moveInstrumentation(heading, null);

    header.append(heading);
    container.append(header);
  }

  const grid = document.createElement('div');
  grid.className = 'cards-v1-grid';

  cardItems.forEach((cardItem) => {
    grid.append(createCard(cardItem));
  });

  container.append(grid);

  block.textContent = '';
  block.append(container);
}
