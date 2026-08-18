import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  setSeoData(data: {
    title: string;
    description: string;
    url: string;
    image: string;
    type?: string;
    schema?: any;
  }) {
    // 1. Set Title
    this.title.setTitle(data.title);

    // 2. Set Meta Description (must be under 160 characters)
    this.meta.updateTag({ name: 'description', content: data.description });

    // 3. Set Open Graph (OG) Meta Tags
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image', content: data.image });
    this.meta.updateTag({ property: 'og:url', content: data.url });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });

    // 4. Set Twitter Card Meta Tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image });

    // 5. Update/Inject Canonical Link Tag
    this.updateCanonicalLink(data.url);

    // 6. Update/Inject JSON-LD Structured Data
    if (data.schema) {
      this.updateJsonLd(data.schema);
    } else {
      this.removeJsonLd();
    }
  }

  private updateCanonicalLink(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private updateJsonLd(schema: any) {
    let script: HTMLScriptElement | null = this.document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }

  private removeJsonLd() {
    const script = this.document.querySelector('script[type="application/ld+json"]');
    if (script) {
      script.remove();
    }
  }
}
