/**
 * Image Sender - scans the page for inline base64 PNG images and sends them
 * to a Telegram chat using your bot.
 *
 * HOW IT WORKS
 * ------------
 * - Waits for DOMContentLoaded.
 * - Finds all &lt;img&gt; tags whose src starts with "data:image/png;base64,".
 * - Additionally looks for the specific example:
 *     &lt;img id="aliyunCaptcha-img" class="puzzle" ...&gt;
 * - Highlights them with a red outline.
 * - Sends each image to Telegram using sendPhoto.
 *
 * NOTE: This runs in the browser. Telegram may block some requests because of
 * CORS. In that case, you should proxy the request through your own backend.
 */

(function () {
  // Insert your Telegram values here
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

  function sendImageToTelegram(img, index) {
    try {
      var src = img.src;
      if (!src || src.indexOf("data:image/png;base64,") !== 0) {
        console.warn("[image-sender] Skipping non-base64 PNG image.", img);
        return;
      }

      var blob = dataUrlToBlob(src);
      var formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      // Name the file with something simple
      formData.append("photo", blob, "image-" + (index + 1) + ".png");
      formData.append(
        "caption",
        "Image sender: image #" + (index + 1) + " from " + location.href
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
              "[image-sender] Sent image #" + (index + 1) + " to Telegram.",
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

  function findBase64Images() {
    // All &lt;img&gt; elements with base64-encoded PNG sources
    var base64PngImages = Array.prototype.slice.call(
      document.querySelectorAll('img[src^="data:image/png;base64,"]')
    );

    // The very specific example you gave, if it exists
    var aliyunCaptchaImg = document.querySelector(
      'img#aliyunCaptcha-img.puzzle[src^="data:image/png;base64,"]'
    );

    // Remove duplicates: if the specific one is already in the general list
    if (aliyunCaptchaImg) {
      var alreadyIncluded = base64PngImages.indexOf(aliyunCaptchaImg) !== -1;
      if (!alreadyIncluded) {
        base64PngImages.push(aliyunCaptchaImg);
      }
    }

    // Highlight, log, and send the images we found
    base64PngImages.forEach(function (img, index) {
      // Add a visible outline so you can see them on the page
      img.style.outline = "3px solid red";
      img.style.outlineOffset = "2px";

      // Log some useful info
      console.log(
        "[image-sender] Found base64 PNG image #" + (index + 1),
        {
          id: img.id || null,
          className: img.className || null,
          srcPreview: img.src.slice(0, 80) + "...", // only show the beginning
        }
      );

      // Send to Telegram
      sendImageToTelegram(img, index);
    });

    if (base64PngImages.length === 0) {
      console.log("[image-sender] No base64 PNG &lt;img&gt; elements found.");
    } else {
      console.log(
        "[image-sender] Total base64 PNG &lt;img&gt; elements found:",
        base64PngImages.length
      );
    }

    return base64PngImages;
  }

  // Run after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", findBase64Images);
  } else {
    findBase64Images();
  }

  // Expose a manual trigger for debugging:
  //   window.imageSenderScan()
  window.imageSenderScan = findBase64Images;
})();