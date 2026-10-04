// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

let cardsBlockCount = 0;

function createMetadata(card) {
  const metadata = document.createElement('div');
  metadata.className = 'cards-v1-metadata';

  if (card.primaryTag) {
    const tag = document.createElement('span');
    tag.className = 'cards-v1-tag';
    tag.textContent = card.primaryTag;
    metadata.append(tag);
  }

  if (card.secondaryTag) {
    const tag = document.createElement('span');
    tag.className = 'cards-v1-tag';
    tag.textContent = card.secondaryTag;
    metadata.append(tag);
  }

  if (card.readTime) {
    const readTime = document.createElement('span');
    readTime.className = 'cards-v1-read-time';
    readTime.textContent = card.readTime;
    metadata.append(readTime);
  }

  return metadata.childElementCount ? metadata : null;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'cards-v1-card';

  if (card.picture) {
    const imageContainer = document.createElement('div');
    imageContainer.className = `cards-v1-image-container ${card.imageRatio}`;

    imageContainer.append(card.picture);
    article.append(imageContainer);
  }

  const content = document.createElement('div');
  content.className = 'cards-v1-content-container';

  const metadata = createMetadata(card);

  if (metadata) {
    content.append(metadata);
  }

  if (card.overline) {
    const overline = document.createElement('div');
    overline.className = 'cards-v1-overline';
    overline.textContent = card.overline;
    content.append(overline);
  }

  if (card.title) {
    const title = document.createElement('h3');
    title.className = 'cards-v1-title';
    title.textContent = card.title;
    content.append(title);
  }

  if (card.description) {
    const description = document.createElement('div');
    description.className = 'cards-v1-description';
    description.innerHTML = card.description;
    content.append(description);
  }

  if (card.ctaLabel && card.ctaLink) {
    const cta = document.createElement('a');
    cta.className = 'cards-v1-cta';
    cta.href = card.ctaLink;
    cta.textContent = card.ctaLabel;
    cta.setAttribute('aria-label', card.ctaLabel);

    content.append(cta);
  }

  article.append(content);

  return article;
}

export default async function decorate(block) {
  cardsBlockCount += 1;

  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

  const sectionTitle = rows[0]?.textContent?.trim() || '';

  const classRow = rows[1];

  const classes = classRow
    ? [...classRow.querySelectorAll('li')]
      .map((item) => item.textContent.trim().toLowerCase())
      .filter(Boolean)
    : ['light'];

  block.classList.add(...classes);

  const container = document.createElement('div');
  container.className = 'cards-v1-container';
  container.id = `cards-v1-${cardsBlockCount}`;

  if (sectionTitle) {
    const header = document.createElement('div');
    header.className = 'cards-v1-header';

    const heading = document.createElement('h2');
    heading.className = 'cards-v1-section-title';
    heading.textContent = sectionTitle;

    header.append(heading);
    container.append(header);

    moveInstrumentation(heading, null);
  }

  const grid = document.createElement('div');
  grid.className = 'cards-v1-grid';

  const cardsContainer = rows[rows.length - 1];

  if (cardsContainer) {
    const cardRows = [
      ...cardsContainer.querySelectorAll(':scope > div > div'),
    ];

    cardRows.forEach((cardRow) => {
      const cols = [...cardRow.children];

      if (cols.length < 10) {
        return;
      }

      const imageCell = cols[0];
      const picture = imageCell?.querySelector('picture');

      const card = {
        picture: picture ? picture.cloneNode(true) : null,
        imageRatio: cols[2]?.textContent?.trim() || 'ratio-16-9',
        primaryTag: cols[3]?.textContent?.trim() || '',
        secondaryTag: cols[4]?.textContent?.trim() || '',
        readTime: cols[5]?.textContent?.trim() || '',
        overline: cols[6]?.textContent?.trim() || '',
        title: cols[7]?.textContent?.trim() || '',
        description: cols[8]?.innerHTML || '',
        ctaLabel: cols[9]?.textContent?.trim() || '',
        ctaLink: cols[10]?.textContent?.trim() || '',
      };

      grid.append(createCard(card));
    });
  }

  container.append(grid);

  block.textContent = '';
  block.append(container);
}
