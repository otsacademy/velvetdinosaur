'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  apiSend,
  formatPrice,
  type BookingResourceItem,
  type BookingServiceItem
} from '@/components/edit/booking-api-shared';

type ServiceForm = {
  name: string;
  description: string;
  durationMinutes: string;
  bufferMinutes: string;
  pricePounds: string;
  active: boolean;
};

type ResourceForm = {
  name: string;
  email: string;
  serviceIds: string[];
  active: boolean;
};

const EMPTY_SERVICE_FORM: ServiceForm = {
  name: '',
  description: '',
  durationMinutes: '60',
  bufferMinutes: '0',
  pricePounds: '',
  active: true
};

const EMPTY_RESOURCE_FORM: ResourceForm = { name: '', email: '', serviceIds: [], active: true };

function toServiceForm(service: BookingServiceItem): ServiceForm {
  return {
    name: service.name,
    description: service.description,
    durationMinutes: String(service.durationMinutes),
    bufferMinutes: String(service.bufferMinutes),
    pricePounds: service.pricePence === null ? '' : (service.pricePence / 100).toFixed(2),
    active: service.active
  };
}

export function BookingApiCatalogTab({
  services,
  resources,
  onChanged
}: {
  services: BookingServiceItem[];
  resources: BookingResourceItem[];
  onChanged: () => void;
}) {
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<BookingServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BookingResourceItem | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceForm>(EMPTY_RESOURCE_FORM);
  const [saving, setSaving] = useState(false);

  function openNewService() {
    setEditingService(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceDialogOpen(true);
  }

  function openEditService(service: BookingServiceItem) {
    setEditingService(service);
    setServiceForm(toServiceForm(service));
    setServiceDialogOpen(true);
  }

  function openNewResource() {
    setEditingResource(null);
    setResourceForm(EMPTY_RESOURCE_FORM);
    setResourceDialogOpen(true);
  }

  function openEditResource(resource: BookingResourceItem) {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      email: resource.email,
      serviceIds: resource.serviceIds,
      active: resource.active
    });
    setResourceDialogOpen(true);
  }

  async function saveService() {
    setSaving(true);
    try {
      const body = {
        name: serviceForm.name,
        description: serviceForm.description || undefined,
        durationMinutes: Number(serviceForm.durationMinutes),
        bufferMinutes: Number(serviceForm.bufferMinutes) || 0,
        pricePence: serviceForm.pricePounds ? Math.round(Number(serviceForm.pricePounds) * 100) : null,
        active: serviceForm.active
      };
      if (editingService) {
        await apiSend(`/api/admin/bookings/services/${editingService.id}`, 'PATCH', body);
        toast.success('Service updated.');
      } else {
        await apiSend('/api/admin/bookings/services', 'POST', body);
        toast.success('Service created.');
      }
      setServiceDialogOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the service.');
    } finally {
      setSaving(false);
    }
  }

  async function saveResource() {
    setSaving(true);
    try {
      const body = {
        name: resourceForm.name,
        email: resourceForm.email || undefined,
        serviceIds: resourceForm.serviceIds,
        active: resourceForm.active
      };
      if (editingResource) {
        await apiSend(`/api/admin/bookings/resources/${editingResource.id}`, 'PATCH', {
          ...body,
          weeklyHours: editingResource.weeklyHours,
          exceptions: editingResource.exceptions
        });
        toast.success('Resource updated.');
      } else {
        await apiSend('/api/admin/bookings/resources', 'POST', body);
        toast.success('Resource created — set its hours in the Availability tab.');
      }
      setResourceDialogOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the resource.');
    } finally {
      setSaving(false);
    }
  }

  function toggleResourceService(serviceId: string) {
    setResourceForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId]
    }));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Services</CardTitle>
          <Button size="sm" onClick={openNewService}>
            Add service
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No services yet — add your first bookable service (e.g. &ldquo;Haircut, 45 minutes&rdquo;).
            </p>
          ) : (
            services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => openEditService(service)}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{service.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {service.durationMinutes} min
                    {service.bufferMinutes ? ` + ${service.bufferMinutes} buffer` : ''}
                    {service.pricePence !== null ? ` · ${formatPrice(service.pricePence)}` : ''}
                  </span>
                </span>
                <Badge variant={service.active ? 'default' : 'secondary'}>
                  {service.active ? 'Active' : 'Hidden'}
                </Badge>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Staff &amp; resources</CardTitle>
          <Button size="sm" onClick={openNewResource}>
            Add resource
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No staff or resources yet. Bookings then run against the venue hours in the Availability tab.
            </p>
          ) : (
            resources.map((resource) => (
              <button
                key={resource.id}
                type="button"
                onClick={() => openEditResource(resource)}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{resource.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {resource.serviceIds.length === 0
                      ? 'Offers all services'
                      : `Offers ${resource.serviceIds.length} service${resource.serviceIds.length === 1 ? '' : 's'}`}
                    {resource.weeklyHours.length > 0 ? ' · own hours' : ''}
                  </span>
                </span>
                <Badge variant={resource.active ? 'default' : 'secondary'}>
                  {resource.active ? 'Active' : 'Hidden'}
                </Badge>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit service' : 'Add service'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-name">Name</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                placeholder="Haircut"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-description">Description (optional)</Label>
              <Input
                id="service-description"
                value={serviceForm.description}
                onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-duration">Duration (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min={5}
                  value={serviceForm.durationMinutes}
                  onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-buffer">Buffer (min)</Label>
                <Input
                  id="service-buffer"
                  type="number"
                  min={0}
                  value={serviceForm.bufferMinutes}
                  onChange={(event) => setServiceForm({ ...serviceForm, bufferMinutes: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="service-price">Price £ (optional)</Label>
                <Input
                  id="service-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceForm.pricePounds}
                  onChange={(event) => setServiceForm({ ...serviceForm, pricePounds: event.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={serviceForm.active}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, active: checked === true })}
              />
              Bookable on the website
            </label>
          </div>
          <DialogFooter>
            <Button onClick={saveService} disabled={saving || !serviceForm.name.trim()}>
              {saving ? 'Saving…' : 'Save service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit resource' : 'Add resource'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-name">Name</Label>
              <Input
                id="resource-name"
                value={resourceForm.name}
                onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })}
                placeholder="e.g. a stylist, therapist, or table"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-email">Email (optional)</Label>
              <Input
                id="resource-email"
                type="email"
                value={resourceForm.email}
                onChange={(event) => setResourceForm({ ...resourceForm, email: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Services offered (none selected = all)</Label>
              <div className="flex flex-col gap-2">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={resourceForm.serviceIds.includes(service.id)}
                      onCheckedChange={() => toggleResourceService(service.id)}
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={resourceForm.active}
                onCheckedChange={(checked) => setResourceForm({ ...resourceForm, active: checked === true })}
              />
              Available for booking
            </label>
          </div>
          <DialogFooter>
            <Button onClick={saveResource} disabled={saving || !resourceForm.name.trim()}>
              {saving ? 'Saving…' : 'Save resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
