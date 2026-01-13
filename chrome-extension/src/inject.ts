import { htmlToFigma } from "../../lib/html-to-figma";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const autoScroll = async () => {
  const currentScrollY = window.scrollY;
  const totalHeight = document.body.scrollHeight;
  const viewportHeight = window.innerHeight;

  // Show notification
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.top = "10px";
  notification.style.right = "10px";
  notification.style.padding = "10px 20px";
  notification.style.backgroundColor = "#333";
  notification.style.color = "#fff";
  notification.style.borderRadius = "5px";
  notification.style.zIndex = "999999";
  notification.style.fontFamily = "sans-serif";
  notification.innerText = "Scrolling to caption lazy-loaded content...";
  document.body.appendChild(notification);

  // Scroll down in steps
  for (let i = 0; i <= totalHeight; i += viewportHeight) {
    window.scrollTo(0, i);
    await sleep(200); // Wait for network/render
  }

  // Scroll back to top
  window.scrollTo(0, 0);
  await sleep(1000); // Wait for sticky headers to reset

  notification.innerText = "Capturing page...";
  await sleep(100);

  try {
    const layers = htmlToFigma(
      "body",
      location.hash.includes("useFrames=true")
    );
    var json = JSON.stringify({ layers });
    var blob = new Blob([json], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "page.figma.json");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  } finally {
    document.body.removeChild(notification);
  }
};

autoScroll();
