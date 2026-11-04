/** Schema-based form. Image URLs are used until the backend team supplies Storage rules. */
import { useRef, useState } from "react";
import type { Guesthouse, GuesthouseInput } from "@/lib/guesthouses";
import { saveGuesthouse } from "@/lib/guesthouses";
import { firebaseError } from "@/lib/firebase";
import { ImageUploadInput } from "@/components/image-upload-field";
import { uploadsConfigured } from "@/lib/cloudinary";
import {
  GUESTHOUSE_STATUSES,
  STATUS_LABELS,
  statusOf,
  type GuesthouseStatus,
} from "@/lib/guesthouses";
import {
  aiErrorMessage,
  generateListingDraft,
  mergeAmenities,
  translateToSetswana,
} from "@/lib/ai";

export function GuesthouseForm({
  item,
  close,
}: {
  item?: Guesthouse | undefined;
  close: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Photos are uploaded to Cloudinary when it is configured; otherwise admins paste HTTPS URLs.
  const uploads = uploadsConfigured();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDrafted, setAiDrafted] = useState(false);
  const [tnBusy, setTnBusy] = useState(false);
  const [tnError, setTnError] = useState("");
  const [tnDrafted, setTnDrafted] = useState(false);

  /** Translate the English description into the Setswana box. Nothing is saved yet. */
  async function translateWithAi() {
    const form = formRef.current;
    if (!form) return;
    setTnBusy(true);
    setTnError("");
    try {
      const english = String(new FormData(form).get("description") || "");
      const translated = await translateToSetswana(english);
      const field = form.elements.namedItem("descriptionTn") as HTMLTextAreaElement | null;
      if (field) field.value = translated;
      setTnDrafted(true);
    } catch (failure) {
      console.error("AI error:", failure);
      setTnError(aiErrorMessage(failure));
    } finally {
      setTnBusy(false);
    }
  }

  /** Fill the description and amenities from the admin's notes. Nothing is saved yet. */
  async function draftWithAi() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) || "").trim();
    const list = (value: string) =>
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    const existingAmenities = list(text("amenities"));
    setAiBusy(true);
    setAiError("");
    try {
      const draft = await generateListingDraft({
        name: text("name"),
        city: text("city"),
        country: text("country"),
        pricePerNight: Number(text("pricePerNight")) || undefined,
        amenities: existingAmenities,
        notes: [text("aiNotes"), text("description")].filter(Boolean).join("\n"),
      });
      const description = form.elements.namedItem("description") as HTMLTextAreaElement | null;
      const amenities = form.elements.namedItem("amenities") as HTMLInputElement | null;
      if (description) description.value = draft.description;
      if (amenities)
        amenities.value = mergeAmenities(existingAmenities, draft.amenities).join(", ");
      setAiDrafted(true);
    } catch (failure) {
      console.error("AI error:", failure);
      setAiError(aiErrorMessage(failure));
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "").trim();
    const data: GuesthouseInput = {
      name: text("name"),
      city: text("city"),
      country: text("country"),
      description: text("description"),
      descriptionTn: text("descriptionTn"),
      status: text("status") as GuesthouseStatus,
      pricePerNight: Number(text("pricePerNight")),
      location: { lat: Number(text("lat")), lng: Number(text("lng")) },
      logoUrl: text("logoUrl"),
      galleryUrls: text("galleryUrls")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      amenities: text("amenities")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      contact: { ...item?.contact, phone: text("phone"), email: text("email") },
    };
    setBusy(true);
    setError("");
    try {
      await saveGuesthouse(data, item?.id);
      close();
    } catch (failure) {
      setError(firebaseError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-xl border bg-card p-6 mb-6" aria-label="Guesthouse editor">
      <h2 className="text-2xl mb-4">{item ? "Edit guesthouse" : "Add guesthouse"}</h2>
      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
          <Field name="name" label="Guesthouse name" value={item?.name} />
          <Field name="city" label="City" value={item?.city} />
          <Field name="country" label="Country" value={item?.country || "Botswana"} />
          <Field
            name="pricePerNight"
            label="Price per night (BWP)"
            type="number"
            min="0"
            step="0.01"
            value={item?.pricePerNight}
          />
          <Field
            name="lat"
            label="Latitude"
            type="number"
            min="-90"
            max="90"
            step="any"
            value={item?.location?.lat}
          />
          <Field
            name="lng"
            label="Longitude"
            type="number"
            min="-180"
            max="180"
            step="any"
            value={item?.location?.lng}
          />
          <Field name="phone" label="Contact phone" value={item?.contact?.phone} />
          <Field name="email" label="Contact email" type="email" value={item?.contact?.email} />
          {uploads ? (
            <ImageUploadInput
              name="logoUrl"
              label="Guesthouse logo"
              initial={item?.logoUrl ? [item.logoUrl] : []}
            />
          ) : (
            <Field
              name="logoUrl"
              label="Guesthouse logo URL (HTTPS)"
              type="url"
              value={item?.logoUrl}
            />
          )}
          <Field
            name="amenities"
            label="Amenities (comma separated)"
            required={false}
            value={item?.amenities?.join(", ")}
          />
          <label className="text-sm space-y-1">
            Visibility in the app
            <select
              name="status"
              defaultValue={item ? statusOf(item) : "published"}
              className="block w-full rounded-md border p-2 bg-background"
            >
              {GUESTHOUSE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                  {value === "published" ? "" : " (not shown to customers)"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            Description
            <textarea
              name="description"
              required
              defaultValue={item?.description}
              className="block w-full rounded-md border p-2 bg-background"
              rows={4}
            />
          </label>
          <div className="space-y-2">
            <label className="text-sm space-y-1 block">
              Setswana description (optional)
              <textarea
                name="descriptionTn"
                defaultValue={item?.descriptionTn}
                maxLength={2000}
                className="block w-full rounded-md border p-2 bg-background"
                rows={4}
              />
            </label>
            <button
              type="button"
              onClick={translateWithAi}
              disabled={tnBusy}
              className="border rounded-md px-4 py-2 text-sm"
            >
              {tnBusy ? "Translating…" : "Translate to Setswana with AI"}
            </button>
            {tnError && (
              <p role="alert" className="text-sm text-red-700">
                {tnError}
              </p>
            )}
            {tnDrafted && !tnError && (
              <p role="status" className="text-sm text-amber-800">
                AI-translated text was added. Ask a Setswana speaker to check it before saving.
              </p>
            )}
          </div>
          {uploads ? (
            <ImageUploadInput
              name="galleryUrls"
              label="Gallery photos"
              initial={item?.galleryUrls ?? []}
              multiple
            />
          ) : (
            <label className="text-sm space-y-1">
              Gallery URLs (one HTTPS URL per line)
              <textarea
                name="galleryUrls"
                required
                defaultValue={item?.galleryUrls?.join("\n")}
                className="block w-full rounded-md border p-2 bg-background"
                rows={4}
              />
            </label>
          )}
          <div className="sm:col-span-2 rounded-lg border border-dashed p-4 space-y-3">
            <label className="text-sm space-y-1 block">
              Notes for the AI (not saved)
              <textarea
                name="aiNotes"
                rows={3}
                placeholder="Facts about the property, e.g. riverside chalets, breakfast included, solar backup"
                className="block w-full rounded-md border p-2 bg-background"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={draftWithAi}
                disabled={aiBusy}
                className="border rounded-md px-4 py-2 text-sm"
              >
                {aiBusy ? "Drafting…" : "Draft description with AI"}
              </button>
              <p className="text-xs text-muted-foreground">
                Uses only the notes, existing amenities and details above. It replaces the
                description and adds amenities; you review and save.
              </p>
            </div>
            {aiError && (
              <p role="alert" className="text-sm text-red-700">
                {aiError}
              </p>
            )}
            {aiDrafted && !aiError && (
              <p role="status" className="text-sm text-amber-800">
                AI-drafted text was added. Check every fact and edit it before saving.
              </p>
            )}
          </div>
        </fieldset>
        <p className="text-xs text-muted-foreground">
          Only listings set to Published are shown to customers in the mobile app. Drafts and
          suspended listings stay in the database but are hidden.
        </p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            disabled={busy}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
          >
            {busy ? "Saving…" : "Save guesthouse"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={close}
            className="border rounded-md px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
/** Labels wrap their controls so keyboard/screen-reader users can identify each field. */
function Field({
  name,
  label,
  value,
  required = true,
  ...props
}: {
  name: string;
  label: string;
  value?: string | number | undefined;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="text-sm space-y-1">
      {label}
      <input
        name={name}
        defaultValue={value ?? ""}
        required={required}
        {...props}
        className="block w-full rounded-md border p-2 bg-background"
      />
    </label>
  );
}
