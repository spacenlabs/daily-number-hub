import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebsiteConfig {
  id: string;
  site_title: string;
  site_description: string | null;
  site_favicon: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  meta_keywords: string | null;
  meta_author: string | null;
}

interface ThemeSettings {
  id: string;
  theme_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  font_size_base: string;
  border_radius: string;
  is_active: boolean;
}

interface PageSection {
  id: string;
  section_type: string;
  section_name: string;
  content: any;
  is_visible: boolean;
  sort_order: number;
  page_path: string;
}

interface CustomCSS {
  id: string;
  css_name: string;
  css_content: string;
  is_active: boolean;
}

export const useWebsiteConfig = () => {
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [customCSS, setCustomCSS] = useState<CustomCSS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      
      // Fetch website config
      const { data: configData, error: configError } = await supabase
        .from('website_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Fetch active theme
      const { data: themeData, error: themeError } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (themeError && themeError.code !== 'PGRST116') {
        throw themeError;
      }

      // Fetch page sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('page_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (sectionsError) {
        throw sectionsError;
      }

      // Fetch custom CSS
      const { data: cssData, error: cssError } = await supabase
        .from('custom_css')
        .select('*')
        .eq('is_active', true);

      if (cssError) {
        throw cssError;
      }

      setConfig(configData);
      setTheme(themeData);
      setSections(sectionsData || []);
      setCustomCSS(cssData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<WebsiteConfig>) => {
    try {
      if (!config) return;

      const { data, error } = await supabase
        .from('website_config')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
      throw err;
    }
  };

  const updateTheme = async (updates: Partial<ThemeSettings>) => {
    try {
      if (!theme) return;

      const { data, error } = await supabase
        .from('theme_settings')
        .update(updates)
        .eq('id', theme.id)
        .select()
        .single();

      if (error) throw error;

      setTheme(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
      throw err;
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<PageSection>) => {
    try {
      const { data, error } = await supabase
        .from('page_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) throw error;

      setSections(sections.map(section => 
        section.id === sectionId ? data : section
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
      throw err;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    theme,
    sections,
    customCSS,
    loading,
    error,
    updateConfig,
    updateTheme,
    updateSection,
    refetch: fetchConfig
  };
};