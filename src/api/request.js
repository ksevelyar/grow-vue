const backendBaseUrl = import.meta.env.VITE_BACK || 'http://grow.localhost:3000'

export async function requestJson(path, options = {}) {
  const requestHeaders = new Headers(options.headers)
  const requestBodyIsFormData = options.body instanceof FormData

  if (options.body !== undefined && !requestBodyIsFormData) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: requestHeaders,
  })

  if (!response.ok) {
    let responseBody = {}
    try {
      responseBody = await response.json()
    } catch {
      responseBody = {}
    }

    const requestError = new Error(
      responseBody.error || `Request failed with status ${response.status}`,
    )
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
