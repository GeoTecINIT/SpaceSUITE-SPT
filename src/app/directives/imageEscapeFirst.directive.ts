import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[appImageEscapeFirst]',
  standalone: true
})
export class ImageEscapeFirstDirective implements OnInit, OnDestroy {
  private document = inject(DOCUMENT);

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    const imageMask = this.document.querySelector('.p-image-mask');
    if (!imageMask) return;

    const closeButton = imageMask.querySelector<HTMLButtonElement>(
      '.p-image-close-button'
    );

    if (!closeButton) return;

    // Close the image preview using PrimeNG's own close handler.
    closeButton.click();

    // Keep this Escape event away from PrimeNG's document listeners.
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  ngOnInit() {
    this.document.addEventListener('keydown', this.onKeydown, true);
  }

  ngOnDestroy() {
    this.document.removeEventListener('keydown', this.onKeydown, true);
  }
}