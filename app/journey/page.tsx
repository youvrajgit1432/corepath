import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import JourneyTimelinePanel from "../../components/JourneyTimelinePanel";

export const metadata = {
  title: "My Journey | CorePath",
  description: "Track your career exploration journey, quiz history, and growth.",
};

export default async function JourneyPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-core-heading">My Journey</h1>
        <p className="mt-2 text-core-muted">
          Track your career exploration and growth over time.
        </p>
      </div>

      <JourneyTimelinePanel />
    </div>
  );
}
