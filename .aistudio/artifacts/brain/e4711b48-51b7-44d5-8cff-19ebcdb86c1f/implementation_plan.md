# ChatGPT Advanced Voice Mode with Integrated Vedic Astrologer & Version 2 Expressive Orb

A pixel-faithful replica of ChatGPT's mobile Advanced Voice Mode with pitch-black OLED styling, an integrated Vedic Astrologer engine, and an Expressive Version 2 Orb with distinctive emotional and conversational states. Designed for static deployment to **GitHub Pages** using a free Gemini API key and 100% client-side sub-15ms astronomical calculations.

## Version 2 Expressive Orb Design System

> [!IMPORTANT]
> **Key Refinements Implemented in Version 2**:
> - **Clear Distinction Between Nodding, Normal, and Speaking States**:
>   1. **Normal (Idle) State**: Serene upright posture with gentle 4s resting breathing (`animate-orb-breathe`) and organic, lifelike **eye blinking** (`animate-eye-blink`).
>   2. **Listening State**: Active, attentive **head movement** (`animate-orb-listening`) with an inquisitive head tilt (-3.5° to 3°), ear-cocking posture, and subtle leaning in towards the speaker that responds dynamically to microphone voice levels.
>   3. **Nodding State**: Unmistakable **affirmative vertical agreement nod** (`animate-orb-nod` with a distinct down-dip and bounce) accompanied by relaxed 40px capsule eyes (`orb-nodding.svg`) signaling active comprehension.
>   4. **Speaking State**: Lively **conversational speech cadence** (`animate-orb-speaking`) with speech bobbing and syllable articulation modulating between 44px and 52px in sync with spoken voice.
>   5. **Thinking (Loading) State**: Dual capsule wave motion (`animate-bar-wave-l` and `animate-bar-wave-r`) matching `orb-loading.svg` with contemplative floating hover.
>   6. **Error State**: Angled warning capsules matching `orb-error.svg` with distressed jitter.
> - **Disciplined Eye Size Reference**: All eye capsules strictly reference the **Normal Mode baseline** (width: 14px, height: 48px, rx: 7px). Eye bars never elongate into oversized or distorted shapes.
> - **Natural Eye Blinking**: Organic 4.2-second CSS transform blink cycle that squashes the capsule vertically to the center line (`scaleY(0.08)`) and snaps open, including natural occasional double-blinks.
> - **Interactive Evaluation Controls**: An on-screen test bar in V2 allows one-tap preview of `Auto`, `Normal`, `Listening`, `Nodding`, `Speaking`, `Thinking`, and `Error` for seamless design evaluation.

---

## 1. Overview & Core Features

- **Version 1 (Baseline)**: Original organic fluid canvas shader orb for baseline voice evaluation.
- **Version 2 (Expressive Intervention)**: Clean, flat, minimal vector orb with expressive capsule bars and natural conversational body language.
- **Client-Side Vedic Engine**: Sub-5ms Lahiri Ayanamsha, Lagna, Moon sign, Nakshatra, and Vimshottari Dasha calculations.
- **GitHub Pages Static Output**: Relative base configuration (`base: './'`) ensuring static deployment compatibility without a server.
