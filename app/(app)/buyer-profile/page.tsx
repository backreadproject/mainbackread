import { redirect } from "next/navigation";

// The single profile page is gone. A workspace holds several now, so this URL
// only ever had one right answer.
export default function LegacyBuyerProfilePage() {
  redirect("/buyer-profiles");
}