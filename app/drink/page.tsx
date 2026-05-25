"use client";

import { useState, useEffect, useCallback } from "react";

interface Stats {
  today: { cups: number; totalMl: number; logs: { time: string; ml: number }[] };
  consecutiveDays: number;
  enabled: boolean;
  dailyGoalCups: number;
  cupVolumeMl: number;
  startHour: number;
  endHour: number;
  nextReminder: string | null;
}

interface Settings {
  startHour: number;
  endHour: number;
  dailyGoalCups: number;
  cupVolumeMl: number;
}

export default function DrinkPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Settings>({
    startHour: 8,
    endHour: 22,
    dailyGoalCups: 8,
    cupVolumeMl: 250,
  });
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSettingsForm({
          startHour: data.stats.startHour,
          endHour: data.stats.endHour,
          dailyGoalCups: data.stats.dailyGoalCups,
          cupVolumeMl: data.stats.cupVolumeMl,
        });
      }
    } catch {
      showToast("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDrink = async () => {
    try {
      const res = await fetch("/api/record", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.success) {
        showToast("已记录一杯 🥤");
        fetchStats();
      }
    } catch {
      showToast("记录失败");
    }
  };

  const handleToggle = async () => {
    try {
      const res = await fetch("/api/toggle", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(data.enabled ? "提醒已开启 🔔" : "提醒已关闭 🔕");
        fetchStats();
      }
    } catch {
      showToast("操作失败");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("设置已保存 ✅");
        setShowSettings(false);
        fetchStats();
      }
    } catch {
      showToast("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleTestReminder = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/test-reminder");
      const data = await res.json();
      if (data.success) {
        showToast("测试提醒已发送 ✅");
      } else {
        showToast(data.error || "发送失败");
      }
    } catch {
      showToast("发送失败，请检查网络");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-blue-500 text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  const progress = stats ? Math.min(100, Math.round((stats.today.cups / stats.dailyGoalCups) * 100)) : 0;
  const totalMl = stats?.today.totalMl ?? 0;
  const targetMl = stats ? stats.dailyGoalCups * stats.cupVolumeMl : 2000;

  return (
    <div className="max-w-md mx-auto px-4 pb-8 pt-6 min-h-dvh flex flex-col">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm shadow-lg animate-slide-up">
          {toast}
        </div>
      )}

      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">喝水助手</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats?.consecutiveDays ? `已坚持 ${stats.consecutiveDays} 天 🔥` : "今天开始喝水吧 💪"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
            stats?.enabled ? "bg-blue-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
              stats?.enabled ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">今日喝水进度</span>
          <span className="text-sm text-blue-500 font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-gray-800">
            {stats?.today.cups ?? 0}
            <span className="text-base font-normal text-gray-400">/{stats?.dailyGoalCups ?? 8} 杯</span>
          </span>
          <span className="text-sm text-gray-400">{totalMl}ml/{targetMl}ml</span>
        </div>
      </div>

      <button
        onClick={handleDrink}
        className="w-full py-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-semibold rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.97] transition-transform mb-4"
      >
        🥤 喝了一杯
      </button>

      <button
        onClick={handleTestReminder}
        disabled={sendingTest}
        className="w-full py-3 bg-white text-blue-500 font-medium rounded-2xl border-2 border-blue-200 active:scale-[0.97] transition-transform mb-4 disabled:opacity-50 hover:bg-blue-50"
      >
        {sendingTest ? "发送中..." : "📤 发送测试提醒"}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">下次提醒</div>
            <div className="text-lg font-semibold text-gray-800">
              {stats?.enabled ? stats?.nextReminder ?? "--" : "已关闭"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">提醒时段</div>
            <div className="text-lg font-semibold text-gray-800">
              {String(stats?.startHour ?? 8).padStart(2, "0")}:00 - {String(stats?.endHour ?? 22).padStart(2, "0")}:00
            </div>
          </div>
        </div>
      </div>

      {stats && stats.today.logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">今日喝水记录</h3>
          <div className="flex flex-wrap gap-2">
            {stats.today.logs.map((log, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                🥤 {log.time}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full py-3 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-gray-700 transition-colors"
        >
          ⚙️ {showSettings ? "收起设置" : "提醒设置"}
        </button>

        {showSettings && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mt-2 animate-slide-up">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">提醒开始时间</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={settingsForm.startHour}
                    onChange={(e) => setSettingsForm({ ...settingsForm, startHour: Math.min(23, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-center text-lg font-semibold"
                  />
                  <span className="text-gray-400">:00</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">提醒结束时间</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={settingsForm.endHour}
                    onChange={(e) => setSettingsForm({ ...settingsForm, endHour: Math.min(23, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-center text-lg font-semibold"
                  />
                  <span className="text-gray-400">:00</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">每日目标（杯）</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settingsForm.dailyGoalCups}
                  onChange={(e) => setSettingsForm({ ...settingsForm, dailyGoalCups: Math.min(30, Math.max(1, Number(e.target.value))) })}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-center text-lg font-semibold"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">每杯容量（ml）</label>
                <input
                  type="number"
                  min={50}
                  max={1000}
                  step={50}
                  value={settingsForm.cupVolumeMl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cupVolumeMl: Math.min(1000, Math.max(50, Number(e.target.value))) })}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-center text-lg font-semibold"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "保存设置"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}