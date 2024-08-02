import { GeneratedFile, ParsedImplementation } from "@/types/run"

export function parseImplementationResponse(response: string) {
  const files: GeneratedFile[] = []
  const pullRequestMatch = response.match(
    /<pull_request>([\s\S]*?)(<\/pull_request>|$)/
  )

  if (pullRequestMatch) {
    const pullRequestContent = pullRequestMatch[1]

    const prTitleMatch = pullRequestContent.match(
      /<pr_title>([\s\S]*?)<\/pr_title>/
    )
    const prTitle = prTitleMatch ? prTitleMatch[1].trim() : ""

    const prDescriptionMatch = pullRequestContent.match(
      /<pr_description>([\s\S]*?)<\/pr_description>/
    )
    const prDescription = prDescriptionMatch ? prDescriptionMatch[1].trim() : ""

    const fileListMatch = pullRequestContent.match(
      /<file_list>([\s\S]*?)<\/file_list>/
    )

    if (fileListMatch) {
      const fileMatches = fileListMatch[1].matchAll(
        /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_content>([\s\S]*?)<\/file_content>[\s\S]*?<file_status>(.*?)<\/file_status>[\s\S]*?<\/file>/g
      )

      for (const match of fileMatches) {
        const [_, path, content, status] = match
        files.push({
          path: path.trim(),
          content: content.trim(),
          status: status.trim() as "new" | "modified" | "deleted"
        })
      }

      // Handle deleted files (which don't have content)
      const deletedFileMatches = fileListMatch[1].matchAll(
        /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>deleted<\/file_status>[\s\S]*?<\/file>/g
      )

      for (const match of deletedFileMatches) {
        const [_, path] = match
        files.push({
          path: path.trim(),
          content: "",
          status: "deleted"
        })
      }
    }

    const parsedImplementation: ParsedImplementation = {
      files,
      prTitle,
      prDescription
    }

    return parsedImplementation
  }

  throw new Error("Invalid response format: Missing <pull_request> tags")
}

export const isImplementationComplete = (response: string): boolean => {
  const trimmedResponse = response.trim()
  return trimmedResponse.endsWith("</pull_request>")
}