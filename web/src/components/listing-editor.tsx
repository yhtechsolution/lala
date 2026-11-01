/**
 * Guesthouse create/edit dialog. Form values stay local until Save updates the shared
 * portal listings. A selected photo becomes a browser data URL; there is no upload API.
 * This component is present but is not wired into the current static directory route.
 */
import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { type Listing, usePortal } from "@/lib/portal";

/** Empty create-form values. Price stays a string while editing and is converted to a number on Save. */
const blank = {
  name: "",
  location: "",
  price: "",
  contact: "",
  amenities: "",
  description: "",
  status: "Draft" as Listing["status"],
};
/** Controlled dialog: open/onOpenChange belong to its caller; an optional listing switches create to edit mode. */
export function ListingEditor({
  open,
  onOpenChange,
  listing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
}) {
  /* Read shared listings so updates propagate to other provider descendants. */
  const { listings, setListings } = usePortal();
  /* Keep text-input values separate from the saved listing while the dialog is open. */
  const [form, setForm] = useState(blank);
  /* Hold only a newly selected photo data URL; the saved image remains the fallback. */
  const [photo, setPhoto] = useState<string | null>(null);
  /* Reinitialize create/edit values whenever the target listing or open state changes.
   * Discard an unsaved photo selection so reopening starts from the saved record. */
  useEffect(() => {
    setForm(
      listing
        ? {
            name: listing.name,
            location: listing.location,
            price: String(listing.price),
            contact: listing.contact,
            amenities: listing.amenities,
            description: listing.description,
            status: listing.status,
          }
        : blank,
    );
    setPhoto(null);
  }, [listing, open]);
  /* Copy the previous form object and replace just the field identified by key. */
  function update(key: keyof typeof blank, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  /* Handle valid form submission locally; prevent the browser from navigating/reloading. */
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* Preserve an existing ID/rating/reviews; new entries receive a timestamp ID and zero ratings.
     * Trim text, convert the price, and prefer new photo, saved photo, then the first listing photo. */
    const next: Listing = {
      id: listing?.id ?? String(Date.now()),
      name: form.name.trim(),
      location: form.location.trim(),
      price: Number(form.price),
      contact: form.contact.trim(),
      amenities: form.amenities.trim(),
      description: form.description.trim(),
      status: form.status,
      image: photo ?? listing?.image ?? listings[0]?.image ?? "",
      rating: listing?.rating ?? 0,
      reviews: listing?.reviews ?? 0,
    };
    /* Replace the matching entry when editing; prepend when creating. Use the latest state array. */
    setListings((current) =>
      listing ? current.map((item) => (item.id === listing.id ? next : item)) : [next, ...current],
    );
    /* Close the dialog after the shared array has been updated. */
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-md p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            {listing ? "Edit guesthouse" : "Add a guesthouse"}
          </DialogTitle>
          <DialogDescription>
            Complete the details guests will see on the listing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="mt-3 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Guesthouse name">
              <Input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. The Palm House"
              />
            </Field>
            <Field label="Location">
              <Input
                required
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Gaborone"
              />
            </Field>
            <Field label="Price per night (BWP)">
              <Input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="850"
              />
            </Field>
            <Field label="Contact number">
              <Input
                required
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                placeholder="+267 ..."
              />
            </Field>
          </div>
          <Field label="Amenities">
            <Input
              value={form.amenities}
              onChange={(e) => update("amenities", e.target.value)}
              placeholder="Wi-Fi, Pool, Breakfast"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Tell guests what makes this place special"
              rows={3}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Photo">
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-secondary">
                <ImagePlus size={16} />
                {photo ? "Photo selected" : listing ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      /* Read the selected browser file as an embedded data URL, not a server upload. */
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </Field>
            <Field label="Status">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
            </Field>
          </div>
          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{listing ? "Save changes" : "Add guesthouse"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
/** Small layout helper that wraps a label and its input content; it does not own or validate field state. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-xs font-semibold text-foreground">
      {label}
      {children}
    </label>
  );
}
