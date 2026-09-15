(() => {
  'use strict';


  /* =========================================================
     CONFIG
     ========================================================= */

  const config =
    window.HELEN_ESTATES_CONFIG || {};


  const supabaseUrl =
    String(
      config.supabaseUrl || ''
    ).replace(/\/$/, '');


  const supabasePublicKey =
    String(
      config.supabasePublicKey || ''
    );


  /* =========================================================
     ELEMENTS
     ========================================================= */

  const likedGrid =
    document.getElementById(
      'liked-grid'
    );


  const likedCount =
    document.getElementById(
      'liked-count'
    );


  const clearLikedButton =
    document.getElementById(
      'clear-liked'
    );


  const likedToolbar =
    document.getElementById(
      'liked-toolbar'
    );


  /* =========================================================
     HELPERS
     ========================================================= */

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


  function saveFavouriteIds(
    favourites
  ) {

    localStorage.setItem(
      'helen-estates-favourites',
      JSON.stringify(
        [...favourites]
      )
    );
  }


  function formatPropertyType(
    value = ''
  ) {

    return String(value)
      .split('-')
      .map(
        part =>
          part.charAt(0)
            .toUpperCase() +
          part.slice(1)
      )
      .join(' ');
  }


  function formatPrice(
    property
  ) {

    const currency =
      property.currency ||
      'USD';


    let formattedPrice;


    try {

      formattedPrice =
        new Intl.NumberFormat(
          'en-GB',
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

      formattedPrice =
        `${escapeHTML(
          currency
        )} ${Number(
          property.price ||
          0
        ).toLocaleString(
          'en-GB'
        )}`;
    }


    if (
      property.price_period
    ) {

      return (
        `${formattedPrice} ` +
        `<small>/ ${escapeHTML(
          property.price_period
        )}</small>`
      );
    }


    return formattedPrice;
  }


  /* =========================================================
     EMPTY STATE
     ========================================================= */

  function renderEmptyState() {

    likedGrid.innerHTML = `

      <div class="liked-empty">

        <div
          class="liked-empty-icon"
          aria-hidden="true"
        >
          ♡
        </div>

        <h2>
          No liked properties yet.
        </h2>

        <p>
          Tap the heart on any property you like and it
          will appear here automatically.
        </p>

        <a
          class="button button-accent"
          href="index.html#properties"
        >
          Explore properties
          <span aria-hidden="true">
            →
          </span>
        </a>

      </div>

    `;


    likedCount.textContent =
      '0';


    likedToolbar.hidden =
      true;
  }


  function updateCount(
    count
  ) {

    likedCount.textContent =
      String(count);


    likedToolbar.hidden =
      count === 0;
  }


  /* =========================================================
     RENDER PROPERTIES
     ========================================================= */

  function renderProperties(
    properties
  ) {

    if (
      !properties.length
    ) {

      renderEmptyState();

      return;
    }


    updateCount(
      properties.length
    );


    likedGrid.innerHTML =
      properties
        .map(
          property => {

            const image =
              Array.isArray(
                property.images
              ) &&
              property.images.length
                ? property.images[0]
                : 'property-1.jpg';


            const isRent =
              property.purpose ===
              'rent';


            const bedrooms =
              Number(
                property.bedrooms ||
                0
              );


            const bathrooms =
              Number(
                property.bathrooms ||
                0
              );


            const size =
              Number(
                property.size ||
                0
              );


            const metaItems =
              [];


            if (
              bedrooms > 0
            ) {

              metaItems.push(
                `${bedrooms} ${
                  bedrooms === 1
                    ? 'bed'
                    : 'beds'
                }`
              );
            }


            if (
              bathrooms > 0
            ) {

              metaItems.push(
                `${bathrooms} ${
                  bathrooms === 1
                    ? 'bath'
                    : 'baths'
                }`
              );
            }


            if (
              size > 0
            ) {

              metaItems.push(
                `${size.toLocaleString(
                  'en-GB'
                )} sq ft`
              );
            }


            return `

              <article
                class="liked-property-card property-card-clickable"

                data-property-id="${escapeHTML(
                  property.id
                )}"

                data-open-property="${escapeHTML(
                  property.id
                )}"

                tabindex="0"

                role="link"

                aria-label="View ${escapeHTML(
                  property.title
                )}"
              >


                <div
                  class="liked-property-image"
                >

                  <img
                    src="${escapeHTML(
                      image
                    )}"

                    alt="${escapeHTML(
                      property.title
                    )}"

                    loading="lazy"
                  />


                  <span
                    class="
                      liked-property-badge
                      ${
                        isRent
                          ? 'rent'
                          : ''
                      }
                    "
                  >

                    ${
                      isRent
                        ? 'For Rent'
                        : 'For Sale'
                    }

                  </span>


                  <button
                    class="liked-remove"

                    type="button"

                    data-remove-liked="${escapeHTML(
                      property.id
                    )}"

                    aria-label="Remove ${escapeHTML(
                      property.title
                    )} from liked properties"

                    title="Remove from liked properties"
                  >
                    ♥
                  </button>

                </div>


                <div
                  class="liked-property-content"
                >

                  <p
                    class="liked-property-type"
                  >

                    ${escapeHTML(
                      formatPropertyType(
                        property.property_type
                      )
                    )}

                  </p>


                  <h2>

                    ${escapeHTML(
                      property.title
                    )}

                  </h2>


                  <p
                    class="liked-location"
                  >

                    ${escapeHTML(
                      property.location
                    )}

                  </p>


                  ${
                    metaItems.length

                      ? `

                        <ul
                          class="liked-meta"
                        >

                          ${metaItems
                            .map(
                              item =>
                                `<li>${escapeHTML(
                                  item
                                )}</li>`
                            )
                            .join('')}

                        </ul>

                      `

                      : ''
                  }


                  <div
                    class="liked-property-bottom"
                  >

                    <p
                      class="liked-price"
                    >

                      ${formatPrice(
                        property
                      )}

                    </p>


                    <a
                      class="liked-enquire"

                      href="index.html#request"

                      data-liked-enquire="${escapeHTML(
                        property.id
                      )}"
                    >
                      Enquire →
                    </a>

                  </div>

                </div>

              </article>
            `;
          }
        )
        .join('');


    bindRemoveButtons();

    bindEnquiryLinks();

    bindPropertyCards();
  }


  /* =========================================================
     OPEN PROPERTY PAGE
     ========================================================= */

  function bindPropertyCards() {

    likedGrid
      .querySelectorAll(
        '[data-open-property]'
      )
      .forEach(
        card => {

          card.addEventListener(
            'click',
            event => {

              if (
                event.target.closest(
                  'button, a'
                )
              ) {

                return;
              }


              const propertyId =
                card.dataset
                  .openProperty;


              if (
                !propertyId
              ) {

                return;
              }


              window.location.href =
                `property.html?id=${encodeURIComponent(
                  propertyId
                )}`;
            }
          );


          card.addEventListener(
            'keydown',
            event => {

              if (
                event.key !==
                  'Enter' &&
                event.key !==
                  ' '
              ) {

                return;
              }


              if (
                event.target.closest(
                  'button, a'
                )
              ) {

                return;
              }


              event.preventDefault();


              const propertyId =
                card.dataset
                  .openProperty;


              if (
                !propertyId
              ) {

                return;
              }


              window.location.href =
                `property.html?id=${encodeURIComponent(
                  propertyId
                )}`;
            }
          );

        }
      );
  }


  /* =========================================================
     REMOVE INDIVIDUAL LIKED PROPERTY
     ========================================================= */

  function bindRemoveButtons() {

    likedGrid
      .querySelectorAll(
        '[data-remove-liked]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            event => {

              event.preventDefault();

              event.stopPropagation();


              const propertyId =
                button.dataset
                  .removeLiked;


              if (
                !propertyId
              ) {

                return;
              }


              const favourites =
                savedFavouriteIds();


              favourites.delete(
                propertyId
              );


              saveFavouriteIds(
                favourites
              );


              const card =
                button.closest(
                  '.liked-property-card'
                );


              if (card) {

                card.remove();
              }


              const remainingCards =
                likedGrid
                  .querySelectorAll(
                    '.liked-property-card'
                  )
                  .length;


              updateCount(
                remainingCards
              );


              if (
                remainingCards ===
                0
              ) {

                renderEmptyState();
              }
            }
          );

        }
      );
  }


  /* =========================================================
     ENQUIRY LINKS
     ========================================================= */

  function bindEnquiryLinks() {

    likedGrid
      .querySelectorAll(
        '[data-liked-enquire]'
      )
      .forEach(
        link => {

          link.addEventListener(
            'click',
            event => {

              event.stopPropagation();


              const propertyId =
                link.dataset
                  .likedEnquire;


              if (
                !propertyId
              ) {

                return;
              }


              sessionStorage.setItem(
                'helen-estates-enquiry-property',
                propertyId
              );
            }
          );

        }
      );
  }


  /* =========================================================
     LOAD LIKED PROPERTIES
     ========================================================= */

  async function loadLikedProperties() {

    const favourites =
      savedFavouriteIds();


    if (
      !favourites.size
    ) {

      renderEmptyState();

      return;
    }


    if (
      !supabaseUrl ||
      !supabasePublicKey
    ) {

      likedGrid.innerHTML = `

        <div class="liked-empty">

          <div
            class="liked-empty-icon"
          >
            !
          </div>

          <h2>
            Unable to load properties.
          </h2>

          <p>
            The property service is temporarily unavailable.
            Please try again shortly.
          </p>

        </div>

      `;


      return;
    }


    try {

      const ids =
        [...favourites];


      const filter =
        ids
          .map(
            id =>
              `"${String(
                id
              ).replaceAll(
                '"',
                ''
              )}"`
          )
          .join(',');


      const endpoint =
        `${supabaseUrl}` +
        `/rest/v1/properties` +
        `?select=` +
        encodeURIComponent(
          [
            'id',
            'title',
            'purpose',
            'property_type',
            'location',
            'bedrooms',
            'bathrooms',
            'size',
            'price',
            'currency',
            'price_period',
            'status',
            'images'
          ].join(',')
        ) +
        `&id=in.(${encodeURIComponent(
          filter
        )})` +
        `&published=eq.true`;


      const response =
        await fetch(
          endpoint,
          {
            method:
              'GET',

            headers: {
              apikey:
                supabasePublicKey
            }
          }
        );


      if (
        !response.ok
      ) {

        throw new Error(
          `Properties request failed with ${response.status}`
        );
      }


      const properties =
        await response.json();


      const propertyMap =
        new Map(
          properties.map(
            property => [
              String(
                property.id
              ),
              property
            ]
          )
        );


      const orderedProperties =
        ids
          .map(
            id =>
              propertyMap.get(
                String(id)
              )
          )
          .filter(Boolean);


      const validIds =
        new Set(
          orderedProperties.map(
            property =>
              String(
                property.id
              )
          )
        );


      if (
        validIds.size !==
        favourites.size
      ) {

        saveFavouriteIds(
          validIds
        );
      }


      renderProperties(
        orderedProperties
      );


    } catch (error) {

      console.error(
        'Liked properties error:',
        error
      );


      likedGrid.innerHTML = `

        <div class="liked-empty">

          <div
            class="liked-empty-icon"
          >
            !
          </div>

          <h2>
            We could not load your liked properties.
          </h2>

          <p>
            Please check your connection and try again.
          </p>

          <button
            class="button button-accent"
            type="button"
            id="retry-liked"
          >
            Try again
          </button>

        </div>

      `;


      const retryButton =
        document.getElementById(
          'retry-liked'
        );


      retryButton
        ?.addEventListener(
          'click',
          () => {

            window.location.reload();
          }
        );
    }
  }


  /* =========================================================
     CLEAR ALL LIKED PROPERTIES
     ========================================================= */

  clearLikedButton
    ?.addEventListener(
      'click',
      () => {

        const favourites =
          savedFavouriteIds();


        if (
          !favourites.size
        ) {

          return;
        }


        const confirmed =
          window.confirm(
            'Remove all liked properties?'
          );


        if (
          !confirmed
        ) {

          return;
        }


        localStorage.removeItem(
          'helen-estates-favourites'
        );


        renderEmptyState();
      }
    );


  /* =========================================================
     INITIALISE
     ========================================================= */

  loadLikedProperties();

})();
