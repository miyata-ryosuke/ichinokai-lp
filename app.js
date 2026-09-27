/* =========================================================
   いちの会 LP  —  interactions + form submit
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. 画像プレースホルダを実画像に差し替え ---------- */
  // images/ フォルダに指定ファイル名で画像を置くと自動で表示されます。
  document.querySelectorAll(".ph[data-img]").forEach(function (el) {
    var src = el.getAttribute("data-img");
    var img = new Image();
    img.onload = function () {
      el.style.setProperty("--src", 'url("' + src + '")');
      el.classList.add("has-img");
    };
    img.onerror = function () {
      /* 画像が無い間はプレースホルダ表示のまま */
    };
    img.src = src;
  });

  /* ---------- 2. ナビの背景（スクロールで出現） ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. スクロールでふわっと表示 ---------- */
  var targets = document.querySelectorAll(
    ".section__head, .card, .awaji__media, .awaji__text, .giftedcode__figure, .giftedcode__text, .timeline__day, .venue__grid, .forwhom__list li, .outline__table, .faq details, .form, .host, .voice, .step, .decide__col, .yogen__text, .yogen__deco"
  );
  targets.forEach(function (t) { t.classList.add("reveal"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* ---------- 4. 申込フォーム送信 → Supabase ---------- */
  var form = document.getElementById("applyForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "form__status" + (type ? " " + type : "");
  }

  function isConfigured() {
    return (
      window.SUPABASE_URL &&
      window.SUPABASE_URL.indexOf("http") === 0 &&
      window.SUPABASE_ANON_KEY &&
      window.SUPABASE_ANON_KEY.indexOf("PASTE") === -1
    );
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");

    // バリデーション
    var invalid = false;
    ["name", "email"].forEach(function (n) {
      var f = form.elements[n];
      if (!f.value.trim()) { f.classList.add("invalid"); invalid = true; }
      else f.classList.remove("invalid");
    });
    if (!form.elements["consent"].checked) invalid = true;
    if (invalid) { setStatus("必須項目（お名前・メール・同意）をご確認ください。", "err"); return; }

    var payload = {
      name: form.elements["name"].value.trim(),
      kana: form.elements["kana"].value.trim(),
      email: form.elements["email"].value.trim(),
      phone: form.elements["phone"].value.trim(),
      plan: form.elements["plan"].value.trim(),
      message: form.elements["message"].value.trim(),
      consent: form.elements["consent"].checked
    };

    if (!isConfigured()) {
      setStatus("（設定未完了）config.js に Supabase の URL とキーを設定すると送信できます。", "err");
      console.warn("Supabase 未設定です。config.js を編集してください。", payload);
      return;
    }

    submitBtn.disabled = true;
    setStatus("送信中…");

    fetch(window.SUPABASE_URL + "/rest/v1/" + window.APPLY_TABLE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + window.SUPABASE_ANON_KEY,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          setStatus("お申し込みありがとうございます。事務局よりご連絡いたします。", "ok");
        } else {
          return res.text().then(function (t) {
            console.error("Supabase error:", res.status, t);
            setStatus("送信に失敗しました。時間をおいて再度お試しください。", "err");
          });
        }
      })
      .catch(function (err) {
        console.error(err);
        setStatus("通信エラーが発生しました。ネット環境をご確認ください。", "err");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();
