export const worthWalking = (filepath, root) => {
  if (root.length === 0) return true
  if (root.length >= filepath.length) {
    return root.startsWith(filepath)
  } else {
    return filepath.startsWith(root)
  }
}
