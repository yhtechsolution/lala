/**
 * Shared in-memory demonstration data for listings and communications. React context
 * lets descendants read and update the same arrays without a backend. Changes reset
 * when the provider remounts or the page reloads. The root mounts this provider; the static directory/dashboard pages also use independent sample data.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import pool from "@/assets/guesthouse-pool.jpg";
import courtyard from "@/assets/guesthouse-courtyard.jpg";
import lodge from "@/assets/guesthouse-lodge.jpg";

/** Shape of one demo guesthouse. Status is limited to Published/Draft; image is an imported URL or data URL. */
export type Listing = {
  id: string;
  name: string;
  location: string;
  price: number;
  status: "Published" | "Draft";
  image: string;
  rating: number;
  reviews: number;
  amenities: string;
  contact: string;
  description: string;
};

/** Initial sample guesthouses and photos used when PortalProvider mounts; not a server response. */
export const initialListings: Listing[] = [
  {
    id: "1",
    name: "The Palm House",
    location: "Gaborone",
    price: 850,
    status: "Published",
    image: pool,
    rating: 4.9,
    reviews: 48,
    amenities: "Pool, Wi-Fi, Breakfast, Parking",
    contact: "+267 71 234 567",
    description: "A peaceful city retreat with a sunlit pool and thoughtful details.",
  },
  {
    id: "2",
    name: "Mokolodi Courtyard",
    location: "Mokolodi",
    price: 720,
    status: "Published",
    image: courtyard,
    rating: 4.8,
    reviews: 36,
    amenities: "Wi-Fi, Breakfast, Garden",
    contact: "+267 72 345 678",
    description: "A relaxed guesthouse set around a leafy courtyard.",
  },
  {
    id: "3",
    name: "Acacia Ridge Lodge",
    location: "Maun",
    price: 1250,
    status: "Published",
    image: lodge,
    rating: 4.7,
    reviews: 29,
    amenities: "Pool, Wi-Fi, Parking, Air conditioning",
    contact: "+267 73 456 789",
    description: "A calm base for exploring the gateway to the delta.",
  },
  {
    id: "4",
    name: "The Palm House Annex",
    location: "Gaborone",
    price: 690,
    status: "Draft",
    image: courtyard,
    rating: 0,
    reviews: 0,
    amenities: "Wi-Fi, Parking",
    contact: "+267 71 234 567",
    description: "A cosy home away from home in the city.",
  },
];

/** Shape of a demo message. Sent/Draft describes local workflow state, not delivery confirmation. */
export type Message = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  date: string;
  status: "Sent" | "Draft";
};
/** Sample communication history used to initialize the shared in-memory message list. */
const initialMessages: Message[] = [
  {
    id: "m1",
    recipient: "The Palm House",
    subject: "Welcome to Lala",
    body: "Your listing is live on Lala. We're glad to have you here!",
    date: "12 Sep 2026",
    status: "Sent",
  },
  {
    id: "m2",
    recipient: "Mokolodi Courtyard",
    subject: "Listing photo update",
    body: "Thanks for sharing your new photographs. Your listing has been updated.",
    date: "08 Sep 2026",
    status: "Sent",
  },
  {
    id: "m3",
    recipient: "Acacia Ridge Lodge",
    subject: "A quick hello",
    body: "We hope you're having a wonderful season in Maun.",
    date: "02 Sep 2026",
    status: "Draft",
  },
];

/** Shared arrays plus React state setters. Setters accept either a replacement array or an updater function. */
type PortalContext = {
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};
/** Nullable context keeps missing-provider access detectable instead of silently returning fake data. */
const Context = createContext<PortalContext | null>(null);
/** Owns the shared arrays and exposes them to its children. Functional setter calls can use the latest state. */
export function PortalProvider({ children }: { children: ReactNode }) {
  /* Initialize state once per provider mount from the sample records. */
  const [listings, setListings] = useState(initialListings);
  const [messages, setMessages] = useState(initialMessages);
  /* Expose data and setters to all descendants; no persistence layer is called. */
  return (
    <Context.Provider value={{ listings, setListings, messages, setMessages }}>
      {children}
    </Context.Provider>
  );
}
/** Reads the nearest PortalProvider; throws an explicit error if the consuming component is outside it. */
export function usePortal() {
  const value = useContext(Context);
  if (!value) throw new Error("PortalProvider is missing");
  return value;
}
