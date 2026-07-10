import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  DEFAULT_DATA_EXPOSURE,
  DEFAULT_FOLLOW_UP_PUSH,
  DEFAULT_SYSTEM_OPS,
  mergeDataExposureConfig,
  mergeFollowUpPushConfig,
  mergeLabMetricsOpsConfig,
  mergeSystemOpsConfig,
  OPS_CONFIG_COLLECTION,
  type DataExposureConfig,
  type FollowUpPushConfig,
  type OpsConfigDocId,
  type SystemOpsConfig,
} from "@/lib/opsConfig";
import {
  DEFAULT_LAB_METRICS,
  type LabMetricsConfig,
} from "@/lib/labMetricsConfig";

async function readConfigDoc<T>(docId: OpsConfigDocId): Promise<Partial<T> | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, OPS_CONFIG_COLLECTION, docId));
  if (!snap.exists()) return null;
  return snap.data() as Partial<T>;
}

async function writeConfigDoc<T extends object>(
  docId: OpsConfigDocId,
  data: T,
  updatedBy?: string,
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  await setDoc(
    doc(db, OPS_CONFIG_COLLECTION, docId),
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(updatedBy ? { updatedBy } : {}),
    },
    { merge: true },
  );
}

export async function fetchDataExposureConfig(): Promise<DataExposureConfig> {
  const remote = await readConfigDoc<DataExposureConfig>("dataExposure");
  return mergeDataExposureConfig(remote);
}

export async function saveDataExposureConfig(
  config: DataExposureConfig,
  updatedBy?: string,
): Promise<void> {
  await writeConfigDoc("dataExposure", config, updatedBy);
}

export async function fetchFollowUpPushConfig(): Promise<FollowUpPushConfig> {
  const remote = await readConfigDoc<FollowUpPushConfig>("followUpPush");
  return mergeFollowUpPushConfig(remote);
}

export async function saveFollowUpPushConfig(
  config: FollowUpPushConfig,
  updatedBy?: string,
): Promise<void> {
  await writeConfigDoc("followUpPush", config, updatedBy);
}

export async function fetchSystemOpsConfig(): Promise<SystemOpsConfig> {
  const remote = await readConfigDoc<SystemOpsConfig>("system");
  return mergeSystemOpsConfig(remote);
}

export async function saveSystemOpsConfig(
  config: SystemOpsConfig,
  updatedBy?: string,
): Promise<void> {
  await writeConfigDoc("system", config, updatedBy);
}

/** Firestore → JSON 파일 → 기본값 순 */
export async function fetchLabMetricsOpsConfig(): Promise<LabMetricsConfig> {
  const remote = await readConfigDoc<LabMetricsConfig>("labMetrics");
  if (remote) return mergeLabMetricsOpsConfig(remote);

  try {
    const res = await fetch(`/lab-metrics.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<LabMetricsConfig>;
      return mergeLabMetricsOpsConfig(data);
    }
  } catch {
    // ignore
  }

  return mergeLabMetricsOpsConfig(DEFAULT_LAB_METRICS);
}

export async function saveLabMetricsOpsConfig(
  config: LabMetricsConfig,
  updatedBy?: string,
): Promise<void> {
  await writeConfigDoc("labMetrics", config, updatedBy);
}

export function isOpsConfigAvailable(): boolean {
  return isFirebaseConfigured && db !== null;
}

export async function fetchAllOpsConfig(): Promise<{
  labMetrics: LabMetricsConfig;
  dataExposure: DataExposureConfig;
  followUpPush: FollowUpPushConfig;
  system: SystemOpsConfig;
}> {
  const [labMetrics, dataExposure, followUpPush, system] = await Promise.all([
    fetchLabMetricsOpsConfig().catch(() => DEFAULT_LAB_METRICS),
    fetchDataExposureConfig().catch(() => DEFAULT_DATA_EXPOSURE),
    fetchFollowUpPushConfig().catch(() => DEFAULT_FOLLOW_UP_PUSH),
    fetchSystemOpsConfig().catch(() => DEFAULT_SYSTEM_OPS),
  ]);
  return { labMetrics, dataExposure, followUpPush, system };
}
