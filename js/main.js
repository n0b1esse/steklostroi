/* Стеклострой — общий интерактив: меню, модалки, формы, калькулятор, фильтры, reveal */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- sticky header ---------- */
  var header = $("#siteHeader");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = $("#burger");
  var mobileMenu = $("#mobileMenu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", mobileMenu).forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- active nav (подстраховка, если data-page не проставлен) ---------- */
  var path = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (path === "") path = "index.html";
  $$("[data-nav]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("is-active");
    if ((path === "index.html" || path === "") && href === "index.html") a.classList.add("is-active");
  });

  /* ---------- modal ---------- */
  var backdrop = $("#modalBackdrop");
  var modalTitle = $("#modalTitle");
  var modalSub = $("#modalSub");
  var modalForm = $("#modalForm");
  var modalTopic = $("#modalTopic");
  function openModal(title, sub, topic) {
    if (!backdrop) return;
    if (modalTitle && title) modalTitle.textContent = title;
    if (modalSub && sub) modalSub.textContent = sub;
    if (modalTopic) modalTopic.value = topic || title || "Заявка с сайта";
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    var first = $("#modalName");
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    if (!backdrop) return;
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }
  $$("[data-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(
        btn.getAttribute("data-title") || "Заказать обратный звонок",
        btn.getAttribute("data-sub") || "Перезвоним в течение 15 минут в рабочее время (9:00–18:00, Пн–Сб).",
        btn.getAttribute("data-topic") || btn.getAttribute("data-title") || "Обратный звонок"
      );
    });
  });
  if (backdrop) {
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop || e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 4200);
  }

  /* ---------- валидация форм ---------- */
  var phoneRe = /^[+\d][\d\s()\-]{8,18}$/;
  function validateField(field) {
    var wrap = field.closest(".field");
    var val = (field.value || "").trim();
    var ok = true;
    if (field.hasAttribute("required") && !val) ok = false;
    if (ok && field.type === "tel" && val && !phoneRe.test(val)) ok = false;
    if (ok && field.type === "email" && val && !/^\S+@\S+\.\S+$/.test(val)) ok = false;
    if (wrap) wrap.classList.toggle("field--error", !ok);
    return ok;
  }
  $$("form[data-validate]").forEach(function (form) {
    $$("input,select,textarea", form).forEach(function (f) {
      f.addEventListener("input", function () { validateField(f); });
      f.addEventListener("blur", function () { validateField(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = $$("input,select,textarea", form);
      var allOk = fields.map(validateField).every(Boolean);
      // согласие
      var agree = $('input[name="agree"]', form);
      if (agree && !agree.checked) {
        allOk = false;
        toast("Подтвердите согласие на обработку данных.");
        agree.focus();
        return;
      }
      if (!allOk) {
        toast("Проверьте выделенные поля — что-то заполнено неверно.");
        var bad = $(".field--error input, .field--error textarea", form);
        if (bad) bad.focus();
        return;
      }
      var btn = $('button[type="submit"]', form);
      var orig = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Отправляем…"; }
      setTimeout(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
        form.reset();
        closeModal();
        toast("Заявка отправлена! Перезвоним в течение 15 минут в рабочее время.");
      }, 700);
    });
  });

  /* ---------- калькулятор на главной ---------- */
  var calcType = $("#calcType");
  var calcArea = $("#calcArea");
  var calcOut = $("#calcOut");
  var calcNote = $("#calcNote");
  var PRICES = { profile: 70, frameless: 120, sliding: 140, skin: 70, shower: 180, loft: 95 };
  function calc() {
    if (!calcType || !calcArea || !calcOut) return;
    var key = calcType.value;
    var area = parseFloat(String(calcArea.value).replace(",", ".")) || 0;
    if (area <= 0) { calcOut.textContent = "—"; if (calcNote) calcNote.textContent = "Введите площадь, чтобы увидеть ориентировочную стоимость."; return; }
    var perUnit = key === "frameless";
    var rate = PRICES[key] || 70;
    var total = perUnit ? rate : rate * area;
    var fmt = new Intl.NumberFormat("ru-RU").format(Math.round(total));
    calcOut.textContent = "$" + fmt;
    if (calcNote) {
      calcNote.textContent = perUnit
        ? "Цельностеклянная перегородка — от $120/шт. Точную цену назовёт замерщик после выезда."
        : "Тариф ~$" + rate + "/м². Выезд замерщика в Бишкеке — бесплатно.";
    }
  }
  if (calcType && calcArea) {
    calcType.addEventListener("change", calc);
    calcArea.addEventListener("input", calc);
    calc();
  }

  /* ---------- фильтр каталога ---------- */
  var chips = $$("[data-filter]");
  var cards = $$("[data-cat]");
  if (chips.length && cards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-on"); });
        chip.classList.add("is-on");
        var f = chip.getAttribute("data-filter");
        cards.forEach(function (card) {
          var show = f === "all" || (card.getAttribute("data-cat") || "").split(" ").indexOf(f) !== -1;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- год в футере ---------- */
  var y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
