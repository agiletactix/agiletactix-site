// Kit v4 API client — subscribe + tag for Rovo-Readiness Assessment

export interface KitSubscriberResult {
  status: 'success' | 'failed';
  subscriber_id?: string;
  error?: string;
}

/**
 * Create or update a Kit subscriber with tags.
 * Kit v4 API: POST /v4/subscribers
 * Docs: https://developers.kit.com/v4
 */
export async function createOrUpdateSubscriber(
  email: string,
  firstName: string | undefined,
  tags: string[],
  apiKey: string,
): Promise<KitSubscriberResult> {
  try {
    // Step 1: Create or update the subscriber
    const subscriberRes = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        first_name: firstName || undefined,
        state: 'active', // Skip confirmation email
      }),
    });

    if (!subscriberRes.ok) {
      const errBody = await subscriberRes.text();
      console.error(`Kit subscriber creation failed: ${subscriberRes.status} ${errBody}`);
      return { status: 'failed', error: `Kit API ${subscriberRes.status}` };
    }

    const subscriberData = await subscriberRes.json() as { subscriber: { id: number } };
    const subscriberId = String(subscriberData.subscriber.id);

    // Step 2: Apply tags (Kit v4 uses tag names — create tags if needed, then tag subscriber)
    for (const tagName of tags) {
      try {
        // Create tag (idempotent — returns existing tag if name matches)
        const tagRes = await fetch('https://api.kit.com/v4/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ name: tagName }),
        });

        if (!tagRes.ok) {
          console.warn(`Kit tag creation failed for "${tagName}": ${tagRes.status}`);
          continue;
        }

        const tagData = await tagRes.json() as { tag: { id: number } };
        const tagId = tagData.tag.id;

        // Tag the subscriber
        const tagSubRes = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email_address: email }),
        });

        if (!tagSubRes.ok) {
          console.warn(`Kit tag subscriber failed for tag ${tagId}: ${tagSubRes.status}`);
        }
      } catch (tagErr) {
        console.warn(`Kit tag error for "${tagName}":`, tagErr);
      }
    }

    return { status: 'success', subscriber_id: subscriberId };
  } catch (err) {
    console.error('Kit API error:', err);
    return { status: 'failed', error: String(err) };
  }
}
