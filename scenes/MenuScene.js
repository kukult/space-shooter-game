class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Scrolling background ───────────────────────────────────────────────
    this.bgBack   = this.add.tileSprite(0, 0, W, H, 'bg-back').setOrigin(0, 0).setDepth(0);
    this.bgPlanet = this.add.tileSprite(0, 0, W, H, 'bg-planet').setOrigin(0, 0).setDepth(1);
    this.bgStars  = this.add.tileSprite(0, 0, W, H, 'bg-stars').setOrigin(0, 0).setDepth(2);

    // ── Decorative player ship ─────────────────────────────────────────────
    this.menuShip = this.add.sprite(W / 2, H * 0.42, 'player2').setDepth(5).setScale(1.5).setAngle(-90);
    // Gentle hover tween
    this.tweens.add({
      targets: this.menuShip,
      y: H * 0.42 - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.22, 'SPACE', {
      fontSize: '22px', color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#0033ff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, H * 0.32, 'SHOOTER', {
      fontSize: '22px', color: '#44aaff',
      fontFamily: 'monospace',
      stroke: '#000055', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    // ── High score ─────────────────────────────────────────────────────────
    const highScore = localStorage.getItem('spaceShooterHighScore') || 0;
    this.add.text(W / 2, H * 0.56, `HI-SCORE  ${highScore}`, {
      fontSize: '8px', color: '#ffdd44', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    // ── Blinking "Press Space" prompt ──────────────────────────────────────
    const prompt = this.add.text(W / 2, H * 0.68, 'PRESS SPACE TO START', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.15 },
      duration: 550,
      yoyo: true,
      repeat: -1
    });

    // ── Controls hint ──────────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.80, 'MOVE: ARROWS / WASD    SHOOT: SPACE', {
      fontSize: '5px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    // ── Decorative enemy ships drifting across ─────────────────────────────
    this.spawnMenuEnemies();

    // ── Start input ───────────────────────────────────────────────────────
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.on('pointerdown', () => this.startGame());
  }

  spawnMenuEnemies() {
    const W = this.scale.width;
    // Spawn a few decorative enemies that drift across the screen
    const positions = [
      { x: W * 0.15, y: 40, delay: 0    },
      { x: W * 0.50, y: 20, delay: 600  },
      { x: W * 0.80, y: 55, delay: 1200 },
    ];
    positions.forEach(({ x, y, delay }) => {
      this.time.delayedCall(delay, () => {
        const e = this.add.sprite(x, y, 'enemy1').setDepth(4).setAngle(270);
        e.play('enemy-fly');
        this.tweens.add({
          targets: e,
          y: y + this.scale.height + 40,
          duration: 3000,
          ease: 'Linear',
          onComplete: () => e.destroy()
        });
      });
    });
  }

  startGame() {
    // Prevent double-trigger
    if (this._starting) return;
    this._starting = true;
    this.cameras.main.fade(300, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) this.scene.start('GameScene');
    });
  }

  update() {
    this.bgBack.tilePositionY   += 0.25;
    this.bgPlanet.tilePositionY += 0.45;
    this.bgStars.tilePositionY  += 0.80;
  }
}
