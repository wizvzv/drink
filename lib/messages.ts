const messages: string[] = [
  "🚰 水在等你，就像我在等你喝水～",
  "🥤 亲爱的，该喝水了！皮肤需要你～",
  "🧠 大脑缺水会变迟钝，快喝一杯！",
  "🌟 你已经坚持 {days} 天了，继续加油！",
  "🚨 缺水警报！请立即补水！",
  "💧 喝一杯水，给身体充充电～",
  "🌊 水流不息，生命不止。该喝水啦！",
  "☀️ 记得喝水，对自己好一点～",
  "🏃 运动员都需要补水，你也一样！",
  "🌸 多喝水，皮肤会感谢你的～",
  "⏰ 滴！喝水时间到～",
  "🎯 今日目标还差 {remaining} 杯，加油！",
  "💪 喝一杯，离健康更近一步！",
  "🍵 白开水是最好的饮料，来一杯吧～",
  "🔥 身体已经在燃烧了，快补水！",
  "📢 广播：请 {name} 同学立刻喝水！",
  "🎵 跟着节奏，一起喝水～ 咚次哒次～",
  "🧊 冰水虽好，但温水更养胃哦～",
  "❤️ 爱自己，从一杯水开始！",
  "✨ 每天8杯水，医生远离我～",
  "🎉 恭喜你又完成了一次喝水任务！",
  "🌱 身体就像植物，不浇水会枯萎的～",
  "🧪 科学证明：成年人每天需要 2L 水！",
  "🐪 别等到像骆驼一样渴才喝水～",
];

export function getRandomMessage(days: number, remaining: number, name: string): string {
  const msg = messages[Math.floor(Math.random() * messages.length)];
  return msg
    .replace("{days}", String(days))
    .replace("{remaining}", String(remaining))
    .replace("{name}", name);
}