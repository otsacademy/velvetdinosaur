import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { CARTERTON_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(CARTERTON_PAGE)

export default function WebDesignCartertonPage() {
  return <LocationPage content={CARTERTON_PAGE} />
}
