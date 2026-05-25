"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type LoginStatus = "waiting" | "scanned" | "confirmed" | "expired" | "error";

export default function LoginPage() {
  const [qrcode, setQrcode] = useState<string>("");
  const [qrcodeImg, setQrcodeImg] = useState<string>("");
  const [status, setStatus] = useState<LoginStatus>("waiting");
  const [message, setMessage] = useState("等待扫码...");
  const [loading, setLoading] = useState(true);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchQrcode = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/qrcode");
      const data = await res.json();
      if (data.success) {
        setQrcode(data.qrcode);
        setQrcodeImg(data.qrcodeImg);
        setStatus("waiting");
        setMessage("请用微信扫描下方二维码");
      } else {
        setStatus("error");
        setMessage(data.error || "获取二维码失败");
      }
    } catch {
      setStatus("error");
      setMessage("网络错误，请刷新重试");
    } finally {
      setLoading(false);
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!qrcode) return;

    try {
      const res = await fetch("/api/auth/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrcode }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.status === "waiting") {
          setStatus("waiting");
          setMessage("等待扫码...");
        } else if (data.status === "scanned") {
          setStatus("scanned");
          setMessage("✅ 已扫码，请在手机上确认登录...");
        } else if (data.status === "confirmed") {
          setStatus("confirmed");
          setMessage("🎉 登录成功！正在保存凭证...");
          
          // 保存凭证
          await fetch("/api/auth/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: data.bot_token,
              accountId: data.ilink_bot_id,
              userId: data.ilink_user_id,
              baseUrl: data.baseurl,
            }),
          });
          
          setMessage("✅ 凭证已保存，3 秒后跳转到首页...");
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
          return; // 停止轮询
        } else if (data.status === "expired") {
          setStatus("expired");
          setMessage("❌ 二维码已过期，请刷新重试");
          return; // 停止轮询
        }
      }
    } catch {
      // 网络错误，继续轮询
    }
  }, [qrcode]);

  useEffect(() => {
    fetchQrcode();
  }, [fetchQrcode]);

  useEffect(() => {
    if (status === "confirmed" || status === "expired" || status === "error") {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // 立即轮询一次
    pollStatus();

    // 每 2 秒轮询一次
    pollTimerRef.current = setInterval(() => {
      pollStatus();
    }, 2000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [status, pollStatus]);

  const handleRefresh = () => {
    setLoading(true);
    fetchQrcode();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-blue-500 text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-16 pb-8 min-h-dvh flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ClawBot 扫码登录</h1>
        <p className="text-gray-500 text-sm">使用微信扫码绑定企业微信机器人</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-8 mb-6">
        {status === "error" ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              刷新重试
            </button>
          </div>
        ) : status === "expired" ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏰</div>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              重新获取二维码
            </button>
          </div>
        ) : status === "confirmed" ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 mb-2">{message}</p>
            <div className="text-green-500 text-sm mt-4">即将跳转到首页...</div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-4">{message}</div>
              {status === "scanned" && (
                <div className="text-blue-500 font-medium animate-pulse">请在手机上确认</div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              {qrcodeImg && (
                <img
                  src={qrcodeImg}
                  alt="登录二维码"
                  className="w-full max-w-[240px] mx-auto rounded-lg border border-gray-200"
                />
              )}
            </div>

            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                <span>打开微信，使用「扫一扫」扫描上方二维码</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                <span>在手机上确认登录企业微信机器人</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                <span>登录成功后会自动跳转，并保存凭证到服务器</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleRefresh}
                className="text-blue-500 text-sm hover:text-blue-600 transition-colors"
              >
                ↻ 刷新二维码
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto text-center text-xs text-gray-400">
        登录凭证将保存在服务器的 data/clawbot-credentials.json
      </div>
    </div>
  );
}
