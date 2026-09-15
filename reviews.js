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

  const reviewForm =
    document.getElementById(
      'review-form'
    );

  const reviewMessage =
    document.getElementById(
      'review-message'
    );

  const reviewsList =
    document.getElementById(
      'reviews-list'
    );

  const reviewAverage =
    document.getElementById(
      'review-average'
    );

  const reviewCount =
    document.getElementById(
      'review-count'
    );

  const reviewSummaryStars =
    document.getElementById(
      'review-summary-stars'
    );


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


  function renderStars(rating) {
    const rounded =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(
            Number(rating) || 0
          )
        )
      );


    return (
      '★'.repeat(rounded) +
      '☆'.repeat(5 - rounded)
    );
  }


  function formatReviewDate(value) {
    if (!value) {
      return '';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }


    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(date);
  }


  function showReviewError(message) {
    if (!reviewMessage) {
      return;
    }


    reviewMessage.textContent =
      message;


    reviewMessage.className =
      'review-message show error';
  }


  function showReviewSuccess(message) {
    if (!reviewMessage) {
      return;
    }


    reviewMessage.textContent =
      message;


    reviewMessage.className =
      'review-message show success';
  }


  /* =========================================================
     REVIEW SUMMARY
     ========================================================= */

  function updateReviewSummary(reviews) {
    if (
      !reviewAverage ||
      !reviewSummaryStars ||
      !reviewCount
    ) {
      return;
    }


    if (!reviews.length) {
      reviewAverage.textContent =
        '—';

      reviewSummaryStars.textContent =
        '☆☆☆☆☆';

      reviewCount.textContent =
        'No approved reviews yet';

      return;
    }


    const total =
      reviews.reduce(
        (sum, review) =>
          sum +
          Number(
            review.rating || 0
          ),
        0
      );


    const average =
      total /
      reviews.length;


    reviewAverage.textContent =
      average.toFixed(1);


    reviewSummaryStars.textContent =
      renderStars(
        average
      );


    reviewCount.textContent =
      `${reviews.length} ${
        reviews.length === 1
          ? 'review'
          : 'reviews'
      }`;
  }


  /* =========================================================
     RENDER REVIEWS
     ========================================================= */

  function renderReviews(reviews) {
    if (!reviewsList) {
      return;
    }


    updateReviewSummary(
      reviews
    );


    if (!reviews.length) {
      reviewsList.innerHTML = `
        <div class="reviews-empty">

          <div
            class="reviews-empty-stars"
            aria-hidden="true"
          >
            ☆☆☆☆☆
          </div>

          <h3>
            No reviews published yet.
          </h3>

          <p>
            Be the first to share your experience with
            Helen Estates Realtors.
          </p>

        </div>
      `;

      return;
    }


    reviewsList.innerHTML =
      reviews
        .map(review => {
          const rating =
            Number(
              review.rating || 0
            );


          const date =
            formatReviewDate(
              review.created_at
            );


          return `
            <article class="review-card">

              <div class="review-card-top">

                <div>

                  <div
                    class="review-card-stars"
                    aria-label="${rating} out of 5 stars"
                  >
                    ${renderStars(rating)}
                  </div>

                  <h3>
                    ${escapeHTML(
                      review.name
                    )}
                  </h3>

                </div>

                ${
                  date
                    ? `
                      <time
                        datetime="${escapeHTML(
                          review.created_at
                        )}"
                      >
                        ${escapeHTML(date)}
                      </time>
                    `
                    : ''
                }

              </div>

              ${
                review.review_text
                  ? `
                    <p class="review-card-text">
                      ${escapeHTML(
                        review.review_text
                      )}
                    </p>
                  `
                  : `
                    <p
                      class="review-card-text
                      review-card-text-short"
                    >
                      Rated Helen Estates Realtors
                      ${rating} out of 5 stars.
                    </p>
                  `
              }

              <p class="review-verified-label">
                Published customer review
              </p>

            </article>
          `;
        })
        .join('');
  }


  /* =========================================================
     LOAD APPROVED REVIEWS
     ========================================================= */

  async function loadReviews() {
    if (!reviewsList) {
      return;
    }


    if (
      !supabaseUrl ||
      !supabasePublicKey
    ) {
      reviewsList.innerHTML = `
        <div class="reviews-empty">

          <h3>
            Reviews are temporarily unavailable.
          </h3>

          <p>
            Please try again later.
          </p>

        </div>
      `;

      return;
    }


    try {
      const endpoint =
        new URL(
          `${supabaseUrl}/rest/v1/reviews`
        );


      endpoint.searchParams.set(
        'select',
        'id,name,rating,review_text,created_at'
      );


      endpoint.searchParams.set(
        'status',
        'eq.approved'
      );


      endpoint.searchParams.set(
        'order',
        'created_at.desc'
      );


      const response =
        await fetch(
          endpoint.toString(),
          {
            method: 'GET',

            headers: {
              apikey:
                supabasePublicKey,

              Accept:
                'application/json'
            }
          }
        );


      if (!response.ok) {
        const errorText =
          await response.text();


        console.error(
          'Reviews load failed:',
          response.status,
          errorText
        );


        throw new Error(
          `Reviews request failed: ${response.status}`
        );
      }


      const data =
        await response.json();


      renderReviews(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (error) {
      console.error(
        'Reviews loading error:',
        error
      );


      reviewsList.innerHTML = `
        <div class="reviews-empty">

          <h3>
            We could not load the reviews.
          </h3>

          <p>
            Please check your connection and try again.
          </p>

        </div>
      `;


      if (reviewAverage) {
        reviewAverage.textContent =
          '—';
      }


      if (reviewSummaryStars) {
        reviewSummaryStars.textContent =
          '☆☆☆☆☆';
      }


      if (reviewCount) {
        reviewCount.textContent =
          'Reviews unavailable';
      }
    }
  }


  /* =========================================================
     SUBMIT REVIEW
     ========================================================= */

  reviewForm?.addEventListener(
    'submit',
    async event => {
      event.preventDefault();


      if (reviewMessage) {
        reviewMessage.textContent =
          '';

        reviewMessage.className =
          'review-message';
      }


      const submitButton =
        reviewForm.querySelector(
          '.review-submit'
        );


      const formData =
        new FormData(
          reviewForm
        );


      const name =
        String(
          formData.get('name') || ''
        ).trim();


      const rating =
        Number(
          formData.get('rating')
        );


      const reviewText =
        String(
          formData.get(
            'reviewText'
          ) || ''
        ).trim();


      const website =
        String(
          formData.get(
            'website'
          ) || ''
        ).trim();


      /* -----------------------------------------------------
         VALIDATION
         ----------------------------------------------------- */

      if (
        name.length < 2 ||
        name.length > 80
      ) {
        showReviewError(
          'Please enter a valid name.'
        );

        return;
      }


      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        showReviewError(
          'Please choose a rating from 1 to 5 stars.'
        );

        return;
      }


      if (
        reviewText.length > 1500
      ) {
        showReviewError(
          'Please keep your review under 1,500 characters.'
        );

        return;
      }


      if (
        !supabaseUrl ||
        !supabasePublicKey
      ) {
        showReviewError(
          'The review service is temporarily unavailable.'
        );

        return;
      }


      /* -----------------------------------------------------
         SUBMIT
         ----------------------------------------------------- */

      try {
        if (submitButton) {
          submitButton.disabled =
            true;

          submitButton.textContent =
            'Submitting review…';
        }


        const response =
          await fetch(
            `${supabaseUrl}/functions/v1/create-review`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                apikey:
                  supabasePublicKey
              },

              body:
                JSON.stringify({
                  name,
                  rating,
                  reviewText,
                  website
                })
            }
          );


        let result = {};


        try {
          result =
            await response.json();
        } catch (_error) {
          result = {};
        }


        if (!response.ok) {
          console.error(
            'Create review failed:',
            response.status,
            result
          );


          throw new Error(
            result.error ||
            `Review submission failed with error ${response.status}.`
          );
        }


        reviewForm.reset();


        showReviewSuccess(
          'Thank you. Your review has been submitted and will appear after it has been approved.'
        );


      } catch (error) {
        console.error(
          'Review submission error:',
          error
        );


        showReviewError(
          error.message ||
          'We could not submit your review. Please try again.'
        );


      } finally {
        if (submitButton) {
          submitButton.disabled =
            false;


          submitButton.innerHTML =
            'Submit review <span aria-hidden="true">→</span>';
        }
      }
    }
  );


  /* =========================================================
     INITIALISE
     ========================================================= */

  loadReviews();

})();
