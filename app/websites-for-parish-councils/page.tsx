import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { PARISH_COUNCILS_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(PARISH_COUNCILS_PAGE)

export default function WebsitesForParishCouncilsPage() {
  return <LocationPage content={PARISH_COUNCILS_PAGE} />
}
