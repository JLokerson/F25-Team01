import axios from 'axios'

const viteBase = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_URL) || undefined
const craBase = typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined
const base = viteBase || craBase || ''
export const api = axios.create({ baseURL: base })


