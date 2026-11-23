// ===== إرسال القصة إلى الإيميل (عن طريق Google Apps Script) =====
// الصقي هون رابط Apps Script (بينتهي بـ /exec). إذا تُرك فاضي: الصفحة بتشتغل بوضع التجربة ولا ترسل شي.
var ENDPOINT = "https://script.google.com/macros/s/AKfycbwiDsAQT9HTvTvIwYs3_UN6FOESVPyX6Uas0VXCF75GUcOD4SoGSyRADX--xSwfxqAZ-Q/exec";

var COOLDOWN_MS = 60000; // لازم يمرّ دقيقة بين قصة وقصة من نفس الجهاز

var f = document.getElementById("f");
var err = document.getElementById("err");
var btn = document.getElementById("send");
var story = document.getElementById("story");
var openedAt = Date.now(); // وقت فتح الفورم (بنستعملو لكشف البوتات السريعة)

// عدّاد الأحرف
story.addEventListener("input", function () {
  document.getElementById("n").textContent = story.value.length;
});

// إزالة الإطار الأحمر أول ما المستخدم يكتب
f.addEventListener("input", function (e) { e.target.classList.remove("bad"); });

function fail(el, msg) {
  err.textContent = msg;
  if (el.type !== "checkbox") el.classList.add("bad");
  el.focus();
}

// حفظ وقت آخر إرسال بالجهاز (للانتظار بين قصة وقصة)
function lastSent() { try { return Number(localStorage.getItem("sanadLastSent")) || 0; } catch (e) { return 0; } }
function markSent() { try { localStorage.setItem("sanadLastSent", Date.now()); } catch (e) {} }

f.addEventListener("submit", function (e) {
  e.preventDefault();
  err.textContent = "";

  var fields = f.querySelectorAll("input[type=text],input[type=tel],input[type=url],textarea");
  for (var i = 0; i < fields.length; i++) {
    if (!fields[i].value.trim()) { fail(fields[i], "عبّي كل الحقول لو سمحت."); return; }
  }
  if (!f.social.checkValidity()) { fail(f.social, "الرابط لازم يبدأ بـ https://"); return; }
  // خانة الموافقة اختيارية: إذا مو موجودة بالـ HTML ما في تحقق منها
  if (f.consent && !f.consent.checked) { fail(f.consent, "لازم توافق على النشر والتواصل حتى نقدر نستلم قصتك."); return; }

  // منع الإرسال المتكرر من نفس الجهاز
  if (Date.now() - lastSent() < COOLDOWN_MS) {
    err.textContent = "وصلتنا قصتك قبل شوي. استني دقيقة قبل ما ترسلي غيرها.";
    return;
  }

  var data = Object.fromEntries(new FormData(f).entries());
  data.took = Date.now() - openedAt; // كم ميلي ثانية مرّت لحد ما أرسل
  btn.disabled = true;

  function done() {
    // بعد الإرسال: بنخفي كل شي وبنظهر شاشة الشكر بس
    document.querySelector(".top").style.display = "none";
    document.getElementById("share").style.display = "none";
    document.getElementById("foot").style.display = "none";
    document.getElementById("thanks").hidden = false;
    window.scrollTo(0, 0);
  }

  if (!ENDPOINT) { done(); return; } // وضع التجربة

  // ملاحظة: ما منحط headers لأنو Google بيرفض الطلب إذا جا بنوع JSON
  fetch(ENDPOINT, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) { markSent(); done(); return; }
      btn.disabled = false;
      err.textContent = res.limited
        ? "وصلتي للحد الأقصى من المشاركات اليوم. جرّبي بكرا."
        : "ما انرسلت القصة. جرّب مرة تانية بعد شوي.";
    })
    .catch(function () {
      btn.disabled = false;
      err.textContent = "ما انرسلت القصة. جرّب مرة تانية بعد شوي.";
    });
});

// ===== زر "شارك قصة النجاح": بيطلّع الفورم المخفي وينزّل الصفحة لعندو =====
var share = document.getElementById("share");
document.getElementById("open").addEventListener("click", function () {
  share.hidden = false; // إظهار الفورم
  document.getElementById("foot").hidden = false; // وإظهار الفوتر معو
  openedAt = Date.now();
  share.scrollIntoView({ behavior: "smooth" });
  setTimeout(function () { document.getElementById("name").focus({ preventScroll: true }); }, 600);
});