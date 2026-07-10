import { useCallback, useEffect, useState } from "react";
import type {
  DataExposureConfig,
  FollowUpPushConfig,
  SystemOpsConfig,
} from "@/lib/opsConfig";
import type { LabMetricsConfig } from "@/lib/labMetricsConfig";
import {
  fetchAllOpsConfig,
  saveDataExposureConfig,
  saveFollowUpPushConfig,
  saveLabMetricsOpsConfig,
  saveSystemOpsConfig,
} from "@/services/opsConfigService";

export function useOpsConfig(adminUid?: string) {
  const [labMetrics, setLabMetrics] = useState<LabMetricsConfig | null>(null);
  const [dataExposure, setDataExposure] = useState<DataExposureConfig | null>(null);
  const [followUpPush, setFollowUpPush] = useState<FollowUpPushConfig | null>(null);
  const [system, setSystem] = useState<SystemOpsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchAllOpsConfig();
      setLabMetrics(all.labMetrics);
      setDataExposure(all.dataExposure);
      setFollowUpPush(all.followUpPush);
      setSystem(all.system);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveLab = async (config: LabMetricsConfig) => {
    await saveLabMetricsOpsConfig(config, adminUid);
    setLabMetrics(config);
    setStatus("홈 KPI 설정이 Firestore에 저장되었습니다.");
  };

  const saveExposure = async (config: DataExposureConfig) => {
    await saveDataExposureConfig(config, adminUid);
    setDataExposure(config);
    setStatus("데이터 노출 설정이 저장되었습니다.");
  };

  const savePush = async (config: FollowUpPushConfig) => {
    await saveFollowUpPushConfig(config, adminUid);
    setFollowUpPush(config);
    setStatus("푸시 설정이 저장되었습니다.");
  };

  const saveSystemConfig = async (config: SystemOpsConfig) => {
    await saveSystemOpsConfig(config, adminUid);
    setSystem(config);
    setStatus("시스템 설정이 저장되었습니다.");
  };

  return {
    labMetrics,
    dataExposure,
    followUpPush,
    system,
    loading,
    status,
    setStatus,
    reload,
    saveLab,
    saveExposure,
    savePush,
    saveSystemConfig,
  };
}
