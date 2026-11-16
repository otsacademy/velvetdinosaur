import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { CHIPPING_NORTON_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(CHIPPING_NORTON_PAGE)

export default function WebDesignChippingNortonPage() {
  return <LocationPage content={CHIPPING_NORTON_PAGE} />
}
