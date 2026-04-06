# 🌍 Global Rhythm Explorer

An interactive system for exploring, generating, and visualizing rhythmic structures from around the world.

---

## 🧠 Overview

The **Global Rhythm Explorer** is a cross-cultural rhythm engine that combines:

- Music theory
- Cultural research
- Interactive audio systems
- Generative pattern logic

It is designed as both:
- 🎓 An educational tool  
- 🎛️ A creative system for musicians and technologists  

This project lives within the broader ecosystem of:

👉 **zachscheffler.com**

---

## 🚀 Features

### 🎛️ Rhythm Generator
Generate rhythmic patterns based on:

- Region / Country
- Time signature
- BPM range
- Complexity level

Supports:
- Simple meters (4/4, 3/4)
- Compound meters (6/8, 12/8)
- Asymmetric meters (5/8, 7/8, 11/8)
- Polyrhythms (e.g., 3:2, 4:3)

---

### 🗺️ Global Map Visualizer
- Interactive world map interface
- Hover → view regional rhythm data
- Click → load rhythm into generator

Purpose:
- Connect rhythm to geography and culture
- Provide intuitive exploration of global styles

---

### 🎧 Audio Engine
- Real-time playback using Web Audio / Strudel
- Multi-layer percussion system:
  - Low (kick / bass drum)
  - Mid (conga / snare)
  - High (bells / claps)

Supports:
- Looping
- Tempo changes
- Pattern switching

---

### 📊 Visualization System
- Step sequencer grid
- Pulse grouping display (e.g., `2+3`, `3+2+2`)
- Polyrhythm overlays

---

## 🧩 Data Model

Each rhythm is represented as structured data:

```json
{
  "region": "West Africa",
  "country": "Mali",
  "style": "Djembe Ensemble",
  "meter": "12/8",
  "feel": "Polyrhythmic",
  "instruments": ["Djembe", "Dunun"]
}
