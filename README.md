# Kaiju Night Run

An 8-bit, one-button creature feature for the Gojira Games drive-in. Vanilla JS, one canvas,
every pixel drawn from code. Original homage characters only.

- **Play:** Space / ↑ / click / tap to jump (hold for height), ↓ to duck, P to pause, M for sound.
- **Store-only:** runs only when framed by `gojiragames.crystalcommerce.com` (or localhost).
  Opened directly, it shows a "Now playing at Gojira Games" card. This is a soft lock, not
  security. Locally, `?dev` lets you play it unframed.
- **Coupon:** reaching 1,000 points reveals `COUPON_CODE` (top of `game.js`). Create the matching
  discount in the store admin.

## Embed

In a Site Builder **Bloque HTML**:

```html
<iframe src="https://astromousedesign.github.io/kaiju-night-run/" title="Kaiju Night Run"
  style="width:100%;aspect-ratio:16/9;border:0"></iframe>
```
