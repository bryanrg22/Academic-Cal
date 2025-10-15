// API service for communicating with the Python backend

const API_BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:5001/api"

/**
 * Check backend health and Firebase connection
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Health check failed:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Add a new blink to the counter
 */
export async function addBlink() {
  try {
    const response = await fetch(`${API_BASE_URL}/blink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Add blink failed:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get the current total blink count
 */
export async function getCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/count`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Get count failed:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Reset the blink counter to 0
 */
export async function resetCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Reset count failed:", error)
    return { success: false, error: error.message }
  }
}
