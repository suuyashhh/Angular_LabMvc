import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('backgroundVideo') videoRef!: ElementRef<HTMLVideoElement>;
  
  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize any data here
  }

  ngAfterViewInit() {
    this.initializeVideo();
  }

  initializeVideo() {
    if (this.videoRef && this.videoRef.nativeElement) {
      const video = this.videoRef.nativeElement;
      
      // Set video attributes
      video.muted = true;
      video.playsInline = true;
      
      // Handle autoplay with better error handling
      const playVideo = () => {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video autoplay started successfully');
            })
            .catch((error: any) => {
              console.log('Autoplay prevented, trying muted play:', error);
              
              // If autoplay is prevented, wait for user interaction
              document.addEventListener('click', () => {
                video.play().catch(e => console.log('Still cannot play:', e));
              }, { once: true });
            });
        }
      };

      // Wait for video to be loaded
      if (video.readyState >= 3) {
        playVideo();
      } else {
        video.addEventListener('loadeddata', playVideo, { once: true });
      }
      
      // Add error handling
      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
      });
    }
  }

  // Optional: Method to handle navigation if needed
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}