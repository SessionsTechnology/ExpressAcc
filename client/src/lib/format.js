export function formatDuration(value) {
  const seconds = Math.max(0, Number(value) || 0)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = Math.floor(seconds % 60)
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
