import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { EYNSHAM_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(EYNSHAM_PAGE)

export default function WebDesignEynshamPage() {
  return <LocationPage content={EYNSHAM_PAGE} />
}
