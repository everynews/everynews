import type { Alert } from '@everynews/schema'
import type { Curator, CuratorResult } from './type'
import { ProxyAgent } from 'undici'

interface DnsResponse {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: Array<{
    name: string
    type: number
  }>
  Answer?: Array<{
    name: string
    type: number
    TTL: number
    data: string
  }>
  Authority?: Array<{
    name: string
    type: number
    TTL: number
    data: string
  }>
}

export const WhoisCurator: Curator = async (
  alert: Alert,
): Promise<CuratorResult[]> => {
  if (alert.strategy.provider !== 'whois') {
    throw new Error(
      `WhoisCurator got Alert Strategy ${alert.strategy.provider}`,
    )
  }

  const domain = alert.strategy.domain
  if (!domain) {
    throw new Error('WhoisCurator requires a domain')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined

  try {
    const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`

    const response = await fetch(dnsUrl, {
      dispatcher,
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    } as RequestInit)

    if (!response.ok) {
      throw new Error(
        `DNS lookup error: ${response.status} ${response.statusText}`,
      )
    }

    const data: DnsResponse = await response.json()

    const hasNoARecords = !data.Answer || data.Answer.length === 0
    const isDomainNotFound = data.Status === 3

    if (isDomainNotFound || hasNoARecords) {
      return [{ url: `https://whois.com/whois/${domain}`, metadata: null }]
    }

    return []
  } finally {
    clearTimeout(timeout)
  }
}
