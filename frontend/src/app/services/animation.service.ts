import { Injectable } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class AnimationService {

  /** Animate sidebar entrance — slides in from the left */
  sidebarIn(el: HTMLElement): void {
    gsap.fromTo(el,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
    );
  }

  /** Animate page banner — slides down from top */
  bannerIn(el: HTMLElement): void {
    gsap.fromTo(el,
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }

  /** Stagger-animate a list of elements (cards, rows, steps) */
  staggerIn(
    els: HTMLElement[],
    { y = 22, delay = 0, stagger = 0.07, duration = 0.45 } = {}
  ): void {
    gsap.fromTo(els,
      { y, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        duration, stagger,
        delay,
        ease: 'power3.out',
        clearProps: 'transform'
      }
    );
  }

  /** Fade + slide up a single element */
  fadeUp(el: HTMLElement, delay = 0): void {
    gsap.fromTo(el,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, delay, ease: 'power3.out', clearProps: 'transform' }
    );
  }

  /** Counter animation for stat values */
  countUp(el: HTMLElement, target: number, duration = 1.2): void {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val).toString(); }
    });
  }

  /** Tab-switch page transition — quick fade + slide up */
  pageTransition(container: HTMLElement): gsap.core.Tween {
    return gsap.fromTo(container,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out', clearProps: 'transform' }
    );
  }

  /** Hover pulse on nav items */
  navHoverIn(el: HTMLElement): void {
    gsap.to(el, { x: 3, duration: 0.18, ease: 'power2.out' });
  }
  navHoverOut(el: HTMLElement): void {
    gsap.to(el, { x: 0, duration: 0.18, ease: 'power2.out' });
  }
}
