import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cute-cat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cute-cat.component.html',
  styleUrl: './cute-cat.component.css'
})
export class CuteCatComponent implements OnInit, OnDestroy {
  // Cat coordinates (center of the cat)
  x = 32;
  y = 32;

  // Target coordinates (cursor/tap position)
  targetX = 0;
  targetY = 0;

  // Animation and state variables
  bgPosition = '-96px -96px'; // default idle sprite [-3, -3]
  private frameCount = 0;
  private idleTime = 0;
  private idleAnimation: string | null = null;
  private idleAnimationFrame = 0;

  private nekoSpeed = 10;
  private isBrowser = false;
  private animationFrameId?: number;
  private lastFrameTimestamp = 0;
  private hasMouseMoved = false;

  // Alternating cat GIF — toggles between the two variants on each page refresh
  private readonly catGifs = [
    'assets/img/oneko.gif',
    'assets/img/oneko-tora.gif'
  ];
  catGifUrl = this.catGifs[0];

  // Sprite coordinate grid mapping (multiplied by 32px)
  private spriteSets: { [key: string]: number[][] } = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Toggle cat GIF on each page load using localStorage
    const STORAGE_KEY = 'neko-cat-index';
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentIndex = stored === '1' ? 1 : 0;
    this.catGifUrl = this.catGifs[currentIndex];
    // Flip for next refresh
    localStorage.setItem(STORAGE_KEY, currentIndex === 0 ? '1' : '0');

    // Set initial position to center of viewport
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // Start requestAnimationFrame loop
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.hasMouseMoved = true;
    this.targetX = event.clientX;
    this.targetY = event.clientY;
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.hasMouseMoved = true;
      this.targetX = event.touches[0].clientX;
      this.targetY = event.touches[0].clientY;
    }
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.hasMouseMoved = true;
      this.targetX = event.touches[0].clientX;
      this.targetY = event.touches[0].clientY;
    }
  }

  private loop(timestamp: number): void {
    if (!this.isBrowser) return;

    // Throttle frames to every 100ms for classic pixelated low-framerate movement
    if (!this.lastFrameTimestamp) {
      this.lastFrameTimestamp = timestamp;
    }

    if (timestamp - this.lastFrameTimestamp > 100) {
      this.lastFrameTimestamp = timestamp;
      this.frame();
    }

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private setSprite(name: string, frame: number): void {
    const set = this.spriteSets[name] || this.spriteSets['idle'];
    const sprite = set[frame % set.length];
    this.bgPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  private resetIdleAnimation(): void {
    this.idleAnimation = null;
    this.idleAnimationFrame = 0;
  }

  private idle(): void {
    this.idleTime += 1;

    // Trigger random idle animations (sleeping, scratching) every ~20 seconds of idle
    if (
      this.idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      this.idleAnimation === null
    ) {
      const availableIdleAnimations = ['sleeping', 'scratchSelf'];
      if (this.x < 32) {
        availableIdleAnimations.push('scratchWallW');
      }
      if (this.y < 32) {
        availableIdleAnimations.push('scratchWallN');
      }
      if (this.x > window.innerWidth - 32) {
        availableIdleAnimations.push('scratchWallE');
      }
      if (this.y > window.innerHeight - 32) {
        availableIdleAnimations.push('scratchWallS');
      }
      this.idleAnimation =
        availableIdleAnimations[
          Math.floor(Math.random() * availableIdleAnimations.length)
        ];
    }

    switch (this.idleAnimation) {
      case 'sleeping':
        if (this.idleAnimationFrame < 8) {
          this.setSprite('tired', 0);
          break;
        }
        this.setSprite('sleeping', Math.floor(this.idleAnimationFrame / 4));
        if (this.idleAnimationFrame > 192) {
          this.resetIdleAnimation();
        }
        break;
      case 'scratchWallN':
      case 'scratchWallS':
      case 'scratchWallE':
      case 'scratchWallW':
      case 'scratchSelf':
        this.setSprite(this.idleAnimation, this.idleAnimationFrame);
        if (this.idleAnimationFrame > 9) {
          this.resetIdleAnimation();
        }
        break;
      default:
        this.setSprite('idle', 0);
        return;
    }
    this.idleAnimationFrame += 1;
  }

  private frame(): void {
    // If the mouse hasn't moved yet, we keep the cat in idle state at starting position
    if (!this.hasMouseMoved) {
      this.setSprite('idle', 0);
      return;
    }

    this.frameCount += 1;
    const diffX = this.x - this.targetX;
    const diffY = this.y - this.targetY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // If close enough to target, switch to idle animations
    if (distance < this.nekoSpeed || distance < 48) {
      this.idle();
      return;
    }

    this.resetIdleAnimation();

    // Alert reaction before moving
    if (this.idleTime > 1) {
      this.setSprite('alert', 0);
      // Count down alert phase
      this.idleTime = Math.min(this.idleTime, 7);
      this.idleTime -= 1;
      return;
    }

    // Determine direction code (N, NE, E, SE, S, SW, W, NW)
    let direction = '';
    direction = diffY / distance > 0.5 ? 'N' : '';
    direction += diffY / distance < -0.5 ? 'S' : '';
    direction += diffX / distance > 0.5 ? 'W' : '';
    direction += diffX / distance < -0.5 ? 'E' : '';
    
    this.setSprite(direction, this.frameCount);

    // Translate position towards target
    this.x -= (diffX / distance) * this.nekoSpeed;
    this.y -= (diffY / distance) * this.nekoSpeed;

    // Viewport boundaries clamping
    this.x = Math.min(Math.max(16, this.x), window.innerWidth - 16);
    this.y = Math.min(Math.max(16, this.y), window.innerHeight - 16);
  }
}
