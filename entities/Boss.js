// ── Boss ──────────────────────────────────────────────────────────────────────
//
//  3 phases, 45 HP (15 HP per phase)
//
//  Phase 1 "PATROL"  (45 → 31 HP)
//    • Slow side-to-side sweep
//    • 3-shot spread  every 1.8 s
//    • Single aimed shot at player  every 2.8 s
//
//  Phase 2 "ASSAULT"  (30 → 16 HP)
//    • Faster sweep
//    • 5-shot spread  every 2.2 s
//    • 8-bullet ring burst  every 4 s
//    • Sweeping laser beam (active all phase)
//    • Spawns 2 dive-bomb minions  every 10 s
//
//  Phase 3 "RAGE"  (15 → 0 HP)
//    • Diagonal bounce movement (erratic, unpredictable)
//    • Triple aimed shot burst  every 1.2 s
//    • 12-bullet spiral  every 3.5 s  (angle rotates each volley)
//    • Faster laser (phase 2 laser + rage speed)
//    • Boss sprite tinted red

class Boss {
  constructor(scene) {
    this.scene  = scene;
    this.maxHP  = 45;
    this.hp     = 45;
    this.phase  = 1;
    this.active = false;
    this.dead   = false;

    const W = scene.scale.width;

    // ── Sprite ────────────────────────────────────────────────────────────────
    this.sprite = scene.physics.add.sprite(W / 2, -100, 'enemy-sheet')
      .setDepth(4).setScale(3.5).setAngle(270);
    this.sprite.play('boss-fly');
    this.sprite.body.setSize(24, 24);

    // ── Boss-bullet group ─────────────────────────────────────────────────────
    this.bullets = scene.physics.add.group();

    // ── Health bar ────────────────────────────────────────────────────────────
    this._setupHealthBar(W);

    // ── Attack timers (managed as array for clean phase resets) ───────────────
    this.attackTimers = [];

    // ── Hit cooldown ─────────────────────────────────────────────────────────
    this.canTakeDamage = true;

    // ── Phase 1 / 2 side-to-side ──────────────────────────────────────────────
    this.moveDir   = 1;
    this.moveSpeed = 40;
    this.targetY   = 112;

    // ── Phase 3 diagonal bounce ───────────────────────────────────────────────
    this.bounceVX = 0;
    this.bounceVY = 0;

    // ── Laser (phase 2+) ─────────────────────────────────────────────────────
    this.laser      = null;
    this.laserAngle = 0;
    this.laserDir   = 1;

    // ── Spiral state (phase 3) ────────────────────────────────────────────────
    this.spiralAngle = 0;

    // ── Fly-in ────────────────────────────────────────────────────────────────
    scene.tweens.add({
      targets:  this.sprite,
      y:        this.targetY,
      duration: 900,
      ease:     'Sine.easeOut',
      onComplete: () => {
        scene.bullets.clear(true, true);
        this.active = true;
        this._startPhase1(scene);
      }
    });
  }

  // ── Health Bar ────────────────────────────────────────────────────────────────

  _setupHealthBar(W) {
    const D = 25;
    this.hpBarBg = this.scene.add.rectangle(W / 2, 3, 122, 10, 0x220000)
      .setDepth(D).setOrigin(0.5, 0);
    this.hpBar = this.scene.add.rectangle(W / 2 - 59, 4, 118, 7, 0xff2222)
      .setDepth(D + 1).setOrigin(0, 0);
    this.hpLabel = this.scene.add.text(W / 2, 14, 'BOSS', {
      fontSize: '5px', color: '#ff8888', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(D + 1);
  }

  _updateHealthBar() {
    const ratio = Math.max(0, this.hp / this.maxHP);
    this.hpBar.setSize(118 * ratio, 7);
    // red → orange → yellow as HP falls
    const col = ratio > 0.66 ? 0xff2222 : ratio > 0.33 ? 0xff8800 : 0xffee00;
    this.hpBar.setFillStyle(col);
  }

  // ── Phase starts ──────────────────────────────────────────────────────────────

  _startPhase1(scene) {
    this._addTimer(scene, 1800, () => this._fireSpread(3, 22));
    this._addTimer(scene, 2800, () => this._fireAimed(1));
  }

  _enterPhase2() {
    const scene = this.scene;
    this.phase      = 2;
    this.moveSpeed  = 68;

    this._clearTimers();
    this._addTimer(scene, 2200, () => this._fireSpread(5, 18));
    this._addTimer(scene, 4000, () => this._fireRing(8));
    this._addTimer(scene, 10000, () => this._spawnMinions());

    // Laser on
    this.laser = scene.add.graphics().setDepth(6);

    scene.showWaveBanner('PHASE 2 — ASSAULT');
    scene.cameras.main.shake(320, 0.015);
    this._screenFlash(0xff4400);
  }

  _enterPhase3() {
    const scene = this.scene;
    this.phase = 3;

    // Switch to diagonal bounce — randomise initial direction
    this.moveSpeed = 0;
    this.bounceVX  = 95 * (Math.random() < 0.5 ? 1 : -1);
    this.bounceVY  = 55 * (Math.random() < 0.5 ? 1 : -1);

    this._clearTimers();
    this._addTimer(scene, 1200, () => this._fireAimed(3));
    this._addTimer(scene, 3500, () => this._fireSpiral(12));

    // Laser stays on, just gets faster (handled in _updateLaser via phase check)
    if (!this.laser) this.laser = scene.add.graphics().setDepth(6);

    // Red tint = rage
    this.sprite.setTint(0xff4422);

    scene.showWaveBanner('!! RAGE !!');
    scene.cameras.main.shake(460, 0.022);
    this._screenFlash(0xff0000);
  }

  // ── Attacks ───────────────────────────────────────────────────────────────────

  // count bullets fanned evenly around straight-down (90°)
  _fireSpread(count, spacing) {
    if (this.dead) return;
    const half = Math.floor(count / 2);
    for (let i = -half; i <= half; i++) {
      const rad = Phaser.Math.DegToRad(90 + i * spacing);
      const b   = this.bullets.create(this.sprite.x, this.sprite.y + 26, 'boss-bullet').setDepth(5);
      b.setVelocity(Math.cos(rad) * 145, Math.sin(rad) * 145);
    }
  }

  // count aimed shots fanned ±15° around the player's position
  _fireAimed(count) {
    if (this.dead) return;
    const scene     = this.scene;
    const baseAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, scene.player.x, scene.player.y
    );
    const speed  = this.phase >= 3 ? 180 : 148;
    const spread = 15;
    const half   = Math.floor(count / 2);
    for (let i = -half; i <= half; i++) {
      const rad = baseAngle + Phaser.Math.DegToRad(i * spread);
      const b   = this.bullets.create(this.sprite.x, this.sprite.y + 26, 'boss-bullet').setDepth(5);
      b.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);
    }
  }

  // 360° ring — every bullet evenly spaced
  _fireRing(count) {
    if (this.dead) return;
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const rad = Phaser.Math.DegToRad(i * step);
      const b   = this.bullets.create(this.sprite.x, this.sprite.y + 26, 'boss-bullet').setDepth(5);
      b.setVelocity(Math.cos(rad) * 118, Math.sin(rad) * 118);
    }
    this.scene.cameras.main.shake(100, 0.006);
  }

  // Full-circle burst with rotating starting angle
  _fireSpiral(count) {
    if (this.dead) return;
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const rad = Phaser.Math.DegToRad(this.spiralAngle + i * step);
      const b   = this.bullets.create(this.sprite.x, this.sprite.y + 26, 'boss-bullet').setDepth(5);
      b.setVelocity(Math.cos(rad) * 138, Math.sin(rad) * 138);
    }
    this.spiralAngle = (this.spiralAngle + 30) % 360;
    this.scene.cameras.main.shake(120, 0.009);
  }

  // Two dive-bomb enemies drop from the top
  _spawnMinions() {
    if (this.dead) return;
    const scene = this.scene;
    const W     = scene.scale.width;
    for (let i = 0; i < 2; i++) {
      scene.time.delayedCall(i * 350, () => {
        if (!this.dead) {
          scene.spawnEnemy(Phaser.Math.Between(30, W - 30), -20, 120, 165, 'dive');
        }
      });
    }
  }

  // ── Take a hit ────────────────────────────────────────────────────────────────

  takeDamage() {
    if (this.dead || !this.canTakeDamage) return;

    this.canTakeDamage = false;
    this.scene.time.delayedCall(110, () => { this.canTakeDamage = true; });

    this.hp--;
    this._updateHealthBar();

    // White flash — restore red tint if in rage
    const rageTint = this.phase === 3;
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(75, () => {
      if (this.sprite && this.sprite.active) {
        rageTint ? this.sprite.setTint(0xff4422) : this.sprite.clearTint();
      }
    });

    this.scene.cameras.main.shake(65, 0.004);
    this.scene.incrementStreak();
    const pts = 50 * this.scene.multiplier;
    this.scene.score += pts;
    this.scene.updateHUD();
    this.scene.showScorePopup(this.sprite.x, this.sprite.y - 22, pts);

    if (this.hp <= 30 && this.phase === 1) this._enterPhase2();
    if (this.hp <= 15 && this.phase === 2) this._enterPhase3();
    if (this.hp <= 0)                      this._explode();
  }

  // ── Sweeping laser ────────────────────────────────────────────────────────────

  _updateLaser(delta, scene) {
    const sweepSpeed = this.phase >= 3 ? 85 : 52;
    this.laserAngle += this.laserDir * sweepSpeed * (delta / 1000);
    if (this.laserAngle >  46) this.laserDir = -1;
    if (this.laserAngle < -46) this.laserDir =  1;

    const bx  = this.sprite.x;
    const by  = this.sprite.y + 26;
    const len = scene.scale.height * 1.2;
    const rad = Phaser.Math.DegToRad(90 + this.laserAngle);
    const ex  = bx + Math.cos(rad) * len;
    const ey  = by + Math.sin(rad) * len;

    const coreCol = this.phase >= 3 ? 0xff3300 : 0xffaa00;
    this.laser.clear();
    this.laser.lineStyle(10, coreCol, 0.18);
    this.laser.lineBetween(bx, by, ex, ey);
    this.laser.lineStyle(3,  coreCol, 0.92);
    this.laser.lineBetween(bx, by, ex, ey);

    // Point-to-line-segment hit detection
    if (!scene.isInvincible && !scene.isDead) {
      const px  = scene.player.x, py = scene.player.y;
      const lx  = ex - bx, ly = ey - by;
      const t   = Math.max(0, Math.min(1, ((px - bx) * lx + (py - by) * ly) / (lx * lx + ly * ly)));
      const dist = Math.hypot(px - (bx + t * lx), py - (by + t * ly));
      if (dist < 10) scene.takeDamage(scene.player, px, py);
    }
  }

  // ── Timer helpers ─────────────────────────────────────────────────────────────

  _addTimer(scene, delay, cb) {
    const t = scene.time.addEvent({ delay, callback: () => { if (!this.dead) cb(); }, loop: true });
    this.attackTimers.push(t);
  }

  _clearTimers() {
    this.attackTimers.forEach(t => t.destroy());
    this.attackTimers = [];
  }

  // ── Visual helpers ────────────────────────────────────────────────────────────

  _screenFlash(color) {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;
    const flash = scene.add.rectangle(W / 2, H / 2, W, H, color, 0.55).setDepth(30);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 480, onComplete: () => flash.destroy() });
  }

  // ── Main update ───────────────────────────────────────────────────────────────

  update(_time, delta, scene) {
    if (!this.active || this.dead) return;

    const W = scene.scale.width;
    const H = scene.scale.height;

    if (this.phase < 3) {
      // Side-to-side sweep
      this.sprite.x += this.moveDir * this.moveSpeed * (delta / 1000);
      if (this.sprite.x > W - 40) { this.sprite.x = W - 40; this.moveDir = -1; }
      if (this.sprite.x < 40)     { this.sprite.x = 40;     this.moveDir =  1; }
    } else {
      // Phase 3: diagonal bounce
      this.sprite.x += this.bounceVX * (delta / 1000);
      this.sprite.y += this.bounceVY * (delta / 1000);
      if (this.sprite.x > W - 36) { this.sprite.x = W - 36; this.bounceVX *= -1; }
      if (this.sprite.x < 36)     { this.sprite.x = 36;     this.bounceVX *= -1; }
      if (this.sprite.y > this.targetY + 55) { this.sprite.y = this.targetY + 55; this.bounceVY *= -1; }
      if (this.sprite.y < this.targetY - 28) { this.sprite.y = this.targetY - 28; this.bounceVY *= -1; }
    }

    // Laser active from phase 2 onward
    if (this.phase >= 2 && this.laser) {
      this._updateLaser(delta, scene);
    }

    // Cleanup off-screen boss bullets
    this.bullets.getChildren().forEach(b => {
      if (b.active && (b.y > H + 20 || b.x < -20 || b.x > W + 20)) b.destroy();
    });
  }

  // ── Death sequence ────────────────────────────────────────────────────────────

  _explode() {
    this.dead   = true;
    this.active = false;

    this._clearTimers();
    if (this.laser) { this.laser.destroy(); this.laser = null; }
    this.bullets.clear(true, true);
    // Sprite stays fully visible and animating throughout the death sequence

    const scene  = this.scene;
    const sx     = this.sprite.x;
    const sy     = this.sprite.y;
    const blasts = [
      { dx:   0, dy:   0, delay:    0 },
      { dx: -24, dy: -10, delay:  160 },
      { dx:  26, dy:   8, delay:  310 },
      { dx:  -8, dy:  22, delay:  460 },
      { dx:  18, dy: -22, delay:  610 },
      { dx: -16, dy:  14, delay:  760 },
      { dx:   8, dy:  -6, delay:  910 },
      { dx:   0, dy:   0, delay: 1060 },
    ];

    blasts.forEach(({ dx, dy, delay }) => {
      scene.time.delayedCall(delay, () => {
        scene.spawnExplosion(sx + dx, sy + dy);
        scene.sndExplosion.play();
        scene.cameras.main.shake(160, 0.014);
      });
    });

    scene.time.delayedCall(1700, () => {
      this.destroy();
      scene.onBossDefeated();
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  destroy() {
    this._clearTimers();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
    this.bullets.clear(true, true);
    if (this.laser)   { this.laser.destroy();   this.laser   = null; }
    if (this.hpBar)   { this.hpBar.destroy();   this.hpBar   = null; }
    if (this.hpBarBg) { this.hpBarBg.destroy(); this.hpBarBg = null; }
    if (this.hpLabel) { this.hpLabel.destroy(); this.hpLabel = null; }
  }
}
