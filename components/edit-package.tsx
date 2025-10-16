import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, SafeAreaView } from 'react-native';
import CreatePackageComponent from './create-package';
import { GuideService, PackageListItem } from '../services/guide';
import { API_CONFIG } from '../services/config';
import { Colors } from '../constants/Colors';

type EditPackageProps = {
  idOrSlug: string;
  onClose?: () => void;
};

// Helper to absolutize image URLs
const toAbsoluteUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_CONFIG.BASE_URL?.replace(/\/$/, '') || '';
  const path = url.startsWith('/') ? url : `/${url}`;
  // Route through API gateway under /api/guide to reach guide-service static assets
  return `${base}/api/guide${path}`;
};

export default function EditPackageComponent({ idOrSlug, onClose }: EditPackageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<PackageListItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await GuideService.getPackage(idOrSlug);
        if (!mounted) return;
        setPkg(res?.data || null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load package');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [idOrSlug]);

  const defaultValues = useMemo(() => {
    if (!pkg) return undefined;
    const durationValue = pkg.duration?.value || pkg.durationDays || 1;
    const durationUnit = pkg.duration?.unit || 'days';
    const includes = (pkg as any).includes || [];
    const excludes = (pkg as any).excludes || [];
    const highlights = (pkg as any).highlights || [];
    const requirements = (pkg as any).requirements || [];
    const policies = (pkg as any).policies || {};
    const images = Array.isArray(pkg.images) ? pkg.images.map((u) => toAbsoluteUrl(u)!) : [];
    const coverImage = toAbsoluteUrl((pkg as any).coverImage) || '';

    return {
      name: pkg.title,
      description: pkg.description || '',
      details: (pkg as any).details || '',
      // duration string not used; value + unit drive the UI
      duration: '',
      durationValue,
      durationUnit,
      price: String(pkg.pricing?.amount ?? ''),
      currency: pkg.pricing?.currency || 'LKR',
      perPerson: !!pkg.pricing?.perPerson,
      maxGroupSize: pkg.maxGroupSize ? String(pkg.maxGroupSize) : '',
      difficulty: (pkg as any).difficulty || 'Easy',
      category: (pkg.tags && pkg.tags[0]) as any || 'Cultural',
      coverImage,
      images,
      highlights,
      included: includes,
      excluded: excludes,
      itinerary: ((pkg as any).itinerary || []).map((it: any) => {
        const desc = it?.description || '';
        const [time, location] = desc.includes(' @ ') ? desc.split(' @ ') : ['', desc];
        return { time: time || '', activity: it?.title || '', location: location || '' };
      }),
      meetingPoint: policies.meetingPoint || '',
      freeCancellation: !!policies.freeCancellation,
      freeCancellationWindow: policies.freeCancellationWindow || 'anytime',
      otherPolicies: policies.text || '',
      languages: ['English'],
      requirements,
      isActive: !!pkg.isActive,
    } as any;
  }, [pkg]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary600} />
        <Text style={{ marginTop: 12, color: Colors.secondary600 }}>Loading package…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: Colors.error, textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!pkg) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: Colors.secondary600 }}>Package not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <CreatePackageComponent
      onClose={onClose}
      idOrSlug={String(pkg._id || pkg.slug)}
      defaultValues={defaultValues}
    />
  );
}
