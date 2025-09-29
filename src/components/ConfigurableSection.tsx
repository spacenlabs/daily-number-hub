import React from 'react';
import { useWebsiteConfigContext } from '@/contexts/WebsiteConfigProvider';

interface ConfigurableSectionProps {
  sectionType: string;
  sectionName?: string;
  pagePath?: string;
  fallbackContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ConfigurableSection: React.FC<ConfigurableSectionProps> = ({
  sectionType,
  sectionName,
  pagePath = '/',
  fallbackContent,
  children,
  className = ''
}) => {
  const { sections, loading } = useWebsiteConfigContext();

  // Find the matching section configuration
  const sectionConfig = sections.find(
    section => 
      section.section_type === sectionType && 
      section.page_path === pagePath &&
      (sectionName ? section.section_name === sectionName : true)
  );

  // Show loading state while configuration is loading
  if (loading) {
    return fallbackContent ? <>{fallbackContent}</> : <div className="animate-pulse bg-muted h-20 rounded" />;
  }

  // If section is found and is not visible, don't render
  if (sectionConfig && !sectionConfig.is_visible) {
    return null;
  }

  // If section is found and visible, or no specific config found (default to visible)
  const shouldRender = !sectionConfig || sectionConfig.is_visible;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Hook to get section content from configuration
export const useSectionContent = (sectionType: string, pagePath: string = '/') => {
  const { sections, loading } = useWebsiteConfigContext();
  
  const sectionConfig = sections.find(
    section => 
      section.section_type === sectionType && 
      section.page_path === pagePath
  );

  return {
    content: sectionConfig?.content || {},
    isVisible: sectionConfig?.is_visible ?? true,
    loading
  };
};