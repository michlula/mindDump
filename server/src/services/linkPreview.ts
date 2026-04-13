import ogs from 'open-graph-scraper';
import { LinkMetadata } from '../types/index.js';

const URL_REGEX = /https?:\/\/[^\s<>'"]+/gi;

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

export function containsUrl(text: string): boolean {
  return URL_REGEX.test(text);
}

export async function fetchLinkPreview(url: string): Promise<LinkMetadata> {
  try {
    const { result } = await ogs({ url, timeout: 10 });

    return {
      title: result.ogTitle || result.twitterTitle || result.dcTitle,
      description: result.ogDescription || result.twitterDescription || result.dcDescription,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
      siteName: result.ogSiteName,
      url,
    };
  } catch (error) {
    console.error('Link preview fetch failed:', error);
    return { url };
  }
}
