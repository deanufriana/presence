/**
 * Calculates Mandays (MD) distribution across monthly report rows,
 * proportionally weighted by the number of source activity dates per task,
 * and calibrated to ensure the sum strictly matches the target total working days.
 */
export function calculateMandaysAllocation(
  monthlyRows: { sources?: string[] }[],
  totalMandays: number,
): number[] {
  const rowCount = monthlyRows.length
  if (rowCount === 0) return []

  const taskWeights = monthlyRows.map((row) => {
    if (row.sources && row.sources.length > 0) {
      return row.sources.length
    }
    return 1
  })
  const totalWeight = taskWeights.reduce((acc, w) => acc + w, 0)

  let allocatedMDs: number[] = []
  if (totalWeight > 0) {
    let currentSum = 0
    allocatedMDs = taskWeights.map((w) => {
      const md = Math.round((w / totalWeight) * totalMandays)
      currentSum += md
      return md
    })

    let diff = totalMandays - currentSum
    let i = 0
    while (diff !== 0 && rowCount > 0) {
      const idx = i % rowCount
      const val = allocatedMDs[idx] ?? 0
      if (diff > 0) {
        allocatedMDs[idx] = val + 1
        diff--
      } else if (val > 1) {
        allocatedMDs[idx] = val - 1
        diff++
      }
      i++
    }
  } else {
    const baseMD = Math.floor(totalMandays / rowCount)
    const rem = totalMandays % rowCount
    allocatedMDs = monthlyRows.map((_, idx) => (idx < rem ? baseMD + 1 : baseMD))
  }

  return allocatedMDs
}
