class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const BASE = 'Legacy Collection/Assets/Packs/SpaceShooter/Space Shooter files';

    // ── Background layers ──────────────────────────────────────────────────
    this.load.image('bg-back',   `${BASE}/background/layered/bg-back.png`);
    this.load.image('bg-stars',  `${BASE}/background/layered/bg-stars.png`);
    this.load.image('bg-planet', `${BASE}/background/layered/bg-planet.png`);

    // ── Player frames ──────────────────────────────────────────────────────
    this.load.image('player1', `${BASE}/player/sprites/player1.png`);
    this.load.image('player2', `${BASE}/player/sprites/player2.png`);
    this.load.image('player3', `${BASE}/player/sprites/player3.png`);

    // ── Boss spritesheet ───────────────────────────────────────────────────
    this.load.spritesheet('enemy-sheet', `${BASE}/enemy/spritesheet.png`, {
      frameWidth: 29, frameHeight: 29
    });

    // ── Enemy frames ───────────────────────────────────────────────────────
    this.load.image('enemy1', `${BASE}/enemy/sprites/enemy1.png`);
    this.load.image('enemy2', `${BASE}/enemy/sprites/enemy2.png`);
    this.load.image('enemy3', `${BASE}/enemy/sprites/enemy3.png`);
    this.load.image('enemy4', `${BASE}/enemy/sprites/enemy4.png`);
    this.load.image('enemy5', `${BASE}/enemy/sprites/enemy5.png`);

    // ── Projectile frames ──────────────────────────────────────────────────
    this.load.image('shoot1', `${BASE}/shoot/shoot1.png`);
    this.load.image('shoot2', `${BASE}/shoot/shoot2.png`);

    // ── Explosion frames ───────────────────────────────────────────────────
    this.load.image('explosion1', `${BASE}/explosion/sprites/explosion1.png`);
    this.load.image('explosion2', `${BASE}/explosion/sprites/explosion2.png`);
    this.load.image('explosion3', `${BASE}/explosion/sprites/explosion3.png`);
    this.load.image('explosion4', `${BASE}/explosion/sprites/explosion4.png`);
    this.load.image('explosion5', `${BASE}/explosion/sprites/explosion5.png`);

    // ── Hit effect frames ──────────────────────────────────────────────────
    this.load.image('hit1', `${BASE}/Hit/sprites/hit1.png`);
    this.load.image('hit2', `${BASE}/Hit/sprites/hit2.png`);
    this.load.image('hit3', `${BASE}/Hit/sprites/hit3.png`);
    this.load.image('hit4', `${BASE}/Hit/sprites/hit4.png`);

    // ── Muzzle flash ───────────────────────────────────────────────────────
    this.load.image('flash', `${BASE}/flash/flash.png`);

    // ── Asteroids ─────────────────────────────────────────────────────────
    this.load.image('asteroid',       `${BASE}/asteroids/asteroid.png`);
    this.load.image('asteroid-small', `${BASE}/asteroids/asteroid-small.png`);

    // ── Audio ──────────────────────────────────────────────────────────────
    this.load.audio('snd-shot1',     `${BASE}/Sound FX/shot 1.wav`);
    this.load.audio('snd-shot2',     `${BASE}/Sound FX/shot 2.wav`);
    this.load.audio('snd-explosion', `${BASE}/Sound FX/explosion.wav`);
    this.load.audio('snd-hit',       `${BASE}/Sound FX/hit.wav`);

    // Loading bar
    const W = this.scale.width;
    const H = this.scale.height;
    const bar = this.add.rectangle(W / 2 - 80, H / 2, 0, 8, 0x44aaff).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 162, 10, 0x333333).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 18, 'LOADING...', {
      fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.load.on('progress', v => { bar.width = 160 * v; });
  }

  create() {
    // ── Player thruster animation ──────────────────────────────────────────
    this.anims.create({
      key: 'player-fly',
      frames: [{ key: 'player1' }, { key: 'player2' }, { key: 'player3' }],
      frameRate: 8,
      repeat: -1
    });

    // ── Enemy fly animation ────────────────────────────────────────────────
    this.anims.create({
      key: 'enemy-fly',
      frames: [
        { key: 'enemy1' }, { key: 'enemy2' }, { key: 'enemy3' },
        { key: 'enemy4' }, { key: 'enemy5' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // ── Explosion (one-shot) ───────────────────────────────────────────────
    this.anims.create({
      key: 'explode',
      frames: [
        { key: 'explosion1' }, { key: 'explosion2' }, { key: 'explosion3' },
        { key: 'explosion4' }, { key: 'explosion5' }
      ],
      frameRate: 12,
      repeat: 0,
      hideOnComplete: true
    });

    // ── Hit effect (one-shot) ──────────────────────────────────────────────
    this.anims.create({
      key: 'hit-effect',
      frames: [{ key: 'hit1' }, { key: 'hit2' }, { key: 'hit3' }, { key: 'hit4' }],
      frameRate: 14,
      repeat: 0,
      hideOnComplete: true
    });

    // ── Boss fly (spritesheet, slower for a heavy feel) ────────────────────
    this.anims.create({
      key: 'boss-fly',
      frames: this.anims.generateFrameNumbers('enemy-sheet', { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1
    });

    // ── Bullet pulse ───────────────────────────────────────────────────────
    this.anims.create({
      key: 'bullet-fly',
      frames: [{ key: 'shoot1' }, { key: 'shoot2' }],
      frameRate: 12,
      repeat: -1
    });

    // ── Generated textures (power-ups + boss bullet) ───────────────────────
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // Shield power-up — cyan square with white border
    gfx.fillStyle(0x00ccff, 1);
    gfx.fillRect(1, 1, 9, 9);
    gfx.lineStyle(1, 0xffffff, 0.8);
    gfx.strokeRect(0, 0, 11, 11);
    gfx.generateTexture('powerup-shield', 11, 11);
    gfx.clear();

    // Double-shot power-up — yellow square with white border
    gfx.fillStyle(0xffee00, 1);
    gfx.fillRect(1, 1, 9, 9);
    gfx.lineStyle(1, 0xffffff, 0.8);
    gfx.strokeRect(0, 0, 11, 11);
    gfx.generateTexture('powerup-double', 11, 11);
    gfx.clear();

    // Boss bullet — red elongated capsule
    gfx.fillStyle(0xff3300, 1);
    gfx.fillRect(1, 0, 4, 9);
    gfx.fillStyle(0xff8866, 1);
    gfx.fillRect(2, 0, 2, 3);
    gfx.generateTexture('boss-bullet', 6, 9);
    gfx.destroy();

    this.scene.start('MenuScene');
  }
}
