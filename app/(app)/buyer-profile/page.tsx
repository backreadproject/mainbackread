import { redirect } from "next/navigation";

// The single-profile page is gone. Profiles are a list now, and a workspace can
// hold several, so this URL only ever had one right answer.
export default function LegacyBuyerProfilePage() {
  redirect("/buyer-profiles");
}