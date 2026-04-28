import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year || new Date().getFullYear()
  const month = query.month

  try {
    const url = new URL('https://tanggalmerah.upset.dev/api/holidays')
    url.searchParams.append('year', String(year))
    if (month) {
      url.searchParams.append('month', String(month))
    }

    const response: any = await $fetch(url.toString())
    
    if (response.success) {
      return response.data
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
    return []
  }
})
