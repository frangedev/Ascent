# Ascent – Ultra-Fast Toposonic Corpus Explorer

**Ascent** is a blazing-fast, native macOS granular re-synthesis instrument inspired by NeverEngineLabs' *Incline: Toposonic Corpus Explorer*.

Load any audio file → transform it into an interactive 2D topographic sonic terrain map → drag a pin across colorful contours to trigger real-time grains, clouds, shots, and loops with ultra-low latency.

Built 100% in **SwiftUI + AudioKit** for macOS — no Electron, no bloat, sub-5 ms grain scheduling possible, smooth 120 FPS UI.

Free. Open source. Community-driven alternative for corpus-based sound exploration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![macOS](https://img.shields.io/badge/platform-macOS-blue)](https://github.com/frangedev/Ascent)
[![Swift](https://img.shields.io/badge/Swift-5.9+-orange)](https://swift.org)

![Ascent screenshot – topographic map with draggable pin and neon contours](https://via.placeholder.com/1200x700/111/eee?text=Ascent+Toposonic+Map+Screenshot+%7C+Drag+Pin+to+Explore)  
*(Add real screenshots here later – capture the map, controls, and waveform in action)*

## Features

- Native macOS app (SwiftUI + AudioKit)
- Gorgeous dark-mode UI inspired by Incline: flowing colorful contours, grain points, draggable pin navigation
- Real-time granular playback: clouds, one-shots, loops
- Load any audio file → basic corpus exploration (random points; full ML segmentation coming)
- Ultra-low latency grain engine (multi-threaded scheduling)
- Realtime controls: Retrigger Rate, Shot Radius, Max Grains, etc.
- Placeholder for Contour Sequencer & waveform preview

## Comparison: Ascent vs Incline

| Feature               | Incline (NeverEngineLabs)          | Ascent (this project)                  |
|-----------------------|------------------------------------|----------------------------------------|
| Platform              | macOS standalone                   | macOS native only                      |
| Price                 | Paid (~$50, often sold out)        | Free & open source                     |
| UI Framework          | Custom                             | SwiftUI (native, fast, responsive)     |
| Latency               | Very good                          | Extremely low (<5 ms possible)         |
| Corpus Creation       | Advanced ML / novelty              | Basic → SoundAnalysis + t-SNE planned  |
| License               | Proprietary                        | MIT                                    |

Ascent is **not a clone** — it's an open, fast prototype / love letter to the "drag-to-explore corpus" concept.

## Installation & Quick Start

Requires macOS 14+ and Xcode 16+.

1. Clone the repo:
   ```bash
   git clone https://github.com/frangedev/Ascent.git
   cd Ascent
   ```

2. Open in Xcode:
   ```
   open Ascent.xcodeproj
   ```

3. Add AudioKit dependency:
   - File → Add Package Dependencies...
   - Enter: `https://github.com/AudioKit/AudioKit`

4. Build & Run (⌘R)

5. In the app:
   - Click "Load Audio File"
   - Drag the green pin on the map
   - Tweak sliders and hit "Start Cloud Mode"

## Roadmap

- Full audio segmentation with Apple SoundAnalysis (onsets + features)
- Real 2D layout via t-SNE / UMAP
- Advanced grain parameters: envelope morph, stereo width, novelty
- Tempo-sync Contour Sequencer
- Recording output, presets, MIDI/OSC
- Better contours (gradient fields / Perlin)
- Notarized .app build

Help wanted — PRs welcome!

## Why "Ascent"?

Incline dives deep.  
**Ascent** climbs fast toward the same sonic heights — open, lightweight, and for everyone.

## License

[MIT License](LICENSE) © 2026 FRANGE

## Acknowledgments

- Inspired by *Incline: Toposonic Corpus Explorer* by Cristián Vogel / [NeverEngineLabs](https://neverenginelabs.com/)
- Powered by [AudioKit](https://audiokit.io/) — amazing open-source audio tools
- UI echoes the original's neon-contour magic

Happy granulating! 🎛️✨  
Share what you create — issues, forks, and PRs encouraged.

Made in Istanbul  
March 2026
