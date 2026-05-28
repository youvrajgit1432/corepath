import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CareerCommandCenter from "../../components/CareerCommandCenter";

export const metadata = {
  title: "Command Center | CorePath",
  description: "Intelligence synthesis, decision assistant, and mission control.",
};

export default async function CommandCenterPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-core-heading">Command Center</h1>
        <p className="mt-2 text-core-muted">
          Intelligence synthesis, decision assistant, and mission control.
        </p>
      </div>

      <CareerCommandCenter />
    </div>
  );
}
