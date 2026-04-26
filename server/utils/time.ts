export const getRandomTime = (startHour: number, endHour: number) => {
    const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour
    const minute = Math.floor(Math.random() * 60)
    const second = Math.floor(Math.random() * 60)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}