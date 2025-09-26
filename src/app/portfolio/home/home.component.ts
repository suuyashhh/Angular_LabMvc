import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('backgroundVideo') videoRef!: ElementRef<HTMLVideoElement>;

  ngOnInit() {
    setTimeout(() => {
      if (this.videoRef) {
        const video = this.videoRef.nativeElement;
        video.muted = true;
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error: any) => {
            console.log('Autoplay was prevented:', error);
          });
        }
      }
    }, 1000);
  }
}