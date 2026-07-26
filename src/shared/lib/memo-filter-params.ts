export type MemoMultiValueFilter = "tag" | "num"
export type MemoFilterChip = {
  type: "tag" | "num" | "date" | "year-month"
  value: string
  label: string
}

export type MemoFilterOperation =
  | { type: "toggle-value"; key: MemoMultiValueFilter; value: string }
  | { type: "remove-chip"; chip: Pick<MemoFilterChip, "type" | "value"> }
  | { type: "clear-context" }
  | { type: "toggle-tag-mode" }
  | { type: "apply-search"; term: string }
  | { type: "set-sort"; value: string }

type SearchParamsLike = { toString(): string }

function normalizeValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function writeMultiValueFilter(
  params: URLSearchParams,
  key: MemoMultiValueFilter,
  values: string[]
) {
  const normalized = normalizeValues(values)
  if (normalized.length > 0) params.set(key, normalized.join(","))
  else params.delete(key)
}

export function readMemoFilterValues(
  params: SearchParamsLike,
  key: MemoMultiValueFilter
): string[] {
  return normalizeValues((new URLSearchParams(params.toString()).get(key) || "").split(","))
}

export function updateMemoFilterParams(current: SearchParamsLike, operation: MemoFilterOperation) {
  const params = new URLSearchParams(current.toString())

  switch (operation.type) {
    case "toggle-value": {
      const values = readMemoFilterValues(params, operation.key)
      writeMultiValueFilter(
        params,
        operation.key,
        values.includes(operation.value)
          ? values.filter((value) => value !== operation.value)
          : [...values, operation.value]
      )
      break
    }
    case "remove-chip": {
      if (operation.chip.type === "year-month") {
        params.delete("year")
        params.delete("month")
      } else if (operation.chip.type === "tag" || operation.chip.type === "num") {
        writeMultiValueFilter(
          params,
          operation.chip.type,
          readMemoFilterValues(params, operation.chip.type).filter(
            (value) => value !== operation.chip.value
          )
        )
      } else {
        params.delete(operation.chip.type)
      }
      break
    }
    case "clear-context":
      ;["tag", "num", "date", "year", "month", "tagMode"].forEach((key) => params.delete(key))
      break
    case "toggle-tag-mode":
      if (params.get("tagMode") === "or") params.delete("tagMode")
      else params.set("tagMode", "or")
      break
    case "apply-search": {
      const term = operation.term.trim()
      if (!term) {
        params.delete("query")
        break
      }

      const tags: string[] = []
      const numbers: string[] = []
      const words: string[] = []
      for (const token of term.split(/\s+/)) {
        const tagMatch = token.match(/^(?:tag|t):(.+)$/i)
        const numberMatch = token.match(/^(?:num|n|id):(\d+)$/i)
        if (tagMatch) tags.push(tagMatch[1])
        else if (numberMatch) numbers.push(numberMatch[1])
        else words.push(token)
      }

      if (tags.length > 0) {
        writeMultiValueFilter(params, "tag", [...readMemoFilterValues(params, "tag"), ...tags])
      }
      if (numbers.length > 0) {
        writeMultiValueFilter(params, "num", [...readMemoFilterValues(params, "num"), ...numbers])
      }

      const query = words.join(" ").trim()
      if (query) params.set("query", query)
      else params.delete("query")
      break
    }
    case "set-sort":
      params.set("sort", operation.value)
      break
  }

  return params
}

export function memoFilterHref(params: SearchParamsLike) {
  const query = params.toString()
  return query ? `/?${query}` : "/"
}
