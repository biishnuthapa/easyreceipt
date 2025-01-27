'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Upload } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Stats {
  totalReceipts: number;
  emailReceipts: number;
  whatsappReceipts: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalReceipts: 0,
    emailReceipts: 0,
    whatsappReceipts: 0
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single();
        setProfile(data);
        if (data?.company_logo) {
          setLogoPreview(data.company_logo);
        }

        // Load receipt statistics
        const { data: receipts } = await supabase
          .from('receipts')
          .select('sent_via')
          .eq('profile_id', user.id);

        if (receipts) {
          const stats = {
            totalReceipts: receipts.length,
            emailReceipts: receipts.filter(r => r.sent_via === 'email').length,
            whatsappReceipts: receipts.filter(r => r.sent_via === 'whatsapp').length
          };
          setStats(stats);
        }
      }
    }
    loadProfile();
  }, []);

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const updates = {
      company_name: formData.get('companyName') as string,
      company_logo: logoPreview
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile?.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    setIsLoading(false);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Logo file size must be less than 5MB',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={profile.company_name || ''}
                placeholder="Enter your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                {logoPreview && (
                  <div className="h-20 w-40 border rounded-lg overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold text-lg">Total Receipts</h3>
              <p className="text-3xl font-bold">{stats.totalReceipts}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold text-lg">Email Receipts</h3>
              <p className="text-3xl font-bold">{stats.emailReceipts}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold text-lg">WhatsApp Receipts</h3>
              <p className="text-3xl font-bold">{stats.whatsappReceipts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}