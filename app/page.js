"use client";

import { useState, useMemo, useRef } from "react";

function parseXML(xmlText) {
  const pattern = /<Record\s[^>]*HKCategoryTypeIdentifierSleepAnalysis[^>]*>/gs;
  const records = [];
  for (const m of xmlText.matchAll(pattern)) {
    const tag = m[0];
    const get = (attr) => { const x = tag.match(new RegExp(`${attr}="([^"]+)"`)); return x ? x[1] : null; };
    const value = get("value") || "";
    const type = value.replace("HKCategoryValueSleepAnalysis", "");
    if (type === "InBed") continue;
    const sd = get("startDate"), ed = get("endDate");
    if (!sd || !ed) continue;
    const start = new Date(sd.replace(" +0900", "+09:00"));
    const end   = new Date(ed.replace(" +0900", "+09:00"));
    if (isNaN(start) || isNaN(end)) continue;
    records.push({ start, end, type });
  }
  return records;
}

function toJST(date) {
  const d = new Date(date.getTime() + 9 * 3600 * 1000);
  return {
    month:   d.getUTCMonth() + 1,
    day:     d.getUTCDate(),
    hour:    d.getUTCHours(),
    minute:  d.getUTCMinutes(),
    dateStr: `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`,
  };
}

function groupIntoSessions(records) {
  if (!records.length) return [];
  const sorted = [...records].sort((a, b) => a.start - b.start);
  const sessions = [];
  let cur = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].start - cur[cur.length-1].end) / 60000;
    if (gap > 60) { sessions.push(cur); cur = [sorted[i]]; }
    else cur.push(sorted[i]);
  }
  sessions.push(cur);
  return sessions.map(segs => {
    const start = segs[0].start;
    const end   = segs[segs.length-1].end;
    const asleepMin = segs.filter(s => s.type !== "Awake").reduce((s, x) => s + (x.end - x.start)/60000, 0);
    return { start, end, startJST: toJST(start), endJST: toJST(end), asleepMin, segs };
  }).filter(s => s.asleepMin > 5);
}

function fmt(min) {
  const h = Math.floor(min/60), m = Math.round(min%60);
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}
function fmtTime(jst) {
  return `${String(jst.hour).padStart(2,'0')}:${String(jst.minute).padStart(2,'0')}`;
}
const WD = ["日","月","火","水","木","金","土"];
function fmtDate(dateS) {
  const d = new Date(dateS + "T12:00:00+09:00");
  return `${d.getMonth()+1}月${d.getDate()}日（${WD[d.getDay()]}）`;
}

export default function SleepLog() {
  const [sessions, setSessions] = useState(null);
  const [allDates, setAllDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateNotFound, setDateNotFound] = useState(false);
  const touchStartX = useRef(null);
  const dateInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const text = await file.text();
      const records = parseXML(text);
      if (!records.length) throw new Error("睡眠データが見つかりませんでした。sleep_recent.xml を選んでください。");
      const sess = groupIntoSessions(records);
      setSessions(sess);
      const dateSet = new Set();
      sess.forEach(s => { dateSet.add(s.startJST.dateStr); dateSet.add(s.endJST.dateStr); });
      const sorted = [...dateSet].sort();
      setAllDates(sorted);
      setCurrentDate(sorted[sorted.length - 1]);
    } catch(err) { setError(err.message); }
    setLoading(false);
  };

  const daySessions = useMemo(() => {
    if (!sessions || !currentDate) return [];
    return sessions.filter(s => s.startJST.dateStr === currentDate || s.endJST.dateStr === currentDate);
  }, [sessions, currentDate]);

  const dayStartMs = new Date(currentDate + "T00:00:00+09:00").getTime();
  const dayEndMs   = dayStartMs + 24 * 60 * 60 * 1000;
  const totalMin = daySessions.reduce((total, s) => {
    const clipped = s.segs
      .filter(seg => seg.type !== "Awake")
      .reduce((sum, seg) => {
        const clipStart = Math.max(seg.start.getTime(), dayStartMs);
        const clipEnd   = Math.min(seg.end.getTime(),   dayEndMs);
        return sum + Math.max(0, (clipEnd - clipStart) / 60000);
      }, 0);
    return total + clipped;
  }, 0);
  const idx = allDates.indexOf(currentDate);
  const prevDate = idx > 0 ? allDates[idx-1] : null;
  const nextDate = idx < allDates.length-1 ? allDates[idx+1] : null;

  const handleJump = (e) => {
    const d = e.target.value;
    if (!d) { setDateNotFound(false); return; }
    if (allDates.includes(d)) {
      setCurrentDate(d);
      setDateNotFound(false);
    } else {
      setDateNotFound(true);
    }
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50 && prevDate) { setCurrentDate(prevDate); setDateNotFound(false); }
    if (dx < -50 && nextDate) { setCurrentDate(nextDate); setDateNotFound(false); }
    touchStartX.current = null;
  };

  const C = {
    bg:          "#0B0B18",
    card:        "#17162A",
    hover:       "#1D1B34",
    border:      "rgba(154, 139, 219, 0.28)",
    borderStrong:"rgba(184, 160, 255, 0.45)",
    accent:      "#B794F6",
    accentStrong:"#C7A8FF",
    heading:     "#F3F0FF",
    text:        "#B9AEDF",
    sub:         "#9186B8",
    link:        "#B794F6",
    warn:        "#FFB86B",
    warnFaint:   "rgba(255, 184, 107, 0.35)",
  };

  return (
    <div className="outer-container" style={{ background:C.bg, color:C.text,
      fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      <div style={{ padding:"28px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.sub, marginBottom:4 }}>SLEEP LOG</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:10, color:C.heading }}>睡眠ログ</div>
        <div style={{ fontSize:14, color:C.sub, lineHeight:1.8 }}>
          <div style={{ marginBottom:4 }}>対応環境：iPhone（iOS）限定 / Apple Watch推奨</div>
          <div>Apple Watchを装着して睡眠することで、睡眠ステージの自動記録が可能になります。Apple Watchをお持ちでない場合も、手動入力のデータがあれば睡眠時間の確認が可能です。</div>
        </div>
      </div>

      {!sessions && (
        <div style={{ padding:20 }}>
          <details style={{ marginBottom:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <summary style={{ padding:"12px 16px", cursor:"pointer", fontSize:13, fontWeight:600, color:C.text, listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>🔒 プライバシーとセキュリティについて</span>
              <span style={{ fontSize:11, color:C.sub }}>タップして確認</span>
            </summary>
            <div style={{ padding:"0 16px 16px", fontSize:13, color:C.sub, lineHeight:1.9 }}>
              <p style={{ margin:"12px 0 8px 0" }}>このアプリはアップロードされたデータをサーバーに一切送信しません。</p>
              <p style={{ margin:"0 0 8px 0" }}>すべての処理はあなたのブラウザ内で完結します。</p>
              <p style={{ margin:"0 0 8px 0" }}>アップロードしたファイルの内容が外部に送信されたり、本サービスに保存・利用されることはありません。</p>
              <p style={{ margin:0 }}>インターネット接続はアプリの読み込み時のみ使用されます。</p>
            </div>
          </details>
          <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            border:`2px dashed ${C.borderStrong}`, borderRadius:16, padding:"52px 24px",
            cursor:"pointer", background:C.card, gap:14 }}>
            <input type="file" accept=".xml" onChange={handleFile} style={{ display:"none" }} />
            <div style={{ fontSize:40 }}>📂</div>
            <div style={{ fontSize:15, fontWeight:600, color:C.heading }}>export.xml を選択</div>
            <div style={{ fontSize:13, color:C.sub, lineHeight:2.0, width:"100%" }}>
              <p style={{ margin:"0 0 10px 0" }}>Appleヘルスケア → 右上のアイコン押下 → 「すべてのヘルスケアデータを書き出す」でエクスポートしてください。</p>
              <p style={{ margin:"0 0 10px 0" }}>zipを解凍後、apple_health_export フォルダ内の export.xml をアップロードしてください。</p>
              <p style={{ margin:"0 0 10px 0" }}>ファイルが大きい場合は読み込みに失敗することがあります。<br className="pc-br" />必要な期間のデータに切り取るなど整形してからアップロードし直してください。</p>
              <p style={{ margin:0 }}>お問い合わせは作成者の <a href="https://x.com/roadstagineer" target="_blank" rel="noopener noreferrer" style={{ color:C.link }}>X (@roadstagineer)</a> まで。</p>
            </div>
          </label>
          {loading && (
            <div style={{ marginTop:24, textAlign:"center" }}>
              <div style={{ fontSize:13, color:C.sub, marginBottom:8 }}>解析中...</div>
              <div style={{ fontSize:11, color:C.sub }}>少し時間がかかります</div>
            </div>
          )}
          {error && <div style={{ marginTop:16, padding:14, background:"#2a1020", borderRadius:12,
            color:"#e88", fontSize:13, lineHeight:1.6 }}>{error}</div>}
        </div>
      )}

      {sessions && currentDate && (
        <div style={{ paddingBottom:48 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 12px", borderBottom:`1px solid ${C.border}`, gap:8 }}>
            <button onClick={() => { if (prevDate) { setCurrentDate(prevDate); setDateNotFound(false); } }}
              style={{ width:44, height:44, borderRadius:22, border:`1px solid ${C.border}`, background:"transparent",
                color: prevDate ? C.heading : C.sub, fontSize:22, cursor: prevDate ? "pointer" : "default", flexShrink:0 }}>
              ‹
            </button>
            <div style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:18, fontWeight:700, color:C.heading }}>{fmtDate(currentDate)}</div>
              <div style={{ fontSize:11, color:C.sub, marginTop:3 }}>
                {prevDate && `← ${new Date(prevDate+"T12:00:00+09:00").getDate()}日`}
                {prevDate && nextDate && "　"}
                {nextDate && `${new Date(nextDate+"T12:00:00+09:00").getDate()}日 →`}
                {!prevDate && !nextDate && "　"}
              </div>
            </div>
            <button onClick={() => { if (nextDate) { setCurrentDate(nextDate); setDateNotFound(false); } }}
              style={{ width:44, height:44, borderRadius:22, border:`1px solid ${C.border}`, background:"transparent",
                color: nextDate ? C.heading : C.sub, fontSize:22, cursor: nextDate ? "pointer" : "default", flexShrink:0 }}>
              ›
            </button>
          </div>

          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.sub }}>日付を指定：</span>
            <input type="date" ref={dateInputRef} onChange={handleJump}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"5px 8px", color:C.text, fontSize:13, colorScheme:"dark" }} />
            <span className="sp-calendar-emoji" style={{ fontSize:18 }}>🗓️</span>
          </div>

          <div style={{ padding:"16px 16px 0" }}>
            {dateNotFound ? (
              <div style={{ textAlign:"center", padding:"56px 20px" }}>
                <div style={{ fontSize:16, color:C.warn, marginBottom:28 }}>この日付のデータはありません</div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                  <button onClick={() => { setCurrentDate(allDates[0]); setDateNotFound(false); if (dateInputRef.current) dateInputRef.current.value = ""; }}
                    style={{ fontSize:13, color:C.text, background:C.card, border:`1px solid ${C.border}`,
                      borderRadius:20, padding:"8px 20px", cursor:"pointer" }}>
                    データの最初の日付を見る（{fmtDate(allDates[0])}）
                  </button>
                  <button onClick={() => { setCurrentDate(allDates[allDates.length-1]); setDateNotFound(false); if (dateInputRef.current) dateInputRef.current.value = ""; }}
                    style={{ fontSize:13, color:C.text, background:C.card, border:`1px solid ${C.border}`,
                      borderRadius:20, padding:"8px 20px", cursor:"pointer" }}>
                    データの最後の日付を見る（{fmtDate(allDates[allDates.length-1])}）
                  </button>
                </div>
              </div>
            ) : daySessions.length === 0 ? (
              <div style={{ textAlign:"center", padding:"56px 0", color:C.sub, fontSize:14 }}>
                この日の睡眠データはありません
              </div>
            ) : daySessions.map((s, i) => {
              const crossStart = s.startJST.dateStr !== currentDate;
              const crossEnd   = s.endJST.dateStr   !== currentDate;
              const inBedMin = (s.end - s.start) / 60000;
              const awakePercent = Math.round((1 - s.asleepMin / inBedMin) * 100);
              const stats = [
                { label:"在床", value:fmt(inBedMin), color:C.heading },
                { label:"睡眠", value:fmt(s.asleepMin), color:C.heading },
                { label:"覚醒", value:`${awakePercent}%`, color: awakePercent >= 20 ? C.warn : C.warnFaint },
              ];
              return (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                  padding:"18px 20px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ textAlign:"center", minWidth:56 }}>
                      {crossStart && (
                        <div style={{ fontSize:10, color:C.accent, marginBottom:2, whiteSpace:"nowrap" }}>
                          前日 {s.startJST.month}/{s.startJST.day}
                        </div>
                      )}
                      <div style={{ fontSize:28, fontWeight:700, fontVariantNumeric:"tabular-nums",
                        letterSpacing:-1, lineHeight:1, color:C.heading }}>
                        {fmtTime(s.startJST)}
                      </div>
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <div style={{ width:"100%", height:1,
                        background:`linear-gradient(to right, ${C.border}, ${C.accent}, ${C.border})` }} />
                      <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"4px 14px" }}>
                        {stats.map(({ label, value, color }) => (
                          <div key={label} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:10, color:C.text, marginBottom:1 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign:"center", minWidth:56 }}>
                      {crossEnd && (
                        <div style={{ fontSize:10, color:C.warn, marginBottom:2, whiteSpace:"nowrap" }}>
                          翌日 {s.endJST.month}/{s.endJST.day}
                        </div>
                      )}
                      <div style={{ fontSize:28, fontWeight:700, fontVariantNumeric:"tabular-nums",
                        letterSpacing:-1, lineHeight:1, color:C.heading }}>
                        {fmtTime(s.endJST)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!dateNotFound && daySessions.length > 0 && (
              <div style={{ padding:"14px 18px", background:C.card, border:`1px solid ${C.border}`,
                borderRadius:14, display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:2 }}>
                <div style={{ fontSize:13, color:C.sub }}>合計睡眠時間（覚醒除く）</div>
                <div style={{ fontSize:20, fontWeight:700, color:C.heading }}>{fmt(totalMin)}</div>
              </div>
            )}
          </div>

          <div style={{ textAlign:"center", marginTop:28 }}>
            <button onClick={() => { setSessions(null); setCurrentDate(null); }}
              style={{ fontSize:12, color:C.text, background:"transparent", border:`1px solid ${C.border}`,
                borderRadius:20, padding:"6px 18px", cursor:"pointer" }}>
              ← ファイルを変更
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
