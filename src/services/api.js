const API_URL = "https://simulados-oab-back.onrender.com"

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error("Erro na requisição")
  }

  return response.json()
}
