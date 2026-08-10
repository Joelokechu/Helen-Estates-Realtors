const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const backToTop = document.querySelector('.back-to-top');
const searchTabs = document.querySelectorAll('.search-tab');
const searchForm = document.getElementById('property-search-form');
const searchMessage = document.getElementById('search-message');
const propertyGrid = document.getElementById('property-grid');
const propertiesLoading = document.getElementById('properties-loading');
const propertiesStatus = document.getElementById('properties-status');
const viewAllButton = document.getElementById('view-all-properties');
const newsletterForm = document.getElementById('newsletter-form');
const newsletterMessage = document.getElementById('newsletter-message');

let activeMode = 'buy';
let allProperties = [];
let showingAll = false;
let searchActive = false;

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function closeNavigation() {
  navToggle.classList.remove('active');
  mainNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('nav-open');
}

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  document.body.classList.toggle('nav-open', isOpen);
});

mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
  backToTop.classList.toggle('visible', window.scrollY > 550);
});

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function formatPrice(property) {
  const amount = Number(property.price || 0).toLocaleString('en-GB');
  return property.purpose === 'rent'
    ? `£${amount} <small>pcm</small>`
    : `£${amount}`;
}

function formatPropertyType(value = '') {
  return value.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function savedFavouriteIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem('helen-estates-favourites') || '[]'));
  } catch (_error) {
    return new Set();
  }
}

function toggleFavourite(id, button) {
  const favourites = savedFavouriteIds();
  if (favourites.has(id)) favourites.delete(id);
  else favourites.add(id);
  localStorage.setItem('helen-estates-favourites', JSON.stringify([...favourites]));
  const isSaved = favourites.has(id);
  button.classList.toggle('saved', isSaved);
  button.textContent = isSaved ? '♥' : '♡';
  button.setAttribute('aria-pressed', String(isSaved));
}

function renderPropertyCards(properties) {
  const favourites = savedFavouriteIds();

  if (!properties.length) {
    propertyGrid.innerHTML = '';
    propertiesStatus.hidden = false;
    propertiesStatus.textContent = searchActive
      ? 'No exact matches found. Try widening your search.'
      : 'No properties are currently available.';
    return;
  }

  propertiesStatus.hidden = true;
  propertyGrid.innerHTML = properties.map(property => {
    const image = property.images?.[0] || '/property-1.jpg';
    const isRent = property.purpose === 'rent';
    const saved = favourites.has(property.id);
    return `
      <article class="property-card" data-id="${escapeHTML(property.id)}">
        <div class="property-image">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(property.title)}" loading="lazy" />
          <span class="badge ${isRent ? 'badge-rent' : ''}">${isRent ? 'To rent' : 'For sale'}</span>
          ${property.featured ? '<span class="featured-marker">Featured</span>' : ''}
          <button class="favourite ${saved ? 'saved' : ''}" type="button" data-favourite-id="${escapeHTML(property.id)}" aria-label="Save ${escapeHTML(property.title)}" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button>
        </div>
        <div class="property-body">
          <h3>${escapeHTML(property.title)}</h3>
          <p class="location">${escapeHTML(property.location)}</p>
          <ul class="property-meta" aria-label="Property features">
            <li>${Number(property.bedrooms)} ${Number(property.bedrooms) === 1 ? 'bed' : 'beds'}</li>
            <li>${Number(property.bathrooms)} ${Number(property.bathrooms) === 1 ? 'bath' : 'baths'}</li>
            <li>${Number(property.size).toLocaleString('en-GB')} sq ft</li>
          </ul>
          ${property.description ? `<p class="property-description">${escapeHTML(property.description)}</p>` : ''}
          <p class="price">${formatPrice(property)}</p>
        </div>
      </article>
    `;
  }).join('');
}

function renderDefaultProperties() {
  searchActive = false;
  const featured = allProperties.filter(property => property.featured);
  const defaultProperties = featured.length ? featured : allProperties;
  const visible = showingAll ? allProperties : defaultProperties.slice(0, 4);
  renderPropertyCards(visible);
  viewAllButton.innerHTML = showingAll
    ? 'Show featured <span aria-hidden="true">↑</span>'
    : 'View all properties <span aria-hidden="true">→</span>';
}

propertyGrid.addEventListener('click', event => {
  const favouriteButton = event.target.closest('[data-favourite-id]');
  if (favouriteButton) toggleFavourite(favouriteButton.dataset.favouriteId, favouriteButton);
});

viewAllButton.addEventListener('click', () => {
  showingAll = !showingAll;
  renderDefaultProperties();
});

function setPriceOptions(mode) {
  const minSelect = document.getElementById('min-price');
  const maxSelect = document.getElementById('max-price');

  if (mode === 'rent') {
    minSelect.innerHTML = `
      <option value="0">No min</option>
      <option value="750">£750 pcm</option>
      <option value="1000">£1,000 pcm</option>
      <option value="1500">£1,500 pcm</option>
      <option value="2000">£2,000 pcm</option>`;
    maxSelect.innerHTML = `
      <option value="0">No max</option>
      <option value="1000">£1,000 pcm</option>
      <option value="1500">£1,500 pcm</option>
      <option value="2000">£2,000 pcm</option>
      <option value="3000">£3,000 pcm</option>`;
  } else {
    minSelect.innerHTML = `
      <option value="0">No min</option>
      <option value="150000">£150,000</option>
      <option value="250000">£250,000</option>
      <option value="350000">£350,000</option>
      <option value="500000">£500,000</option>`;
    maxSelect.innerHTML = `
      <option value="0">No max</option>
      <option value="350000">£350,000</option>
      <option value="500000">£500,000</option>
      <option value="750000">£750,000</option>
      <option value="1000000">£1,000,000</option>`;
  }
}

searchTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeMode = tab.dataset.mode;
    searchTabs.forEach(item => {
      const isActive = item === tab;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });

    const buttonLabel = activeMode === 'sell' ? 'Book valuation' : 'Search';
    document.querySelector('.search-button').firstChild.textContent = `${buttonLabel} `;
    searchMessage.classList.remove('show');
    if (activeMode !== 'sell') setPriceOptions(activeMode);
  });
});

searchForm.addEventListener('submit', event => {
  event.preventDefault();

  if (activeMode === 'sell') {
    document.getElementById('valuation').scrollIntoView({ behavior: 'smooth' });
    searchMessage.textContent = 'Let’s arrange a free property valuation.';
    searchMessage.classList.add('show');
    return;
  }

  const location = document.getElementById('location').value.trim().toLowerCase();
  const type = document.getElementById('property-type').value;
  const minPrice = Number(document.getElementById('min-price').value);
  const maxPrice = Number(document.getElementById('max-price').value);
  const bedrooms = document.getElementById('bedrooms').value;

  const matches = allProperties.filter(property => {
    const matchesMode = property.purpose === activeMode;
    const matchesLocation = !location || String(property.location).toLowerCase().includes(location);
    const matchesType = type === 'any' || property.propertyType === type;
    const matchesBeds = bedrooms === 'any' || Number(property.bedrooms) >= Number(bedrooms);
    const price = Number(property.price);
    const matchesMin = !minPrice || price >= minPrice;
    const matchesMax = !maxPrice || price <= maxPrice;
    return matchesMode && matchesLocation && matchesType && matchesBeds && matchesMin && matchesMax;
  });

  searchActive = true;
  renderPropertyCards(matches);
  searchMessage.textContent = matches.length
    ? `${matches.length} matching ${matches.length === 1 ? 'property' : 'properties'} found.`
    : 'No exact matches found. Try widening your search.';
  searchMessage.classList.add('show');
  document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
});

async function loadProperties() {
  try {
    const response = await fetch('/api/properties');
    if (!response.ok) throw new Error('Could not load properties.');
    allProperties = await response.json();
    propertiesLoading?.remove();
    renderDefaultProperties();
  } catch (error) {
    if (propertiesLoading) propertiesLoading.textContent = 'Properties are temporarily unavailable.';
    console.error(error);
  }
}

newsletterForm.addEventListener('submit', event => {
  event.preventDefault();
  const emailInput = document.getElementById('newsletter-email');
  newsletterMessage.textContent = `Thanks — updates will be sent to ${emailInput.value}.`;
  newsletterForm.reset();
});

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const duration = 1100;
    const start = performance.now();

    function updateCounter(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(target * eased).toLocaleString('en-GB');
      if (progress < 1) requestAnimationFrame(updateCounter);
    }

    requestAnimationFrame(updateCounter);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.45 });

counters.forEach(counter => counterObserver.observe(counter));
document.getElementById('current-year').textContent = new Date().getFullYear();
setPriceOptions('buy');
loadProperties();
