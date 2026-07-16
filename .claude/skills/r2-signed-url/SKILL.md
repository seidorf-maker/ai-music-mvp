---
description: Generates time-limited signed URLs for reading/writing audio files in Cloudflare R2. Use whenever code needs to serve or store track audio, stems, or other R2-backed assets.
---

## Instructions

1. Audio is never served from a public bucket — every read goes through a signed URL with a short TTL (15 minutes per `research/PRD.md` Section 5's `tracks.get`).
2. Use the S3-compatible presigned URL flow (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) since R2 is S3-compatible — no R2-specific SDK is needed.
3. Object keys should encode enough structure to avoid collisions and make cleanup traceable (e.g., `{orgId}/{trackId}/audio.wav`), but never put anything sensitive in the key itself since keys can appear in logs.
4. Audio must never be proxied through the Next.js/Netlify app server — that reintroduces the egress costs R2 was chosen specifically to avoid (`research/tech-stack.md` Section 4). Always hand the client a direct signed R2 URL.
5. Small assets (avatars, etc.) go through Supabase Storage instead — R2 is for audio only. Keep this split consistent; don't let it drift as features get added (flagged as a pain point in `research/tech-stack.md` Section 6).

## References

- `research/PRD.md` Section 5 (`tracks.get`) and Section 6 (security requirements)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
