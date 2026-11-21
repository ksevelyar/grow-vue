const backendBaseUrl = import.meta.env.VITE_BACK || 'http://grow.localhost:3000'

export function requestJson(path, options = {}) {
  const requestHeaders = new Headers(options.headers)
  requestHeaders.set('Content-Type', 'application/json')
  return request(path, { ...options, headers: requestHeaders })
}

export function requestMultipart(path, options) {
  return request(path, options)
}

async function request(path, options) {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
  })

  if (!response.ok) {
    const responseBody = await response.json()
    const requestError = new Error(responseBody.error)
    requestError.status = response.status
    requestError.fields = responseBody.fields || []
    requestError.responseBody = responseBody
    throw requestError
  }

  if (response.status === 204) {
    return null
  }

  const responseContentType = response.headers.get('Content-Type') || ''
  if (responseContentType.includes('application/json')) {
    return response.json()
  }

  return response
}

export function getRequestFieldErrors(requestError) {
  return Object.fromEntries(
    (requestError.fields || []).map((fieldError) => [fieldError.field, fieldError.message]),
  )
}

export function getBackendUrl(path) {
  return `${backendBaseUrl}${path}`
}
