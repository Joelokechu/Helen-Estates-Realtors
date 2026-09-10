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

const publicConfig = window.HELEN_ESTATES_CONFIG || {};

const PROPERTY_BUCKET = 'property-images';

let properties = [];
let editingProperty = null;
let toastTimer;


/* =========================================================
   SUPABASE SETUP
   ========================================================= */

const configReady = Boolean(
  publicConfig.supabaseUrl &&
  publicConfig.supabasePublicKey &&
  !String(publicConfig.supabaseUrl).includes('YOUR_') &&
  !String(publicConfig.supabasePublicKey).includes('YOUR_')
);

if (!configReady) {
  console.error(
    'Helen Estates Supabase configuration is missing.'
  );
}

if (!window.supabase) {
  console.error(
    'Supabase JavaScript library could not be loaded.'
  );
}

const supabaseClient =
  configReady && window.supabase
    ? window.supabase.createClient(
        publicConfig.supabaseUrl,
        publicConfig.supabasePublicKey
      )
    : null;


/* =========================================================
   VIEWS
   ========================================================= */

const views = {
  dashboard: document.getElementById('dashboard-view'),
  editor: document.getElementById('editor-view')
};


/* =========================================================
   HELPERS
   ========================================================= */

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

  toast.className =
    `toast show ${
      type === 'error'
        ? 'error'
        : ''
    }`;

  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}


function setLoginMessage(message = '', type = '') {
  loginMessage.textContent = message;
  loginMessage.className =
    `form-message ${type}`;
}


function setFormMessage(message = '', type = '') {
  propertyFormMessage.textContent = message;
  propertyFormMessage.className =
    `form-message ${type}`;
}


function formatPrice(property) {
  const currency =
    property.currency || 'USD';

  let value;

  try {
    value =
      new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency,
          maximumFractionDigits: 0
        }
      ).format(
        Number(property.price || 0)
      );
  } catch (_error) {
    value =
      `${currency} ${Number(
        property.price || 0
      ).toLocaleString('en-US')}`;
  }

  if (
    property.purpose === 'rent'
  ) {
    return `${value} / month`;
  }

  return value;
}


function propertyTypeLabel(value = '') {
  return String(value)
    .split('-')
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ');
}


function normaliseProperty(row) {
  return {
    ...row,

    propertyType:
      row.property_type,

    pricePeriod:
      row.price_period,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at
  };
}


function generatePropertyReference() {
  const date = new Date();

  const stamp = [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, '0'),

    String(
      date.getDate()
    ).padStart(2, '0')
  ].join('');

  let suffix;

  if (
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    suffix =
      window.crypto
        .randomUUID()
        .replaceAll('-', '')
        .slice(0, 6)
        .toUpperCase();
  } else {
    suffix =
      Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();
  }

  return `HER-P-${stamp}-${suffix}`;
}


function showLogin() {
  appShell.hidden = true;
  loginScreen.hidden = false;
}


function showApplication() {
  loginScreen.hidden = true;
  appShell.hidden = false;
}


/* =========================================================
   ADMIN AUTHORISATION
   ========================================================= */

async function getAuthorizedAdmin() {
  if (!supabaseClient) {
    throw new Error(
      'Supabase is not configured correctly.'
    );
  }

  const {
    data: userData,
    error: userError
  } =
    await supabaseClient.auth.getUser();

  if (
    userError ||
    !userData?.user
  ) {
    return null;
  }

  const user =
    userData.user;

  const {
    data: adminRecord,
    error: adminError
  } =
    await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq(
        'user_id',
        user.id
      )
      .maybeSingle();

  if (adminError) {
    throw adminError;
  }

  if (!adminRecord) {
    return null;
  }

  return user;
}


/* =========================================================
   VIEW MANAGEMENT
   ========================================================= */

function showView(name) {
  Object
    .entries(views)
    .forEach(
      ([key, element]) => {

        element.classList.toggle(
          'active',
          key === name
        );

      }
    );

  document
    .querySelectorAll(
      '.side-link[data-section]'
    )
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.section === name
      );

    });

  document.getElementById(
    'page-title'
  ).textContent =
    name === 'dashboard'
      ? 'Dashboard'
      : editingProperty
        ? 'Edit property'
        : 'Add property';

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================================
   PROPERTY DASHBOARD
   ========================================================= */

function updateStats() {
  document.getElementById(
    'stat-total'
  ).textContent =
    properties.length;

  document.getElementById(
    'stat-buy'
  ).textContent =
    properties.filter(
      property =>
        property.purpose === 'buy'
    ).length;

  document.getElementById(
    'stat-rent'
  ).textContent =
    properties.filter(
      property =>
        property.purpose === 'rent'
    ).length;

  document.getElementById(
    'stat-featured'
  ).textContent =
    properties.filter(
      property =>
        property.featured
    ).length;
}


function filteredProperties() {
  const term =
    adminSearch
      .value
      .trim()
      .toLowerCase();

  const filter =
    adminFilter.value;

  return properties.filter(
    property => {

      const searchable =
        `${
          property.title || ''
        } ${
          property.location || ''
        } ${
          property.propertyType || ''
        }`
          .toLowerCase();

      const matchesTerm =
        !term ||
        searchable.includes(term);

      const matchesFilter =
        filter === 'all' ||
        property.purpose === filter ||
        (
          filter === 'featured' &&
          property.featured
        );

      return (
        matchesTerm &&
        matchesFilter
      );
    }
  );
}


function renderProperties() {
  const visibleProperties =
    filteredProperties();

  emptyState.hidden =
    visibleProperties.length > 0;

  propertyList.innerHTML =
    visibleProperties
      .map(property => {

        const image =
          property.images?.[0] ||
          'property-1.jpg';

        const badge =
          property.purpose === 'rent'
            ? 'To rent'
            : 'For sale';

        const updatedDate =
          property.updatedAt ||
          property.createdAt;

        return `
          <article
            class="admin-property-row"
            data-id="${escapeHTML(
              property.id
            )}"
          >

            <img
              src="${escapeHTML(image)}"
              alt=""
            />

            <div class="property-main">

              <h3>
                ${escapeHTML(
                  property.title
                )}
              </h3>

              <p>
                ${escapeHTML(
                  property.location
                )}
              </p>

              <span
                class="listing-badge ${
                  property.purpose ===
                  'rent'
                    ? 'rent'
                    : ''
                }"
              >
                ${badge}
              </span>

              ${
                property.featured
                  ? '<span class="featured-pill">★ Featured</span>'
                  : ''
              }

            </div>


            <div class="property-meta-admin">

              <strong>
                ${escapeHTML(
                  propertyTypeLabel(
                    property.propertyType
                  )
                )}
              </strong>

              <small>
                ${Number(
                  property.bedrooms || 0
                )} bed
                ·
                ${Number(
                  property.bathrooms || 0
                )} bath
                ·
                ${Number(
                  property.size || 0
                ).toLocaleString(
                  'en-US'
                )} sq ft
              </small>

            </div>


            <div class="property-price">

              <strong>
                ${escapeHTML(
                  formatPrice(property)
                )}
              </strong>

              <small>
                ${
                  updatedDate
                    ? `Updated ${
                        new Date(
                          updatedDate
                        ).toLocaleDateString(
                          'en-GB'
                        )
                      }`
                    : ''
                }
              </small>

            </div>


            <div class="row-actions">

              <button
                class="icon-button edit"
                type="button"
                data-action="edit"
                aria-label="Edit ${escapeHTML(
                  property.title
                )}"
              >
                ✎
              </button>

              <button
                class="icon-button delete"
                type="button"
                data-action="delete"
                aria-label="Delete ${escapeHTML(
                  property.title
                )}"
              >
                ⌫
              </button>

            </div>

          </article>
        `;
      })
      .join('');
}


async function loadProperties() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from('properties')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {
    throw error;
  }

  properties =
    (data || [])
      .map(normaliseProperty);

  updateStats();
  renderProperties();
}


/* =========================================================
   PROPERTY EDITOR
   ========================================================= */

function updatePriceLabel() {
  priceLabel.textContent =
    purposeSelect.value === 'rent'
      ? 'Monthly rent (USD) *'
      : 'Sale price (USD) *';
}


function renderExistingImages(property) {
  const images =
    property?.images || [];

  existingImages.hidden =
    images.length === 0;

  existingImageGrid.innerHTML =
    images
      .map(
        (image, index) => `
          <div class="image-preview">

            <img
              src="${escapeHTML(image)}"
              alt="Current property image ${
                index + 1
              }"
            />

            <span>
              ${
                index === 0
                  ? 'Cover image'
                  : `Image ${
                      index + 1
                    }`
              }
            </span>

          </div>
        `
      )
      .join('');
}


function renderNewImagePreview(files) {
  newImagePreview.innerHTML = '';

  [...files]
    .slice(0, 8)
    .forEach(
      (file, index) => {

        const wrapper =
          document.createElement(
            'div'
          );

        wrapper.className =
          'image-preview';

        const img =
          document.createElement(
            'img'
          );

        img.alt =
          `New property image ${
            index + 1
          }`;

        const label =
          document.createElement(
            'span'
          );

        label.textContent =
          index === 0
            ? 'New cover image'
            : file.name;

        wrapper.append(
          img,
          label
        );

        newImagePreview.append(
          wrapper
        );

        const reader =
          new FileReader();

        reader.addEventListener(
          'load',
          () => {
            img.src =
              reader.result;
          }
        );

        reader.readAsDataURL(
          file
        );
      }
    );
}


function resetForm() {
  editingProperty = null;

  propertyForm.reset();

  document.getElementById(
    'property-id'
  ).value = '';

  document.getElementById(
    'bedrooms-input'
  ).value = 3;

  document.getElementById(
    'bathrooms-input'
  ).value = 2;

  document.getElementById(
    'featured'
  ).checked = true;

  purposeSelect.value = 'buy';

  replaceImages.checked = false;

  existingImages.hidden = true;

  existingImageGrid.innerHTML = '';

  newImagePreview.innerHTML = '';

  imageInput.value = '';

  document.getElementById(
    'editor-kicker'
  ).textContent =
    'New listing';

  document.getElementById(
    'editor-title'
  ).textContent =
    'Add a property';

  document.getElementById(
    'save-property'
  ).textContent =
    'Publish property';

  setFormMessage();

  updatePriceLabel();
}


function startAddProperty() {
  resetForm();
  showView('editor');
}


function startEditProperty(property) {
  editingProperty =
    property;

  document.getElementById(
    'property-id'
  ).value =
    property.id;

  document.getElementById(
    'title'
  ).value =
    property.title || '';

  purposeSelect.value =
    property.purpose || 'buy';

  document.getElementById(
    'propertyType'
  ).value =
    property.propertyType ||
    'house';

  document.getElementById(
    'property-location'
  ).value =
    property.location || '';

  document.getElementById(
    'price'
  ).value =
    property.price ?? '';

  document.getElementById(
    'bedrooms-input'
  ).value =
    property.bedrooms ?? 0;

  document.getElementById(
    'bathrooms-input'
  ).value =
    property.bathrooms ?? 0;

  document.getElementById(
    'size'
  ).value =
    property.size ?? 0;

  document.getElementById(
    'description'
  ).value =
    property.description || '';

  document.getElementById(
    'featured'
  ).checked =
    Boolean(
      property.featured
    );

  imageInput.value = '';

  newImagePreview.innerHTML = '';

  replaceImages.checked = false;

  document.getElementById(
    'editor-kicker'
  ).textContent =
    'Edit listing';

  document.getElementById(
    'editor-title'
  ).textContent =
    property.title;

  document.getElementById(
    'save-property'
  ).textContent =
    'Save changes';

  renderExistingImages(
    property
  );

  setFormMessage();

  updatePriceLabel();

  showView('editor');
}


/* =========================================================
   SUPABASE STORAGE
   ========================================================= */

function validateImageFiles(files) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (files.length > 8) {
    throw new Error(
      'You can upload a maximum of 8 images.'
    );
  }

  for (const file of files) {

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      throw new Error(
        `${file.name} is not a supported image type.`
      );
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      throw new Error(
        `${file.name} is larger than 8 MB.`
      );
    }
  }
}


function getFileExtension(file) {
  const name =
    String(file.name || '');

  const extension =
    name.includes('.')
      ? name
          .split('.')
          .pop()
          .toLowerCase()
      : '';

  if (extension) {
    return extension;
  }

  if (
    file.type === 'image/png'
  ) {
    return 'png';
  }

  if (
    file.type === 'image/webp'
  ) {
    return 'webp';
  }

  return 'jpg';
}


async function uploadPropertyImages(
  propertyId,
  fileList
) {
  const files =
    [...fileList];

  validateImageFiles(files);

  const urls = [];

  for (
    let index = 0;
    index < files.length;
    index += 1
  ) {
    const file =
      files[index];

    const extension =
      getFileExtension(file);

    const randomPart =
      window.crypto?.randomUUID
        ? window.crypto
            .randomUUID()
            .replaceAll('-', '')
            .slice(0, 12)
        : Math.random()
            .toString(36)
            .slice(2, 14);

    const path =
      `${propertyId}/` +
      `${Date.now()}-` +
      `${index}-` +
      `${randomPart}.` +
      `${extension}`;

    const {
      data,
      error
    } =
      await supabaseClient
        .storage
        .from(PROPERTY_BUCKET)
        .upload(
          path,
          file,
          {
            cacheControl:
              '3600',

            upsert: false,

            contentType:
              file.type
          }
        );

    if (error) {
      throw error;
    }

    const {
      data: publicUrlData
    } =
      supabaseClient
        .storage
        .from(PROPERTY_BUCKET)
        .getPublicUrl(
          data.path
        );

    urls.push(
      publicUrlData.publicUrl
    );
  }

  return urls;
}


function storagePathFromPublicUrl(url) {
  const marker =
    `/storage/v1/object/public/` +
    `${PROPERTY_BUCKET}/`;

  const position =
    String(url)
      .indexOf(marker);

  if (position === -1) {
    return null;
  }

  const encodedPath =
    String(url)
      .slice(
        position +
        marker.length
      );

  try {
    return decodeURIComponent(
      encodedPath
    );
  } catch (_error) {
    return encodedPath;
  }
}


async function deleteStoredImages(urls) {
  const paths =
    (urls || [])
      .map(
        storagePathFromPublicUrl
      )
      .filter(Boolean);

  if (!paths.length) {
    return;
  }

  const {
    error
  } =
    await supabaseClient
      .storage
      .from(PROPERTY_BUCKET)
      .remove(paths);

  if (error) {
    console.warn(
      'Could not remove one or more stored images:',
      error
    );
  }
}


/* =========================================================
   DELETE PROPERTY
   ========================================================= */

async function deleteProperty(property) {
  const confirmed =
    window.confirm(
      `Delete “${property.title}”? ` +
      `This removes it from the website and cannot be undone.`
    );

  if (!confirmed) {
    return;
  }

  try {

    const {
      error
    } =
      await supabaseClient
        .from('properties')
        .delete()
        .eq(
          'id',
          property.id
        );

    if (error) {
      throw error;
    }

    await deleteStoredImages(
      property.images
    );

    properties =
      properties.filter(
        item =>
          item.id !==
          property.id
      );

    updateStats();
    renderProperties();

    showToast(
      'Property deleted.'
    );

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      'Could not delete the property.',
      'error'
    );

  }
}


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    setLoginMessage(
      'Signing in…'
    );

    if (!supabaseClient) {
      setLoginMessage(
        'Supabase is not configured correctly.',
        'error'
      );

      return;
    }

    const email =
      document
        .getElementById(
          'admin-email'
        )
        .value
        .trim();

    const password =
      document
        .getElementById(
          'admin-password'
        )
        .value;

    try {

      const {
        error: loginError
      } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email,
            password
          });

      if (loginError) {
        throw loginError;
      }

      const admin =
        await getAuthorizedAdmin();

      if (!admin) {

        await supabaseClient
          .auth
          .signOut();

        throw new Error(
          'This account is not authorised to access the Helen Estates Realtors admin area.'
        );
      }

      loginForm.reset();

      setLoginMessage();

      showApplication();

      await loadProperties();

    } catch (error) {

      console.error(error);

      showLogin();

      setLoginMessage(
        error.message ||
        'Could not sign in.',
        'error'
      );

    }
  }
);


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton.addEventListener(
  'click',
  async () => {

    try {

      if (supabaseClient) {
        await supabaseClient
          .auth
          .signOut();
      }

    } catch (error) {

      console.error(error);

    }

    properties = [];

    propertyList.innerHTML = '';

    updateStats();

    showLogin();

    loginForm.reset();

    setLoginMessage();
  }
);


/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    '.side-link[data-section]'
  )
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        if (
          button.dataset.section ===
          'editor'
        ) {
          startAddProperty();
        } else {
          showView(
            'dashboard'
          );
        }

      }
    );

  });


document
  .getElementById(
    'add-property-top'
  )
  .addEventListener(
    'click',
    startAddProperty
  );


document
  .getElementById(
    'cancel-edit'
  )
  .addEventListener(
    'click',
    () => {

      resetForm();

      showView(
        'dashboard'
      );

    }
  );


purposeSelect.addEventListener(
  'change',
  updatePriceLabel
);


adminSearch.addEventListener(
  'input',
  renderProperties
);


adminFilter.addEventListener(
  'change',
  renderProperties
);


/* =========================================================
   PROPERTY ROW ACTIONS
   ========================================================= */

propertyList.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-action]'
      );

    if (!button) {
      return;
    }

    const row =
      button.closest(
        '[data-id]'
      );

    if (!row) {
      return;
    }

    const property =
      properties.find(
        item =>
          item.id ===
          row.dataset.id
      );

    if (!property) {
      return;
    }

    if (
      button.dataset.action ===
      'edit'
    ) {
      startEditProperty(
        property
      );
    }

    if (
      button.dataset.action ===
      'delete'
    ) {
      deleteProperty(
        property
      );
    }
  }
);


/* =========================================================
   IMAGE SELECTION
   ========================================================= */

imageInput.addEventListener(
  'change',
  () => {

    try {

      validateImageFiles(
        [...imageInput.files]
      );

      renderNewImagePreview(
        imageInput.files
      );

    } catch (error) {

      showToast(
        error.message,
        'error'
      );

      imageInput.value = '';

      newImagePreview.innerHTML = '';

    }
  }
);


[
  'dragenter',
  'dragover'
].forEach(
  eventName => {

    uploadZone.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        uploadZone.classList.add(
          'dragover'
        );

      }
    );

  }
);


[
  'dragleave',
  'drop'
].forEach(
  eventName => {

    uploadZone.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        uploadZone.classList.remove(
          'dragover'
        );

      }
    );

  }
);


uploadZone.addEventListener(
  'drop',
  event => {

    try {

      const files =
        [...event.dataTransfer.files]
          .filter(
            file =>
              [
                'image/jpeg',
                'image/png',
                'image/webp'
              ].includes(
                file.type
              )
          )
          .slice(0, 8);

      validateImageFiles(files);

      const transfer =
        new DataTransfer();

      files.forEach(
        file =>
          transfer.items.add(
            file
          )
      );

      imageInput.files =
        transfer.files;

      renderNewImagePreview(
        files
      );

    } catch (error) {

      showToast(
        error.message,
        'error'
      );

    }
  }
);


/* =========================================================
   SAVE PROPERTY
   ========================================================= */

propertyForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    if (!supabaseClient) {
      setFormMessage(
        'Supabase is not configured correctly.',
        'error'
      );

      return;
    }

    setFormMessage(
      'Saving property…'
    );

    const selectedFiles =
      [...imageInput.files];

    if (
      !editingProperty &&
      selectedFiles.length === 0
    ) {
      setFormMessage(
        'Please upload at least one property image.',
        'error'
      );

      return;
    }

    let uploadedUrls = [];

    try {

      validateImageFiles(
        selectedFiles
      );

      const isEdit =
        Boolean(
          editingProperty
        );

      const propertyId =
        isEdit
          ? editingProperty.id
          : generatePropertyReference();

      let finalImages =
        isEdit
          ? [
              ...(
                editingProperty.images ||
                []
              )
            ]
          : [];

      if (
        selectedFiles.length
      ) {

        uploadedUrls =
          await uploadPropertyImages(
            propertyId,
            selectedFiles
          );

        if (
          isEdit &&
          !replaceImages.checked
        ) {

          finalImages = [
            ...finalImages,
            ...uploadedUrls
          ];

          if (
            finalImages.length > 8
          ) {
            throw new Error(
              'A property can have a maximum of 8 images in total.'
            );
          }

        } else {

          finalImages =
            uploadedUrls;

        }
      }

      const payload = {
        id:
          propertyId,

        title:
          document
            .getElementById(
              'title'
            )
            .value
            .trim(),

        purpose:
          purposeSelect.value,

        property_type:
          document
            .getElementById(
              'propertyType'
            )
            .value,

        location:
          document
            .getElementById(
              'property-location'
            )
            .value
            .trim(),

        price:
          Number(
            document
              .getElementById(
                'price'
              )
              .value
          ),

        currency:
          'USD',

        price_period:
          purposeSelect.value ===
          'rent'
            ? 'month'
            : null,

        bedrooms:
          Number(
            document
              .getElementById(
                'bedrooms-input'
              )
              .value
          ),

        bathrooms:
          Number(
            document
              .getElementById(
                'bathrooms-input'
              )
              .value
          ),

        size:
          Number(
            document
              .getElementById(
                'size'
              )
              .value
          ),

        description:
          document
            .getElementById(
              'description'
            )
            .value
            .trim(),

        featured:
          document
            .getElementById(
              'featured'
            )
            .checked,

        published:
          true,

        status:
          'Available',

        images:
          finalImages,

        updated_at:
          new Date()
            .toISOString()
      };


      let savedRow;


      if (isEdit) {

        const {
          data,
          error
        } =
          await supabaseClient
            .from('properties')
            .update({
              title:
                payload.title,

              purpose:
                payload.purpose,

              property_type:
                payload.property_type,

              location:
                payload.location,

              price:
                payload.price,

              currency:
                payload.currency,

              price_period:
                payload.price_period,

              bedrooms:
                payload.bedrooms,

              bathrooms:
                payload.bathrooms,

              size:
                payload.size,

              description:
                payload.description,

              featured:
                payload.featured,

              published:
                payload.published,

              status:
                payload.status,

              images:
                payload.images,

              updated_at:
                payload.updated_at
            })
            .eq(
              'id',
              editingProperty.id
            )
            .select()
            .single();

        if (error) {
          throw error;
        }

        savedRow = data;

      } else {

        const {
          data,
          error
        } =
          await supabaseClient
            .from('properties')
            .insert(payload)
            .select()
            .single();

        if (error) {
          throw error;
        }

        savedRow = data;
      }


      if (
        isEdit &&
        replaceImages.checked &&
        selectedFiles.length
      ) {

        await deleteStoredImages(
          editingProperty.images
        );
      }


      const saved =
        normaliseProperty(
          savedRow
        );


      if (isEdit) {

        properties =
          properties.map(
            property =>
              property.id ===
              saved.id
                ? saved
                : property
          );

      } else {

        properties.unshift(
          saved
        );
      }


      updateStats();

      renderProperties();

      resetForm();

      showView(
        'dashboard'
      );

      showToast(
        isEdit
          ? 'Property updated and published.'
          : 'Property published to the website.'
      );


    } catch (error) {

      console.error(error);

      if (
        uploadedUrls.length
      ) {
        await deleteStoredImages(
          uploadedUrls
        );
      }

      if (
        error.message
          ?.toLowerCase()
          .includes(
            'bucket'
          )
      ) {

        setFormMessage(
          'Property image storage has not been configured yet.',
          'error'
        );

      } else {

        setFormMessage(
          error.message ||
          'Could not save the property.',
          'error'
        );

      }
    }
  }
);


/* =========================================================
   SESSION BOOT
   ========================================================= */

async function boot() {
  updatePriceLabel();

  if (!supabaseClient) {

    showLogin();

    setLoginMessage(
      'Supabase configuration could not be loaded.',
      'error'
    );

    return;
  }

  try {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient
        .auth
        .getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (
      !sessionData.session
    ) {
      showLogin();
      return;
    }

    const admin =
      await getAuthorizedAdmin();

    if (!admin) {

      await supabaseClient
        .auth
        .signOut();

      showLogin();

      setLoginMessage(
        'This account is not authorised to access the Helen Estates Realtors admin area.',
        'error'
      );

      return;
    }

    showApplication();

    await loadProperties();

  } catch (error) {

    console.error(error);

    showLogin();

    setLoginMessage(
      error.message ||
      'Could not verify the admin session.',
      'error'
    );
  }
}


supabaseClient
  ?.auth
  .onAuthStateChange(
    (event) => {

      if (
        event === 'SIGNED_OUT'
      ) {
        showLogin();
      }

    }
  );


boot();
