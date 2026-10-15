/* AI Sport Coach — application logic
   MediaPipe pose detection, exercise logic, timers and workout history.
   Styling belongs in styles.css. */
import {
  PoseLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const $ = (id) => document.getElementById(id);
const EXERCISES = {
  squat: {
    name: "Squat",
    th: "สควอต",
    icon: "↕",
    desc: "ย่อตัวแล้วกลับมายืนเพื่อฝึกขาและสะโพก",
    camera: "หันด้านข้างให้กล้อง เห็นไหล่ สะโพก เข่า และข้อเท้า",
    equipment: "ไม่ต้องใช้อุปกรณ์",
    needed: [11, 23, 25, 27],
    good: "ย่อตัวเท่าที่ควบคุมได้ รักษาแนวเข่าให้สัมพันธ์กับปลายเท้าและลำตัวให้มั่นคง",
    bad: "เข่าล้มเข้าด้านใน เสียการทรงตัว หรือทิ้งตัวลงเร็ว",
    eval: "มุมเข่า ช่วงการย่อตัว และการกลับสู่ท่ายืน",
  },
  pushup: {
    name: "Push-up",
    th: "วิดพื้น",
    icon: "⇅",
    desc: "ลดและดันลำตัวกลับโดยรักษาแนวลำตัว",
    camera: "วางกล้องด้านข้าง ให้เห็นไหล่ สะโพก และข้อเท้า",
    equipment: "พื้นเรียบ ไม่จำเป็นต้องใช้อุปกรณ์",
    needed: [11, 13, 15, 23, 25, 27],
    good: "รักษาลำตัวให้เป็นแนวเดียว ลดตัวและดันกลับอย่างควบคุม",
    bad: "สะโพกตก แอ่นหลัง หรือทำช่วงการเคลื่อนไหวสั้นเกินไป",
    eval: "มุมข้อศอกและแนวไหล่-สะโพก-เข่า",
  },
  curl: {
    name: "Biceps Curl",
    th: "งอแขน",
    icon: "↶",
    desc: "งอและเหยียดข้อศอกโดยไม่เหวี่ยงตัว",
    camera: "หันด้านข้างหรือเฉียงด้านหน้า ให้เห็นไหล่ ข้อศอก และข้อมือ",
    equipment: "ท่าพื้นฐานทำมือเปล่าได้ หากใช้ดัมเบลต้องเตรียมเอง",
    needed: [11, 13, 15],
    good: "ให้ข้อศอกอยู่ใกล้ลำตัวและเคลื่อนไหวอย่างควบคุม",
    bad: "เหวี่ยงลำตัวหรือยกไหล่ช่วย",
    eval: "มุมข้อศอกและการควบคุมต้นแขน",
  },
  jumping: {
    name: "Jumping Jacks",
    th: "กระโดดตบ",
    icon: "✣",
    desc: "กางแขนและขาออกพร้อมกันแล้วกลับสู่ท่าเริ่มต้น",
    camera: "หันเฉียงด้านหน้า ให้เห็นมือและเท้าทั้งสองข้าง",
    equipment: "ไม่ต้องใช้อุปกรณ์ แต่ต้องมีพื้นที่ว่างและพื้นไม่ลื่น",
    needed: [11, 12, 15, 16, 23, 24, 27, 28],
    good: "ลงเท้าอย่างนุ่มนวลและเคลื่อนไหวแขนขาประสานกัน",
    bad: "ลงเท้าแข็ง กระโดดในพื้นที่แคบ หรือเสียสมดุล",
    eval: "ตำแหน่งแขนเหนือศีรษะและระยะห่างของเท้า",
  },
  jumpsquat: {
    name: "Jump Squat",
    th: "สควอตกระโดด",
    icon: "↟",
    desc: "ย่อตัวแล้วกระโดดขึ้นเบา ๆ ก่อนลงอย่างนุ่มนวล",
    camera: "มุมด้านข้าง ให้เห็นทั้งตัวและพื้นที่เหนือศีรษะ",
    equipment: "ไม่ต้องใช้อุปกรณ์ ต้องมีพื้นที่ว่างและพื้นไม่ลื่น",
    needed: [11, 23, 25, 27],
    good: "เริ่มจากย่อตัวในระดับที่ควบคุมได้และลงพื้นอย่างนุ่มนวล",
    bad: "ลงพื้นเสียงดัง เข่าหุบ หรือเสียสมดุล",
    eval: "มุมเข่าและการเปลี่ยนจากย่อตัวกลับขึ้น",
  },
  sidecrunch: {
    name: "Standing Side Crunch",
    th: "ครันช์ด้านข้างท่ายืน",
    icon: "↔",
    desc: "เอียงลำตัวด้านข้างอย่างควบคุมโดยไม่บิดตัวมาก",
    camera: "หันด้านหน้าหรือเฉียงหน้า ให้เห็นไหล่ สะโพก และเข่า",
    equipment: "ไม่ต้องใช้อุปกรณ์",
    needed: [11, 12, 23, 24],
    good: "เอียงด้านข้างจากลำตัวอย่างนุ่มนวล รักษาสะโพกให้มั่นคง",
    bad: "บิดตัวหรือโยกสะโพกเพื่อเร่งจำนวนครั้ง",
    eval: "การเอียงลำตัวและการกลับสู่ท่ากลาง",
  },
  elbowknee: {
    name: "Standing Elbow to Knee",
    th: "ศอกแตะเข่าท่ายืน",
    icon: "⌁",
    desc: "ยกเข่าเข้าหาศอกฝั่งตรงข้ามโดยควบคุมการทรงตัว",
    camera: "มุมเฉียงด้านหน้า ให้เห็นแขนและเข่าทั้งสองข้าง",
    equipment: "ไม่ต้องใช้อุปกรณ์",
    needed: [11, 12, 13, 14, 23, 24, 25, 26],
    good: "ยกเข่าและหมุนลำตัวอย่างพอดี สลับข้างและรักษาสมดุล",
    bad: "เหวี่ยงตัวหรือยกเข่าด้วยแรงกระชาก",
    eval: "ระยะระหว่างศอกกับเข่าและการสลับข้าง",
  },
  lunge: {
    name: "Lunge",
    th: "ลันจ์",
    icon: "⇵",
    desc: "ก้าวขาและย่อตัวโดยรักษาสมดุล ก่อนกลับมายืน",
    camera: "มุมด้านข้างหรือเฉียงหน้า ให้เห็นสะโพก เข่า และเท้า",
    equipment: "ไม่ต้องใช้อุปกรณ์ ต้องมีพื้นที่ก้าวเท้า",
    needed: [11, 23, 25, 27, 24, 26, 28],
    good: "ก้าวให้มั่นคง ย่อตัวเท่าที่ควบคุมได้ และให้เข่าตามแนวเท้า",
    bad: "ก้าวแคบเกินไป เสียสมดุล หรือเข่าบิดเข้าด้านใน",
    eval: "มุมเข่าขณะย่อตัวและการกลับมายืน",
  },
  stepups: {
    name: "Step-ups",
    th: "ก้าวขึ้นลงแท่น",
    icon: "▱",
    desc: "ก้าวขึ้นแท่นเตี้ยที่มั่นคงทีละข้าง แล้วลงอย่างควบคุม",
    camera: "มุมเฉียงด้านหน้า ให้เห็นเท้า แท่น และขาทั้งสองข้าง",
    equipment:
      "ใช้ขั้นหรือแท่นเตี้ยที่แข็งแรง ไม่ลื่น และไม่โยก ไม่แนะนำเก้าอี้ทั่วไป",
    needed: [11, 23, 25, 27, 24, 26, 28],
    good: "วางเท้าบนแท่นเต็มเท่าที่ทำได้ ก้าวขึ้นลงอย่างควบคุม",
    bad: "ใช้แท่นโยกเยก ก้าวเร็ว หรือปล่อยให้เท้าพลาดขอบ",
    eval: "การยกเข่าและการเปลี่ยนระดับขา (เป็นการประเมินคร่าว ๆ)",
  },
  glute: {
    name: "Glute Bridge",
    th: "ยกสะโพก",
    icon: "⌒",
    desc: "นอนหงายชันเข่า แล้วยกสะโพกโดยใช้กล้ามเนื้อก้น",
    camera: "วางกล้องด้านข้าง ให้เห็นไหล่ สะโพก และเข่า",
    equipment: "พื้นราบที่ไม่ลื่นก็ใช้ได้ เสื่อเป็นทางเลือกเพื่อความสบาย",
    needed: [11, 23, 25],
    good: "ยกสะโพกโดยเกร็งก้นและไม่แอ่นหลังเกินไป",
    bad: "ดันด้วยหลังส่วนล่างหรือฝืนยกสูงจนไม่สบาย",
    eval: "มุมไหล่-สะโพก-เข่าและการยกสะโพก",
  },
  march: {
    name: "March in Place",
    th: "เดินยกเข่าอยู่กับที่",
    icon: "⇅",
    desc: "ยกเข่าสลับซ้ายขวาเหมือนเดินโดยไม่เคลื่อนที่",
    camera: "มุมด้านหน้าหรือเฉียงหน้า ให้เห็นสะโพกและเท้า",
    equipment: "ไม่ต้องใช้อุปกรณ์",
    needed: [11, 12, 23, 24, 25, 26, 27, 28],
    good: "ยกเข่าตามระดับที่สบายและสลับข้างอย่างต่อเนื่อง",
    bad: "เอนตัวมากหรือยกเข่าด้วยการกระชาก",
    eval: "การยกเข่าสลับข้างและการทรงตัว",
  },
  sideleg: {
    name: "Standing Side Leg Raise",
    th: "ยกขาออกด้านข้าง",
    icon: "↗",
    desc: "ยกขาออกด้านข้างทีละข้างและลดลงอย่างควบคุม",
    camera: "มุมด้านหน้าหรือเฉียงหน้า ให้เห็นสะโพกและข้อเท้า",
    equipment: "ไม่ต้องใช้อุปกรณ์ ควรมีพื้นที่ยืนมั่นคง",
    needed: [11, 12, 23, 24, 25, 26, 27, 28],
    good: "ยกขาออกด้านข้างโดยไม่โยกลำตัว และลดขาลงช้า ๆ",
    bad: "เอนตัวมากหรือเหวี่ยงขาเพื่อเพิ่มความสูง",
    eval: "การขยับข้อเท้าออกด้านข้างและการกลับสู่ท่าเริ่มต้น",
  },
};
const PRESETS = {
  beginner: ["squat", "march", "sideleg", "elbowknee", "sidecrunch"],
  lowimpact: ["march", "sideleg", "squat", "sidecrunch", "glute"],
  fullbody: ["squat", "pushup", "lunge", "jumping", "glute"],
};
let stream = null,
  landmarker = null,
  running = false,
  training = false,
  paused = false,
  mode = "single",
  timerId = null,
  frameId = null,
  lastVideoTime = -1,
  lastLandmarks = null,
  repCount = 0,
  phase = "start",
  lastRepAt = 0,
  sessionStart = 0,
  elapsedBeforePause = 0,
  sessionElapsed = 0,
  currentExercise = "squat",
  activePlan = [],
  planIndex = 0,
  roundNow = 1,
  roundsTotal = 2,
  phaseType = "idle",
  phaseEnd = 0,
  phaseRemaining = 0,
  scoreSum = 0,
  scoreFrames = 0,
  validFrames = 0,
  repByExercise = {},
  scoreByExercise = {},
  exerciseScores = {},
  sessionId = 0,
  historySaved = false,
  preparing = false,
  summaryData = null,
  currentRecorded = false,
  sessionAccumulatedMs = 0,
  pausedAt = 0,
  countdownToken = 0,
  loopActive = false;
const video = $("video"),
  canvas = $("canvas"),
  ctx = canvas.getContext("2d");
function toast(s) {
  $("toast").textContent = s;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 3800);
}
function angle(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y },
    v2 = { x: c.x - b.x, y: c.y - b.y },
    den = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  return den
    ? (Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / den))) *
        180) /
        Math.PI
    : 0;
}
function visible(lm, ids, threshold = 0.5) {
  return ids.every((i) => lm[i] && (lm[i].visibility ?? 1) > threshold);
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function setSignal(state, text) {
  const el = $("cameraSignal");
  el.className = "camera-status " + state;
  const icon = state === "ready" ? "✓" : state === "problem" ? "!" : "…";
  el.querySelector(".status-icon").textContent = icon;
  $("cameraSignalText").textContent = text;
}
function setFeedback(title, text, good = false) {
  $("feedbackTitle").textContent = title;
  $("feedbackText").textContent = text;
  $("feedbackDot").style.background = good ? "var(--green)" : "var(--amber)";
}
function scoreUpdate(score) {
  if (!Number.isFinite(score)) {
    $("score").innerHTML = '--<small style="font-size:14px">%</small>';
    $("scoreBar").style.width = "0%";
    $("scoreLabel").textContent = "ประเมินไม่ได้ชัดเจน";
    return;
  }
  score = Math.round(Math.max(0, Math.min(100, score)));
  $("score").innerHTML = score + '<small style="font-size:14px">%</small>';
  $("scoreBar").style.width = score + "%";
  $("scoreLabel").textContent =
    score >= 85 ? "ควบคุมได้ดี" : score >= 65 ? "ยังปรับได้" : "ควรปรับท่า";
}
function updateExercise() {
  currentExercise = $("exercise").value;
  const d = EXERCISES[currentExercise];
  $("exerciseName").textContent = d.name + " / " + d.th;
  $("exerciseIcon").textContent = d.icon;
  $("exerciseDesc").textContent = d.desc;
  repCount = 0;
  phase = "start";
  $("reps").textContent = "0";
  scoreUpdate(NaN);
  $("confidence").innerHTML = '--<small style="font-size:14px">%</small>';
  setFeedback(
    "พร้อมเตรียมตัว",
    "อ่านคำแนะนำก่อนเริ่มและจัดมุมกล้องให้เหมาะกับท่านี้",
  );
}
function renderExerciseOptions() {
  const sel = $("exercise");
  sel.innerHTML = Object.entries(EXERCISES)
    .map(([id, e]) => `<option value="${id}">${e.name} — ${e.th}</option>`)
    .join("");
  sel.value = "squat";
  updateExercise();
}
function renderPlanBuilder() {
  const order = [
    ...activePlan,
    ...Object.keys(EXERCISES).filter((id) => !activePlan.includes(id)),
  ];
  $("planBuilder").innerHTML = order
    .map((id) => {
      const selected = activePlan.includes(id),
        i = activePlan.indexOf(id);
      return `<div class="plan-item"><label><input type="checkbox" data-plan-check="${id}" ${selected ? "checked" : ""}><span><strong>${EXERCISES[id].name}</strong><br><span class="small-muted">${EXERCISES[id].th}</span></span></label><div class="move-buttons"><button type="button" data-move="up" data-id="${id}" aria-label="เลื่อน ${EXERCISES[id].th} ขึ้น" ${!selected || i === 0 ? "disabled" : ""}>↑</button><button type="button" data-move="down" data-id="${id}" aria-label="เลื่อน ${EXERCISES[id].th} ลง" ${!selected || i === activePlan.length - 1 ? "disabled" : ""}>↓</button></div></div>`;
    })
    .join("");
  $("planBuilder")
    .querySelectorAll("[data-plan-check]")
    .forEach((c) =>
      c.addEventListener("change", () => {
        const id = c.dataset.planCheck;
        if (c.checked) {
          if (!activePlan.includes(id)) activePlan.push(id);
        } else activePlan = activePlan.filter((x) => x !== id);
        renderPlanBuilder();
      }),
    );
  $("planBuilder")
    .querySelectorAll("[data-move]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const i = activePlan.indexOf(b.dataset.id),
          j = b.dataset.move === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= activePlan.length) return;
        [activePlan[i], activePlan[j]] = [activePlan[j], activePlan[i]];
        renderPlanBuilder();
      }),
    );
}
function setMode(next) {
  if (training) {
    toast("จบหรือหยุดการฝึกก่อนเปลี่ยนโหมด");
    return;
  }
  mode = next;
  $("singleMode").classList.toggle("active", mode === "single");
  $("circuitMode").classList.toggle("active", mode === "circuit");
  $("singleSettings").hidden = mode !== "single";
  $("circuitSettings").hidden = mode !== "circuit";
  $("workoutState").textContent =
    mode === "single" ? "โหมดฝึกท่าเดียว" : "โหมดโปรแกรมเป็นรอบ";
}
$("singleMode").addEventListener("click", () => setMode("single"));
$("circuitMode").addEventListener("click", () => setMode("circuit"));
$("rounds").addEventListener("input", () => {
  $("roundsValue").textContent = $("rounds").value;
});
$("preset").addEventListener("change", () => {
  activePlan = [...PRESETS[$("preset").value]];
  renderPlanBuilder();
});
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.toggle("active", p.id === id));
  document
    .querySelectorAll(".nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document
  .querySelectorAll(".nav button")
  .forEach((b) => b.addEventListener("click", () => showPage(b.dataset.page)));
function renderGuide() {
  const order = Object.keys(EXERCISES);
  $("exerciseLibrary").innerHTML = order
    .map((id) => {
      const e = EXERCISES[id];
      return `<article class="guide-card"><div class="guide-tag">${e.name.toUpperCase()}</div><h3>${e.th}</h3><p>${e.desc}</p><p><strong>วิธีทำ:</strong> ${e.good}</p><p><strong>ควรระวัง:</strong> ${e.bad}</p><p><strong>มุมกล้อง:</strong> ${e.camera}</p><p><strong>สิ่งที่ระบบประเมิน:</strong> ${e.eval}</p><p><strong>อุปกรณ์:</strong> ${e.equipment}</p></article>`;
    })
    .join("");
}
function showInstruction() {
  const ids =
    mode === "single"
      ? [$("exercise").value]
      : activePlan.length
        ? activePlan
        : PRESETS.beginner;
  if (mode === "circuit" && !activePlan.length) {
    toast("เลือกอย่างน้อย 1 ท่าในโปรแกรมก่อน");
    return;
  }
  const list = [];
  if (mode === "single") {
    const e = EXERCISES[ids[0]];
    $("modalTitle").textContent = "ก่อนเริ่ม: " + e.name + " / " + e.th;
    $("modalIntro").textContent = e.desc;
    list.push(
      "มุมกล้องที่แนะนำ: " + e.camera,
      "สิ่งที่ต้องเตรียม: " + e.equipment,
      "วิธีทำ: " + e.good,
      "ข้อควรระวัง: " + e.bad,
    );
  } else {
    $("modalTitle").textContent = "ก่อนเริ่มโปรแกรมฝึก";
    $("modalIntro").textContent =
      `โปรแกรมนี้มี ${ids.length} ท่าต่อรอบ จำนวน ${$("rounds").value} รอบ`;
    list.push(
      "คำแนะนำมุมกล้อง: " +
        ids
          .map((id) => EXERCISES[id].th + " — " + EXERCISES[id].camera)
          .join("; "),
      "เตรียมพื้นที่/อุปกรณ์ตามท่า: " +
        ids
          .map((id) => EXERCISES[id].th + " — " + EXERCISES[id].equipment)
          .join("; "),
      "รายการท่า: " + ids.map((id) => EXERCISES[id].th).join(" → "),
      "พักระหว่างท่า 10 วินาที และระหว่างรอบ 15 วินาที",
      "หากระหว่างโปรแกรมสถานะกล้องเป็นสีแดง ให้หยุดและปรับตำแหน่งกล้องก่อนฝึกต่อ",
    );
  }
  $("modalList").innerHTML = list.map((x) => `<li>${x}</li>`).join("");
  $("instructionModal").classList.add("show");
}
$("startBtn").addEventListener("click", () => {
  if (training) {
    toast("กำลังฝึกอยู่");
    return;
  }
  showInstruction();
});
$("cancelModal").addEventListener("click", () =>
  $("instructionModal").classList.remove("show"),
);
$("ackModal").addEventListener("click", async () => {
  $("instructionModal").classList.remove("show");
  await beginSetup();
});
async function initModel() {
  if (landmarker) return;
  setSignal("checking", "กำลังโหลด AI");
  $("cameraHint").textContent = "กำลังโหลดโมเดล AI ครั้งแรก อาจใช้เวลาสักครู่";
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );
  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
async function beginSetup() {
  try {
    preparing = true;
    $("startBtn").disabled = true;
    setSignal("checking", "กำลังเตรียมกล้อง");
    await initModel();
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
    }
    running = true;
    lastVideoTime = -1;
    $("placeholder").style.display = "none";
    $("liveBadge").classList.add("show");
    $("cameraStatus").textContent = "● CAMERA ON";
    $("cameraStatus").style.color = "var(--green)";
    $("stopBtn").disabled = false;
    resizeCanvas();
    setSignal("checking", "กำลังตรวจร่างกาย");
    $("cameraHint").textContent =
      "ยืนหรือจัดท่าให้อยู่ในภาพ รอจนสถานะเป็นสีเขียว";
    if (!loopActive) {
      loopActive = true;
      requestAnimationFrame(loop);
    }
    $("workoutState").textContent = "รอตรวจความพร้อมของร่างกาย";
    $("feedbackTitle").textContent = "กำลังตรวจกล้อง";
    $("feedbackText").textContent =
      "ระบบจะเริ่มนับถอยหลังเมื่อมองเห็นจุดร่างกายที่จำเป็นต่อท่าได้เพียงพอ";
    let tries = 0;
    const waitReady = () => {
      if (!preparing) return;
      if (
        lastLandmarks &&
        poseReady(
          lastLandmarks,
          mode === "single" ? $("exercise").value : activePlan[0] || "squat",
        )
      ) {
        preparing = false;
        setSignal("ready", "กล้องพร้อมแล้ว");
        $("cameraHint").textContent = "กล้องพร้อมแล้ว กำลังเริ่มนับถอยหลัง";
        startCountdown(3, () => startSession());
        return;
      }
      tries++;
      if (tries > 120) {
        preparing = false;
        setSignal("problem", "ยังตรวจไม่ชัด");
        $("cameraHint").textContent =
          "ขยับให้เห็นส่วนร่างกายที่จำเป็น เพิ่มแสง หรือปรับมุมกล้อง แล้วกดเริ่มฝึกอีกครั้ง";
        $("startBtn").disabled = false;
        $("workoutState").textContent = "ยังไม่พร้อมเริ่มฝึก";
        toast("ยังตรวจจับร่างกายไม่ชัด ลองปรับตำแหน่งกล้อง");
        return;
      }
      setTimeout(waitReady, 250);
    };
    waitReady();
  } catch (e) {
    console.error(e);
    preparing = false;
    running = false;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      video.srcObject = null;
    }
    $("startBtn").disabled = false;
    setSignal(
      "problem",
      e.name === "NotAllowedError" ? "อนุญาตกล้องก่อน" : "เปิดกล้องไม่สำเร็จ",
    );
    const msg =
      e.name === "NotAllowedError"
        ? "คุณไม่อนุญาตให้ใช้กล้อง กรุณาอนุญาตสิทธิ์กล้องในเบราว์เซอร์"
        : e.name === "NotFoundError"
          ? "ไม่พบกล้องที่เชื่อมต่อ"
          : "เปิดกล้องหรือโหลดโมเดลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตและสิทธิ์กล้อง";
    $("cameraHint").textContent = msg;
    toast(msg);
  }
}
function poseReady(lm, id) {
  const need = EXERCISES[id]?.needed || [11, 12, 23, 24, 25, 26, 27, 28];
  return visible(lm, need, 0.45);
}
function startCountdown(seconds, done) {
  const token = ++countdownToken;
  let left = seconds;
  $("countdownOverlay").classList.add("show");
  $("countdownNumber").textContent = left;
  const tick = () => {
    if (token !== countdownToken) return;
    if (paused) {
      setTimeout(tick, 250);
      return;
    }
    if (left <= 0) {
      $("countdownOverlay").classList.remove("show");
      done();
      return;
    }
    $("countdownNumber").textContent = left;
    left--;
    setTimeout(tick, 1000);
  };
  tick();
}
function resetRepState() {
  repCount = 0;
  phase = "start";
  lastRepAt = 0;
  $("reps").textContent = "0";
  scoreSum = 0;
  scoreFrames = 0;
  validFrames = 0;
  scoreUpdate(NaN);
  $("scoreLabel").textContent = "กำลังประเมิน";
}
function startSession() {
  sessionId++;
  training = true;
  paused = false;
  historySaved = false;
  sessionStart = Date.now();
  elapsedBeforePause = 0;
  sessionElapsed = 0;
  sessionAccumulatedMs = 0;
  pausedAt = 0;
  currentRecorded = false;
  repByExercise = {};
  scoreByExercise = {};
  exerciseScores = {};
  roundNow = 1;
  planIndex = 0;
  roundsTotal = mode === "circuit" ? Number($("rounds").value) : 1;
  activePlan =
    mode === "circuit"
      ? activePlan.length
        ? activePlan
        : [...PRESETS.beginner]
      : [$("exercise").value];
  currentExercise = activePlan[0];
  resetRepState();
  $("startBtn").disabled = true;
  $("pauseBtn").disabled = false;
  $("skipBtn").disabled = mode !== "circuit";
  $("finishBtn").disabled = false;
  $("workoutState").textContent =
    mode === "single"
      ? "กำลังฝึก: " + EXERCISES[currentExercise].th
      : "รอบ 1 / " + roundsTotal + " · " + EXERCISES[currentExercise].th;
  $("phaseBanner").classList.remove("show");
  phaseType = "exercise";
  phaseEnd = Date.now() + (mode === "circuit" ? 20000 : Infinity);
  timerId = setInterval(tickSession, 200);
  $("time").textContent = "00:00";
  setFeedback("กำลังฝึก", EXERCISES[currentExercise].good);
}
function elapsedSeconds() {
  return Math.floor(
    (sessionAccumulatedMs + (paused ? 0 : Date.now() - sessionStart)) / 1000,
  );
}
function tickSession() {
  if (!training || paused) return;
  const elapsed = elapsedSeconds();
  $("time").textContent =
    String(Math.floor(elapsed / 60)).padStart(2, "0") +
    ":" +
    String(elapsed % 60).padStart(2, "0");
  if (mode === "single") return;
  const left = Math.max(0, Math.ceil((phaseEnd - Date.now()) / 1000));
  if (phaseType === "exercise") {
    $("workoutState").textContent =
      `รอบ ${roundNow}/${roundsTotal} · ${EXERCISES[currentExercise].th} · เหลือ ${left} วินาที`;
    if (Date.now() >= phaseEnd) {
      recordExerciseScore();
      nextCircuitPhase();
    }
  } else if (
    phaseType === "restExercise" ||
    phaseType === "restRound" ||
    phaseType === "countdown"
  ) {
    $("workoutState").textContent =
      phaseType === "restExercise"
        ? `พักระหว่างท่า · ${left} วินาที`
        : phaseType === "restRound"
          ? `พักระหว่างรอบ · ${left} วินาที`
          : `เตรียมท่า ${EXERCISES[currentExercise].th} · ${left} วินาที`;
    $("phaseBanner").textContent =
      phaseType === "restExercise"
        ? `พัก ${left} วินาที — เตรียมท่าถัดไป`
        : phaseType === "restRound"
          ? `พักระหว่างรอบ ${left} วินาที`
          : `เริ่ม ${EXERCISES[currentExercise].th} ใน ${left} วินาที`;
    $("phaseBanner").classList.add("show");
    if (Date.now() >= phaseEnd) {
      if (phaseType === "restExercise") {
        beginPhaseCountdown();
      } else if (phaseType === "restRound") {
        planIndex = 0;
        beginPhaseCountdown();
      } else {
        phaseType = "exercise";
        phaseEnd = Date.now() + 20000;
        currentRecorded = false;
        resetRepState();
        $("phaseBanner").classList.remove("show");
        setFeedback("เริ่มท่าแล้ว", EXERCISES[currentExercise].good);
      }
    }
  }
}
function beginPhaseCountdown() {
  phaseType = "countdown";
  phaseEnd = Date.now() + 3000;
  $("phaseBanner").textContent = "เตรียมพร้อม — เริ่มใน 3 วินาที";
  $("phaseBanner").classList.add("show");
}
function nextCircuitPhase() {
  if (planIndex < activePlan.length - 1) {
    phaseType = "restExercise";
    phaseEnd = Date.now() + 10000;
    planIndex++;
    currentExercise = activePlan[planIndex];
    currentRecorded = false;
    resetRepState();
    $("workoutState").textContent = "พักก่อนท่าถัดไป";
    setFeedback("พักสักครู่", `ท่าถัดไป: ${EXERCISES[currentExercise].th}`);
  } else if (roundNow < roundsTotal) {
    phaseType = "restRound";
    phaseEnd = Date.now() + 15000;
    roundNow++;
    currentExercise = activePlan[0];
    currentRecorded = false;
    resetRepState();
    setFeedback("พักระหว่างรอบ", "พัก 15 วินาที แล้วเตรียมเริ่มรอบถัดไป");
  } else {
    finishSession(true);
  }
}
function recordExerciseScore() {
  if (currentRecorded) return;
  currentRecorded = true;
  const id = currentExercise;
  repByExercise[id] = (repByExercise[id] || 0) + repCount;
  const score = scoreFrames ? Math.round(scoreSum / scoreFrames) : null;
  if (!exerciseScores[id]) exerciseScores[id] = [];
  if (score !== null) exerciseScores[id].push(score);
  scoreByExercise[id] = exerciseScores[id].length
    ? Math.round(
        exerciseScores[id].reduce((a, b) => a + b, 0) /
          exerciseScores[id].length,
      )
    : null;
}
function pauseSession() {
  if (!training) return;
  paused = !paused;
  if (paused) {
    pausedAt = Date.now();
    sessionAccumulatedMs += Date.now() - sessionStart;
    $("pauseBtn").textContent = "▶ ดำเนินต่อ";
    $("workoutState").textContent = "พักชั่วคราว";
    setFeedback("พักชั่วคราว", "กดดำเนินต่อเพื่อกลับไปฝึก");
  } else {
    const pauseDuration = Date.now() - pausedAt;
    sessionStart = Date.now();
    if (mode === "circuit" && Number.isFinite(phaseEnd))
      phaseEnd += pauseDuration;
    $("pauseBtn").textContent = "⏸ พักชั่วคราว";
    $("workoutState").textContent = "ฝึกต่อ";
    setFeedback("ฝึกต่อ", EXERCISES[currentExercise].good);
  }
}
$("pauseBtn").addEventListener("click", pauseSession);
$("skipBtn").addEventListener("click", () => {
  if (!training || mode !== "circuit" || phaseType !== "exercise") return;
  recordExerciseScore();
  nextCircuitPhase();
});
$("finishBtn").addEventListener("click", () => finishSession(false));
function finishSession(completed) {
  if (!training) return;
  const total = elapsedSeconds();
  if (mode === "circuit" && phaseType === "exercise") recordExerciseScore();
  training = false;
  paused = false;
  preparing = false;
  clearInterval(timerId);
  timerId = null;
  $("pauseBtn").disabled = true;
  $("skipBtn").disabled = true;
  $("finishBtn").disabled = true;
  $("pauseBtn").textContent = "⏸ พักชั่วคราว";
  $("startBtn").disabled = false;
  $("phaseBanner").classList.remove("show");
  $("countdownOverlay").classList.remove("show");
  $("time").textContent =
    String(Math.floor(total / 60)).padStart(2, "0") +
    ":" +
    String(total % 60).padStart(2, "0");
  if (mode === "single") {
    repByExercise[currentExercise] = repCount;
    scoreByExercise[currentExercise] = scoreFrames
      ? Math.round(scoreSum / scoreFrames)
      : null;
  }
  const entries = Object.keys(repByExercise).map((id) => ({
    id,
    name: EXERCISES[id].name,
    th: EXERCISES[id].th,
    reps: repByExercise[id] || 0,
    score: scoreByExercise[id],
  }));
  const totalReps = entries.reduce((a, x) => a + x.reps, 0);
  const scores = entries
    .filter((x) => x.score !== null && x.score !== undefined)
    .map((x) => x.score);
  const overall = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const strengths = entries.filter((x) => x.score >= 80).map((x) => x.th);
  const improve = entries
    .filter((x) => x.score !== null && x.score < 75)
    .map((x) => x.th);
  summaryData = {
    date: new Date().toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    mode: mode === "single" ? "ฝึกท่าเดียว" : "โปรแกรมเป็นรอบ",
    completed,
    rounds: mode === "circuit" ? roundNow : 1,
    totalSeconds: total,
    totalReps,
    entries,
    overall,
    strengths,
    improve,
  };
  if (!historySaved) {
    saveSessionHistory(summaryData);
    historySaved = true;
  }
  renderSummary(summaryData);
  $("summaryModal").classList.add("show");
  $("workoutState").textContent = completed ? "ฝึกครบโปรแกรมแล้ว" : "จบการฝึก";
  setFeedback(
    "จบการฝึก",
    completed
      ? "ทำได้ดีมาก ลองอ่านสรุปและเลือกจุดพัฒนาในครั้งถัดไป"
      : "บันทึกผลการฝึกแล้ว ตรวจดูสรุปเพื่อวางแผนครั้งถัดไป",
    true,
  );
}
function renderSummary(s) {
  const time =
    String(Math.floor(s.totalSeconds / 60)).padStart(2, "0") +
    ":" +
    String(s.totalSeconds % 60).padStart(2, "0");
  const entryHtml = s.entries
    .map(
      (e) =>
        `<div class="summary-ex"><div><strong>${e.name} / ${e.th}</strong><span>${e.score === null ? "คะแนนไม่เพียงพอสำหรับประเมิน" : "คะแนนคุณภาพท่า: " + e.score + "%"}</span></div><b>${e.reps} ครั้ง</b></div>`,
    )
    .join("");
  const strengths = s.strengths.length
    ? s.strengths.join("、")
    : "ยังไม่มีท่าที่คะแนนสูงชัดเจนในรอบนี้ ลองลดความเร็วและเน้นควบคุมท่า";
  const improve = s.improve.length
    ? s.improve.join("、")
    : "ฝึกต่อโดยรักษาจังหวะและคุณภาพการเคลื่อนไหว";
  $("summaryContent").innerHTML =
    `<div class="content-grid" style="margin:14px 0"><div class="stat"><div class="stat-label">เวลารวม</div><div class="stat-value green">${time}</div></div><div class="stat"><div class="stat-label">จำนวนครั้งรวม</div><div class="stat-value">${s.totalReps}</div></div><div class="stat"><div class="stat-label">รอบที่ทำ</div><div class="stat-value">${s.rounds}</div></div><div class="stat"><div class="stat-label">คะแนนเฉลี่ย</div><div class="stat-value">${s.overall === null ? "--" : s.overall + "%"}</div></div></div><h3>ผลแยกตามท่า</h3><div class="summary-list">${entryHtml}</div><div class="info-card" style="margin-top:13px"><h3>สิ่งที่ทำได้ดี</h3><p>${strengths}</p><h3>สิ่งที่ควรปรับปรุง</h3><p>${improve}</p><h3>คำแนะนำครั้งถัดไป</h3><p>เลือกแก้ไขทีละจุด ทำช้าลงหากจำเป็น และให้ความสำคัญกับครั้งที่ผ่านเกณฑ์มากกว่าจำนวนครั้งรวม</p></div>`;
}
function saveSessionHistory(s) {
  try {
    let h = JSON.parse(localStorage.getItem("aisc_history") || "[]");
    h.unshift({
      date: s.date,
      exercise: s.mode,
      reps: s.totalReps,
      time:
        String(Math.floor(s.totalSeconds / 60)).padStart(2, "0") +
        ":" +
        String(s.totalSeconds % 60).padStart(2, "0"),
      score: s.overall,
      rounds: s.rounds,
    });
    localStorage.setItem("aisc_history", JSON.stringify(h.slice(0, 10)));
    renderHistory();
  } catch (e) {
    toast("บันทึกประวัติไม่ได้ในเบราว์เซอร์นี้");
  }
}
function renderHistory() {
  let h = [];
  try {
    h = JSON.parse(localStorage.getItem("aisc_history") || "[]");
  } catch {}
  $("history").innerHTML = h.length
    ? h
        .map(
          (x) =>
            `<div class="history-row"><div><strong>${x.exercise || "ฝึกซ้อม"}</strong><div class="sub">${x.date} · ${x.time}${x.rounds ? " · " + x.rounds + " รอบ" : ""}</div></div><span>${x.reps || 0} ครั้ง${x.score === null || x.score === undefined ? "" : " · " + x.score + "%"}</span></div>`,
        )
        .join("")
    : '<div class="sub">ยังไม่มีประวัติการฝึก</div>';
}
$("closeSummary").addEventListener("click", () =>
  $("summaryModal").classList.remove("show"),
);
$("newWorkout").addEventListener("click", () => {
  $("summaryModal").classList.remove("show");
  resetRepState();
  $("time").textContent = "00:00";
  $("workoutState").textContent = "พร้อมเริ่มฝึกครั้งใหม่";
  setSignal("ready", "กล้องยังเปิดอยู่");
});
function resizeCanvas() {
  if (video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
}
function stopCamera() {
  countdownToken++;
  preparing = false;
  running = false;
  training = false;
  paused = false;
  clearInterval(timerId);
  timerId = null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
  $("liveBadge").classList.remove("show");
  $("cameraStatus").textContent = "● CAMERA OFF";
  $("stopBtn").disabled = true;
  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;
  $("skipBtn").disabled = true;
  $("finishBtn").disabled = true;
  $("placeholder").style.display = "grid";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setSignal("checking", "รอตรวจกล้อง");
  $("cameraHint").textContent = "กล้องปิดแล้ว กดเริ่มฝึกเพื่อเปิดกล้องใหม่";
  $("workoutState").textContent = "กล้องปิดแล้ว";
  $("phaseBanner").classList.remove("show");
  $("countdownOverlay").classList.remove("show");
}
$("stopBtn").addEventListener("click", () => {
  if (training && !confirm("ต้องการหยุดการฝึกและปิดกล้องใช่หรือไม่?")) return;
  if (training) finishSession(false);
  stopCamera();
});
function processPose(lm) {
  if (!training || paused) return;
  const ex = currentExercise,
    e = EXERCISES[ex];
  const need = e.needed;
  const visibleCount = lm.filter((p) => (p.visibility ?? 1) > 0.5).length;
  const conf = Math.round((visibleCount / 33) * 100);
  $("confidence").innerHTML = conf + '<small style="font-size:14px">%</small>';
  if (!poseReady(lm, ex)) {
    setSignal("problem", "มองเห็นไม่ครบ");
    setFeedback(
      "ตรวจจับไม่ชัด",
      "ขยับกล้องหรือร่างกายให้เห็นส่วนที่จำเป็นของท่านี้ชัดขึ้น",
    );
    scoreUpdate(NaN);
    return;
  }
  setSignal("ready", "ตรวจพบร่างกาย");
  let score = null,
    msg = "เคลื่อนไหวอย่างควบคุม",
    title = "กำลังวิเคราะห์";
  const p = (i) => lm[i];
  const mid = (a, b) => ({
    x: (p(a).x + p(b).x) / 2,
    y: (p(a).y + p(b).y) / 2,
  });
  const side = visible(lm, [11, 23, 25, 27])
    ? [11, 23, 25, 27]
    : [12, 24, 26, 28];
  const [sh, hip, knee, ankle] = side.map(p);
  const kneeA = angle(hip, knee, ankle);
  const hipA = angle(sh, hip, knee);
  let phaseIn = false,
    phaseOut = false;
  if (ex === "squat" || ex === "jumpsquat" || ex === "lunge") {
    if (ex === "lunge") {
      const k1 = angle(p(23), p(25), p(27)),
        k2 = angle(p(24), p(26), p(28));
      const bent = Math.min(k1, k2) < 125,
        straight = Math.min(k1, k2) > 155;
      phaseIn = bent;
      phaseOut = straight;
      score = bent ? 82 : straight ? 84 : 70;
      msg = bent
        ? "ย่อตัวเท่าที่ควบคุมได้และรักษาแนวเข่า"
        : "ก้าวให้มั่นคง แล้วค่อย ๆ ย่อตัว";
      title = bent ? "ช่วงย่อตัว" : "ควบคุมการก้าว";
    } else {
      const k = kneeA;
      phaseIn = k < 118;
      phaseOut = k > 155;
      score = k < 62 ? 55 : k < 118 ? 88 : k > 155 ? 86 : 72;
      msg = phaseIn
        ? "รักษาแนวเข่าและลำตัวให้มั่นคง"
        : "ค่อย ๆ ย่อตัวและกลับมายืนอย่างควบคุม";
      title = phaseIn ? "ช่วงย่อตัว" : "ควบคุมการเคลื่อนไหว";
    }
  } else if (ex === "pushup") {
    const elbowA = angle(p(11), p(13), p(15)),
      bodyA = angle(p(11), p(23), p(27));
    phaseIn = elbowA < 100;
    phaseOut = elbowA > 150;
    score = bodyA > 155 ? (phaseIn ? 84 : 90) : 55;
    msg =
      bodyA < 145
        ? "พยายามรักษาไหล่ สะโพก และข้อเท้าให้เป็นแนวเดียว"
        : "ลดตัวและดันกลับโดยรักษาแนวลำตัว";
    title = phaseIn ? "ช่วงลดตัว" : "ควบคุมแนวลำตัว";
  } else if (ex === "curl") {
    const a = angle(p(11), p(13), p(15));
    phaseIn = a < 70;
    phaseOut = a > 145;
    score = a < 55 ? 82 : a > 145 ? 88 : 74;
    msg = "ให้ข้อศอกอยู่ใกล้ลำตัวและอย่าเหวี่ยงตัว";
    title = phaseIn ? "งอแขน" : "ควบคุมข้อศอก";
  } else if (ex === "jumping") {
    const handsHigh = p(15).y < p(11).y && p(16).y < p(12).y,
      feetWide = Math.abs(p(27).x - p(28).x) > 0.2;
    phaseIn = handsHigh && feetWide;
    phaseOut = !handsHigh && !feetWide;
    score = phaseIn ? 88 : phaseOut ? 86 : 70;
    msg = phaseIn
      ? "กางแขนและขาพร้อมกันอย่างสมดุล"
      : "กลับสู่ท่าเริ่มต้นและเตรียมกางแขนขา";
    title = phaseIn ? "กางแขนและขา" : "กลับสู่ท่าเริ่มต้น";
  } else if (ex === "sidecrunch") {
    const shM = mid(11, 12),
      hipM = mid(23, 24);
    const tilt = Math.abs(shM.x - hipM.x);
    phaseIn = tilt > 0.045;
    phaseOut = tilt < 0.025;
    score = tilt > 0.16 ? 58 : tilt > 0.045 ? 84 : 76;
    msg = "เอียงลำตัวด้านข้างอย่างพอดี ไม่บิดตัวหรือโยกสะโพก";
    title = phaseIn ? "เอียงด้านข้าง" : "กลับสู่ท่ากลาง";
  } else if (ex === "elbowknee") {
    const d1 = dist(p(13), p(26)),
      d2 = dist(p(14), p(25)),
      d = Math.min(d1, d2);
    phaseIn = d < 0.18;
    phaseOut = d > 0.3;
    score = d < 0.12 ? 90 : d < 0.18 ? 84 : 72;
    msg = "ยกเข่าเข้าหาศอกฝั่งตรงข้ามและสลับข้างอย่างควบคุม";
    title = phaseIn ? "เข่าเข้าหาศอก" : "เตรียมสลับข้าง";
  } else if (ex === "stepups") {
    const lift = Math.min(p(25).y - p(23).y, p(26).y - p(24).y);
    phaseIn = lift < 0.12;
    phaseOut = lift > 0.2;
    score = phaseIn ? 82 : 76;
    msg = "ก้าวขึ้นและลงแท่นที่มั่นคงอย่างช้า ๆ";
    title = phaseIn ? "ยกเข่าหรือก้าวขึ้น" : "เตรียมก้าวถัดไป";
  } else if (ex === "glute") {
    const hipM = mid(23, 24),
      shoulderM = mid(11, 12),
      kneeM = mid(25, 26);
    const a = angle(shoulderM, hipM, kneeM);
    phaseIn = a > 155;
    phaseOut = a < 135;
    score = a > 175 ? 60 : a > 150 ? 88 : 75;
    msg = "ยกสะโพกโดยใช้กล้ามเนื้อก้น ไม่แอ่นหลังเกินไป";
    title = phaseIn ? "ยกสะโพก" : "เตรียมยกสะโพก";
  } else if (ex === "march") {
    const dy = Math.min(p(25).y - p(23).y, p(26).y - p(24).y);
    phaseIn = dy < 0.16;
    phaseOut = dy > 0.23;
    score = dy < 0.12 ? 90 : dy < 0.16 ? 84 : 75;
    msg = "ยกเข่าสลับข้างตามระดับที่สบายและรักษาสมดุล";
    title = phaseIn ? "ยกเข่า" : "สลับข้าง";
  } else if (ex === "sideleg") {
    const dx = Math.max(
      Math.abs(p(27).x - p(25).x),
      Math.abs(p(28).x - p(26).x),
    );
    phaseIn = dx > 0.16;
    phaseOut = dx < 0.09;
    score = dx > 0.3 ? 58 : dx > 0.16 ? 87 : 74;
    msg = "ยกขาออกด้านข้างโดยไม่โยกลำตัว";
    title = phaseIn ? "ยกขาด้านข้าง" : "ลดขาอย่างควบคุม";
  }
  if (phaseIn && phase === "start") {
    phase = "active";
    lastRepAt = Date.now();
  }
  if (phaseOut && phase === "active" && Date.now() - lastRepAt > 450) {
    repCount++;
    phase = "start";
    lastRepAt = Date.now();
    $("reps").textContent = repCount;
    title = "นับครั้งผ่านเกณฑ์";
    msg = "ตรวจพบช่วงการเคลื่อนไหวครบแล้ว ทำต่อด้วยจังหวะที่ควบคุมได้";
  }
  if (score === null || !Number.isFinite(score)) {
    setFeedback("ประเมินไม่ได้ชัดเจน", "ปรับตำแหน่งกล้องแล้วลองใหม่");
    scoreUpdate(NaN);
    return;
  }
  scoreFrames++;
  scoreSum += score;
  validFrames++;
  scoreUpdate(score);
  setFeedback(title, msg, score >= 85);
}
function drawPose(lm) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const links = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
    [11, 23],
    [12, 24],
    [23, 24],
    [23, 25],
    [25, 27],
    [24, 26],
    [26, 28],
    [27, 29],
    [29, 31],
    [28, 30],
    [30, 32],
  ];
  ctx.lineWidth = Math.max(3, canvas.width / 300);
  ctx.strokeStyle = "#b6ff3b";
  ctx.fillStyle = "#efffcf";
  ctx.shadowColor = "#b6ff3b";
  ctx.shadowBlur = 7;
  for (const [a, b] of links) {
    if ((lm[a].visibility ?? 1) > 0.35 && (lm[b].visibility ?? 1) > 0.35) {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
      ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
      ctx.stroke();
    }
  }
  for (const q of lm) {
    if ((q.visibility ?? 1) > 0.35) {
      ctx.beginPath();
      ctx.arc(
        q.x * canvas.width,
        q.y * canvas.height,
        Math.max(3, canvas.width / 190),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}
function loop() {
  if (!running) {
    loopActive = false;
    return;
  }
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    )
      resizeCanvas();
    lastVideoTime = video.currentTime;
    try {
      const r = landmarker.detectForVideo(video, performance.now());
      if (r.landmarks && r.landmarks.length) {
        lastLandmarks = r.landmarks[0];
        drawPose(lastLandmarks);
        if (preparing) {
          const id =
            mode === "single" ? $("exercise").value : activePlan[0] || "squat";
          if (poseReady(lastLandmarks, id)) {
            setSignal("ready", "ตรวจพบร่างกาย");
            $("cameraHint").textContent = "ตรวจพบจุดร่างกายที่จำเป็นแล้ว";
          } else {
            setSignal("checking", "จัดท่าให้อยู่ในภาพ");
          }
        }
        processPose(lastLandmarks);
      } else {
        lastLandmarks = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $("confidence").innerHTML = '0<small style="font-size:14px">%</small>';
        if (training) {
          setSignal("problem", "ไม่พบร่างกาย");
          setFeedback(
            "ไม่พบร่างกาย",
            "ปรับตำแหน่งกล้องและให้ส่วนสำคัญอยู่ในภาพ",
          );
          scoreUpdate(NaN);
        } else if (preparing) {
          setSignal("checking", "รอพบร่างกาย");
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }
  frameId = requestAnimationFrame(loop);
}
$("resetBtn").addEventListener("click", () => {
  if (confirm("ต้องการลบประวัติการฝึกทั้งหมดหรือไม่?")) {
    localStorage.removeItem("aisc_history");
    renderHistory();
    toast("ลบประวัติแล้ว");
  }
});
window.addEventListener("beforeunload", () => {
  if (stream) stream.getTracks().forEach((t) => t.stop());
});
renderExerciseOptions();
activePlan = [...PRESETS.beginner];
renderPlanBuilder();
renderGuide();
renderHistory();
setSignal("checking", "รอตรวจกล้อง");
