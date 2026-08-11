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
const ticketForm = document.getElementById('ticket-form');
const ticketStatus = document.getElementById('ticket-message-status');
const ticketReference = document.getElementById('ticket-property-reference');
const ticketBudgetLabel = document.getElementById('ticket-budget-label');
const ticketConfirmation = document.getElementById('ticket-confirmation');
const confirmationName = document.getElementById('confirmation-name');
const confirmationReference = document.getElementById('confirmation-reference');
const confirmationEmailNote = document.getElementById('confirmation-email-note');
const confirmationStatusLink = document.getElementById('confirmation-status-link');
const newRequestButton = document.getElementById('new-request-button');
const publicConfig = window.HELEN_ESTATES_CONFIG || {};
const backendConfigured = Boolean(
  publicConfig.supabaseUrl &&
  publicConfig.supabasePublicKey &&
  !String(publicConfig.supabaseUrl).includes('YOUR_') &&
  !String(publicConfig.supabasePublicKey).includes('YOUR_')
);

/*
  FRONTEND / BACKEND BRIDGE
  -------------------------
  The public site stays on GitHub Pages. Supabase stores published properties and
  property-request tickets. Customer tickets are created through an Edge Function
  so private database credentials and ticket access tokens never live in the browser.
*/
const BACKEND = {
  enabled: backendConfigured,

  async getPublishedProperties() {
    const base = String(publicConfig.supabaseUrl).replace(/\/$/, '');
    const url = new URL(`${base}/rest/v1/properties`);
    url.searchParams.set('select', 'id,title,purpose,property_type,location,bedrooms,bathrooms,size,price,currency,price_period,featured,status,images,created_at');
    url.searchParams.set('published', 'eq.true');
    url.searchParams.set('order', 'featured.desc,created_at.desc');

    const response = await fetch(url, {
      headers: {
        apikey: publicConfig.supabasePublicKey,
        Authorization: `Bearer ${publicConfig.supabasePublicKey}`
      }
    });
    if (!response.ok) throw new Error('Could not load published properties.');
    const rows = await response.json();
    return rows.map(row => ({
      ...row,
      propertyType: row.property_type,
      pricePeriod: row.price_period
    }));
  },

  async createTicket(ticket) {
    const base = String(publicConfig.supabaseUrl).replace(/\/$/, '');
    const response = await fetch(`${base}/functions/v1/create-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: publicConfig.supabasePublicKey,
        Authorization: `Bearer ${publicConfig.supabasePublicKey}`
      },
      body: JSON.stringify(ticket)
    });

    let payload = {};
    try { payload = await response.json(); } catch (_error) {}
    if (!response.ok) throw new Error(payload.error || 'Could not submit your request.');
    return payload;
  }
};

const DEMO_PROPERTIES = [
  {
    id: 'HER-001',
    title: 'Contemporary Pool Villa',
    purpose: 'buy',
    propertyType: 'house',
    location: 'Soufrière',
    bedrooms: 4,
    bathrooms: 4,
    size: 2800,
    price: 875000,
    currency: 'USD',
    featured: true,
    status: 'Available',
    images: ['property-1.jpg']
  },
  {
    id: 'HER-002',
    title: 'Waterfront Two Bedroom Apartment',
    purpose: 'rent',
    propertyType: 'apartment',
    location: 'Rodney Bay',
    bedrooms: 2,
    bathrooms: 2,
    size: 1050,
    price: 2200,
    currency: 'USD',
    pricePeriod: 'month',
    featured: true,
    status: 'Available',
    images: ['property-2.jpg']
  },
  {
    id: 'HER-003',
    title: 'Family Home with Garden',
    purpose: 'buy',
    propertyType: 'house',
    location: 'Gros Islet',
    bedrooms: 3,
    bathrooms: 2,
    size: 1850,
    price: 465000,
    currency: 'USD',
    featured: true,
    status: 'Available',
    images: ['property-3.jpg']
  },
  {
    id: 'HER-004',
    title: 'Bright One Bedroom Apartment',
    purpose: 'rent',
    propertyType: 'apartment',
    location: 'Marigot Bay',
    bedrooms: 1,
    bathrooms: 1,
    size: 720,
    price: 1450,
    currency: 'USD',
    pricePeriod: 'month',
    featured: true,
    status: 'Available',
    images: ['property-4.jpg']
  }
];

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
  header.classList.toggle('scrolled', window.scrollY > 24);
  backToTop.classList.toggle('visible', window.scrollY > 580);
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function formatPrice(property) {
  const currency = property.currency || 'USD';
  let value;
  try {
    value = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(Number(property.price || 0));
  } catch (_error) {
    value = `${currency} ${Number(property.price || 0).toLocaleString('en-US')}`;
  }
  return property.pricePeriod ? `${value} <small>/ ${escapeHTML(property.pricePeriod)}</small>` : value;
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
      ? 'No exact matches found. Try widening your search or open a property request and we can look for you.'
      : 'No properties are currently published.';
    return;
  }

  propertiesStatus.hidden = true;
  propertyGrid.innerHTML = properties.map(property => {
    const image = property.images?.[0] || 'property-1.jpg';
    const isRent = property.purpose === 'rent';
    const saved = favourites.has(property.id);
    const meta = [
      property.bedrooms ? `${Number(property.bedrooms)} ${Number(property.bedrooms) === 1 ? 'bed' : 'beds'}` : '',
      property.bathrooms ? `${Number(property.bathrooms)} ${Number(property.bathrooms) === 1 ? 'bath' : 'baths'}` : '',
      property.size ? `${Number(property.size).toLocaleString('en-US')} sq ft` : ''
    ].filter(Boolean);

    return `
      <article class="property-card" data-id="${escapeHTML(property.id)}">
        <div class="property-image">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(property.title)}" loading="lazy" />
          <span class="badge ${isRent ? 'badge-rent' : ''}">${isRent ? 'To rent' : 'For sale'}</span>
          ${property.featured ? '<span class="featured-marker">Featured</span>' : ''}
          <button class="favourite ${saved ? 'saved' : ''}" type="button" data-favourite-id="${escapeHTML(property.id)}" aria-label="Save ${escapeHTML(property.title)}" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button>
        </div>
        <div class="property-body">
          <p class="property-kicker">${escapeHTML(property.id)} · ${escapeHTML(property.status || 'Available')}</p>
          <h3>${escapeHTML(property.title)}</h3>
          <p class="location">${escapeHTML(property.location)}</p>
          <ul class="property-meta" aria-label="Property features">${meta.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
          <div class="property-bottom">
            <p class="price">${formatPrice(property)}</p>
            <button class="property-enquire" type="button" data-enquire-property="${escapeHTML(property.id)}">Enquire →</button>
          </div>
        </div>
      </article>`;
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
  if (favouriteButton) {
    toggleFavourite(favouriteButton.dataset.favouriteId, favouriteButton);
    return;
  }

  const enquireButton = event.target.closest('[data-enquire-property]');
  if (enquireButton) {
    const id = enquireButton.dataset.enquireProperty;
    const property = allProperties.find(item => item.id === id);
    ticketReference.value = id;
    selectRequestType(property?.purpose || 'buy');
    document.getElementById('ticket-message').value = `I'm interested in ${property?.title || 'this property'} (${id}). Please contact me with more information.`;
    document.getElementById('request').scrollIntoView({ behavior: 'smooth' });
  }
});

viewAllButton.addEventListener('click', () => {
  showingAll = !showingAll;
  renderDefaultProperties();
});

function setPriceOptions(mode) {
  const minSelect = document.getElementById('min-price');
  const maxSelect = document.getElementById('max-price');

  const rentMin = [[0, 'No min'], [750, 'US$750'], [1200, 'US$1,200'], [2000, 'US$2,000'], [3000, 'US$3,000']];
  const rentMax = [[0, 'No max'], [1500, 'US$1,500'], [2500, 'US$2,500'], [4000, 'US$4,000'], [6000, 'US$6,000']];
  const buyMin = [[0, 'No min'], [150000, 'US$150,000'], [300000, 'US$300,000'], [500000, 'US$500,000'], [750000, 'US$750,000']];
  const buyMax = [[0, 'No max'], [350000, 'US$350,000'], [600000, 'US$600,000'], [1000000, 'US$1,000,000'], [2000000, 'US$2,000,000']];
  const makeOptions = options => options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');

  minSelect.innerHTML = makeOptions(mode === 'rent' ? rentMin : buyMin);
  maxSelect.innerHTML = makeOptions(mode === 'rent' ? rentMax : buyMax);
}

function setSearchMode(mode) {
  activeMode = mode === 'rent' ? 'rent' : 'buy';
  searchTabs.forEach(tab => {
    const isActive = tab.dataset.mode === activeMode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  setPriceOptions(activeMode);
  searchMessage.classList.remove('show');
}

searchTabs.forEach(tab => tab.addEventListener('click', () => setSearchMode(tab.dataset.mode)));

document.querySelectorAll('[data-filter-link]').forEach(link => {
  link.addEventListener('click', () => {
    setSearchMode(link.dataset.filterLink);
    setTimeout(() => {
      const matches = allProperties.filter(property => property.purpose === activeMode);
      searchActive = true;
      renderPropertyCards(matches);
    }, 50);
  });
});

searchForm.addEventListener('submit', event => {
  event.preventDefault();

  const location = document.getElementById('location').value.trim().toLowerCase();
  const type = document.getElementById('property-type').value;
  const minPrice = Number(document.getElementById('min-price').value);
  const maxPrice = Number(document.getElementById('max-price').value);
  const bedrooms = document.getElementById('bedrooms').value;

  const matches = allProperties.filter(property => {
    const matchesMode = property.purpose === activeMode;
    const matchesLocation = !location || String(property.location).toLowerCase().includes(location);
    const matchesType = type === 'any' || property.propertyType === type;
    const matchesBeds = bedrooms === 'any' || Number(property.bedrooms || 0) >= Number(bedrooms);
    const price = Number(property.price || 0);
    const matchesMin = !minPrice || price >= minPrice;
    const matchesMax = !maxPrice || price <= maxPrice;
    return matchesMode && matchesLocation && matchesType && matchesBeds && matchesMin && matchesMax;
  });

  searchActive = true;
  renderPropertyCards(matches);
  searchMessage.textContent = matches.length
    ? `${matches.length} matching ${matches.length === 1 ? 'property' : 'properties'} found.`
    : 'No exact matches found. You can open a property request and we can look for you.';
  searchMessage.classList.add('show');
  document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
});

function selectRequestType(type) {
  const normalized = ['buy', 'rent', 'sell'].includes(type) ? type : 'buy';
  const input = ticketForm.querySelector(`input[name="requestType"][value="${normalized}"]`);
  if (input) input.checked = true;
  updateTicketLabels();
}

function updateTicketLabels() {
  const type = ticketForm.querySelector('input[name="requestType"]:checked')?.value || 'buy';
  ticketBudgetLabel.childNodes[0].nodeValue = type === 'sell' ? 'Expected price / valuation range' : 'Budget / target price';
  document.getElementById('ticket-location').placeholder = type === 'sell'
    ? 'Where is the property located?'
    : 'Where would you like to live / invest?';
}

ticketForm.querySelectorAll('input[name="requestType"]').forEach(input => input.addEventListener('change', updateTicketLabels));
document.querySelectorAll('[data-request-link]').forEach(link => link.addEventListener('click', () => selectRequestType(link.dataset.requestLink)));

function makePreviewTicketReference() {
  const date = new Date();
  const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HER-${stamp}-${suffix}`;
}

function savePreviewTicket(ticket) {
  const existing = JSON.parse(localStorage.getItem('helen-estates-demo-tickets') || '[]');
  existing.unshift(ticket);
  localStorage.setItem('helen-estates-demo-tickets', JSON.stringify(existing.slice(0, 30)));
}

function showTicketConfirmation({ name, reference, email, emailSent, statusUrl }) {
  ticketForm.hidden = true;
  ticketConfirmation.hidden = false;
  confirmationName.textContent = name || 'there';
  confirmationReference.textContent = reference || '—';

  if (emailSent) {
    confirmationEmailNote.textContent = `A receipt has been sent to ${email}. Keep it for your reference.`;
  } else {
    confirmationEmailNote.textContent = `Your request is safely recorded. We could not confirm the receipt email, so please save your reference number.`;
  }

  if (statusUrl) {
    confirmationStatusLink.href = statusUrl;
    confirmationStatusLink.hidden = false;
  } else {
    confirmationStatusLink.hidden = true;
  }

  ticketConfirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

newRequestButton?.addEventListener('click', () => {
  ticketConfirmation.hidden = true;
  ticketForm.hidden = false;
  ticketStatus.className = 'ticket-message';
  ticketStatus.textContent = '';
  ticketForm.reset();
  selectRequestType('buy');
  ticketReference.value = '';
  ticketForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

ticketForm.addEventListener('submit', async event => {
  event.preventDefault();
  ticketStatus.className = 'ticket-message';
  ticketStatus.textContent = '';

  const submitButton = ticketForm.querySelector('.ticket-submit');
  const formData = new FormData(ticketForm);
  const ticket = {
    requestType: formData.get('requestType'),
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    contactMethod: formData.get('contactMethod'),
    location: String(formData.get('location') || '').trim(),
    propertyType: formData.get('propertyType'),
    budget: String(formData.get('budget') || '').trim(),
    bedrooms: formData.get('bedrooms'),
    message: String(formData.get('message') || '').trim(),
    propertyReference: String(formData.get('propertyReference') || '').trim(),
    website: String(formData.get('website') || '').trim()
  };

  const isLocalPreview = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending request…';

    if (BACKEND.enabled) {
      const result = await BACKEND.createTicket(ticket);
      showTicketConfirmation({
        name: ticket.name,
        reference: result.reference,
        email: ticket.email,
        emailSent: Boolean(result.emailSent),
        statusUrl: result.statusUrl || ''
      });
    } else if (isLocalPreview) {
      const previewReference = makePreviewTicketReference();
      savePreviewTicket({ ...ticket, id: previewReference, status: 'new', createdAt: new Date().toISOString() });
      ticketStatus.textContent = `Preview mode: ${previewReference} was saved only in this browser. Connect Supabase before using this form with real customers.`;
      ticketStatus.classList.add('show', 'success');
    } else {
      throw new Error('The online request desk is not connected yet. Please try again once the service is enabled.');
    }
  } catch (error) {
    console.error(error);
    ticketStatus.textContent = error.message || 'We could not submit your request. Please try again shortly.';
    ticketStatus.classList.add('show', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit property request <span aria-hidden="true">→</span>';
  }
});

async function loadProperties() {
  try {
    if (BACKEND.enabled) {
      allProperties = await BACKEND.getPublishedProperties();
    } else {
      allProperties = DEMO_PROPERTIES;
    }
  } catch (error) {
    console.error(error);
    allProperties = DEMO_PROPERTIES;
  }

  propertiesLoading?.remove();
  renderDefaultProperties();
}

document.getElementById('current-year').textContent = new Date().getFullYear();
setPriceOptions('buy');
updateTicketLabels();
loadProperties();
