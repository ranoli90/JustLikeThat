import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  primaryFont: string;
  secondaryFont: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  customCss: string | null;
  customJs: string | null;
}

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Nunito', label: 'Nunito' },
];

const THEMES = [
  { id: 'default', name: 'Default Blue', primary: '#3B82F6', secondary: '#10B981' },
  { id: 'corporate', name: 'Corporate Blue', primary: '#1E40AF', secondary: '#3B82F6' },
  { id: 'modern', name: 'Modern Purple', primary: '#7C3AED', secondary: '#A855F7' },
  { id: 'nature', name: 'Nature Green', primary: '#059669', secondary: '#10B981' },
  { id: 'dark', name: 'Dark Mode', primary: '#111827', secondary: '#374151' },
];

export const BrandingEditor: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'assets' | 'custom'>('colors');

  useEffect(() => {
    loadBranding();
  }, [tenantId]);

  const loadBranding = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenantId}/branding`);
      const data = await response.json();
      setBranding({
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#10B981',
        accentColor: data.accentColor || '#F59E0B',
        backgroundColor: data.backgroundColor || '#FFFFFF',
        textColor: data.textColor || '#1F2937',
        primaryFont: data.primaryFont || 'Inter',
        secondaryFont: data.secondaryFont || 'Roboto',
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        customCss: data.customCss,
        customJs: data.customJs,
      });
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      await fetch(`/api/v1/tenants/${tenantId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
    } catch (err) {
      console.error('Failed to save branding:', err);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = async (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme && branding) {
      const updated: BrandingConfig = {
        ...branding,
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
      };
      setBranding(updated);
    }
  };

  const handleColorChange = (key: keyof BrandingConfig, value: string) => {
    setBranding(prev => (prev ? { ...prev, [key]: value } : null));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Branding Editor</h1>
        <Button onClick={saveBranding} loading={saving}>
          Save Changes
        </Button>
      </div>

      {/* Theme Quick Select */}
      <Card className="mb-6 p-4">
        <h3 className="mb-3 font-semibold">Quick Themes</h3>
        <div className="flex gap-2">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              <div className="size-6 rounded-full" style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
              }} />
              <span className="text-sm">{theme.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b">
        {(['colors', 'typography', 'assets', 'custom'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <Card className="space-y-4 p-4">
          {[
            { key: 'primaryColor', label: 'Primary Color' },
            { key: 'secondaryColor', label: 'Secondary Color' },
            { key: 'accentColor', label: 'Accent Color' },
            { key: 'backgroundColor', label: 'Background Color' },
            { key: 'textColor', label: 'Text Color' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium">{label}</label>
              <input
                type="color"
                value={branding?.[key as keyof BrandingConfig] || '#000000'}
                onChange={(e) => handleColorChange(key as keyof BrandingConfig, e.target.value)}
                className="size-10 cursor-pointer rounded"
              />
              <Input
                value={branding?.[key as keyof BrandingConfig] || ''}
                onChange={(e) => handleColorChange(key as keyof BrandingConfig, e.target.value)}
                className="w-24"
              />
            </div>
          ))}
        </Card>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">Primary Font</label>
            <select
              value={branding?.primaryFont || 'Inter'}
              onChange={(e) => setBranding(prev => (prev ? { ...prev, primaryFont: e.target.value } : null))}
              className="rounded border px-3 py-2"
            >
              {FONTS.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">Secondary Font</label>
            <select
              value={branding?.secondaryFont || 'Roboto'}
              onChange={(e) => setBranding(prev => (prev ? { ...prev, secondaryFont: e.target.value } : null))}
              className="rounded border px-3 py-2"
            >
              {FONTS.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <Card className="space-y-4 p-4">
          {[
            { key: 'logoUrl', label: 'Logo', type: 'logo' },
            { key: 'faviconUrl', label: 'Favicon', type: 'favicon' },
          ].map(({ key, label, type }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium">{label}</label>
              {branding?.[key as keyof BrandingConfig] ? (
                <div className="flex items-center gap-2">
                  <img
                    src={branding[key as keyof BrandingConfig] as string || ''}
                    alt={label}
                    className="h-10"
                  />
                  <Button variant="outline" size="sm">Replace</Button>
                </div>
              ) : (
                <Button variant="outline">Upload {label}</Button>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Custom Code Tab */}
      {activeTab === 'custom' && (
        <Card className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Custom CSS</label>
            <textarea
              value={branding?.customCss || ''}
              onChange={(e) => setBranding(prev => (prev ? { ...prev, customCss: e.target.value } : null))}
              className="h-32 w-full rounded border p-3 font-mono text-sm"
              placeholder="/* Your custom CSS here */"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Custom JavaScript</label>
            <textarea
              value={branding?.customJs || ''}
              onChange={(e) => setBranding(prev => (prev ? { ...prev, customJs: e.target.value } : null))}
              className="h-32 w-full rounded border p-3 font-mono text-sm"
              placeholder="// Your custom JavaScript here"
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default BrandingEditor;
