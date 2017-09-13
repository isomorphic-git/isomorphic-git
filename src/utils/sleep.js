export default async function (ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}
