import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CareerWorkspacePanel from "../../components/CareerWorkspacePanel";

export const metadata = {
  title: "Career Workspace | CorePath",
  description: "Deep-dive workspace for your chosen career paths.",
};

export default async function WorkspacePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-core-heading">Career Workspace</h1>
        <p className="mt-2 text-core-muted">
          Dive deep into your career paths with structured workflows and progress tracking.
        </p>
      </div>

      <CareerWorkspacePanel />
    </div>
  );
}
