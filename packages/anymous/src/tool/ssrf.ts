/**
 * SSRF protection for outbound fetches.
 *
 * Ported from Gitlawb/zero (MIT license) `internal/tools/web_fetch.go`.
 * Blocks loopback, private-use, link-local, multicast, documentation and
 * other special-use addresses (IPv4, IPv6 and IPv4-embedded-IPv6) by
 * resolving the hostname and checking every returned address, so DNS tricks
 * (round-robin, decimal/octal/hex IP spellings) do not bypass the check.
 *
 * Blocked fetches fail closed with guidance to use bash + curl instead,
 * where the normal sandbox and permission policy applies.
 */

const BLOCKED_V4: Array<[bigint, number]> = [
  // [network bits, prefix length]
  [0x00000000n, 8], // 0.0.0.0/8 special-use
  [0x0a000000n, 8], // 10.0.0.0/8 private
  [0x64400000n, 10], // 100.64.0.0/10 special-use
  [0x7f000000n, 8], // 127.0.0.0/8 loopback
  [0xa9fe0000n, 16], // 169.254.0.0/16 link-local
  [0xac100000n, 12], // 172.16.0.0/12 private
  [0xc0000000n, 24], // 192.0.0.0/24 special-use
  [0xc0000200n, 24], // 192.0.2.0/24 documentation
  [0xc0586300n, 24], // 192.88.99.0/24 special-use
  [0xc0a80000n, 16], // 192.168.0.0/16 private
  [0xc6120000n, 15], // 198.18.0.0/15 benchmark
  [0xc6336400n, 24], // 198.51.100.0/24 documentation
  [0xcb007100n, 24], // 203.0.113.0/24 documentation
  [0xe0000000n, 4], // 224.0.0.0/4 multicast
  [0xf0000000n, 4], // 240.0.0.0/4 special-use
]

const BLOCKED_V6: Array<[bigint, number]> = [
  [0n, 128], // ::/128 unspecified
  [1n, 128], // ::1/128 loopback
  [0x1000000000000000000000000n, 64], // 100::/64 special-use
  [0x200100000000000000000000n, 23], // 2001::/23 special-use
  [0x200100020000000000000000n, 48], // 2001:2::/48 benchmark
  [0x20010db80000000000000000n, 32], // 2001:db8::/32 documentation
  [0xfc0000000000000000000000n, 7], // fc00::/7 private
  [0xfe8000000000000000000000n, 10], // fe80::/10 link-local
  [0xff0000000000000000000000n, 8], // ff00::/8 multicast
]

export const PUBLIC_ONLY_HINT =
  "webfetch only supports public remote HTTP/HTTPS URLs. For localhost or private network URLs, use bash with curl so sandbox network permission can apply"

function parseIPv4(text: string): bigint | undefined {
  // Dotted quad, plus single-number / octal / hex spellings attackers use
  // to dodge string matching ("2130706433", "0x7f.0.0.1", "0177.0.0.1").
  const parts = text.split(".")
  const nums: number[] = []
  for (const part of parts) {
    if (part === "") return undefined
    let n: number
    if (/^0x[0-9a-fA-F]+$/.test(part)) n = parseInt(part, 16)
    else if (/^0[0-7]+$/.test(part) && part.length > 1) n = parseInt(part, 8)
    else if (/^[0-9]+$/.test(part)) n = parseInt(part, 10)
    else return undefined
    if (!Number.isSafeInteger(n) || n < 0) return undefined
    nums.push(n)
  }
  if (nums.length === 1) {
    const n = nums[0]
    if (n > 0xffffffff) return undefined
    return BigInt(n)
  }
  if (nums.length !== 4 || nums.some((n) => n > 255)) return undefined
  return (BigInt(nums[0]) << 24n) | (BigInt(nums[1]) << 16n) | (BigInt(nums[2]) << 8n) | BigInt(nums[3])
}

function parseIPv6(text: string): bigint | undefined {
  // Strip zone id (fe80::1%eth0).
  const zone = text.indexOf("%")
  if (zone >= 0) text = text.slice(0, zone)
  // Embedded IPv4 tail (x:x:x:x:x:x:d.d.d.d).
  let tail = 0n
  let tailGroups = 0
  const lastColon = text.lastIndexOf(":")
  const tailText = lastColon >= 0 ? text.slice(lastColon + 1) : text
  if (tailText.includes(".")) {
    const v4 = parseIPv4(tailText)
    if (v4 === undefined) return undefined
    tail = v4
    tailGroups = 2
    text = lastColon >= 0 ? text.slice(0, lastColon) : ""
  }
  const halves = text.split("::")
  if (halves.length > 2) return undefined
  const head = halves[0] === "" ? [] : halves[0].split(":")
  const tailParts = halves.length === 2 ? (halves[1] === "" ? [] : halves[1].split(":")) : []
  for (const g of [...head, ...tailParts]) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return undefined
  }
  const missing = 8 - tailGroups - head.length - tailParts.length
  if (halves.length === 1 ? missing !== 0 : missing < 0) return undefined
  const groups = [...head.map((g) => parseInt(g, 16)), ...new Array(Math.max(0, missing)).fill(0), ...tailParts.map((g) => parseInt(g, 16))]
  let out = 0n
  for (const g of groups) out = (out << 16n) | BigInt(g)
  return (out << BigInt(tailGroups * 16)) | tail
}

function inPrefix(addr: bigint, width: number, net: bigint, length: number): boolean {
  const shift = BigInt(width - length)
  return (addr >> shift) === (net >> shift)
}

function isBlockedIP(ip: string): boolean {
  const v4 = parseIPv4(ip)
  if (v4 !== undefined) return BLOCKED_V4.some(([net, len]) => inPrefix(v4, 32, net, len))
  const v6 = parseIPv6(ip)
  if (v6 === undefined) return false
  if (BLOCKED_V6.some(([net, len]) => inPrefix(v6, 128, net, len))) return true
  // IPv4-embedded forms: check the embedded address against the v4 list.
  const candidates: bigint[] = []
  if ((v6 >> 32n) === 0n) candidates.push(v6 & 0xffffffffn) // ::/96 compat
  if ((v6 >> 32n) === 0xffffn) candidates.push(v6 & 0xffffffffn) // ::ffff:0:0/96 mapped
  if ((v6 >> 32n) === 0x64ff9b0000000000000000n) candidates.push(v6 & 0xffffffffn) // 64:ff9b::/96 NAT64
  if ((v6 >> 80n) === 0x64ff9b01n) candidates.push((v6 >> 48n) & 0xffffffffn) // 64:ff9b:1::/48
  if ((v6 >> 112n) === 0x2002n) candidates.push((v6 >> 80n) & 0xffffffffn) // 2002::/16 6to4
  return candidates.some((c) => BLOCKED_V4.some(([net, len]) => inPrefix(c, 32, net, len)))
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "")
  if (host === "localhost" || host.endsWith(".localhost")) return true
  // Single-label names (intranet hosts, `router`, `nas`, ...) fail closed:
  // they can only resolve on local search domains.
  if (!host.includes(".") && !host.includes(":")) return true
  return isBlockedIP(host)
}

/**
 * Throws when `url` is not a public remote HTTP/HTTPS URL: non-web schemes,
 * special-use hostnames, or any DNS answer in a blocked range.
 *
 * `ANYMOUS_ALLOW_PRIVATE_FETCH=1` bypasses the host checks (scheme is still
 * enforced). It exists for tests and local development servers; production
 * use should go through bash + curl so sandbox policy applies.
 */
export async function assertPublicUrl(url: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`webfetch: invalid URL. ${PUBLIC_ONLY_HINT}`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`webfetch: URL must start with http:// or https://. ${PUBLIC_ONLY_HINT}`)
  }
  if (process.env["ANYMOUS_ALLOW_PRIVATE_FETCH"] === "1") return
  const hostname = parsed.hostname
  if (isBlockedHostname(hostname)) {
    throw new Error(`webfetch: blocked host (${hostname}). ${PUBLIC_ONLY_HINT}`)
  }
  // Resolve every address: a name that resolves to anything non-public fails.
  let records: Array<{ address: string }>
  try {
    const dns = await import("node:dns/promises")
    records = await dns.lookup(hostname, { all: true })
  } catch {
    throw new Error(`webfetch: could not resolve ${hostname}. ${PUBLIC_ONLY_HINT}`)
  }
  if (records.length === 0) throw new Error(`webfetch: could not resolve ${hostname}. ${PUBLIC_ONLY_HINT}`)
  for (const record of records) {
    if (isBlockedIP(record.address)) {
      throw new Error(`webfetch: blocked host (${hostname} resolves to ${record.address}). ${PUBLIC_ONLY_HINT}`)
    }
  }
}

export function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

export * as Ssrf from "./ssrf"
