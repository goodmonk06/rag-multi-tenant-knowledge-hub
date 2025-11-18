export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const html = await response.text();
      // Simple HTML tag removal (for production, use a proper HTML parser like cheerio)
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(`Failed to fetch URL: ${url}`);
  }
}
