import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  constructor() { }

  /**
   * Compress an image file to target size (default 50KB)
   * @param file - The image file to compress
   * @param targetSizeKB - Target size in KB (default: 50)
   * @param maxWidth - Maximum width for the image (default: 1024)
   * @param maxHeight - Maximum height for the image (default: 1024)
   * @returns Promise<File> - Compressed image file
   */
  async compressImage(
    file: File, 
    targetSizeKB: number = 50,
    maxWidth: number = 1024,
    maxHeight: number = 1024
  ): Promise<File> {
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event: any) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try to compress to target size
          this.compressToTargetSize(
            canvas, 
            file.name, 
            targetSizeKB
          ).then(resolve).catch(reject);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress canvas to target file size by adjusting quality
   */
  private compressToTargetSize(
    canvas: HTMLCanvasElement,
    fileName: string,
    targetSizeKB: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const targetBytes = targetSizeKB * 1024;
      let quality = 0.9;
      let attempt = 0;
      const maxAttempts = 10;
      
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            // If size is acceptable or we've tried enough times
            if (blob.size <= targetBytes || attempt >= maxAttempts) {
              const compressedFile = new File(
                [blob],
                fileName,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              
              console.log(`Compression complete:
                Original target: ${targetSizeKB}KB
                Final size: ${(blob.size / 1024).toFixed(2)}KB
                Quality: ${(quality * 100).toFixed(0)}%
                Attempts: ${attempt + 1}`
              );
              
              resolve(compressedFile);
              return;
            }
            
            // Adjust quality based on how far we are from target
            const ratio = targetBytes / blob.size;
            quality *= Math.sqrt(ratio); // Use sqrt for smoother adjustment
            quality = Math.max(0.1, Math.min(0.9, quality)); // Keep between 0.1 and 0.9
            
            attempt++;
            tryCompress();
          },
          'image/jpeg',
          quality
        );
      };
      
      tryCompress();
    });
  }

  /**
   * Compress multiple images
   */
  async compressMultipleImages(
    files: File[],
    targetSizeKB: number = 50
  ): Promise<File[]> {
    const compressionPromises = files.map(file => 
      this.compressImage(file, targetSizeKB)
    );
    
    return Promise.all(compressionPromises);
  }

  /**
   * Get file size in KB
   */
  getFileSizeKB(file: File): number {
    return file.size / 1024;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }
}