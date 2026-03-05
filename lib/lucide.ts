import {
  ArrowRight,
  Bath,
  Bed,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Info,
  Instagram,
  Lightbulb,
  Linkedin,
  Leaf,
  Megaphone,
  Map,
  MapPin,
  Mail,
  MessageCircle,
  Music,
  Pin,
  Play,
  Scale,
  Sparkles,
  Star,
  Users,
  Handshake,
  Youtube
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const registry: Record<string, LucideIcon> = {
  ArrowRight,
  Bath,
  Bed,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Info,
  Instagram,
  Lightbulb,
  Linkedin,
  Leaf,
  Megaphone,
  Map,
  MapPin,
  Mail,
  MessageCircle,
  Music,
  Pin,
  Play,
  Scale,
  Sparkles,
  Star,
  Users,
  Handshake,
  Youtube
};

export function getLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  return registry[name] || null;
}

