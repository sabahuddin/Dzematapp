import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and, isNotNull, ne } from "drizzle-orm";

interface PushMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const message: PushMessage = {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result.data?.status === "ok";
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { pushToken: true },
    });

    if (!user?.pushToken) {
      return false;
    }

    return sendPushNotification(user.pushToken, title, body, data);
  } catch (error) {
    console.error("Error sending push to user:", error);
    return false;
  }
}

export async function sendPushToTenant(
  tenantId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  excludeUserId?: string
): Promise<number> {
  try {
    let query = db
      .select({ pushToken: users.pushToken })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          isNotNull(users.pushToken)
        )
      );

    const usersWithTokens = await query;
    
    let sentCount = 0;
    for (const user of usersWithTokens) {
      if (user.pushToken && (!excludeUserId || user.pushToken !== excludeUserId)) {
        const success = await sendPushNotification(user.pushToken, title, body, data);
        if (success) sentCount++;
      }
    }

    return sentCount;
  } catch (error) {
    console.error("Error sending push to tenant:", error);
    return 0;
  }
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<number> {
  try {
    let sentCount = 0;
    for (const userId of userIds) {
      const success = await sendPushToUser(userId, title, body, data);
      if (success) sentCount++;
    }
    return sentCount;
  } catch (error) {
    console.error("Error sending push to users:", error);
    return 0;
  }
}

export async function registerPushToken(
  userId: string,
  pushToken: string
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({ pushToken })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("Error registering push token:", error);
    return false;
  }
}

export async function unregisterPushToken(userId: string): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({ pushToken: null })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("Error unregistering push token:", error);
    return false;
  }
}
