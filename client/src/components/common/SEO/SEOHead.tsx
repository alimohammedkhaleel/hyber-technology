import React, { useEffect } from 'react';
import { BRANDING } from '../../../config/branding';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  productData?: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    image?: string;
    sku: string;
    isAvailable: boolean;
    brandName?: string;
  };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  productData,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = `${BRANDING.nameAr} | ${BRANDING.nameEn}`;
    const pageTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} - ${BRANDING.supervisorAr}`;
    document.title = pageTitle;

    // 2. Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Description
    const metaDesc =
      description ||
      `متجر هايبر تكنولوجي (Hyper Technology) - وجهتك المتكاملة لجميع مستلزمات الإلكترونيات والشاشات وكاميرات المراقبة والشبكات. ${BRANDING.supervisorAr}.`;
    setMetaTag('meta[name="description"]', 'name', 'description', metaDesc);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);

    // 4. Update Keywords if provided
    if (keywords) {
      setMetaTag(
        'meta[name="keywords"]',
        'name',
        'keywords',
        `hyber technology, hyper technology, هايبر تكنولوجي, باش مهندس احمد, ${keywords}`
      );
    }

    // 5. Update OG / Twitter Title
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);

    // 6. Update Canonical & OG URL
    const currentUrl = url || window.location.href;
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 7. Update Image if provided
    if (image) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
      setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }

    // 8. Inject Dynamic Product JSON-LD Schema if productData is supplied
    let productScriptTag = document.getElementById('dynamic-product-jsonld') as HTMLScriptElement | null;
    if (productData) {
      if (!productScriptTag) {
        productScriptTag = document.createElement('script');
        productScriptTag.id = 'dynamic-product-jsonld';
        productScriptTag.type = 'application/ld+json';
        document.head.appendChild(productScriptTag);
      }

      const productSchema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productData.name,
        image: productData.image || 'https://hypertechnology.store/og-image.jpg',
        description: productData.description || productData.name,
        sku: productData.sku,
        brand: {
          '@type': 'Brand',
          name: productData.brandName || 'Hyper Technology',
        },
        offers: {
          '@type': 'Offer',
          url: currentUrl,
          priceCurrency: productData.currency || 'EGP',
          price: productData.price,
          availability: productData.isAvailable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: BRANDING.nameAr,
          },
        },
      };

      productScriptTag.textContent = JSON.stringify(productSchema);
    } else if (productScriptTag) {
      productScriptTag.remove();
    }
  }, [title, description, keywords, image, url, productData]);

  return null;
};
