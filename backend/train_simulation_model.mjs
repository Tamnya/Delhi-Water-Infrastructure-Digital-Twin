import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const csv = readFileSync(resolve(root, 'data/water_anomaly_benchmark.csv'), 'utf8').trim().split(/\r?\n/)
const headers = csv[0].split(',')
const labelIndex = headers.indexOf('fault_d7')
const timeIndex = headers.indexOf('timestamp')
const featureIndexes = headers.map((_, i) => i).filter(i => i !== labelIndex && i !== timeIndex)
const rows = csv.slice(1).map(line => {
  const cells = line.split(',')
  return { label: Number(cells[labelIndex]), values: featureIndexes.map(i => cells[i] === '' ? null : Number(cells[i])) }
})

const boundary = Math.floor(rows.length * .7)
const embargo = 24 * 7
const train = rows.slice(0, boundary - embargo)
const holdout = rows.slice(boundary + embargo)
const quantile = (values, q) => values.slice().sort((a, b) => a - b)[Math.floor((values.length - 1) * q)]
const medians = featureIndexes.map((_, j) => quantile(train.map(row => row.values[j]).filter(Number.isFinite), .5))
const filled = row => row.values.map((value, j) => Number.isFinite(value) ? value : medians[j])
const means = featureIndexes.map((_, j) => train.reduce((sum, row) => sum + filled(row)[j], 0) / train.length)
const scales = featureIndexes.map((_, j) => Math.sqrt(train.reduce((sum, row) => sum + (filled(row)[j] - means[j]) ** 2, 0) / train.length) || 1)
const xOf = row => filled(row).map((v, j) => (v - means[j]) / scales[j])
const positive = train.filter(row => row.label === 1).length
const negative = train.length - positive
const classWeights = [train.length / (2 * negative), train.length / (2 * positive)]
const weights = Array(featureIndexes.length).fill(0)
let bias = 0
const sigmoid = value => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))))

// Deterministic, class-weighted logistic regression fitted on the chronological training period.
for (let epoch = 0; epoch < 700; epoch++) {
  const gradient = Array(weights.length).fill(0)
  let biasGradient = 0
  for (const row of train) {
    const x = xOf(row)
    const error = (sigmoid(bias + x.reduce((sum, v, j) => sum + v * weights[j], 0)) - row.label) * classWeights[row.label]
    biasGradient += error
    for (let j = 0; j < weights.length; j++) gradient[j] += error * x[j]
  }
  const rate = .035 / train.length
  bias -= rate * biasGradient
  for (let j = 0; j < weights.length; j++) weights[j] -= rate * (gradient[j] + .02 * weights[j] * train.length)
}

const score = row => sigmoid(bias + xOf(row).reduce((sum, v, j) => sum + v * weights[j], 0))
const predictions = holdout.map(row => ({ row, probability: score(row) }))
const threshold = .5
const confusion = { tp: 0, fp: 0, tn: 0, fn: 0 }
for (const item of predictions) {
  const predicted = item.probability >= threshold
  confusion[predicted ? (item.row.label ? 'tp' : 'fp') : (item.row.label ? 'fn' : 'tn')]++
}
const precision = confusion.tp / (confusion.tp + confusion.fp || 1)
const recall = confusion.tp / (confusion.tp + confusion.fn || 1)
const f1 = 2 * precision * recall / (precision + recall || 1)
const accuracy = (confusion.tp + confusion.tn) / predictions.length
const holdoutPositiveRate = holdout.filter(row => row.label === 1).length / holdout.length
const groups = {
  quiet_baseline: predictions.filter(x => x.row.label === 0).sort((a, b) => a.probability - b.probability),
  leak_signature: predictions.filter(x => x.row.label === 1).sort((a, b) => b.probability - a.probability),
  subtle_leak: predictions.filter(x => x.row.label === 1).sort((a, b) => a.probability - b.probability),
  noisy_normal: predictions.filter(x => x.row.label === 0).sort((a, b) => b.probability - a.probability),
}
const definitions = [
  ['quiet_baseline', 'Quiet baseline', 'A held-out hour outside the benchmark leak-proximity window with the lowest model score.'],
  ['leak_signature', 'Strong leak-proximity signature', 'A held-out labeled hour with the highest model score. The label means within ±7 days of a recorded leak.'],
  ['subtle_leak', 'Subtle leak-proximity case', 'A held-out labeled hour with a comparatively low score, illustrating a possible miss.'],
  ['noisy_normal', 'Noisy normal case', 'A held-out non-leak-proximity hour with a comparatively high score, illustrating a possible false alarm.'],
]
const scenarios = definitions.map(([id, title, description]) => {
  const item = groups[id][Math.floor((groups[id].length - 1) * (id === 'noisy_normal' ? .5 : 0))]
  return { id, title, description, timestamp: csv[Math.min(rows.indexOf(item.row) + 1, csv.length - 1)].split(',')[timeIndex], actual_label: item.row.label, probability: item.probability, features: Object.fromEntries(featureIndexes.map((i, j) => [headers[i], item.row.values[j]])) }
})

const artifact = {
  version: 1,
  dataset: { name: 'Hourly Anomaly Scores and Leak Labels from a Multi-Source Urban Water Distribution Network Dataset', doi: '10.5281/zenodo.15096167', url: 'https://zenodo.org/records/15096167', license: 'CC BY 4.0', attribution: 'Babela, J., Munk, M., & Munkova, D. Hourly Anomaly Scores and Leak Labels from a Multi-Source Urban Water Distribution Network Dataset. Zenodo, 2025. https://doi.org/10.5281/zenodo.15096167', records: rows.length, feature_columns: featureIndexes.map(i => headers[i]), label: 'fault_d7 (within ±7 days of recorded leak)', data_note: 'Inputs are precomputed anomaly scores, not raw pressure or flow measurements.' },
  training: { method: 'Class-weighted logistic regression', split: 'Chronological 70/30 holdout with a 14-day embargo around the split', train_rows: train.length, holdout_rows: holdout.length, threshold, accuracy, majority_baseline_accuracy: Math.max(holdoutPositiveRate, 1 - holdoutPositiveRate), holdout_positive_rate: holdoutPositiveRate, precision, recall, f1, confusion, positive_rate: positive / train.length },
  model: { medians, means, scales, weights, bias },
  scenarios,
}
const output = resolve(root, 'app/simulation_model.json')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, JSON.stringify(artifact, null, 2) + '\n')
console.log(JSON.stringify({ output, records: rows.length, training_rows: train.length, holdout_rows: holdout.length, threshold, accuracy, holdout_positive_rate: holdoutPositiveRate, majority_baseline_accuracy: Math.max(holdoutPositiveRate, 1 - holdoutPositiveRate), precision, recall, f1, confusion, scenarios: scenarios.map(({ id, timestamp, actual_label, probability }) => ({ id, timestamp, actual_label, probability })) }, null, 2))
