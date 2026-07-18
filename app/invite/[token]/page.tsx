import AcceptInviteClient from "./AcceptInviteClient";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcceptInviteClient token={token} />;
}
