import { render, screen, cleanup, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { DiscoveryMap } from "@/components/discovery-map";
import type { Guesthouse } from "@/lib/guesthouses";
const item = {
  id: "paris",
  name: "Paris test",
  city: "Paris",
  country: "France",
  pricePerNight: 100,
  location: { lat: 48.85, lng: 2.35 },
} as Guesthouse;
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "L");
});
function setup() {
  const events: Record<string, () => void> = {};
  const map = { setView: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() };
  map.setView.mockReturnValue(map);
  const group = { addTo: vi.fn(), clearLayers: vi.fn() };
  const marker = { addTo: vi.fn(), bindPopup: vi.fn(), openPopup: vi.fn() };
  const tile = {
    on: vi.fn((event: string, cb: () => void) => {
      events[event] = cb;
      return tile;
    }),
    addTo: vi.fn(),
  };
  const lib = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => tile),
    layerGroup: vi.fn(() => group),
    circleMarker: vi.fn(() => marker),
  };
  Object.defineProperty(window, "L", { value: lib, configurable: true });
  return { lib, map, marker, group, events };
}
describe("Global discovery map lifecycle", () => {
  it("renders directly with referrer-enabled tiles and global initial view", async () => {
    const { lib, map } = setup();
    const { container } = render(<DiscoveryMap items={[item]} selected="" resetKey={0} />);
    await act(async () => {});
    expect(container.querySelector("iframe")).toBeNull();
    expect(lib.tileLayer).toHaveBeenCalledWith(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      expect.objectContaining({ referrerPolicy: "strict-origin-when-cross-origin" }),
    );
    expect(map.setView).toHaveBeenCalledWith([15, 10], 2);
    expect(lib.circleMarker).toHaveBeenCalledWith([48.85, 2.35], expect.anything());
  });
  it("focuses selection without recreating map and cleans up", async () => {
    const { lib, map, marker, group } = setup();
    const view = render(<DiscoveryMap items={[item]} selected="" resetKey={0} />);
    await act(async () => {});
    view.rerender(<DiscoveryMap items={[item]} selected="paris" resetKey={0} />);
    expect(lib.map).toHaveBeenCalledTimes(1);
    expect(map.setView).toHaveBeenCalledWith([48.85, 2.35], 12);
    expect(marker.openPopup).toHaveBeenCalled();
    view.rerender(<DiscoveryMap items={[]} selected="" resetKey={0} />);
    expect(group.clearLayers).toHaveBeenCalled();
    view.unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });
  it("reports tile failure with retry", async () => {
    const { events } = setup();
    render(<DiscoveryMap items={[]} selected="" resetKey={0} />);
    await act(async () => {});
    act(() => events["tileerror"]?.());
    expect(screen.getByRole("alert")).toHaveTextContent("blocked or could not load");
    expect(screen.getByRole("button", { name: "Retry map" })).toBeInTheDocument();
  });
});
