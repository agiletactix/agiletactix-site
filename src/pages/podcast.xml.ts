import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const episodes = (await getCollection('podcast'))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const siteUrl = site?.toString() || 'https://agiletactix.ai';

  const itemsXml = episodes.map((ep) => {
    const epUrl = `${siteUrl}podcast/${ep.slug}/`;
    const episodeTag = ep.data.episodeNumber
      ? `<itunes:episode>${ep.data.episodeNumber}</itunes:episode>`
      : '';

    return `
    <item>
      <title>${escapeXml(ep.data.title)}</title>
      <description>${escapeXml(ep.data.description)}</description>
      <link>${epUrl}</link>
      <guid isPermaLink="true">${epUrl}</guid>
      <pubDate>${ep.data.pubDate.toUTCString()}</pubDate>
      <enclosure url="${escapeXml(ep.data.audioUrl)}" type="audio/mpeg" length="0"/>
      <itunes:duration>${ep.data.duration}</itunes:duration>
      <itunes:episodeType>${ep.data.episodeType}</itunes:episodeType>
      <itunes:season>${ep.data.season}</itunes:season>
      ${episodeTag}
      <itunes:explicit>${ep.data.explicit ? 'true' : 'false'}</itunes:explicit>
      <itunes:summary>${escapeXml(ep.data.description)}</itunes:summary>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Career Optional</title>
    <description>The skills that make employment optional. Story-driven episodes on agile methodology, AI automation, and career resilience. Hosted by Danny Liu.</description>
    <link>${siteUrl}podcast/</link>
    <language>en-us</language>
    <atom:link href="${siteUrl}podcast.xml" rel="self" type="application/rss+xml"/>
    <itunes:author>Danny Liu</itunes:author>
    <itunes:owner>
      <itunes:name>Danny Liu</itunes:name>
      <itunes:email>danny@agiletactix.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${siteUrl}podcast-cover.jpg"/>
    <itunes:category text="Business">
      <itunes:category text="Careers"/>
    </itunes:category>
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <podcast:locked>no</podcast:locked>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
