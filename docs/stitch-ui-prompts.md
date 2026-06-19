# Google Stitch Prompts — 奇葩说 Classroom Edition

A classroom debate game (inspired by 奇葩说 / *U Can U BiBi*). Teacher runs matches on a projector; students vote from phones via a room code. Below: one shared style prompt, then one prompt per screen, each with 1–2 refinement follow-ups.

**Mode cheat-sheet**

| Screen | Stitch mode |
|---|---|
| 1. Setup (teacher prep) | **Web / Desktop** |
| 2. Stage / Projector "Arena" | **Web / Desktop** (16:9) |
| 3. Join | **Mobile** |
| 4. Vote | **Mobile** |

> Tip: Feed the **Shared Design System** prompt first (or paste it at the top of each screen prompt) so Stitch keeps colors, type, and the blue-vs-red motif consistent across all four screens.

---

## 0. Shared Design System (prepend to every screen)

```
Design system for a classroom debate game app called "奇葩说 Classroom Edition" — inspired by the Chinese debate TV show 奇葩说 (U Can U BiBi). Overall mood: a dramatic, modern TV debate game show — bold, high-contrast, confident, a little theatrical, but still clean and legible.

Two opposing teams drive the entire color language:
- Side A / 正方 = BLUE. Primary blue #60a5fa, deep blue #1e40af for fills and panels.
- Side B / 反方 = RED. Primary red #f87171, deep red #7f1d1d for fills and panels.
- Neutral dark stage background #0f1117, with slightly lighter surface panels #1a1d27.
- Text: near-white #f8fafc on dark; muted gray #94a3b8 for secondary labels.

Typography: bold, modern sans-serif (geometric, confident, broadcast feel). Large dramatic headings. ALL numbers — timers, counts, percentages — use TABULAR / monospaced figures so digits never shift width. Timers are very large and ultra-bold.

Content language is Chinese, with optional small bilingual English subtitles under key labels (e.g. "正方 / Side A", "开始 / Start"). Buttons are large, rounded (12–16px radius), with strong hover/press states. Generous spacing, strong visual hierarchy. Use real example content, never lorem ipsum. Example topic: "该不该告诉好朋友 TA 的恋人出轨了?".
```

---

## 1. Setup Screen — Teacher Prep (Web / Desktop)

**Stitch mode: Web / Desktop.** Note: this screen is the friendly LIGHT prep theme — NOT the dark stage.

```
Design a clean, friendly LIGHT-themed setup/configuration form for a teacher to set up a classroom debate match. This is a prep screen, NOT the dark stage — use a soft off-white background (#f8fafc), white cards, dark slate text, and gentle rounded cards with subtle shadows. Keep the blue-vs-red team accent motif but in a calm, organized way.

Layout, top to bottom, centered in a single comfortable column (max ~880px wide):
- Header: app name "奇葩说 · Classroom Edition" with a small subtitle "设置本场辩论 / Set up the match".
- A large prominent topic input: a full-width text field labeled "辩题 / Topic" with big text, pre-filled with the example "该不该告诉好朋友 TA 的恋人出轨了?".
- Below, TWO side-by-side team configuration cards:
  - LEFT card tinted blue (#60a5fa accent border + light blue header): a label input "队伍名称" pre-filled "正方", with the small badge "Side A". Under it, three name input fields labeled "辩手 1 / 2 / 3", pre-filled "陈铭", "詹青云", and the third left empty with placeholder "可选". A small "+ 添加辩手" affordance.
  - RIGHT card tinted red (#f87171 accent): label input pre-filled "反方", badge "Side B". Three name fields pre-filled "黄执中", "傅首尔", third empty.
- A timer default row: label "计时默认 / Timer" with a segmented selector of chips (01:00, 01:30, 02:00, 03:00) with 02:00 selected/highlighted. Numbers use tabular figures.
- A large primary call-to-action button, full width, bold: "开始 / Start", in a confident gradient (blue→purple).

Friendly, organized, broadcast-prep feel. Clear section spacing, large tap targets.
```

**Refinement follow-ups**
- `Make the two team cards feel more clearly opposing — give the blue card a left-aligned blue gradient header strip and the red card a red one, like rival team dugouts.`
- `Add a subtle "预览 / Preview" secondary button next to the Start button, and show a small toggle for "双计时器模式 / Double-timer mode".`

---

## 2. Stage / Projector "Arena" Display (Web / Desktop, 16:9 — DARK hero screen)

**Stitch mode: Web / Desktop**, 16:9 landscape. This is the hero — the dramatic dark debate stage shown on a projector.

```
Design a dramatic DARK "debate stage" display, 16:9 landscape, meant to be projected on a big screen and read from across a classroom. This is a TV-game-show arena. Background deep near-black #0f1117 with a subtle radial spotlight glow in the center. Everything is large, bold, high-contrast.

TOP BAR (full width):
- Centered: the debate topic in large bold white text — "该不该告诉好朋友 TA 的恋人出轨了?".
- Top-right corner: a compact "join" card with a white QR code, the caption "扫码投票", and a big bold 4-digit room code "4821" in tabular figures.

MIDDLE (three columns):
- LEFT panel = Side A team, BLUE. A tall panel with a blue glow/border (#60a5fa, deep #1e40af fill), the label "正方 / Side A" at top, and below it the debater names stacked large: "陈铭", "詹青云".
- CENTER = a HUGE countdown timer, the visual hero: massive ultra-bold tabular digits "01:48", with a small caption above it reading "正方发言中". A thin circular or linear progress ring around/under the timer subtly draining.
- RIGHT panel = Side B team, RED (#f87171, deep #7f1d1d fill), label "反方 / Side B", names "黄执中", "傅首尔".

BOTTOM (full width):
- A bold full-width horizontal VOTE BAR split into a blue segment and a red segment meeting in the middle, blue filling 58% from the left and red 42% from the right, each segment showing its big percentage ("58%" on blue, "42%" on red).
- Directly under the bar, a single "swing line" in muted text with tabular numbers: "开场 50/50 → 正方 +8 · 32 票".

Make percentages, timer, and code all use tabular/monospaced figures. Strong, theatrical, legible from the back of a room.
```

**Refinement follow-ups (variants — generate these as alternate states of the same screen)**
- `Variant — DOUBLE TIMER MODE: replace the single center countdown with TWO side-by-side chess-clock timers, one per team (left blue "02:00", right red "01:32"). The currently active team's timer GLOWS brightly with its team color and a pulsing border; the inactive one is dimmed. Keep the same top bar, team panels, and bottom vote bar.`
- `Variant — WINNER REVEAL OVERLAY: dim the whole stage and show a centered dramatic reveal overlay. Big blue headline "正方 净胜 +8 票", and below it, in elegant smaller italic-style text, the line "你没有赢下全场，你改变了全场". Add a subtle confetti or spotlight burst in the winning team's blue. Keep the topic visible faintly behind the overlay.`

---

## 3. Join Screen (Mobile)

**Stitch mode: Mobile.**

```
Design a minimal, friendly MOBILE "join the game" screen for a classroom debate app. Branded but calm — a clean background that subtly nods to the blue-vs-red team motif (e.g. a soft dark-to-deep-blue gradient, or a split-tinted accent), with high legibility.

Vertically centered, generous spacing:
- App title at the top: "奇葩说" big and bold, with a small subtitle "Classroom Edition · 输入房间码加入".
- The hero element: ONE large numeric input for a 4-digit room code, styled as four big rounded digit boxes / segmented cells, showing an example "4 8 2 1" in huge tabular figures. A numeric keypad context is implied.
- Below it, a large full-width primary button: "加入 / Join", bold and rounded, in a confident blue-to-purple gradient.
- A tiny helper line under the button in muted text: "向老师拿房间码".

Big tap targets, thumb-friendly, friendly and inviting — like joining a live show.
```

**Refinement follow-ups**
- `Make the 4-digit code entry feel more game-show: each digit cell lights up its border as it's filled, and add a small pulsing "LIVE" dot near the title.`
- `Try a lighter variant: white background, blue/red accent only on the digit cells and the Join button.`

---

## 4. Vote Screen (Mobile)

**Stitch mode: Mobile.** Critical: the phone NEVER shows vote percentages or counts — those live only on the projector.

```
Design a MOBILE voting screen for a student who has joined a classroom debate. The phone shows ONLY the topic and two big side buttons — NO vote percentages, NO counts, NO totals anywhere (results are only shown on the teacher's projector).

Layout, full height:
- TOP: the debate topic in clear bold text, wrapping if needed: "该不该告诉好朋友 TA 的恋人出轨了?". Small label above it: "为你支持的一方投票".
- BODY: TWO very large full-width tappable buttons that together fill most of the screen, stacked vertically (top and bottom halves):
  - TOP button = BLUE, Side A: big label "正方 / Side A" with the debater names small underneath ("陈铭 · 詹青云").
  - BOTTOM button = RED, Side B: big label "反方 / Side B" with names ("黄执中 · 傅首尔").
- SELECTED STATE: show the BLUE (top) button as currently selected — it's filled solid blue with a bright glowing border, a checkmark, and a small "你的选择" tag; the RED button is in a muted/outline state, clearly tappable to switch.
- BOTTOM: a small centered hint in muted text: "你可以随时改变立场".

Make the two buttons feel like a clear binary choice — huge, opposing, satisfying to tap. No numbers or stats of any kind on screen.
```

**Refinement follow-ups**
- `Show the OTHER state: make the RED (反方) button the selected one (solid red, glowing border, checkmark, "你的选择" tag) and the blue button muted/outline — so I can see both selection states.`
- `Add a subtle tap animation feel: when a side is selected it scales up slightly and the unselected side shrinks back. Still absolutely no vote numbers anywhere on the phone.`

---

### Suggested generation order
1. Shared Design System (paste first / keep handy)
2. Screen 2 (Arena) — nail the dark theme & team motif first, it anchors everything
3. Screen 1 (Setup) — the light counterpart
4. Screens 3 & 4 (Mobile Join + Vote)

Each screen prompt already embeds the key colors and real example content, so it will also work standalone if pasted with the Shared Design System block on top.
