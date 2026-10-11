// LinReg on time series data, weighted: latest points weigh most
export const helperLinReg = (
  data: Array<{ date: Date; items: number }>,
  weighted = false,
): { slope: number; intercept: number } => {
  const { seconds, items } = calculateXAndY(data)
  return calculateWeightedLinearRegression(seconds, items, weighted ? (i) => i + 1 : () => 1)
}

// this converts Date to Timestamp in sec and subtracts the first timestamp from all others
export const calculateXAndY = (
  data: Array<{ date: Date; items: number }>,
): { seconds: number[]; items: number[] } => {
  const first = data[0]?.date.getTime() ?? 0
  return {
    seconds: data.map((point) => (point.date.getTime() - first) / 1000),
    items: data.map((point) => point.items),
  }
}

// weight(i) defaults to i + 1 (latest weighs most); slope 0 for < 2 distinct X
export const calculateWeightedLinearRegression = (
  X: number[],
  Y: number[],
  weight = (i: number) => i + 1,
): { slope: number; intercept: number } => {
  let sumW = 0
  let sumX = 0
  let sumY = 0
  X.forEach((x, i) => {
    const w = weight(i)
    sumW += w
    sumX += w * x
    sumY += w * (Y[i] ?? 0)
  })
  const avgX = sumX / sumW
  const avgY = sumY / sumW

  let numerator = 0
  let denominator = 0
  X.forEach((x, i) => {
    const w = weight(i)
    numerator += w * (x - avgX) * ((Y[i] ?? 0) - avgY)
    denominator += w * (x - avgX) ** 2
  })
  // < 2 distinct X (incl. empty input)
  if (denominator === 0) return { slope: 0, intercept: 0 }

  const slope = numerator / denominator
  return { slope, intercept: avgY - slope * avgX }
}
