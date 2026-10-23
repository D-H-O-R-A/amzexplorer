import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, any> | null;
}

const DEFAULT_TITLE = 'AMZ Explorer - Official AMZX Blockchain Explorer';
const DEFAULT_DESC = 'Official block explorer and ledger analytics engine for the AMZX Blockchain. Monitor real-time blocks, trace transactions, audit smart contracts, and track ecosystem assets.';
const BASE_URL = 'https://amzexplorer.com';
const DEFAULT_IMAGE = `${BASE_URL}/logo.png`;

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  jsonLd,
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic Page Title
    const formattedTitle = title
      ? (title.includes('AMZ Explorer') ? title : `${title} | AMZ Explorer`)
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to update or create meta tags
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    const finalDesc = description || DEFAULT_DESC;
    const finalUrl = url || `${BASE_URL}${location.pathname}${location.search}`;

    // 2. Primary Meta Tags
    setMetaTag('name', 'title', formattedTitle);
    setMetaTag('name', 'description', finalDesc);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Open Graph
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:url', finalUrl);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'AMZ Explorer');

    // 4. Twitter Card
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', image);
    setMetaTag('name', 'twitter:url', finalUrl);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalUrl);

    // 6. Optional Dynamic JSON-LD structured data
    let dynamicJsonLdScript = document.getElementById('dynamic-jsonld-seo') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!dynamicJsonLdScript) {
        dynamicJsonLdScript = document.createElement('script');
        dynamicJsonLdScript.id = 'dynamic-jsonld-seo';
        dynamicJsonLdScript.type = 'application/ld+json';
        document.head.appendChild(dynamicJsonLdScript);
      }
      dynamicJsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (dynamicJsonLdScript) {
      dynamicJsonLdScript.remove();
    }
  }, [title, description, keywords, image, url, type, jsonLd, location.pathname, location.search]);

  return null;
};

export default SEO;
