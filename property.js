(() => {
  'use strict';

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const config =
    window.HELEN_ESTATES_CONFIG || {};

  const supabaseUrl =
    String(
      config.supabaseUrl || ''
    ).replace(
      /\/$/,
      ''
    );

  const supabasePublicKey =
    String(
      config.supabasePublicKey || ''
    );


  /* =========================================================
     PAGE ELEMENTS
     ========================================================= */

  const loadingElement =
    document.getElementById(
      'property-loading'
    );

  const errorElement =
    document.getElementById(
      'property-error'
    );

  const propertyDetail =
    document.getElementById(
      'property-detail'
    );


  const gallery =
    document.getElementById(
      'detail-main-image'
    );

  const galleryTrack =
    document.getElementById(
      'detail-gallery-track'
    );

  const thumbnails =
    document.getElementById(
      'detail-thumbnails'
    );

  const previousButton =
    document.getElementById(
      'detail-gallery-prev'
    );

  const nextButton =
    document.getElementById(
      'detail-gallery-next'
    );

  const galleryCounter =
    document.getElementById(
      'detail-gallery-counter'
    );


  const purposeElement =
    document.getElementById(
      'detail-purpose'
    );

  const statusElement =
    document.getElementById(
      'detail-status'
    );

  const referenceElement =
    document.getElementById(
      'detail-reference'
    );

  const titleElement =
    document.getElementById(
      'detail-title'
    );

  const locationElement =
    document.getElementById(
      'detail-location'
    );

  const priceElement =
    document.getElementById(
      'detail-price'
    );

  const bedroomsElement =
    document.getElementById(
      'detail-bedrooms'
    );

  const bathroomsElement =
    document.getElementById(
      'detail-bathrooms'
    );

  const sizeElement =
    document.getElementById(
      'detail-size'
    );

  const descriptionElement =
    document.getElementById(
      'detail-description'
    );

  const enquiryButton =
    document.getElementById(
      'detail-enquire'
    );

  const likeButton =
    document.getElementById(
      'detail-like'
    );


  /* =========================================================
     STATE
     ========================================================= */

  let activeProperty =
    null;

  let propertyImages =
    [];

  let propertyMedia =
    [];

  let galleryIndex =
    0;

  let dragState =
    null;


  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const propertyId =
    String(
      urlParams.get(
        'id'
      ) || ''
    ).trim();


  /* =========================================================
     HELPERS
     ========================================================= */

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
    return String(
      value
    )
      .split(
        '-'
      )
      .filter(
        Boolean
      )
      .map(
        word =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(
        ' '
      );
  }


  function formatPrice(
    property
  ) {
    const currency =
      property.currency ||
      'USD';

    let formatted;


    try {

      formatted =
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

      formatted =
        `${currency} ${
          Number(
            property.price ||
            0
          ).toLocaleString(
            'en-GB'
          )
        }`;
    }


    return {
      price:
        formatted,

      period:
        property.price_period
          ? `/ ${property.price_period}`
          : ''
    };
  }


  function showError(
    message
  ) {
    loadingElement.hidden =
      true;

    propertyDetail.hidden =
      true;

    errorElement.hidden =
      false;

    errorElement.textContent =
      message;
  }


  /* =========================================================
     LIKED PROPERTY
     ========================================================= */

  function updateLikeButton() {
    if (
      !activeProperty ||
      !likeButton
    ) {
      return;
    }


    const favourites =
      savedFavouriteIds();


    const isSaved =
      favourites.has(
        activeProperty.id
      );


    likeButton.classList.toggle(
      'saved',
      isSaved
    );


    likeButton.setAttribute(
      'aria-pressed',
      String(
        isSaved
      )
    );


    likeButton.innerHTML =
      isSaved
        ? `
          <span aria-hidden="true">
            ♥
          </span>
          Saved property
        `
        : `
          <span aria-hidden="true">
            ♡
          </span>
          Save property
        `;
  }


  likeButton?.addEventListener(
    'click',
    () => {

      if (
        !activeProperty
      ) {
        return;
      }


      const favourites =
        savedFavouriteIds();


      if (
        favourites.has(
          activeProperty.id
        )
      ) {
        favourites.delete(
          activeProperty.id
        );

      } else {

        favourites.add(
          activeProperty.id
        );
      }


      saveFavouriteIds(
        favourites
      );


      updateLikeButton();
    }
  );


  /* =========================================================
     GALLERY
     ========================================================= */

  function updateGallery(
    requestedIndex,
    animate = true
  ) {
    if (
      !propertyMedia.length
    ) {
      return;
    }


    galleryIndex =
      (
        (
          requestedIndex %
          propertyMedia.length
        ) +
        propertyMedia.length
      ) %
      propertyMedia.length;


    gallery.dataset.galleryIndex =
      String(
        galleryIndex
      );


    galleryTrack.style.transition =
      animate
        ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';


    galleryTrack.style.transform =
      `translate3d(-${
        galleryIndex * 100
      }%, 0, 0)`;


    galleryCounter.textContent =
      `${
        galleryIndex + 1
      } / ${
        propertyMedia.length
      }`;


    /*
      Pause a video automatically when the
      visitor moves away from the video slide.
    */

    galleryTrack
      .querySelectorAll(
        'video[data-gallery-video-index]'
      )
      .forEach(
        video => {

          if (
            Number(
              video.dataset
                .galleryVideoIndex
            ) !==
            galleryIndex
          ) {
            video.pause();
          }
        }
      );


    thumbnails
      .querySelectorAll(
        '[data-thumbnail-index]'
      )
      .forEach(
        thumbnail => {

          const active =
            Number(
              thumbnail.dataset
                .thumbnailIndex
            ) ===
            galleryIndex;


          thumbnail.classList.toggle(
            'active',
            active
          );


          thumbnail.setAttribute(
            'aria-current',
            active
              ? 'true'
              : 'false'
          );


          if (
            active
          ) {
            thumbnail.scrollIntoView({
              behavior:
                animate
                  ? 'smooth'
                  : 'auto',

              block:
                'nearest',

              inline:
                'nearest'
            });
          }
        }
      );
  }


  function moveGallery(
    direction
  ) {
    updateGallery(
      galleryIndex +
      direction
    );
  }


  function createVideoPlayBadge() {
    const playBadge =
      document.createElement(
        'span'
      );


    playBadge.textContent =
      '▶';


    playBadge.setAttribute(
      'aria-hidden',
      'true'
    );


    playBadge.style.position =
      'absolute';

    playBadge.style.left =
      '50%';

    playBadge.style.top =
      '50%';

    playBadge.style.transform =
      'translate(-50%, -50%)';

    playBadge.style.width =
      '34px';

    playBadge.style.height =
      '34px';

    playBadge.style.display =
      'grid';

    playBadge.style.placeItems =
      'center';

    playBadge.style.borderRadius =
      '50%';

    playBadge.style.background =
      'rgba(0, 0, 0, 0.72)';

    playBadge.style.color =
      '#fff';

    playBadge.style.fontSize =
      '14px';

    playBadge.style.paddingLeft =
      '2px';

    playBadge.style.pointerEvents =
      'none';


    return playBadge;
  }


  function renderGallery() {

    /*
      Load all property images.
    */

    propertyImages =
      Array.isArray(
        activeProperty.images
      )
        ? activeProperty.images.filter(
            image =>
              typeof image ===
                'string' &&
              image.trim()
          )
        : [];


    /*
      Load the optional video.
    */

    const videoUrl =
      typeof activeProperty.video_url ===
        'string'
        ? activeProperty.video_url.trim()
        : '';


    /*
      Convert all photographs into gallery items.
    */

    propertyMedia =
      propertyImages.map(
        (
          image,
          index
        ) => ({
          type:
            'image',

          url:
            image,

          imageNumber:
            index + 1
        })
      );


    /*
      Add the video as the FINAL gallery item.
    */

    if (
      videoUrl
    ) {
      propertyMedia.push({
        type:
          'video',

        url:
          videoUrl
      });
    }


    /*
      Fallback image if the property somehow
      has no photographs and no video.
    */

    if (
      !propertyMedia.length
    ) {
      propertyImages = [
        'property-1.jpg'
      ];


      propertyMedia = [
        {
          type:
            'image',

          url:
            'property-1.jpg',

          imageNumber:
            1
        }
      ];
    }


    /*
      Update accessibility labels depending
      on whether a video exists.
    */

    const gallerySection =
      gallery.closest(
        '.detail-gallery'
      );


    gallerySection?.setAttribute(
      'aria-label',
      videoUrl
        ? 'Property photos and video tour'
        : 'Property photographs'
    );


    previousButton?.setAttribute(
      'aria-label',
      videoUrl
        ? 'Previous property photo or video'
        : 'Previous property image'
    );


    nextButton?.setAttribute(
      'aria-label',
      videoUrl
        ? 'Next property photo or video'
        : 'Next property image'
    );


    galleryTrack.innerHTML =
      '';


    thumbnails.innerHTML =
      '';


    propertyMedia.forEach(
      (
        item,
        index
      ) => {

        let slide;


        /*
          VIDEO SLIDE
        */

        if (
          item.type ===
          'video'
        ) {
          slide =
            document.createElement(
              'video'
            );


          slide.className =
            'detail-gallery-slide detail-gallery-video';


          slide.src =
            item.url;


          slide.controls =
            true;


          slide.preload =
            'metadata';


          slide.playsInline =
            true;


          /*
            Explicitly prevent autoplay.
          */

          slide.autoplay =
            false;


          slide.dataset.galleryVideoIndex =
            String(
              index
            );


          slide.setAttribute(
            'aria-label',
            `${activeProperty.title} — property video tour`
          );


          /*
            Use the first property photograph
            as the video's poster image.
          */

          if (
            propertyImages[0]
          ) {
            slide.poster =
              propertyImages[0];
          }


          /*
            Your property.html CSS has
            pointer-events:none on gallery slides.

            The video must override this so the
            visitor can click Play, Pause,
            Fullscreen, volume, etc.
          */

          slide.style.pointerEvents =
            'auto';


          slide.style.objectFit =
            'contain';


          slide.style.background =
            '#000';


        /*
          IMAGE SLIDE
        */

        } else {

          slide =
            document.createElement(
              'img'
            );


          slide.className =
            'detail-gallery-slide';


          slide.src =
            item.url;


          slide.alt =
            `${activeProperty.title} — image ${
              item.imageNumber
            } of ${
              propertyImages.length
            }`;


          slide.loading =
            index ===
            0
              ? 'eager'
              : 'lazy';


          slide.draggable =
            false;
        }


        galleryTrack.appendChild(
          slide
        );


        /*
          CREATE THUMBNAIL
        */

        const thumbnail =
          document.createElement(
            'button'
          );


        thumbnail.type =
          'button';


        thumbnail.className =
          'detail-thumbnail';


        thumbnail.dataset.thumbnailIndex =
          String(
            index
          );


        thumbnail.setAttribute(
          'aria-label',
          item.type ===
            'video'
            ? 'Show property video tour'
            : `Show image ${
                item.imageNumber
              }`
        );


        /*
          VIDEO THUMBNAIL
        */

        if (
          item.type ===
          'video'
        ) {
          thumbnail.style.position =
            'relative';


          thumbnail.style.overflow =
            'hidden';


          thumbnail.style.background =
            '#173f3a';


          /*
            Use property cover photo underneath
            the play button when available.
          */

          if (
            propertyImages[0]
          ) {
            const thumbnailImage =
              document.createElement(
                'img'
              );


            thumbnailImage.src =
              propertyImages[0];


            thumbnailImage.alt =
              '';


            thumbnailImage.loading =
              'lazy';


            thumbnail.appendChild(
              thumbnailImage
            );
          }


          thumbnail.appendChild(
            createVideoPlayBadge()
          );


        /*
          IMAGE THUMBNAIL
        */

        } else {

          const thumbnailImage =
            document.createElement(
              'img'
            );


          thumbnailImage.src =
            item.url;


          thumbnailImage.alt =
            '';


          thumbnailImage.loading =
            'lazy';


          thumbnail.appendChild(
            thumbnailImage
          );
        }


        thumbnail.addEventListener(
          'click',
          () => {

            updateGallery(
              index
            );
          }
        );


        thumbnails.appendChild(
          thumbnail
        );
      }
    );


    const multiple =
      propertyMedia.length >
      1;


    previousButton.hidden =
      !multiple;


    nextButton.hidden =
      !multiple;


    thumbnails.hidden =
      !multiple;


    galleryCounter.hidden =
      !multiple;


    updateGallery(
      0,
      false
    );
  }


  previousButton?.addEventListener(
    'click',
    event => {

      event.preventDefault();


      moveGallery(
        -1
      );
    }
  );


  nextButton?.addEventListener(
    'click',
    event => {

      event.preventDefault();


      moveGallery(
        1
      );
    }
  );


  /* =========================================================
     GALLERY SWIPE / DRAG
     ========================================================= */

  gallery?.addEventListener(
    'pointerdown',
    event => {

      /*
        Don't start a swipe while the visitor
        is using the video controls.
      */

      if (
        event.target.closest(
          'button, video'
        )
      ) {
        return;
      }


      if (
        propertyMedia.length <=
        1
      ) {
        return;
      }


      if (
        event.pointerType ===
          'mouse' &&
        event.button !==
          0
      ) {
        return;
      }


      dragState = {
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

        gallery.setPointerCapture(
          event.pointerId
        );

      } catch (_error) {}
    }
  );


  gallery?.addEventListener(
    'pointermove',
    event => {

      if (
        !dragState ||
        dragState.pointerId !==
          event.pointerId
      ) {
        return;
      }


      const deltaX =
        event.clientX -
        dragState.startX;


      const deltaY =
        event.clientY -
        dragState.startY;


      if (
        !dragState.horizontal &&
        Math.abs(
          deltaX
        ) <
        8 &&
        Math.abs(
          deltaY
        ) <
        8
      ) {
        return;
      }


      /*
        Allow normal vertical page scrolling.
      */

      if (
        !dragState.horizontal &&
        Math.abs(
          deltaY
        ) >
        Math.abs(
          deltaX
        )
      ) {
        dragState =
          null;


        return;
      }


      dragState.horizontal =
        true;


      dragState.currentX =
        event.clientX;


      event.preventDefault();


      gallery.classList.add(
        'is-dragging'
      );


      galleryTrack.style.transition =
        'none';


      galleryTrack.style.transform =
        `translate3d(calc(-${
          galleryIndex * 100
        }% + ${
          deltaX
        }px), 0, 0)`;
    }
  );


  function finishGalleryDrag(
    event
  ) {
    if (
      !dragState ||
      dragState.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const currentDrag =
      dragState;


    dragState =
      null;


    gallery.classList.remove(
      'is-dragging'
    );


    if (
      !currentDrag.horizontal
    ) {
      return;
    }


    const distance =
      currentDrag.currentX -
      currentDrag.startX;


    const threshold =
      Math.min(
        90,
        Math.max(
          40,
          gallery.clientWidth *
          0.12
        )
      );


    if (
      Math.abs(
        distance
      ) >=
      threshold
    ) {
      moveGallery(
        distance <
        0
          ? 1
          : -1
      );

    } else {

      updateGallery(
        galleryIndex
      );
    }


    try {

      gallery.releasePointerCapture(
        event.pointerId
      );

    } catch (_error) {}
  }


  gallery?.addEventListener(
    'pointerup',
    finishGalleryDrag
  );


  gallery?.addEventListener(
    'pointercancel',
    finishGalleryDrag
  );


  gallery?.addEventListener(
    'dragstart',
    event =>
      event.preventDefault()
  );


  /* =========================================================
     PROPERTY CONTENT
     ========================================================= */

  function populateProperty() {

    const property =
      activeProperty;


    document.title =
      `${property.title} | Helen Estates Realtors`;


    purposeElement.textContent =
      property.purpose ===
      'rent'
        ? 'For Rent'
        : 'For Sale';


    statusElement.textContent =
      property.status ||
      'Available';


    referenceElement.textContent =
      property.id;


    titleElement.textContent =
      property.title;


    locationElement.textContent =
      [
        property.location,

        formatPropertyType(
          property.property_type
        )
      ]
        .filter(
          Boolean
        )
        .join(
          ' · '
        );


    const formattedPrice =
      formatPrice(
        property
      );


    priceElement.innerHTML =
      formattedPrice.period
        ? `${
            formattedPrice.price
          } <small>${
            formattedPrice.period
          }</small>`
        : formattedPrice.price;


    bedroomsElement.textContent =
      Number(
        property.bedrooms ||
        0
      ) >
      0
        ? String(
            property.bedrooms
          )
        : 'Not specified';


    bathroomsElement.textContent =
      Number(
        property.bathrooms ||
        0
      ) >
      0
        ? String(
            property.bathrooms
          )
        : 'Not specified';


    sizeElement.textContent =
      Number(
        property.size ||
        0
      ) >
      0
        ? `${
            Number(
              property.size
            ).toLocaleString(
              'en-GB'
            )
          } sq ft`
        : 'Not specified';


    descriptionElement.textContent =
      property.description ||
      'Please contact Helen Estates Realtors for further information about this property.';


    renderGallery();


    updateLikeButton();
  }


  /* =========================================================
     ENQUIRY
     ========================================================= */

  enquiryButton?.addEventListener(
    'click',
    () => {

      if (
        !activeProperty
      ) {
        return;
      }


      sessionStorage.setItem(
        'helen-estates-enquiry-property',
        activeProperty.id
      );


      sessionStorage.setItem(
        'helen-estates-selected-property',

        JSON.stringify({
          id:
            activeProperty.id,

          title:
            activeProperty.title,

          purpose:
            activeProperty.purpose,

          currency:
            activeProperty.currency ||
            'USD'
        })
      );


      window.location.href =
        'index.html#request';
    }
  );


  /* =========================================================
     FETCH PROPERTY
     ========================================================= */

  async function loadProperty() {

    if (
      !propertyId
    ) {
      showError(
        'No property reference was supplied.'
      );


      return;
    }


    if (
      !supabaseUrl ||
      !supabasePublicKey
    ) {
      showError(
        'The property service is temporarily unavailable.'
      );


      return;
    }


    try {

      const endpoint =
        new URL(
          `${supabaseUrl}/rest/v1/properties`
        );


      /*
        video_url is included here so Supabase
        sends the video's public URL to the page.
      */

      endpoint.searchParams.set(
        'select',
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
          'description',
          'featured',
          'published',
          'status',
          'images',
          'video_url',
          'created_at',
          'updated_at'
        ].join(
          ','
        )
      );


      endpoint.searchParams.set(
        'id',
        `eq.${propertyId}`
      );


      endpoint.searchParams.set(
        'published',
        'eq.true'
      );


      endpoint.searchParams.set(
        'limit',
        '1'
      );


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
          `Property request failed with ${response.status}`
        );
      }


      const properties =
        await response.json();


      if (
        !Array.isArray(
          properties
        ) ||
        !properties.length
      ) {
        showError(
          'This property is no longer available or could not be found.'
        );


        return;
      }


      activeProperty =
        properties[0];


      populateProperty();


      loadingElement.hidden =
        true;


      errorElement.hidden =
        true;


      propertyDetail.hidden =
        false;


    } catch (
      error
    ) {

      console.error(
        'Property page error:',
        error
      );


      showError(
        'We could not load this property. Please check your connection and try again.'
      );
    }
  }


  /* =========================================================
     INITIALISE
     ========================================================= */

  loadProperty();

})();
