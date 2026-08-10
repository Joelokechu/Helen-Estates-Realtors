const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const appShell = document.getElementById('app-shell');
const logoutButton = document.getElementById('logout-button');
const propertyList = document.getElementById('property-admin-list');
const emptyState = document.getElementById('empty-state');
const propertyForm = document.getElementById('property-form');
const propertyFormMessage = document.getElementById('property-form-message');
const imageInput = document.getElementById('images');
const uploadZone = document.getElementById('upload-zone');
const newImagePreview = document.getElementById('new-image-preview');
const existingImages = document.getElementById('existing-images');
const existingImageGrid = document.getElementById('existing-image-grid');
const replaceImages = document.getElementById('replace-images');
const adminSearch = document.getElementById('admin-search');
const adminFilter = document.getElementById('admin-filter');
const purposeSelect = document.getElementById('purpose');
const priceLabel = document.getElementById('price-label');
const toast = document.getElementById('toast');

let properties = [];
let editingProperty = null;
let toastTimer;

const views = {
  dashboard: document.getElementById('dashboard-view'),
  editor: document.getElementById('editor-view')
};

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  let payload = {};
  try {
    payload = await response.json();
  } catch (_error) {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showView(name) {
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle('active', key === name);
  });
  document.querySelectorAll('.side-link[data-section]').forEach(button => {
    button.classList.toggle('active', button.dataset.section === name);
  });
  document.getElementById('page-title').textContent = name === 'dashboard'
    ? 'Dashboard'
    : editingProperty ? 'Edit property' : 'Add property';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatPrice(property) {
  const amount = Number(property.price || 0).toLocaleString('en-GB');
  return property.purpose === 'rent' ? `£${amount} pcm` : `£${amount}`;
}

function propertyTypeLabel(value = '') {
  return value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function updateStats() {
  document.getElementById('stat-total').textContent = properties.length;
  document.getElementById('stat-buy').textContent = properties.filter(property => property.purpose === 'buy').length;
  document.getElementById('stat-rent').textContent = properties.filter(property => property.purpose === 'rent').length;
  document.getElementById('stat-featured').textContent = properties.filter(property => property.featured).length;
}

function filteredProperties() {
  const term = adminSearch.value.trim().toLowerCase();
  const filter = adminFilter.value;

  return properties.filter(property => {
    const searchable = `${property.title} ${property.location} ${property.propertyType}`.toLowerCase();
    const matchesTerm = !term || searchable.includes(term);
    const matchesFilter = filter === 'all'
      || property.purpose === filter
      || (filter === 'featured' && property.featured);
    return matchesTerm && matchesFilter;
  });
}

function renderProperties() {
  const visibleProperties = filteredProperties();
  emptyState.hidden = visibleProperties.length > 0;

  propertyList.innerHTML = visibleProperties.map(property => {
    const image = property.images?.[0] || '/property-1.jpg';
    const badge = property.purpose === 'rent' ? 'To rent' : 'For sale';
    return `
      <article class="admin-property-row" data-id="${escapeHTML(property.id)}">
        <img src="${escapeHTML(image)}" alt="" />
        <div class="property-main">
          <h3>${escapeHTML(property.title)}</h3>
          <p>${escapeHTML(property.location)}</p>
          <span class="listing-badge ${property.purpose === 'rent' ? 'rent' : ''}">${badge}</span>
          ${property.featured ? '<span class="featured-pill">★ Featured</span>' : ''}
        </div>
        <div class="property-meta-admin">
          <strong>${escapeHTML(propertyTypeLabel(property.propertyType))}</strong>
          <small>${Number(property.bedrooms)} bed · ${Number(property.bathrooms)} bath · ${Number(property.size).toLocaleString('en-GB')} sq ft</small>
        </div>
        <div class="property-price">
          <strong>${escapeHTML(formatPrice(property))}</strong>
          <small>Updated ${new Date(property.updatedAt || property.createdAt).toLocaleDateString('en-GB')}</small>
        </div>
        <div class="row-actions">
          <button class="icon-button edit" type="button" data-action="edit" aria-label="Edit ${escapeHTML(property.title)}">✎</button>
          <button class="icon-button delete" type="button" data-action="delete" aria-label="Delete ${escapeHTML(property.title)}">⌫</button>
        </div>
      </article>
    `;
  }).join('');
}

async function loadProperties() {
  properties = await api('/api/admin/properties');
  updateStats();
  renderProperties();
}

function setFormMessage(message = '', type = '') {
  propertyFormMessage.textContent = message;
  propertyFormMessage.className = `form-message ${type}`;
}

function updatePriceLabel() {
  priceLabel.textContent = purposeSelect.value === 'rent' ? 'Monthly rent (£) *' : 'Sale price (£) *';
}

function renderExistingImages(property) {
  const images = property?.images || [];
  existingImages.hidden = images.length === 0;
  existingImageGrid.innerHTML = images.map((image, index) => `
    <div class="image-preview">
      <img src="${escapeHTML(image)}" alt="Current property image ${index + 1}" />
      <span>${index === 0 ? 'Cover image' : `Image ${index + 1}`}</span>
    </div>
  `).join('');
}

function renderNewImagePreview(files) {
  newImagePreview.innerHTML = '';
  [...files].slice(0, 8).forEach((file, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-preview';
    const img = document.createElement('img');
    img.alt = `New property image ${index + 1}`;
    const label = document.createElement('span');
    label.textContent = index === 0 ? 'New cover image' : file.name;
    wrapper.append(img, label);
    newImagePreview.append(wrapper);

    const reader = new FileReader();
    reader.addEventListener('load', () => { img.src = reader.result; });
    reader.readAsDataURL(file);
  });
}

function resetForm() {
  editingProperty = null;
  propertyForm.reset();
  document.getElementById('property-id').value = '';
  document.getElementById('bedrooms-input').value = 3;
  document.getElementById('bathrooms-input').value = 2;
  document.getElementById('featured').checked = true;
  purposeSelect.value = 'buy';
  replaceImages.checked = false;
  existingImages.hidden = true;
  existingImageGrid.innerHTML = '';
  newImagePreview.innerHTML = '';
  document.getElementById('editor-kicker').textContent = 'New listing';
  document.getElementById('editor-title').textContent = 'Add a property';
  document.getElementById('save-property').textContent = 'Publish property';
  setFormMessage();
  updatePriceLabel();
}

function startAddProperty() {
  resetForm();
  showView('editor');
}

function startEditProperty(property) {
  editingProperty = property;
  document.getElementById('property-id').value = property.id;
  document.getElementById('title').value = property.title || '';
  purposeSelect.value = property.purpose || 'buy';
  document.getElementById('propertyType').value = property.propertyType || 'house';
  document.getElementById('property-location').value = property.location || '';
  document.getElementById('price').value = property.price ?? '';
  document.getElementById('bedrooms-input').value = property.bedrooms ?? 0;
  document.getElementById('bathrooms-input').value = property.bathrooms ?? 0;
  document.getElementById('size').value = property.size ?? 0;
  document.getElementById('description').value = property.description || '';
  document.getElementById('featured').checked = Boolean(property.featured);
  imageInput.value = '';
  newImagePreview.innerHTML = '';
  replaceImages.checked = false;
  document.getElementById('editor-kicker').textContent = 'Edit listing';
  document.getElementById('editor-title').textContent = property.title;
  document.getElementById('save-property').textContent = 'Save changes';
  renderExistingImages(property);
  setFormMessage();
  updatePriceLabel();
  showView('editor');
}

async function deleteProperty(property) {
  const confirmed = window.confirm(`Delete “${property.title}”? This removes it from the website and cannot be undone.`);
  if (!confirmed) return;

  try {
    await api(`/api/admin/properties/${encodeURIComponent(property.id)}`, { method: 'DELETE' });
    properties = properties.filter(item => item.id !== property.id);
    updateStats();
    renderProperties();
    showToast('Property deleted.');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginMessage.textContent = 'Signing in…';
  loginMessage.className = 'form-message';

  try {
    await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('admin-password').value })
    });
    loginForm.reset();
    loginScreen.hidden = true;
    appShell.hidden = false;
    await loadProperties();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = 'form-message error';
  }
});

logoutButton.addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST' }); } catch (_error) {}
  appShell.hidden = true;
  loginScreen.hidden = false;
});

document.querySelectorAll('.side-link[data-section]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.section === 'editor') startAddProperty();
    else showView('dashboard');
  });
});

document.getElementById('add-property-top').addEventListener('click', startAddProperty);
document.getElementById('cancel-edit').addEventListener('click', () => {
  resetForm();
  showView('dashboard');
});

purposeSelect.addEventListener('change', updatePriceLabel);
adminSearch.addEventListener('input', renderProperties);
adminFilter.addEventListener('change', renderProperties);

propertyList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('[data-id]');
  const property = properties.find(item => item.id === row.dataset.id);
  if (!property) return;

  if (button.dataset.action === 'edit') startEditProperty(property);
  if (button.dataset.action === 'delete') deleteProperty(property);
});

imageInput.addEventListener('change', () => {
  if (imageInput.files.length > 8) {
    showToast('You can upload a maximum of 8 images.', 'error');
    imageInput.value = '';
    newImagePreview.innerHTML = '';
    return;
  }
  renderNewImagePreview(imageInput.files);
});

['dragenter', 'dragover'].forEach(eventName => {
  uploadZone.addEventListener(eventName, event => {
    event.preventDefault();
    uploadZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  uploadZone.addEventListener(eventName, event => {
    event.preventDefault();
    uploadZone.classList.remove('dragover');
  });
});

uploadZone.addEventListener('drop', event => {
  const files = [...event.dataTransfer.files].filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)).slice(0, 8);
  const transfer = new DataTransfer();
  files.forEach(file => transfer.items.add(file));
  imageInput.files = transfer.files;
  renderNewImagePreview(files);
});

async function filesToPayload(fileList) {
  const files = [...fileList];
  if (files.length > 8) throw new Error('You can upload a maximum of 8 images.');

  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error(`${file.name} is larger than 8 MB.`));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve({
      name: file.name,
      type: file.type,
      data: reader.result
    }));
    reader.addEventListener('error', () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  })));
}

propertyForm.addEventListener('submit', async event => {
  event.preventDefault();
  setFormMessage('Saving property…');

  if (!editingProperty && imageInput.files.length === 0) {
    setFormMessage('Please upload at least one property image.', 'error');
    return;
  }

  try {
    const imagePayloads = await filesToPayload(imageInput.files);
    const payload = {
      title: document.getElementById('title').value,
      purpose: purposeSelect.value,
      propertyType: document.getElementById('propertyType').value,
      location: document.getElementById('property-location').value,
      price: Number(document.getElementById('price').value),
      bedrooms: Number(document.getElementById('bedrooms-input').value),
      bathrooms: Number(document.getElementById('bathrooms-input').value),
      size: Number(document.getElementById('size').value),
      description: document.getElementById('description').value,
      featured: document.getElementById('featured').checked,
      replaceImages: replaceImages.checked,
      images: imagePayloads
    };

    const isEdit = Boolean(editingProperty);
    const url = isEdit
      ? `/api/admin/properties/${encodeURIComponent(editingProperty.id)}`
      : '/api/admin/properties';
    const saved = await api(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (isEdit) {
      properties = properties.map(property => property.id === saved.id ? saved : property);
    } else {
      properties.unshift(saved);
    }

    updateStats();
    renderProperties();
    resetForm();
    showView('dashboard');
    showToast(isEdit ? 'Property updated and published.' : 'Property published to the website.');
  } catch (error) {
    if (error.status === 401) {
      appShell.hidden = true;
      loginScreen.hidden = false;
    }
    setFormMessage(error.message, 'error');
  }
});

(async function boot() {
  updatePriceLabel();
  try {
    const session = await api('/api/admin/session');
    if (session.authenticated) {
      loginScreen.hidden = true;
      appShell.hidden = false;
      await loadProperties();
    }
  } catch (_error) {
    // Login screen remains visible.
  }
})();
