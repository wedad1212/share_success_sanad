// إرسال القصة إلى الإيميل


var COOLDOWN_MS = 60000; // لازم يمرّ دقيقة بين قصة وقصة من نفس الجهاز

var f = document.getElementById("f");
var err = document.getElementById("err");
var btn = document.getElementById("send");
var sendText = btn.textContent; // نص الزر الأصلي
var story = document.getElementById("story");
var openedAt = Date.now(); // وقت فتح الفورم (بنستعملو لكشف البوتات السريعة)

// عدّاد الأحرف
story.addEventListener("input", function () {
  document.getElementById("n").textContent = story.value.length;
});

// إزالة الإطار الأحمر أول ما المستخدم يكتب
f.addEventListener("input", function (e) { e.target.classList.remove("bad"); });

function setSending(on) {
  btn.disabled = on;
  btn.classList.toggle("loading", on);
  btn.textContent = on ? "عم نرسل قصتك..." : sendText;
  f.classList.toggle("sending", on);
}

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


  // منع الإرسال المتكرر من نفس الجهاز
  if (Date.now() - lastSent() < COOLDOWN_MS) {
    err.textContent = "وصلتنا قصتك قبل شوي. استنى دقيقة قبل ما ترسل غيرها.";
    return;
  }

  var data = Object.fromEntries(new FormData(f).entries());
  data.took = Date.now() - openedAt;
  setSending(true);

  function done() {
    // بعد الإرسال: بنخفي كل شي وبنظهر شاشة الشكر بس
    document.querySelector(".top").style.display = "none";
    document.getElementById("share").style.display = "none";
    document.getElementById("foot").style.display = "none";
    document.getElementById("thanks").hidden = false;
    window.scrollTo(0, 0);
  }

  var url = window.ENDPOINT || "";
  if (!url) { done(); return; } // وضع التجربة

  // ملاحظة: ما منحط headers لأنو Google بيرفض الطلب إذا جا بنوع JSON
  fetch(url, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) { markSent(); done(); return; }
      setSending(false);
      err.textContent = res.limited
        ? "وصلت للحد الأقصى من المشاركات اليوم. جرب بكرا."
        : "ما انرسلت القصة. جرب مرة تانية بعد شوي.";
    })
    .catch(function () {
      setSending(false);
      err.textContent = "ما انرسلت القصة. جرّب مرة تانية بعد شوي.";
    });
});


var share = document.getElementById("share");
document.getElementById("open").addEventListener("click", function () {
  share.hidden = false; // إظهار الفورم
  document.getElementById("foot").hidden = false; 
  openedAt = Date.now();
  share.scrollIntoView({ behavior: "smooth" });
  setTimeout(function () { document.getElementById("name").focus({ preventScroll: true }); }, 600);
});