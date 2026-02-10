import { teardownTestDatabase } from './helpers/fixtures'

export default function globalTeardown() {
  teardownTestDatabase()
}
