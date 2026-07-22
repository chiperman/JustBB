import { describe, expect, it } from "vitest"
import { isSafePosterImageUrl } from "./share-poster-image"

describe("isSafePosterImageUrl", () => {
  it("拒绝非 http(s) 地址", async () => {
    await expect(isSafePosterImageUrl("file:///etc/passwd")).resolves.toBe(false)
  })

  it("拒绝解析到本机或私有网络的地址", async () => {
    await expect(
      isSafePosterImageUrl("https://image.example.com/photo.png", async () => [
        { address: "127.0.0.1", family: 4 },
      ])
    ).resolves.toBe(false)
  })

  it("拒绝 IPv4-mapped IPv6 私网地址", async () => {
    await expect(
      isSafePosterImageUrl("https://image.example.com/photo.png", async () => [
        { address: "::ffff:192.168.1.1", family: 6 },
      ])
    ).resolves.toBe(false)
  })

  it("允许解析到公网地址的图片", async () => {
    await expect(
      isSafePosterImageUrl("https://image.example.com/photo.png", async () => [
        { address: "8.8.8.8", family: 4 },
      ])
    ).resolves.toBe(true)
  })
})
