import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { error } from 'node:console';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
 @ViewChild('backgroundVideo') videoRef!: ElementRef<HTMLVideoElement>;

  ngOnInit() {
    // Try to play video after component initialization
    setTimeout(() => {
      if (this.videoRef) {
        const video = this.videoRef.nativeElement;
        video.muted = true;
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error:any) => {
            console.log('Autoplay was prevented:', error);
            // Show a play button or handle the case where autoplay is blocked
          });
        }
      }
    }, 1000);
  }
}
