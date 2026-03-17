// ── Wave definitions ───────────────────────────────────────────────────────
// Each wave specifies how many enemies, their speed range, and movement pattern.
// After all 5 waves, the boss is triggered (no more looping in M3).
const WAVE_DEFS = [
  { count: 8,  minSpeed: 80,  maxSpeed: 130, pattern: 'straight' }, // Wave 1
  { count: 10, minSpeed: 95,  maxSpeed: 150, pattern: 'mixed'    }, // Wave 2
  { count: 12, minSpeed: 110, maxSpeed: 170, pattern: 'sine'     }, // Wave 3
  { count: 14, minSpeed: 125, maxSpeed: 190, pattern: 'mixed'    }, // Wave 4
  { count: 16, minSpeed: 140, maxSpeed: 210, pattern: 'dive'     }, // Wave 5 → boss
];

const MULT_THRESHOLDS = [
  { streak: 10, mult: 3, color: '#ff6644' },
  { streak: 5,  mult: 2, color: '#ffdd44' },
  { streak: 0,  mult: 1, color: '#ffffff' },
];

const DOUBLE_SHOT_DURATION = 10000; // ms

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Game state ─────────────────────────────────────────────────────────
    this.score        = 0;
    this.lives        = 3;
    this.isInvincible = false;
    this.isDead       = false;
    this.shotToggle = false;

    // Wave state machine
    this.waveIndex     = 0;
    this.waveState     = 'clearing';
    this.bossTriggered = false;

    // Score multiplier
    this.hitStreak  = 0;
    this.multiplier = 1;

    // Power-up state
    this.shieldActive    = false;
    this.doubleShot      = false;
    this.doubleShotTimer = 0;

    // Boss reference
    this.boss = null;

    // Pause state
    this.paused = false;

    // ── Parallax background ────────────────────────────────────────────────
    this.bgBack   = this.add.tileSprite(0, 0, W, H, 'bg-back').setOrigin(0, 0).setDepth(0);
    this.bgPlanet = this.add.tileSprite(0, 0, W, H, 'bg-planet').setOrigin(0, 0).setDepth(1);
    this.bgStars  = this.add.tileSprite(0, 0, W, H, 'bg-stars').setOrigin(0, 0).setDepth(2);

    // ── Physics groups ─────────────────────────────────────────────────────
    this.bullets   = this.physics.add.group();
    this.enemies   = this.physics.add.group();
    this.asteroids = this.physics.add.group();
    this.powerups  = this.physics.add.group();

    // ── Player ─────────────────────────────────────────────────────────────
    this.player = this.physics.add.sprite(W / 2, H - 40, 'player1').setDepth(5).setAngle(-90);
    this.player.play('player-fly');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(14, 10);
    this.player.body.allowRotation = false;

    // ── Input ───────────────────────────────────────────────────────────────
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.wasd     = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.lastFired = 0;

    // ── Collision ──────────────────────────────────────────────────────────
    this.physics.add.overlap(this.bullets,  this.enemies,   this.onBulletHitEnemy,    null, this);
    this.physics.add.overlap(this.bullets,  this.asteroids, this.onBulletHitAsteroid, null, this);
    this.physics.add.overlap(this.player,   this.enemies,   this.onEnemyHitPlayer,    null, this);
    this.physics.add.overlap(this.player,   this.asteroids, this.onAsteroidHitPlayer, null, this);
    this.physics.add.overlap(this.player,   this.powerups,  this.onPickupPowerup,     null, this);

    // ── Audio ──────────────────────────────────────────────────────────────
    this.sndShot1     = this.sound.add('snd-shot1',     { volume: 0.45 });
    this.sndShot2     = this.sound.add('snd-shot2',     { volume: 0.45 });
    this.sndExplosion = this.sound.add('snd-explosion', { volume: 0.50 });
    this.sndHit       = this.sound.add('snd-hit',       { volume: 0.55 });

    // ── HUD ────────────────────────────────────────────────────────────────
    this.setupHUD();

    // ── Pause menu ─────────────────────────────────────────────────────────
    this.setupPauseMenu();

    // ── Start first wave ───────────────────────────────────────────────────
    this.time.delayedCall(300, () => { if (!this.isDead) this.beginNextWave(); });

    // ── Asteroid spawner ───────────────────────────────────────────────────
    this.scheduleAsteroid();
  }

  // ── Wave System ──────────────────────────────────────────────────────────

  getWaveDef() {
    const idx  = this.waveIndex % WAVE_DEFS.length;
    const base = WAVE_DEFS[idx];
    return { count: base.count, minSpeed: base.minSpeed, maxSpeed: base.maxSpeed, pattern: base.pattern };
  }

  beginNextWave() {
    const def     = this.getWaveDef();
    const waveNum = this.waveIndex + 1;
    this.waveState = 'spawning';

    this.showWaveBanner(`WAVE ${waveNum}`);

    const W    = this.scale.width;
    const step = W / (def.count + 1);

    for (let i = 0; i < def.count; i++) {
      this.time.delayedCall(i * 160, () => {
        if (this.isDead || this.bossTriggered) return;
        const x       = step * (i + 1) + Phaser.Math.Between(-8, 8);
        const pattern = this.resolvePattern(def.pattern);
        this.spawnEnemy(x, -20, def.minSpeed, def.maxSpeed, pattern);
      });
    }

    this.time.delayedCall(def.count * 160 + 200, () => {
      if (!this.isDead && !this.bossTriggered) this.waveState = 'fighting';
    });
  }

  resolvePattern(pattern) {
    if (pattern === 'mixed') return Math.random() < 0.5 ? 'straight' : 'sine';
    return pattern;
  }

  spawnEnemy(x, y, minSpeed, maxSpeed, pattern) {
    const enemy = this.enemies.create(x, y, 'enemy1').setDepth(4).setAngle(270);
    enemy.play('enemy-fly');
    enemy.body.setSize(22, 22);

    enemy.pattern    = pattern;
    enemy.startX     = x;
    enemy.sineOffset = Math.random() * Math.PI * 2;

    const speed = Phaser.Math.Between(minSpeed, maxSpeed);

    if (pattern === 'straight' || pattern === 'sine') {
      enemy.setVelocityY(speed);
    } else if (pattern === 'dive') {
      enemy.diveSpeed = speed * 2.2;
      enemy.divePhase = 1;
      enemy.setVelocityY(speed * 0.6);
    }

    return enemy;
  }

  // ── Boss ─────────────────────────────────────────────────────────────────

  startBoss() {
    this.waveState = 'boss';
    this.bossTriggered = true;
    this.showWaveBanner('!! BOSS INCOMING !!');

    this.time.delayedCall(300, () => {
      if (this.isDead) return;
      this.boss = new Boss(this);
      // Wire collision: player bullets → boss, boss bullets → player
      this.physics.add.overlap(this.bullets, this.boss.sprite, this.onBulletHitBoss, null, this);
      this.physics.add.overlap(this.player,  this.boss.bullets, this.onBossBulletHitPlayer, null, this);
    });
  }

  onBulletHitBoss(a, b) {
    if (!this.boss || this.boss.dead || !this.boss.active) return;
    // Phaser 3 passes (groupMember, sprite) OR (sprite, groupMember) depending on version —
    // detect which argument is the boss sprite and treat the other as the bullet.
    const bullet = (a === this.boss.sprite) ? b : a;
    if (!bullet || !bullet.active) return;
    bullet.destroy();
    this.boss.takeDamage();
  }

  onBossBulletHitPlayer(a, b) {
    if (this.isInvincible || this.isDead) return;
    // Same arg-order ambiguity: detect which is the player sprite
    const bullet = (a === this.player) ? b : a;
    if (!bullet || !bullet.active) return;
    bullet.destroy();
    this.takeDamage(this.player, this.player.x, this.player.y);
  }

  onBossDefeated() {
    if (this.isDead) return;
    this.isDead = true;

    this.time.delayedCall(2000, () => {
      this.scene.start('VictoryScene', { score: this.score });
    });
  }

  // ── Asteroid Spawning ────────────────────────────────────────────────────

  scheduleAsteroid() {
    const delay = Phaser.Math.Between(2200, 4500);
    this.time.delayedCall(delay, () => {
      if (!this.isDead) {
        this.spawnAsteroid();
        this.scheduleAsteroid();
      }
    });
  }

  spawnAsteroid(x = null, y = null, large = null) {
    const W       = this.scale.width;
    const isLarge = large !== null ? large : Math.random() < 0.65;
    const key     = isLarge ? 'asteroid' : 'asteroid-small';
    const spawnX  = x !== null ? x : Phaser.Math.Between(20, W - 20);
    const spawnY  = y !== null ? y : -20;

    const ast = this.asteroids.create(spawnX, spawnY, key).setDepth(3);
    ast.isLarge = isLarge;
    ast.setAngularVelocity(Phaser.Math.Between(-60, 60));
    ast.setVelocityY(Phaser.Math.Between(isLarge ? 40 : 60, isLarge ? 75 : 110));
    ast.setVelocityX(Phaser.Math.Between(-20, 20));

    if (isLarge) {
      ast.body.setSize(28, 28);
    } else {
      ast.body.setSize(11, 11);
    }
  }

  // ── Power-ups ────────────────────────────────────────────────────────────

  spawnPowerup(x, y) {
    const type = Math.random() < 0.5 ? 'powerup-shield' : 'powerup-double';
    const pu   = this.powerups.create(x, y, type).setDepth(5);
    pu.puType  = type;
    pu.setVelocityY(45);
    pu.body.setSize(11, 11);

    // Auto-destroy if not picked up
    this.time.delayedCall(8000, () => { if (pu.active) pu.destroy(); });
  }

  onPickupPowerup(player, powerup) {
    const type = powerup.puType;
    powerup.destroy();

    if (type === 'powerup-shield') {
      this.shieldActive = true;
      player.setTint(0x00ccff);
    } else {
      this.doubleShot      = true;
      this.doubleShotTimer = DOUBLE_SHOT_DURATION;
    }
    this.updateHUD();
  }

  // ── Shooting ──────────────────────────────────────────────────────────────

  spawnBullet(x, y) {
    const b = this.bullets.create(x, y, 'shoot1').setDepth(4).setAngle(-90);
    b.play('bullet-fly');
    b.setVelocityY(-320);
    b.body.setSize(4, 12);
  }

  fireBullet() {
    if (this.doubleShot) {
      this.spawnBullet(this.player.x - 5, this.player.y - 14);
      this.spawnBullet(this.player.x + 5, this.player.y - 14);
    } else {
      this.spawnBullet(this.player.x, this.player.y - 14);
    }

    const flash = this.add.image(this.player.x, this.player.y - 18, 'flash').setDepth(6);
    this.tweens.add({
      targets: flash, alpha: 0, scaleX: 1.4, scaleY: 1.8,
      duration: 65, onComplete: () => flash.destroy()
    });

    this.shotToggle = !this.shotToggle;
    (this.shotToggle ? this.sndShot1 : this.sndShot2).play();
  }

  // ── Collision Callbacks ───────────────────────────────────────────────────

  onBulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    if (this.boss && enemy === this.boss.sprite) return;
    const x = enemy.x, y = enemy.y;
    bullet.destroy();
    enemy.destroy();

    this.spawnExplosion(x, y);
    this.sndExplosion.play();

    this.incrementStreak();
    const pts = 100 * this.multiplier;
    this.score += pts;
    this.updateHUD();
    this.showScorePopup(x, y, pts);

    // 25% chance to drop a power-up
    if (Math.random() < 0.25) this.spawnPowerup(x, y);
  }

  onBulletHitAsteroid(bullet, asteroid) {
    if (!bullet.active || !asteroid.active) return;
    const x = asteroid.x, y = asteroid.y;
    const wasLarge = asteroid.isLarge;

    bullet.destroy();
    asteroid.destroy();

    this.incrementStreak();

    if (wasLarge) {
      const speed = Phaser.Math.Between(70, 100);
      const base  = Math.PI / 2;
      const spread = 0.55;
      [-1, 1].forEach(dir => {
        const angle = base + dir * spread;
        this.spawnAsteroid(x, y, false);
        const kids = this.asteroids.getChildren();
        const kid  = kids[kids.length - 1];
        if (kid) kid.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      });
      this.spawnHitEffect(x, y);
      this.cameras.main.shake(60, 0.003);
    } else {
      this.spawnExplosion(x, y);
      this.sndExplosion.play();
    }

    const pts = 50 * this.multiplier;
    this.score += pts;
    this.updateHUD();
    this.showScorePopup(x, y, pts);
  }

  onEnemyHitPlayer(player, enemy) {
    if (this.isInvincible || this.isDead) return;
    const x = enemy.x, y = enemy.y;
    enemy.destroy();
    this.takeDamage(player, x, y);
  }

  onAsteroidHitPlayer(player, asteroid) {
    if (this.isInvincible || this.isDead) return;
    const x = asteroid.x, y = asteroid.y;
    asteroid.destroy();
    this.takeDamage(player, x, y);
  }

  takeDamage(player, hitX, hitY) {
    // Shield absorbs one hit
    if (this.shieldActive) {
      this.shieldActive = false;
      player.clearTint();
      this.spawnHitEffect(hitX, hitY);
      this.cameras.main.shake(80, 0.004);
      this.updateHUD();
      return;
    }

    this.spawnHitEffect(hitX, hitY);
    this.sndHit.play();
    this.cameras.main.shake(110, 0.006);

    this.hitStreak  = 0;
    this.multiplier = 1;

    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    this.isInvincible = true;
    this.tweens.add({
      targets: player,
      alpha: { from: 1, to: 0.25 },
      duration: 110,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        player.setAlpha(1);
        this.isInvincible = false;
        // Re-apply shield tint if still active after invincibility
        if (this.shieldActive) player.setTint(0x00ccff);
      }
    });
  }

  // ── Multiplier ────────────────────────────────────────────────────────────

  incrementStreak() {
    this.hitStreak++;
    const prev = this.multiplier;
    for (const tier of MULT_THRESHOLDS) {
      if (this.hitStreak >= tier.streak) { this.multiplier = tier.mult; break; }
    }
    if (this.multiplier > prev) this.flashMultiplier();
    this.updateHUD();
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  spawnExplosion(x, y) {
    const exp = this.add.sprite(x, y, 'explosion1').setDepth(7);
    exp.play('explode');
    exp.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => exp.destroy());
  }

  spawnHitEffect(x, y) {
    const hit = this.add.sprite(x, y, 'hit1').setDepth(7);
    hit.play('hit-effect');
    hit.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => hit.destroy());
  }

  showScorePopup(x, y, pts) {
    const txt = this.add.text(x, y, `+${pts}`, {
      fontSize: '6px',
      color: this.multiplier > 1 ? '#ffdd44' : '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: txt, y: y - 22, alpha: 0, duration: 700,
      ease: 'Sine.easeOut', onComplete: () => txt.destroy()
    });
  }

  showWaveBanner(message) {
    const W = this.scale.width;
    const H = this.scale.height;
    const txt = this.add.text(W / 2, H / 2 - 18, message, {
      fontSize: '12px', color: '#ffaa00',
      fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(15).setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 1, duration: 250,
      yoyo: true, hold: 900,
      onComplete: () => txt.destroy()
    });
  }

  flashMultiplier() {
    this.tweens.add({
      targets: this.multText,
      scaleX: 1.6, scaleY: 1.6,
      duration: 140,
      yoyo: true
    });
  }

  // ── Game Over / Victory ───────────────────────────────────────────────────

  triggerGameOver() {
    this.isDead = true;
    this.spawnExplosion(this.player.x, this.player.y);
    this.sndExplosion.play();
    this.player.setVisible(false);

    this.time.delayedCall(1600, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  setupHUD() {
    const W = this.scale.width;
    const D = 20;

    this.scoreText = this.add.text(6, 4, 'SCORE  0', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace'
    }).setDepth(D);

    this.multText = this.add.text(6, 14, '', {
      fontSize: '7px', fontFamily: 'monospace'
    }).setDepth(D);

    // Power-up indicators
    this.shieldText = this.add.text(6, 23, '', {
      fontSize: '6px', color: '#00eeff', fontFamily: 'monospace'
    }).setDepth(D);

    this.doubleShotText = this.add.text(6, 31, '', {
      fontSize: '6px', color: '#ffee00', fontFamily: 'monospace'
    }).setDepth(D);

    // Life icons
    this.lifeIcons = [];
    for (let i = 0; i < 3; i++) {
      const icon = this.add.image(W - 8 - i * 14, 7, 'player2')
        .setScale(0.7).setAngle(-90).setDepth(D);
      this.lifeIcons.push(icon);
    }

    this.updateHUD();
  }

  updateHUD() {
    this.scoreText.setText(`SCORE  ${this.score}`);

    if (this.multiplier > 1) {
      const tier = MULT_THRESHOLDS.find(t => t.mult === this.multiplier);
      this.multText.setText(`x${this.multiplier} COMBO`).setColor(tier.color);
    } else {
      this.multText.setText('');
    }

    this.shieldText.setText(this.shieldActive ? 'SHD' : '');
    this.doubleShotText.setText(this.doubleShot ? '2x' : '');

    this.lifeIcons.forEach((icon, i) => {
      icon.setAlpha(i < this.lives ? 1 : 0.15);
    });
  }

  // ── Pause Menu ────────────────────────────────────────────────────────────

  setupPauseMenu() {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay   = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);
    const title     = this.add.text(W / 2, H * 0.34, 'PAUSED', {
      fontSize: '16px', color: '#ffffff',
      fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(W / 2, H * 0.50, '[ RESUME ]', {
      fontSize: '9px', color: '#44ff88', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover',  () => resumeBtn.setColor('#aaffcc'));
    resumeBtn.on('pointerout',   () => resumeBtn.setColor('#44ff88'));
    resumeBtn.on('pointerdown',  () => this.togglePause());

    const quitBtn = this.add.text(W / 2, H * 0.62, '[ QUIT TO MENU ]', {
      fontSize: '9px', color: '#aaaaff', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover',  () => quitBtn.setColor('#ddddff'));
    quitBtn.on('pointerout',   () => quitBtn.setColor('#aaaaff'));
    quitBtn.on('pointerdown',  () => {
      this.paused = false;
      this.physics.resume();
      this.time.paused = false;
      this.scene.start('MenuScene');
    });

    const hint = this.add.text(W / 2, H * 0.74, 'ESC = resume', {
      fontSize: '5px', color: '#555555', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.pauseContainer = this.add.container(0, 0, [overlay, title, resumeBtn, quitBtn, hint])
      .setDepth(50).setVisible(false);
  }

  togglePause() {
    if (this.isDead) return;
    this.paused = !this.paused;

    if (this.paused) {
      this.physics.pause();
      this.time.paused = true;
      this.pauseContainer.setVisible(true);
    } else {
      this.physics.resume();
      this.time.paused = false;
      this.pauseContainer.setVisible(false);
    }
  }

  // ── Update Loop ───────────────────────────────────────────────────────────

  update(time, delta) {
    // ESC / pause always checked first
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }

    if (this.isDead || this.paused) return;

    // ── Parallax scroll ────────────────────────────────────────────────────
    this.bgBack.tilePositionY   += 0.25;
    this.bgPlanet.tilePositionY += 0.45;
    this.bgStars.tilePositionY  += 0.80;

    // ── Player movement ────────────────────────────────────────────────────
    const speed = 130;
    const vx = (this.cursors.left.isDown  || this.wasd.left.isDown)  ? -speed
             : (this.cursors.right.isDown || this.wasd.right.isDown) ?  speed : 0;
    const vy = (this.cursors.up.isDown    || this.wasd.up.isDown)    ? -speed
             : (this.cursors.down.isDown  || this.wasd.down.isDown)  ?  speed : 0;
    this.player.setVelocity(vx, vy);

    // ── Shoot ──────────────────────────────────────────────────────────────
    const fireRate = this.doubleShot ? 160 : 220;
    if (this.spaceKey.isDown && time - this.lastFired > fireRate) {
      this.fireBullet();
      this.lastFired = time;
    }

    // ── Double-shot timer ──────────────────────────────────────────────────
    if (this.doubleShot) {
      this.doubleShotTimer -= delta;
      if (this.doubleShotTimer <= 0) {
        this.doubleShot = false;
        this.updateHUD();
      }
    }

    // ── Enemy movement patterns ────────────────────────────────────────────
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;

      if (enemy.pattern === 'sine') {
        enemy.x = enemy.startX + Math.sin(time * 0.002 + enemy.sineOffset) * 38;
        enemy.x = Phaser.Math.Clamp(enemy.x, 10, this.scale.width - 10);
      }

      if (enemy.pattern === 'dive' && enemy.divePhase === 1) {
        if (enemy.y > this.scale.height * 0.3) {
          enemy.divePhase = 2;
          const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y, this.player.x, this.player.y
          );
          enemy.setVelocity(
            Math.cos(angle) * enemy.diveSpeed,
            Math.sin(angle) * enemy.diveSpeed
          );
        }
      }
    });

    // ── Boss update ────────────────────────────────────────────────────────
    if (this.boss) {
      this.boss.update(time, delta, this);
    }

    // ── Wave state machine ─────────────────────────────────────────────────
    if (!this.bossTriggered &&
        this.waveState === 'fighting' &&
        this.enemies.getLength() === 0) {

      this.waveState = 'clearing';
      this.time.delayedCall(600, () => {
        if (this.isDead) return;
        this.waveIndex++;

        if (this.waveIndex >= WAVE_DEFS.length) {
          this.startBoss();
        } else {
          this.beginNextWave();
        }
      });
    }

    // ── Cleanup off-screen objects ─────────────────────────────────────────
    const H = this.scale.height;
    const W = this.scale.width;

    this.bullets.getChildren().forEach(b => {
      if (b.active && (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20)) b.destroy();
    });
    this.enemies.getChildren().forEach(e => {
      if (e.active && (e.y > H + 40 || e.y < -40 || e.x < -40 || e.x > W + 40)) e.destroy();
    });
    this.asteroids.getChildren().forEach(a => {
      if (a.active && (a.y > H + 40 || a.x < -40 || a.x > W + 40)) a.destroy();
    });
    this.powerups.getChildren().forEach(p => {
      if (p.active && p.y > H + 20) p.destroy();
    });
  }
}
