class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data) {
    const W     = this.scale.width;
    const H     = this.scale.height;
    const score = data?.score ?? 0;

    // ── Persist high score ─────────────────────────────────────────────────
    const prev      = parseInt(localStorage.getItem('spaceShooterHighScore') || '0', 10);
    const isNewBest = score > prev;
    if (isNewBest) localStorage.setItem('spaceShooterHighScore', score);
    const highScore = isNewBest ? score : prev;

    // ── Scrolling background ───────────────────────────────────────────────
    this.bgBack   = this.add.tileSprite(0, 0, W, H, 'bg-back').setOrigin(0, 0).setDepth(0);
    this.bgPlanet = this.add.tileSprite(0, 0, W, H, 'bg-planet').setOrigin(0, 0).setDepth(1);
    this.bgStars  = this.add.tileSprite(0, 0, W, H, 'bg-stars').setOrigin(0, 0).setDepth(2);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(5);

    // ── Title ──────────────────────────────────────────────────────────────
    const title = this.add.text(W / 2, H * 0.17, 'YOU WIN!', {
      fontSize: '22px', color: '#ffdd44',
      fontFamily: 'monospace',
      stroke: '#ff8800', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: title, scaleX: 1.08, scaleY: 1.08,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(W / 2, H * 0.30, 'BOSS DEFEATED', {
      fontSize: '8px', color: '#aaffaa', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    // ── Score ──────────────────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.42, `SCORE  ${score}`, {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    // ── High score ─────────────────────────────────────────────────────────
    const hiColor = isNewBest ? '#ffdd44' : '#888888';
    const hiLabel = isNewBest ? `NEW BEST!  ${highScore}` : `HI-SCORE  ${highScore}`;
    const hiText  = this.add.text(W / 2, H * 0.52, hiLabel, {
      fontSize: '8px', color: hiColor, fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    if (isNewBest) {
      this.tweens.add({
        targets: hiText, alpha: { from: 1, to: 0.3 },
        duration: 400, yoyo: true, repeat: -1
      });
    }

    // ── Play again button ──────────────────────────────────────────────────
    const btn = this.add.text(W / 2, H * 0.66, '[ PLAY AGAIN ]', {
      fontSize: '9px', color: '#44ff88',
      fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#aaffcc'));
    btn.on('pointerout',   () => btn.setColor('#44ff88'));
    btn.on('pointerdown',  () => this.goTo('GameScene'));

    this.tweens.add({
      targets: btn, alpha: { from: 1, to: 0.4 },
      duration: 600, yoyo: true, repeat: -1
    });

    // ── Menu button ────────────────────────────────────────────────────────
    const menuBtn = this.add.text(W / 2, H * 0.76, '[ MAIN MENU ]', {
      fontSize: '9px', color: '#aaaaff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover',  () => menuBtn.setColor('#ddddff'));
    menuBtn.on('pointerout',   () => menuBtn.setColor('#aaaaff'));
    menuBtn.on('pointerdown',  () => this.goTo('MenuScene'));

    // ── Keyboard shortcuts ─────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.87, 'SPACE = play again    ESC = menu', {
      fontSize: '5px', color: '#555555', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    this.input.keyboard.once('keydown-SPACE', () => this.goTo('GameScene'));
    this.input.keyboard.once('keydown-ESC',   () => this.goTo('MenuScene'));
  }

  goTo(sceneKey) {
    if (this._leaving) return;
    this._leaving = true;
    this.cameras.main.fade(250, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) this.scene.start(sceneKey);
    });
  }

  update() {
    this.bgBack.tilePositionY   += 0.25;
    this.bgPlanet.tilePositionY += 0.45;
    this.bgStars.tilePositionY  += 0.80;
  }
}
