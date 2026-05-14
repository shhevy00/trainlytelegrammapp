/**
 * Демо-состояние жизненного цикла (PROD-SHELL-2). Не является безопасностью.
 * Персистентность только в localStorage для удобства разработки.
 */

export type MockAuthStatus = "anonymous" | "authenticated_demo";

export type MockLegalStatus = "not_accepted" | "accepted";

export type MockProfileSetupStatus = "not_completed" | "completed";

export type MockOnboardingStatus = "not_seen" | "seen";

export type MockSubscriptionStatus = "demo_unlimited" | "trial" | "active" | "expired" | "cancelled";

export interface MockTrainerProfile {
  displayName: string;
  specialization?: string;
  city?: string;
  timezone: string;
  currency: "₽";
}

export interface MockLifecyclePersisted {
  v: 1;
  mockAuthStatus: MockAuthStatus;
  mockLegalStatus: MockLegalStatus;
  mockProfileSetupStatus: MockProfileSetupStatus;
  mockOnboardingStatus: MockOnboardingStatus;
  mockSubscriptionStatus: MockSubscriptionStatus;
  trainerProfile: MockTrainerProfile | null;
}

export const TRAINLY_MOCK_LIFECYCLE_STORAGE_KEY = "trainly_mock_lifecycle_v1";

/** Старт без localStorage: как «уже прошли онбординг», чтобы не ломать привычный демо-обзор. */
export const DEFAULT_MOCK_LIFECYCLE: MockLifecyclePersisted = {
  v: 1,
  mockAuthStatus: "authenticated_demo",
  mockLegalStatus: "accepted",
  mockProfileSetupStatus: "completed",
  mockOnboardingStatus: "seen",
  mockSubscriptionStatus: "demo_unlimited",
  trainerProfile: null,
};

export function createFreshMockLifecycle(): MockLifecyclePersisted {
  return {
    v: 1,
    mockAuthStatus: "anonymous",
    mockLegalStatus: "not_accepted",
    mockProfileSetupStatus: "not_completed",
    mockOnboardingStatus: "not_seen",
    mockSubscriptionStatus: "demo_unlimited",
    trainerProfile: null,
  };
}

export interface CompleteProfileSetupInput {
  displayName: string;
  specialization?: string;
  city?: string;
  timezone: string;
  currency: "₽";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseAuth(v: unknown): MockAuthStatus | null {
  if (v === "anonymous" || v === "authenticated_demo") return v;
  return null;
}

function parseLegal(v: unknown): MockLegalStatus | null {
  if (v === "not_accepted" || v === "accepted") return v;
  return null;
}

function parseProfileSetup(v: unknown): MockProfileSetupStatus | null {
  if (v === "not_completed" || v === "completed") return v;
  return null;
}

function parseOnboarding(v: unknown): MockOnboardingStatus | null {
  if (v === "not_seen" || v === "seen") return v;
  return null;
}

function parseSubscription(v: unknown): MockSubscriptionStatus | null {
  if (
    v === "demo_unlimited" ||
    v === "trial" ||
    v === "active" ||
    v === "expired" ||
    v === "cancelled"
  ) {
    return v;
  }
  return null;
}

function parseTrainerProfile(v: unknown): MockTrainerProfile | null {
  if (!isRecord(v)) return null;
  const displayName = v.displayName;
  if (typeof displayName !== "string" || displayName.trim().length === 0) return null;
  const timezone = v.timezone;
  if (typeof timezone !== "string" || timezone.trim().length === 0) return null;
  const currency = v.currency;
  if (currency !== "₽") return null;
  const specialization = v.specialization;
  const city = v.city;
  return {
    displayName: displayName.trim(),
    specialization: typeof specialization === "string" && specialization.trim() ? specialization.trim() : undefined,
    city: typeof city === "string" && city.trim() ? city.trim() : undefined,
    timezone: timezone.trim(),
    currency: "₽",
  };
}

/** Безопасный разбор localStorage; при ошибке — null. */
export function parseStoredLifecycle(raw: string | null): MockLifecyclePersisted | null {
  if (raw == null || raw.trim().length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.v !== 1) return null;
    const mockAuthStatus = parseAuth(parsed.mockAuthStatus);
    const mockLegalStatus = parseLegal(parsed.mockLegalStatus);
    const mockProfileSetupStatus = parseProfileSetup(parsed.mockProfileSetupStatus);
    const mockOnboardingStatus = parseOnboarding(parsed.mockOnboardingStatus);
    const mockSubscriptionStatus = parseSubscription(parsed.mockSubscriptionStatus);
    if (
      mockAuthStatus == null ||
      mockLegalStatus == null ||
      mockProfileSetupStatus == null ||
      mockOnboardingStatus == null ||
      mockSubscriptionStatus == null
    ) {
      return null;
    }
    const trainerRaw = parsed.trainerProfile;
    const trainerProfile =
      trainerRaw === null || trainerRaw === undefined ? null : parseTrainerProfile(trainerRaw);
    if (trainerRaw != null && trainerProfile == null) return null;

    return {
      v: 1,
      mockAuthStatus,
      mockLegalStatus,
      mockProfileSetupStatus,
      mockOnboardingStatus,
      mockSubscriptionStatus,
      trainerProfile,
    };
  } catch {
    return null;
  }
}

export function persistLifecycleToStorage(next: MockLifecyclePersisted): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAINLY_MOCK_LIFECYCLE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readLifecycleFromStorage(): MockLifecyclePersisted | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredLifecycle(window.localStorage.getItem(TRAINLY_MOCK_LIFECYCLE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function subscriptionStatusLabelRu(s: MockSubscriptionStatus): string {
  switch (s) {
    case "demo_unlimited":
      return "Демо без ограничений";
    case "trial":
      return "Пробный период";
    case "active":
      return "Подписка активна";
    case "expired":
      return "Доступ истёк";
    case "cancelled":
      return "Подписка отменена";
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}
