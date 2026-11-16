import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { BURFORD_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(BURFORD_PAGE)

export default function WebDesignBurfordPage() {
  return <LocationPage content={BURFORD_PAGE} />
}
