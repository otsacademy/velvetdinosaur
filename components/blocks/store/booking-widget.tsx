import type { ComponentConfig } from '@puckeditor/core';
import { listResources, listServices } from '@/lib/booking/catalog';
import { BookingWidgetClient, type WidgetResource, type WidgetService } from './booking-widget.client';

export type BookingWidgetProps = {
  heading?: string;
  intro?: string;
  serviceSlug?: string;
  showPrices?: 'yes' | 'no';
};

export async function BookingWidget(props: BookingWidgetProps) {
  const [services, resources] = await Promise.all([
    listServices({ activeOnly: true }),
    listResources({ activeOnly: true })
  ]);

  const widgetServices: WidgetService[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    durationMinutes: service.durationMinutes,
    pricePence: service.pricePence
  }));

  const widgetResources: WidgetResource[] = resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    serviceIds: resource.serviceIds
  }));

  // Attach only the resources that actually offer each service.
  const resourcesByService = Object.fromEntries(
    widgetServices.map((service) => [
      service.id,
      widgetResources.filter(
        (resource) => resource.serviceIds.length === 0 || resource.serviceIds.includes(service.id)
      )
    ])
  );

  if (widgetServices.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[var(--vd-border)] p-8 text-center text-sm text-[var(--vd-muted-fg)]">
        Booking widget — add your first bookable service in the admin (Bookings → Catalog) and it
        appears here automatically.
      </section>
    );
  }

  return (
    <BookingWidgetClient
      heading={props.heading || ''}
      intro={props.intro || ''}
      initialServiceSlug={props.serviceSlug || ''}
      showPrices={props.showPrices !== 'no'}
      services={widgetServices}
      resourcesByService={resourcesByService}
    />
  );
}

export const bookingWidgetConfig: ComponentConfig<BookingWidgetProps> = {
  label: 'Booking widget',
  fields: {
    heading: { type: 'text', label: 'Heading' },
    intro: { type: 'textarea', label: 'Intro text' },
    serviceSlug: { type: 'text', label: 'Pre-selected service slug (optional)' },
    showPrices: {
      type: 'select',
      label: 'Show prices',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    }
  },
  defaultProps: {
    heading: 'Book an appointment',
    intro: 'Choose a service, pick a time that suits you, and we will confirm your booking.',
    serviceSlug: '',
    showPrices: 'yes'
  },
  render: (props) => BookingWidget(props) as any
};
