export type Coordinates = { lat: number; lng: number };

// Read model for the shared guesthouses collection in docs/firestore-schema.md.
export type Guesthouse = {
  id: string;
  name: string;
  city: string;
  country: string;
  pricePerNight: number;
  averageRating: number;
  ratingCount: number;
  amenities: string[];
  description: string;
  imageUrl: string | null;
  location: Coordinates | null;
  // Optional Setswana description written (or reviewed) by an admin.
  descriptionTn?: string;
};
