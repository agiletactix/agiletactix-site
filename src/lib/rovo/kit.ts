// Kit v3 API client — subscribe + tag
// v3 uses api_secret (non-expiring) instead of v4 OAuth Bearer tokens.
// Docs: https://developers.kit.com/v3

export interface KitSubscriberResult {
  status: 'success' | 'failed';
  subscriber_id?: string;
  error?: string;
}

export async function createOrUpdateSubscriber(
  email: string,
  firstName: string | undefined,
  tags: string[],
  apiSecret: string,
): Promise<KitSubscriberResult> {
  try {
    // Step 1: Look up or create subscriber
    // v3 doesn't have a single "create or update" endpoint, so we
    // use tag-subscribe which creates-or-updates and tags in one call.
    // If no tags, we use the /subscribers endpoint directly.

    let subscriberId: string | undefined;

    if (tags.length > 0) {
      // For each tag: find-or-create the tag, then subscribe via tag
      for (const tagName of tags) {
        try {
          // Find existing tag by name
          const listRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${apiSecret}`);
          let tagId: number | undefined;

          if (listRes.ok) {
            const listData = await listRes.json() as { tags: { id: number; name: string }[] };
            const existing = listData.tags.find(t => t.name === tagName);
            tagId = existing?.id;
          }

          // Create tag if it doesn't exist
          if (!tagId) {
            const createRes = await fetch('https://api.convertkit.com/v3/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_secret: apiSecret,
                tag: { name: tagName },
              }),
            });
            if (createRes.ok) {
              const createData = await createRes.json() as { id: number };
              tagId = createData.id;
            } else {
              console.warn(`Kit tag creation failed for "${tagName}": ${createRes.status}`);
              continue;
            }
          }

          // Subscribe via tag (creates or updates subscriber + applies tag)
          const subRes = await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_secret: apiSecret,
              email,
              first_name: firstName || undefined,
            }),
          });

          if (subRes.ok) {
            const subData = await subRes.json() as { subscription: { subscriber: { id: number } } };
            subscriberId = String(subData.subscription.subscriber.id);
          } else {
            console.warn(`Kit tag-subscribe failed for "${tagName}": ${subRes.status}`);
          }
        } catch (tagErr) {
          console.warn(`Kit tag error for "${tagName}":`, tagErr);
        }
      }
    } else {
      // No tags — just create/update subscriber
      const res = await fetch('https://api.convertkit.com/v3/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_secret: apiSecret,
          email_address: email,
          first_name: firstName || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { subscriber: { id: number } };
        subscriberId = String(data.subscriber.id);
      } else {
        const errBody = await res.text();
        console.error(`Kit subscriber creation failed: ${res.status} ${errBody}`);
        return { status: 'failed', error: `Kit API ${res.status}` };
      }
    }

    if (subscriberId) {
      return { status: 'success', subscriber_id: subscriberId };
    }
    return { status: 'failed', error: 'No subscriber ID returned' };
  } catch (err) {
    console.error('Kit API error:', err);
    return { status: 'failed', error: String(err) };
  }
}
