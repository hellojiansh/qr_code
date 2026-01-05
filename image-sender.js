/**
 * Image Sender - simple script to scan the page for inline base64 PNG images
 * like the example you provided (e.g. &lt;img id="aliyunCaptcha-img" ...&gt;).
 *
 * HOW IT WORKS
 * ------------
 * - Waits for DOMContentLoaded.
 * - Finds all &lt;img&gt; tags whose src starts with "data:image/png;base64,".
 * - Additionally looks for a very specific example:
 *     &lt;img id="aliyunCaptcha-img" class="puzzle" ...&gt;
 * - Logs all matches to the console and highlights them with a red outline.
 *
 * HOW TO USE
 * ----------
 * 1. Include this script in the page (as a content script in a browser
 *    extension, or via a &lt;script src="image-sender.js"&gt; tag).
 * 2. Open the browser console to see the list of matched images.
 */

(function () {
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

    // Highlight and log the images we found
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