/**
 * Image Sender - finds the Aliyun captcha images and sends them
 * as actual photos to a Telegram chat using your bot.
 *
 * TARGET IMAGES
 * -------------
 * 1) Captcha foreground (piece):
 *    <img id="aliyunCaptcha-img" class="puzzle"
 *         src="data:image/png;base64,..." />
 *
 * 2) Background image:
 *    <img src=".../back.png">
 *
 * HOW IT WORKS
 * ------------
 * - Waits for DOMContentLoaded.
 * - Finds:
 *     a) the foreground captcha image (id = aliyunCaptcha-img, class = puzzle,
 *        src starts with data:image/png;base64,)
 *     b) the first <img> whose src contains "back.png"
 * - Highlights them with a red outline.
 * - For data: URLs, converts base64 -> binary PNG and sends as a file.
 * - For normal URLs (back.png), sends the URL directly as photo to Telegram.
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

  /**
   * Sends an <img> element to Telegram as a photo.
   * - If src is a data:image/png;base64,... URL, it is converted to a Blob.
   * - Otherwise, the src URL is passed directly to Telegram.
   */
  function sendImageToTelegram(img, label) {
    try {
      var src = img.src;
      if (!src) {
        console.warn("[image-sender] Target image has no src.", img);
        return;
      }

      var formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);

      if (src.indexOf("data:image/png;base64,") === 0) {
        // data URL -> blob file
        var blob = dataUrlToBlob(src);
        formData.append("photo", blob, (label || "image") + ".png");
      } else {
        // normal image URL, let Telegram download it
        formData.append("photo", src);
      }

      formData.append(
        "caption",
        "Image sender (" +
          (label || "image") +
          ") from " +
          location.href
      );

      fetch(TELEGRAM_API_URL, {
        method: "POST",
        body: formData
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
              "[image-sender] Sent " + (label || "image") + " to Telegram.",
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

  function highlightImage(img) {
    img.style.outline = "3px solid red";
    img.style.outlineOffset = "2px";
  }

  function findAndSendImages() {
    // 1) Foreground captcha piece (base64)
    var captchaImg = document.querySelector(
      'img#aliyunCaptcha-img.puzzle[src^="data:image/png;base64,"]'
    );

    if (captchaImg) {
      highlightImage(captchaImg);
      console.log("[image-sender] Found captcha piece (aliyunCaptcha-img.puzzle):", {
        id: captchaImg.id,
        className: captchaImg.className,
        srcPreview: captchaImg.src.slice(0, 80) + "..."
      });
      sendImageToTelegram(captchaImg, "captcha-piece");
    } else {
      console.log(
        "[image-sender] aliyunCaptcha-img.puzzle with base64 PNG src not found on this page."
      );
    }

    // 2) Background image: src contains "back.png"
    var backImg = document.querySelector('img[src*="back.png"]');

    if (backImg) {
      highlightImage(backImg);
      console.log("[image-sender] Found back.png image:", {
        id: backImg.id || null,
        className: backImg.className || null,
        src: backImg.src
      });
      sendImageToTelegram(backImg, "back");
    } else {
      console.log(
        "[image-sender] No <img> with src containing 'back.png' found on this page."
      );
    }
  }

  // Run after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", findAndSendImages);
  } else {
    findAndSendImages();
  }

  // Expose a manual trigger for debugging:
  //   window.imageSenderScan()
  window.imageSenderScan = findAndSendImages;
})();