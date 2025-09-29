import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWebsiteConfig } from '@/hooks/useWebsiteConfig';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Layout, 
  Code, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  Monitor,
  Smartphone
} from 'lucide-react';

export const WebsiteBuilder = () => {
  const { 
    config, 
    theme, 
    sections, 
    loading, 
    error, 
    updateConfig, 
    updateTheme, 
    updateSection,
    refetch 
  } = useWebsiteConfig();
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  const handleSaveConfig = async (formData: FormData) => {
    try {
      setSaving(true);
      const updates = {
        site_title: formData.get('site_title') as string,
        site_description: formData.get('site_description') as string,
        contact_email: formData.get('contact_email') as string,
        contact_phone: formData.get('contact_phone') as string,
        social_facebook: formData.get('social_facebook') as string,
        social_twitter: formData.get('social_twitter') as string,
        social_instagram: formData.get('social_instagram') as string,
        social_linkedin: formData.get('social_linkedin') as string,
        meta_keywords: formData.get('meta_keywords') as string,
      };

      await updateConfig(updates);
      toast({
        title: "Settings saved",
        description: "Website configuration has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save website configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async (formData: FormData) => {
    try {
      setSaving(true);
      const updates = {
        primary_color: formData.get('primary_color') as string,
        secondary_color: formData.get('secondary_color') as string,
        accent_color: formData.get('accent_color') as string,
        background_color: formData.get('background_color') as string,
        text_color: formData.get('text_color') as string,
        font_family: formData.get('font_family') as string,
        font_size_base: formData.get('font_size_base') as string,
        border_radius: formData.get('border_radius') as string,
      };

      await updateTheme(updates);
      toast({
        title: "Theme saved",
        description: "Theme settings have been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save theme settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionVisibility = async (sectionId: string, isVisible: boolean) => {
    try {
      await updateSection(sectionId, { is_visible: isVisible });
      toast({
        title: "Section updated",
        description: `Section visibility has been ${isVisible ? 'enabled' : 'disabled'}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update section visibility.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading website configuration: {error}</p>
        <Button onClick={refetch} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Website Builder</h2>
          <p className="text-muted-foreground">
            Customize your website appearance and content
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Site Settings
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme & Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout Manager
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveConfig(formData);
          }}>
            <Card>
              <CardHeader>
                <CardTitle>Site Configuration</CardTitle>
                <CardDescription>
                  Configure your website's basic information and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Site Title</Label>
                    <Input
                      id="site_title"
                      name="site_title"
                      defaultValue={config?.site_title || ''}
                      placeholder="Your site title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      defaultValue={config?.contact_email || ''}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_description">Site Description</Label>
                  <Textarea
                    id="site_description"
                    name="site_description"
                    defaultValue={config?.site_description || ''}
                    placeholder="Describe your website"
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Social Media Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="social_facebook">Facebook</Label>
                      <Input
                        id="social_facebook"
                        name="social_facebook"
                        defaultValue={config?.social_facebook || ''}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_twitter">Twitter</Label>
                      <Input
                        id="social_twitter"
                        name="social_twitter"
                        defaultValue={config?.social_twitter || ''}
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_instagram">Instagram</Label>
                      <Input
                        id="social_instagram"
                        name="social_instagram"
                        defaultValue={config?.social_instagram || ''}
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_linkedin">LinkedIn</Label>
                      <Input
                        id="social_linkedin"
                        name="social_linkedin"
                        defaultValue={config?.social_linkedin || ''}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">SEO Keywords</Label>
                  <Input
                    id="meta_keywords"
                    name="meta_keywords"
                    defaultValue={config?.meta_keywords || ''}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="theme">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveTheme(formData);
          }}>
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize your website's colors, fonts, and visual styling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Color Scheme</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          name="primary_color"
                          type="color"
                          defaultValue={theme?.primary_color?.includes('hsl') ? '#3b82f6' : theme?.primary_color || '#3b82f6'}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          defaultValue={theme?.primary_color || 'hsl(220, 100%, 50%)'}
                          placeholder="hsl(220, 100%, 50%)"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          name="secondary_color"
                          type="color"
                          defaultValue={theme?.secondary_color?.includes('hsl') ? '#f1f5f9' : theme?.secondary_color || '#f1f5f9'}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          defaultValue={theme?.secondary_color || 'hsl(220, 50%, 90%)'}
                          placeholder="hsl(220, 50%, 90%)"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent_color"
                          name="accent_color"
                          type="color"
                          defaultValue={theme?.accent_color?.includes('hsl') ? '#a855f7' : theme?.accent_color || '#a855f7'}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          defaultValue={theme?.accent_color || 'hsl(280, 100%, 70%)'}
                          placeholder="hsl(280, 100%, 70%)"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Typography</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="font_family">Font Family</Label>
                      <Input
                        id="font_family"
                        name="font_family"
                        defaultValue={theme?.font_family || 'system-ui'}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="font_size_base">Base Font Size</Label>
                      <Input
                        id="font_size_base"
                        name="font_size_base"
                        defaultValue={theme?.font_size_base || '16px'}
                        placeholder="16px"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="border_radius">Border Radius</Label>
                  <Input
                    id="border_radius"
                    name="border_radius"
                    defaultValue={theme?.border_radius || '0.5rem'}
                    placeholder="0.5rem"
                    className="max-w-xs"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Theme'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout Manager</CardTitle>
              <CardDescription>
                Control which sections are visible and manage their content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{section.section_name}</h4>
                      <Badge variant="outline">{section.section_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Page: {section.page_path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.is_visible ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={section.is_visible}
                      onCheckedChange={(checked) => 
                        toggleSectionVisibility(section.id, checked)
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize your website's appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="/* Add your custom CSS here */&#10;.my-custom-class {&#10;  color: var(--primary);&#10;}"
                rows={10}
                className="font-mono"
              />
              <Button className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Custom CSS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};