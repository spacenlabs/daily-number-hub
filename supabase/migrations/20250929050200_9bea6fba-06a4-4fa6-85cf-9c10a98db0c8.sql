-- Create website configuration tables for Website Builder

-- Website general configuration
CREATE TABLE public.website_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Results Management System',
  site_description TEXT DEFAULT 'Professional results management and tracking system',
  site_favicon TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  meta_keywords TEXT,
  meta_author TEXT DEFAULT 'Results Management System',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theme and styling settings
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_name TEXT NOT NULL DEFAULT 'default',
  primary_color TEXT NOT NULL DEFAULT 'hsl(220, 100%, 50%)',
  secondary_color TEXT NOT NULL DEFAULT 'hsl(220, 50%, 90%)',
  accent_color TEXT NOT NULL DEFAULT 'hsl(280, 100%, 70%)',
  background_color TEXT NOT NULL DEFAULT 'hsl(220, 15%, 5%)',
  text_color TEXT NOT NULL DEFAULT 'hsl(220, 10%, 95%)',
  font_family TEXT NOT NULL DEFAULT 'system-ui',
  font_size_base TEXT NOT NULL DEFAULT '16px',
  border_radius TEXT NOT NULL DEFAULT '0.5rem',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Page sections configuration
CREATE TABLE public.page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'banner', 'footer', etc.
  section_name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  page_path TEXT NOT NULL DEFAULT '/', -- which page this section belongs to
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Custom CSS storage
CREATE TABLE public.custom_css (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  css_name TEXT NOT NULL,
  css_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.website_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_css ENABLE ROW LEVEL SECURITY;

-- Create policies for website_config
CREATE POLICY "Website config is publicly readable" 
ON public.website_config 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage website config" 
ON public.website_config 
FOR ALL 
USING (is_admin());

-- Create policies for theme_settings
CREATE POLICY "Theme settings are publicly readable" 
ON public.theme_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage theme settings" 
ON public.theme_settings 
FOR ALL 
USING (is_admin());

-- Create policies for page_sections
CREATE POLICY "Page sections are publicly readable" 
ON public.page_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage page sections" 
ON public.page_sections 
FOR ALL 
USING (is_admin());

-- Create policies for custom_css
CREATE POLICY "Custom CSS is publicly readable" 
ON public.custom_css 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage custom CSS" 
ON public.custom_css 
FOR ALL 
USING (is_admin());

-- Insert default website configuration
INSERT INTO public.website_config (site_title, site_description, meta_author) 
VALUES ('Results Management System', 'Professional results management and tracking system', 'Results Management System');

-- Insert default theme
INSERT INTO public.theme_settings (theme_name, is_active) 
VALUES ('Default Theme', true);

-- Insert default page sections
INSERT INTO public.page_sections (section_type, section_name, content, page_path) VALUES
('hero', 'Main Hero Section', '{"title": "Results Management System", "subtitle": "Professional tracking and management", "description": "Track and manage your results efficiently"}', '/'),
('footer', 'Main Footer', '{"text": "© 2024 Results Management System. All rights reserved.", "links": []}', '/');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_website_config_updated_at
BEFORE UPDATE ON public.website_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at
BEFORE UPDATE ON public.page_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_css_updated_at
BEFORE UPDATE ON public.custom_css
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();