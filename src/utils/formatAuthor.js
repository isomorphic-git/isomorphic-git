export function formatAuthor({ name, email, timestamp, timezoneOffset }) {
  timezoneOffset = formatTimezoneOffset(timezoneOffset)
  return `${name} <${email}> ${timestamp} ${timezoneOffset}`
}

// The amount of effort that went into crafting these cases to handle
// -0 (just so we don't lose that information when parsing and reconstructing)
// but can also default to +0 was extraordinary.

function formatTimezoneOffset(minutes) {
  const sign = simpleSign(negateExceptForZero(minutes))
  minutes = Math.abs(minutes)
  const hours = Math.floor(minutes / 60)
  minutes -= hours * 60
  let strHours = String(hours)
  let strMinutes = String(minutes)
  if (strHours.length < 2) strHours = '0' + strHours
  if (strMinutes.length < 2) strMinutes = '0' + strMinutes
  return (sign === -1 ? '-' : '+') + strHours + strMinutes
}

function simpleSign(n) {
  return Math.sign(n) || (Object.is(n, -0) ? -1 : 1)
}

function negateExceptForZero(n) {
  return n === 0 ? n : -n
}
