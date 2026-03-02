import { createHash } from 'crypto'

export function computeEtag(rawIcal: string): string {
  const hash = createHash('md5').update(rawIcal).digest('hex')
  return `"${hash}"`
}
