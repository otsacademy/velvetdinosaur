import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { CHARITIES_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(CHARITIES_PAGE)

export default function WebsitesForCharitiesPage() {
  return <LocationPage content={CHARITIES_PAGE} />
}
