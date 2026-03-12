export const getCurrentTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab[0]
}

export const getCurrentArticle = async (urlString: string): Promise<string | null> => {
  const url = new URL(urlString)
  const pathname = url.pathname
  const articleLink = url.origin + pathname

  return articleLink || null
}