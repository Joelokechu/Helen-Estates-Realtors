(() => {
  'use strict'


  const config =
    window.HELEN_ESTATES_CONFIG || {}


  const supabaseUrl =
    String(config.supabaseUrl || '')
      .replace(/\/$/, '')


  const supabasePublicKey =
    String(config.supabasePublicKey || '')


  const loading =
    document.getElementById(
      'status-loading'
    )

  const errorBox =
    document.getElementById(
      'status-error'
    )

  const errorTitle =
    document.getElementById(
      'status-error-title'
    )

  const errorMessage =
    document.getElementById(
      'status-error-message'
    )

  const result =
    document.getElementById(
      'status-result'
    )

  const referenceElement =
    document.getElementById(
      'request-reference'
    )

  const statusElement =
    document.getElementById(
      'request-status'
    )

  const statusMessageElement =
    document.getElementById(
      'request-status-message'
    )

  const requestTypeElement =
    document.getElementById(
      'request-type'
    )

  const locationElement =
    document.getElementById(
      'request-location'
    )

  const createdElement =
    document.getElementById(
      'request-created'
    )

  const updatedElement =
    document.getElementById(
      'request-updated'
    )


  function showError(
    title,
    message
  ) {
    loading?.classList.add(
      'hidden'
    )

    result?.classList.add(
      'hidden'
    )

    if (errorTitle) {
      errorTitle.textContent =
        title
    }

    if (errorMessage) {
      errorMessage.textContent =
        message
    }

    errorBox?.classList.remove(
      'hidden'
    )
  }


  function showResult() {
    loading?.classList.add(
      'hidden'
    )

    errorBox?.classList.add(
      'hidden'
    )

    result?.classList.remove(
      'hidden'
    )
  }


  function parseStatusLink() {
    const rawHash =
      window.location.hash
        .replace(/^#/, '')

    const params =
      new URLSearchParams(
        rawHash
      )

    return {
      reference:
        String(
          params.get('ref') || ''
        ).trim(),

      token:
        String(
          params.get('token') || ''
        ).trim()
    }
  }


  function requestTypeLabel(
    value
  ) {
    switch (
      String(value || '')
        .toLowerCase()
    ) {
      case 'buy':
        return 'Buy'

      case 'rent':
        return 'Rent'

      case 'sell':
        return 'Sell / Advertise'

      default:
        return 'Property Request'
    }
  }


  function statusLabel(
    value
  ) {
    switch (
      String(value || '')
        .toLowerCase()
    ) {
      case 'new':
        return 'New'

      case 'contacted':
        return 'Contacted'

      case 'in_progress':
        return 'In Progress'

      case 'completed':
        return 'Completed'

      case 'closed':
        return 'Closed'

      default:
        return 'New'
    }
  }


  function statusMessage(
    value
  ) {
    switch (
      String(value || '')
        .toLowerCase()
    ) {
      case 'new':
        return (
          'Your request has been received by ' +
          'Helen Estates Realtors and is awaiting review.'
        )

      case 'contacted':
        return (
          'A member of Helen Estates Realtors has ' +
          'made or attempted contact regarding your request.'
        )

      case 'in_progress':
        return (
          'Your request is currently being handled by ' +
          'Helen Estates Realtors.'
        )

      case 'completed':
        return (
          'Your request has been marked as completed. ' +
          'Thank you for working with Helen Estates Realtors.'
        )

      case 'closed':
        return (
          'This request has been closed. If you require ' +
          'further assistance, please contact Helen Estates Realtors.'
        )

      default:
        return (
          'Your request has been received by ' +
          'Helen Estates Realtors.'
        )
    }
  }


  function formatDate(
    value
  ) {
    if (!value) {
      return '—'
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '—'
    }

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',

        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date)
  }


  function applyStatusClass(
    status
  ) {
    if (!statusElement) {
      return
    }

    statusElement.classList.remove(
      'status-new',
      'status-contacted',
      'status-in_progress',
      'status-completed',
      'status-closed'
    )


    const allowedStatuses =
      new Set([
        'new',
        'contacted',
        'in_progress',
        'completed',
        'closed'
      ])


    const safeStatus =
      allowedStatuses.has(status)
        ? status
        : 'new'


    statusElement.classList.add(
      `status-${safeStatus}`
    )
  }


  function renderRequest(
    request
  ) {
    const status =
      String(
        request.status || 'new'
      ).toLowerCase()


    if (referenceElement) {
      referenceElement.textContent =
        request.reference || '—'
    }


    if (statusElement) {
      statusElement.textContent =
        statusLabel(status)
    }


    applyStatusClass(
      status
    )


    if (statusMessageElement) {
      statusMessageElement.textContent =
        statusMessage(status)
    }


    if (requestTypeElement) {
      requestTypeElement.textContent =
        requestTypeLabel(
          request.requestType
        )
    }


    if (locationElement) {
      locationElement.textContent =
        request.location || 'Not specified'
    }


    if (createdElement) {
      createdElement.textContent =
        formatDate(
          request.createdAt
        )
    }


    if (updatedElement) {
      updatedElement.textContent =
        formatDate(
          request.updatedAt
        )
    }


    showResult()
  }


  async function loadStatus() {
    const {
      reference,
      token
    } =
      parseStatusLink()


    if (
      !reference ||
      !token
    ) {
      showError(
        'Status link incomplete',
        'Please open the complete request status link supplied by Helen Estates Realtors.'
      )

      return
    }


    if (
      !supabaseUrl ||
      !supabasePublicKey
    ) {
      showError(
        'Service unavailable',
        'The request status service is temporarily unavailable. Please try again later.'
      )

      return
    }


    try {
      const response =
        await fetch(
          `${supabaseUrl}/functions/v1/get-ticket-status`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'apikey':
                supabasePublicKey
            },

            body:
              JSON.stringify({
                reference,
                token
              })
          }
        )


      let data = null


      try {
        data =
          await response.json()
      } catch {
        data = null
      }


      if (!response.ok) {
        if (
          response.status === 404
        ) {
          showError(
            'Request not found',
            'We could not find a request matching this private status link.'
          )

          return
        }


        if (
          response.status === 401 ||
          response.status === 403
        ) {
          showError(
            'Status link not valid',
            'This request status link could not be verified. Please use the original link supplied by Helen Estates Realtors.'
          )

          return
        }


        if (
          response.status === 429
        ) {
          showError(
            'Please try again shortly',
            'Too many status checks were made in a short period. Please wait a moment and try again.'
          )

          return
        }


        showError(
          'Unable to load request',
          data?.error ||
          'We could not retrieve your request status. Please try again shortly.'
        )

        return
      }


      if (
        !data ||
        !data.request
      ) {
        showError(
          'Unable to load request',
          'The request status service returned an unexpected response.'
        )

        return
      }


      renderRequest(
        data.request
      )

    } catch (error) {
      console.error(
        'Request status error:',
        error
      )


      showError(
        'Connection problem',
        'We could not connect to the request status service. Please check your connection and try again.'
      )
    }
  }


  loadStatus()
})()
