export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const date = query.date as string || new Date().toISOString().slice(0, 7)

  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'ms_access_token' } })
  const refreshSetting = await prisma.setting.findUnique({ where: { key: 'ms_refresh_token' } })
  const expirySetting = await prisma.setting.findUnique({ where: { key: 'ms_token_expiry' } })
  const clientIdSetting = await prisma.setting.findUnique({ where: { key: 'ms_client_id' } })
  const clientSecretSetting = await prisma.setting.findUnique({ where: { key: 'ms_client_secret' } })

  let msAccessToken = tokenSetting?.value
  const msRefreshToken = refreshSetting?.value
  const msTokenExpiry = parseInt(expirySetting?.value || '0')
  const clientId = clientIdSetting?.value
  const clientSecret = clientSecretSetting?.value

  if (!msAccessToken) {
    return { error: 'Microsoft not authenticated', events: [] }
  }

  // Check if token expired (or about to expire in 5 mins)
  if (msRefreshToken && clientId && clientSecret && Date.now() > msTokenExpiry - 300000) {
    try {
      const tokenUrl: any = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      const tokenResponse: any = await (globalThis as any).$fetch(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientId as string,
          client_secret: clientSecret as string,
          refresh_token: msRefreshToken as string,
          grant_type: 'refresh_token',
          scope: 'offline_access Calendars.ReadBasic'
        })
      })

      msAccessToken = tokenResponse.access_token

      // Update DB
      await Promise.all([
        prisma.setting.update({ where: { key: 'ms_access_token' }, data: { value: msAccessToken as string } }),
        prisma.setting.update({ where: { key: 'ms_refresh_token' }, data: { value: tokenResponse.refresh_token } }),
        prisma.setting.update({ where: { key: 'ms_token_expiry' }, data: { value: String(Date.now() + tokenResponse.expires_in * 1000) } })
      ])
    } catch (e) {
      return { error: 'Failed to refresh Microsoft token', events: [] }
    }
  }

  try {
    // Calculate month range from date (YYYY-MM) using date-fns
    const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
    const baseDate = parse(date, 'yyyy-MM', new Date())
    const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
    const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

    const startDateTime = `${firstDay}T00:00:00+07:00`
    const endDateTime = `${lastDay}T23:59:59+07:00`

    const calendarUrl: any = `https://graph.microsoft.com/v1.0/me/calendarview`
    const response: any = await (globalThis as any).$fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${msAccessToken}` },
      query: {
        startDateTime,
        endDateTime,
        $select: 'subject,start,end,location'
      }
    })

    return { success: true, events: response.value, date }
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
