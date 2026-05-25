import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-md mx-auto px-4 pt-16 pb-8 min-h-dvh flex flex-col">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">💧</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">喝水助手</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          定时通过企业微信提醒你喝水<br />
          养成健康饮水习惯
        </p>
      </div>

      <div className="grid gap-3 mb-8">
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <div className="font-medium text-gray-800">每小时定时提醒</div>
            <div className="text-sm text-gray-400">8:00 ~ 22:00 整点推送</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <div className="font-medium text-gray-800">每日目标追踪</div>
            <div className="text-sm text-gray-400">记录进度，达成每日 8 杯水</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="font-medium text-gray-800">连续坚持统计</div>
            <div className="text-sm text-gray-400">看到自己的坚持，更有动力</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 mb-8">
        <Link
          href="/drink"
          className="block w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-semibold text-center rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.97] transition-transform"
        >
          开始使用 →
        </Link>

        <Link
          href="/login"
          className="block w-full py-3 bg-white text-blue-500 font-semibold text-center rounded-2xl border-2 border-blue-200 active:scale-[0.97] transition-transform hover:bg-blue-50"
        >
          🔑 ClawBot 扫码登录
        </Link>
      </div>

      <div className="mt-auto text-center text-xs text-gray-400 pt-8">
        首次使用请先扫码登录绑定企业微信机器人
      </div>
    </div>
  );
}