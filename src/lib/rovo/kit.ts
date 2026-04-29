// Kit v4 API client — subscribe + tag
// Uses X-Kit-Api-Key header auth (non-expiring API key)
// Docs: https://developers.kit.com/v4

const BASE = 'https://api.kit.com/v4';

export interface KitSubscriberResult {
  status: 'success' | 'failed';
  subscriber_id?: string;
  error?: string;
  statusCode?: number;
}

function kitHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };
}

export async function createOrUpdateSubscriber(
  email: string,
  firstName: string | undefined,
  tags: string[],
  apiKey: string,
  fields?: Record<string, string>,
): Promise<KitSubscriberResult> {
  try {
    const headers = kitHeaders(apiKey);

    // Step 1: Create or update subscriber
    const subRes = await fetch(`${BASE}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email_address: email,
        first_name: firstName || undefined,
        ...(fields && Object.keys(fields).length > 0 ? { fields } : {}),
      }),
    });

    if (!subRes.ok) {
      const errBody = await subRes.text();
      console.error(`[Kit] subscriber create failed: ${subRes.status} ${errBody}`);
      return { status: 'failed', error: `Kit API ${subRes.status}: ${errBody}`, statusCode: subRes.status };
    }

    const subData = await subRes.json() as { subscriber: { id: number } };
    const subscriberId = String(subData.subscriber.id);

    // Step 2: Apply tags
    for (const tagName of tags) {
      try {
        // Find existing tag
        const listRes = await fetch(`${BASE}/tags`, { headers });
        let tagId: number | undefined;

        if (listRes.ok) {
          const listData = await listRes.json() as { tags: { id: number; name: string }[] };
          const existing = listData.tags.find(t => t.name === tagName);
          tagId = existing?.id;
        }

        // Create tag if needed
        if (!tagId) {
          const createRes = await fetch(`${BASE}/tags`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: tagName }),
          });
          if (createRes.ok) {
            const createData = await createRes.json() as { tag: { id: number } };
            tagId = createData.tag.id;
          } else {
            console.warn(`[Kit] tag create failed for "${tagName}": ${createRes.status}`);
            continue;
          }
        }

        // Tag the subscriber by email
        const tagRes = await fetch(`${BASE}/tags/${tagId}/subscribers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email_address: email }),
        });

        if (!tagRes.ok) {
          console.warn(`[Kit] tag apply failed for "${tagName}": ${tagRes.status}`);
        }
      } catch (tagErr) {
        console.warn(`[Kit] tag error for "${tagName}":`, tagErr);
      }
    }

    return { status: 'success', subscriber_id: subscriberId };
  } catch (err) {
    console.error('[Kit] API error:', err);
    return { status: 'failed', error: String(err) };
  }
}
