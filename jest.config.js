import { release } from 'os'
import commonConfig from './.config/jest.js'

export default {
  ...commonConfig(`node-${process.version}-${process.platform}-${release()}`),
  testEnvironment: 'node',
}
