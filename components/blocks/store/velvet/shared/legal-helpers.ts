import type { ElementType } from "react"
import {
  Building2,
  ChartBar,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  HardDrive,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  Scale,
  Server,
  TableOfContents,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react"

export type StringItem = string | { value?: string }

export type LegalListItem = {
  label?: string
  text: string
}

const iconMap = {
  Building2,
  ChartBar,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  HardDrive,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  Scale,
  Server,
  TableOfContents,
  TriangleAlert,
  UserCheck,
  Users,
} satisfies Record<string, ElementType>

export function getLegalIcon(name?: string) {
  if (!name) return null
  return (iconMap as Record<string, React.ElementType>)[name] || null
}

export function normalizeStringItems(items: StringItem[] | undefined) {
  return (items || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
}

export function normalizeListItems(items: Array<LegalListItem | StringItem> | undefined) {
  return (items || [])
    .map((item) => {
      if (typeof item === "string") return { text: item }
      if ("text" in item) return item as LegalListItem
      return { text: item?.value || "" }
    })
    .filter((item) => item.text)
}
