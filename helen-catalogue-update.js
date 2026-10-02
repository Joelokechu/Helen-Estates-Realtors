/* Load after the existing page scripts, immediately before </body>. */
(() => {
  'use strict';

  const script = document.currentScript;
  const base = new URL('.', script.src);

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('helen-catalogue-update.css', base).href;
  document.head.appendChild(css);

  const brandLogo = document.querySelector(
    '.brand-logo, .brand-badge img, .brand img'
  );

  const logo =
    brandLogo?.getAttribute('src') ||
    new URL('helen-estates-logo.png', base).href;

  const logoUrl = new URL(logo, document.baseURI).href;

  const mediaSelector =
    '.property-image, .liked-property-image, .detail-main-image';

  /*
   * Show all properties initially.
   * Reuse the existing search, favourites, enquiries and carousel handlers.
   */
  if (document.getElementById('property-grid')) {
    if (
      typeof renderDefaultProperties === 'function' &&
      typeof getPropertyImages === 'function'
    ) {
      getPropertyImages = function (property) {
        const images = Array.isArray(property.images)
          ? property.images.filter(
              image =>
                typeof image === 'string' &&
                image.trim()
            )
          : [];

        return images.length ? images : [logo];
      };

      showingAll = true;

      renderDefaultProperties = function () {
        searchActive = false;

        const visible = showingAll
          ? allProperties
          : allProperties.filter(property => property.featured);

        renderPropertyCards(visible);

        const heading = document.querySelector(
          '#properties .section-heading-row h2'
        );

        if (heading) {
          heading.textContent = showingAll
            ? 'All properties'
            : 'Featured properties';
        }

        viewAllButton.innerHTML = showingAll
          ? 'Show featured <span aria-hidden="true">→</span>'
          : 'View all properties <span aria-hidden="true">→</span>';

        viewAllButton.setAttribute(
          'aria-pressed',
          String(!showingAll)
        );

        viewAllButton.setAttribute(
          'aria-controls',
          'property-grid'
        );

        if (!showingAll && !visible.length) {
          propertiesStatus.textContent =
            'No featured properties at the moment. Select “View all properties” to browse the full catalogue.';
        }
      };

      renderDefaultProperties();
    } else {
      console.warn(
        'Helen Estates catalogue update: the expected homepage functions are unavailable. Check that this file loads after script.js.'
      );
    }
  }

  /* Website creator credit. */
  const footer = document.querySelector(
    '.footer-bottom, .site-footer'
  );

  if (
    footer &&
    !document.querySelector('.he-creator-credit')
  ) {
    const credit = document.createElement('p');
    credit.className = 'he-creator-credit';
    credit.append('Created by ');

    const link = document.createElement('a');
    link.href = 'https://insightsbyjoel.com/';
    link.textContent = 'insightsbyjoel.com';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    credit.appendChild(link);
    footer.appendChild(credit);
  }

  /* Identify the existing missing-photo fallback. */
  function isPlaceholder(image) {
    const src = image.getAttribute('src') || '';

    return (
      !src.trim() ||
      new URL(src, document.baseURI).href === logoUrl ||
      /(?:^|\/)property-1\.jpg(?:[?#]|$)/i.test(src)
    );
  }

  /* Add logo placeholders to catalogue, liked and detail pages. */
  function decorateImages() {
    const imageSelectors = mediaSelector
      .split(', ')
      .map(selector => `${selector} img`)
      .join(', ');

    document.querySelectorAll(
      `${imageSelectors}, .detail-thumbnail img`
    ).forEach(image => {
      const placeholder = isPlaceholder(image);

      if (placeholder && image.src !== logoUrl) {
        image.src = logoUrl;
      }

      image.classList.toggle(
        'he-logo-placeholder',
        placeholder
      );

      if (placeholder) {
        image.alt =
          'Helen Estates Realtors — property photos coming soon';
      }
    });

    document.querySelectorAll(mediaSelector).forEach(media => {
      const placeholder = Boolean(
        media.querySelector('img.he-logo-placeholder')
      );

      media.classList.toggle(
        'he-photo-coming-soon',
        placeholder
      );

      const label = media.querySelector(
        '.he-coming-soon-label'
      );

      if (placeholder && !label) {
        const message = document.createElement('span');
        message.className = 'he-coming-soon-label';
        message.textContent = 'Coming soon';
        message.setAttribute('aria-hidden', 'true');

        media.appendChild(message);
      } else if (!placeholder && label) {
        label.remove();
      }
    });
  }

  decorateImages();

  /*
   * Property and liked pages load asynchronously.
   * Update placeholders whenever their images are rendered.
   */
  const observer = new MutationObserver(decorateImages);

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src']
  });
})();
