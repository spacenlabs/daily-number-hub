import React, { createContext, useContext, useEffect } from 'react';
import { useWebsiteConfig } from '@/hooks/useWebsiteConfig';

interface WebsiteConfigContextType {
  config: any;
  theme: any;
  sections: any[];
  customCSS: any[];
  loading: boolean;
  error: string | null;
}

const WebsiteConfigContext = createContext<WebsiteConfigContextType | undefined>(undefined);

export const WebsiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const websiteData = useWebsiteConfig();

  // Apply theme settings to CSS variables
  useEffect(() => {
    if (websiteData.theme && !websiteData.loading) {
      const root = document.documentElement;
      
      // Apply theme colors to CSS variables
      if (websiteData.theme.primary_color) {
        root.style.setProperty('--primary-custom', websiteData.theme.primary_color);
      }
      if (websiteData.theme.secondary_color) {
        root.style.setProperty('--secondary-custom', websiteData.theme.secondary_color);
      }
      if (websiteData.theme.accent_color) {
        root.style.setProperty('--accent-custom', websiteData.theme.accent_color);
      }
      if (websiteData.theme.background_color) {
        root.style.setProperty('--background-custom', websiteData.theme.background_color);
      }
      if (websiteData.theme.text_color) {
        root.style.setProperty('--foreground-custom', websiteData.theme.text_color);
      }
      if (websiteData.theme.font_family) {
        root.style.setProperty('--font-family-custom', websiteData.theme.font_family);
        document.body.style.fontFamily = websiteData.theme.font_family;
      }
      if (websiteData.theme.font_size_base) {
        root.style.setProperty('--font-size-base-custom', websiteData.theme.font_size_base);
      }
      if (websiteData.theme.border_radius) {
        root.style.setProperty('--border-radius-custom', websiteData.theme.border_radius);
      }
    }
  }, [websiteData.theme, websiteData.loading]);

  // Apply website config to document head
  useEffect(() => {
    if (websiteData.config && !websiteData.loading) {
      // Update document title
      if (websiteData.config.site_title) {
        document.title = websiteData.config.site_title;
      }

      // Update meta description
      if (websiteData.config.site_description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', websiteData.config.site_description);
      }

      // Update meta keywords
      if (websiteData.config.meta_keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', websiteData.config.meta_keywords);
      }

      // Update meta author
      if (websiteData.config.meta_author) {
        let metaAuthor = document.querySelector('meta[name="author"]');
        if (!metaAuthor) {
          metaAuthor = document.createElement('meta');
          metaAuthor.setAttribute('name', 'author');
          document.head.appendChild(metaAuthor);
        }
        metaAuthor.setAttribute('content', websiteData.config.meta_author);
      }

      // Update favicon if provided
      if (websiteData.config.site_favicon) {
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.setAttribute('rel', 'icon');
          document.head.appendChild(favicon);
        }
        favicon.setAttribute('href', websiteData.config.site_favicon);
      }
    }
  }, [websiteData.config, websiteData.loading]);

  // Apply custom CSS
  useEffect(() => {
    if (websiteData.customCSS && websiteData.customCSS.length > 0) {
      // Remove existing custom style elements
      const existingStyles = document.querySelectorAll('style[data-custom-css]');
      existingStyles.forEach(style => style.remove());

      // Add new custom styles
      websiteData.customCSS.forEach(css => {
        if (css.is_active) {
          const styleElement = document.createElement('style');
          styleElement.setAttribute('data-custom-css', css.id);
          styleElement.textContent = css.css_content;
          document.head.appendChild(styleElement);
        }
      });
    }
  }, [websiteData.customCSS]);

  return (
    <WebsiteConfigContext.Provider value={websiteData}>
      {children}
    </WebsiteConfigContext.Provider>
  );
};

export const useWebsiteConfigContext = () => {
  const context = useContext(WebsiteConfigContext);
  if (context === undefined) {
    throw new Error('useWebsiteConfigContext must be used within a WebsiteConfigProvider');
  }
  return context;
};