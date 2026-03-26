import { useState, useEffect, useRef, useCallback } from "react";

// ================================================================
// UTILS
// ================================================================
function calcHeight2(dist, topDeg, botDeg, eyeH) {
  return +(dist * (Math.tan(topDeg * Math.PI / 180) - Math.tan(botDeg * Math.PI / 180)) + eyeH).toFixed(1);
}
function calcSpread(dist, leftDeg, rightDeg) {
  return +(dist * (Math.tan(Math.abs(leftDeg) * Math.PI / 180) + Math.tan(Math.abs(rightDeg) * Math.PI / 180))).toFixed(1);
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function today() { const d = new Date(); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`; }
function loadProfile() { try { return JSON.parse(localStorage.getItem("fs_profile") || "{}"); } catch { return {}; } }
function saveProfile(o) { try { localStorage.setItem("fs_profile", JSON.stringify(o)); } catch {} }
function loadTrees() { try { return JSON.parse(localStorage.getItem("fs_trees") || "[]"); } catch { return []; } }
function saveTrees(t) { try { localStorage.setItem("fs_trees", JSON.stringify(t)); } catch {} }

// ================================================================
// STYLES
// ================================================================
const GRN = "#7ecba1", GOLD = "#ffd166", BLUE = "#74b3ce";
const BG = { minHeight: "100vh", background: "linear-gradient(170deg,#0c1820,#1a2e3a 50%,#0a1f14)", fontFamily: "'Georgia','Hiragino Mincho ProN',serif", color: "#e0f0ea" };
const INNER = { maxWidth: 440, margin: "0 auto", padding: "0 16px 48px" };
const CARD = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 14, padding: "16px", marginBottom: 12 };
const INP = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(126,203,161,0.4)", borderRadius: 10, padding: "12px 14px", color: "#e0f0ea", fontSize: 18, outline: "none", fontFamily: "inherit" };
const LBL = { fontSize: 12, color: "#a8d5b5", marginBottom: 5, display: "block" };
const PRI = { width: "100%", padding: "14px", background: "#1a3a2a", border: `1px solid ${GRN}`, borderRadius: 12, color: "#e0f0ea", fontSize: 15, cursor: "pointer", marginBottom: 8, fontFamily: "inherit", letterSpacing: 1 };
const GHO = { width: "100%", padding: "11px", background: "transparent", border: "1px solid #4a7c5a", borderRadius: 12, color: "#a8d5b5", fontSize: 13, cursor: "pointer", marginBottom: 8, fontFamily: "inherit" };
const TAB = (on) => ({ flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer", fontSize: 12, background: on ? "rgba(126,203,161,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? GRN : "rgba(126,203,161,0.2)"}`, color: on ? GRN : "#4a9070", fontFamily: "inherit" });
const SML = (c) => ({ fontSize: 11, color: c, background: "none", border: `1px solid ${c}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", marginTop: 6 });

const TREE_TYPES = ["クスノキ","ケヤキ","イチョウ","サクラ","マツ","スギ","ヒノキ","プラタナス","メタセコイア","ヒマラヤスギ","シラカシ","トウカエデ","その他"];

// ================================================================
// CAMERA HOOK
// ================================================================
function useCameraAndSensor(onOrient) {
  const [sensorOn, setSensorOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  useEffect(() => () => { window.removeEventListener("deviceorientation", onOrient); stopCamera(); }, [onOrient]);
  const startAll = async () => {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        if (await DeviceOrientationEvent.requestPermission() !== "granted") { alert("センサーが許可されませんでした"); return; }
      }
      window.addEventListener("deviceorientation", onOrient);
      setSensorOn(true);
    } catch { alert("センサーを起動できませんでした"); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setCameraOn(true);
    } catch { setCameraOn(false); }
  };
  const stopCamera = () => {
    window.removeEventListener("deviceorientation", onOrient);
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    setCameraOn(false); setSensorOn(false);
  };
  return { sensorOn, cameraOn, videoRef, startAll, stopCamera };
}

// ================================================================
// DIST PANEL
// ================================================================
function DistPanel({ bodyH, setBodyH, eyeH, setEyeH, dist, setDist, distMode, setDistMode, stride, setStride, walkCount, setWalkCount, showEyeH }) {
  const [msg, setMsg] = useState(false);
  const onBodyH = v => { setBodyH(v); setStride(null); const h = parseFloat(v); if (h > 0) saveProfile({ ...loadProfile(), bodyH: v, stride: +(h*0.45/100).toFixed(3) }); };
  const autoFill = () => { const h = parseFloat(bodyH); if (!h) return; const e = +(h*0.93/100).toFixed(2)+""; const s = +(h*0.45/100).toFixed(3); setEyeH(e); setStride(s); saveProfile({ ...loadProfile(), bodyH, eyeH: e, stride: s }); setMsg(true); setTimeout(() => setMsg(false), 2000); };
  const cs = () => { const h = parseFloat(bodyH); if (!h) return; const s = +(h*0.45/100).toFixed(3); setStride(s); if (walkCount) setDist(+(parseFloat(walkCount)*s).toFixed(1)+""); };
  const hw = v => { setWalkCount(v); if (stride && v) setDist(+(parseFloat(v)*stride).toFixed(1)+""); };
  return (
    <>
      <div style={CARD}>
        <p style={{ fontSize: 13, color: GRN, marginBottom: 12 }}>身長{showEyeH ? "・目の高さ" : ""} <span style={{ fontSize: 10, color: "#4a9070" }}>自動保存</span></p>
        <span style={LBL}>身長（cm）：</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <input style={INP} type="number" value={bodyH} onChange={e => onBodyH(e.target.value)} placeholder="例: 170" />
          <span style={{ color: GRN, minWidth: 24 }}>cm</span>
        </div>
        {bodyH && <div style={{ background: "rgba(126,203,161,0.08)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 11, color: GRN }}>
          推定歩幅：{Math.round(parseFloat(bodyH)*0.45)} cm　目の高さ：{(parseFloat(bodyH)*0.93/100).toFixed(2)} m
        </div>}
        {showEyeH && <>
          <span style={LBL}>目の高さ（m）：</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input style={INP} type="number" value={eyeH} onChange={e => { setEyeH(e.target.value); saveProfile({ ...loadProfile(), eyeH: e.target.value }); }} placeholder="1.5" />
            <span style={{ color: GRN, minWidth: 24 }}>m</span>
          </div>
        </>}
        {bodyH && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={autoFill} style={{ fontSize: 11, color: GRN, background: "rgba(126,203,161,0.1)", border: "1px solid rgba(126,203,161,0.3)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>身長から自動入力</button>
          {msg && <span style={{ fontSize: 11, color: GOLD }}>✅ 保存</span>}
        </div>}
      </div>
      <div style={CARD}>
        <p style={{ fontSize: 13, color: GRN, marginBottom: 12 }}>木までの距離</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button style={TAB(distMode===0)} onClick={() => setDistMode(0)}>📏 直接入力（m）</button>
          <button style={TAB(distMode===1)} onClick={() => setDistMode(1)}>👣 歩数で入力</button>
        </div>
        {distMode === 0 && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><input style={INP} type="number" value={dist} onChange={e => setDist(e.target.value)} placeholder="例: 15" /><span style={{ color: GRN, minWidth: 24 }}>m</span></div>}
        {distMode === 1 && <>
          {!stride ? <button style={{ ...PRI, padding: "10px", fontSize: 12 }} onClick={cs} disabled={!bodyH}>👣 身長から歩幅を計算</button>
                   : <div style={{ background: "rgba(126,203,161,0.1)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 12, color: GRN }}>歩幅：{(stride*100).toFixed(0)} cm（保存済み）</div>}
          {!bodyH && <p style={{ fontSize: 11, color: "#4a7c5a" }}>※ 先に身長を入力してください</p>}
          <span style={LBL}>歩数：</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><input style={INP} type="number" value={walkCount} onChange={e => hw(e.target.value)} placeholder="例: 20" /><span style={{ color: GRN, minWidth: 24 }}>歩</span></div>
          {dist && stride && <div style={{ background: "rgba(126,203,161,0.08)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: GRN }}>{walkCount}歩 × {(stride*100).toFixed(0)}cm ＝ 約 <strong>{dist} m</strong></div>}
        </>}
      </div>
    </>
  );
}

// ================================================================
// CAMERA VIEW
// ================================================================
function CameraView({ videoRef, cameraOn, sensorOn, shown, lock1, lock2, label1, label2, color1, color2, isVertical }) {
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 12, background: "#000", aspectRatio: "4/3" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraOn ? "block" : "none" }} />
      {!cameraOn && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1a0a" }}><p style={{ color: "#4a7c5a", fontSize: 13, textAlign: "center" }}>📷<br />カメラ起動後に映像が表示されます</p></div>}
      {sensorOn && <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {isVertical
          ? <div style={{ position: "absolute", top: "50%", left: "8%", right: "8%", height: 1, background: "rgba(126,203,161,0.3)", transform: "translateY(-50%)" }} />
          : <div style={{ position: "absolute", left: "50%", top: "8%", bottom: "8%", width: 1, background: "rgba(126,203,161,0.3)", transform: "translateX(-50%)" }} />
        }
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44 }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: GRN, opacity: 0.85, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: GRN, opacity: 0.85, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", background: GRN }} />
        </div>
        {lock1 != null && (() => { const px = Math.round((shown - lock1)*3); return isVertical
          ? <div style={{ position: "absolute", top: `calc(50% + ${px}px)`, left: 0, right: 0, height: 2, background: color1, opacity: 0.8, transform: "translateY(-50%)" }}><span style={{ position: "absolute", right: 8, top: -20, fontSize: 10, color: color1, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 }}>{label1} {lock1 > 0 ? "+" : ""}{lock1}°</span></div>
          : <div style={{ position: "absolute", left: `calc(50% + ${px}px)`, top: 0, bottom: 0, width: 2, background: color1, opacity: 0.8, transform: "translateX(-50%)" }}><span style={{ position: "absolute", top: 10, left: 6, fontSize: 10, color: color1, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{label1} {lock1}°</span></div>; })()}
        {lock2 != null && (() => { const px = Math.round((shown - lock2)*3); return isVertical
          ? <div style={{ position: "absolute", top: `calc(50% + ${px}px)`, left: 0, right: 0, height: 2, background: color2, opacity: 0.8, transform: "translateY(-50%)" }}><span style={{ position: "absolute", right: 8, top: -20, fontSize: 10, color: color2, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 }}>{label2} +{lock2}°</span></div>
          : <div style={{ position: "absolute", left: `calc(50% + ${px}px)`, top: 0, bottom: 0, width: 2, background: color2, opacity: 0.8, transform: "translateX(-50%)" }}><span style={{ position: "absolute", top: 28, left: 6, fontSize: 10, color: color2, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{label2} {lock2}°</span></div>; })()}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.65)", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
          <p style={{ fontSize: 9, color: GRN, margin: 0 }}>現在の角度</p>
          <p style={{ fontSize: 26, fontWeight: "bold", color: shown >= 0 ? GRN : BLUE, margin: 0, lineHeight: 1 }}>{shown > 0 ? "+" : ""}{shown.toFixed(1)}°</p>
        </div>
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ background: lock1 != null ? `${color1}cc` : "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: lock1 != null ? "#fff" : "#666" }}>{lock1 != null ? `✅ ${label1} ${lock1 > 0 ? "+" : ""}${lock1}°` : `① ${label1}未ロック`}</div>
          <div style={{ background: lock2 != null ? `${color2}cc` : "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: lock2 != null ? (color2 === GOLD ? "#000" : "#fff") : "#666" }}>{lock2 != null ? `✅ ${label2} ${lock2 > 0 ? "+" : ""}${lock2}°` : `② ${label2}未ロック`}</div>
        </div>
      </div>}
    </div>
  );
}

// ================================================================
// LOCK BUTTONS
// ================================================================
function LockButtons({ sensorOn, startAll, lock1, lock2, onLock1, onLock2, onRedo1, onRedo2, label1, label2, color1, color2, hint1, hint2 }) {
  const lockedStyle = (c) => ({ padding: "14px 8px", borderRadius: 12, background: `${c}33`, border: `2px solid ${c}`, textAlign: "center" });
  const unlockedStyle = (c, disabled) => ({ width: "100%", padding: "18px 8px", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "rgba(255,255,255,0.03)" : `${c}1a`, border: `2px solid ${disabled ? "rgba(255,255,255,0.1)" : c+"66"}`, color: disabled ? "#4a7c5a" : c, fontFamily: "inherit", textAlign: "center", opacity: disabled ? 0.5 : 1 });
  return (
    <div style={CARD}>
      {!sensorOn ? <button style={PRI} onClick={startAll}>📱　カメラ＆センサーを起動する</button>
      : <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            {lock1 == null ? <button onClick={onLock1} style={unlockedStyle(color1, false)}><div style={{ fontSize: 24, marginBottom: 4 }}>🔒</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{label1}をロック</div><div style={{ fontSize: 11, marginTop: 2 }}>{hint1}</div></button>
            : <div style={lockedStyle(color1)}><div style={{ fontSize: 20 }}>✅</div><div style={{ fontSize: 13, fontWeight: "bold", color: color1 }}>{label1}済</div><div style={{ fontSize: 12, color: color1 }}>{lock1 > 0 ? "+" : ""}{lock1}°</div><button onClick={onRedo1} style={SML(color1)}>やり直す</button></div>}
          </div>
          <div style={{ flex: 1 }}>
            {lock2 == null ? <button onClick={onLock2} disabled={lock1 == null} style={unlockedStyle(color2, lock1 == null)}><div style={{ fontSize: 24, marginBottom: 4 }}>🔒</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{label2}をロック</div><div style={{ fontSize: 11, marginTop: 2 }}>{lock1 == null ? `${label1}ロック後に` : hint2}</div></button>
            : <div style={lockedStyle(color2)}><div style={{ fontSize: 20 }}>✅</div><div style={{ fontSize: 13, fontWeight: "bold", color: color2 }}>{label2}済</div><div style={{ fontSize: 12, color: color2 }}>{lock2 > 0 ? "+" : ""}{lock2}°</div><button onClick={onRedo2} style={SML(color2)}>やり直す</button></div>}
          </div>
        </div>}
    </div>
  );
}

// ================================================================
// SAVE TO CARTE MODAL
// ================================================================
function SaveModal({ measurement, trees, onSave, onSkip }) {
  const [mode, setMode] = useState("new"); // new | existing
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const doSave = () => {
    if (mode === "new") {
      if (!name.trim()) { alert("木の名前を入力してください"); return; }
      const tree = { id: newId(), name: name.trim(), species, location, note: "", photo: null, measurements: measurement, createdAt: today(), updatedAt: today() };
      onSave(tree, null);
    } else {
      if (!selectedId) { alert("木を選択してください"); return; }
      onSave(null, selectedId);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#1a2e3a", borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", maxHeight: "80vh", overflowY: "auto" }}>
        <p style={{ fontSize: 16, color: GRN, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>💾 カルテに保存する</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button style={TAB(mode==="new")} onClick={() => setMode("new")}>新しく登録</button>
          {trees.length > 0 && <button style={TAB(mode==="existing")} onClick={() => setMode("existing")}>既存の木に追加</button>}
        </div>
        {mode === "new" && <>
          <span style={LBL}>木の名前（必須）：</span>
          <input style={{ ...INP, marginBottom: 10, fontSize: 16 }} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例: 正門のクスノキ" />
          <span style={LBL}>樹種：</span>
          <select value={species} onChange={e => setSpecies(e.target.value)} style={{ ...INP, marginBottom: 10, fontSize: 14, appearance: "none" }}>
            <option value="">選択してください</option>
            {TREE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={LBL}>場所・区画：</span>
          <input style={{ ...INP, marginBottom: 16, fontSize: 16 }} type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="例: A区画・正門横" />
        </>}
        {mode === "existing" && <>
          <span style={LBL}>木を選択：</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {trees.map(t => <button key={t.id} onClick={() => setSelectedId(t.id)} style={{ padding: "12px 14px", borderRadius: 10, background: selectedId===t.id ? "rgba(126,203,161,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedId===t.id ? GRN : "rgba(126,203,161,0.2)"}`, color: "#e0f0ea", fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: "bold" }}>{t.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6aab7e" }}>{t.species} {t.location}</p>
            </button>)}
          </div>
        </>}
        <button style={PRI} onClick={doSave}>💾 保存する</button>
        <button style={GHO} onClick={onSkip}>スキップ（保存しない）</button>
      </div>
    </div>
  );
}

// ================================================================
// HEIGHT APP
// ================================================================
function HeightApp({ prof, trees, onSaveTree, onBack }) {
  const [pg, setPg] = useState(0);
  const [dist, setDist] = useState(""); const [eyeH, setEyeH] = useState(prof.eyeH||"1.5");
  const [bodyH, setBodyH] = useState(prof.bodyH||""); const [walkCount, setWalkCount] = useState("");
  const [stride, setStride] = useState(prof.stride||null); const [distMode, setDistMode] = useState(0);
  const [liveDeg, setLiveDeg] = useState(null); const [bot, setBot] = useState(null); const [top, setTop] = useState(null);
  const [result, setResult] = useState(null); const [showSave, setShowSave] = useState(false);
  const liveRef = useRef(null);
  const onOrient = useCallback(e => { if (e.beta==null) return; let v = +(e.beta-90).toFixed(1); v = Math.max(-89,Math.min(89,v)); liveRef.current=v; setLiveDeg(v); }, []);
  const { sensorOn, cameraOn, videoRef, startAll, stopCamera } = useCameraAndSensor(onOrient);
  const shown = liveDeg??0; const canCalc = bot!==null&&top!==null&&!!dist&&!!eyeH;

  const doCalc = () => { if (!canCalc) return; stopCamera(); const h = calcHeight2(parseFloat(dist),top,bot,parseFloat(eyeH)); setResult({ height: h, d: parseFloat(dist), e: parseFloat(eyeH), topDeg: top, botDeg: bot }); setPg(3); };
  const reset = () => { stopCamera(); setPg(0); setDist(""); setWalkCount(""); setLiveDeg(null); setBot(null); setTop(null); setResult(null); setShowSave(false); };

  return (
    <div>
      {pg>0&&pg<3&&<div style={{ display:"flex", gap:4, margin:"14px 0" }}>{["① 距離入力","② 角度測定","③ 結果"].map((l,i)=><div key={i} style={{ flex:1, textAlign:"center" }}><div style={{ height:3, borderRadius:2, background:i<pg?GRN:"rgba(126,203,161,0.2)", marginBottom:4 }}/><span style={{ fontSize:10, color:i<pg?GRN:"#4a9070" }}>{l}</span></div>)}</div>}

      {pg===0&&<div style={{ marginTop:12 }}>
        <div style={CARD}><p style={{ fontSize:12, color:GRN, textAlign:"center", marginBottom:10 }}>2点ロック方式（上下）</p>
          <svg viewBox="0 0 280 150" style={{ width:"100%", height:"auto", display:"block" }}>
            <line x1="20" y1="125" x2="260" y2="125" stroke="#4a9070" strokeWidth="1.5"/>
            <line x1="220" y1="125" x2="220" y2="18" stroke={GRN} strokeWidth="3"/>
            <ellipse cx="220" cy="18" rx="22" ry="14" fill="#2d6a4f" opacity="0.85"/>
            <circle cx="50" cy="100" r="7" fill={GRN} opacity="0.85"/>
            <line x1="50" y1="107" x2="50" y2="125" stroke={GRN} strokeWidth="2"/>
            <line x1="50" y1="100" x2="220" y2="18" stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,3"/>
            <line x1="50" y1="100" x2="220" y2="120" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5,3"/>
            <text x="72" y="88" fill={GOLD} fontSize="9">上角</text>
            <text x="72" y="115" fill={BLUE} fontSize="9">下角</text>
            <line x1="232" y1="18" x2="232" y2="125" stroke="#a8d5b5" strokeWidth="1" strokeDasharray="3,2"/>
            <text x="246" y="75" fill="#a8d5b5" fontSize="9">樹高</text>
          </svg>
          <p style={{ fontSize:11, color:"#a8d5b5", textAlign:"center", margin:"8px 0 0", lineHeight:1.8 }}>① 根元をロック → ② 梢をロック</p>
        </div>
        <button style={PRI} onClick={() => setPg(1)}>📐　測定を開始する</button>
        <button style={GHO} onClick={onBack}>← メニューに戻る</button>
      </div>}

      {pg===1&&<div>
        <DistPanel bodyH={bodyH} setBodyH={setBodyH} eyeH={eyeH} setEyeH={setEyeH} dist={dist} setDist={setDist} distMode={distMode} setDistMode={setDistMode} stride={stride} setStride={setStride} walkCount={walkCount} setWalkCount={setWalkCount} showEyeH />
        <button style={PRI} onClick={() => setPg(2)}>次へ → 角度を測定する</button>
        <button style={GHO} onClick={() => setPg(0)}>← 戻る</button>
      </div>}

      {pg===2&&<div>
        <CameraView videoRef={videoRef} cameraOn={cameraOn} sensorOn={sensorOn} shown={shown} lock1={bot} lock2={top} label1="根元" label2="梢" color1={BLUE} color2={GOLD} isVertical />
        <LockButtons sensorOn={sensorOn} startAll={startAll} lock1={bot} lock2={top}
          onLock1={() => { if (liveRef.current!=null) setBot(+liveRef.current.toFixed(1)); }}
          onLock2={() => { if (liveRef.current!=null) setTop(+liveRef.current.toFixed(1)); }}
          onRedo1={() => { setBot(null); setTop(null); }} onRedo2={() => setTop(null)}
          label1="根元" label2="梢" color1={BLUE} color2={GOLD} hint1="カメラを根元に向けて" hint2="カメラを梢に向けて" />
        <button onClick={doCalc} style={{ ...PRI, background:canCalc?"#2a4a1a":"#1a2a1a", borderColor:canCalc?GOLD:"#4a7c5a", color:canCalc?GOLD:"#4a7c5a", cursor:canCalc?"pointer":"not-allowed" }}>
          📐　樹高を計算する {!canCalc&&(bot===null?"（根元をロック）":top===null?"（梢をロック）":"（距離を入力）")}
        </button>
        <button style={GHO} onClick={() => { setPg(1); stopCamera(); }}>← 距離の入力に戻る</button>
      </div>}

      {pg===3&&result&&<div style={{ marginTop:8 }}>
        <div style={{ background:"linear-gradient(135deg,#1a3a2a99,#0a2a1a55)", border:"1px solid rgba(126,203,161,0.35)", borderRadius:20, padding:"24px 20px", textAlign:"center", marginBottom:14 }}>
          <div style={{ position:"relative", height:100, width:70, margin:"0 auto 12px" }}>
            <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:10, background:"linear-gradient(#5d4037,#8d6e63)", borderRadius:3, height:Math.min(85,result.height*4) }}/>
            <div style={{ position:"absolute", bottom:Math.max(0,Math.min(85,result.height*4)-6), left:"50%", transform:"translateX(-50%)", width:52, height:52, borderRadius:"50% 50% 40% 40%", background:"radial-gradient(circle at 40% 40%,#52b788,#1b4332)" }}/>
          </div>
          <p style={{ fontSize:11, color:GRN, margin:"0 0 2px", letterSpacing:2 }}>推定樹高</p>
          <p style={{ fontSize:64, fontWeight:"bold", color:"#e0f0ea", margin:0, lineHeight:1, letterSpacing:-3 }}>{result.height}</p>
          <p style={{ fontSize:18, color:GRN, margin:"4px 0 12px" }}>m</p>
          <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
            {[["🏠","1階",3],["🏢","3階",10],["🪝","電柱",12],["🏬","5階",16]].map(([e,l,h])=>(
              <div key={l} style={{ background:result.height>=h?"rgba(126,203,161,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${result.height>=h?"rgba(126,203,161,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"4px 8px", fontSize:11, color:result.height>=h?GRN:"#4a7c5a" }}>{e} {l}より{result.height>=h?"高い":"低い"}</div>
            ))}
          </div>
        </div>
        <div style={{ ...CARD, padding:"14px 16px" }}>
          {[["水平距離",`${result.d} m`],["根元",`${result.botDeg>0?"+":""}${result.botDeg}°`],["梢",`+${result.topDeg}°`],["角度差",`${(result.topDeg-result.botDeg).toFixed(1)}°`],["目の高さ",`${result.e} m`]].map(([l,v],i,a)=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", paddingBottom:i<a.length-1?7:0, marginBottom:i<a.length-1?7:0, borderBottom:i<a.length-1?"1px solid rgba(126,203,161,0.1)":"none" }}>
              <span style={{ fontSize:11, color:"#4a9070" }}>{l}</span><span style={{ fontSize:13, color:"#e0f0ea" }}>{v}</span>
            </div>
          ))}
        </div>
        <button style={{ ...PRI, background:"#2a4a1a", borderColor:GOLD, color:GOLD }} onClick={() => setShowSave(true)}>💾　カルテに保存する</button>
        <button style={PRI} onClick={reset}>📐　もう一度測定する</button>
        <button style={GHO} onClick={onBack}>← メニューに戻る</button>
        {showSave && <SaveModal measurement={{ height: result.height+"" }} trees={trees} onSave={(newTree, existingId) => { onSaveTree(newTree, existingId, { height: result.height+"" }); setShowSave(false); }} onSkip={() => setShowSave(false)} />}
      </div>}
    </div>
  );
}

// ================================================================
// SPREAD APP
// ================================================================
function SpreadApp({ prof, trees, onSaveTree, onBack }) {
  const [pg, setPg] = useState(0);
  const [dist, setDist] = useState(""); const [bodyH, setBodyH] = useState(prof.bodyH||"");
  const [walkCount, setWalkCount] = useState(""); const [stride, setStride] = useState(prof.stride||null);
  const [distMode, setDistMode] = useState(0); const [liveGamma, setLiveGamma] = useState(null);
  const [left, setLeft] = useState(null); const [right, setRight] = useState(null);
  const [result, setResult] = useState(null); const [showSave, setShowSave] = useState(false);
  const gammaRef = useRef(null);
  const onOrient = useCallback(e => { if (e.gamma==null) return; let v = +e.gamma.toFixed(1); v = Math.max(-89,Math.min(89,v)); gammaRef.current=v; setLiveGamma(v); }, []);
  const { sensorOn, cameraOn, videoRef, startAll, stopCamera } = useCameraAndSensor(onOrient);
  const shown = liveGamma??0; const canCalc = left!==null&&right!==null&&!!dist;

  const doCalc = () => { if (!canCalc) return; stopCamera(); const s = calcSpread(parseFloat(dist),left,right); setResult({ spread:s, radius:+(s/2).toFixed(1), area:+(Math.PI*(s/2)*(s/2)).toFixed(1), d:parseFloat(dist), leftDeg:left, rightDeg:right }); setPg(3); };
  const reset = () => { stopCamera(); setPg(0); setDist(""); setWalkCount(""); setLiveGamma(null); setLeft(null); setRight(null); setResult(null); setShowSave(false); };

  return (
    <div>
      {pg>0&&pg<3&&<div style={{ display:"flex", gap:4, margin:"14px 0" }}>{["① 距離入力","② 角度測定","③ 結果"].map((l,i)=><div key={i} style={{ flex:1, textAlign:"center" }}><div style={{ height:3, borderRadius:2, background:i<pg?GRN:"rgba(126,203,161,0.2)", marginBottom:4 }}/><span style={{ fontSize:10, color:i<pg?GRN:"#4a9070" }}>{l}</span></div>)}</div>}

      {pg===0&&<div style={{ marginTop:12 }}>
        <div style={CARD}><p style={{ fontSize:12, color:GRN, textAlign:"center", marginBottom:10 }}>2点ロック方式（左右）</p>
          <svg viewBox="0 0 280 150" style={{ width:"100%", height:"auto", display:"block" }}>
            <line x1="20" y1="125" x2="260" y2="125" stroke="#4a9070" strokeWidth="1.5"/>
            <line x1="140" y1="125" x2="140" y2="62" stroke={GRN} strokeWidth="3"/>
            <ellipse cx="140" cy="52" rx="58" ry="26" fill="#2d6a4f" opacity="0.5" stroke={GRN} strokeWidth="1"/>
            <circle cx="82" cy="52" r="5" fill={BLUE}/>
            <circle cx="198" cy="52" r="5" fill={GOLD}/>
            <circle cx="140" cy="96" r="7" fill={GRN} opacity="0.85"/>
            <line x1="140" y1="103" x2="140" y2="125" stroke={GRN} strokeWidth="2"/>
            <line x1="140" y1="96" x2="82" y2="52" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5,3"/>
            <line x1="140" y1="96" x2="198" y2="52" stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,3"/>
            <text x="96" y="92" fill={BLUE} fontSize="9">左角</text>
            <text x="160" y="92" fill={GOLD} fontSize="9">右角</text>
            <line x1="82" y1="137" x2="198" y2="137" stroke="#a8d5b5" strokeWidth="1" strokeDasharray="3,2"/>
            <text x="140" y="148" fill="#a8d5b5" fontSize="9" textAnchor="middle">枝張り</text>
          </svg>
          <p style={{ fontSize:11, color:"#a8d5b5", textAlign:"center", margin:"8px 0 0", lineHeight:1.8 }}>① 左端をロック → ② 右端をロック</p>
        </div>
        <button style={PRI} onClick={() => setPg(1)}>🌿　測定を開始する</button>
        <button style={GHO} onClick={onBack}>← メニューに戻る</button>
      </div>}

      {pg===1&&<div>
        <DistPanel bodyH={bodyH} setBodyH={setBodyH} eyeH="" setEyeH={() => {}} dist={dist} setDist={setDist} distMode={distMode} setDistMode={setDistMode} stride={stride} setStride={setStride} walkCount={walkCount} setWalkCount={setWalkCount} showEyeH={false} />
        <button style={PRI} onClick={() => setPg(2)}>次へ → 角度を測定する</button>
        <button style={GHO} onClick={() => setPg(0)}>← 戻る</button>
      </div>}

      {pg===2&&<div>
        <CameraView videoRef={videoRef} cameraOn={cameraOn} sensorOn={sensorOn} shown={shown} lock1={left} lock2={right} label1="左端" label2="右端" color1={BLUE} color2={GOLD} isVertical={false} />
        <LockButtons sensorOn={sensorOn} startAll={startAll} lock1={left} lock2={right}
          onLock1={() => { if (gammaRef.current!=null) setLeft(+gammaRef.current.toFixed(1)); }}
          onLock2={() => { if (gammaRef.current!=null) setRight(+gammaRef.current.toFixed(1)); }}
          onRedo1={() => { setLeft(null); setRight(null); }} onRedo2={() => setRight(null)}
          label1="左端" label2="右端" color1={BLUE} color2={GOLD} hint1="←スマホを左に傾けて" hint2="→スマホを右に傾けて" />
        <button onClick={doCalc} style={{ ...PRI, background:canCalc?"#2a4a1a":"#1a2a1a", borderColor:canCalc?GOLD:"#4a7c5a", color:canCalc?GOLD:"#4a7c5a", cursor:canCalc?"pointer":"not-allowed" }}>
          🌿　枝張りを計算する {!canCalc&&(left===null?"（左端をロック）":right===null?"（右端をロック）":"（距離を入力）")}
        </button>
        <button style={GHO} onClick={() => { setPg(1); stopCamera(); }}>← 距離の入力に戻る</button>
      </div>}

      {pg===3&&result&&<div style={{ marginTop:8 }}>
        <div style={{ background:"linear-gradient(135deg,#1a3a2a99,#0a2a1a55)", border:"1px solid rgba(126,203,161,0.35)", borderRadius:20, padding:"24px 20px", textAlign:"center", marginBottom:14 }}>
          <p style={{ fontSize:11, color:GRN, margin:"0 0 2px", letterSpacing:2 }}>枝張り（直径）</p>
          <p style={{ fontSize:64, fontWeight:"bold", color:"#e0f0ea", margin:0, lineHeight:1, letterSpacing:-3 }}>{result.spread}</p>
          <p style={{ fontSize:18, color:GRN, margin:"4px 0 14px" }}>m</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <div style={{ background:"rgba(126,203,161,0.12)", border:"1px solid rgba(126,203,161,0.3)", borderRadius:12, padding:"10px 16px" }}>
              <p style={{ fontSize:11, color:"#a8d5b5", margin:"0 0 2px" }}>片側半径</p>
              <p style={{ fontSize:24, fontWeight:"bold", color:GRN, margin:0 }}>{result.radius} m</p>
            </div>
            <div style={{ background:"rgba(126,203,161,0.12)", border:"1px solid rgba(126,203,161,0.3)", borderRadius:12, padding:"10px 16px" }}>
              <p style={{ fontSize:11, color:"#a8d5b5", margin:"0 0 2px" }}>樹冠面積</p>
              <p style={{ fontSize:24, fontWeight:"bold", color:GRN, margin:0 }}>{result.area} m²</p>
            </div>
          </div>
        </div>
        <div style={{ ...CARD, padding:"14px 16px" }}>
          {[["水平距離",`${result.d} m`],["左端",`${result.leftDeg}°`],["右端",`${result.rightDeg}°`],["角度合計",`${(Math.abs(result.leftDeg)+Math.abs(result.rightDeg)).toFixed(1)}°`]].map(([l,v],i,a)=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", paddingBottom:i<a.length-1?7:0, marginBottom:i<a.length-1?7:0, borderBottom:i<a.length-1?"1px solid rgba(126,203,161,0.1)":"none" }}>
              <span style={{ fontSize:11, color:"#4a9070" }}>{l}</span><span style={{ fontSize:13, color:"#e0f0ea" }}>{v}</span>
            </div>
          ))}
        </div>
        <button style={{ ...PRI, background:"#2a4a1a", borderColor:GOLD, color:GOLD }} onClick={() => setShowSave(true)}>💾　カルテに保存する</button>
        <button style={PRI} onClick={reset}>🌿　もう一度測定する</button>
        <button style={GHO} onClick={onBack}>← メニューに戻る</button>
        {showSave && <SaveModal measurement={{ spread: result.spread+"" }} trees={trees} onSave={(newTree, existingId) => { onSaveTree(newTree, existingId, { spread: result.spread+"" }); setShowSave(false); }} onSkip={() => setShowSave(false)} />}
      </div>}
    </div>
  );
}

// ================================================================
// CARTE APP
// ================================================================
function CarteApp({ trees, onUpdate, onBack }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef();
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(""); const [species, setSpecies] = useState("");
  const [location, setLocation] = useState(""); const [note, setNote] = useState("");
  const [height, setHeight] = useState(""); const [spread, setSpread] = useState("");
  const [trunk, setTrunk] = useState(""); const [age, setAge] = useState("");

  const openNew = () => { setEditing(null); setPhoto(null); setName(""); setSpecies(""); setLocation(""); setNote(""); setHeight(""); setSpread(""); setTrunk(""); setAge(""); setView("form"); };
  const openEdit = (t) => { setEditing(t); setPhoto(t.photo); setName(t.name); setSpecies(t.species||""); setLocation(t.location||""); setNote(t.note||""); setHeight(t.measurements?.height||""); setSpread(t.measurements?.spread||""); setTrunk(t.measurements?.trunk||""); setAge(t.measurements?.age||""); setView("form"); };

  const doSave = () => {
    if (!name.trim()) { alert("木の名前を入力してください"); return; }
    const t = { id: editing?.id||newId(), name:name.trim(), species, location, note, photo, measurements:{height,spread,trunk,age}, createdAt:editing?.createdAt||today(), updatedAt:today() };
    const next = editing ? trees.map(x => x.id===t.id?t:x) : [t,...trees];
    onUpdate(next); setSelected(t); setView("detail");
  };
  const doDelete = (id) => { if (!window.confirm("削除しますか？")) return; onUpdate(trees.filter(t=>t.id!==id)); setSelected(null); setView("list"); };
  const onPhoto = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setPhoto(ev.target.result); r.readAsDataURL(f); };

  const filtered = trees.filter(t => !search||t.name.includes(search)||t.species?.includes(search)||t.location?.includes(search));
  const cur = selected && trees.find(t=>t.id===selected.id);

  return (
    <div>
      {/* LIST */}
      {view==="list"&&<>
        <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:8, marginBottom:14 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:GRN, fontSize:22, cursor:"pointer", padding:0 }}>‹</button>
          <h2 style={{ fontSize:17, color:GRN, margin:0 }}>樹木カルテ一覧</h2>
        </div>
        {trees.length>0&&<div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {[["登録",`${trees.length}本`,GRN],["測定済",`${trees.filter(t=>t.measurements?.height).length}本`,GOLD],["写真",`${trees.filter(t=>t.photo).length}本`,BLUE]].map(([l,v,c])=>(
            <div key={l} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(126,203,161,0.2)", borderRadius:10, padding:"8px", textAlign:"center" }}>
              <p style={{ fontSize:10, color:"#a8d5b5", margin:"0 0 2px" }}>{l}</p>
              <p style={{ fontSize:18, fontWeight:"bold", color:c, margin:0 }}>{v}</p>
            </div>
          ))}
        </div>}
        {trees.length>0&&<div style={{ position:"relative", marginBottom:12 }}>
          <input style={{ ...INP, paddingLeft:36, fontSize:14 }} type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="名前・樹種・場所で検索..." />
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#4a7c5a" }}>🔍</span>
        </div>}
        {filtered.length>0 ? filtered.map(t=>(
          <button key={t.id} onClick={()=>{setSelected(t);setView("detail");}} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(126,203,161,0.2)", borderRadius:14, padding:0, cursor:"pointer", marginBottom:10, textAlign:"left", overflow:"hidden", fontFamily:"inherit" }}>
            <div style={{ display:"flex" }}>
              <div style={{ width:88, minHeight:88, background:"#0a1a0a", flexShrink:0 }}>
                {t.photo?<img src={t.photo} alt={t.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>🌳</div>}
              </div>
              <div style={{ flex:1, padding:"10px 12px" }}>
                <p style={{ fontSize:14, fontWeight:"bold", color:"#e0f0ea", margin:"0 0 4px" }}>{t.name}</p>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:5 }}>
                  {t.species&&<span style={{ fontSize:11, color:GRN, background:"rgba(126,203,161,0.12)", borderRadius:10, padding:"1px 8px" }}>{t.species}</span>}
                  {t.location&&<span style={{ fontSize:11, color:BLUE, background:"rgba(116,179,206,0.12)", borderRadius:10, padding:"1px 8px" }}>{t.location}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {t.measurements?.height&&<span style={{ fontSize:11, color:"#a8d5b5" }}>樹高 <strong style={{ color:GRN }}>{t.measurements.height}m</strong></span>}
                  {t.measurements?.trunk&&<span style={{ fontSize:11, color:"#a8d5b5" }}>幹周 <strong style={{ color:BLUE }}>{t.measurements.trunk}cm</strong></span>}
                  {t.measurements?.age&&<span style={{ fontSize:11, color:"#a8d5b5" }}>樹齢 <strong style={{ color:GOLD }}>{t.measurements.age}年</strong></span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", paddingRight:10, color:"#4a7c5a", fontSize:18 }}>›</div>
            </div>
          </button>
        )) : <div style={{ textAlign:"center", padding:"40px 20px" }}><p style={{ fontSize:36, marginBottom:12 }}>🌱</p><p style={{ fontSize:13, color:"#4a7c5a" }}>{search?"該当なし":"まだ登録されていません"}</p></div>}
        <button style={{ ...PRI, marginTop:8 }} onClick={openNew}>＋　新しい木を登録する</button>
      </>}

      {/* FORM */}
      {view==="form"&&<>
        <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:8, marginBottom:14 }}>
          <button onClick={()=>setView(editing?"detail":"list")} style={{ background:"none", border:"none", color:GRN, fontSize:22, cursor:"pointer", padding:0 }}>‹</button>
          <h2 style={{ fontSize:17, color:GRN, margin:0 }}>{editing?"カルテを編集":"新しい木を登録"}</h2>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={onPhoto} />
        <div style={{ ...CARD, padding:"12px" }}>
          {photo ? <div style={{ position:"relative" }}><img src={photo} alt="" style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:10, display:"block" }}/><button onClick={()=>fileRef.current.click()} style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.6)", border:`1px solid ${GRN}`, borderRadius:8, color:GRN, fontSize:12, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit" }}>📷 撮り直す</button></div>
          : <button onClick={()=>fileRef.current.click()} style={{ width:"100%", padding:"24px", background:"rgba(126,203,161,0.06)", border:`2px dashed rgba(126,203,161,0.3)`, borderRadius:10, color:"#6aab7e", fontSize:14, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>📷　写真を撮影 / 選択</button>}
        </div>
        <div style={CARD}>
          <p style={{ fontSize:13, color:GRN, marginBottom:12 }}>基本情報</p>
          <span style={LBL}>木の名前（必須）：</span><input style={{ ...INP, marginBottom:10, fontSize:16 }} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="例: 正門のクスノキ" />
          <span style={LBL}>樹種：</span>
          <select value={species} onChange={e=>setSpecies(e.target.value)} style={{ ...INP, marginBottom:10, fontSize:14, appearance:"none" }}>
            <option value="">選択してください</option>
            {TREE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <span style={LBL}>場所・区画：</span><input style={{ ...INP, marginBottom:10, fontSize:16 }} type="text" value={location} onChange={e=>setLocation(e.target.value)} placeholder="例: A区画・正門横" />
          <span style={LBL}>メモ：</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="樹形の特徴、管理状況など..." style={{ ...INP, resize:"vertical", minHeight:64, fontSize:14 }} />
        </div>
        <div style={CARD}>
          <p style={{ fontSize:13, color:GRN, marginBottom:12 }}>測定値 <span style={{ fontSize:10, color:"#4a9070" }}>（空欄でも可）</span></p>
          {[["樹高",height,setHeight,"m"],["枝張り（直径）",spread,setSpread,"m"],["幹周り",trunk,setTrunk,"cm"],["推定樹齢",age,setAge,"年"]].map(([l,v,fn,u])=>(
            <div key={l} style={{ marginBottom:12 }}>
              <span style={LBL}>{l}：</span>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}><input style={{ ...INP, fontSize:22 }} type="number" value={v} onChange={e=>fn(e.target.value)} placeholder="未測定" /><span style={{ color:GRN, minWidth:28, fontSize:13 }}>{u}</span></div>
            </div>
          ))}
        </div>
        <button style={PRI} onClick={doSave}>💾　{editing?"保存する":"登録する"}</button>
        <button style={GHO} onClick={()=>setView(editing?"detail":"list")}>キャンセル</button>
      </>}

      {/* DETAIL */}
      {view==="detail"&&cur&&<>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={()=>setView("list")} style={{ background:"none", border:"none", color:GRN, fontSize:22, cursor:"pointer", padding:0 }}>‹</button>
            <h2 style={{ fontSize:17, color:GRN, margin:0 }}>{cur.name}</h2>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>openEdit(cur)} style={{ fontSize:12, color:GRN, background:"rgba(126,203,161,0.1)", border:"1px solid rgba(126,203,161,0.3)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"inherit" }}>✏️ 編集</button>
            <button onClick={()=>doDelete(cur.id)} style={{ fontSize:12, color:"#ff8080", background:"rgba(220,50,50,0.1)", border:"1px solid rgba(220,50,50,0.4)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"inherit" }}>🗑️</button>
          </div>
        </div>
        {cur.photo&&<div style={{ borderRadius:14, overflow:"hidden", marginBottom:12 }}><img src={cur.photo} alt={cur.name} style={{ width:"100%", maxHeight:240, objectFit:"cover", display:"block" }}/></div>}
        <div style={CARD}>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
            {cur.species&&<span style={{ fontSize:12, background:"rgba(126,203,161,0.15)", border:"1px solid rgba(126,203,161,0.3)", borderRadius:20, padding:"3px 12px", color:GRN }}>{cur.species}</span>}
            {cur.location&&<span style={{ fontSize:12, background:"rgba(116,179,206,0.15)", border:"1px solid rgba(116,179,206,0.3)", borderRadius:20, padding:"3px 12px", color:BLUE }}>{cur.location}</span>}
          </div>
          {cur.note&&<p style={{ fontSize:13, color:"#a8d5b5", lineHeight:1.7, margin:"0 0 8px" }}>{cur.note}</p>}
          <p style={{ fontSize:11, color:"#4a7c5a", margin:0 }}>登録：{cur.createdAt}　更新：{cur.updatedAt}</p>
        </div>
        {(cur.measurements?.height||cur.measurements?.spread||cur.measurements?.trunk||cur.measurements?.age)&&<div style={CARD}>
          <p style={{ fontSize:13, color:GRN, marginBottom:12 }}>測定値</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["樹高",cur.measurements?.height,"m",GRN],["枝張り",cur.measurements?.spread,"m",GOLD],["幹周り",cur.measurements?.trunk,"cm",BLUE],["樹齢",cur.measurements?.age,"年","#a8d5b5"]].map(([l,v,u,c])=>v&&(
              <div key={l} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px", textAlign:"center", minWidth:68 }}>
                <p style={{ fontSize:10, color:"#a8d5b5", margin:"0 0 2px" }}>{l}</p>
                <p style={{ fontSize:22, fontWeight:"bold", color:c, margin:0, lineHeight:1 }}>{v}</p>
                <p style={{ fontSize:11, color:"#4a7c5a", margin:0 }}>{u}</p>
              </div>
            ))}
          </div>
        </div>}
      </>}
    </div>
  );
}

// ================================================================
// MAIN APP
// ================================================================
export default function App() {
  const [mode, setMode] = useState(null);
  const [trees, setTrees] = useState(loadTrees);
  const prof = loadProfile();

  const updateTrees = (next) => { setTrees(next); saveTrees(next); };

  const onSaveTree = (newTree, existingId, measurement) => {
    if (newTree) {
      updateTrees([newTree, ...trees]);
    } else {
      updateTrees(trees.map(t => t.id === existingId ? { ...t, measurements: { ...t.measurements, ...measurement }, updatedAt: today() } : t));
    }
    setMode("carte");
  };

  const menuBtn = (emoji, title, sub, badge, onClick) => (
    <button onClick={onClick} style={{ width:"100%", padding:"18px 16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(126,203,161,0.22)", borderRadius:14, cursor:"pointer", marginBottom:10, display:"flex", alignItems:"center", gap:14, fontFamily:"inherit", textAlign:"left" }}>
      <span style={{ fontSize:34 }}>{emoji}</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:15, fontWeight:"bold", color:GRN, margin:0 }}>{title}</p>
        <p style={{ fontSize:12, color:"#6aab7e", margin:"3px 0 0" }}>{sub}</p>
      </div>
      {badge&&<span style={{ fontSize:12, background:"rgba(126,203,161,0.15)", color:GRN, borderRadius:20, padding:"3px 10px" }}>{badge}</span>}
      <span style={{ color:"#4a7c5a", fontSize:18 }}>›</span>
    </button>
  );

  return (
    <div style={BG}>
      <div style={INNER}>
        <div style={{ textAlign:"center", paddingTop:32, paddingBottom:8 }}>
          <div style={{ fontSize:42 }}>🌳</div>
          <h1 style={{ fontSize:21, fontWeight:"bold", letterSpacing:3, color:GRN, margin:"4px 0 0" }}>森林測定システム</h1>
          <p style={{ fontSize:11, color:"#4a9070", letterSpacing:2, margin:"4px 0 0" }}>FOREST SCANNER</p>
        </div>

        {mode===null&&<div style={{ marginTop:20 }}>
          {trees.length>0&&<div style={{ background:"rgba(126,203,161,0.08)", border:"1px solid rgba(126,203,161,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
            <p style={{ fontSize:12, color:GRN, margin:0 }}>📋 カルテ登録：{trees.length}本　測定済み：{trees.filter(t=>t.measurements?.height).length}本</p>
          </div>}
          {menuBtn("📐","樹高を測定する","カメラで根元・梢を2点ロック",null,()=>setMode("height"))}
          {menuBtn("🌿","枝張りを測定する","カメラで左端・右端を2点ロック",null,()=>setMode("spread"))}
          {menuBtn("📋","樹木カルテ","写真・測定値を記録・管理",trees.length>0?`${trees.length}本`:null,()=>setMode("carte"))}
        </div>}

        {mode==="height"&&<HeightApp prof={prof} trees={trees} onSaveTree={onSaveTree} onBack={()=>setMode(null)}/>}
        {mode==="spread"&&<SpreadApp prof={prof} trees={trees} onSaveTree={onSaveTree} onBack={()=>setMode(null)}/>}
        {mode==="carte"&&<CarteApp trees={trees} onUpdate={updateTrees} onBack={()=>setMode(null)}/>}
      </div>
    </div>
  );
}
