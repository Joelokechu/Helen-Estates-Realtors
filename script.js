const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const backToTop = document.querySelector('.back-to-top');
const searchTabs = document.querySelectorAll('.search-tab');
const searchForm = document.getElementById('property-search-form');
const searchMessage = document.getElementById('search-message');
const searchCurrency = document.getElementById('search-currency');
const propertyGrid = document.getElementById('property-grid');
const propertiesLoading = document.getElementById('properties-loading');
const propertiesStatus = document.getElementById('properties-status');
const viewAllButton = document.getElementById('view-all-properties');
const ticketForm = document.getElementById('ticket-form');
const ticketStatus = document.getElementById('ticket-message-status');
const ticketReference = document.getElementById('ticket-property-reference');
const ticketBudgetLabel = document.getElementById('ticket-budget-label');
const ticketCurrency = document.getElementById('ticket-currency');
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

const BACKEND = {
  enabled: backendConfigured,

  async getPublishedProperties() {
    const base =
      String(
        publicConfig.supabaseUrl
      ).replace(/\/$/, '');

    const url =
      new URL(
        `${base}/rest/v1/properties`
      );

    url.searchParams.set(
      'select',
      'id,title,purpose,property_type,location,bedrooms,bathrooms,size,price,currency,price_period,featured,status,images,created_at'
    );

    url.searchParams.set(
      'published',
      'eq.true'
    );

    url.searchParams.set(
      'order',
      'featured.desc,created_at.desc'
    );

    const response =
      await fetch(
        url,
        {
          headers: {
            apikey:
              publicConfig.supabasePublicKey
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        'Could not load published properties.'
      );
    }

    const rows =
      await response.json();

    return rows.map(
      row => ({
        ...row,

        propertyType:
          row.property_type,

        pricePeriod:
          row.price_period
      })
    );
  },

  async createTicket(ticket) {
    const base =
      String(
        publicConfig.supabaseUrl
      ).replace(/\/$/, '');

    const response =
      await fetch(
        `${base}/functions/v1/create-ticket`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            apikey:
              publicConfig.supabasePublicKey
          },

          body:
            JSON.stringify(
              ticket
            )
        }
      );

    let payload = {};

    try {
      payload =
        await response.json();
    } catch (_error) {}

    if (!response.ok) {
      throw new Error(
        payload.error ||
        'Could not submit your request.'
      );
    }

    return payload;
  }
};


const DEMO_PROPERTIES = [
  {
    id:
      'HER-001',

    title:
      'Contemporary Pool Villa',

    purpose:
      'buy',

    propertyType:
      'house',

    location:
      'Soufrière',

    bedrooms:
      4,

    bathrooms:
      4,

    size:
      2800,

    price:
      875000,

    currency:
      'USD',

    featured:
      true,

    status:
      'Available',

    images:
      ['property-1.jpg']
  },

  {
    id:
      'HER-002',

    title:
      'Waterfront Two Bedroom Apartment',

    purpose:
      'rent',

    propertyType:
      'apartment',

    location:
      'Rodney Bay',

    bedrooms:
      2,

    bathrooms:
      2,

    size:
      1050,

    price:
      2200,

    currency:
      'USD',

    pricePeriod:
      'month',

    featured:
      true,

    status:
      'Available',

    images:
      ['property-2.jpg']
  },

  {
    id:
      'HER-003',

    title:
      'Family Home with Garden',

    purpose:
      'buy',

    propertyType:
      'house',

    location:
      'Gros Islet',

    bedrooms:
      3,

    bathrooms:
      2,

    size:
      1850,

    price:
      465000,

    currency:
      'USD',

    featured:
      true,

    status:
      'Available',

    images:
      ['property-3.jpg']
  },

  {
    id:
      'HER-004',

    title:
      'Bright One Bedroom Apartment',

    purpose:
      'rent',

    propertyType:
      'apartment',

    location:
      'Marigot Bay',

    bedrooms:
      1,

    bathrooms:
      1,

    size:
      720,

    price:
      1450,

    currency:
      'USD',

    pricePeriod:
      'month',

    featured:
      true,

    status:
      'Available',

    images:
      ['property-4.jpg']
  }
];


let activeMode =
  'buy';

let allProperties =
  [];

let showingAll =
  false;

let searchActive =
  false;

let carouselDrag =
  null;

let suppressPropertyCardClickUntil =
  0;


function escapeHTML(
  value = ''
) {
  return String(value)
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}


function closeNavigation() {
  navToggle.classList.remove(
    'active'
  );

  mainNav.classList.remove(
    'open'
  );

  navToggle.setAttribute(
    'aria-expanded',
    'false'
  );

  navToggle.setAttribute(
    'aria-label',
    'Open navigation'
  );

  document.body.classList.remove(
    'nav-open'
  );
}


navToggle.addEventListener(
  'click',
  () => {

    const isOpen =
      mainNav.classList.toggle(
        'open'
      );

    navToggle.classList.toggle(
      'active',
      isOpen
    );

    navToggle.setAttribute(
      'aria-expanded',
      String(isOpen)
    );

    navToggle.setAttribute(
      'aria-label',
      isOpen
        ? 'Close navigation'
        : 'Open navigation'
    );

    document.body.classList.toggle(
      'nav-open',
      isOpen
    );
  }
);


mainNav
  .querySelectorAll('a')
  .forEach(
    link => {

      link.addEventListener(
        'click',
        closeNavigation
      );
    }
  );


window.addEventListener(
  'scroll',
  () => {

    header.classList.toggle(
      'scrolled',
      window.scrollY > 24
    );

    backToTop.classList.toggle(
      'visible',
      window.scrollY > 580
    );
  }
);


backToTop.addEventListener(
  'click',
  () => {

    window.scrollTo({
      top:
        0,

      behavior:
        'smooth'
    });
  }
);


function formatPrice(
  property
) {
  const currency =
    property.currency ||
    'USD';

  let value;

  try {
    value =
      new Intl.NumberFormat(
        'en-US',
        {
          style:
            'currency',

          currency,

          maximumFractionDigits:
            0
        }
      ).format(
        Number(
          property.price ||
          0
        )
      );

  } catch (_error) {

    value =
      `${currency} ${
        Number(
          property.price ||
          0
        ).toLocaleString(
          'en-US'
        )
      }`;
  }

  return property.pricePeriod
    ? `${value} <small>/ ${escapeHTML(
        property.pricePeriod
      )}</small>`
    : value;
}


function savedFavouriteIds() {
  try {
    return new Set(
      JSON.parse(
        localStorage.getItem(
          'helen-estates-favourites'
        ) || '[]'
      )
    );

  } catch (_error) {

    return new Set();
  }
}


function toggleFavourite(
  id,
  button
) {
  const favourites =
    savedFavouriteIds();

  if (
    favourites.has(id)
  ) {
    favourites.delete(id);

  } else {

    favourites.add(id);
  }

  localStorage.setItem(
    'helen-estates-favourites',
    JSON.stringify(
      [...favourites]
    )
  );

  const isSaved =
    favourites.has(id);

  button.classList.toggle(
    'saved',
    isSaved
  );

  button.textContent =
    isSaved
      ? '♥'
      : '♡';

  button.setAttribute(
    'aria-pressed',
    String(isSaved)
  );
}


function getPropertyImages(
  property
) {
  const images =
    Array.isArray(
      property.images
    )
      ? property.images.filter(
          image =>
            typeof image ===
              'string' &&
            image.trim()
        )
      : [];

  return images.length
    ? images
    : ['property-1.jpg'];
}


function setCarouselIndex(
  carousel,
  nextIndex,
  animate = true
) {
  if (!carousel) {
    return;
  }

  const track =
    carousel.querySelector(
      '[data-carousel-track]'
    );

  const slides =
    carousel.querySelectorAll(
      '.property-carousel-slide'
    );

  if (
    !track ||
    !slides.length
  ) {
    return;
  }

  const total =
    slides.length;

  const index =
    (
      (
        nextIndex %
        total
      ) +
      total
    ) %
    total;

  carousel.dataset
    .carouselIndex =
      String(index);

  track.style.transition =
    animate
      ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none';

  track.style.transform =
    `translate3d(-${
      index * 100
    }%, 0, 0)`;

  carousel
    .querySelectorAll(
      '[data-carousel-dot]'
    )
    .forEach(
      dot => {

        const active =
          Number(
            dot.dataset
              .carouselDot
          ) === index;

        dot.classList.toggle(
          'active',
          active
        );

        dot.setAttribute(
          'aria-current',
          active
            ? 'true'
            : 'false'
        );
      }
    );
}


function moveCarousel(
  carousel,
  direction
) {
  const current =
    Number(
      carousel?.dataset
        .carouselIndex ||
      0
    );

  setCarouselIndex(
    carousel,
    current +
      direction
  );
}


function renderPropertyCards(
  properties
) {
  const favourites =
    savedFavouriteIds();

  if (!properties.length) {
    propertyGrid.innerHTML =
      '';

    propertiesStatus.hidden =
      false;

    propertiesStatus.textContent =
      searchActive
        ? 'No exact matches found. Try widening your search or open a property request and we can look for you.'
        : 'No properties are currently published.';

    return;
  }

  propertiesStatus.hidden =
    true;

  propertyGrid.innerHTML =
    properties
      .map(
        property => {

          const images =
            getPropertyImages(
              property
            );

          const multipleImages =
            images.length > 1;

          const isRent =
            property.purpose ===
            'rent';

          const saved =
            favourites.has(
              property.id
            );

          const meta = [

            property.bedrooms
              ? `${
                  Number(
                    property.bedrooms
                  )
                } ${
                  Number(
                    property.bedrooms
                  ) === 1
                    ? 'bed'
                    : 'beds'
                }`
              : '',

            property.bathrooms
              ? `${
                  Number(
                    property.bathrooms
                  )
                } ${
                  Number(
                    property.bathrooms
                  ) === 1
                    ? 'bath'
                    : 'baths'
                }`
              : '',

            property.size
              ? `${
                  Number(
                    property.size
                  ).toLocaleString(
                    'en-US'
                  )
                } sq ft`
              : ''

          ].filter(Boolean);

          return `
            <article
              class="property-card"
              data-id="${escapeHTML(
                property.id
              )}"
            >

              <div
                class="property-image property-carousel"
                data-property-carousel
                data-carousel-index="0"
              >

                <div
                  class="property-carousel-track"
                  data-carousel-track
                >

                  ${images
                    .map(
                      (
                        image,
                        index
                      ) => `
                        <img
                          class="property-carousel-slide"
                          src="${escapeHTML(
                            image
                          )}"
                          alt="${escapeHTML(
                            property.title
                          )}${
                            multipleImages
                              ? ` — image ${index + 1} of ${images.length}`
                              : ''
                          }"
                          loading="lazy"
                          draggable="false"
                        />
                      `
                    )
                    .join('')}

                </div>


                <span
                  class="badge ${
                    isRent
                      ? 'badge-rent'
                      : ''
                  }"
                >
                  ${
                    isRent
                      ? 'To rent'
                      : 'For sale'
                  }
                </span>


                ${
                  property.featured
                    ? `
                      <span class="featured-marker">
                        Featured
                      </span>
                    `
                    : ''
                }


                <button
                  class="favourite ${
                    saved
                      ? 'saved'
                      : ''
                  }"
                  type="button"
                  data-favourite-id="${escapeHTML(
                    property.id
                  )}"
                  aria-label="Save ${escapeHTML(
                    property.title
                  )}"
                  aria-pressed="${saved}"
                >
                  ${
                    saved
                      ? '♥'
                      : '♡'
                  }
                </button>


                ${
                  multipleImages
                    ? `
                      <button
                        class="property-carousel-arrow property-carousel-prev"
                        type="button"
                        data-carousel-prev
                        aria-label="Previous image"
                      >
                        ‹
                      </button>


                      <button
                        class="property-carousel-arrow property-carousel-next"
                        type="button"
                        data-carousel-next
                        aria-label="Next image"
                      >
                        ›
                      </button>


                      <div
                        class="property-carousel-dots"
                        aria-label="Property images"
                      >

                        ${images
                          .map(
                            (
                              _image,
                              index
                            ) => `
                              <button
                                class="property-carousel-dot ${
                                  index === 0
                                    ? 'active'
                                    : ''
                                }"
                                type="button"
                                data-carousel-dot="${index}"
                                aria-label="Show image ${index + 1} of ${images.length}"
                                aria-current="${
                                  index === 0
                                    ? 'true'
                                    : 'false'
                                }"
                              ></button>
                            `
                          )
                          .join('')}

                      </div>
                    `
                    : ''
                }

              </div>


              <div class="property-body">

                <p class="property-kicker">
                  ${escapeHTML(
                    property.id
                  )}
                  ·
                  ${escapeHTML(
                    property.status ||
                    'Available'
                  )}
                </p>


                <h3>
                  ${escapeHTML(
                    property.title
                  )}
                </h3>


                <p class="location">
                  ${escapeHTML(
                    property.location
                  )}
                </p>


                <ul
                  class="property-meta"
                  aria-label="Property features"
                >

                  ${meta
                    .map(
                      item =>
                        `<li>${escapeHTML(
                          item
                        )}</li>`
                    )
                    .join('')}

                </ul>


                <div class="property-bottom">

                  <p class="price">
                    ${formatPrice(
                      property
                    )}
                  </p>


                  <button
                    class="property-enquire"
                    type="button"
                    data-enquire-property="${escapeHTML(
                      property.id
                    )}"
                  >
                    Enquire →
                  </button>

                </div>

              </div>

            </article>
          `;
        }
      )
      .join('');
}


function renderDefaultProperties() {
  searchActive =
    false;

  const featured =
    allProperties.filter(
      property =>
        property.featured
    );

  const defaultProperties =
    featured.length
      ? featured
      : allProperties;

  const visible =
    showingAll
      ? allProperties
      : defaultProperties.slice(
          0,
          4
        );

  renderPropertyCards(
    visible
  );

  viewAllButton.innerHTML =
    showingAll
      ? 'Show featured <span aria-hidden="true">↑</span>'
      : 'View all properties <span aria-hidden="true">→</span>';
}


propertyGrid.addEventListener(
  'click',
  event => {

    const previousButton =
      event.target.closest(
        '[data-carousel-prev]'
      );

    if (previousButton) {
      event.preventDefault();
      event.stopPropagation();

      moveCarousel(
        previousButton.closest(
          '[data-property-carousel]'
        ),
        -1
      );

      return;
    }


    const nextButton =
      event.target.closest(
        '[data-carousel-next]'
      );

    if (nextButton) {
      event.preventDefault();
      event.stopPropagation();

      moveCarousel(
        nextButton.closest(
          '[data-property-carousel]'
        ),
        1
      );

      return;
    }


    const dotButton =
      event.target.closest(
        '[data-carousel-dot]'
      );

    if (dotButton) {
      event.preventDefault();
      event.stopPropagation();

      setCarouselIndex(
        dotButton.closest(
          '[data-property-carousel]'
        ),
        Number(
          dotButton.dataset
            .carouselDot
        )
      );

      return;
    }


    const favouriteButton =
      event.target.closest(
        '[data-favourite-id]'
      );

    if (favouriteButton) {

      toggleFavourite(
        favouriteButton.dataset
          .favouriteId,
        favouriteButton
      );

      return;
    }


    const enquireButton =
      event.target.closest(
        '[data-enquire-property]'
      );

    if (enquireButton) {

      const id =
        enquireButton.dataset
          .enquireProperty;

      const property =
        allProperties.find(
          item =>
            item.id === id
        );

      ticketReference.value =
        id;

      selectRequestType(
        property?.purpose ||
        'buy'
      );

      if (
        ticketCurrency &&
        [
          'XCD',
          'USD',
          'GBP'
        ].includes(
          property?.currency
        )
      ) {
        ticketCurrency.value =
          property.currency;

        updateTicketLabels();
      }

      document.getElementById(
        'ticket-message'
      ).value =
        `I'm interested in ${
          property?.title ||
          'this property'
        } (${id}). Please contact me with more information.`;

      document.getElementById(
        'request'
      ).scrollIntoView({
        behavior:
          'smooth'
      });

      return;
    }


    if (
      performance.now() <
      suppressPropertyCardClickUntil
    ) {
      return;
    }


    const propertyCard =
      event.target.closest(
        '.property-card[data-id]'
      );

    if (!propertyCard) {
      return;
    }


    const propertyId =
      propertyCard.dataset.id;

    if (!propertyId) {
      return;
    }


    window.location.href =
      `property.html?id=${encodeURIComponent(
        propertyId
      )}`;
  }
);


propertyGrid.addEventListener(
  'pointerdown',
  event => {

    const carousel =
      event.target.closest(
        '[data-property-carousel]'
      );

    if (
      !carousel ||
      event.target.closest(
        'button'
      )
    ) {
      return;
    }

    if (
      event.pointerType ===
        'mouse' &&
      event.button !== 0
    ) {
      return;
    }

    const slides =
      carousel.querySelectorAll(
        '.property-carousel-slide'
      );

    if (
      slides.length <= 1
    ) {
      return;
    }

    carouselDrag = {
      carousel,

      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      currentX:
        event.clientX,

      horizontal:
        false
    };

    try {
      carousel.setPointerCapture(
        event.pointerId
      );

    } catch (_error) {}
  }
);


propertyGrid.addEventListener(
  'pointermove',
  event => {

    if (
      !carouselDrag ||
      carouselDrag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      carouselDrag.startX;

    const deltaY =
      event.clientY -
      carouselDrag.startY;

    if (
      !carouselDrag.horizontal &&
      Math.abs(deltaX) < 8 &&
      Math.abs(deltaY) < 8
    ) {
      return;
    }

    if (
      !carouselDrag.horizontal &&
      Math.abs(deltaY) >
        Math.abs(deltaX)
    ) {
      carouselDrag =
        null;

      return;
    }

    carouselDrag.horizontal =
      true;

    carouselDrag.currentX =
      event.clientX;

    event.preventDefault();

    const carousel =
      carouselDrag.carousel;

    const track =
      carousel.querySelector(
        '[data-carousel-track]'
      );

    const index =
      Number(
        carousel.dataset
          .carouselIndex ||
        0
      );

    carousel.classList.add(
      'is-dragging'
    );

    if (track) {
      track.style.transition =
        'none';

      track.style.transform =
        `translate3d(calc(-${
          index * 100
        }% + ${deltaX}px), 0, 0)`;
    }
  }
);


function finishCarouselDrag(
  event
) {
  if (
    !carouselDrag ||
    carouselDrag.pointerId !==
      event.pointerId
  ) {
    return;
  }

  const drag =
    carouselDrag;

  carouselDrag =
    null;

  drag.carousel.classList.remove(
    'is-dragging'
  );

  if (!drag.horizontal) {
    return;
  }

  suppressPropertyCardClickUntil =
    performance.now() +
    350;

  const distance =
    drag.currentX -
    drag.startX;

  const threshold =
    Math.min(
      70,
      Math.max(
        35,
        drag.carousel.clientWidth *
        0.14
      )
    );

  if (
    Math.abs(
      distance
    ) >= threshold
  ) {

    moveCarousel(
      drag.carousel,
      distance < 0
        ? 1
        : -1
    );

  } else {

    setCarouselIndex(
      drag.carousel,
      Number(
        drag.carousel.dataset
          .carouselIndex ||
        0
      )
    );
  }

  try {
    drag.carousel.releasePointerCapture(
      event.pointerId
    );

  } catch (_error) {}
}


propertyGrid.addEventListener(
  'pointerup',
  finishCarouselDrag
);

propertyGrid.addEventListener(
  'pointercancel',
  finishCarouselDrag
);


viewAllButton.addEventListener(
  'click',
  () => {

    showingAll =
      !showingAll;

    renderDefaultProperties();
  }
);


function normalizeSearchCurrency(
  value
) {
  const currency =
    String(
      value ||
      'USD'
    ).toUpperCase();

  return [
    'XCD',
    'USD',
    'GBP'
  ].includes(
    currency
  )
    ? currency
    : 'USD';
}


function formatSearchPrice(
  amount,
  currency
) {
  const symbol =
    currency ===
      'XCD'
      ? 'EC$'
      : currency ===
          'GBP'
        ? '£'
        : 'US$';

  return `${symbol}${Number(
    amount
  ).toLocaleString(
    'en-US',
    {
      maximumFractionDigits:
        0
    }
  )}`;
}


function setPriceOptions(
  mode,
  currency =
    searchCurrency?.value ||
    'USD'
) {
  const minSelect =
    document.getElementById(
      'min-price'
    );

  const maxSelect =
    document.getElementById(
      'max-price'
    );

  if (
    !minSelect ||
    !maxSelect
  ) {
    return;
  }

  const selectedCurrency =
    normalizeSearchCurrency(
      currency
    );

  if (searchCurrency) {
    searchCurrency.value =
      selectedCurrency;
  }


  const priceRanges = {

    buy: {

      XCD: {
        min: [
          0,
          400000,
          750000,
          1250000,
          2000000
        ],

        max: [
          0,
          750000,
          1500000,
          3000000,
          5000000
        ]
      },


      USD: {
        min: [
          0,
          150000,
          300000,
          500000,
          750000
        ],

        max: [
          0,
          350000,
          600000,
          1000000,
          2000000
        ]
      },


      GBP: {
        min: [
          0,
          100000,
          200000,
          350000,
          500000
        ],

        max: [
          0,
          250000,
          500000,
          750000,
          1500000
        ]
      }

    },


    rent: {

      XCD: {
        min: [
          0,
          1500,
          2500,
          4000,
          6000
        ],

        max: [
          0,
          2500,
          4000,
          7000,
          10000
        ]
      },


      USD: {
        min: [
          0,
          750,
          1200,
          2000,
          3000
        ],

        max: [
          0,
          1500,
          2500,
          4000,
          6000
        ]
      },


      GBP: {
        min: [
          0,
          500,
          1000,
          1500,
          2500
        ],

        max: [
          0,
          1000,
          2000,
          3000,
          5000
        ]
      }

    }

  };


  const normalizedMode =
    mode ===
      'rent'
      ? 'rent'
      : 'buy';

  const ranges =
    priceRanges[
      normalizedMode
    ][
      selectedCurrency
    ];


  const makeOptions = (
    values,
    emptyLabel
  ) =>
    values
      .map(
        value => {

          const label =
            value === 0
              ? emptyLabel
              : formatSearchPrice(
                  value,
                  selectedCurrency
                );

          return `
            <option value="${value}">
              ${label}
            </option>
          `;
        }
      )
      .join('');


  minSelect.innerHTML =
    makeOptions(
      ranges.min,
      'No min'
    );

  maxSelect.innerHTML =
    makeOptions(
      ranges.max,
      'No max'
    );
}


function setSearchMode(
  mode
) {
  activeMode =
    mode ===
      'rent'
      ? 'rent'
      : 'buy';

  searchTabs.forEach(
    tab => {

      const isActive =
        tab.dataset.mode ===
        activeMode;

      tab.classList.toggle(
        'active',
        isActive
      );

      tab.setAttribute(
        'aria-selected',
        String(isActive)
      );
    }
  );

  setPriceOptions(
    activeMode,
    searchCurrency?.value ||
      'USD'
  );

  searchMessage.classList.remove(
    'show'
  );
}


searchCurrency?.addEventListener(
  'change',
  () => {

    setPriceOptions(
      activeMode,
      searchCurrency.value
    );

    searchMessage.classList.remove(
      'show'
    );
  }
);


searchTabs.forEach(
  tab => {

    tab.addEventListener(
      'click',
      () => {

        setSearchMode(
          tab.dataset.mode
        );
      }
    );
  }
);


document
  .querySelectorAll(
    '[data-filter-link]'
  )
  .forEach(
    link => {

      link.addEventListener(
        'click',
        () => {

          setSearchMode(
            link.dataset
              .filterLink
          );

          setTimeout(
            () => {

              const matches =
                allProperties.filter(
                  property =>
                    property.purpose ===
                    activeMode
                );

              searchActive =
                true;

              renderPropertyCards(
                matches
              );
            },
            50
          );
        }
      );
    }
  );


searchForm.addEventListener(
  'submit',
  event => {

    event.preventDefault();

    const locationValue =
      document
        .getElementById(
          'location'
        )
        .value
        .trim()
        .toLowerCase();

    const type =
      document.getElementById(
        'property-type'
      ).value;

    const currency =
      normalizeSearchCurrency(
        searchCurrency?.value ||
        'USD'
      );

    const minPrice =
      Number(
        document.getElementById(
          'min-price'
        ).value
      );

    const maxPrice =
      Number(
        document.getElementById(
          'max-price'
        ).value
      );

    const bedrooms =
      document.getElementById(
        'bedrooms'
      ).value;


    const matches =
      allProperties.filter(
        property => {

          const matchesMode =
            property.purpose ===
            activeMode;

          const matchesCurrency =
            normalizeSearchCurrency(
              property.currency
            ) ===
            currency;

          const matchesLocation =
            !locationValue ||
            String(
              property.location
            )
              .toLowerCase()
              .includes(
                locationValue
              );

          const matchesType =
            type ===
              'any' ||
            property.propertyType ===
              type;

          const matchesBeds =
            bedrooms ===
              'any' ||
            Number(
              property.bedrooms ||
              0
            ) >=
            Number(
              bedrooms
            );

          const price =
            Number(
              property.price ||
              0
            );

          const matchesMin =
            !minPrice ||
            price >=
              minPrice;

          const matchesMax =
            !maxPrice ||
            price <=
              maxPrice;

          return (
            matchesMode &&
            matchesCurrency &&
            matchesLocation &&
            matchesType &&
            matchesBeds &&
            matchesMin &&
            matchesMax
          );
        }
      );


    searchActive =
      true;

    renderPropertyCards(
      matches
    );

    searchMessage.textContent =
      matches.length
        ? `${
            matches.length
          } matching ${currency} ${
            matches.length ===
              1
              ? 'property'
              : 'properties'
          } found.`
        : 'No exact matches found. You can open a property request and we can look for you.';

    searchMessage.classList.add(
      'show'
    );

    document
      .getElementById(
        'properties'
      )
      .scrollIntoView({
        behavior:
          'smooth'
      });
  }
);


function selectRequestType(
  type
) {
  const normalized =
    [
      'buy',
      'rent',
      'sell'
    ].includes(type)
      ? type
      : 'buy';

  const input =
    ticketForm.querySelector(
      `input[name="requestType"][value="${normalized}"]`
    );

  if (input) {
    input.checked =
      true;
  }

  updateTicketLabels();
}


function updateTicketLabels() {
  const type =
    ticketForm.querySelector(
      'input[name="requestType"]:checked'
    )?.value ||
    'buy';

  const currency =
    ticketCurrency?.value ||
    'USD';

  ticketBudgetLabel
    .childNodes[0]
    .nodeValue =
      type ===
        'sell'
        ? `Expected price / valuation range (${currency})`
        : `Budget / target price (${currency})`;

  const budgetInput =
    document.getElementById(
      'ticket-budget'
    );

  if (budgetInput) {

    budgetInput.placeholder =
      currency ===
        'XCD'
        ? 'e.g. 950,000'
        : currency ===
            'GBP'
          ? 'e.g. 275,000'
          : 'e.g. 350,000';
  }

  document.getElementById(
    'ticket-location'
  ).placeholder =
    type ===
      'sell'
      ? 'Where is the property located?'
      : 'Where would you like to live / invest?';
}


ticketForm
  .querySelectorAll(
    'input[name="requestType"]'
  )
  .forEach(
    input => {

      input.addEventListener(
        'change',
        updateTicketLabels
      );
    }
  );


ticketCurrency?.addEventListener(
  'change',
  updateTicketLabels
);


document
  .querySelectorAll(
    '[data-request-link]'
  )
  .forEach(
    link => {

      link.addEventListener(
        'click',
        () => {

          selectRequestType(
            link.dataset
              .requestLink
          );
        }
      );
    }
  );


function makePreviewTicketReference() {
  const date =
    new Date();

  const stamp = [
    date.getFullYear(),

    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      '0'
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )

  ].join('');

  const suffix =
    Math.random()
      .toString(36)
      .slice(
        2,
        8
      )
      .toUpperCase();

  return `HER-${stamp}-${suffix}`;
}


function savePreviewTicket(
  ticket
) {
  const existing =
    JSON.parse(
      localStorage.getItem(
        'helen-estates-demo-tickets'
      ) ||
      '[]'
    );

  existing.unshift(
    ticket
  );

  localStorage.setItem(
    'helen-estates-demo-tickets',
    JSON.stringify(
      existing.slice(
        0,
        30
      )
    )
  );
}


function showTicketConfirmation({
  name,
  reference,
  email,
  emailSent,
  statusUrl
}) {
  ticketForm.hidden =
    true;

  ticketConfirmation.hidden =
    false;

  confirmationName.textContent =
    name ||
    'there';

  confirmationReference.textContent =
    reference ||
    '—';

  confirmationEmailNote.textContent =
    emailSent
      ? `A receipt has been sent to ${email}. Keep it for your reference.`
      : 'Your request is safely recorded. We could not confirm the receipt email, so please save your reference number.';

  if (statusUrl) {

    confirmationStatusLink.href =
      statusUrl;

    confirmationStatusLink.hidden =
      false;

  } else {

    confirmationStatusLink.hidden =
      true;
  }

  ticketConfirmation.scrollIntoView({
    behavior:
      'smooth',

    block:
      'center'
  });
}


newRequestButton?.addEventListener(
  'click',
  () => {

    ticketConfirmation.hidden =
      true;

    ticketForm.hidden =
      false;

    ticketStatus.className =
      'ticket-message';

    ticketStatus.textContent =
      '';

    ticketForm.reset();

    if (ticketCurrency) {
      ticketCurrency.value =
        'USD';
    }

    selectRequestType(
      'buy'
    );

    ticketReference.value =
      '';

    ticketForm.scrollIntoView({
      behavior:
        'smooth',

      block:
        'center'
    });
  }
);


ticketForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    ticketStatus.className =
      'ticket-message';

    ticketStatus.textContent =
      '';

    const submitButton =
      ticketForm.querySelector(
        '.ticket-submit'
      );

    const formData =
      new FormData(
        ticketForm
      );

    const selectedCurrency =
      String(
        formData.get(
          'budgetCurrency'
        ) ||
        'USD'
      );

    const safeCurrency =
      [
        'XCD',
        'USD',
        'GBP'
      ].includes(
        selectedCurrency
      )
        ? selectedCurrency
        : 'USD';


    const ticket = {

      requestType:
        formData.get(
          'requestType'
        ),

      name:
        String(
          formData.get(
            'name'
          ) ||
          ''
        ).trim(),

      email:
        String(
          formData.get(
            'email'
          ) ||
          ''
        ).trim(),

      phone:
        String(
          formData.get(
            'phone'
          ) ||
          ''
        ).trim(),

      contactMethod:
        formData.get(
          'contactMethod'
        ),

      location:
        String(
          formData.get(
            'location'
          ) ||
          ''
        ).trim(),

      propertyType:
        formData.get(
          'propertyType'
        ),

      budget:
        String(
          formData.get(
            'budget'
          ) ||
          ''
        ).trim(),

      budgetCurrency:
        safeCurrency,

      bedrooms:
        formData.get(
          'bedrooms'
        ),

      message:
        String(
          formData.get(
            'message'
          ) ||
          ''
        ).trim(),

      propertyReference:
        String(
          formData.get(
            'propertyReference'
          ) ||
          ''
        ).trim(),

      website:
        String(
          formData.get(
            'website'
          ) ||
          ''
        ).trim()
    };


    const isLocalPreview =
      location.protocol ===
        'file:' ||
      [
        'localhost',
        '127.0.0.1'
      ].includes(
        location.hostname
      );


    try {

      submitButton.disabled =
        true;

      submitButton.textContent =
        'Sending request…';


      if (
        BACKEND.enabled
      ) {

        const result =
          await BACKEND.createTicket(
            ticket
          );

        showTicketConfirmation({
          name:
            ticket.name,

          reference:
            result.reference,

          email:
            ticket.email,

          emailSent:
            Boolean(
              result.emailSent
            ),

          statusUrl:
            result.statusUrl ||
            ''
        });


      } else if (
        isLocalPreview
      ) {

        const previewReference =
          makePreviewTicketReference();

        savePreviewTicket({
          ...ticket,

          id:
            previewReference,

          status:
            'new',

          createdAt:
            new Date()
              .toISOString()
        });

        ticketStatus.textContent =
          `Preview mode: ${previewReference} was saved only in this browser. Connect Supabase before using this form with real customers.`;

        ticketStatus.classList.add(
          'show',
          'success'
        );


      } else {

        throw new Error(
          'The online request desk is not connected yet. Please try again once the service is enabled.'
        );
      }


    } catch (error) {

      console.error(
        error
      );

      ticketStatus.textContent =
        error.message ||
        'We could not submit your request. Please try again shortly.';

      ticketStatus.classList.add(
        'show',
        'error'
      );


    } finally {

      submitButton.disabled =
        false;

      submitButton.innerHTML =
        'Submit property request <span aria-hidden="true">→</span>';
    }
  }
);


/* =========================================================
   LIKED / PROPERTY PAGE ENQUIRY HANDOFF
   ========================================================= */

function applyStoredPropertyEnquiry() {
  const storedPropertyId =
    sessionStorage.getItem(
      'helen-estates-enquiry-property'
    );

  const storedSelectedProperty =
    sessionStorage.getItem(
      'helen-estates-selected-property'
    );

  let selectedPropertyData =
    null;

  if (storedSelectedProperty) {
    try {
      selectedPropertyData =
        JSON.parse(
          storedSelectedProperty
        );
    } catch (_error) {
      selectedPropertyData =
        null;
    }
  }

  const propertyId =
    storedPropertyId ||
    selectedPropertyData?.id;

  if (!propertyId) {
    return;
  }


  /*
    The liked page currently stores the
    property ID. Once the homepage has
    loaded the published properties, find
    the matching listing so the enquiry
    form can be completed correctly.
  */

  const property =
    allProperties.find(
      item =>
        String(item.id) ===
        String(propertyId)
    );


  if (!property) {

    sessionStorage.removeItem(
      'helen-estates-enquiry-property'
    );

    sessionStorage.removeItem(
      'helen-estates-selected-property'
    );

    return;
  }


  ticketReference.value =
    property.id;


  selectRequestType(
    property.purpose ||
    selectedPropertyData?.purpose ||
    'buy'
  );


  const propertyCurrency =
    normalizeSearchCurrency(
      property.currency ||
      selectedPropertyData?.currency ||
      'USD'
    );


  if (ticketCurrency) {

    ticketCurrency.value =
      propertyCurrency;

    updateTicketLabels();
  }


  const messageInput =
    document.getElementById(
      'ticket-message'
    );


  if (messageInput) {

    messageInput.value =
      `I'm interested in ${
        property.title ||
        selectedPropertyData?.title ||
        'this property'
      } (${property.id}). Please contact me with more information.`;
  }


  /*
    Remove the temporary values once they
    have been successfully applied so an old
    property does not appear in a later
    unrelated request.
  */

  sessionStorage.removeItem(
    'helen-estates-enquiry-property'
  );

  sessionStorage.removeItem(
    'helen-estates-selected-property'
  );
}


async function loadProperties() {
  try {

    allProperties =
      BACKEND.enabled
        ? await BACKEND
            .getPublishedProperties()
        : DEMO_PROPERTIES;

  } catch (error) {

    console.error(
      error
    );

    allProperties =
      DEMO_PROPERTIES;
  }

  propertiesLoading?.remove();

  setPriceOptions(
    activeMode,
    searchCurrency?.value ||
      'USD'
  );

  renderDefaultProperties();


  /*
    This must run AFTER the properties have
    loaded because liked.js only hands the
    homepage the selected property ID.
  */

  applyStoredPropertyEnquiry();
}


document.getElementById(
  'current-year'
).textContent =
  new Date()
    .getFullYear();


setPriceOptions(
  'buy',
  searchCurrency?.value ||
    'USD'
);


updateTicketLabels();


loadProperties();
