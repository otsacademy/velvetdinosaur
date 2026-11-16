import { LocationPage, locationMetadata } from "@/components/home/location-page"
import { WOODSTOCK_PAGE } from "@/lib/location-pages"

export const metadata = locationMetadata(WOODSTOCK_PAGE)

export default function WebDesignWoodstockPage() {
  return <LocationPage content={WOODSTOCK_PAGE} />
}
