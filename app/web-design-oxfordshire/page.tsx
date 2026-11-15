import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { OXFORDSHIRE_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(OXFORDSHIRE_PAGE)

export default function WebDesignOxfordshirePage() {
  return <LocationPage content={OXFORDSHIRE_PAGE} />
}
