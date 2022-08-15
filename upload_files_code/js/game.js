1 // Copyright (c) 2014 The Chromium Authors. All rights reserved.
2 // Use of this source code is governed by a BSD-style license that can be
3 // found in the LICENSE file.
4(function() {
    5 'use strict';
    6
    /**
   7      * T-Rex runner.
   8      * @param {string} outerContainerId Outer containing element id.
   9      * @param {Object} opt_config
  10      * @constructor
  11      * @export
  12      */
    13
    function Runner(outerContainerId, opt_config) {
        14 // Singleton
        15
        if (Runner.instance_) {
            16
            return Runner.instance_;
            17
        }
        18 Runner.instance_ = this;
        19
        20 this.outerContainerEl = document.querySelector(outerContainerId);
        21 this.containerEl = null;
        22 this.snackbarEl = null;
        23 this.detailsButton = this.outerContainerEl.querySelector('#details-button');
        24
        25 this.config = opt_config || Runner.config;
        26
        27 this.dimensions = Runner.defaultDimensions;
        28
        29 this.canvas = null;
        30 this.canvasCtx = null;
        31
        32 this.tRex = null;
        33
        34 this.distanceMeter = null;
        35 this.distanceRan = 0;
        36
        37 this.highestScore = 0;
        38
        39 this.time = 0;
        40 this.runningTime = 0;
        41 this.msPerFrame = 1000 / FPS;
        42 this.currentSpeed = this.config.SPEED;
        43
        44 this.obstacles = [];
        45
        46 this.started = false;
        47 this.activated = false;
        48 this.crashed = false;
        49 this.paused = false;
        50
        51 this.resizeTimerId_ = null;
        52
        53 this.playCount = 0;
        54
        55 // Sound FX.
        56 this.audioBuffer = null;
        57 this.soundFx = {};
        58
        59 // Global web audio context for playing sounds.
        60 this.audioContext = null;
        61
        62 // Images.
        63 this.images = {};
        64 this.imagesLoaded = 0;
        65
        66
        if (this.isDisabled()) {
            67 this.setupDisabledRunner();
            68
        } else {
            69 this.loadImages();
            70
        }
        71
    }
    72 window['Runner'] = Runner;
    73
    74
    75
    /**
  76      * Default game width.
  77      * @const
  78      */
    79
    var DEFAULT_WIDTH = 600;
    80
    81
    /**
  82      * Frames per second.
  83      * @const
  84      */
    85
    var FPS = 60;
    86
    87 /** @const */
    88
    var IS_HIDPI = window.devicePixelRatio > 1;
    89
    90 /** @const */
    91
    var IS_IOS = window.navigator.userAgent.indexOf('CriOS') > -1 ||
        92 window.navigator.userAgent == 'UIWebViewForStaticFileContent';
    93
    94 /** @const */
    95
    var IS_MOBILE = window.navigator.userAgent.indexOf('Mobi') > -1 || IS_IOS;
    96
    97 /** @const */
    98
    var IS_TOUCH_ENABLED = 'ontouchstart' in window;
    99
    100
    /**
 101      * Default game configuration.
 102      * @enum {number}
 103      */
    104 Runner.config = {
        105 ACCELERATION: 0.001,
        106 BG_CLOUD_SPEED: 0.2,
        107 BOTTOM_PAD: 10,
        108 CLEAR_TIME: 3000,
        109 CLOUD_FREQUENCY: 0.5,
        110 GAMEOVER_CLEAR_TIME: 750,
        111 GAP_COEFFICIENT: 0.6,
        112 GRAVITY: 0.6,
        113 INITIAL_JUMP_VELOCITY: 12,
        114 MAX_CLOUDS: 6,
        115 MAX_OBSTACLE_LENGTH: 3,
        116 MAX_OBSTACLE_DUPLICATION: 2,
        117 MAX_SPEED: 13,
        118 MIN_JUMP_HEIGHT: 35,
        119 MOBILE_SPEED_COEFFICIENT: 1.2,
        120 RESOURCE_TEMPLATE_ID: 'audio-resources',
        121 SPEED: 6,
        122 SPEED_DROP_COEFFICIENT: 3
        123
    };
    124
    125
    126
    /**
 127      * Default dimensions.
 128      * @enum {string}
 129      */
    130 Runner.defaultDimensions = {
        131 WIDTH: DEFAULT_WIDTH,
        132 HEIGHT: 150
        133
    };
    134
    135
    136
    /**
 137      * CSS class names.
 138      * @enum {string}
 139      */
    140 Runner.classes = {
        141 CANVAS: 'runner-canvas',
        142 CONTAINER: 'runner-container',
        143 CRASHED: 'crashed',
        144 ICON: 'icon-offline',
        145 SNACKBAR: 'snackbar',
        146 SNACKBAR_SHOW: 'snackbar-show',
        147 TOUCH_CONTROLLER: 'controller'
        148
    };
    149
    150
    151
    /**
 152      * Sprite definition layout of the spritesheet.
 153      * @enum {Object}
 154      */
    155 Runner.spriteDefinition = {
        156 LDPI: {
            157 CACTUS_LARGE: { x: 332, y: 2 },
            158 CACTUS_SMALL: { x: 228, y: 2 },
            159 CLOUD: { x: 86, y: 2 },
            160 HORIZON: { x: 2, y: 54 },
            161 PTERODACTYL: { x: 134, y: 2 },
            162 RESTART: { x: 2, y: 2 },
            163 TEXT_SPRITE: { x: 484, y: 2 },
            164 TREX: { x: 677, y: 2 }
            165
        },
        166 HDPI: {
            167 CACTUS_LARGE: { x: 652, y: 2 },
            168 CACTUS_SMALL: { x: 446, y: 2 },
            169 CLOUD: { x: 166, y: 2 },
            170 HORIZON: { x: 2, y: 104 },
            171 PTERODACTYL: { x: 260, y: 2 },
            172 RESTART: { x: 2, y: 2 },
            173 TEXT_SPRITE: { x: 954, y: 2 },
            174 TREX: { x: 1338, y: 2 }
            175
        }
        176
    };
    177
    178
    179
    /**
 180      * Sound FX. Reference to the ID of the audio tag on interstitial page.
 181      * @enum {string}
 182      */
    183 Runner.sounds = {
        184 BUTTON_PRESS: 'offline-sound-press',
        185 HIT: 'offline-sound-hit',
        186 SCORE: 'offline-sound-reached'
        187
    };
    188
    189
    190
    /**
 191      * Key code mapping.
 192      * @enum {Object}
 193      */
    194 Runner.keycodes = {
        195 JUMP: { '38': 1, '32': 1 }, // Up, spacebar
        196 DUCK: { '40': 1 }, // Down
        197 RESTART: { '13': 1 } // Enter
        198
    };
    199
    200
    201
    /**
 202      * Runner event names.
 203      * @enum {string}
 204      */
    205 Runner.events = {
        206 ANIM_END: 'webkitAnimationEnd',
        207 CLICK: 'click',
        208 KEYDOWN: 'keydown',
        209 KEYUP: 'keyup',
        210 MOUSEDOWN: 'mousedown',
        211 MOUSEUP: 'mouseup',
        212 RESIZE: 'resize',
        213 TOUCHEND: 'touchend',
        214 TOUCHSTART: 'touchstart',
        215 VISIBILITY: 'visibilitychange',
        216 BLUR: 'blur',
        217 FOCUS: 'focus',
        218 LOAD: 'load'
        219
    };
    220
    221
    222 Runner.prototype = {
        223
        /**
 224          * Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
 225          * @return {boolean}
 226          */
        227 isDisabled: function() {
            228
            return loadTimeData && loadTimeData.valueExists('disabledEasterEgg');
            229
        },
        230
        231
        /**
 232          * For disabled instances, set up a snackbar with the disabled message.
 233          */
        234 setupDisabledRunner: function() {
            235 this.containerEl = document.createElement('div');
            236 this.containerEl.className = Runner.classes.SNACKBAR;
            237 this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg');
            238 this.outerContainerEl.appendChild(this.containerEl);
            239
            240 // Show notification when the activation key is pressed.
            241 document.addEventListener(Runner.events.KEYDOWN, function(e) {
                242
                if (Runner.keycodes.JUMP[e.keyCode]) {
                    243 this.containerEl.classList.add(Runner.classes.SNACKBAR_SHOW);
                    244 document.querySelector('.icon').classList.add('icon-disabled');
                    245
                }
                246
            }.bind(this));
            247
        },
        248
        249
        /**
 250          * Setting individual settings for debugging.
 251          * @param {string} setting
 252          * @param {*} value
 253          */
        254 updateConfigSetting: function(setting, value) {
            255
            if (setting in this.config && value != undefined) {
                256 this.config[setting] = value;
                257
                258
                switch (setting) {
                    259
                    case 'GRAVITY':
                        260
                    case 'MIN_JUMP_HEIGHT':
                        261
                    case 'SPEED_DROP_COEFFICIENT':
                        262 this.tRex.config[setting] = value;
                        263
                        break;
                        264
                    case 'INITIAL_JUMP_VELOCITY':
                        265 this.tRex.setJumpVelocity(value);
                        266
                        break;
                        267
                    case 'SPEED':
                        268 this.setSpeed(value);
                        269
                        break;
                        270
                }
                271
            }
            272
        },
        273
        274
        /**
 275          * Cache the appropriate image sprite from the page and get the sprite sheet
 276          * definition.
 277          */
        278 loadImages: function() {
            279
            if (IS_HIDPI) {
                280 Runner.imageSprite = document.getElementById('offline-resources-2x');
                281 this.spriteDef = Runner.spriteDefinition.HDPI;
                282
            } else {
                283 Runner.imageSprite = document.getElementById('offline-resources-1x');
                284 this.spriteDef = Runner.spriteDefinition.LDPI;
                285
            }
            286
            287 this.init();
            288
        },
        289
        290
        /**
 291          * Load and decode base 64 encoded sounds.
 292          */
        293 loadSounds: function() {
            294
            if (!IS_IOS) {
                295 this.audioContext = new AudioContext();
                296
                297
                var resourceTemplate =
                    298 document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content;
                299
                300
                for (var sound in Runner.sounds) {
                    301
                    var soundSrc =
                        302 resourceTemplate.getElementById(Runner.sounds[sound]).src;
                    303 soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
                    304
                    var buffer = decodeBase64ToArrayBuffer(soundSrc);
                    305
                    306 // Async, so no guarantee of order in array.
                    307 this.audioContext.decodeAudioData(buffer, function(index, audioData) {
                        308 this.soundFx[index] = audioData;
                        309
                    }.bind(this, sound));
                    310
                }
                311
            }
            312
        },
        313
        314
        /**
 315          * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
 316          * @param {number} opt_speed
 317          */
        318 setSpeed: function(opt_speed) {
            319
            var speed = opt_speed || this.currentSpeed;
            320
            321 // Reduce the speed on smaller mobile screens.
            322
            if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
                323
                var mobileSpeed = speed * this.dimensions.WIDTH / DEFAULT_WIDTH *
                    324 this.config.MOBILE_SPEED_COEFFICIENT;
                325 this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
                326
            } else if (opt_speed) {
                327 this.currentSpeed = opt_speed;
                328
            }
            329
        },
        330
        331
        /**
 332          * Game initialiser.
 333          */
        334 init: function() {
            335 // Hide the static icon.
            336 document.querySelector('.' + Runner.classes.ICON).style.visibility =
                337 'hidden';
            338
            339 this.adjustDimensions();
            340 this.setSpeed();
            341
            342 this.containerEl = document.createElement('div');
            343 this.containerEl.className = Runner.classes.CONTAINER;
            344
            345 // Player canvas container.
            346 this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
                347 this.dimensions.HEIGHT, Runner.classes.PLAYER);
            348
            349 this.canvasCtx = this.canvas.getContext('2d');
            350 this.canvasCtx.fillStyle = '#f7f7f7';
            351 this.canvasCtx.fill();
            352 Runner.updateCanvasScaling(this.canvas);
            353
            354 // Horizon contains clouds, obstacles and the ground.
            355 this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions,
                356 this.config.GAP_COEFFICIENT);
            357
            358 // Distance meter
            359 this.distanceMeter = new DistanceMeter(this.canvas,
                360 this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH);
            361
            362 // Draw t-rex
            363 this.tRex = new Trex(this.canvas, this.spriteDef.TREX);
            364
            365 this.outerContainerEl.appendChild(this.containerEl);
            366
            367
            if (IS_MOBILE) {
                368 this.createTouchController();
                369
            }
            370
            371 this.startListening();
            372 this.update();
            373
            374 window.addEventListener(Runner.events.RESIZE,
                375 this.debounceResize.bind(this));
            376
        },
        377
        378
        /**
 379          * Create the touch controller. A div that covers whole screen.
 380          */
        381 createTouchController: function() {
            382 this.touchController = document.createElement('div');
            383 this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
            384
        },
        385
        386
        /**
 387          * Debounce the resize event.
 388          */
        389 debounceResize: function() {
            390
            if (!this.resizeTimerId_) {
                391 this.resizeTimerId_ =
                    392 setInterval(this.adjustDimensions.bind(this), 250);
                393
            }
            394
        },
        395
        396
        /**
 397          * Adjust game space dimensions on resize.
 398          */
        399 adjustDimensions: function() {
            400 clearInterval(this.resizeTimerId_);
            401 this.resizeTimerId_ = null;
            402
            403
            var boxStyles = window.getComputedStyle(this.outerContainerEl);
            404
            var padding = Number(boxStyles.paddingLeft.substr(0,
                405 boxStyles.paddingLeft.length - 2));
            406
            407 this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
            408
            409 // Redraw the elements back onto the canvas.
            410
            if (this.canvas) {
                411 this.canvas.width = this.dimensions.WIDTH;
                412 this.canvas.height = this.dimensions.HEIGHT;
                413
                414 Runner.updateCanvasScaling(this.canvas);
                415
                416 this.distanceMeter.calcXPos(this.dimensions.WIDTH);
                417 this.clearCanvas();
                418 this.horizon.update(0, 0, true);
                419 this.tRex.update(0);
                420
                421 // Outer container and distance meter.
                422
                if (this.activated || this.crashed) {
                    423 this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                    424 this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                    425 this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                    426 this.stop();
                    427
                } else {
                    428 this.tRex.draw(0, 0);
                    429
                }
                430
                431 // Game over panel.
                432
                if (this.crashed && this.gameOverPanel) {
                    433 this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
                    434 this.gameOverPanel.draw();
                    435
                }
                436
            }
            437
        },
        438
        439
        /**
 440          * Play the game intro.
 441          * Canvas container width expands out to the full width.
 442          */
        443 playIntro: function() {
            444
            if (!this.started && !this.crashed) {
                445 this.playingIntro = true;
                446 this.tRex.playingIntro = true;
                447
                448 // CSS animation definition.
                449
                var keyframes = '@-webkit-keyframes intro { ' +
                    450 'from { width:' + Trex.config.WIDTH + 'px }' +
                    451 'to { width: ' + this.dimensions.WIDTH + 'px }' +
                    452 '}';
                453 document.styleSheets[0].insertRule(keyframes, 0);
                454
                455 this.containerEl.addEventListener(Runner.events.ANIM_END,
                    456 this.startGame.bind(this));
                457
                458 this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
                459 this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                460
                461
                if (this.touchController) {
                    462 this.outerContainerEl.appendChild(this.touchController);
                    463
                }
                464 this.activated = true;
                465 this.started = true;
                466
            } else if (this.crashed) {
                467 this.restart();
                468
            }
            469
        },
        470
        471
        472
        /**
 473          * Update the game status to started.
 474          */
        475 startGame: function() {
            476 this.runningTime = 0;
            477 this.playingIntro = false;
            478 this.tRex.playingIntro = false;
            479 this.containerEl.style.webkitAnimation = '';
            480 this.playCount++;
            481
            482 // Handle tabbing off the page. Pause the current game.
            483 window.addEventListener(Runner.events.VISIBILITY,
                484 this.onVisibilityChange.bind(this));
            485
            486 window.addEventListener(Runner.events.BLUR,
                487 this.onVisibilityChange.bind(this));
            488
            489 window.addEventListener(Runner.events.FOCUS,
                490 this.onVisibilityChange.bind(this));
            491
        },
        492
        493 clearCanvas: function() {
            494 this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
                495 this.dimensions.HEIGHT);
            496
        },
        497
        498
        /**
 499          * Update the game frame.
 500          */
        501 update: function() {
            502 this.drawPending = false;
            503
            504
            var now = getTimeStamp();
            505
            var deltaTime = now - (this.time || now);
            506 this.time = now;
            507
            508
            if (this.activated) {
                509 this.clearCanvas();
                510
                511
                if (this.tRex.jumping) {
                    512 this.tRex.updateJump(deltaTime);
                    513
                }
                514
                515 this.runningTime += deltaTime;
                516
                var hasObstacles = this.runningTime > this.config.CLEAR_TIME;
                517
                518 // First jump triggers the intro.
                519
                if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                    520 this.playIntro();
                    521
                }
                522
                523 // The horizon doesn't move until the intro is over.
                524
                if (this.playingIntro) {
                    525 this.horizon.update(0, this.currentSpeed, hasObstacles);
                    526
                } else {
                    527 deltaTime = !this.started ? 0 : deltaTime;
                    528 this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);
                    529
                }
                530
                531 // Check for collisions.
                532
                var collision = hasObstacles &&
                    533 checkForCollision(this.horizon.obstacles[0], this.tRex);
                534
                535
                if (!collision) {
                    536 this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
                    537
                    538
                    if (this.currentSpeed < this.config.MAX_SPEED) {
                        539 this.currentSpeed += this.config.ACCELERATION;
                        540
                    }
                    541
                } else {
                    542 this.gameOver();
                    543
                }
                544
                545
                var playAcheivementSound = this.distanceMeter.update(deltaTime,
                    546 Math.ceil(this.distanceRan));
                547
                548
                if (playAcheivementSound) {
                    549 this.playSound(this.soundFx.SCORE);
                    550
                }
                551
            }
            552
            553
            if (!this.crashed) {
                554 this.tRex.update(deltaTime);
                555 this.raq();
                556
            }
            557
        },
        558
        559
        /**
 560          * Event handler.
 561          */
        562 handleEvent: function(e) {
            563
            return (function(evtType, events) {
                564
                switch (evtType) {
                    565
                    case events.KEYDOWN:
                        566
                    case events.TOUCHSTART:
                        567
                    case events.MOUSEDOWN:
                        568 this.onKeyDown(e);
                        569
                        break;
                        570
                    case events.KEYUP:
                        571
                    case events.TOUCHEND:
                        572
                    case events.MOUSEUP:
                        573 this.onKeyUp(e);
                        574
                        break;
                        575
                }
                576
            }.bind(this))(e.type, Runner.events);
            577
        },
        578
        579
        /**
 580          * Bind relevant key / mouse / touch listeners.
 581          */
        582 startListening: function() {
            583 // Keys.
            584 document.addEventListener(Runner.events.KEYDOWN, this);
            585 document.addEventListener(Runner.events.KEYUP, this);
            586
            587
            if (IS_MOBILE) {
                588 // Mobile only touch devices.
                589 this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
                590 this.touchController.addEventListener(Runner.events.TOUCHEND, this);
                591 this.containerEl.addEventListener(Runner.events.TOUCHSTART, this);
                592
            } else {
                593 // Mouse.
                594 document.addEventListener(Runner.events.MOUSEDOWN, this);
                595 document.addEventListener(Runner.events.MOUSEUP, this);
                596
            }
            597
        },
        598
        599
        /**
 600          * Remove all listeners.
 601          */
        602 stopListening: function() {
            603 document.removeEventListener(Runner.events.KEYDOWN, this);
            604 document.removeEventListener(Runner.events.KEYUP, this);
            605
            606
            if (IS_MOBILE) {
                607 this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
                608 this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
                609 this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
                610
            } else {
                611 document.removeEventListener(Runner.events.MOUSEDOWN, this);
                612 document.removeEventListener(Runner.events.MOUSEUP, this);
                613
            }
            614
        },
        615
        616
        /**
 617          * Process keydown.
 618          * @param {Event} e
 619          */
        620 onKeyDown: function(e) {
            621 // Prevent native page scrolling whilst tapping on mobile.
            622
            if (IS_MOBILE) {
                623 e.preventDefault();
                624
            }
            625
            626
            if (e.target != this.detailsButton) {
                627
                if (!this.crashed && (Runner.keycodes.JUMP[e.keyCode] ||
                        628 e.type == Runner.events.TOUCHSTART)) {
                    629
                    if (!this.activated) {
                        630 this.loadSounds();
                        631 this.activated = true;
                        632 errorPageController.trackEasterEgg();
                        633
                    }
                    634
                    635
                    if (!this.tRex.jumping && !this.tRex.ducking) {
                        636 this.playSound(this.soundFx.BUTTON_PRESS);
                        637 this.tRex.startJump(this.currentSpeed);
                        638
                    }
                    639
                }
                640
                641
                if (this.crashed && e.type == Runner.events.TOUCHSTART &&
                    642 e.currentTarget == this.containerEl) {
                    643 this.restart();
                    644
                }
                645
            }
            646
            647
            if (this.activated && !this.crashed && Runner.keycodes.DUCK[e.keyCode]) {
                648 e.preventDefault();
                649
                if (this.tRex.jumping) {
                    650 // Speed drop, activated only when jump key is not pressed.
                    651 this.tRex.setSpeedDrop();
                    652
                } else if (!this.tRex.jumping && !this.tRex.ducking) {
                    653 // Duck.
                    654 this.tRex.setDuck(true);
                    655
                }
                656
            }
            657
        },
        658
        659
        660
        /**
 661          * Process key up.
 662          * @param {Event} e
 663          */
        664 onKeyUp: function(e) {
            665
            var keyCode = String(e.keyCode);
            666
            var isjumpKey = Runner.keycodes.JUMP[keyCode] ||
                667 e.type == Runner.events.TOUCHEND ||
                668 e.type == Runner.events.MOUSEDOWN;
            669
            670
            if (this.isRunning() && isjumpKey) {
                671 this.tRex.endJump();
                672
            } else if (Runner.keycodes.DUCK[keyCode]) {
                673 this.tRex.speedDrop = false;
                674 this.tRex.setDuck(false);
                675
            } else if (this.crashed) {
                676 // Check that enough time has elapsed before allowing jump key to restart.
                677
                var deltaTime = getTimeStamp() - this.time;
                678
                679
                if (Runner.keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) ||
                    680(deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
                        681 Runner.keycodes.JUMP[keyCode])) {
                    682 this.restart();
                    683
                }
                684
            } else if (this.paused && isjumpKey) {
                685 // Reset the jump state
                686 this.tRex.reset();
                687 this.play();
                688
            }
            689
        },
        690
        691
        /**
 692          * Returns whether the event was a left click on canvas.
 693          * On Windows right click is registered as a click.
 694          * @param {Event} e
 695          * @return {boolean}
 696          */
        697 isLeftClickOnCanvas: function(e) {
            698
            return e.button != null && e.button < 2 &&
                699 e.type == Runner.events.MOUSEUP && e.target == this.canvas;
            700
        },
        701
        702
        /**
 703          * RequestAnimationFrame wrapper.
 704          */
        705 raq: function() {
            706
            if (!this.drawPending) {
                707 this.drawPending = true;
                708 this.raqId = requestAnimationFrame(this.update.bind(this));
                709
            }
            710
        },
        711
        712
        /**
 713          * Whether the game is running.
 714          * @return {boolean}
 715          */
        716 isRunning: function() {
            717
            return !!this.raqId;
            718
        },
        719
        720
        /**
 721          * Game over state.
 722          */
        723 gameOver: function() {
            724 this.playSound(this.soundFx.HIT);
            725 vibrate(200);
            726
            727 this.stop();
            728 this.crashed = true;
            729 this.distanceMeter.acheivement = false;
            730
            731 this.tRex.update(100, Trex.status.CRASHED);
            732
            733 // Game over panel.
            734
            if (!this.gameOverPanel) {
                735 this.gameOverPanel = new GameOverPanel(this.canvas,
                    736 this.spriteDef.TEXT_SPRITE, this.spriteDef.RESTART,
                    737 this.dimensions);
                738
            } else {
                739 this.gameOverPanel.draw();
                740
            }
            741
            742 // Update the high score.
            743
            if (this.distanceRan > this.highestScore) {
                744 this.highestScore = Math.ceil(this.distanceRan);
                745 this.distanceMeter.setHighScore(this.highestScore);
                746
            }
            747
            748 // Reset the time clock.
            749 this.time = getTimeStamp();
            750
        },
        751
        752 stop: function() {
            753 this.activated = false;
            754 this.paused = true;
            755 cancelAnimationFrame(this.raqId);
            756 this.raqId = 0;
            757
        },
        758
        759 play: function() {
            760
            if (!this.crashed) {
                761 this.activated = true;
                762 this.paused = false;
                763 this.tRex.update(0, Trex.status.RUNNING);
                764 this.time = getTimeStamp();
                765 this.update();
                766
            }
            767
        },
        768
        769 restart: function() {
            770
            if (!this.raqId) {
                771 this.playCount++;
                772 this.runningTime = 0;
                773 this.activated = true;
                774 this.crashed = false;
                775 this.distanceRan = 0;
                776 this.setSpeed(this.config.SPEED);
                777
                778 this.time = getTimeStamp();
                779 this.containerEl.classList.remove(Runner.classes.CRASHED);
                780 this.clearCanvas();
                781 this.distanceMeter.reset(this.highestScore);
                782 this.horizon.reset();
                783 this.tRex.reset();
                784 this.playSound(this.soundFx.BUTTON_PRESS);
                785
                786 this.update();
                787
            }
            788
        },
        789
        790
        /**
 791          * Pause the game if the tab is not in focus.
 792          */
        793 onVisibilityChange: function(e) {
            794
            if (document.hidden || document.webkitHidden || e.type == 'blur') {
                795 this.stop();
                796
            } else if (!this.crashed) {
                797 this.tRex.reset();
                798 this.play();
                799
            }
            800
        },
        801
        802
        /**
 803          * Play a sound.
 804          * @param {SoundBuffer} soundBuffer
 805          */
        806 playSound: function(soundBuffer) {
            807
            if (soundBuffer) {
                808
                var sourceNode = this.audioContext.createBufferSource();
                809 sourceNode.buffer = soundBuffer;
                810 sourceNode.connect(this.audioContext.destination);
                811 sourceNode.start(0);
                812
            }
            813
        }
        814
    };
    815
    816
    817
    /**
 818      * Updates the canvas size taking into
 819      * account the backing store pixel ratio and
 820      * the device pixel ratio.
 821      *
 822      * See article by Paul Lewis:
 823      * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 824      *
 825      * @param {HTMLCanvasElement} canvas
 826      * @param {number} opt_width
 827      * @param {number} opt_height
 828      * @return {boolean} Whether the canvas was scaled.
 829      */
    830 Runner.updateCanvasScaling = function(canvas, opt_width, opt_height) {
        831
        var context = canvas.getContext('2d');
        832
        833 // Query the various pixel ratios
        834
        var devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
        835
        var backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
        836
        var ratio = devicePixelRatio / backingStoreRatio;
        837
        838 // Upscale the canvas if the two ratios don't match
        839
        if (devicePixelRatio !== backingStoreRatio) {
            840
            var oldWidth = opt_width || canvas.width;
            841
            var oldHeight = opt_height || canvas.height;
            842
            843 canvas.width = oldWidth * ratio;
            844 canvas.height = oldHeight * ratio;
            845
            846 canvas.style.width = oldWidth + 'px';
            847 canvas.style.height = oldHeight + 'px';
            848
            849 // Scale the context to counter the fact that we've manually scaled
            850 // our canvas element.
            851 context.scale(ratio, ratio);
            852
            return true;
            853
        } else if (devicePixelRatio == 1) {
            854 // Reset the canvas width / height. Fixes scaling bug when the page is
            855 // zoomed and the devicePixelRatio changes accordingly.
            856 canvas.style.width = canvas.width + 'px';
            857 canvas.style.height = canvas.height + 'px';
            858
        }
        859
        return false;
        860
    };
    861
    862
    863
    /**
 864      * Get random number.
 865      * @param {number} min
 866      * @param {number} max
 867      * @param {number}
 868      */
    869
    function getRandomNum(min, max) {
        870
        return Math.floor(Math.random() * (max - min + 1)) + min;
        871
    }
    872
    873
    874
    /**
 875      * Vibrate on mobile devices.
 876      * @param {number} duration Duration of the vibration in milliseconds.
 877      */
    878
    function vibrate(duration) {
        879
        if (IS_MOBILE && window.navigator.vibrate) {
            880 window.navigator.vibrate(duration);
            881
        }
        882
    }
    883
    884
    885
    /**
 886      * Create canvas element.
 887      * @param {HTMLElement} container Element to append canvas to.
 888      * @param {number} width
 889      * @param {number} height
 890      * @param {string} opt_classname
 891      * @return {HTMLCanvasElement}
 892      */
    893
    function createCanvas(container, width, height, opt_classname) {
        894
        var canvas = document.createElement('canvas');
        895 canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
            896 opt_classname : Runner.classes.CANVAS;
        897 canvas.width = width;
        898 canvas.height = height;
        899 container.appendChild(canvas);
        900
        901
        return canvas;
        902
    }
    903
    904
    905
    /**
 906      * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 907      * @param {string} base64String
 908      */
    909
    function decodeBase64ToArrayBuffer(base64String) {
        910
        var len = (base64String.length / 4) * 3;
        911
        var str = atob(base64String);
        912
        var arrayBuffer = new ArrayBuffer(len);
        913
        var bytes = new Uint8Array(arrayBuffer);
        914
        915
        for (var i = 0; i < len; i++) {
            916 bytes[i] = str.charCodeAt(i);
            917
        }
        918
        return bytes.buffer;
        919
    }
    920
    921
    922
    /**
 923      * Return the current timestamp.
 924      * @return {number}
 925      */
    926
    function getTimeStamp() {
        927
        return IS_IOS ? new Date().getTime() : performance.now();
        928
    }
    929
    930
    931 //******************************************************************************
    932
    933
    934
    /**
 935      * Game over panel.
 936      * @param {!HTMLCanvasElement} canvas
 937      * @param {Object} textImgPos
 938      * @param {Object} restartImgPos
 939      * @param {!Object} dimensions Canvas dimensions.
 940      * @constructor
 941      */
    942
    function GameOverPanel(canvas, textImgPos, restartImgPos, dimensions) {
        943 this.canvas = canvas;
        944 this.canvasCtx = canvas.getContext('2d');
        945 this.canvasDimensions = dimensions;
        946 this.textImgPos = textImgPos;
        947 this.restartImgPos = restartImgPos;
        948 this.draw();
        949
    };
    950
    951
    952
    /**
 953      * Dimensions used in the panel.
 954      * @enum {number}
 955      */
    956 GameOverPanel.dimensions = {
        957 TEXT_X: 0,
        958 TEXT_Y: 13,
        959 TEXT_WIDTH: 191,
        960 TEXT_HEIGHT: 11,
        961 RESTART_WIDTH: 36,
        962 RESTART_HEIGHT: 32
        963
    };
    964
    965
    966 GameOverPanel.prototype = {
        967
        /**
 968          * Update the panel dimensions.
 969          * @param {number} width New canvas width.
 970          * @param {number} opt_height Optional new canvas height.
 971          */
        972 updateDimensions: function(width, opt_height) {
            973 this.canvasDimensions.WIDTH = width;
            974
            if (opt_height) {
                975 this.canvasDimensions.HEIGHT = opt_height;
                976
            }
            977
        },
        978
        979
        /**
 980          * Draw the panel.
 981          */
        982 draw: function() {
            983
            var dimensions = GameOverPanel.dimensions;
            984
            985
            var centerX = this.canvasDimensions.WIDTH / 2;
            986
            987 // Game over text.
            988
            var textSourceX = dimensions.TEXT_X;
            989
            var textSourceY = dimensions.TEXT_Y;
            990
            var textSourceWidth = dimensions.TEXT_WIDTH;
            991
            var textSourceHeight = dimensions.TEXT_HEIGHT;
            992
            993
            var textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
            994
            var textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
            995
            var textTargetWidth = dimensions.TEXT_WIDTH;
            996
            var textTargetHeight = dimensions.TEXT_HEIGHT;
            997
            998
            var restartSourceWidth = dimensions.RESTART_WIDTH;
            999
            var restartSourceHeight = dimensions.RESTART_HEIGHT;
            1000
            var restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
            1001
            var restartTargetY = this.canvasDimensions.HEIGHT / 2;
            1002
            1003
            if (IS_HIDPI) {
                1004 textSourceY *= 2;
                1005 textSourceX *= 2;
                1006 textSourceWidth *= 2;
                1007 textSourceHeight *= 2;
                1008 restartSourceWidth *= 2;
                1009 restartSourceHeight *= 2;
                1010
            }
            1011
            1012 textSourceX += this.textImgPos.x;
            1013 textSourceY += this.textImgPos.y;
            1014
            1015 // Game over text from sprite.
            1016 this.canvasCtx.drawImage(Runner.imageSprite,
                1017 textSourceX, textSourceY, textSourceWidth, textSourceHeight,
                1018 textTargetX, textTargetY, textTargetWidth, textTargetHeight);
            1019
            1020 // Restart button.
            1021 this.canvasCtx.drawImage(Runner.imageSprite,
                1022 this.restartImgPos.x, this.restartImgPos.y,
                1023 restartSourceWidth, restartSourceHeight,
                1024 restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
                1025 dimensions.RESTART_HEIGHT);
            1026
        }
        1027
    };
    1028
    1029
    1030 //******************************************************************************
    1031
    1032
    /**
1033      * Check for a collision.
1034      * @param {!Obstacle} obstacle
1035      * @param {!Trex} tRex T-rex object.
1036      * @param {HTMLCanvasContext} opt_canvasCtx Optional canvas context for drawing
1037      *    collision boxes.
1038      * @return {Array<CollisionBox>}
1039      */
    1040
    function checkForCollision(obstacle, tRex, opt_canvasCtx) {
        1041
        var obstacleBoxXPos = Runner.defaultDimensions.WIDTH + obstacle.xPos;
        1042
        1043 // Adjustments are made to the bounding box as there is a 1 pixel white
        1044 // border around the t-rex and obstacles.
        1045
        var tRexBox = new CollisionBox(
            1046 tRex.xPos + 1,
            1047 tRex.yPos + 1,
            1048 tRex.config.WIDTH - 2,
            1049 tRex.config.HEIGHT - 2);
        1050
        1051
        var obstacleBox = new CollisionBox(
            1052 obstacle.xPos + 1,
            1053 obstacle.yPos + 1,
            1054 obstacle.typeConfig.width * obstacle.size - 2,
            1055 obstacle.typeConfig.height - 2);
        1056
        1057 // Debug outer box
        1058
        if (opt_canvasCtx) {
            1059 drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
            1060
        }
        1061
        1062 // Simple outer bounds check.
        1063
        if (boxCompare(tRexBox, obstacleBox)) {
            1064
            var collisionBoxes = obstacle.collisionBoxes;
            1065
            var tRexCollisionBoxes = tRex.ducking ?
                1066 Trex.collisionBoxes.DUCKING : Trex.collisionBoxes.RUNNING;
            1067
            1068 // Detailed axis aligned box check.
            1069
            for (var t = 0; t < tRexCollisionBoxes.length; t++) {
                1070
                for (var i = 0; i < collisionBoxes.length; i++) {
                    1071 // Adjust the box to actual positions.
                    1072
                    var adjTrexBox =
                        1073 createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
                    1074
                    var adjObstacleBox =
                        1075 createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
                    1076
                    var crashed = boxCompare(adjTrexBox, adjObstacleBox);
                    1077
                    1078 // Draw boxes for debug.
                    1079
                    if (opt_canvasCtx) {
                        1080 drawCollisionBoxes(opt_canvasCtx, adjTrexBox, adjObstacleBox);
                        1081
                    }
                    1082
                    1083
                    if (crashed) {
                        1084
                        return [adjTrexBox, adjObstacleBox];
                        1085
                    }
                    1086
                }
                1087
            }
            1088
        }
        1089
        return false;
        1090
    };
    1091
    1092
    1093
    /**
1094      * Adjust the collision box.
1095      * @param {!CollisionBox} box The original box.
1096      * @param {!CollisionBox} adjustment Adjustment box.
1097      * @return {CollisionBox} The adjusted collision box object.
1098      */
    1099
    function createAdjustedCollisionBox(box, adjustment) {
        1100
        return new CollisionBox(
            1101 box.x + adjustment.x,
            1102 box.y + adjustment.y,
            1103 box.width,
            1104 box.height);
        1105
    };
    1106
    1107
    1108
    /**
1109      * Draw the collision boxes for debug.
1110      */
    1111
    function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
        1112 canvasCtx.save();
        1113 canvasCtx.strokeStyle = '#f00';
        1114 canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);
        1115
        1116 canvasCtx.strokeStyle = '#0f0';
        1117 canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
            1118 obstacleBox.width, obstacleBox.height);
        1119 canvasCtx.restore();
        1120
    };
    1121
    1122
    1123
    /**
1124      * Compare two collision boxes for a collision.
1125      * @param {CollisionBox} tRexBox
1126      * @param {CollisionBox} obstacleBox
1127      * @return {boolean} Whether the boxes intersected.
1128      */
    1129
    function boxCompare(tRexBox, obstacleBox) {
        1130
        var crashed = false;
        1131
        var tRexBoxX = tRexBox.x;
        1132
        var tRexBoxY = tRexBox.y;
        1133
        1134
        var obstacleBoxX = obstacleBox.x;
        1135
        var obstacleBoxY = obstacleBox.y;
        1136
        1137 // Axis-Aligned Bounding Box method.
        1138
        if (tRexBox.x < obstacleBoxX + obstacleBox.width &&
            1139 tRexBox.x + tRexBox.width > obstacleBoxX &&
            1140 tRexBox.y < obstacleBox.y + obstacleBox.height &&
            1141 tRexBox.height + tRexBox.y > obstacleBox.y) {
            1142 crashed = true;
            1143
        }
        1144
        1145
        return crashed;
        1146
    };
    1147
    1148
    1149 //******************************************************************************
    1150
    1151
    /**
1152      * Collision box object.
1153      * @param {number} x X position.
1154      * @param {number} y Y Position.
1155      * @param {number} w Width.
1156      * @param {number} h Height.
1157      */
    1158
    function CollisionBox(x, y, w, h) {
        1159 this.x = x;
        1160 this.y = y;
        1161 this.width = w;
        1162 this.height = h;
        1163
    };
    1164
    1165
    1166 //******************************************************************************
    1167
    1168
    /**
1169      * Obstacle.
1170      * @param {HTMLCanvasCtx} canvasCtx
1171      * @param {Obstacle.type} type
1172      * @param {Object} spritePos Obstacle position in sprite.
1173      * @param {Object} dimensions
1174      * @param {number} gapCoefficient Mutipler in determining the gap.
1175      * @param {number} speed
1176      */
    1177
    function Obstacle(canvasCtx, type, spriteImgPos, dimensions,
        1178 gapCoefficient, speed) {
        1179
        1180 this.canvasCtx = canvasCtx;
        1181 this.spritePos = spriteImgPos;
        1182 this.typeConfig = type;
        1183 this.gapCoefficient = gapCoefficient;
        1184 this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
        1185 this.dimensions = dimensions;
        1186 this.remove = false;
        1187 this.xPos = 0;
        1188 this.yPos = 0;
        1189 this.width = 0;
        1190 this.collisionBoxes = [];
        1191 this.gap = 0;
        1192 this.speedOffset = 0;
        1193
        1194 // For animated obstacles.
        1195 this.currentFrame = 0;
        1196 this.timer = 0;
        1197
        1198 this.init(speed);
        1199
    };
    1200
    1201
    /**
1202      * Coefficient for calculating the maximum gap.
1203      * @const
1204      */
    1205 Obstacle.MAX_GAP_COEFFICIENT = 1.5;
    1206
    1207
    /**
1208      * Maximum obstacle grouping count.
1209      * @const
1210      */
    1211 Obstacle.MAX_OBSTACLE_LENGTH = 3,
        1212
    1213
    1214 Obstacle.prototype = {
        1215
        /**
1216          * Initialise the DOM for the obstacle.
1217          * @param {number} speed
1218          */
        1219 init: function(speed) {
            1220 this.cloneCollisionBoxes();
            1221
            1222 // Only allow sizing if we're at the right speed.
            1223
            if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
                1224 this.size = 1;
                1225
            }
            1226
            1227 this.width = this.typeConfig.width * this.size;
            1228 this.xPos = this.dimensions.WIDTH - this.width;
            1229
            1230 // Check if obstacle can be positioned at various heights.
            1231
            if (Array.isArray(this.typeConfig.yPos)) {
                1232
                var yPosConfig = IS_MOBILE ? this.typeConfig.yPosMobile :
                    1233 this.typeConfig.yPos;
                1234 this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
                1235
            } else {
                1236 this.yPos = this.typeConfig.yPos;
                1237
            }
            1238
            1239 this.draw();
            1240
            1241 // Make collision box adjustments,
            1242 // Central box is adjusted to the size as one box.
            1243 //      ____        ______        ________
            1244 //    _|   |-|    _|     |-|    _|       |-|
            1245 //   | |<->| |   | |<--->| |   | |<----->| |
            1246 //   | | 1 | |   | |  2  | |   | |   3   | |
            1247 //   |_|___|_|   |_|_____|_|   |_|_______|_|
            1248 //
            1249
            if (this.size > 1) {
                1250 this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
                    1251 this.collisionBoxes[2].width;
                1252 this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
                1253
            }
            1254
            1255 // For obstacles that go at a different speed from the horizon.
            1256
            if (this.typeConfig.speedOffset) {
                1257 this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset :
                    1258 - this.typeConfig.speedOffset;
                1259
            }
            1260
            1261 this.gap = this.getGap(this.gapCoefficient, speed);
            1262
        },
        1263
        1264
        /**
1265          * Draw and crop based on size.
1266          */
        1267 draw: function() {
            1268
            var sourceWidth = this.typeConfig.width;
            1269
            var sourceHeight = this.typeConfig.height;
            1270
            1271
            if (IS_HIDPI) {
                1272 sourceWidth = sourceWidth * 2;
                1273 sourceHeight = sourceHeight * 2;
                1274
            }
            1275
            1276 // X position in sprite.
            1277
            var sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) +
                1278 this.spritePos.x;
            1279
            1280 // Animation frames.
            1281
            if (this.currentFrame > 0) {
                1282 sourceX += sourceWidth * this.currentFrame;
                1283
            }
            1284
            1285 this.canvasCtx.drawImage(Runner.imageSprite,
                1286 sourceX, this.spritePos.y,
                1287 sourceWidth * this.size, sourceHeight,
                1288 this.xPos, this.yPos,
                1289 this.typeConfig.width * this.size, this.typeConfig.height);
            1290
        },
        1291
        1292
        /**
1293          * Obstacle frame update.
1294          * @param {number} deltaTime
1295          * @param {number} speed
1296          */
        1297 update: function(deltaTime, speed) {
            1298
            if (!this.remove) {
                1299
                if (this.typeConfig.speedOffset) {
                    1300 speed += this.speedOffset;
                    1301
                }
                1302 this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);
                1303
                1304 // Update frame
                1305
                if (this.typeConfig.numFrames) {
                    1306 this.timer += deltaTime;
                    1307
                    if (this.timer >= this.typeConfig.frameRate) {
                        1308 this.currentFrame =
                            1309 this.currentFrame == this.typeConfig.numFrames - 1 ?
                            1310 0 : this.currentFrame + 1;
                        1311 this.timer = 0;
                        1312
                    }
                    1313
                }
                1314 this.draw();
                1315
                1316
                if (!this.isVisible()) {
                    1317 this.remove = true;
                    1318
                }
                1319
            }
            1320
        },
        1321
        1322
        /**
1323          * Calculate a random gap size.
1324          * - Minimum gap gets wider as speed increses
1325          * @param {number} gapCoefficient
1326          * @param {number} speed
1327          * @return {number} The gap size.
1328          */
        1329 getGap: function(gapCoefficient, speed) {
            1330
            var minGap = Math.round(this.width * speed +
                1331 this.typeConfig.minGap * gapCoefficient);
            1332
            var maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
            1333
            return getRandomNum(minGap, maxGap);
            1334
        },
        1335
        1336
        /**
1337          * Check if obstacle is visible.
1338          * @return {boolean} Whether the obstacle is in the game area.
1339          */
        1340 isVisible: function() {
            1341
            return this.xPos + this.width > 0;
            1342
        },
        1343
        1344
        /**
1345          * Make a copy of the collision boxes, since these will change based on
1346          * obstacle type and size.
1347          */
        1348 cloneCollisionBoxes: function() {
            1349
            var collisionBoxes = this.typeConfig.collisionBoxes;
            1350
            1351
            for (var i = collisionBoxes.length - 1; i >= 0; i--) {
                1352 this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
                    1353 collisionBoxes[i].y, collisionBoxes[i].width,
                    1354 collisionBoxes[i].height);
                1355
            }
            1356
        }
        1357
    };
    1358
    1359
    1360
    /**
1361      * Obstacle definitions.
1362      * minGap: minimum pixel space betweeen obstacles.
1363      * multipleSpeed: Speed at which multiples are allowed.
1364      * speedOffset: speed faster / slower than the horizon.
1365      * minSpeed: Minimum speed which the obstacle can make an appearance.
1366      */
    1367 Obstacle.types = [
        1368 {
            1369 type: 'CACTUS_SMALL',
                1370 width: 17,
                1371 height: 35,
                1372 yPos: 105,
                1373 multipleSpeed: 4,
                1374 minGap: 120,
                1375 minSpeed: 0,
                1376 collisionBoxes: [
                    1377 new CollisionBox(0, 7, 5, 27),
                    1378 new CollisionBox(4, 0, 6, 34),
                    1379 new CollisionBox(10, 4, 7, 14)
                    1380
                ]
            1381
        },
        1382 {
            1383 type: 'CACTUS_LARGE',
                1384 width: 25,
                1385 height: 50,
                1386 yPos: 90,
                1387 multipleSpeed: 7,
                1388 minGap: 120,
                1389 minSpeed: 0,
                1390 collisionBoxes: [
                    1391 new CollisionBox(0, 12, 7, 38),
                    1392 new CollisionBox(8, 0, 7, 49),
                    1393 new CollisionBox(13, 10, 10, 38)
                    1394
                ]
            1395
        },
        1396 {
            1397 type: 'PTERODACTYL',
                1398 width: 46,
                1399 height: 40,
                1400 yPos: [100, 75, 50], // Variable height.
                1401 yPosMobile: [100, 50], // Variable height mobile.
                1402 multipleSpeed: 999,
                1403 minSpeed: 8.5,
                1404 minGap: 150,
                1405 collisionBoxes: [
                    1406 new CollisionBox(15, 15, 16, 5),
                    1407 new CollisionBox(18, 21, 24, 6),
                    1408 new CollisionBox(2, 14, 4, 3),
                    1409 new CollisionBox(6, 10, 4, 7),
                    1410 new CollisionBox(10, 8, 6, 9)
                    1411
                ],
                1412 numFrames: 2,
                1413 frameRate: 1000 / 6,
                1414 speedOffset: .8
            1415
        }
        1416
    ];
    1417
    1418
    1419 //******************************************************************************
    1420
    /**
1421      * T-rex game character.
1422      * @param {HTMLCanvas} canvas
1423      * @param {Object} spritePos Positioning within image sprite.
1424      * @constructor
1425      */
    1426
    function Trex(canvas, spritePos) {
        1427 this.canvas = canvas;
        1428 this.canvasCtx = canvas.getContext('2d');
        1429 this.spritePos = spritePos;
        1430 this.xPos = 0;
        1431 this.yPos = 0;
        1432 // Position when on the ground.
        1433 this.groundYPos = 0;
        1434 this.currentFrame = 0;
        1435 this.currentAnimFrames = [];
        1436 this.blinkDelay = 0;
        1437 this.animStartTime = 0;
        1438 this.timer = 0;
        1439 this.msPerFrame = 1000 / FPS;
        1440 this.config = Trex.config;
        1441 // Current status.
        1442 this.status = Trex.status.WAITING;
        1443
        1444 this.jumping = false;
        1445 this.ducking = false;
        1446 this.jumpVelocity = 0;
        1447 this.reachedMinHeight = false;
        1448 this.speedDrop = false;
        1449 this.jumpCount = 0;
        1450 this.jumpspotX = 0;
        1451
        1452 this.init();
        1453
    };
    1454
    1455
    1456
    /**
1457      * T-rex player config.
1458      * @enum {number}
1459      */
    1460 Trex.config = {
        1461 DROP_VELOCITY: -5,
        1462 GRAVITY: 0.6,
        1463 HEIGHT: 47,
        1464 HEIGHT_DUCK: 25,
        1465 INIITAL_JUMP_VELOCITY: -10,
        1466 INTRO_DURATION: 1500,
        1467 MAX_JUMP_HEIGHT: 30,
        1468 MIN_JUMP_HEIGHT: 30,
        1469 SPEED_DROP_COEFFICIENT: 3,
        1470 SPRITE_WIDTH: 262,
        1471 START_X_POS: 50,
        1472 WIDTH: 44,
        1473 WIDTH_DUCK: 59
        1474
    };
    1475
    1476
    1477
    /**
1478      * Used in collision detection.
1479      * @type {Array<CollisionBox>}
1480      */
    1481 Trex.collisionBoxes = {
        1482 DUCKING: [
            1483 new CollisionBox(1, 18, 55, 25)
            1484
        ],
        1485 RUNNING: [
            1486 new CollisionBox(22, 0, 17, 16),
            1487 new CollisionBox(1, 18, 30, 9),
            1488 new CollisionBox(10, 35, 14, 8),
            1489 new CollisionBox(1, 24, 29, 5),
            1490 new CollisionBox(5, 30, 21, 4),
            1491 new CollisionBox(9, 34, 15, 4)
            1492
        ]
        1493
    };
    1494
    1495
    1496
    /**
1497      * Animation states.
1498      * @enum {string}
1499      */
    1500 Trex.status = {
        1501 CRASHED: 'CRASHED',
        1502 DUCKING: 'DUCKING',
        1503 JUMPING: 'JUMPING',
        1504 RUNNING: 'RUNNING',
        1505 WAITING: 'WAITING'
        1506
    };
    1507
    1508
    /**
1509      * Blinking coefficient.
1510      * @const
1511      */
    1512 Trex.BLINK_TIMING = 7000;
    1513
    1514
    1515
    /**
1516      * Animation config for different states.
1517      * @enum {Object}
1518      */
    1519 Trex.animFrames = {
        1520 WAITING: {
            1521 frames: [44, 0],
            1522 msPerFrame: 1000 / 3
            1523
        },
        1524 RUNNING: {
            1525 frames: [88, 132],
            1526 msPerFrame: 1000 / 12
            1527
        },
        1528 CRASHED: {
            1529 frames: [220],
            1530 msPerFrame: 1000 / 60
            1531
        },
        1532 JUMPING: {
            1533 frames: [0],
            1534 msPerFrame: 1000 / 60
            1535
        },
        1536 DUCKING: {
            1537 frames: [262, 321],
            1538 msPerFrame: 1000 / 8
            1539
        }
        1540
    };
    1541
    1542
    1543 Trex.prototype = {
        1544
        /**
1545          * T-rex player initaliser.
1546          * Sets the t-rex to blink at random intervals.
1547          */
        1548 init: function() {
            1549 this.blinkDelay = this.setBlinkDelay();
            1550 this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
                1551 Runner.config.BOTTOM_PAD;
            1552 this.yPos = this.groundYPos;
            1553 this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
            1554
            1555 this.draw(0, 0);
            1556 this.update(0, Trex.status.WAITING);
            1557
        },
        1558
        1559
        /**
1560          * Setter for the jump velocity.
1561          * The approriate drop velocity is also set.
1562          */
        1563 setJumpVelocity: function(setting) {
            1564 this.config.INIITAL_JUMP_VELOCITY = -setting;
            1565 this.config.DROP_VELOCITY = -setting / 2;
            1566
        },
        1567
        1568
        /**
1569          * Set the animation status.
1570          * @param {!number} deltaTime
1571          * @param {Trex.status} status Optional status to switch to.
1572          */
        1573 update: function(deltaTime, opt_status) {
            1574 this.timer += deltaTime;
            1575
            1576 // Update the status.
            1577
            if (opt_status) {
                1578 this.status = opt_status;
                1579 this.currentFrame = 0;
                1580 this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
                1581 this.currentAnimFrames = Trex.animFrames[opt_status].frames;
                1582
                1583
                if (opt_status == Trex.status.WAITING) {
                    1584 this.animStartTime = getTimeStamp();
                    1585 this.setBlinkDelay();
                    1586
                }
                1587
            }
            1588
            1589 // Game intro animation, T-rex moves in from the left.
            1590
            if (this.playingIntro && this.xPos < this.config.START_X_POS) {
                1591 this.xPos += Math.round((this.config.START_X_POS /
                    1592 this.config.INTRO_DURATION) * deltaTime);
                1593
            }
            1594
            1595
            if (this.status == Trex.status.WAITING) {
                1596 this.blink(getTimeStamp());
                1597
            } else {
                1598 this.draw(this.currentAnimFrames[this.currentFrame], 0);
                1599
            }
            1600
            1601 // Update the frame position.
            1602
            if (this.timer >= this.msPerFrame) {
                1603 this.currentFrame = this.currentFrame ==
                    1604 this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
                1605 this.timer = 0;
                1606
            }
            1607
            1608 // Speed drop becomes duck if the down key is still being pressed.
            1609
            if (this.speedDrop && this.yPos == this.groundYPos) {
                1610 this.speedDrop = false;
                1611 this.setDuck(true);
                1612
            }
            1613
        },
        1614
        1615
        /**
1616          * Draw the t-rex to a particular position.
1617          * @param {number} x
1618          * @param {number} y
1619          */
        1620 draw: function(x, y) {
            1621
            var sourceX = x;
            1622
            var sourceY = y;
            1623
            var sourceWidth = this.ducking && this.status != Trex.status.CRASHED ?
                1624 this.config.WIDTH_DUCK : this.config.WIDTH;
            1625
            var sourceHeight = this.config.HEIGHT;
            1626
            1627
            if (IS_HIDPI) {
                1628 sourceX *= 2;
                1629 sourceY *= 2;
                1630 sourceWidth *= 2;
                1631 sourceHeight *= 2;
                1632
            }
            1633
            1634 // Adjustments for sprite sheet position.
            1635 sourceX += this.spritePos.x;
            1636 sourceY += this.spritePos.y;
            1637
            1638 // Ducking.
            1639
            if (this.ducking && this.status != Trex.status.CRASHED) {
                1640 this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                    1641 sourceWidth, sourceHeight,
                    1642 this.xPos, this.yPos,
                    1643 this.config.WIDTH_DUCK, this.config.HEIGHT);
                1644
            } else {
                1645 // Crashed whilst ducking. Trex is standing up so needs adjustment.
                1646
                if (this.ducking && this.status == Trex.status.CRASHED) {
                    1647 this.xPos++;
                    1648
                }
                1649 // Standing / running
                1650 this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                    1651 sourceWidth, sourceHeight,
                    1652 this.xPos, this.yPos,
                    1653 this.config.WIDTH, this.config.HEIGHT);
                1654
            }
            1655
        },
        1656
        1657
        /**
1658          * Sets a random time for the blink to happen.
1659          */
        1660 setBlinkDelay: function() {
            1661 this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
            1662
        },
        1663
        1664
        /**
1665          * Make t-rex blink at random intervals.
1666          * @param {number} time Current time in milliseconds.
1667          */
        1668 blink: function(time) {
            1669
            var deltaTime = time - this.animStartTime;
            1670
            1671
            if (deltaTime >= this.blinkDelay) {
                1672 this.draw(this.currentAnimFrames[this.currentFrame], 0);
                1673
                1674
                if (this.currentFrame == 1) {
                    1675 // Set new random delay to blink.
                    1676 this.setBlinkDelay();
                    1677 this.animStartTime = time;
                    1678
                }
                1679
            }
            1680
        },
        1681
        1682
        /**
1683          * Initialise a jump.
1684          * @param {number} speed
1685          */
        1686 startJump: function(speed) {
            1687
            if (!this.jumping) {
                1688 this.update(0, Trex.status.JUMPING);
                1689 // Tweak the jump velocity based on the speed.
                1690 this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - (speed / 10);
                1691 this.jumping = true;
                1692 this.reachedMinHeight = false;
                1693 this.speedDrop = false;
                1694
            }
            1695
        },
        1696
        1697
        /**
1698          * Jump is complete, falling down.
1699          */
        1700 endJump: function() {
            1701
            if (this.reachedMinHeight &&
                1702 this.jumpVelocity < this.config.DROP_VELOCITY) {
                1703 this.jumpVelocity = this.config.DROP_VELOCITY;
                1704
            }
            1705
        },
        1706
        1707
        /**
1708          * Update frame for a jump.
1709          * @param {number} deltaTime
1710          * @param {number} speed
1711          */
        1712 updateJump: function(deltaTime, speed) {
            1713
            var msPerFrame = Trex.animFrames[this.status].msPerFrame;
            1714
            var framesElapsed = deltaTime / msPerFrame;
            1715
            1716 // Speed drop makes Trex fall faster.
            1717
            if (this.speedDrop) {
                1718 this.yPos += Math.round(this.jumpVelocity *
                    1719 this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
                1720
            } else {
                1721 this.yPos += Math.round(this.jumpVelocity * framesElapsed);
                1722
            }
            1723
            1724 this.jumpVelocity += this.config.GRAVITY * framesElapsed;
            1725
            1726 // Minimum height has been reached.
            1727
            if (this.yPos < this.minJumpHeight || this.speedDrop) {
                1728 this.reachedMinHeight = true;
                1729
            }
            1730
            1731 // Reached max height
            1732
            if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
                1733 this.endJump();
                1734
            }
            1735
            1736 // Back down at ground level. Jump completed.
            1737
            if (this.yPos > this.groundYPos) {
                1738 this.reset();
                1739 this.jumpCount++;
                1740
            }
            1741
            1742 this.update(deltaTime);
            1743
        },
        1744
        1745
        /**
1746          * Set the speed drop. Immediately cancels the current jump.
1747          */
        1748 setSpeedDrop: function() {
            1749 this.speedDrop = true;
            1750 this.jumpVelocity = 1;
            1751
        },
        1752
        1753
        /**
1754          * @param {boolean} isDucking.
1755          */
        1756 setDuck: function(isDucking) {
            1757
            if (isDucking && this.status != Trex.status.DUCKING) {
                1758 this.update(0, Trex.status.DUCKING);
                1759 this.ducking = true;
                1760
            } else if (this.status == Trex.status.DUCKING) {
                1761 this.update(0, Trex.status.RUNNING);
                1762 this.ducking = false;
                1763
            }
            1764
        },
        1765
        1766
        /**
1767          * Reset the t-rex to running at start of game.
1768          */
        1769 reset: function() {
            1770 this.yPos = this.groundYPos;
            1771 this.jumpVelocity = 0;
            1772 this.jumping = false;
            1773 this.ducking = false;
            1774 this.update(0, Trex.status.RUNNING);
            1775 this.midair = false;
            1776 this.speedDrop = false;
            1777 this.jumpCount = 0;
            1778
        }
        1779
    };
    1780
    1781
    1782 //******************************************************************************
    1783
    1784
    /**
1785      * Handles displaying the distance meter.
1786      * @param {!HTMLCanvasElement} canvas
1787      * @param {Object} spritePos Image position in sprite.
1788      * @param {number} canvasWidth
1789      * @constructor
1790      */
    1791
    function DistanceMeter(canvas, spritePos, canvasWidth) {
        1792 this.canvas = canvas;
        1793 this.canvasCtx = canvas.getContext('2d');
        1794 this.image = Runner.imageSprite;
        1795 this.spritePos = spritePos;
        1796 this.x = 0;
        1797 this.y = 5;
        1798
        1799 this.currentDistance = 0;
        1800 this.maxScore = 0;
        1801 this.highScore = 0;
        1802 this.container = null;
        1803
        1804 this.digits = [];
        1805 this.acheivement = false;
        1806 this.defaultString = '';
        1807 this.flashTimer = 0;
        1808 this.flashIterations = 0;
        1809
        1810 this.config = DistanceMeter.config;
        1811 this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
        1812 this.init(canvasWidth);
        1813
    };
    1814
    1815
    1816
    /**
1817      * @enum {number}
1818      */
    1819 DistanceMeter.dimensions = {
        1820 WIDTH: 10,
        1821 HEIGHT: 13,
        1822 DEST_WIDTH: 11
        1823
    };
    1824
    1825
    1826
    /**
1827      * Y positioning of the digits in the sprite sheet.
1828      * X position is always 0.
1829      * @type {Array<number>}
1830      */
    1831 DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];
    1832
    1833
    1834
    /**
1835      * Distance meter config.
1836      * @enum {number}
1837      */
    1838 DistanceMeter.config = {
        1839 // Number of digits.
        1840 MAX_DISTANCE_UNITS: 5,
        1841
        1842 // Distance that causes achievement animation.
        1843 ACHIEVEMENT_DISTANCE: 100,
        1844
        1845 // Used for conversion from pixel distance to a scaled unit.
        1846 COEFFICIENT: 0.025,
        1847
        1848 // Flash duration in milliseconds.
        1849 FLASH_DURATION: 1000 / 4,
        1850
        1851 // Flash iterations for achievement animation.
        1852 FLASH_ITERATIONS: 3
        1853
    };
    1854
    1855
    1856 DistanceMeter.prototype = {
        1857
        /**
1858          * Initialise the distance meter to '00000'.
1859          * @param {number} width Canvas width in px.
1860          */
        1861 init: function(width) {
            1862
            var maxDistanceStr = '';
            1863
            1864 this.calcXPos(width);
            1865 this.maxScore = this.maxScoreUnits;
            1866
            for (var i = 0; i < this.maxScoreUnits; i++) {
                1867 this.draw(i, 0);
                1868 this.defaultString += '0';
                1869 maxDistanceStr += '9';
                1870
            }
            1871
            1872 this.maxScore = parseInt(maxDistanceStr);
            1873
        },
        1874
        1875
        /**
1876          * Calculate the xPos in the canvas.
1877          * @param {number} canvasWidth
1878          */
        1879 calcXPos: function(canvasWidth) {
            1880 this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH *
                1881(this.maxScoreUnits + 1));
            1882
        },
        1883
        1884
        /**
1885          * Draw a digit to canvas.
1886          * @param {number} digitPos Position of the digit.
1887          * @param {number} value Digit value 0-9.
1888          * @param {boolean} opt_highScore Whether drawing the high score.
1889          */
        1890 draw: function(digitPos, value, opt_highScore) {
            1891
            var sourceWidth = DistanceMeter.dimensions.WIDTH;
            1892
            var sourceHeight = DistanceMeter.dimensions.HEIGHT;
            1893
            var sourceX = DistanceMeter.dimensions.WIDTH * value;
            1894
            var sourceY = 0;
            1895
            1896
            var targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
            1897
            var targetY = this.y;
            1898
            var targetWidth = DistanceMeter.dimensions.WIDTH;
            1899
            var targetHeight = DistanceMeter.dimensions.HEIGHT;
            1900
            1901 // For high DPI we 2x source values.
            1902
            if (IS_HIDPI) {
                1903 sourceWidth *= 2;
                1904 sourceHeight *= 2;
                1905 sourceX *= 2;
                1906
            }
            1907
            1908 sourceX += this.spritePos.x;
            1909 sourceY += this.spritePos.y;
            1910
            1911 this.canvasCtx.save();
            1912
            1913
            if (opt_highScore) {
                1914 // Left of the current score.
                1915
                var highScoreX = this.x - (this.maxScoreUnits * 2) *
                    1916 DistanceMeter.dimensions.WIDTH;
                1917 this.canvasCtx.translate(highScoreX, this.y);
                1918
            } else {
                1919 this.canvasCtx.translate(this.x, this.y);
                1920
            }
            1921
            1922 this.canvasCtx.drawImage(this.image, sourceX, sourceY,
                1923 sourceWidth, sourceHeight,
                1924 targetX, targetY,
                1925 targetWidth, targetHeight 1926);
            1927
            1928 this.canvasCtx.restore();
            1929
        },
        1930
        1931
        /**
1932          * Covert pixel distance to a 'real' distance.
1933          * @param {number} distance Pixel distance ran.
1934          * @return {number} The 'real' distance ran.
1935          */
        1936 getActualDistance: function(distance) {
            1937
            return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
            1938
        },
        1939
        1940
        /**
1941          * Update the distance meter.
1942          * @param {number} distance
1943          * @param {number} deltaTime
1944          * @return {boolean} Whether the acheivement sound fx should be played.
1945          */
        1946 update: function(deltaTime, distance) {
            1947
            var paint = true;
            1948
            var playSound = false;
            1949
            1950
            if (!this.acheivement) {
                1951 distance = this.getActualDistance(distance);
                1952
                1953 // Score has gone beyond the initial digit count.
                1954
                if (distance > this.maxScore && this.maxScoreUnits ==
                    1955 this.config.MAX_DISTANCE_UNITS) {
                    1956 this.maxScoreUnits++;
                    1957 this.maxScore = parseInt(this.maxScore + '9');
                    1958
                } else {
                    1959 this.distance = 0;
                    1960
                }
                1961
                1962
                if (distance > 0) {
                    1963 // Acheivement unlocked
                    1964
                    if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
                        1965 // Flash score and play sound.
                        1966 this.acheivement = true;
                        1967 this.flashTimer = 0;
                        1968 playSound = true;
                        1969
                    }
                    1970
                    1971 // Create a string representation of the distance with leading 0.
                    1972
                    var distanceStr = (this.defaultString +
                        1973 distance).substr(-this.maxScoreUnits);
                    1974 this.digits = distanceStr.split('');
                    1975
                } else {
                    1976 this.digits = this.defaultString.split('');
                    1977
                }
                1978
            } else {
                1979 // Control flashing of the score on reaching acheivement.
                1980
                if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                    1981 this.flashTimer += deltaTime;
                    1982
                    1983
                    if (this.flashTimer < this.config.FLASH_DURATION) {
                        1984 paint = false;
                        1985
                    } else if (this.flashTimer >
                        1986 this.config.FLASH_DURATION * 2) {
                        1987 this.flashTimer = 0;
                        1988 this.flashIterations++;
                        1989
                    }
                    1990
                } else {
                    1991 this.acheivement = false;
                    1992 this.flashIterations = 0;
                    1993 this.flashTimer = 0;
                    1994
                }
                1995
            }
            1996
            1997 // Draw the digits if not flashing.
            1998
            if (paint) {
                1999
                for (var i = this.digits.length - 1; i >= 0; i--) {
                    2000 this.draw(i, parseInt(this.digits[i]));
                    2001
                }
                2002
            }
            2003
            2004 this.drawHighScore();
            2005
            2006
            return playSound;
            2007
        },
        2008
        2009
        /**
2010          * Draw the high score.
2011          */
        2012 drawHighScore: function() {
            2013 this.canvasCtx.save();
            2014 this.canvasCtx.globalAlpha = .8;
            2015
            for (var i = this.highScore.length - 1; i >= 0; i--) {
                2016 this.draw(i, parseInt(this.highScore[i], 10), true);
                2017
            }
            2018 this.canvasCtx.restore();
            2019
        },
        2020
        2021
        /**
2022          * Set the highscore as a array string.
2023          * Position of char in the sprite: H - 10, I - 11.
2024          * @param {number} distance Distance ran in pixels.
2025          */
        2026 setHighScore: function(distance) {
            2027 distance = this.getActualDistance(distance);
            2028
            var highScoreStr = (this.defaultString +
                2029 distance).substr(-this.maxScoreUnits);
            2030
            2031 this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
            2032
        },
        2033
        2034
        /**
2035          * Reset the distance meter back to '00000'.
2036          */
        2037 reset: function() {
            2038 this.update(0);
            2039 this.acheivement = false;
            2040
        }
        2041
    };
    2042
    2043
    2044 //******************************************************************************
    2045
    2046
    /**
2047      * Cloud background item.
2048      * Similar to an obstacle object but without collision boxes.
2049      * @param {HTMLCanvasElement} canvas Canvas element.
2050      * @param {Object} spritePos Position of image in sprite.
2051      * @param {number} containerWidth
2052      */
    2053
    function Cloud(canvas, spritePos, containerWidth) {
        2054 this.canvas = canvas;
        2055 this.canvasCtx = this.canvas.getContext('2d');
        2056 this.spritePos = spritePos;
        2057 this.containerWidth = containerWidth;
        2058 this.xPos = containerWidth;
        2059 this.yPos = 0;
        2060 this.remove = false;
        2061 this.cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP,
            2062 Cloud.config.MAX_CLOUD_GAP);
        2063
        2064 this.init();
        2065
    };
    2066
    2067
    2068
    /**
2069      * Cloud object config.
2070      * @enum {number}
2071      */
    2072 Cloud.config = {
        2073 HEIGHT: 14,
        2074 MAX_CLOUD_GAP: 400,
        2075 MAX_SKY_LEVEL: 30,
        2076 MIN_CLOUD_GAP: 100,
        2077 MIN_SKY_LEVEL: 71,
        2078 WIDTH: 46
        2079
    };
    2080
    2081
    2082 Cloud.prototype = {
        2083
        /**
2084          * Initialise the cloud. Sets the Cloud height.
2085          */
        2086 init: function() {
            2087 this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL,
                2088 Cloud.config.MIN_SKY_LEVEL);
            2089 this.draw();
            2090
        },
        2091
        2092
        /**
2093          * Draw the cloud.
2094          */
        2095 draw: function() {
            2096 this.canvasCtx.save();
            2097
            var sourceWidth = Cloud.config.WIDTH;
            2098
            var sourceHeight = Cloud.config.HEIGHT;
            2099
            2100
            if (IS_HIDPI) {
                2101 sourceWidth = sourceWidth * 2;
                2102 sourceHeight = sourceHeight * 2;
                2103
            }
            2104
            2105 this.canvasCtx.drawImage(Runner.imageSprite, this.spritePos.x,
                2106 this.spritePos.y,
                2107 sourceWidth, sourceHeight,
                2108 this.xPos, this.yPos,
                2109 Cloud.config.WIDTH, Cloud.config.HEIGHT);
            2110
            2111 this.canvasCtx.restore();
            2112
        },
        2113
        2114
        /**
2115          * Update the cloud position.
2116          * @param {number} speed
2117          */
        2118 update: function(speed) {
            2119
            if (!this.remove) {
                2120 this.xPos -= Math.ceil(speed);
                2121 this.draw();
                2122
                2123 // Mark as removeable if no longer in the canvas.
                2124
                if (!this.isVisible()) {
                    2125 this.remove = true;
                    2126
                }
                2127
            }
            2128
        },
        2129
        2130
        /**
2131          * Check if the cloud is visible on the stage.
2132          * @return {boolean}
2133          */
        2134 isVisible: function() {
            2135
            return this.xPos + Cloud.config.WIDTH > 0;
            2136
        }
        2137
    };
    2138
    2139
    2140 //******************************************************************************
    2141
    2142
    /**
2143      * Horizon Line.
2144      * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
2145      * @param {HTMLCanvasElement} canvas
2146      * @param {Object} spritePos Horizon position in sprite.
2147      * @constructor
2148      */
    2149
    function HorizonLine(canvas, spritePos) {
        2150 this.spritePos = spritePos;
        2151 this.canvas = canvas;
        2152 this.canvasCtx = canvas.getContext('2d');
        2153 this.sourceDimensions = {};
        2154 this.dimensions = HorizonLine.dimensions;
        2155 this.sourceXPos = [this.spritePos.x, this.spritePos.x +
            2156 this.dimensions.WIDTH
        ];
        2157 this.xPos = [];
        2158 this.yPos = 0;
        2159 this.bumpThreshold = 0.5;
        2160
        2161 this.setSourceDimensions();
        2162 this.draw();
        2163
    };
    2164
    2165
    2166
    /**
2167      * Horizon line dimensions.
2168      * @enum {number}
2169      */
    2170 HorizonLine.dimensions = {
        2171 WIDTH: 600,
        2172 HEIGHT: 12,
        2173 YPOS: 127
        2174
    };
    2175
    2176
    2177 HorizonLine.prototype = {
        2178
        /**
2179          * Set the source dimensions of the horizon line.
2180          */
        2181 setSourceDimensions: function() {
            2182
            2183
            for (var dimension in HorizonLine.dimensions) {
                2184
                if (IS_HIDPI) {
                    2185
                    if (dimension != 'YPOS') {
                        2186 this.sourceDimensions[dimension] =
                            2187 HorizonLine.dimensions[dimension] * 2;
                        2188
                    }
                    2189
                } else {
                    2190 this.sourceDimensions[dimension] =
                        2191 HorizonLine.dimensions[dimension];
                    2192
                }
                2193 this.dimensions[dimension] = HorizonLine.dimensions[dimension];
                2194
            }
            2195
            2196 this.xPos = [0, HorizonLine.dimensions.WIDTH];
            2197 this.yPos = HorizonLine.dimensions.YPOS;
            2198
        },
        2199
        2200
        /**
2201          * Return the crop x position of a type.
2202          */
        2203 getRandomType: function() {
            2204
            return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
            2205
        },
        2206
        2207
        /**
2208          * Draw the horizon line.
2209          */
        2210 draw: function() {
            2211 this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[0],
                2212 this.spritePos.y,
                2213 this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                2214 this.xPos[0], this.yPos,
                2215 this.dimensions.WIDTH, this.dimensions.HEIGHT);
            2216
            2217 this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[1],
                2218 this.spritePos.y,
                2219 this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                2220 this.xPos[1], this.yPos,
                2221 this.dimensions.WIDTH, this.dimensions.HEIGHT);
            2222
        },
        2223
        2224
        /**
2225          * Update the x position of an indivdual piece of the line.
2226          * @param {number} pos Line position.
2227          * @param {number} increment
2228          */
        2229 updateXPos: function(pos, increment) {
            2230
            var line1 = pos;
            2231
            var line2 = pos == 0 ? 1 : 0;
            2232
            2233 this.xPos[line1] -= increment;
            2234 this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
            2235
            2236
            if (this.xPos[line1] <= -this.dimensions.WIDTH) {
                2237 this.xPos[line1] += this.dimensions.WIDTH * 2;
                2238 this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
                2239 this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
                2240
            }
            2241
        },
        2242
        2243
        /**
2244          * Update the horizon line.
2245          * @param {number} deltaTime
2246          * @param {number} speed
2247          */
        2248 update: function(deltaTime, speed) {
            2249
            var increment = Math.floor(speed * (FPS / 1000) * deltaTime);
            2250
            2251
            if (this.xPos[0] <= 0) {
                2252 this.updateXPos(0, increment);
                2253
            } else {
                2254 this.updateXPos(1, increment);
                2255
            }
            2256 this.draw();
            2257
        },
        2258
        2259
        /**
2260          * Reset horizon to the starting position.
2261          */
        2262 reset: function() {
            2263 this.xPos[0] = 0;
            2264 this.xPos[1] = HorizonLine.dimensions.WIDTH;
            2265
        }
        2266
    };
    2267
    2268
    2269 //******************************************************************************
    2270
    2271
    /**
2272      * Horizon background class.
2273      * @param {HTMLCanvasElement} canvas
2274      * @param {Object} spritePos Sprite positioning.
2275      * @param {Object} dimensions Canvas dimensions.
2276      * @param {number} gapCoefficient
2277      * @constructor
2278      */
    2279
    function Horizon(canvas, spritePos, dimensions, gapCoefficient) {
        2280 this.canvas = canvas;
        2281 this.canvasCtx = this.canvas.getContext('2d');
        2282 this.config = Horizon.config;
        2283 this.dimensions = dimensions;
        2284 this.gapCoefficient = gapCoefficient;
        2285 this.obstacles = [];
        2286 this.obstacleHistory = [];
        2287 this.horizonOffsets = [0, 0];
        2288 this.cloudFrequency = this.config.CLOUD_FREQUENCY;
        2289 this.spritePos = spritePos;
        2290
        2291 // Cloud
        2292 this.clouds = [];
        2293 this.cloudSpeed = this.config.BG_CLOUD_SPEED;
        2294
        2295 // Horizon
        2296 this.horizonLine = null;
        2297
        2298 this.init();
        2299
    };
    2300
    2301
    2302
    /**
2303      * Horizon config.
2304      * @enum {number}
2305      */
    2306 Horizon.config = {
        2307 BG_CLOUD_SPEED: 0.2,
        2308 BUMPY_THRESHOLD: .3,
        2309 CLOUD_FREQUENCY: .5,
        2310 HORIZON_HEIGHT: 16,
        2311 MAX_CLOUDS: 6
        2312
    };
    2313
    2314
    2315 Horizon.prototype = {
        2316
        /**
2317          * Initialise the horizon. Just add the line and a cloud. No obstacles.
2318          */
        2319 init: function() {
            2320 this.addCloud();
            2321 this.horizonLine = new HorizonLine(this.canvas, this.spritePos.HORIZON);
            2322
        },
        2323
        2324
        /**
2325          * @param {number} deltaTime
2326          * @param {number} currentSpeed
2327          * @param {boolean} updateObstacles Used as an override to prevent
2328          *     the obstacles from being updated / added. This happens in the
2329          *     ease in section.
2330          */
        2331 update: function(deltaTime, currentSpeed, updateObstacles) {
            2332 this.runningTime += deltaTime;
            2333 this.horizonLine.update(deltaTime, currentSpeed);
            2334 this.updateClouds(deltaTime, currentSpeed);
            2335
            2336
            if (updateObstacles) {
                2337 this.updateObstacles(deltaTime, currentSpeed);
                2338
            }
            2339
        },
        2340
        2341
        /**
2342          * Update the cloud positions.
2343          * @param {number} deltaTime
2344          * @param {number} currentSpeed
2345          */
        2346 updateClouds: function(deltaTime, speed) {
            2347
            var cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
            2348
            var numClouds = this.clouds.length;
            2349
            2350
            if (numClouds) {
                2351
                for (var i = numClouds - 1; i >= 0; i--) {
                    2352 this.clouds[i].update(cloudSpeed);
                    2353
                }
                2354
                2355
                var lastCloud = this.clouds[numClouds - 1];
                2356
                2357 // Check for adding a new cloud.
                2358
                if (numClouds < this.config.MAX_CLOUDS &&
                    2359(this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
                    2360 this.cloudFrequency > Math.random()) {
                    2361 this.addCloud();
                    2362
                }
                2363
                2364 // Remove expired clouds.
                2365 this.clouds = this.clouds.filter(function(obj) {
                    2366
                    return !obj.remove;
                    2367
                });
                2368
            }
            2369
        },
        2370
        2371
        /**
2372          * Update the obstacle positions.
2373          * @param {number} deltaTime
2374          * @param {number} currentSpeed
2375          */
        2376 updateObstacles: function(deltaTime, currentSpeed) {
            2377 // Obstacles, move to Horizon layer.
            2378
            var updatedObstacles = this.obstacles.slice(0);
            2379
            2380
            for (var i = 0; i < this.obstacles.length; i++) {
                2381
                var obstacle = this.obstacles[i];
                2382 obstacle.update(deltaTime, currentSpeed);
                2383
                2384 // Clean up existing obstacles.
                2385
                if (obstacle.remove) {
                    2386 updatedObstacles.shift();
                    2387
                }
                2388
            }
            2389 this.obstacles = updatedObstacles;
            2390
            2391
            if (this.obstacles.length > 0) {
                2392
                var lastObstacle = this.obstacles[this.obstacles.length - 1];
                2393
                2394
                if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                    2395 lastObstacle.isVisible() &&
                    2396(lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                    2397 this.dimensions.WIDTH) {
                    2398 this.addNewObstacle(currentSpeed);
                    2399 lastObstacle.followingObstacleCreated = true;
                    2400
                }
                2401
            } else {
                2402 // Create new obstacles.
                2403 this.addNewObstacle(currentSpeed);
                2404
            }
            2405
        },
        2406
        2407
        /**
2408          * Add a new obstacle.
2409          * @param {number} currentSpeed
2410          */
        2411 addNewObstacle: function(currentSpeed) {
            2412
            var obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
            2413
            var obstacleType = Obstacle.types[obstacleTypeIndex];
            2414
            2415 // Check for multiples of the same type of obstacle.
            2416 // Also check obstacle is available at current speed.
            2417
            if (this.duplicateObstacleCheck(obstacleType.type) ||
                2418 currentSpeed < obstacleType.minSpeed) {
                2419 this.addNewObstacle(currentSpeed);
                2420
            } else {
                2421
                var obstacleSpritePos = this.spritePos[obstacleType.type];
                2422
                2423 this.obstacles.push(new Obstacle(this.canvasCtx, obstacleType,
                    2424 obstacleSpritePos, this.dimensions,
                    2425 this.gapCoefficient, currentSpeed));
                2426
                2427 this.obstacleHistory.unshift(obstacleType.type);
                2428
                2429
                if (this.obstacleHistory.length > 1) {
                    2430 this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
                    2431
                }
                2432
            }
            2433
        },
        2434
        2435
        /**
2436          * Returns whether the previous two obstacles are the same as the next one.
2437          * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
2438          * @return {boolean}
2439          */
        2440 duplicateObstacleCheck: function(nextObstacleType) {
            2441
            var duplicateCount = 0;
            2442
            2443
            for (var i = 0; i < this.obstacleHistory.length; i++) {
                2444 duplicateCount = this.obstacleHistory[i] == nextObstacleType ?
                    2445 duplicateCount + 1 : 0;
                2446
            }
            2447
            return duplicateCount >= Runner.config.MAX_OBSTACLE_DUPLICATION;
            2448
        },
        2449
        2450
        /**
2451          * Reset the horizon layer.
2452          * Remove existing obstacles and reposition the horizon line.
2453          */
        2454 reset: function() {
            2455 this.obstacles = [];
            2456 this.horizonLine.reset();
            2457
        },
        2458
        2459
        /**
2460          * Update the canvas width and scaling.
2461          * @param {number} width Canvas width.
2462          * @param {number} height Canvas height.
2463          */
        2464 resize: function(width, height) {
            2465 this.canvas.width = width;
            2466 this.canvas.height = height;
            2467
        },
        2468
        2469
        /**
2470          * Add a new cloud to the horizon.
2471          */
        2472 addCloud: function() {
            2473 this.clouds.push(new Cloud(this.canvas, this.spritePos.CLOUD,
                2474 this.dimensions.WIDTH));
            2475
        }
        2476
    };
    2477
})();