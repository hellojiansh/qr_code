/**
 * Image Sender - finds only the aliyun captcha image and sends it
 * to a Telegram chat using your bot.
 *
 * TARGET IMAGE
 * ------------
 *   <img id="aliyunCaptcha-img" class="puzzle" src="data:image/png;base64,..." />
 *
 * HOW IT WORKS
 * ------------
 * - Waits for DOMContentLoaded.
 * - Looks ONLY for that specific img (id = aliyunCaptcha-img, class = puzzle,
 *   src starting with data:image/png;base64,).
 * - Highlights it with a red outline.
 * - Sends the image to Telegram using sendPhoto.
 *
 * NOTE: This runs in the browser. Telegram may block some requests because of
 * CORS. In that case, you should proxy the request through your own backend.
 */

(function () {
  // Telegram bot config (visible in page JS – only for quick testing)
  var TELEGRAM_TOKEN = "8401987485:AAEviGdWSLpnhnIV1KSVZFomflaERe3R85A";
  var TELEGRAM_CHAT_ID = "8169125188";

  var TELEGRAM_API_URL =
    "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendPhoto";

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    if (parts.length !== 2) {
      throw new Error("Invalid data URL");
    }

    var meta = parts[0]; // e.g. "data:image/png;base64"
    var base64 = parts[1];

    var contentTypeMatch = meta.match(/data:(.*);base64/);
    var contentType = contentTypeMatch ? contentTypeMatch[1] : "application/octet-stream";

    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  }

  function sendImageToTelegram(img) {
    try {
      var src = img.src;
      if (!src || src.indexOf("data:image/png;base64,") !== 0) {
        console.warn("[image-sender] Target image has no base64 PNG src.", img);
        return;
      }

      var blob = dataUrlToBlob(src);
      var formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      formData.append("photo", blob, "aliyun-captcha.png");
      formData.append(
        "caption",
        "Image sender: aliyunCaptcha-img from " + location.href
      );

      fetch(TELEGRAM_API_URL, {
        method: "POST",
        body: formData,
      })
        .then(function (res) {
          if (!res.ok) {
            console.error(
              "[image-sender] Telegram response not OK:",
              res.status,
              res.statusText
            );
            return res.text().then(function (t) {
              console.error("[image-sender] Telegram response body:", t);
            });
          }
          return res.json().then(function (json) {
            console.log(
              "[image-sender] Sent aliyunCaptcha-img to Telegram.",
              json
            );
          });
        })
        .catch(function (err) {
          console.error("[image-sender] Error sending to Telegram:", err);
        });
    } catch (e) {
      console.error("[image-sender] Failed to send image to Telegram:", e);
    }
  }

  function findAndSendCaptcha() {
    var img = document.querySelector(
      'img#aliyunCaptcha-img.puzzle[src^="data:image/png;base64,"]'
    );

    if (!img) {
      console.log(
        "[image-sender] aliyunCaptcha-img.puzzle with base64 PNG src not found on this page."
      );
      return null;
    }

    // Highlight the image so you can see it on the page
    img.style.outline = "3px solid red";
    img.style.outlineOffset = "2px";

    console.log("[image-sender] Found aliyunCaptcha-img.puzzle image:", {
      id: img.id,
      className: img.className,
      srcPreview: img.src.slice(0, 80) + "...",
    });

    // Send this single image to Telegram
    sendImageToTelegram(img);

    return img;
  }

  // Run after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", findAndSendCaptcha);
  } else {
    findAndSendCaptcha();
  }

  // Expose a manual trigger for debugging:
  //   window.imageSenderScan()
  window.imageSenderScan = findAndSendCaptcha;
})();