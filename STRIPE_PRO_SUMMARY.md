# AI Estimator Pro Stripe Pro Tier Summary

Created the live $149/mo Pro tier for AI Estimator Pro and wired the landing page CTA to the Stripe payment link.

## Stripe Objects

- Product: `prod_UdM2y4ispQs0cu`
- Price: `price_1Te5K90WIc6TWTSy3UOGTfHx`
- Payment Link: `plink_1Te5KF0WIc6TWTSytNyRwNu5`
- Payment Link URL: `https://buy.stripe.com/eVq9AL6cR6KY71Yba8g7e08`

## Code Changes

- `app/page.tsx`
  - Replaced the Pro CTA mailto link with the live Stripe payment link.
  - Updated the helper text to say secure checkout via Stripe.

- `lib/businesses.ts`
  - Updated the AI Estimator Pro dashboard record to use the new payment link.
  - Updated the description to reflect Basic at $49/mo and Pro at $149/mo.

- `lib/data.ts`
  - Updated the AI Estimator Pro pipeline note to show Basic at $49/mo and Pro at $149/mo.

## Verification

- Stripe product, price, and payment link were created successfully.
- Local TypeScript checks passed after the edits.
- Canonical live page `https://ai-estimator-pro.vercel.app` now includes the Stripe payment link.
- HQ Dashboard portfolio detail page for AI Estimator Pro shows Basic at $49/mo and Pro at $149/mo, with the live Stripe payment link wired.
