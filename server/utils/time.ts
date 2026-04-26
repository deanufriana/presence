export const getRandomTime = (startTime: string, endTime: string) => {
    const [startH = 0, startM = 0] = startTime.split(':').map(Number)
    const [endH = 0, endM = 0] = endTime.split(':').map(Number)

    const startInMinutes = startH * 60 + startM
    const endInMinutes = endH * 60 + endM

    const randomMinutes = Math.floor(Math.random() * (endInMinutes - startInMinutes + 1)) + startInMinutes

    const hour = Math.floor(randomMinutes / 60)
    const minute = randomMinutes % 60
    const second = Math.floor(Math.random() * 60)

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}