(() => {
  'use strict';

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (reducedMotion) {
    return;
  }

  document.documentElement.classList.add('motion-ready');

  function addReveal(element, type = 'up', delay = 0) {
    if (!element || element.dataset.revealPrepared === 'true') {
      return;
    }

    element.dataset.revealPrepared = 'true';

    element.classList.add(
      `reveal-${type}`
    );

    element.style.setProperty(
      '--reveal-delay',
      `${delay}ms`
    );
  }


  function prepareStaticReveals() {

    addReveal(
      document.querySelector(
        '.search-shell'
      ),
      'up',
      30
    );


    document
      .querySelectorAll(
        '.section-heading-row'
      )
      .forEach(
        element =>
          addReveal(
            element,
            'up',
            0
          )
      );


    addReveal(
      document.querySelector(
        '.request-copy'
      ),
      'left',
      0
    );


    addReveal(
      document.querySelector(
        '.ticket-card'
      ),
      'right',
      90
    );


    addReveal(
      document.querySelector(
        '.about-image'
      ),
      'left',
      0
    );


    addReveal(
      document.querySelector(
        '.about-copy'
      ),
      'right',
      90
    );


    document
      .querySelectorAll(
        '.section-heading.centered'
      )
      .forEach(
        element =>
          addReveal(
            element,
            'up',
            0
          )
      );


    document
      .querySelectorAll(
        '.services-grid article'
      )
      .forEach(
        (element, index) => {

          addReveal(
            element,
            'up',
            index * 90
          );
        }
      );


    document
      .querySelectorAll(
        `
        .reviews-section .review-summary,
        .reviews-section .reviews-list,
        .reviews-section .review-form-card
        `
      )
      .forEach(
        (element, index) => {

          addReveal(
            element,
            'up',
            index * 80
          );
        }
      );


    addReveal(
      document.querySelector(
        '.closing-cta-inner'
      ),
      'up',
      0
    );


    document
      .querySelectorAll(
        '.footer-grid > div'
      )
      .forEach(
        (element, index) => {

          addReveal(
            element,
            'up',
            Math.min(
              index * 60,
              240
            )
          );
        }
      );
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              'is-visible'
            );

            observer.unobserve(
              entry.target
            );
          }
        );
      },
      {
        threshold: 0.12,

        rootMargin:
          '0px 0px -8% 0px'
      }
    );


  function observePreparedElements(
    root = document
  ) {

    root
      .querySelectorAll(
        `
        .reveal-up,
        .reveal-left,
        .reveal-right,
        .reveal-scale
        `
      )
      .forEach(
        element => {

          if (
            element.dataset
              .revealObserved ===
            'true'
          ) {
            return;
          }

          element.dataset
            .revealObserved =
              'true';

          observer.observe(
            element
          );
        }
      );
  }


  function preparePropertyCards() {

    document
      .querySelectorAll(
        '.property-card'
      )
      .forEach(
        (card, index) => {

          addReveal(
            card,
            'up',
            (index % 4) * 70
          );
        }
      );

    observePreparedElements(
      document
    );
  }


  prepareStaticReveals();

  preparePropertyCards();

  observePreparedElements(
    document
  );


  const propertyGrid =
    document.getElementById(
      'property-grid'
    );


  if (propertyGrid) {

    const propertyObserver =
      new MutationObserver(
        () => {

          preparePropertyCards();
        }
      );


    propertyObserver.observe(
      propertyGrid,
      {
        childList: true,

        subtree: false
      }
    );
  }

})();
