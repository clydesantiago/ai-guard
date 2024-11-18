const titleTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
let summarizer;

const insertAfter = (newElement, referenceElement) => {
  // Check if the reference element has a next sibling
  if (referenceElement.nextSibling) {
    // If it does, insert the new element before the next sibling
    referenceElement.parentNode.insertBefore(
      newElement,
      referenceElement.nextSibling
    );
  } else {
    // If not, append the new element at the end of the parent element's children
    referenceElement.parentNode.appendChild(newElement);
  }
};

const summarizeContent = async () => {
  const summarizeButton = document.querySelector("#summarize-button");
  const minContentLength = 1000;
  const maxParentDepth = 5;

  let mainContentElement = null;
  let content = "";
  let currentDepth = 0;

  while (currentDepth < maxParentDepth) {
    const currentContentElement = summarizeButton.parentElement;

    if (currentContentElement.innerText.length > minContentLength) {
      content = currentContentElement.innerText;
      mainContentElement = currentContentElement;
      break;
    }

    currentDepth += 1;
  }

  // By default we're using "All content" strategy. (Summarize the whole content)
  // Due to the API limitations, we can't summarize content that is longer than 3000 characters so we get the title tags instead.
  // NOTE: Alternatively, we can use API to summarize the content.
  if (content.length >= 3000) {
    content = "";

    titleTags.forEach((tag) => {
      const titleElements = mainContentElement.querySelectorAll(tag);

      titleElements.forEach((titleElement) => {
        content += `${titleElement.innerText}\n`;
      });
    });
  }

  console.log("content", content);
  const result = await summarizer.summarize(content);

  // Create a new div element to display the summarized content
  const summarizedContent = document.createElement("div");
  summarizedContent.classList.add("summarize-content");
  summarizedContent.innerHTML = `
    <span class="summarized-title">Summarized</span>
    <p>${result}</p>
  `;

  insertAfter(summarizedContent, summarizeButton);
  summarizeButton.style.display = "none";
};

const addSummarizeButton = () => {
  let titleElement = null;

  titleTags.forEach((tag) => {
    if (!titleElement) {
      const tempTitleElement = document.querySelector(tag);

      // Check if visible on the page
      if (
        tempTitleElement &&
        tempTitleElement.style.display !== "none" &&
        tempTitleElement.offsetHeight
      ) {
        titleElement = tempTitleElement;
      }
    }
  });

  const button = document.createElement("button");

  button.id = "summarize-button";
  button.textContent = "Summarize";
  button.classList.add("summarize-button");

  // Optional: Add an icon to the button
  const icon = document.createElement("span");
  icon.innerHTML = "✨"; // Using a lightbulb emoji as a placeholder icon
  icon.classList.add("icon");
  button.prepend(icon);

  // Add a click event to the button
  button.addEventListener("click", () => {
    button.disabled = true;
    summarizeContent();
  });

  // Insert the button after the <h1> tag
  insertAfter(button, titleElement);
};

const canSummarizePage = () => {
  const allowedPaths = [
    "/blog/*",
    "/blogs/*",
    "/news/*",
    "/articles/*",
    "/posts/*",
    "/tutorials/*",
  ];

  return allowedPaths.some((path) => {
    const pathRegex = new RegExp(`^${path.replace("*", ".*")}$`);
    return pathRegex.test(window.location.pathname);
  });
};

const initialize = async () => {
  if (!canSummarizePage()) {
    return;
  }

  const settings = {
    type: "tl;dr",
    length: "long",
    format: "plain-text",
  };

  const canSummarize = await ai.summarizer.capabilities();

  if (canSummarize && canSummarize.available !== "no") {
    if (canSummarize.available === "readily") {
      // The summarizer can immediately be used.
      summarizer = await ai.summarizer.create(settings);
    } else {
      // The summarizer can be used after the model download.
      summarizer = await ai.summarizer.create(settings);
      summarizer.addEventListener("downloadprogress", (e) => {
        console.log(e.loaded, e.total);
      });

      await summarizer.ready;
    }

    addSummarizeButton();
  }
};

window.addEventListener("load", initialize);
