import { appName } from "@/lib/shared";
import { ogImage, size } from "./og/og-image";

export const alt = appName;
export { size };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Open source · ROS 2 · Multi-robot",
    title: "Build and fly aerial robots on ROS 2.",
  });
}
