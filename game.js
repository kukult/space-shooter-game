const config = {
  type: Phaser.AUTO,
  width: 272,
  height: 480,
  zoom: 2,                    // renders at 544x960 for crisp pixel art
  backgroundColor: '#00000f',
  pixelArt: true,
  render: { antialias: false, antialiasGL: false, roundPixels: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [PreloadScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

new Phaser.Game(config);
