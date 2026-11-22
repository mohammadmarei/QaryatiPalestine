/*
 * Saves the public API answers the site reads (governorates, villages with their full profiles, sources)
 * to src/api/static-snapshot.json, for the static preview build (VITE_STATIC_PREVIEW=true).
 * Run with the backend up:  npm run snapshot   (API_URL defaults to http://localhost:3000/api/v1)
 */
import { writeFileSync } from 'node:fs'

const base = (process.env.API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')
const get = async (path) => {
  const res = await fetch(`${base}${path}`, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' } })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}

const snapshot = {}
snapshot['/governorates'] = await get('/governorates')
const villages = await get('/villages?page=1&limit=100')
if (villages.pagination.totalPages > 1) throw new Error('more than 100 villages: page through them')
snapshot['/villages'] = villages
for (const v of villages.data) snapshot[`/villages/${v.id}/profile`] = await get(`/villages/${v.id}/profile`)
const sources = await get('/sources?page=1&limit=100')
if ((sources.meta?.totalPages ?? 1) > 1) throw new Error('more than 100 sources: page through them')
snapshot['/sources'] = sources
snapshot['/agricultural-products'] = await get('/agricultural-products?page=1&limit=100')

const out = new URL('../src/api/static-snapshot.json', import.meta.url)
writeFileSync(out, JSON.stringify(snapshot))
console.log(`Saved ${Object.keys(snapshot).length} answers (${villages.data.length} villages) to src/api/static-snapshot.json`)
