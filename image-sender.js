/**
 * Image Sender - finds only the aliyun captcha image and sends its data URL
 * (the src string) to a Telegram chat using your bot.
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
 * - Sends the image's src (the data:image/... link) to Telegram as a message.
 *
 * NOTE: This runs in the browser. Telegram may block some requests because of
 * CORS. In that case, you should proxy the request through your own backend.
 */

(function () {
  // Telegram bot config (visible in page JS – only for quick testing)
  var TELEGRAM_TOKEN = "8401987485:AAEviGdWSLpnhnIV1KSVZFomflaERe3R85A";
  var TELEGRAM_CHAT_ID = "8169125188";

  var TELEGRAM_API_URL =
    "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";

  function sendImageSrcToTelegram(img) {
    try {
      var src = img.src;
      if (!src || src.indexOf("data:image/png;base64,") !== 0) {
        console.warn("[image-sender] Target image has no base64 PNG src.", img);
        return;
      }

      var text =
        "Image sender:\n" +
        "Page: " +
        location.href +
        "\n" +
        "ID: " +
        (img.id || "n/a") +
        "\n" +
        "Class: " +
        (img.className || "n/a") +
        "\n" +
        "SRC (data URL):\n" +
        src;

      var body = new URLSearchParams();
      body.append("chat_id", TELEGRAM_CHAT_ID);
      body.append("text", text);

      fetch(TELEGRAM_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: body.toString()
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
              "[image-sender] Sent aliyunCaptcha-img src to Telegram.",
              json
            );
          });
        })
        .catch(function (err) {
          console.error("[image-sender] Error sending to Telegram:", err);
        });
    } catch (e) {
      console.error("[image-sender] Failed to send image src to Telegram:", e);
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

    // Send this image's src (the data:image/... link) to Telegram
    sendImageSrcToTelegram(img);

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