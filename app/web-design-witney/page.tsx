import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { WITNEY_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(WITNEY_PAGE)

export default function WebDesignWitneyPage() {
  return <LocationPage content={WITNEY_PAGE} />
}
