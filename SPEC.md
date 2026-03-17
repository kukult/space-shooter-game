# Retro 2D Space Shooter — Game Spec

## Overview

A vertical top-down retro space shooter built with **JavaScript + Phaser 3**.
The player pilots a spaceship, destroys waves of alien enemies and dodges asteroids,
and faces a boss at the end. Casual/arcadey difficulty — lives-based, forgiving hit
detection, fun over frustration.

---

## Technology

| Item | Choice |
|------|--------|
| Framework | Phaser 3 |
| Language | JavaScript (ES6+) |
| Renderer | WebGL / Canvas fallback |
| Target | Browser (desktop) |

---

## Core Requirements

### Player
- Moves in all four directions within the screen bounds (arrow keys or WASD)
- Fires a single laser shot upward (spacebar or auto-fire)
- Has **3 lives**; a brief invincibility window after being hit
- Displays a score counter and remaining lives on the HUD

### Enemies
- Spawn in waves from the top of the screen
- Move in simple patterns (straight down, sine-wave, dive-bomb)
- Deal 1 life of damage on collision with the player
- Drop points when destroyed

### Asteroids
- Randomly drift down the screen at varying speeds and sizes
- Deal 1 life of damage on collision with the player
- Can be destroyed by player shots

### Scrolling Background
- Parallax starfield using layered background images (back → stars → planet)

### Game States
- **Main Menu** — title screen, start button
- **Gameplay** — active game loop
- **Game Over** — score display, restart option

### Audio
- Sound effects for shooting, hit, explosion

---

## Asset Index

All assets are relative to:
`Legacy Collection/Assets/`

### Player Ship
| Asset | Path |
|-------|------|
| Frame 1 | `Packs/SpaceShooter/Space Shooter files/player/sprites/player1.png` |
| Frame 2 | `Packs/SpaceShooter/Space Shooter files/player/sprites/player2.png` |
| Frame 3 | `Packs/SpaceShooter/Space Shooter files/player/sprites/player3.png` |

### Enemy Ship
| Asset | Path |
|-------|------|
| Frame 1 | `Packs/SpaceShooter/Space Shooter files/enemy/sprites/enemy1.png` |
| Frame 2 | `Packs/SpaceShooter/Space Shooter files/enemy/sprites/enemy2.png` |
| Frame 3 | `Packs/SpaceShooter/Space Shooter files/enemy/sprites/enemy3.png` |
| Frame 4 | `Packs/SpaceShooter/Space Shooter files/enemy/sprites/enemy4.png` |
| Frame 5 | `Packs/SpaceShooter/Space Shooter files/enemy/sprites/enemy5.png` |
| Spritesheet | `Packs/SpaceShooter/Space Shooter files/enemy/spritesheet.png` |

### Projectile
| Asset | Path |
|-------|------|
| Shot 1 | `Packs/SpaceShooter/Space Shooter files/shoot/shoot1.png` |
| Shot 2 | `Packs/SpaceShooter/Space Shooter files/shoot/shoot2.png` |

### Explosion
| Asset | Path |
|-------|------|
| Frame 1 | `Packs/SpaceShooter/Space Shooter files/explosion/sprites/explosion1.png` |
| Frame 2 | `Packs/SpaceShooter/Space Shooter files/explosion/sprites/explosion2.png` |
| Frame 3 | `Packs/SpaceShooter/Space Shooter files/explosion/sprites/explosion3.png` |
| Frame 4 | `Packs/SpaceShooter/Space Shooter files/explosion/sprites/explosion4.png` |
| Frame 5 | `Packs/SpaceShooter/Space Shooter files/explosion/sprites/explosion5.png` |
| Spritesheet | `Packs/SpaceShooter/Space Shooter files/explosion/explosion.png` |

### Hit Effect
| Asset | Path |
|-------|------|
| Frame 1 | `Packs/SpaceShooter/Space Shooter files/Hit/sprites/hit1.png` |
| Frame 2 | `Packs/SpaceShooter/Space Shooter files/Hit/sprites/hit2.png` |
| Frame 3 | `Packs/SpaceShooter/Space Shooter files/Hit/sprites/hit3.png` |
| Frame 4 | `Packs/SpaceShooter/Space Shooter files/Hit/sprites/hit4.png` |
| Spritesheet | `Packs/SpaceShooter/Space Shooter files/Hit/hit.png` |

### Flash Effect
| Asset | Path |
|-------|------|
| Flash | `Packs/SpaceShooter/Space Shooter files/flash/flash.png` |

### Asteroids
| Asset | Path |
|-------|------|
| Large | `Packs/SpaceShooter/Space Shooter files/asteroids/asteroid.png` |
| Small | `Packs/SpaceShooter/Space Shooter files/asteroids/asteroid-small.png` |

### Background (Parallax Layers)
| Asset | Path |
|-------|------|
| Back layer | `Packs/SpaceShooter/Space Shooter files/background/layered/bg-back.png` |
| Stars layer | `Packs/SpaceShooter/Space Shooter files/background/layered/bg-stars.png` |
| Planet layer | `Packs/SpaceShooter/Space Shooter files/background/layered/bg-planet.png` |
| Preview | `Packs/SpaceShooter/Space Shooter files/background/bg-preview-big.png` |

### Audio
| Asset | Path |
|-------|------|
| Shot 1 | `Packs/SpaceShooter/Space Shooter files/Sound FX/shot 1.wav` |
| Shot 2 | `Packs/SpaceShooter/Space Shooter files/Sound FX/shot 2.wav` |
| Explosion | `Packs/SpaceShooter/Space Shooter files/Sound FX/explosion.wav` |
| Hit | `Packs/SpaceShooter/Space Shooter files/Sound FX/hit.wav` |

---

## Milestones

---

### Milestone 1 — Playable Core

**Goal:** A fully playable loop — you can fly, shoot, and die.

#### Deliverables
- Phaser 3 project scaffolded (`index.html`, `game.js`, scene files)
- Parallax scrolling background (3 layers: bg-back, bg-stars, bg-planet)
- Player ship renders and moves in all directions with keyboard input
- Player fires laser shots upward (spacebar)
- One enemy type spawns in straight-down waves and animates
- Collision detection: bullet→enemy (destroy both, add score), enemy→player (lose life)
- Explosion animation plays on enemy/player death
- Hit flash effect on player damage
- HUD: score counter + 3 life icons
- Game Over screen with final score and restart button

#### Assets Used
- Player frames 1–3
- Enemy frames 1–5 (one wave pattern)
- shoot1.png / shoot2.png
- Explosion frames 1–5
- Hit frames 1–4, flash.png
- bg-back.png, bg-stars.png, bg-planet.png
- shot 1.wav, explosion.wav, hit.wav

---


### Milestone 2 — Enemies, Asteroids & Waves

**Goal:** Meaningful progression — harder waves, new hazards, variety.

#### Deliverables
- **Wave system:** 5 scripted waves, each increasing in enemy count and speed
- **Two additional enemy movement patterns:** sine-wave drift and dive-bomb attack
- **Asteroids:** large and small drift down at random speeds; player shots break large ones into two small ones
- **Score multiplier:** consecutive hits without taking damage build a x2/x3 multiplier shown on HUD
- **Main Menu scene:** title, "Press Start", high score display
- Audio: shot 2.wav added for a second weapon sound variant

#### Assets Used
- All Milestone 1 assets
- asteroid.png, asteroid-small.png
- shot 2.wav

---

### Milestone 3 — Boss, Polish & Game Feel

**Goal:** A complete, satisfying game with a climax and full audio/visual polish.

#### Deliverables
- **Boss fight:** a large enemy with a multi-phase health bar that appears after wave 5
  - Phase 1: fires single projectiles in a spread pattern
  - Phase 2 (50% HP): fires a sweeping laser beam
  - Defeat triggers a large multi-explosion sequence
- **Power-ups:** enemies randomly drop one of two pickups:
  - Shield (1 hit absorb)
  - Double shot (timed)
- **Screen shake** on large explosions
- **Pause menu** (ESC key) with resume and quit options
- **Persistent high score** stored in localStorage
- **Game Over / Victory screens** with score breakdown and restart

#### Assets Used
- All previous assets
- enemy spritesheet.png (reused, scaled up for boss)
- explosion.png spritesheet (chained for boss death)
- All 4 sound FX

---

## File Structure (Target)

```
Space Shooter Game/
├── index.html
├── game.js                  # Phaser config + scene registry
├── scenes/
│   ├── MenuScene.js
│   ├── GameScene.js
│   ├── GameOverScene.js
│   └── BossScene.js         (Milestone 3)
├── entities/
│   ├── Player.js
│   ├── Enemy.js
│   ├── Asteroid.js
│   └── Boss.js              (Milestone 3)
├── assets/ → (symlink or copy from Legacy Collection/Assets/...)
└── SPEC.md
```
