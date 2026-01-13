/**
 * Image Sender - on proxy.owlproxy.com:
 *  1) Waits for the "Get Code" button to appear.
 *  2) Clicks it automatically.
 *  3) Waits for the Aliyun captcha image:
 *       <img id="aliyunCaptcha-img" class="puzzle" src="...back.png" />
 *  4) Downloads that image to your PC and sends it to your Telegram chat.
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

  function triggerDownload(img, filename) {
    try {
      var src = img.src;
      if (!src) {
        console.warn("[image-sender] Cannot download image without src.", img);
        return;
      }

      var a = document.createElement("a");
      a.href = src;
      a.download = filename || "aliyun-captcha.png";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log("[image-sender] Triggered download for", a.href);
    } catch (e) {
      console.error("[image-sender] Failed to trigger download:", e);
    }
  }

  /**
   * Wait for an element matching selector to appear in the DOM,
   * then resolve with that element (or null after timeout).
   */
  function waitForElement(selector, timeoutMs) {
    timeoutMs = typeof timeoutMs === "number" ? timeoutMs : 10000;

    return new Promise(function (resolve) {
      var element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      var observer = new MutationObserver(function () {
        var el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(function () {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }

  /**
   * Main flow:
   *  - Wait for "Get Code" button (<span class="pointer">Get Code</span>)
   *  - Click it
   *  - Wait for <img id="aliyunCaptcha-img" class="puzzle" ...back.png>
   *  - Download & send to Telegram
   */
  async function runFlow() {
    try {
      // 1) Wait for the "Get Code" span
      var getCodeSpan = await waitForElement('span.pointer', 15000);
      if (!getCodeSpan) {
        console.log('[image-sender] "Get Code" span.pointer not found.');
        return;
      }

      if (getCodeSpan.textContent && getCodeSpan.textContent.trim() === "Get Code") {
        console.log('[image-sender] Found "Get Code" span, clicking...');
        getCodeSpan.click();
      } else {
        console.log(
          '[image-sender] span.pointer found but text is not "Get Code":',
          getCodeSpan.textContent
        );
      }

      // 2) Wait for the captcha image to appear
      var selector =
        'img#aliyunCaptcha-img.puzzle[src*="back.png"], ' +
        'img#aliyunCaptcha-img.puzzle[src^="data:image/png;base64,"]';

      var img = await waitForElement(selector, 15000);
      if (!img) {
        console.log(
          '[image-sender] Target <img id="aliyunCaptcha-img" class="puzzle" ...> not found after clicking "Get Code".'
        );
        return;
      }

      highlightImage(img);

      console.log("[image-sender] Found target captcha image:", {
        id: img.id,
        className: img.className,
        srcPreview: img.src.slice(0, 120) + (img.src.length > 120 ? "..." : "")
      });

      // 3) Download to your PC
      triggerDownload(img, "aliyun-captcha-back.png");

      // 4) Send the image to Telegram
      sendImageToTelegram(img, "aliyun-captcha");
    } catch (e) {
      console.error("[image-sender] Error in runFlow:", e);
    }
  }

  // Run after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlow);
  } else {
    runFlow();
  }

  // Expose a manual trigger for debugging:
  //   window.imageSenderScan()
  window.imageSenderScan = runFlow;
})();