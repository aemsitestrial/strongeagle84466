function createMetadata(card) {
  const items = [];

  if (card.primaryTag) {
    items.push(
      `<span class="cards-v1-tag">${card.primaryTag}</span>`,
    );
  }

  if (card.secondaryTag) {
    items.push(
      `<span class="cards-v1-tag">${card.secondaryTag}</span>`,
    );
  }

  if (card.readTime) {
    items.push(
      `<span class="cards-v1-read-time">${card.readTime}</span>`,
    );
  }

  if (!items.length) {
    return '';
  }

  return `
    <div class="cards-v1-metadata">
      ${items.join('')}
    </div>
  `;
}

function createCTA(label, link) {
  if (!label || !link) {
    return '';
  }

  return `
    <a
      class="cards-v1-cta"
      href="${link}"
      aria-label="${label}"
    >
      ${label}
    </a>
  `;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'cards-v1-card';

  const imageMarkup = card.image
    ? `
<div class="cards-v1-image-container ${card.imageRatio}">
${card.image}
</div>
`
    : '';
  const metadataMarkup = createMetadata(card);

  const overlineMarkup = card.overline
    ? `
      <div class="cards-v1-overline">
        ${card.overline}
      </div>
    `
    : '';

  const titleMarkup = card.title
    ? `
      <h3 class="cards-v1-title">
        ${card.title}
      </h3>
    `
    : '';

  const descriptionMarkup = card.description
    ? `
      <div class="cards-v1-description">
        ${card.description}
      </div>
    `
    : '';

  const ctaMarkup = createCTA(card.ctaLabel, card.ctaLink);

  article.innerHTML = `
    ${imageMarkup}

    <div class="cards-v1-content-container">
      ${metadataMarkup}
      ${overlineMarkup}
      ${titleMarkup}
      ${descriptionMarkup}
      ${ctaMarkup}
    </div>
  `;

  return article;
}

export default function decorate(block) {
  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

  // Row 1 - Section Title
  const sectionTitle = rows[0]?.textContent?.trim() || '';

  // Row 2 - Theme Classes
  const classRow = rows[1];

  const classes = classRow
    ? [...classRow.querySelectorAll('li')]
      .map((item) => item.textContent.trim().toLowerCase())
      .filter(Boolean)
    : ['light'];

  // Remaining rows are cards
  const cardRows = rows.slice(2);

  block.innerHTML = '';

  block.classList.add(...classes);

  const container = document.createElement('div');
  container.className = 'cards-v1-container';

  const header = document.createElement('div');
  header.className = 'cards-v1-header';

  if (sectionTitle) {
    header.innerHTML = `
      <h2 class="cards-v1-section-title">
        ${sectionTitle}
      </h2>
    `;
  }

  const grid = document.createElement('div');
  grid.className = 'cards-v1-grid';

  cardRows.forEach((row) => {
    const cols = [...row.children];

    const imageCell = cols[0];
    const picture = imageCell?.querySelector('picture');

    const card = {
      image: picture ? picture.outerHTML : '',
      imageRatio:
                cols[2]?.textContent?.trim() || 'ratio-16-9',

      primaryTag:
                cols[3]?.textContent?.trim() || '',

      secondaryTag:
                cols[4]?.textContent?.trim() || '',

      readTime:
                cols[5]?.textContent?.trim() || '',

      overline:
                cols[6]?.textContent?.trim() || '',

      title:
                cols[7]?.textContent?.trim() || '',

      description:
                cols[8]?.innerHTML || '',

      ctaLabel:
                cols[9]?.textContent?.trim() || '',

      ctaLink:
                cols[10]?.textContent?.trim() || '',
    };

    grid.append(createCard(card));
  });

  container.append(header);
  container.append(grid);

  block.append(container);
}
