export default defineEventHandler(async (event) => {
  const clientIdSetting = await prisma.setting.findUnique({ where: { key: 'ms_client_id' } })
  const clientId = clientIdSetting?.value

  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Microsoft Client ID not configured'
    })
  }

  const redirectUri = 'http://localhost:3000/api/auth/callback/microsoft'
  const scope = 'offline_access Calendars.ReadBasic'
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scope)}`

  return sendRedirect(event, authUrl)
})
