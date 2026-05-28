/**
 * CorePath — Clerk Webhook Handler
 *
 * Syncs Clerk user lifecycle events to the local PostgreSQL database.
 * This ensures the `users` table has corresponding records for every
 * authenticated Clerk user, which is required for server-side persistence.
 *
 * Setup in Clerk Dashboard:
 *   Endpoint: https://corepath.vercel.app/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    username?: string;
    created_at?: number;
    updated_at?: number;
    deleted?: boolean;
  };
};

export async function POST(req: Request) {
  // Verify the webhook signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[Clerk Webhook] CLERK_WEBHOOK_SECRET not configured. Skipping verification."
    );
    // In development, proceed without verification for testing
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Webhook secret not configured", { status: 500 });
    }
  }

  const payload = await req.text();
  let event: ClerkWebhookEvent;

  try {
    if (secret) {
      const wh = new Webhook(secret);
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } else {
      event = JSON.parse(payload) as ClerkWebhookEvent;
    }
  } catch (err) {
    console.error("[Clerk Webhook] Verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        const email =
          data.email_addresses?.[0]?.email_address ?? null;

        const db = getPrisma();
        if (!db) {
          console.warn("[Clerk Webhook] Database not configured — skipping user sync");
          return new NextResponse("Database not configured", { status: 200 });
        }

        await db.user.upsert({
          where: { clerkId: data.id },
          update: {
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
          },
          create: {
            clerkId: data.id,
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
          },
        });

        console.log(`[Clerk Webhook] User ${type}: ${data.id}`);
        break;
      }

      case "user.deleted": {
        const db = getPrisma();
        if (!db) {
          console.warn("[Clerk Webhook] Database not configured — skipping user delete");
          return new NextResponse("Database not configured", { status: 200 });
        }

        await db.user.deleteMany({
          where: { clerkId: data.id },
        });
        console.log(`[Clerk Webhook] User deleted: ${data.id}`);
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[Clerk Webhook] Error processing event:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
