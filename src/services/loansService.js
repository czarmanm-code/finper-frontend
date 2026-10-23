import { apiRequest } from './api.js'

/**
 * Fetch all loans for the authenticated user.
 */
export async function getLoans() {
  return apiRequest('/loans')
}

/**
 * Fetch a single loan by ID with its payments timeline and history.
 */
export async function getLoanById(id) {
  return apiRequest(`/loans/${id}`)
}

/**
 * Create a new loan.
 */
export async function createLoan(data) {
  return apiRequest('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing loan.
 */
export async function updateLoan(id, data) {
  return apiRequest(`/loans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a loan.
 */
export async function deleteLoan(id) {
  return apiRequest(`/loans/${id}`, {
    method: 'DELETE',
  })
}

