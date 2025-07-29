import { CountryData, MapPin, ActivityItem, StatusColors } from '@/types';

export const countries: Record<string, CountryData> = {
  US: { name: 'United States', code: 'US', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  CA: { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  IN: { name: 'India', code: 'IN', flag: '🇮🇳' },
  AE: { name: 'UAE', code: 'AE', flag: '🇦🇪' },
  FR: { name: 'France', code: 'FR', flag: '🇫🇷' },
  AU: { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  JP: { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  DE: { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  PK: { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  OM: { name: 'Oman', code: 'OM', flag: '🇴🇲' },
  QA: { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  IT: { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  ES: { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  NL: { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  CH: { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  BE: { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  AT: { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  SE: { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  NO: { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  DK: { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  FI: { name: 'Finland', code: 'FI', flag: '🇫🇮' },
  PT: { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  IE: { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  NZ: { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  ZA: { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  SG: { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  KR: { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  TH: { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
  MY: { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  ID: { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  PH: { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  VN: { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  SA: { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  EG: { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  TR: { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  RU: { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  PL: { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  CZ: { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  HU: { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
  BR: { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  MX: { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  AR: { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  CL: { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  CO: { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  CN: { name: 'China', code: 'CN', flag: '🇨🇳' },
  BD: { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  LK: { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  NP: { name: 'Nepal', code: 'NP', flag: '🇳🇵' },
  KW: { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  BH: { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  JO: { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
  LB: { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  IL: { name: 'Israel', code: 'IL', flag: '🇮🇱' },
  IR: { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  AF: { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  NG: { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  KE: { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  GH: { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  MA: { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  DZ: { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  TN: { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  ET: { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
};

export const mapPins: MapPin[] = [];

export const recentActivities: ActivityItem[] = [];

export const statusColors: StatusColors = {
  'Completed': {
    bg: 'bg-green-100',
    text: 'text-green-800',
    progress: 'bg-green-500'
  },
  'In Progress': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    progress: 'bg-blue-500'
  },
  'Planning': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    progress: 'bg-orange-500'
  },
  'Testing': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    progress: 'bg-purple-500'
  },
  'Review': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    progress: 'bg-indigo-500'
  },
  'On Hold': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    progress: 'bg-red-500'
  }
};
