export const worthWalking = (filepath, root) => {
  if (root == null || root.length === 0 || filepath === '.') return true
  if (root.length >= filepath.length) {
    return root.startsWith(filepath)
  } else {
    return filepath.startsWith(root)
  }
}
