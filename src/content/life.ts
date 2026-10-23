/**
 * Personal photos for the off-the-clock board. Add real photos here (files in public/images/life/);
 * each one is pinned at `left`/`top` percentages of the board on desktop and stacks on phones.
 */
export interface LifePhoto {
  src: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
  left: number;
  top: number;
  rotate: number;
}

export const lifePhotos: LifePhoto[] = [];
