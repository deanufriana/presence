export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No code provided'
    })
  }

  const clientIdSetting = await prisma.setting.findUnique({ where: { key: 'ms_client_id' } })
  const clientSecretSetting = await prisma.setting.findUnique({ where: { key: 'ms_client_secret' } })

  const clientId = clientIdSetting?.value
  const clientSecret = clientSecretSetting?.value

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Client credentials not configured'
    })
  }

  const redirectUri = 'http://localhost:3000/api/auth/callback/microsoft'

  try {
    const tokenResponse: any = await $fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'offline_access Calendars.ReadBasic'
      })
    })

    // Save tokens
    const updates = [
      prisma.setting.upsert({
        where: { key: 'ms_access_token' },
        update: { value: tokenResponse.access_token },
        create: { key: 'ms_access_token', value: tokenResponse.access_token }
      }),
      prisma.setting.upsert({
        where: { key: 'ms_refresh_token' },
        update: { value: tokenResponse.refresh_token },
        create: { key: 'ms_refresh_token', value: tokenResponse.refresh_token }
      }),
      prisma.setting.upsert({
        where: { key: 'ms_token_expiry' },
        update: { value: String(Date.now() + tokenResponse.expires_in * 1000) },
        create: { key: 'ms_token_expiry', value: String(Date.now() + tokenResponse.expires_in * 1000) }
      })
    ]

    await Promise.all(updates)

    return sendRedirect(event, '/')
  } catch (error: any) {
    console.error('OAuth Error:', error.data || error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange code for token'
    })
  }
})
