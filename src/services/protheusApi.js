import axios from 'axios'

let _credentials = { username: 'API', password: 's&tt@' }

export function setProtheusCredentials(username, password) {
  _credentials = { username, password }
}

const protheusApi = axios.create({
  baseURL: import.meta.env.VITE_PROTHEUS_URL || '',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

protheusApi.interceptors.request.use((config) => {
  if (!config.auth) {
    config.auth = _credentials
  }
  return config
})

protheusApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.message || error.message
    console.error('[Protheus]', error.config?.url, status, msg)
    return Promise.reject(error)
  }
)

export default protheusApi
