import { useState, useEffect, useRef, useCallback } from "react";

// 2点ロック方式
// 樹高 = 距離 × (tan(上角) - tan(下角)) + 目の高さ
// ※下が負角の場合も対応
function calcHeight2(dist, topDeg, botDeg, eyeH) {
  const top = Math.tan((topDeg * Math.PI) / 180);
  const bot = Math.tan((botDeg * Math.PI) / 180);
  return +(dist * (top - bot) + eyeH).toFixed(1);
}

export default function App() {
  const [page, setPage] = useState(0); // 0=intro 1=dist 2=measure 3=result
  const [dist, setDist] = useState("");
  const [eyeH, setEyeH] = useState("1.5");
  const [bodyH, setBodyH] = useState("");
  const [walkCount, setWalkCount] = useState("");
  const [stride, setStride] = useState(null);
  const [distMode, setDistMode] = useState(0);
  const [liveDeg, setLiveDeg] = useState(null);
  const [botLocked, setBotLocked] = useState(null); // 下（根元）ロック
  const [topLocked, setTopLocked] = useState(null); // 上（梢）ロック
  const [sensorOn, setSensorOn] = useState(false);
  const [result, setResult] = useState(null);
  const liveRef = useRef(null);

  const onOrient = useCallback((e) => {
    if (e.beta == null) return;
    let v = +(e.beta - 90).toFixed(1);
    // -89〜89の範囲（下向きも負で表現）
    v = Math.max(-89, Math.min(89, v));
    liveRef.current = v;
    setLiveDeg(v);
  }, []);

  useEffect(() => () => window.removeEventListener("deviceorientation", onOrient), [onOrient]);

  const startSensor = async () => {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== "granted") { alert("センサーが許可されませんでした"); return; }
      }
      window.addEventListener("deviceorientation", onOrient);
      setSensorOn(true);
    } catch { alert("センサーを起動できませんでした"); }
  };

  const calcStrideAndDist = () => {
    const h = parseFloat(bodyH);
    if (!h) return;
    const s = +(h * 0.45 / 100).toFixed(3);
    setStride(s);
    if (walkCount) setDist(+(parseFloat(walkCount) * s).toFixed(1) + "");
  };

  const handleWalk = (v) => {
    setWalkCount(v);
    if (stride && v) setDist(+(parseFloat(v) * stride).toFixed(1) + "");
  };

  const lockBottom = () => {
    if (liveRef.current == null) return;
    setBotLocked(+liveRef.current.toFixed(1));
  };

  const lockTop = () => {
    if (liveRef.current == null) return;
    setTopLocked(+liveRef.current.toFixed(1));
  };

  const doCalc = () => {
    const d = parseFloat(dist), e = parseFloat(eyeH);
    if (!d || !e || botLocked == null || topLocked == null) return;
    const h = calcHeight2(d, topLocked, botLocked, e);
    setResult({ h, d, e, topDeg: topLocked, botDeg: botLocked });
    setPage(3);
  };

  const reset = () => {
    setPage(0); setDist(""); setEyeH("1.5"); setBodyH(""); setWalkCount("");
    setStride(null); setDistMode(0); setLiveDeg(null);
    setBotLocked(null); setTopLocked(null); setSensorOn(false); setResult(null);
    window.removeEventListener("deviceorientation", onOrient);
  };

  const shown = liveDeg ?? 0;
  const GRN = "#7ecba1";
  const box = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 14, padding: "18px", marginBottom: 12 };
  const primaryBtn = { width: "100%", padding: "14px", background: "#1a3a2a", border: `1px solid ${GRN}`, borderRadius: 12, color: "#e0f0ea", fontSize: 15, cursor: "pointer", marginBottom: 8, fontFamily: "inherit", letterSpacing: 1 };
  const ghostBtn = { width: "100%", padding: "12px", background: "transparent", border: "1px solid #4a7c5a", borderRadius: 12, color: "#a8d5b5", fontSize: 13, cursor: "pointer", marginBottom: 8, fontFamily: "inherit" };
  const inp = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(126,203,161,0.4)", borderRadius: 10, padding: "12px 14px", color: "#e0f0ea", fontSize: 20, outline: "none", fontFamily: "inherit" };
  const tab = (on) => ({ flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer", fontSize: 12, background: on ? "rgba(126,203,161,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? GRN : "rgba(126,203,161,0.2)"}`, color: on ? GRN : "#4a9070", fontFamily: "inherit" });
  const lbl = { fontSize: 12, color: "#a8d5b5", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#0c1820,#1a2e3a 50%,#0a1f14)", fontFamily: "'Georgia','Hiragino Mincho ProN',serif", color: "#e0f0ea" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px 48px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>
          <div style={{ fontSize: 40 }}>📐</div>
          <h1 style={{ fontSize: 20, fontWeight: "bold", letterSpacing: 3, color: GRN, margin: "4px 0 0" }}>樹高測定システム</h1>
          <p style={{ fontSize: 11, color: "#4a9070", letterSpacing: 2, margin: "4px 0 0" }}>TREE HEIGHT METER</p>
        </div>

        {/* Step bar */}
        {page > 0 && page < 3 && (
          <div style={{ display: "flex", gap: 4, margin: "14px 0" }}>
            {["① 距離入力", "② 角度測定", "③ 結果"].map((l, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 3, borderRadius: 2, background: i < page ? GRN : "rgba(126,203,161,0.2)", marginBottom: 4 }} />
                <span style={{ fontSize: 10, color: i < page ? GRN : "#4a9070" }}>{l}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── INTRO ── */}
        {page === 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={box}>
              <p style={{ fontSize: 12, color: GRN, textAlign: "center", letterSpacing: 1, marginBottom: 14 }}>測定の仕組み（2点ロック方式）</p>
              <svg viewBox="0 0 280 160" style={{ width: "100%", height: "auto", display: "block" }}>
                {/* 地面 */}
                <line x1="20" y1="130" x2="260" y2="130" stroke="#4a9070" strokeWidth="1.5" />
                {/* 木 */}
                <line x1="220" y1="130" x2="220" y2="20" stroke={GRN} strokeWidth="3" />
                <ellipse cx="220" cy="20" rx="22" ry="14" fill="#2d6a4f" opacity="0.85" />
                {/* 人 */}
                <circle cx="50" cy="107" r="7" fill={GRN} opacity="0.85" />
                <line x1="50" y1="114" x2="50" y2="130" stroke={GRN} strokeWidth="2" />
                {/* 上への視線（梢） */}
                <line x1="50" y1="107" x2="220" y2="20" stroke="#ffd166" strokeWidth="1.5" strokeDasharray="5,3" />
                {/* 下への視線（根元） */}
                <line x1="50" y1="107" x2="220" y2="125" stroke="#74b3ce" strokeWidth="1.5" strokeDasharray="5,3" />
                {/* 上角度弧 */}
                <path d="M 78 107 A 28 28 0 0 1 68 85" fill="none" stroke="#ffd166" strokeWidth="1.5" />
                <text x="84" y="98" fill="#ffd166" fontSize="9">上角</text>
                {/* 下角度弧 */}
                <path d="M 78 107 A 18 18 0 0 0 92 113" fill="none" stroke="#74b3ce" strokeWidth="1.5" />
                <text x="86" y="122" fill="#74b3ce" fontSize="9">下角</text>
                {/* 距離 */}
                <line x1="50" y1="142" x2="220" y2="142" stroke="#74b3ce" strokeWidth="1" strokeDasharray="4,3" />
                <text x="130" y="152" fill="#74b3ce" fontSize="9" textAnchor="middle">距離 d</text>
                {/* 樹高 */}
                <line x1="232" y1="20" x2="232" y2="130" stroke="#a8d5b5" strokeWidth="1" strokeDasharray="3,2" />
                <text x="248" y="80" fill="#a8d5b5" fontSize="9">樹高</text>
              </svg>
              <p style={{ fontSize: 11, color: "#a8d5b5", textAlign: "center", margin: "10px 0 0", lineHeight: 1.8 }}>
                ① 根元をロック → ② 梢をロック<br/>
                2点の角度差から樹高を計算
              </p>
            </div>

            <div style={{ ...box, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, color: GRN, margin: "0 0 8px" }}>測定手順</p>
              {[
                "① 木から10〜30m離れる",
                "② 距離と身長を入力",
                "③ カメラを根元に向けてロック",
                "④ カメラを梢に向けてロック",
                "⑤ 樹高を自動計算"
              ].map((t, i) => (
                <p key={i} style={{ fontSize: 12, color: "#a8d5b5", margin: "5px 0", lineHeight: 1.6 }}>{t}</p>
              ))}
            </div>

            <button style={primaryBtn} onClick={() => setPage(1)}>🌲　測定を開始する</button>
          </div>
        )}

        {/* ── DISTANCE ── */}
        {page === 1 && (
          <div>
            <div style={box}>
              <p style={{ fontSize: 13, color: GRN, marginBottom: 14 }}>身長・目の高さ</p>
              <span style={lbl}>身長（cm）：</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input style={inp} type="number" value={bodyH} onChange={e => { setBodyH(e.target.value); setStride(null); }} placeholder="例: 170" />
                <span style={{ color: GRN, minWidth: 24 }}>cm</span>
              </div>
              {bodyH && <div style={{ background: "rgba(126,203,161,0.08)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 11, color: GRN }}>
                推定歩幅：{Math.round(parseFloat(bodyH) * 0.45)} cm　／　目の高さ目安：{(parseFloat(bodyH) * 0.93 / 100).toFixed(2)} m
              </div>}
              <span style={lbl}>目の高さ（m）：</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input style={inp} type="number" value={eyeH} onChange={e => setEyeH(e.target.value)} placeholder="1.5" />
                <span style={{ color: GRN, minWidth: 24 }}>m</span>
              </div>
              {bodyH && <button onClick={() => setEyeH((parseFloat(bodyH) * 0.93 / 100).toFixed(2))}
                style={{ fontSize: 11, color: GRN, background: "rgba(126,203,161,0.1)", border: "1px solid rgba(126,203,161,0.3)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                身長から自動入力
              </button>}
            </div>

            <div style={box}>
              <p style={{ fontSize: 13, color: GRN, marginBottom: 12 }}>木までの距離</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <button style={tab(distMode === 0)} onClick={() => setDistMode(0)}>📏 直接入力（m）</button>
                <button style={tab(distMode === 1)} onClick={() => setDistMode(1)}>👣 歩数で入力</button>
              </div>
              {distMode === 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={inp} type="number" value={dist} onChange={e => setDist(e.target.value)} placeholder="例: 15" />
                  <span style={{ color: GRN, minWidth: 24 }}>m</span>
                </div>
              )}
              {distMode === 1 && (
                <>
                  <button style={{ ...primaryBtn, padding: "10px", fontSize: 12 }} onClick={calcStrideAndDist} disabled={!bodyH}>
                    👣 身長から歩幅を計算
                  </button>
                  {!bodyH && <p style={{ fontSize: 11, color: "#4a7c5a" }}>※ 先に身長を入力してください</p>}
                  {stride && <div style={{ background: "rgba(126,203,161,0.1)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 12, color: GRN }}>
                    推定歩幅：{(stride * 100).toFixed(0)} cm
                  </div>}
                  <span style={lbl}>歩数：</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <input style={inp} type="number" value={walkCount} onChange={e => handleWalk(e.target.value)} placeholder="例: 20" />
                    <span style={{ color: GRN, minWidth: 24 }}>歩</span>
                  </div>
                  {dist && stride && <div style={{ background: "rgba(126,203,161,0.08)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: GRN }}>
                    {walkCount}歩 × {(stride * 100).toFixed(0)}cm ＝ 約 <strong>{dist} m</strong>
                  </div>}
                </>
              )}
            </div>

            <button style={primaryBtn} onClick={() => setPage(2)}>次へ → 角度を測定する</button>
            <button style={ghostBtn} onClick={reset}>← 最初に戻る</button>
          </div>
        )}

        {/* ── MEASURE ── */}
        {page === 2 && (
          <div>
            <div style={box}>
              <p style={{ fontSize: 13, color: GRN, marginBottom: 4 }}>角度を測定する（2点ロック）</p>
              <p style={{ fontSize: 11, color: "#a8d5b5", marginBottom: 16 }}>スマホのカメラを覗きながら根元→梢の順にロック</p>

              {/* センサー起動 */}
              {!sensorOn && (
                <button style={primaryBtn} onClick={startSensor}>📱　センサーを起動する</button>
              )}

              {sensorOn && (
                <>
                  {/* 現在角度の大表示 */}
                  <div style={{ textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: "#4a9070", margin: "0 0 4px", letterSpacing: 1 }}>📡 現在の角度</p>
                    <p style={{ fontSize: 64, fontWeight: "bold", color: shown >= 0 ? GRN : "#74b3ce", margin: 0, lineHeight: 1, letterSpacing: -2 }}>
                      {shown > 0 ? "+" : ""}{shown.toFixed(1)}
                    </p>
                    <p style={{ fontSize: 13, color: "#a8d5b5", margin: "4px 0 0" }}>度　{shown > 5 ? "↑ 上向き" : shown < -5 ? "↓ 下向き" : "→ ほぼ水平"}</p>
                  </div>

                  {/* ステップ1: 下をロック */}
                  <div style={{ background: botLocked != null ? "rgba(116,179,206,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${botLocked != null ? "rgba(116,179,206,0.5)" : "rgba(126,203,161,0.2)"}`, borderRadius: 12, padding: "14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, color: botLocked != null ? "#74b3ce" : "#a8d5b5", margin: 0, fontWeight: "bold" }}>
                          {botLocked != null ? "✅ 根元ロック済み" : "① 根元をロック"}
                        </p>
                        <p style={{ fontSize: 11, color: "#4a7c5a", margin: "4px 0 0" }}>
                          {botLocked != null ? `${botLocked > 0 ? "+" : ""}${botLocked}°` : "カメラを木の根元に向けてロック"}
                        </p>
                      </div>
                      {botLocked != null
                        ? <button onClick={() => setBotLocked(null)} style={{ fontSize: 11, color: "#74b3ce", background: "rgba(116,179,206,0.1)", border: "1px solid rgba(116,179,206,0.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>やり直す</button>
                        : <button onClick={lockBottom} style={{ padding: "10px 16px", background: "rgba(116,179,206,0.2)", border: "1px solid rgba(116,179,206,0.5)", borderRadius: 10, color: "#74b3ce", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>🔒 ロック</button>
                      }
                    </div>
                  </div>

                  {/* ステップ2: 上をロック */}
                  <div style={{ background: topLocked != null ? "rgba(255,209,102,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${topLocked != null ? "rgba(255,209,102,0.5)" : "rgba(126,203,161,0.2)"}`, borderRadius: 12, padding: "14px", marginBottom: 10, opacity: botLocked == null ? 0.4 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, color: topLocked != null ? "#ffd166" : "#a8d5b5", margin: 0, fontWeight: "bold" }}>
                          {topLocked != null ? "✅ 梢ロック済み" : "② 梢をロック"}
                        </p>
                        <p style={{ fontSize: 11, color: "#4a7c5a", margin: "4px 0 0" }}>
                          {topLocked != null ? `+${topLocked}°` : "次にカメラを木のてっぺんに向けてロック"}
                        </p>
                      </div>
                      {topLocked != null
                        ? <button onClick={() => setTopLocked(null)} style={{ fontSize: 11, color: "#ffd166", background: "rgba(255,209,102,0.1)", border: "1px solid rgba(255,209,102,0.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>やり直す</button>
                        : <button onClick={lockTop} disabled={botLocked == null} style={{ padding: "10px 16px", background: "rgba(255,209,102,0.2)", border: "1px solid rgba(255,209,102,0.5)", borderRadius: 10, color: "#ffd166", fontSize: 14, cursor: botLocked == null ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: "bold" }}>🔒 ロック</button>
                      }
                    </div>
                  </div>

                  {/* 角度差の確認 */}
                  {botLocked != null && topLocked != null && (
                    <div style={{ background: "rgba(126,203,161,0.1)", border: "1px solid rgba(126,203,161,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: GRN, margin: 0 }}>
                        角度差：{(topLocked - botLocked).toFixed(1)}°（根元 {botLocked > 0 ? "+" : ""}{botLocked}° → 梢 +{topLocked}°）
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {botLocked != null && topLocked != null && (
              <button style={{ ...primaryBtn, background: "#2a4a1a", borderColor: "#ffd166", color: "#ffd166" }} onClick={doCalc}>
                🌲　樹高を計算する
              </button>
            )}
            <button style={ghostBtn} onClick={() => setPage(1)}>← 距離の入力に戻る</button>
          </div>
        )}

        {/* ── RESULT ── */}
        {page === 3 && result && (
          <div style={{ marginTop: 8 }}>
            <div style={{ background: "linear-gradient(135deg,#1a3a2a99,#0a2a1a55)", border: "1px solid rgba(126,203,161,0.35)", borderRadius: 20, padding: "24px 20px", textAlign: "center", marginBottom: 14 }}>
              <div style={{ position: "relative", height: 110, width: 80, margin: "0 auto 14px" }}>
                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 12, background: "linear-gradient(#5d4037,#8d6e63)", borderRadius: 4, height: Math.min(95, result.h * 4) }} />
                <div style={{ position: "absolute", bottom: Math.max(0, Math.min(95, result.h * 4) - 8), left: "50%", transform: "translateX(-50%)", width: 58, height: 58, borderRadius: "50% 50% 40% 40%", background: "radial-gradient(circle at 40% 40%,#52b788,#1b4332)" }} />
              </div>
              <p style={{ fontSize: 11, color: GRN, margin: "0 0 2px", letterSpacing: 2 }}>推定樹高</p>
              <p style={{ fontSize: 68, fontWeight: "bold", color: "#e0f0ea", margin: 0, lineHeight: 1, letterSpacing: -3 }}>{result.h}</p>
              <p style={{ fontSize: 18, color: GRN, margin: "4px 0 14px" }}>m</p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {[["🏠", "1階建て", 3], ["🏢", "3階建て", 10], ["🪝", "電柱", 12], ["🏬", "5階建て", 16]].map(([e, l, h]) => (
                  <div key={l} style={{ background: result.h >= h ? "rgba(126,203,161,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${result.h >= h ? "rgba(126,203,161,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "5px 9px", fontSize: 11, color: result.h >= h ? GRN : "#4a7c5a" }}>
                    {e} {l}より{result.h >= h ? "高い" : "低い"}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(126,203,161,0.15)", padding: "14px 18px", marginBottom: 12 }}>
              {[
                ["水平距離", `${result.d} m`],
                ["根元の角度", `${result.botDeg > 0 ? "+" : ""}${result.botDeg}°`],
                ["梢の角度", `+${result.topDeg}°`],
                ["角度差", `${(result.topDeg - result.botDeg).toFixed(1)}°`],
                ["目の高さ", `${result.e} m`],
              ].map(([l, v], i, arr) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(126,203,161,0.1)" : "none" }}>
                  <span style={{ fontSize: 11, color: "#4a9070" }}>{l}</span>
                  <span style={{ fontSize: 13, color: "#e0f0ea" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "#ffc107", margin: 0, lineHeight: 1.7 }}>⚠️ 地面の傾斜や距離の誤差により、実際の樹高と異なる場合があります。</p>
            </div>
            <button style={primaryBtn} onClick={reset}>📐　もう一度測定する</button>
          </div>
        )}
      </div>
    </div>
  );
}
