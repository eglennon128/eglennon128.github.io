const DATA_PATHS = {
  drone: 'content/portfolio-drone.json',
  gis: 'content/portfolio-gis.json'
};

function createCard(item) {
  const article = document.createElement('article');
  article.className = 'group portfolio-card';
  article.dataset.type = item.type || 'misc';
  article.dataset.itemId = item.id || '';

  const media = document.createElement('div');
  media.className = 'card-media';
  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.alt || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  media.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.title;
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = item.description || '';
  body.appendChild(title);
  body.appendChild(desc);

  if (item.cta && item.cta.href && item.cta.label) {
    const cta = document.createElement('a');
    cta.className = 'inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 link-underline mt-4';
    cta.href = item.cta.href;
    cta.textContent = item.cta.label;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.classList.add('h-5', 'w-5', 'transition-transform', 'group-hover:translate-x-0.5');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 18l6-6-6-6');
    icon.appendChild(path);
    cta.appendChild(icon);
    body.appendChild(cta);
  }

  article.appendChild(media);
  article.appendChild(body);
  return article;
}

async function loadPortfolio(sectionId, type) {
  const section = document.querySelector(sectionId);
  if (!section) return;
  let list = section.querySelector('[data-dynamic-list]');
  if (!list && section.matches('[data-dynamic-list]')) {
    list = section;
  }
  if (!list) return;

  try {
    const response = await fetch(DATA_PATHS[type]);
    if (!response.ok) throw new Error(`Failed to load ${type} data`);
    const items = await response.json();

    const existingIds = new Set(Array.from(list.querySelectorAll('[data-item-id]')).map((el) => el.dataset.itemId));

    items.forEach((item) => {
      if (existingIds.has(item.id)) return;
      const card = createCard(item);
      card.dataset.stacked = 'dynamic';
      list.appendChild(card);
    });
  } catch (error) {
    console.warn('Portfolio data failed to load', error);
    const notice = document.createElement('div');
    notice.className = 'mt-4 text-sm text-red-600';
    notice.textContent = 'Additional projects will appear here once the site is fully loaded. Please try again later.';
    list.appendChild(notice);
  }
}

export function initDynamicPortfolio() {
  loadPortfolio('#drone-portfolio-grid', 'drone');
  loadPortfolio('#gis-portfolio-grid', 'gis');
}
