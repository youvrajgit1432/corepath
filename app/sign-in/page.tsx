import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In | CorePath",
  description: "Sign in to your CorePath account to access your personalized career journey.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-core-heading">Welcome Back</h1>
          <p className="mt-2 text-sm text-core-muted">
            Sign in to continue your career journey.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-core-surface border border-core-border rounded-2xl shadow-soft",
              headerTitle: "text-core-heading text-lg font-semibold",
              headerSubtitle: "text-core-muted text-sm",
              socialButtonsBlockButton:
                "border border-core-border bg-core-bg text-core-text rounded-xl hover:bg-core-surface transition",
              formButtonPrimary:
                "bg-core-accent text-white rounded-xl hover:opacity-90 transition",
              formFieldInput:
                "w-full rounded-xl border border-core-border bg-core-bg px-4 py-2.5 text-sm text-core-heading placeholder-core-muted focus:outline-none focus:ring-2 focus:ring-core-accent/50",
              formFieldLabel: "text-core-muted text-xs font-medium",
              footerActionLink: "text-core-accent hover:text-core-accent/80",
              dividerLine: "bg-core-border",
              dividerText: "text-core-muted",
              identityPreviewText: "text-core-text",
              identityPreviewEditButton: "text-core-accent",
            },
          }}
        />
      </div>
    </div>
  );
}
