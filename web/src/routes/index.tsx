/** Root dashboard uses the same live statistics as analytics. */
import { createFileRoute } from "@tanstack/react-router";
import { LiveOverview } from "@/components/live-overview";
export const Route = createFileRoute("/")({ component: LiveOverview });
