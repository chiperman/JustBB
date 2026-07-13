const IMAGE_URL =
  /https?:\/\/[^\s<>"']+?\.(?:jpg|jpeg|png|gif|webp|avif|svg|bmp|ico|tiff?)(?:[?#][^\s<>"']*)?/gi

export function preparePublishContent(input: string) {
  const images: string[] = []
  const contentLines: string[] = []

  for (const line of input.split("\n")) {
    const contentLine = line
      .replace(IMAGE_URL, (url) => {
        images.push(url)
        return " "
      })
      .replace(/[ \t]{2,}/g, " ")
      .trimEnd()

    if (contentLine.trim()) contentLines.push(contentLine)
  }

  return {
    content: contentLines.join("\n").trim(),
    images: Array.from(new Set(images)),
  }
}
