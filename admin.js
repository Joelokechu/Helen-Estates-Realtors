const publicConfig = window.HELEN_ESTATES_CONFIG || {};

const configReady = Boolean(
  publicConfig.supabaseUrl &&
  publicConfig.supabasePublicKey &&
  !String(publicConfig.supabaseUrl).includes('YOUR_') &&
  !String(publicConfig.supabasePublicKey).includes('YOUR_')
);

const supabaseClient =
  configReady && window.supabase
    ? window.supabase.createClient(
        publicConfig.supabaseUrl,
        publicConfig.supabasePublicKey
      )
    : null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginScreen =
  document.getElementById('login-screen');

const loginForm =
  document.getElementById('login-form');

const loginMessage =
  document.getElementById('login-message');

const appShell =
  document.getElementById('app-shell');

const logoutButton =
  document.getElementById('logout-button');

const toast =
  document.getElementById('toast');

const pageTitle =
  document.getElementById('page-title');


/* =========================================================
   VIEWS
   ========================================================= */

const views = {
  dashboard:
    document.getElementById('dashboard-view'),

  requests:
    document.getElementById('requests-view'),

  reviews:
    document.getElementById('reviews-view'),

  editor:
    document.getElementById('editor-view')
};


/* =========================================================
   PROPERTY ELEMENTS
   ========================================================= */

const propertyList =
  document.getElementById('property-admin-list');

const propertyEmpty =
  document.getElementById('empty-state');

const adminSearch =
  document.getElementById('admin-search');

const adminFilter =
  document.getElementById('admin-filter');

const propertyForm =
  document.getElementById('property-form');

const propertyFormMessage =
  document.getElementById('property-form-message');

const imageInput =
  document.getElementById('images');

const uploadZone =
  document.getElementById('upload-zone');

const newImagePreview =
  document.getElementById('new-image-preview');

const existingImages =
  document.getElementById('existing-images');

const existingImageGrid =
  document.getElementById('existing-image-grid');

const replaceImages =
  document.getElementById('replace-images');

const purposeSelect =
  document.getElementById('purpose');

const priceLabel =
  document.getElementById('price-label');


/* =========================================================
   REQUEST ELEMENTS
   ========================================================= */

const requestNavCount =
  document.getElementById('request-nav-count');

const dashboardRequestList =
  document.getElementById('dashboard-request-list');

const dashboardRequestEmpty =
  document.getElementById('dashboard-request-empty');

const requestList =
  document.getElementById('request-list');

const requestEmptyState =
  document.getElementById('request-empty-state');

const requestSearch =
  document.getElementById('request-search');

const requestStatusFilter =
  document.getElementById('request-status-filter');

const requestTypeFilter =
  document.getElementById('request-type-filter');

const requestDetailPlaceholder =
  document.getElementById(
    'request-detail-placeholder'
  );

const requestDetailContent =
  document.getElementById(
    'request-detail-content'
  );

const requestStatusSelect =
  document.getElementById(
    'request-status-select'
  );

const requestAdminNotes =
  document.getElementById(
    'request-admin-notes'
  );

const requestSaveMessage =
  document.getElementById(
    'request-save-message'
  );

const saveRequestButton =
  document.getElementById(
    'save-request-button'
  );


/* =========================================================
   REVIEW ELEMENTS
   ========================================================= */

const reviewNavCount =
  document.getElementById(
    'review-nav-count'
  );

const adminReviewList =
  document.getElementById(
    'admin-review-list'
  );

const reviewEmptyState =
  document.getElementById(
    'review-empty-state'
  );

const reviewSearch =
  document.getElementById(
    'review-search'
  );

const reviewStatusFilter =
  document.getElementById(
    'review-status-filter'
  );


/* =========================================================
   STATE
   ========================================================= */

let properties = [];

let requests = [];

let reviews = [];

let editingProperty = null;

let activeRequestId = null;

let toastTimer = null;


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


function showToast(
  message,
  type = 'success'
) {
  if (!toast) {
    return;
  }

  clearTimeout(toastTimer);

  toast.textContent =
    message;

  toast.className =
    `toast show ${
      type === 'error'
        ? 'error'
        : ''
    }`;

  toastTimer =
    setTimeout(
      () => {
        toast.className =
          'toast';
      },
      3200
    );
}


function titleCase(value = '') {
  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );
}


function propertyTypeLabel(
  value = ''
) {
  if (!value) {
    return 'Not specified';
  }

  return titleCase(value);
}


function requestTypeLabel(type) {
  const labels = {
    buy: 'Buy',
    rent: 'Rent',
    sell: 'Sell / Advertise'
  };

  return labels[type] ||
    titleCase(type);
}


function requestStatusLabel(status) {
  const labels = {
    new: 'New',
    contacted: 'Contacted',
    in_progress: 'In progress',
    completed: 'Completed',
    closed: 'Closed'
  };

  return labels[status] ||
    titleCase(status);
}


function reviewStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return labels[status] ||
    titleCase(status);
}


function renderReviewStars(rating) {
  const value =
    Math.max(
      0,
      Math.min(
        5,
        Number(rating) || 0
      )
    );

  return (
    '★'.repeat(value) +
    '☆'.repeat(5 - value)
  );
}


function contactMethodLabel(value) {
  const labels = {
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    email: 'Email'
  };

  return labels[value] ||
    titleCase(value || '');
}


function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(date);
}


function formatShortDate(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  ).format(date);
}


function formatPropertyPrice(property) {
  const currency =
    property.currency ||
    'USD';

  let amount;

  try {
    amount =
      new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency,
          maximumFractionDigits: 0
        }
      ).format(
        Number(
          property.price || 0
        )
      );
  } catch (_error) {
    amount =
      `${currency} ${
        Number(
          property.price || 0
        ).toLocaleString('en-US')
      }`;
  }

  if (
    property.price_period
  ) {
    return `${amount} / ${property.price_period}`;
  }

  return amount;
}


function formatRequestBudget(request) {
  const min =
    request.budget_min === null ||
    request.budget_min === undefined
      ? null
      : Number(
          request.budget_min
        );

  const max =
    request.budget_max === null ||
    request.budget_max === undefined
      ? null
      : Number(
          request.budget_max
        );


  const money = value =>
    `US$${Number(value)
      .toLocaleString(
        'en-US',
        {
          maximumFractionDigits: 0
        }
      )}`;


  if (
    min !== null &&
    max !== null
  ) {
    return `${money(min)} – ${money(max)}`;
  }


  if (
    max !== null
  ) {
    return `Up to ${money(max)}`;
  }


  if (
    min !== null
  ) {
    return `From ${money(min)}`;
  }


  return 'Not specified';
}


function normalizePhoneForWhatsApp(
  phone
) {
  return String(phone || '')
    .replace(/\D/g, '');
}


function makePropertyReference() {
  const date =
    new Date();

  const stamp = [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, '0'),

    String(
      date.getDate()
    ).padStart(2, '0')
  ].join('');


  const suffix =
    crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 6)
      .toUpperCase();


  return `HER-P-${stamp}-${suffix}`;
}


/* =========================================================
   VIEW NAVIGATION
   ========================================================= */

function showView(name) {
  Object.entries(
    views
  ).forEach(
    ([
      key,
      element
    ]) => {
      if (!element) {
        return;
      }

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
    .forEach(
      button => {
        button.classList.toggle(
          'active',
          button.dataset.section === name
        );
      }
    );


  const titles = {
    dashboard:
      'Dashboard',

    requests:
      'Requests',

    reviews:
      'Reviews',

    editor:
      editingProperty
        ? 'Edit property'
        : 'Add property'
  };


  if (pageTitle) {
    pageTitle.textContent =
      titles[name] ||
      'Dashboard';
  }


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================================
   AUTHORIZATION
   ========================================================= */

async function getAuthorizedAdmin() {
  if (!supabaseClient) {
    return null;
  }


  const {
    data:
      userData,

    error:
      userError
  } =
    await supabaseClient
      .auth
      .getUser();


  if (
    userError ||
    !userData.user
  ) {
    return null;
  }


  const user =
    userData.user;


  const {
    data:
      adminRow,

    error:
      adminError
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


  if (!adminRow) {
    return null;
  }


  return user;
}


function showLogin(
  message = ''
) {
  if (appShell) {
    appShell.hidden =
      true;
  }

  if (loginScreen) {
    loginScreen.hidden =
      false;
  }


  if (
    message &&
    loginMessage
  ) {
    loginMessage.textContent =
      message;

    loginMessage.className =
      'form-message error';
  }
}


async function enterAdmin() {
  const admin =
    await getAuthorizedAdmin();


  if (!admin) {
    await supabaseClient
      ?.auth
      .signOut();

    throw new Error(
      'This account is not authorised to access the Helen Estates Realtors admin area.'
    );
  }


  loginScreen.hidden =
    true;

  appShell.hidden =
    false;


  await refreshAll();

  showView('dashboard');
}


/* =========================================================
   LOAD DATA
   ========================================================= */

async function refreshAll() {
  await Promise.all([
    loadProperties(),
    loadRequests(),
    loadReviews()
  ]);

  updatePropertyStats();
  updateRequestStats();
  updateReviewStats();
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
    data || [];


  renderProperties();
}


async function loadRequests() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from('requests')
      .select(`
        id,
        reference,
        request_type,
        name,
        email,
        phone,
        preferred_contact,
        location,
        property_type,
        budget_min,
        budget_max,
        bedrooms,
        property_reference,
        message,
        status,
        admin_notes,
        receipt_email_sent,
        admin_email_sent,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  requests =
    data || [];


  renderRequests();
  renderDashboardRequests();
  updateRequestStats();


  if (activeRequestId) {
    const stillExists =
      requests.find(
        request =>
          request.id ===
          activeRequestId
      );

    if (stillExists) {
      displayRequest(
        stillExists
      );
    }
  }
}


async function loadReviews() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from('reviews')
      .select(`
        id,
        name,
        rating,
        review_text,
        status,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  reviews =
    data || [];


  renderReviews();
  updateReviewStats();
}


/* =========================================================
   PROPERTY STATISTICS
   ========================================================= */

function updatePropertyStats() {
  document.getElementById(
    'stat-total'
  ).textContent =
    properties.length;


  document.getElementById(
    'stat-buy'
  ).textContent =
    properties.filter(
      property =>
        property.purpose ===
        'buy'
    ).length;


  document.getElementById(
    'stat-rent'
  ).textContent =
    properties.filter(
      property =>
        property.purpose ===
        'rent'
    ).length;


  document.getElementById(
    'stat-featured'
  ).textContent =
    properties.filter(
      property =>
        property.featured
    ).length;
}


/* =========================================================
   REQUEST STATISTICS
   ========================================================= */

function countRequestStatus(status) {
  return requests.filter(
    request =>
      request.status === status
  ).length;
}


function updateRequestStats() {
  const newCount =
    countRequestStatus('new');


  const mainStat =
    document.getElementById(
      'stat-new-requests'
    );

  if (mainStat) {
    mainStat.textContent =
      newCount;
  }


  const mappings = {
    'request-stat-new':
      'new',

    'request-stat-contacted':
      'contacted',

    'request-stat-progress':
      'in_progress',

    'request-stat-completed':
      'completed',

    'request-stat-closed':
      'closed'
  };


  Object.entries(
    mappings
  ).forEach(
    ([
      id,
      status
    ]) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.textContent =
          countRequestStatus(
            status
          );
      }
    }
  );


  if (requestNavCount) {
    requestNavCount.textContent =
      newCount;

    requestNavCount.hidden =
      newCount === 0;
  }
}


/* =========================================================
   REVIEW STATISTICS
   ========================================================= */

function countReviewStatus(status) {
  return reviews.filter(
    review =>
      review.status === status
  ).length;
}


function updateReviewStats() {
  const pendingCount =
    countReviewStatus(
      'pending'
    );


  const dashboardStat =
    document.getElementById(
      'stat-pending-reviews'
    );


  if (dashboardStat) {
    dashboardStat.textContent =
      pendingCount;
  }


  const mappings = {
    'review-stat-all':
      reviews.length,

    'review-stat-pending':
      pendingCount,

    'review-stat-approved':
      countReviewStatus(
        'approved'
      ),

    'review-stat-rejected':
      countReviewStatus(
        'rejected'
      )
  };


  Object.entries(
    mappings
  ).forEach(
    ([
      id,
      value
    ]) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.textContent =
          value;
      }
    }
  );


  if (reviewNavCount) {
    reviewNavCount.textContent =
      pendingCount;

    reviewNavCount.hidden =
      pendingCount === 0;
  }
}


/* =========================================================
   PROPERTY LIST
   ========================================================= */

function getFilteredProperties() {
  const search =
    String(
      adminSearch?.value || ''
    )
      .trim()
      .toLowerCase();


  const filter =
    adminFilter?.value ||
    'all';


  return properties.filter(
    property => {
      const haystack =
        [
          property.title,
          property.location,
          property.id,
          property.property_type
        ]
          .join(' ')
          .toLowerCase();


      const matchesSearch =
        !search ||
        haystack.includes(
          search
        );


      let matchesFilter =
        true;


      if (
        filter === 'buy'
      ) {
        matchesFilter =
          property.purpose ===
          'buy';
      }


      if (
        filter === 'rent'
      ) {
        matchesFilter =
          property.purpose ===
          'rent';
      }


      if (
        filter === 'featured'
      ) {
        matchesFilter =
          Boolean(
            property.featured
          );
      }


      return (
        matchesSearch &&
        matchesFilter
      );
    }
  );
}


function renderProperties() {
  if (!propertyList) {
    return;
  }


  const filtered =
    getFilteredProperties();


  propertyList.innerHTML =
    filtered.map(
      property => {
        const cover =
          property.images?.[0] ||
          'Helen Estates Realtors Logo 1.png';


        return `
          <article
            class="admin-property-row"
            data-property-id="${escapeHTML(property.id)}"
          >

            <img
              src="${escapeHTML(cover)}"
              alt=""
            />

            <div class="property-main">

              <h3>
                ${escapeHTML(property.title)}
              </h3>

              <p>
                ${escapeHTML(property.location)}
              </p>

              <span class="listing-badge ${
                property.purpose === 'rent'
                  ? 'rent'
                  : ''
              }">
                ${
                  property.purpose === 'rent'
                    ? 'To rent'
                    : 'For sale'
                }
              </span>

              ${
                property.featured
                  ? `
                    <span class="featured-pill">
                      Featured
                    </span>
                  `
                  : ''
              }

            </div>


            <div class="property-meta-admin">

              <strong>
                ${escapeHTML(
                  propertyTypeLabel(
                    property.property_type
                  )
                )}
              </strong>

              <small>
                ${Number(property.bedrooms || 0)} bed ·
                ${Number(property.bathrooms || 0)} bath
              </small>

            </div>


            <div class="property-price">

              <strong>
                ${escapeHTML(
                  formatPropertyPrice(
                    property
                  )
                )}
              </strong>

              <small>
                ${escapeHTML(property.id)}
              </small>

            </div>


            <div class="row-actions">

              <button
                class="icon-button"
                type="button"
                data-edit-property="${escapeHTML(property.id)}"
                aria-label="Edit ${escapeHTML(property.title)}"
              >
                ✎
              </button>

              <button
                class="icon-button delete"
                type="button"
                data-delete-property="${escapeHTML(property.id)}"
                aria-label="Delete ${escapeHTML(property.title)}"
              >
                ×
              </button>

            </div>

          </article>
        `;
      }
    ).join('');


  if (propertyEmpty) {
    propertyEmpty.hidden =
      filtered.length > 0;
  }
}


/* =========================================================
   PROPERTY FORM
   ========================================================= */

function setPropertyFormMessage(
  message = '',
  type = ''
) {
  if (!propertyFormMessage) {
    return;
  }


  propertyFormMessage.textContent =
    message;


  propertyFormMessage.className =
    `form-message ${
      type || ''
    }`.trim();
}


function updatePriceLabel() {
  if (!priceLabel) {
    return;
  }


  priceLabel.textContent =
    purposeSelect?.value ===
    'rent'
      ? 'Monthly rent (USD) *'
      : 'Sale price (USD) *';
}


function resetPropertyForm() {
  editingProperty =
    null;


  propertyForm.reset();


  document.getElementById(
    'property-id'
  ).value =
    '';


  document.getElementById(
    'bedrooms-input'
  ).value =
    3;


  document.getElementById(
    'bathrooms-input'
  ).value =
    2;


  document.getElementById(
    'featured'
  ).checked =
    true;


  purposeSelect.value =
    'buy';


  imageInput.value =
    '';


  replaceImages.checked =
    false;


  existingImages.hidden =
    true;


  existingImageGrid.innerHTML =
    '';


  newImagePreview.innerHTML =
    '';


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


  setPropertyFormMessage();

  updatePriceLabel();
}


function startAddProperty() {
  resetPropertyForm();

  showView('editor');
}


function renderExistingImages(
  property
) {
  const images =
    property.images || [];


  if (!images.length) {
    existingImages.hidden =
      true;

    existingImageGrid.innerHTML =
      '';

    return;
  }


  existingImages.hidden =
    false;


  existingImageGrid.innerHTML =
    images.map(
      (url, index) => `
        <div class="image-preview">

          <img
            src="${escapeHTML(url)}"
            alt=""
          />

          <span>
            ${
              index === 0
                ? 'Cover image'
                : `Image ${index + 1}`
            }
          </span>

        </div>
      `
    ).join('');
}


function startEditProperty(
  property
) {
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
    property.purpose ||
    'buy';


  document.getElementById(
    'propertyType'
  ).value =
    property.property_type ||
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


  imageInput.value =
    '';


  newImagePreview.innerHTML =
    '';


  replaceImages.checked =
    false;


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


  setPropertyFormMessage();

  updatePriceLabel();

  showView('editor');
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function renderNewImagePreviews(
  files
) {
  newImagePreview.innerHTML =
    '';


  Array.from(files)
    .slice(0, 8)
    .forEach(
      (
        file,
        index
      ) => {
        const wrapper =
          document.createElement(
            'div'
          );


        wrapper.className =
          'image-preview';


        const image =
          document.createElement(
            'img'
          );


        const label =
          document.createElement(
            'span'
          );


        label.textContent =
          index === 0
            ? 'New cover'
            : file.name;


        wrapper.append(
          image,
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
            image.src =
              reader.result;
          }
        );


        reader.readAsDataURL(
          file
        );
      }
    );
}


function validateImageFiles(files) {
  const allowed =
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp'
    ]);


  if (files.length > 8) {
    throw new Error(
      'You can upload a maximum of 8 images.'
    );
  }


  for (
    const file of files
  ) {
    if (
      !allowed.has(
        file.type
      )
    ) {
      throw new Error(
        `${file.name} is not a JPG, PNG or WEBP image.`
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


/* =========================================================
   STORAGE
   ========================================================= */

function storagePathFromPublicUrl(
  url
) {
  const marker =
    '/storage/v1/object/public/property-images/';


  const index =
    String(url).indexOf(
      marker
    );


  if (index < 0) {
    return null;
  }


  return decodeURIComponent(
    String(url).slice(
      index +
      marker.length
    )
  );
}


async function uploadPropertyImages(
  propertyId,
  files
) {
  const uploadedUrls =
    [];


  for (
    const file of files
  ) {
    const safeName =
      file.name
        .toLowerCase()
        .replace(
          /[^a-z0-9._-]+/g,
          '-'
        );


    const path =
      `${propertyId}/${crypto.randomUUID()}-${safeName}`;


    const {
      error
    } =
      await supabaseClient
        .storage
        .from(
          'property-images'
        )
        .upload(
          path,
          file,
          {
            upsert:
              false,

            contentType:
              file.type
          }
        );


    if (error) {
      throw error;
    }


    const {
      data
    } =
      supabaseClient
        .storage
        .from(
          'property-images'
        )
        .getPublicUrl(
          path
        );


    uploadedUrls.push(
      data.publicUrl
    );
  }


  return uploadedUrls;
}


async function removeStorageImages(
  urls
) {
  const paths =
    urls
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
      .from(
        'property-images'
      )
      .remove(
        paths
      );


  if (error) {
    console.warn(
      'Could not remove property images:',
      error
    );
  }
}


/* =========================================================
   SAVE PROPERTY
   ========================================================= */

propertyForm.addEventListener(
  'submit',
  async event => {
    event.preventDefault();


    const saveButton =
      document.getElementById(
        'save-property'
      );


    try {
      saveButton.disabled =
        true;


      saveButton.textContent =
        editingProperty
          ? 'Saving…'
          : 'Publishing…';


      setPropertyFormMessage(
        'Saving property…'
      );


      const files =
        Array.from(
          imageInput.files || []
        );


      validateImageFiles(
        files
      );


      const propertyId =
        editingProperty?.id ||
        makePropertyReference();


      const existingUrls =
        editingProperty?.images ||
        [];


      if (
        editingProperty &&
        !replaceImages.checked &&
        (
          existingUrls.length +
          files.length
        ) > 8
      ) {
        throw new Error(
          'A property can have a maximum of 8 images.'
        );
      }


      const uploadedUrls =
        files.length
          ? await uploadPropertyImages(
              propertyId,
              files
            )
          : [];


      let finalImages =
        existingUrls;


      if (
        editingProperty
      ) {
        if (
          replaceImages.checked
        ) {
          finalImages =
            uploadedUrls.length
              ? uploadedUrls
              : existingUrls;
        } else {
          finalImages = [
            ...existingUrls,
            ...uploadedUrls
          ];
        }
      } else {
        finalImages =
          uploadedUrls;
      }


      const row = {
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

        bedrooms:
          Number(
            document.getElementById(
              'bedrooms-input'
            ).value ||
            0
          ),

        bathrooms:
          Number(
            document.getElementById(
              'bathrooms-input'
            ).value ||
            0
          ),

        size:
          Number(
            document.getElementById(
              'size'
            ).value ||
            0
          ),

        price:
          Number(
            document.getElementById(
              'price'
            ).value
          ),

        currency:
          'USD',

        price_period:
          purposeSelect.value ===
          'rent'
            ? 'month'
            : null,

        description:
          document
            .getElementById(
              'description'
            )
            .value
            .trim(),

        featured:
          document.getElementById(
            'featured'
          ).checked,

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


      if (
        editingProperty
      ) {
        const {
          error
        } =
          await supabaseClient
            .from(
              'properties'
            )
            .update(
              row
            )
            .eq(
              'id',
              propertyId
            );


        if (error) {
          if (
            uploadedUrls.length
          ) {
            await removeStorageImages(
              uploadedUrls
            );
          }

          throw error;
        }


        if (
          replaceImages.checked &&
          uploadedUrls.length &&
          existingUrls.length
        ) {
          await removeStorageImages(
            existingUrls
          );
        }


        showToast(
          'Property updated.'
        );

      } else {

        const {
          error
        } =
          await supabaseClient
            .from(
              'properties'
            )
            .insert(
              row
            );


        if (error) {
          if (
            uploadedUrls.length
          ) {
            await removeStorageImages(
              uploadedUrls
            );
          }

          throw error;
        }


        showToast(
          'Property published.'
        );
      }


      await loadProperties();

      updatePropertyStats();

      resetPropertyForm();

      showView('dashboard');


    } catch (error) {

      console.error(
        error
      );


      setPropertyFormMessage(
        error.message ||
        'Could not save the property.',
        'error'
      );


      showToast(
        error.message ||
        'Could not save property.',
        'error'
      );

    } finally {

      saveButton.disabled =
        false;


      saveButton.textContent =
        editingProperty
          ? 'Save changes'
          : 'Publish property';
    }
  }
);


/* =========================================================
   DELETE PROPERTY
   ========================================================= */

async function deleteProperty(
  property
) {
  const confirmed =
    window.confirm(
      `Delete “${property.title}”? This removes it from the website and cannot be undone.`
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


    await removeStorageImages(
      property.images || []
    );


    properties =
      properties.filter(
        item =>
          item.id !==
          property.id
      );


    renderProperties();

    updatePropertyStats();


    showToast(
      'Property deleted.'
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      error.message ||
      'Could not delete property.',
      'error'
    );
  }
}


/* =========================================================
   REVIEW FILTERING
   ========================================================= */

function getFilteredReviews() {
  const search =
    String(
      reviewSearch?.value || ''
    )
      .trim()
      .toLowerCase();


  const statusFilter =
    reviewStatusFilter?.value ||
    'all';


  return reviews.filter(
    review => {
      const haystack =
        [
          review.name,
          review.review_text,
          review.rating
        ]
          .join(' ')
          .toLowerCase();


      const matchesSearch =
        !search ||
        haystack.includes(
          search
        );


      const matchesStatus =
        statusFilter ===
          'all' ||
        review.status ===
          statusFilter;


      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );
}


/* =========================================================
   REVIEW LIST
   ========================================================= */

function renderReviews() {
  if (!adminReviewList) {
    return;
  }


  const filtered =
    getFilteredReviews();


  adminReviewList.innerHTML =
    filtered.map(
      review => {

        const rating =
          Math.max(
            1,
            Math.min(
              5,
              Number(
                review.rating || 0
              )
            )
          );


        const reviewText =
          String(
            review.review_text || ''
          ).trim();


        return `
          <article
            class="admin-review-card"
            data-review-id="${escapeHTML(review.id)}"
          >

            <div class="admin-review-top">

              <div>
                <h3 class="admin-review-name">
                  ${escapeHTML(review.name)}
                </h3>

                <span class="admin-review-date">
                  Submitted ${escapeHTML(
                    formatDate(
                      review.created_at
                    )
                  )}
                </span>
              </div>


              <span
                class="review-status-badge ${escapeHTML(review.status)}"
              >
                ${escapeHTML(
                  reviewStatusLabel(
                    review.status
                  )
                )}
              </span>

            </div>


            <div
              class="admin-review-stars"
              aria-label="${rating} out of 5 stars"
            >
              ${renderReviewStars(
                rating
              )}
            </div>


            ${
              reviewText
                ? `
                    <p class="admin-review-text">
                      ${escapeHTML(reviewText)}
                    </p>
                  `
                : `
                    <p class="admin-review-text admin-review-no-text">
                      No written review was supplied.
                    </p>
                  `
            }


            <div class="admin-review-footer">

              <small class="muted">
                Last updated ${escapeHTML(
                  formatDate(
                    review.updated_at
                  )
                )}
              </small>


              <div class="admin-review-actions">

                ${
                  review.status !==
                    'approved'
                    ? `
                        <button
                          class="review-action-button review-approve-button"
                          type="button"
                          data-review-status="approved"
                          data-review-id="${escapeHTML(review.id)}"
                        >
                          Approve
                        </button>
                      `
                    : ''
                }


                ${
                  review.status !==
                    'rejected'
                    ? `
                        <button
                          class="review-action-button review-reject-button"
                          type="button"
                          data-review-status="rejected"
                          data-review-id="${escapeHTML(review.id)}"
                        >
                          Reject
                        </button>
                      `
                    : ''
                }


                ${
                  review.status !==
                    'pending'
                    ? `
                        <button
                          class="review-action-button secondary-button"
                          type="button"
                          data-review-status="pending"
                          data-review-id="${escapeHTML(review.id)}"
                        >
                          Set pending
                        </button>
                      `
                    : ''
                }


                <button
                  class="review-action-button review-delete-button"
                  type="button"
                  data-delete-review="${escapeHTML(review.id)}"
                >
                  Delete
                </button>

              </div>

            </div>

          </article>
        `;
      }
    ).join('');


  if (reviewEmptyState) {
    reviewEmptyState.hidden =
      filtered.length > 0;
  }
}


/* =========================================================
   REVIEW MODERATION
   ========================================================= */

async function updateReviewStatus(
  reviewId,
  status
) {
  const allowedStatuses =
    new Set([
      'pending',
      'approved',
      'rejected'
    ]);


  if (
    !reviewId ||
    !allowedStatuses.has(
      status
    )
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('reviews')
        .update({
          status,
          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          'id',
          reviewId
        )
        .select(`
          id,
          name,
          rating,
          review_text,
          status,
          created_at,
          updated_at
        `)
        .single();


    if (error) {
      throw error;
    }


    reviews =
      reviews.map(
        review =>
          review.id === data.id
            ? data
            : review
      );


    renderReviews();
    updateReviewStats();


    showToast(
      status === 'approved'
        ? 'Review approved and published.'
        : status === 'rejected'
          ? 'Review rejected.'
          : 'Review returned to pending.'
    );


  } catch (error) {

    console.error(
      error
    );


    showToast(
      error.message ||
      'Could not update the review.',
      'error'
    );
  }
}


async function deleteReview(
  reviewId
) {
  const review =
    reviews.find(
      item =>
        item.id === reviewId
    );


  if (!review) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete the review from ${review.name}? This cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from('reviews')
        .delete()
        .eq(
          'id',
          reviewId
        );


    if (error) {
      throw error;
    }


    reviews =
      reviews.filter(
        item =>
          item.id !== reviewId
      );


    renderReviews();
    updateReviewStats();


    showToast(
      'Review deleted.'
    );


  } catch (error) {

    console.error(
      error
    );


    showToast(
      error.message ||
      'Could not delete the review.',
      'error'
    );
  }
}


/* =========================================================
   REQUEST FILTERING
   ========================================================= */

function getFilteredRequests() {
  const search =
    String(
      requestSearch?.value || ''
    )
      .trim()
      .toLowerCase();


  const statusFilter =
    requestStatusFilter?.value ||
    'all';


  const typeFilter =
    requestTypeFilter?.value ||
    'all';


  return requests.filter(
    request => {
      const haystack = [
        request.reference,
        request.name,
        request.email,
        request.phone,
        request.location,
        request.property_reference,
        request.property_type
      ]
        .join(' ')
        .toLowerCase();


      const matchesSearch =
        !search ||
        haystack.includes(
          search
        );


      const matchesStatus =
        statusFilter ===
          'all' ||
        request.status ===
          statusFilter;


      const matchesType =
        typeFilter ===
          'all' ||
        request.request_type ===
          typeFilter;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    }
  );
}


/* =========================================================
   REQUEST LIST
   ========================================================= */

function renderRequests() {
  if (!requestList) {
    return;
  }


  const filtered =
    getFilteredRequests();


  requestList.innerHTML =
    filtered.map(
      request => `
        <button
          class="request-list-item ${
            activeRequestId === request.id
              ? 'active'
              : ''
          }"
          type="button"
          data-request-id="${escapeHTML(request.id)}"
        >

          <div class="request-list-top">

            <span class="request-list-reference">
              ${escapeHTML(request.reference)}
            </span>

            <span class="request-list-date">
              ${escapeHTML(
                formatShortDate(
                  request.created_at
                )
              )}
            </span>

          </div>


          <h3 class="request-list-name">
            ${escapeHTML(request.name)}
          </h3>


          <p class="request-list-location">
            ${escapeHTML(request.location)}
          </p>


          <div class="request-list-footer">

            <span class="request-type-badge ${escapeHTML(request.request_type)}">
              ${escapeHTML(
                requestTypeLabel(
                  request.request_type
                )
              )}
            </span>


            <span class="request-status-badge ${escapeHTML(request.status)}">
              ${escapeHTML(
                requestStatusLabel(
                  request.status
                )
              )}
            </span>

          </div>

        </button>
      `
    ).join('');


  if (requestEmptyState) {
    requestEmptyState.hidden =
      filtered.length > 0;
  }
}


/* =========================================================
   DASHBOARD REQUESTS
   ========================================================= */

function renderDashboardRequests() {
  if (!dashboardRequestList) {
    return;
  }


  const latest =
    requests.slice(
      0,
      5
    );


  dashboardRequestList.innerHTML =
    latest.map(
      request => `
        <button
          class="dashboard-request-item"
          type="button"
          data-dashboard-request="${escapeHTML(request.id)}"
        >

          <div class="dashboard-request-main">

            <strong>
              ${escapeHTML(request.name)}
            </strong>

            <small>
              ${escapeHTML(request.reference)}
            </small>

          </div>


          <div class="dashboard-request-meta request-location">

            <strong>
              ${escapeHTML(request.location)}
            </strong>

            <small>
              Location
            </small>

          </div>


          <div class="dashboard-request-meta request-type-column">

            <strong>
              ${escapeHTML(
                requestTypeLabel(
                  request.request_type
                )
              )}
            </strong>

            <small>
              Request
            </small>

          </div>


          <span class="request-status-badge ${escapeHTML(request.status)}">
            ${escapeHTML(
              requestStatusLabel(
                request.status
              )
            )}
          </span>


          <span aria-hidden="true">
            →
          </span>

        </button>
      `
    ).join('');


  if (dashboardRequestEmpty) {
    dashboardRequestEmpty.hidden =
      latest.length > 0;
  }
}


/* =========================================================
   REQUEST DETAIL
   ========================================================= */

function displayRequest(
  request
) {
  activeRequestId =
    request.id;


  requestDetailPlaceholder.hidden =
    true;

  requestDetailContent.hidden =
    false;


  document.getElementById(
    'request-detail-reference'
  ).textContent =
    request.reference ||
    '—';


  const statusBadge =
    document.getElementById(
      'request-detail-status-badge'
    );


  statusBadge.textContent =
    requestStatusLabel(
      request.status
    );


  statusBadge.className =
    `request-status-badge ${request.status}`;


  const typeBadge =
    document.getElementById(
      'request-detail-type'
    );


  typeBadge.textContent =
    requestTypeLabel(
      request.request_type
    );


  typeBadge.className =
    `request-type-badge ${request.request_type}`;


  document.getElementById(
    'request-detail-created'
  ).textContent =
    formatDate(
      request.created_at
    );


  document.getElementById(
    'request-detail-name'
  ).textContent =
    request.name ||
    '—';


  const emailElement =
    document.getElementById(
      'request-detail-email'
    );


  emailElement.textContent =
    request.email ||
    '—';


  emailElement.href =
    request.email
      ? `mailto:${request.email}`
      : '#';


  const phoneElement =
    document.getElementById(
      'request-detail-phone'
    );


  phoneElement.textContent =
    request.phone ||
    '—';


  phoneElement.href =
    request.phone
      ? `tel:${request.phone}`
      : '#';


  document.getElementById(
    'request-detail-contact'
  ).textContent =
    contactMethodLabel(
      request.preferred_contact
    ) ||
    '—';


  document.getElementById(
    'request-detail-location'
  ).textContent =
    request.location ||
    '—';


  document.getElementById(
    'request-detail-property-type'
  ).textContent =
    propertyTypeLabel(
      request.property_type
    );


  document.getElementById(
    'request-detail-budget'
  ).textContent =
    formatRequestBudget(
      request
    );


  document.getElementById(
    'request-detail-bedrooms'
  ).textContent =
    request.bedrooms ??
    'Not specified';


  document.getElementById(
    'request-detail-property-reference'
  ).textContent =
    request.property_reference ||
    'None';


  document.getElementById(
    'request-detail-message'
  ).textContent =
    request.message ||
    '—';


  requestStatusSelect.value =
    request.status;


  requestAdminNotes.value =
    request.admin_notes ||
    '';


  requestSaveMessage.textContent =
    '';

  requestSaveMessage.className =
    'form-message';


  const emailButton =
    document.getElementById(
      'request-email-button'
    );


  emailButton.href =
    request.email
      ? `mailto:${request.email}?subject=${encodeURIComponent(
          `Helen Estates Realtors — ${request.reference}`
        )}`
      : '#';


  const callButton =
    document.getElementById(
      'request-call-button'
    );


  callButton.href =
    request.phone
      ? `tel:${request.phone}`
      : '#';


  const whatsappButton =
    document.getElementById(
      'request-whatsapp-button'
    );


  const whatsappNumber =
    normalizePhoneForWhatsApp(
      request.phone
    );


  whatsappButton.href =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : '#';


  renderRequests();
}


/* =========================================================
   SAVE REQUEST
   ========================================================= */

async function saveActiveRequest() {
  const request =
    requests.find(
      item =>
        item.id ===
        activeRequestId
    );


  if (!request) {
    return;
  }


  const updates = {
    status:
      requestStatusSelect.value,

    admin_notes:
      requestAdminNotes
        .value
        .trim() ||
      null,

    updated_at:
      new Date()
        .toISOString()
  };


  try {

    saveRequestButton.disabled =
      true;


    saveRequestButton.textContent =
      'Saving…';


    requestSaveMessage.textContent =
      'Saving request…';


    requestSaveMessage.className =
      'form-message';


    const {
      data,
      error
    } =
      await supabaseClient
        .from('requests')
        .update(
          updates
        )
        .eq(
          'id',
          request.id
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    requests =
      requests.map(
        item =>
          item.id === data.id
            ? data
            : item
      );


    updateRequestStats();

    renderDashboardRequests();

    renderRequests();

    displayRequest(
      data
    );


    requestSaveMessage.textContent =
      'Request saved successfully.';


    requestSaveMessage.className =
      'form-message success';


    showToast(
      'Request updated.'
    );

  } catch (error) {

    console.error(
      error
    );


    requestSaveMessage.textContent =
      error.message ||
      'Could not save this request.';


    requestSaveMessage.className =
      'form-message error';


    showToast(
      error.message ||
      'Could not save request.',
      'error'
    );

  } finally {

    saveRequestButton.disabled =
      false;


    saveRequestButton.textContent =
      'Save request';
  }
}


/* =========================================================
   PROPERTY EVENTS
   ========================================================= */

propertyList.addEventListener(
  'click',
  event => {

    const editButton =
      event.target.closest(
        '[data-edit-property]'
      );


    if (editButton) {

      const property =
        properties.find(
          item =>
            item.id ===
            editButton.dataset.editProperty
        );


      if (property) {
        startEditProperty(
          property
        );
      }

      return;
    }


    const deleteButton =
      event.target.closest(
        '[data-delete-property]'
      );


    if (deleteButton) {

      const property =
        properties.find(
          item =>
            item.id ===
            deleteButton.dataset.deleteProperty
        );


      if (property) {
        deleteProperty(
          property
        );
      }
    }
  }
);


adminSearch?.addEventListener(
  'input',
  renderProperties
);


adminFilter?.addEventListener(
  'change',
  renderProperties
);


purposeSelect?.addEventListener(
  'change',
  updatePriceLabel
);


imageInput?.addEventListener(
  'change',
  () => {
    try {

      const files =
        Array.from(
          imageInput.files ||
          []
        );


      validateImageFiles(
        files
      );


      renderNewImagePreviews(
        files
      );


      setPropertyFormMessage();

    } catch (error) {

      imageInput.value =
        '';


      newImagePreview.innerHTML =
        '';


      setPropertyFormMessage(
        error.message,
        'error'
      );
    }
  }
);


/* =========================================================
   DRAG AND DROP IMAGES
   ========================================================= */

[
  'dragenter',
  'dragover'
].forEach(
  eventName => {

    uploadZone?.addEventListener(
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

    uploadZone?.addEventListener(
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


uploadZone?.addEventListener(
  'drop',
  event => {

    const files =
      Array.from(
        event.dataTransfer?.files ||
        []
      );


    try {

      validateImageFiles(
        files
      );


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


      renderNewImagePreviews(
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
   REQUEST EVENTS
   ========================================================= */

requestList?.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-request-id]'
      );


    if (!button) {
      return;
    }


    const request =
      requests.find(
        item =>
          item.id ===
          button.dataset.requestId
      );


    if (request) {
      displayRequest(
        request
      );
    }
  }
);


dashboardRequestList?.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-dashboard-request]'
      );


    if (!button) {
      return;
    }


    const request =
      requests.find(
        item =>
          item.id ===
          button.dataset.dashboardRequest
      );


    if (!request) {
      return;
    }


    showView(
      'requests'
    );


    displayRequest(
      request
    );
  }
);


requestSearch?.addEventListener(
  'input',
  renderRequests
);


requestStatusFilter?.addEventListener(
  'change',
  renderRequests
);


requestTypeFilter?.addEventListener(
  'change',
  renderRequests
);


saveRequestButton?.addEventListener(
  'click',
  saveActiveRequest
);


document
  .getElementById(
    'view-all-requests'
  )
  ?.addEventListener(
    'click',
    async () => {

      try {
        await loadRequests();
      } catch (error) {
        console.error(
          error
        );
      }

      showView(
        'requests'
      );
    }
  );


/* =========================================================
   REVIEW EVENTS
   ========================================================= */

adminReviewList?.addEventListener(
  'click',
  event => {

    const statusButton =
      event.target.closest(
        '[data-review-status]'
      );


    if (statusButton) {
      updateReviewStatus(
        statusButton.dataset.reviewId,
        statusButton.dataset.reviewStatus
      );

      return;
    }


    const deleteButton =
      event.target.closest(
        '[data-delete-review]'
      );


    if (deleteButton) {
      deleteReview(
        deleteButton.dataset.deleteReview
      );
    }
  }
);


reviewSearch?.addEventListener(
  'input',
  renderReviews
);


reviewStatusFilter?.addEventListener(
  'change',
  renderReviews
);


/* =========================================================
   ADMIN NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    '.side-link[data-section]'
  )
  .forEach(
    button => {

      button.addEventListener(
        'click',
        async () => {

          const section =
            button.dataset.section;


          if (
            section ===
            'editor'
          ) {
            startAddProperty();

            return;
          }


          if (
            section ===
            'requests'
          ) {
            try {
              await loadRequests();
            } catch (error) {
              console.error(
                error
              );

              showToast(
                'Could not refresh requests.',
                'error'
              );
            }
          }


          if (
            section ===
            'reviews'
          ) {
            try {
              await loadReviews();
            } catch (error) {
              console.error(
                error
              );

              showToast(
                'Could not refresh reviews.',
                'error'
              );
            }
          }


          if (
            section ===
            'dashboard'
          ) {
            try {
              await Promise.all([
                loadProperties(),
                loadRequests(),
                loadReviews()
              ]);

              updatePropertyStats();
              updateRequestStats();
              updateReviewStats();

            } catch (error) {
              console.error(
                error
              );
            }
          }


          showView(
            section
          );
        }
      );
    }
  );


document
  .getElementById(
    'add-property-top'
  )
  ?.addEventListener(
    'click',
    startAddProperty
  );


document
  .getElementById(
    'cancel-edit'
  )
  ?.addEventListener(
    'click',
    () => {

      resetPropertyForm();

      showView(
        'dashboard'
      );
    }
  );


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    if (!supabaseClient) {

      loginMessage.textContent =
        'Supabase has not been connected yet. Complete supabase-config.js first.';


      loginMessage.className =
        'form-message error';

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
      document.getElementById(
        'admin-password'
      ).value;


    loginMessage.textContent =
      'Signing in…';


    loginMessage.className =
      'form-message';


    try {

      const {
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {
        throw error;
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


      loginMessage.textContent =
        '';


      await enterAdmin();


    } catch (error) {

      console.error(
        error
      );


      loginMessage.textContent =
        error.message ||
        'Could not sign in.';


      loginMessage.className =
        'form-message error';
    }
  }
);


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton?.addEventListener(
  'click',
  async () => {

    try {

      await supabaseClient
        ?.auth
        .signOut();

    } catch (error) {

      console.error(
        error
      );
    }


    properties =
      [];

    requests =
      [];

    reviews =
      [];

    activeRequestId =
      null;

    editingProperty =
      null;


    showLogin();
  }
);


/* =========================================================
   SESSION RESTORE
   ========================================================= */

async function restoreSession() {
  if (!supabaseClient) {

    showLogin(
      'Supabase has not been connected yet. Complete supabase-config.js first.'
    );

    return;
  }


  try {

    const {
      data
    } =
      await supabaseClient
        .auth
        .getSession();


    if (!data.session) {
      showLogin();

      return;
    }


    await enterAdmin();


  } catch (error) {

    console.error(
      error
    );


    showLogin(
      error.message ||
      'Please sign in again.'
    );
  }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

supabaseClient
  ?.auth
  .onAuthStateChange(
    event => {

      if (
        event ===
        'SIGNED_OUT'
      ) {
        appShell.hidden =
          true;

        loginScreen.hidden =
          false;
      }
    }
  );


/* =========================================================
   INITIALISE
   ========================================================= */

updatePriceLabel();

restoreSession();
