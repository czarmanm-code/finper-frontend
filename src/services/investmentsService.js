import { apiRequest } from './api.js'

/**
 * Fetch all investments for the authenticated user.
 */
export async function getInvestments() {
  return apiRequest('/investments')
}

/**
 * Fetch a single investment by ID with its monthly records and metrics.
 */
export async function getInvestmentById(id) {
  return apiRequest(`/investments/${id}`)
}

/**
 * Create a new investment account or instrument.
 */
export async function createInvestment(data) {
  return apiRequest('/investments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing investment metadata.
 */
export async function updateInvestment(id, data) {
  return apiRequest(`/investments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete an investment.
 */
export async function deleteInvestment(id) {
  return apiRequest(`/investments/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Add or update a monthly cutoff record for an investment.
 */
export async function addOrUpdateInvestmentRecord(investmentId, recordData) {
  return apiRequest(`/investments/${investmentId}/records`, {
    method: 'POST',
    body: JSON.stringify(recordData),
  })
}

/**
 * Delete a specific monthly cutoff record.
 */
export async function deleteInvestmentRecord(investmentId, recordId) {
  return apiRequest(`/investments/${investmentId}/records/${recordId}`, {
    method: 'DELETE',
  })
}

