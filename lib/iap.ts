/**
 * RevenueCat (IAP) client for SIGNAL mobile.
 *
 * Wraps react-native-purchases with the same conventions as lib/api.ts:
 * individually-exported functions, try/catch with [iap]-prefixed logging,
 * and user-safe Errors thrown on failure for screens to catch.
 *
 * The iOS public SDK key is hardcoded below — it's a *publishable* key
 * (safe to ship in the app bundle), matching the hardcoded-config pattern
 * in lib/supabase.ts and lib/api.ts. No env-var infrastructure exists yet.
 *
 * Unit 3 plumbing only: configure at startup; identify/offering/purchase/
 * restore are consumed by the purchase UI in later units.
 */

import Purchases, {
  type CustomerInfo,
  type LogInResult,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

// RevenueCat iOS public (publishable) API key — not a secret, safe in-bundle.
const REVENUECAT_IOS_KEY = "appl_QGRjPJbyDfFohryBcsMjhAXRHPu";

/**
 * Configure the RevenueCat SDK. Call once at startup, before any other
 * Purchases call. Purchases.configure is synchronous (void); failures are
 * logged and swallowed so a misconfig never blocks app boot.
 */
export function configurePurchases(): void {
  try {
    Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
    console.log("[iap] configured");
  } catch (err: any) {
    console.warn("[iap] configure_failed", err?.message);
  }
}

/**
 * Identify the user to RevenueCat by email (app_user_id = email, matching
 * the backend RevenueCat webhook). Returns LogInResult { customerInfo, created }.
 */
export async function identify(email: string): Promise<LogInResult> {
  try {
    const result = await Purchases.logIn(email);
    console.log("[iap] identified", email);
    return result;
  } catch (err: any) {
    console.warn("[iap] identify_failed", err?.message);
    throw new Error("Couldn't sign in to purchases. Please try again.");
  }
}

/**
 * Fetch the current (default) RevenueCat offering — the purchasable packages
 * configured in the RevenueCat dashboard. Returns null when none is current.
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? null;
    console.log("[iap] offering_fetched", current?.availablePackages.length ?? 0);
    return current;
  } catch (err: any) {
    console.warn("[iap] offering_failed", err?.message);
    throw new Error("Couldn't load purchase options. Please try again.");
  }
}

/**
 * Purchase a package. Returns the updated CustomerInfo on success, or null
 * if the user cancelled (a normal action, not an error). Throws a user-safe
 * Error on genuine failure.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> {
  console.log("[iap] purchase_started", pkg.identifier);
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log("[iap] purchase_completed", pkg.identifier);
    return customerInfo;
  } catch (err: any) {
    if (err?.userCancelled) {
      console.log("[iap] purchase_cancelled", pkg.identifier);
      return null;
    }
    console.warn("[iap] purchase_failed", err?.message);
    throw new Error("Purchase didn't go through. Please try again.");
  }
}

/**
 * Restore previous purchases (reinstall / new device). Returns CustomerInfo
 * so the caller can inspect entitlements.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  console.log("[iap] restore_started");
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log("[iap] restore_completed");
    return customerInfo;
  } catch (err: any) {
    console.warn("[iap] restore_failed", err?.message);
    throw new Error("Couldn't restore purchases. Please try again.");
  }
}
