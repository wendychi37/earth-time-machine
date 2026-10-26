"use client";

import { useAppStore } from "@/store/useAppStore";
import { EventCard } from "./EventCard";
import { useAllEvents } from "./useEvents";

export function SelectedEventCard() {
  const id = useAppStore((s) => s.selectedEventId);
  const events = useAllEvents();
  const event = id && events?.find((e) => e.id === id);
  return event ? <EventCard event={event} /> : null;
}
