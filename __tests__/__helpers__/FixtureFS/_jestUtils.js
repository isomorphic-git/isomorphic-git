import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import findUp from 'find-up'
import onExit from 'signal-exit'

const TEMP_PATH = path.join(os.tmpdir(), 'jest-fixture-')
const TEMP_DIRS_CREATED = []

function toFixturesDir(fileParts) {
  return path.join('__fixtures__', ...fileParts)
}

/**
 * @param {string} cwd
 * @param  {...string} fileParts
 */
export function getFixturePath(cwd, ...fileParts) {
  return findUp(toFixturesDir(fileParts), { cwd })
}

/**
 * @param {string} cwd
 * @param  {...string} fileParts
 */
export function getFixturePathSync(cwd, ...fileParts) {
  return findUp.sync(toFixturesDir(fileParts), { cwd })
}

export async function createTempDir() {
  const tempDir = await fs.promises.mkdtemp(TEMP_PATH)
  TEMP_DIRS_CREATED.push(tempDir)
  return tempDir
}

export function createTempDirSync() {
  const tempDir = fs.mkdtempSync(TEMP_PATH)
  TEMP_DIRS_CREATED.push(tempDir)
  return tempDir
}

/**
 * @param {string} sourceDir
 */
export async function copyDirIntoTempDir(sourceDir) {
  const tempDir = await createTempDir()
  await fs.promises.cp(sourceDir, tempDir, { recursive: true })
  return tempDir
}

/**
 * @param {string} cwd
 * @param  {...string} fileParts
 */
export async function copyFixtureIntoTempDir(cwd, ...fileParts) {
  const fixturePath = await getFixturePath(cwd, ...fileParts)
  return await copyDirIntoTempDir(fixturePath)
}

export function cleanupTempDirs() {
  TEMP_DIRS_CREATED.forEach(tempDir => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {}
  })
  TEMP_DIRS_CREATED.length = 0
}

onExit(cleanupTempDirs)
