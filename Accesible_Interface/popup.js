document.getElementById('checkCompliance').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Inject CSS
    chrome.scripting.insertCSS({
      target: { tabId: tabs[0].id },
      files: ["style.css"]
    }, () => {
      // Execute script after CSS is injected
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: checkCompliance
      });
    });
  });
});


function checkCompliance() {
  const issues = [];

  // Helper function to show tooltip
  function showTooltip(element, messages) {
    const tooltip = document.createElement('div');
    tooltip.className = 'compliance-tooltip';

    const ul = document.createElement('ul');
    messages.forEach(message => {
      const li = document.createElement('li');
      li.textContent = message;
      ul.appendChild(li);
    });

    tooltip.appendChild(ul);
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position the tooltip
    let top = rect.top + window.scrollY - tooltipRect.height - 10;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

    // If there's not enough space above, show below the element
    if (top < 0) {
      top = rect.top + window.scrollY + rect.height + 10;
      tooltip.setAttribute('data-position', 'bottom');
    } else {
      tooltip.setAttribute('data-position', 'top');
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    element._tooltip = tooltip;
  }

  // Function to hide tooltip
  function hideTooltip(element) {
    if (element._tooltip) {
      document.body.removeChild(element._tooltip);
      delete element._tooltip;
    }
  }

  // Function to add an issue
  function addIssue(element, message) {
    let issue = issues.find(issue => issue.element === element);
    if (!issue) {
      issue = { element, messages: [] };
      issues.push(issue);
      element.style.border = '2px solid red';
      element.addEventListener('mouseenter', () => showTooltip(element, issue.messages));
      element.addEventListener('mouseleave', () => hideTooltip(element));
    }
    issue.messages.push(message);

    console.log(message, element); // Debugging line
  }

  // Guideline 1.1.1: Non-text Content
  function checkNonTextContent() {
    // Check images
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt) {
        addIssue(img, 'Image without alt text detected. (Guideline 1.1.1, WCAG Version: 2.0, Level: A)');
      } else if (img.alt.trim() === '') {
        addIssue(img, 'Decorative image should have empty alt text. (Guideline 1.1.1, WCAG Version: 2.0, Level: A)');
      } else {
        console.log('Image with alt text found:', img.alt); // Debugging line
      }
    });

    // Check image buttons
    document.querySelectorAll('input[type="image"]').forEach(imgButton => {
      if (!imgButton.alt) {
        addIssue(imgButton, 'Image button without alt text detected. (Guideline 1.1.1, WCAG Version: 2.0, Level: A)');
      } else {
        console.log('Image button with alt text found:', imgButton.alt); // Debugging line
      }
    });

    // Check image map areas
    document.querySelectorAll('area').forEach(area => {
      if (!area.alt) {
        addIssue(area, 'Image map area without alt text detected. (Guideline 1.1.1, WCAG Version: 2.0, Level: A)');
      } else {
        console.log('Image map area with alt text found:', area.alt); // Debugging line
      }
    });

    // Check CSS background images
    document.querySelectorAll('*').forEach(element => {
      const backgroundImage = getComputedStyle(element).backgroundImage;
      if (backgroundImage && backgroundImage !== 'none' && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.getAttribute('role')) {
        addIssue(element, 'CSS background image used without appropriate accessible text. (Guideline 1.1.1, WCAG Version: 2.0, Level: A)');
      } else if (backgroundImage && backgroundImage !== 'none') {
        console.log('Element with background image and accessible text found:', backgroundImage, element); // Debugging line
      }
    });
  }

   // Check audio elements for transcripts (Guideline 1.2.1, WCAG Version: 2.0, Level: A)
function checkAudioTranscripts() {
  document.querySelectorAll('audio').forEach(audio => {
    const transcriptId = audio.getAttribute('data-transcript-for');
    const transcript = document.getElementById(transcriptId);

    if (!transcript) {
      addIssue(audio, 'Audio element without transcript detected. (Guideline 1.2.1, WCAG Version: 2.0, Level: A)');
    } else {
      const transcriptText = transcript.innerText.trim();
      if (transcriptText.length === 0) {
        addIssue(audio, 'Transcript is empty. (Guideline 1.2.1, WCAG Version: 2.0, Level: A)');
      } else if (transcriptText.split(' ').length < 10) {
        addIssue(audio, 'Transcript is too short to be meaningful. (Guideline 1.2.1, WCAG Version: 2.0, Level: A)');
      } else {
        console.log('Audio element with valid transcript found:', audio, transcript); // Debugging line
      }
    }
  });
}

  // Check video elements for transcripts and captions (Guideline 1.2.2, WCAG Version: 2.0, Level: A)
function checkVideoTranscriptsAndCaptions() {
  document.querySelectorAll('video').forEach(video => {
    const transcriptId = video.getAttribute('data-transcript-for');
    const transcript = transcriptId ? document.getElementById(transcriptId) : null;
    
    if (!transcript) {
      addIssue(video, 'Video element without transcript detected. (Guideline 1.2.2, WCAG Version: 2.0, Level: A)');
    }

    const hasCaptions = Array.from(video.querySelectorAll('track')).some(track => track.kind === 'captions');
    if (!hasCaptions) {
      addIssue(video, 'Video element without captions detected. (Guideline 1.2.2, WCAG Version: 2.0, Level: A)');
    }
  });
}


  // Check for audio description or media alternative (Guideline 1.2.3, WCAG Version: 2.0, Level: A)
  function checkAudioDescriptionOrMediaAlternative() {
    document.querySelectorAll('video').forEach(video => {
      const hasAudioDescription = video.querySelector('track[kind="descriptions"]');
      const hasTranscript = document.querySelector(`[data-transcript-for="${video.id}"]`);
      if (!hasAudioDescription && !hasTranscript) {
        addIssue(video, 'Video element without descriptive transcript or audio description detected. (Guideline 1.2.3, WCAG Version: 2.0, Level: A)');
      }
    });
  }

  // Check for captions in live audio or video elements (Guideline 1.2.4, WCAG Version: 2.0, Level: AA)
  function checkLiveMediaCaptions() {
    document.querySelectorAll('audio[data-live], video[data-live]').forEach(media => {
      const tracks = media.querySelectorAll('track');
      let hasCaptions = false;

      tracks.forEach(track => {
        if (track.kind === 'captions') {
          hasCaptions = true;
        }
      });

      if (!hasCaptions) {
        addIssue(media, 'Live media element without captions detected. (Guideline 1.2.4, WCAG Version: 2.0, Level: AA)');
      }
    });
  }

  // Check for audio description or media alternative (Guideline 1.2.5, WCAG Version: 2.0, Level: AA)
  function checkAudioDescriptionOrMediaAlternative_1_2_5() {
    document.querySelectorAll('video').forEach(video => {
      const tracks = video.querySelectorAll('track');
      let hasAudioDescription = false;

      tracks.forEach(track => {
        if (track.kind === 'descriptions') {
          hasAudioDescription = true;
        }
      });

      if (!hasAudioDescription) {
        addIssue(video, 'Video element without audio description detected. (Guideline 1.2.5, WCAG Version: 2.0, Level: AA)');
      }
    });
  }

  // Check for sign language interpretation (Guideline 1.2.6, WCAG Version: 2.0, Level: AAA)
function checkSignLanguage() {
  document.querySelectorAll('video').forEach(video => {
    const tracks = video.querySelectorAll('track');
    let hasSignLanguage = false;

    tracks.forEach(track => {
      if (track.kind === 'sign') {
        hasSignLanguage = true;
      }
    });

    if (!hasSignLanguage) {
      addIssue(video, 'Video element without sign language interpretation detected. (Guideline 1.2.6, WCAG Version: 2.0, Level: AAA)');
    }
  });
}

// Check for extended audio description (Guideline 1.2.7, WCAG Version: 2.0, Level: AAA)
function checkExtendedAudioDescription() {
  document.querySelectorAll('video').forEach(video => {
    const tracks = video.querySelectorAll('track');
    let hasExtendedAudioDescription = false;

    tracks.forEach(track => {
      if (track.kind === 'descriptions' && track.label.toLowerCase().includes('extended')) {
        hasExtendedAudioDescription = true;
      }
    });

    if (!hasExtendedAudioDescription) {
      addIssue(video, 'Video element without extended audio description detected. (Guideline 1.2.7, WCAG Version: 2.0, Level: AAA)');
    }
  });
}

// The implementation of (Guideline 1.2.8, WCAG Version: 2.0, Level: A) isn't implemented because it's difficult to implement the guideline as extension.
// The implementation of (Guideline 1.2.9, WCAG Version: 2.0, Level: A) isn't implemented because it's difficult to implement the guideline as extension.



// Check input elements for associated labels (Guideline 1.3.1, WCAG Version: 2.0, Level: A)
function checkInputLabels() {
  document.querySelectorAll('input, select, textarea').forEach(input => {
    const id = input.id;
    const label = document.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    if (!label && !input.closest('label') && !ariaLabel && !ariaLabelledBy) {
      addIssue(input, 'Input without associated label detected. (Guideline 1.3.1, WCAG Version: 2.0, Level: A)');
    }
  });
}

// Check for meaningful sequence (Guideline 1.3.2, WCAG Version: 2.0, Level: A)
function checkMeaningfulSequence() {
  const orderedElements = Array.from(document.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, table, div, span, a, img, input, button, select, textarea, iframe'));
  for (let i = 0; i < orderedElements.length - 1; i++) {
    const current = orderedElements[i];
    const next = orderedElements[i + 1];
    if (current.tagName === 'P' && next.tagName.startsWith('H')) {
      addIssue(current, 'Potential issue with reading/navigation order detected. (Guideline 1.3.2, WCAG Version: 2.0, Level: A)');
    }
  }
}

// Check for sensory characteristics (Guideline 1.3.3, WCAG Version: 2.0, Level: A)
function checkSensoryCharacteristics() {
  const sensoryPhrases = ['Click the square icon', 'in the right-hand column', 'A beeping sound indicates', 'Click the red button'];
  sensoryPhrases.forEach(phrase => {
    const elements = Array.from(document.body.querySelectorAll('*')).filter(element => element.textContent.includes(phrase));
    elements.forEach(element => {
      addIssue(element, `Instruction relies on sensory characteristics: "${phrase}". (Guideline 1.3.3, WCAG Version: 2.0, Level: A)`);
    });
  });
}

// The implementation of (Guideline 1.3.4, WCAG Version: 2.0, Level: A) isn't implemented because it's difficult to implement the guideline as extension.


// Check for appropriate autocomplete attributes on input fields (Guideline 1.3.5, WCAG Version: 2.0, Level: AA)
function checkIdentifyInputPurpose() {
  const requiredAutocompleteAttributes = [
    'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 
    'honorific-suffix', 'nickname', 'organization-title', 'username', 'new-password', 
    'current-password', 'organization', 'street-address', 'address-line1', 'address-line2', 
    'address-line3', 'address-level4', 'address-level3', 'address-level2', 'address-level1', 
    'country', 'country-name', 'postal-code', 'cc-name', 'cc-given-name', 'cc-additional-name', 
    'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 
    'cc-type', 'transaction-currency', 'transaction-amount', 'language', 'bday', 'bday-day', 
    'bday-month', 'bday-year', 'sex', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 
    'tel-local', 'tel-local-prefix', 'tel-local-suffix', 'tel-extension', 'impp', 'url', 'photo'
  ];

  document.querySelectorAll('input').forEach(input => {
    const autocomplete = input.getAttribute('autocomplete');
    if (autocomplete && !requiredAutocompleteAttributes.includes(autocomplete)) {
      addIssue(input, `Input field with inappropriate autocomplete attribute detected: "${autocomplete}". (Guideline 1.3.4, WCAG Version: 2.0, Level: AA)`);
    } else if (!autocomplete) {
      addIssue(input, 'Input field without autocomplete attribute detected. (Guideline 1.3.5, WCAG Version: 2.0, Level: AA)');
    }
  });
}

// The implementation of (Guideline 1.3.6, WCAG Version: 2.0, Level: A) isn't implemented because it's difficult to implement the guideline as extension.



// Check for use of color as the sole method of conveying content (Guideline 1.4.1, WCAG Version: 2.0, Level: A)
function checkUseOfColor() {
  document.querySelectorAll('*').forEach(element => {
    const styles = getComputedStyle(element);
    const hasMeaningfulText = element.textContent.trim().length > 0;
    const hasDistinguishingColor = styles.color !== 'rgb(0, 0, 0)' && styles.color !== 'rgb(255, 255, 255)';
    const hasBackgroundColor = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'rgb(255, 255, 255)';
    
    if (hasMeaningfulText && hasDistinguishingColor && !hasBackgroundColor) {
      addIssue(element, 'Color is used as the sole method of conveying content or distinguishing visual elements. (Guideline 1.4.1, WCAG Version: 2.0, Level: A)');
    }
  });
}

// The implementation of (Guideline 1.4.2, WCAG Version: 2.0, Level: A) isn't implemented because legacy multimedia elements lack integrated controls, requiring significant modification to support audio control. 

// The implementation of (Guideline 1.4.3, WCAG Version: 2.0, Level: A) isn't implemented because 

// The implementation of (Guideline 1.4.4.1, WCAG Version: 2.0, Level A) isn't implemented because

// Check for images of text (Guideline 1.4.5, WCAG Version: 2.0, Level: AA)
function checkImagesOfText() {
  document.querySelectorAll('img').forEach(image => {
    const altText = image.alt.trim();
    const isDecorative = image.hasAttribute('data-decorative') || altText === '';
    const isDescriptive = altText && !isDecorative;

    // Check if the image alt text is likely to represent an image of text
    const isTextImage = /[a-zA-Z0-9]/.test(altText) && !isDecorative;

    if (isTextImage && !image.closest('figure')) {
      addIssue(image, 'Image of text detected. If the same visual presentation can be made using text alone, an image is not used to present that text. (Guideline 1.4.5, WCAG Version: 2.0, Level: AA)');
    }
  });
}

// The implementation of (Guideline 1.4.6, WCAG Version: 2.0, Level: A) isn't implemented because current design aesthetic conflicts with enhanced contrast ratios, requiring redesign for compliance.
// The implementation of (Guideline 1.4.7, WCAG Version: 2.0, Level: A) isn't implemented because existing multimedia content lacks the necessary audio separation, requiring re-recording or extensive editing.

// Check for visual presentation compliance (Guideline 1.4.8, WCAG Version: 2.0, Level: AAA) 
function checkVisualPresentation() {
  document.querySelectorAll('p').forEach(element => {
    const styles = getComputedStyle(element);
    const issues = [];

    // Check if text block is wider than 80 characters
    if (element.innerText.length > 80) {
      issues.push('Text block wider than 80 characters detected.');
    }

    // Check if text is fully justified
    if (styles.textAlign === 'justify') {
      issues.push('Text block fully justified detected.');
    }

    // Check for adequate line spacing
    const lineHeight = parseFloat(styles.lineHeight);
    const fontSize = parseFloat(styles.fontSize);
    if (lineHeight < fontSize * 1.5) {
      issues.push('Text block with inadequate line spacing detected.');
    }

    // Check for adequate paragraph spacing
    const marginBottom = parseFloat(styles.marginBottom);
    if (marginBottom < fontSize * 1.5) {
      issues.push('Text block with inadequate paragraph spacing detected.');
    }

    // Check for defined or inherited foreground and background colors
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    if (!color || !backgroundColor) {
      issues.push('Text block without defined foreground or background color detected.');
    }

    // Check for horizontal scrolling when text size is doubled
    const originalWidth = element.clientWidth;
    element.style.fontSize = `${fontSize * 2}px`;
    if (element.scrollWidth > originalWidth) {
      issues.push('Text block requires horizontal scrolling when text size is doubled.');
    }
    element.style.fontSize = ''; // Reset the font size

    if (issues.length > 0) {
      addIssue(element, issues.join(' (Guideline 1.4.8, WCAG Version: 2.0, Level: AAA)\n') + ' (Guideline 1.4.8, WCAG Version: 2.0, Level: AAA)');
    }
  });
}

// The implementation of (Guideline 1.4.9, WCAG Version: 2.0, Level: A) isn't implemented because legacy content relies heavily on images with text, necessitating extensive redesign to replace with plain text.

// Check for reflow compliance (Guideline 1.4.10, WCAG Version: 2.0, Level: AA)
function checkReflow() {
  const container = document.createElement('div');
  container.style.width = '320px';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.overflow = 'hidden';
  container.style.height = 'auto';
  container.style.visibility = 'hidden';
  document.body.appendChild(container);

  document.querySelectorAll('div, p, img, table').forEach(element => {
    const clone = element.cloneNode(true);
    container.appendChild(clone);

    if (clone.scrollWidth > container.clientWidth) {
      addIssue(element, 'Element requires horizontal scrolling when content is presented at a width of 320 pixels. (Guideline 1.4.10, WCAG Version: 2.0, Level: AA)');
    }

    container.removeChild(clone);
  });

  document.body.removeChild(container);
}

// Helper function to calculate contrast ratio
function calculateContrastRatio(foreground, background) {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper function to get luminance of a color
function getLuminance(color) {
  const rgb = color.match(/\d+/g).map(Number);
  const [r, g, b] = rgb.map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Check for non-text contrast (Guideline 1.4.11, WCAG Version: 2.0, Level: AA)
function checkNonTextContrast() {
  document.querySelectorAll('button, input, select, textarea, svg, .icon').forEach(element => {
    const styles = getComputedStyle(element);
    let foregroundColor, backgroundColor;

    if (element.tagName.toLowerCase() === 'svg') {
      foregroundColor = styles.fill;
      backgroundColor = styles.backgroundColor || styles.getPropertyValue('background-color');
    } else {
      foregroundColor = styles.color;
      backgroundColor = styles.backgroundColor;
    }

    if (foregroundColor && backgroundColor) {
      const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
      if (contrastRatio < 3) {
        addIssue(element, 'Element with insufficient non-text contrast detected. (Guideline 1.4.11, WCAG Version: 2.0, Level: AA)');
      }
    }
  });
}

// Check for text spacing compliance (Guideline 1.4.12, WCAG Version: 2.0, Level: AA)
function checkTextSpacing() {
  const elements = document.querySelectorAll('p, div, span, li');

  elements.forEach(element => {
    const styles = getComputedStyle(element);
    const fontSize = parseFloat(styles.fontSize);

    // Store original styles
    const originalLineHeight = styles.lineHeight;
    const originalLetterSpacing = styles.letterSpacing;
    const originalWordSpacing = styles.wordSpacing;
    const originalMarginBottom = styles.marginBottom;

    // Apply test styles
    element.style.lineHeight = `${1.5 * fontSize}px`;
    element.style.letterSpacing = `${0.12 * fontSize}px`;
    element.style.wordSpacing = `${0.16 * fontSize}px`;
    element.style.marginBottom = `${2 * fontSize}px`;

    // Check for overflow or clipping
    if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
      addIssue(element, 'Element does not support text spacing adjustments without loss of content or functionality. (Guideline 1.4.12, WCAG Version: 2.0, Level: AA)');
    }

    // Reset original styles
    element.style.lineHeight = originalLineHeight;
    element.style.letterSpacing = originalLetterSpacing;
    element.style.wordSpacing = originalWordSpacing;
    element.style.marginBottom = originalMarginBottom;
  });
}

// Check for hover or focus content compliance (Guideline 1.4.13, WCAG Version: 2.0, Level: AA)
function checkHoverFocusContent() {
  document.querySelectorAll('[data-hover-content], [data-focus-content]').forEach(trigger => {
    trigger.addEventListener('mouseenter', showContent);
    trigger.addEventListener('focus', showContent);
    trigger.addEventListener('mouseleave', hideContent);
    trigger.addEventListener('blur', hideContent);
  });

  function showContent(event) {
    const trigger = event.target;
    const contentId = trigger.getAttribute('data-hover-content') || trigger.getAttribute('data-focus-content');
    const content = document.getElementById(contentId);
    if (content) {
      content.style.display = 'block';
      content.setAttribute('tabindex', '-1'); // Make content focusable
      content.focus();

      // Allow dismissal with the Escape key
      content.addEventListener('keydown', function onKeydown(event) {
        if (event.key === 'Escape') {
          content.style.display = 'none';
          content.removeEventListener('keydown', onKeydown);
        }
      });

      // Ensure the pointer can be moved to the new content without it disappearing
      content.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      content.addEventListener('mouseleave', hideContent);

      // Highlight the content
      content.style.border = '2px solid red';
      showTooltip(content, ['Hover or focus content detected. (Guideline 1.4.13, WCAG Version: 2.0, Level: AA)']);
    }
  }

  function hideContent(event) {
    const trigger = event.target;
    const contentId = trigger.getAttribute('data-hover-content') || trigger.getAttribute('data-focus-content');
    const content = document.getElementById(contentId);
    if (content) {
      hideTimer = setTimeout(() => {
        content.style.display = 'none';
        content.style.border = '';
        hideTooltip(content);
      }, 100); // Short delay to allow moving pointer to the content
    }
  }

  let hideTimer;
}

// Check for keyboard accessibility (Guideline 2.1.1, WCAG Version: 2.0, Level: A)
function checkKeyboardAccessibility() {
  document.querySelectorAll('*').forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const isFocusable = element.hasAttribute('tabindex') || ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);

    if (isFocusable && element.tabIndex < 0 && !element.hasAttribute('disabled')) {
      addIssue(element, 'Element not accessible using keyboard detected. (Guideline 2.1.1, WCAG Version: 2.0, Level: A)');
    }
  });

  document.querySelectorAll('[accesskey]').forEach(element => {
    addIssue(element, 'Element with accesskey attribute detected. (Guideline 2.1.1, WCAG Version: 2.0, Level: A)');
  });
}

// The implementation of (Guideline 2.1.2, WCAG Version: 2.0, Level: A) isn't implemented because complex interactive elements create unintentional focus traps, requiring significant overhaul of keyboard navigation logic.

// Check for character key shortcuts (Guideline 2.1.3, WCAG Version: 2.0, Level: A)
function checkCharacterKeyShortcuts() {
  const printableKeys = 'abcdefghijklmnopqrstuvwxyz0123456789';

  document.addEventListener('keydown', (event) => {
    if (printableKeys.includes(event.key.toLowerCase()) && !event.ctrlKey && !event.altKey && !event.metaKey) {
      addIssue(document.activeElement, `Character key shortcut detected: "${event.key}". (Guideline 2.1.3, WCAG Version: 2.0, Level: A)`);
    }
  });
}

// Check for timing adjustable options (Guideline 2.2.1, WCAG Version: 2.0, Level: A)
function checkTimingAdjustable() {
  document.querySelectorAll('[data-time-limit]').forEach(element => {
    const hasOptions = element.querySelector('[data-adjust-time], [data-extend-time], [data-turn-off-time]');
    if (!hasOptions) {
      addIssue(element, 'Element with time limit detected without adjustable options. (Guideline 2.2.1, WCAG Version: 2.0, Level: A)');
    }
  });
}

// Check for pause, stop, hide functionality (Guideline 2.2.2, WCAG Version: 2.0, Level: A)
function checkPauseStopHide() {
  document.querySelectorAll('[data-moving-content]').forEach(element => {
    const hasControls = element.querySelector('[data-pause], [data-stop], [data-hide]');
    if (!hasControls) {
      addIssue(element, 'Automatically moving content without pause, stop, or hide controls detected. (Guideline 2.2.2, WCAG Version: 2.0, Level: A)');
    }
  });
}

// Check for no timing constraints (Guideline 2.2.3, WCAG Version: 2.0, Level: AAA)
function checkNoTiming() {
  const elementsWithTimeLimits = document.querySelectorAll('[data-time-limit]');

  elementsWithTimeLimits.forEach(element => {
    const timeLimit = element.getAttribute('data-time-limit');
    if (timeLimit && parseInt(timeLimit, 10) > 0) {
      addIssue(element, `Element with time limit detected: ${timeLimit} seconds. (Guideline 2.2.3, WCAG Version: 2.0, Level: AAA)`);
    }
  });
}

// Check for postponing or suppressing interruptions (Guideline 2.2.4, WCAG Version: 2.0, Level: AAA)
function checkInterruptions() {
  document.querySelectorAll('[data-interruption]').forEach(element => {
    const hasPostpone = element.hasAttribute('data-postpone');
    const hasSuppress = element.hasAttribute('data-suppress');

    // Create UI elements for postponing or suppressing the interruption
    if (!hasPostpone && !hasSuppress) {
      addIssue(element, 'Element with interruptions that cannot be postponed or suppressed detected. (Guideline 2.2.4, WCAG Version: 2.0, Level: AAA)');

      const postponeButton = document.createElement('button');
      postponeButton.innerText = 'Postpone';
      postponeButton.onclick = () => {
        element.style.display = 'none';  // Hide the element to simulate postponing
        setTimeout(() => {
          element.style.display = 'block';  // Show the element again after 10 seconds
        }, 10000);
      };

      const suppressButton = document.createElement('button');
      suppressButton.innerText = 'Suppress';
      suppressButton.onclick = () => {
        element.style.display = 'none';  // Hide the element to simulate suppressing
      };

      const controlsContainer = document.createElement('div');
      controlsContainer.appendChild(postponeButton);
      controlsContainer.appendChild(suppressButton);

      element.appendChild(controlsContainer);
    }
  });
}

// Check for re-authentication without data loss (Guideline 2.2.5, WCAG Version: 2.0, Level: AAA)
function checkReAuthenticating() {
  document.querySelectorAll('[data-authentication]').forEach(element => {
    const hasReAuthenticate = element.hasAttribute('data-re-authenticate');
    const sessionExpires = element.hasAttribute('data-session-expires');

    if (sessionExpires && !hasReAuthenticate) {
      addIssue(element, 'Element with authentication that does not support re-authentication without data loss detected. (Guideline 2.2.5, WCAG Version: 2.0, Level: AAA)');
      
      // Simulate a re-authentication button for demonstration purposes
      const reAuthButton = document.createElement('button');
      reAuthButton.innerText = 'Re-authenticate';
      reAuthButton.onclick = () => {
        alert('Re-authenticated successfully!');
        // Here you can add logic to retain the user's data
      };
      
      element.appendChild(reAuthButton);
    }
  });
}

// Check for flashing content that flashes more than 3 times per second (Guideline 2.3.1, WCAG Version: 2.0, Level: A)
function checkFlashingContent() {
  document.querySelectorAll('[data-flashing]').forEach(element => {
    const flashRate = parseInt(element.getAttribute('data-flash-rate'), 10);
    const isHighContrast = element.hasAttribute('data-high-contrast');
    const isRedFlash = element.hasAttribute('data-red-flash');
    const isSufficientlySmall = element.hasAttribute('data-sufficiently-small');

    if (flashRate > 3 && (!isSufficientlySmall || isHighContrast || isRedFlash)) {
      addIssue(element, 'Element flashing more than 3 times per second detected. (Guideline 2.3.1, WCAG Version: 2.0, Level: A)');
    }
  });
}

// Check for flashing content that flashes more than 3 times per second (Guideline 2.3.2, WCAG Version: 2.0, Level: AAA)
function checkThreeFlashes() {
  document.querySelectorAll('[data-flashing]').forEach(element => {
    const flashRate = parseInt(element.getAttribute('data-flash-rate'), 10);
    if (flashRate > 3) {
      addIssue(element, 'Element flashing more than 3 times per second detected. (Guideline 2.3.2, WCAG Version: 2.0, Level: AAA)');
    }

    // Make the element flash
    let isVisible = true;
    setInterval(() => {
      element.style.visibility = isVisible ? 'hidden' : 'visible';
      isVisible = !isVisible;
    }, 1000 / flashRate); // Flash rate in times per second
  });
}

// Check for a link to bypass blocks of content (Guideline 2.4.1, WCAG Version: 2.0, Level: A)
function checkBypassBlocks() {
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  let validSkipLinkFound = false;

  skipLinks.forEach(link => {
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);

    if (link.classList.contains('skip-link') && targetElement) {
      validSkipLinkFound = true;
    } else if (link.classList.contains('skip-link') && !targetElement) {
      addIssue(link, `Skip link target not found: ${link.getAttribute('href')}. (Guideline 2.4.1, WCAG Version: 2.0, Level: A)`);
    }
  });

  if (!validSkipLinkFound) {
    addIssue(document.body, 'No valid "skip to main content" link found. (Guideline 2.4.1, WCAG Version: 2.0, Level: A)');
  }
}

// The implementation of (Guideline 2.4.2, WCAG Version: 2.0, Level: A) isn't implemented because inconsistent page titling practices across extensive content necessitate a comprehensive audit and update.

// Check for logical and intuitive focus order (Guideline 2.4.3, WCAG Version: 2.0, Level: A)
function checkFocusOrder() {
  const focusableElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
  let issuesFound = false;

  for (let i = 1; i < focusableElements.length; i++) {
    const previousElement = focusableElements[i - 1];
    const currentElement = focusableElements[i];

    // Compare the tabIndex and bounding rectangles to determine visual order vs focus order
    const prevRect = previousElement.getBoundingClientRect();
    const currRect = currentElement.getBoundingClientRect();
    const prevTabIndex = previousElement.tabIndex || 0;
    const currTabIndex = currentElement.tabIndex || 0;

    // Check if the current element appears above or to the left of the previous element in the document flow
    if ((currTabIndex <= prevTabIndex) && (currRect.top < prevRect.bottom || (currRect.top === prevRect.top && currRect.left < prevRect.right))) {
      addIssue(currentElement, 'Incorrect focus order detected. (Guideline 2.4.3, WCAG Version: 2.0, Level: A)');
      issuesFound = true;
    }
  }

  if (!issuesFound) {
    console.log('Focus order is logical and intuitive.');
  }
}

// The implementation of (Guideline 2.4.4, WCAG Version: 2.0, Level: A) isn't implemented because existing content uses vague or generic link texts, requiring extensive revision for contextual clarity.
// The implementation of (Guideline 2.4.5, WCAG Version: 2.0, Level: A) isn't implemented because it is limited by site design constraints and existing navigation structure, requiring significant redesign for compliance.


// Check for headings and labels (Guideline 2.4.6, WCAG Version: 2.0, Level: AA)
function checkHeadingsAndLabels() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const labels = document.querySelectorAll('label');

  // Function to check if text content is informative
  function isInformativeText(element) {
    const text = element.innerText.trim();
    const duplicateHeadings = Array.from(headings).filter(h => h.innerText.trim() === text);
    const duplicateLabels = Array.from(labels).filter(l => l.innerText.trim() === text);
    return text && (duplicateHeadings.length <= 1 && duplicateLabels.length <= 1);
  }

  // Check headings
  headings.forEach(heading => {
    if (!isInformativeText(heading)) {
      addIssue(heading, 'Empty or non-informative heading detected. (Guideline 2.4.6, WCAG Version: 2.0, Level: AA)');
    }
  });

  // Check labels
  labels.forEach(label => {
    const associatedInput = document.getElementById(label.getAttribute('for'));
    if (!isInformativeText(label) || !associatedInput) {
      addIssue(label, 'Empty or non-informative label detected or label without associated input. (Guideline 2.4.6, WCAG Version: 2.0, Level: AA)');
    }
  });
}

// The implementation of (Guideline 2.4.7, WCAG Version: 2.0, Level: A) isn't implemented because Custom UI components lack standardized focus indicators, necessitating extensive redesign and testing.
// The implementation of (Guideline 2.4.8, WCAG Version: 2.0, Level: A) isn't implemented because complex site architecture with dynamic content generation complicates implementation of consistent location indicators.
// The implementation of (Guideline 2.4.9, WCAG Version: 2.0, Level: A) isn't implemented because legacy design uses generic link texts extensively, requiring comprehensive updates to ensure clarity and context.
// The implementation of (Guideline 2.4.10, WCAG Version: 2.0, Level: A) isn't implemented because inconsistent use of headings across legacy content requiring significant manual review and restructuring.


// Check for pointer cancellation (Guideline 2.5.1, WCAG Version: 2.0, Level: A)
function checkPointerGestures() {
  const gestureElements = document.querySelectorAll('[data-gesture]');
  
  gestureElements.forEach(element => {
    const gestureType = element.getAttribute('data-gesture');
    const alternativeMethod = element.getAttribute('data-alternative');

    if (!alternativeMethod) {
      addIssue(element, `Element with ${gestureType} gesture detected without single point activation. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)`);
    } else {
      // Additional checks based on the type of gesture
      switch (gestureType) {
        case 'swipe':
          if (!element.getAttribute('data-swipe-direction')) {
            addIssue(element, 'Swipe gesture detected without specifying direction. Ensure swipe direction is specified. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)');
          }
          break;
        case 'pinch':
          if (!element.getAttribute('data-pinch-zoom')) {
            addIssue(element, 'Pinch gesture detected without specifying zoom level. Ensure zoom level is specified. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)');
          }
          break;
        case 'rotate':
          if (!element.getAttribute('data-rotate-angle')) {
            addIssue(element, 'Rotate gesture detected without specifying angle. Ensure rotation angle is specified. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)');
          }
          break;
        default:
          addIssue(element, `Unrecognized gesture type: ${gestureType}. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)`);
      }

      // Ensure the alternative method is accessible via keyboard
      if (!document.querySelector(`[data-alternative="${alternativeMethod}"]`)) {
        addIssue(element, `Alternative method ${alternativeMethod} for ${gestureType} gesture is not accessible via keyboard. (Guideline 2.5.1, WCAG Version: 2.0, Level: A)`);
      }
    }
  });
}

// Check for pointer cancellation (Guideline 2.5.2, WCAG Version: 2.0, Level: A)
function checkPointerCancellation() {
  const pointerEvents = [
    'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'
  ];

  document.querySelectorAll('[data-pointer-event]').forEach(element => {
    const downEvent = element.getAttribute('data-pointer-event');
    const upEvent = element.getAttribute('data-pointer-up-event');
    const alternativeMethod = element.getAttribute('data-alternative-method');

    if (!upEvent) {
      addIssue(element, 'Element with pointer down-event without corresponding up-event detected. (Guideline 2.5.2, WCAG Version: 2.0, Level: A)');
    } else if (!pointerEvents.includes(downEvent)) {
      addIssue(element, `Element with non-standard pointer down-event detected: "${downEvent}". (Guideline 2.5.2, WCAG Version: 2.0, Level: A)`);
    } else if (downEvent === 'mousedown' && !alternativeMethod) {
      addIssue(element, 'Element with mousedown event should provide an alternative method for activation. (Guideline 2.5.2, WCAG Version: 2.0, Level: A)');
    } else {
      element.addEventListener(downEvent, () => {
        console.log(`Pointer down event detected: ${downEvent}`);
      });
      element.addEventListener(upEvent, () => {
        console.log(`Pointer up event detected: ${upEvent}`);
      });
    }
  });
}

// Check for label in name (Guideline 2.5.3, WCAG Version: 2.0, Level: A)
function checkLabelInName() {
  document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]').forEach(element => {
    const visibleText = element.innerText.trim() || element.value.trim();
    let accessibleName = '';

    if (element.hasAttribute('aria-labelledby')) {
      const ids = element.getAttribute('aria-labelledby').split(' ');
      ids.forEach(id => {
        const labelElement = document.getElementById(id);
        if (labelElement) {
          accessibleName += labelElement.innerText.trim() + ' ';
        }
      });
    } else {
      accessibleName = element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('alt') || '';
    }

    accessibleName = accessibleName.trim();

    if (accessibleName && !accessibleName.includes(visibleText)) {
      addIssue(element, `Accessible name does not include visible text: "${visibleText}". (Guideline 2.5.3, WCAG Version: 2.0, Level: A)`);
    }
  });
}

// Check for motion actuation with alternatives (Guideline 2.5.4, WCAG Version: 2.0, Level: A)
function checkMotionActuation() {
  document.querySelectorAll('[data-motion-actuation]').forEach(element => {
    const hasAlternative = element.getAttribute('data-motion-alternative');
    const actuationType = element.getAttribute('data-motion-actuation');

    if (!hasAlternative) {
      addIssue(element, `Element with motion actuation (${actuationType}) detected without an alternative control. (Guideline 2.5.4, WCAG Version: 2.0, Level: A)`);
    } else {
      // Additional check: Ensure the alternative control is accessible
      const alternativeElement = document.querySelector(`[data-alternative-for="${element.id}"]`);
      if (!alternativeElement) {
        addIssue(element, `Alternative control for motion actuation (${actuationType}) not found or not accessible. (Guideline 2.5.4, WCAG Version: 2.0, Level: A)`);
      }
    }
  });
}

// Check for target size (Guideline 2.5.5, WCAG Version: 2.0, Level: AAA)
function checkTargetSize() {
  document.querySelectorAll('a, button, input[type="button"], input[type="submit"]').forEach(element => {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width < 44 || height < 44) {
      const isInline = window.getComputedStyle(element).display === 'inline';
      const hasAlternative = element.hasAttribute('data-alternative-target');

      if (!isInline && !hasAlternative) {
        addIssue(element, `Clickable target size is smaller than 44x44 pixels. Detected size: ${width}x${height}. (Guideline 2.5.5, WCAG Version: 2.0, Level: AAA)`);
      }
    }
  });
}

// Check for concurrent input mechanisms (Guideline 2.5.6, WCAG Version: 2.0, Level: AAA)
function checkConcurrentInputMechanisms() {
  document.querySelectorAll('[data-input-method]').forEach(element => {
    const inputMethods = element.getAttribute('data-input-method').split(' ');
    const supportedMethods = ['keyboard', 'touch', 'mouse', 'voice'];

    const missingMethods = supportedMethods.filter(method => !inputMethods.includes(method));

    if (missingMethods.length > 0) {
      addIssue(element, `Element does not support the following input methods: ${missingMethods.join(', ')}. (Guideline 2.5.6, WCAG Version: 2.0, Level: AAA)`);
    }
  });
}

// Check for dragging movements (Guideline 2.5.7, WCAG Version: 2.2, Level: AA)
function checkDraggingMovements() {
  document.querySelectorAll('[data-dragging]').forEach(element => {
    const hasAlternative = element.getAttribute('data-dragging-alternative');
    const alternativeMethod = element.getAttribute('data-alternative-method');
    const essential = element.getAttribute('data-essential') === 'true';

    if (!essential && (!hasAlternative || !alternativeMethod)) {
      addIssue(element, 'Element with dragging functionality detected without an alternative control. (Guideline 2.5.7, WCAG Version: 2.2, Level: AA)');
    } else if (essential) {
      console.log('Dragging is essential for this element:', element);
    }

    // Additional check for the presence of keyboard alternatives
    const keyboardAccessible = element.getAttribute('data-keyboard-accessible') === 'true';
    if (!keyboardAccessible) {
      addIssue(element, 'Element with dragging functionality does not support keyboard interaction. (Guideline 2.5.7, WCAG Version: 2.2, Level: AA)');
    }
  });
}

// Check for target size (minimum) (Guideline 2.5.8, WCAG Version: 2.2, Level: AA)
function checkTargetSizeMinimum() {
  document.querySelectorAll('a, button, input[type="button"], input[type="submit"], input[type="reset"]').forEach(element => {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width < 24 || height < 24) {
      // Check if a 24x24 pixel circle intersects with any other target
      let intersects = false;
      document.querySelectorAll('a, button, input[type="button"], input[type="submit"], input[type="reset"]').forEach(otherElement => {
        if (otherElement !== element) {
          const otherRect = otherElement.getBoundingClientRect();
          const dx = (rect.left + rect.right) / 2 - (otherRect.left + otherRect.right) / 2;
          const dy = (rect.top + rect.bottom) / 2 - (otherRect.top + otherRect.bottom) / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 24) {
            intersects = true;
          }
        }
      });

      if (intersects) {
        addIssue(element, 'Target size is smaller than 24x24 pixels and intersects with another target. (Guideline 2.5.8, WCAG Version: 2.2, Level: AA)');
      } else {
        addIssue(element, 'Target size is smaller than 24x24 pixels but does not intersect with any other target. (Guideline 2.5.8, WCAG Version: 2.2, Level: AA)');
      }
    }
  });
}

// The implementation of (Guideline 3.1.1, WCAG Version: 2.0, Level: A) isn't implemented because existing codebase lacks consistent internationalization, requiring extensive rework to integrate language attributes.


// Check for language of parts (Guideline 3.1.2, WCAG Version: 2.0, Level: AA)
function checkLanguageOfParts() {
  const elements = document.querySelectorAll('[lang], blockquote, q, code, pre, samp');
  elements.forEach(element => {
    const lang = element.getAttribute('lang');
    const validLangRegex = /^[a-z]{2}(-[A-Z]{2})?$/; // Basic regex for lang validation, e.g., "en" or "en-US"
    if (lang && !validLangRegex.test(lang)) {
      addIssue(element, `Invalid lang attribute value detected: "${lang}". (Guideline 3.1.2, WCAG Version: 2.0, Level: AA)`);
    } else if (!lang) {
      addIssue(element, `Element should have a lang attribute but it is missing. (Guideline 3.1.2, WCAG Version: 2.0, Level: AA)`);
    }
  });
}

// Check for unusual words (Guideline 3.1.3, WCAG Version: 2.0, Level: AAA)
function checkUnusualWords() {
  const unusualWords = ['ambiguous', 'unfamiliar', 'specific']; // Add more words to the list as needed
  const elements = document.querySelectorAll('p, span, div, li');
  
  elements.forEach(element => {
    const text = element.innerText.trim();
    unusualWords.forEach(word => {
      if (text.includes(word)) {
        const adjacentText = element.nextElementSibling ? element.nextElementSibling.innerText.trim() : '';
        if (!adjacentText.includes('definition') && !adjacentText.includes('glossary')) {
          addIssue(element, `Unusual word detected without definition or glossary: "${word}". (Guideline 3.1.3, WCAG Version: 2.0, Level: AAA)`);
        }
      }
    });
  });
}

// Check for abbreviations (Guideline 3.1.4, WCAG Version: 2.0, Level: AAA)
function checkAbbreviations() {
  const abbreviations = document.querySelectorAll('abbr');
  abbreviations.forEach(abbr => {
    if (!abbr.hasAttribute('title')) {
      addIssue(abbr, `Abbreviation "${abbr.innerText}" without expanded meaning detected. (Guideline 3.1.4, WCAG Version: 2.0, Level: AAA)`);
    }
  });
  
  const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const abbrList = ['NASA', 'HTML', 'CSS', 'JS']; // Add more abbreviations to the list as needed

  while (textNodes.nextNode()) {
    const node = textNodes.currentNode;
    const text = node.nodeValue;
    abbrList.forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      if (regex.test(text) && !node.parentElement.querySelector(`abbr[title="${abbr}"]`)) {
        addIssue(node.parentElement, `Unfamiliar abbreviation "${abbr}" detected without explanation. (Guideline 3.1.4, WCAG Version: 2.0, Level: AAA)`);
      }
    });
  }
}

// The implementation of (Guideline 3.1.5, WCAG Version: 2.0, Level: A) isn't implemented because High content volume makes it challenging to create simplified versions for all materials without substantial resource investment.


// Check for pronunciation guidance (Guideline 3.1.6, WCAG Version: 2.0, Level: AAA)
function checkPronunciation() {
  const essentialWords = ['onomatopoeia', 'antidisestablishmentarianism', 'supercalifragilisticexpialidocious'];
  const pronunciationPattern = /\[.*?\]/; // Pattern to detect pronunciation guide within square brackets

  essentialWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i'); // Case-insensitive match for the word

    function checkTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (regex.test(text)) {
          const hasPronunciation = pronunciationPattern.test(text);
          if (!hasPronunciation) {
            addIssue(node.parentElement, `Essential word "${word}" detected without pronunciation guidance. (Guideline 3.1.6, WCAG Version: 2.0, Level: AAA)`);
          }
        }
      } else {
        node.childNodes.forEach(checkTextNodes);
      }
    }

    document.body.childNodes.forEach(checkTextNodes);
  });
}

// Check for substantial changes on focus (Guideline 3.2.1, WCAG Version: 2.0, Level: A)
function checkOnFocus() {
  const focusedElements = [];

  function detectSubstantialChange(element) {
    const initialContent = document.body.innerHTML;

    element.addEventListener('focus', () => {
      setTimeout(() => {
        const newContent = document.body.innerHTML;
        if (initialContent !== newContent) {
          addIssue(element, 'Element causes substantial change on focus. (Guideline 3.2.1, WCAG Version: 2.0, Level: A)');
        }
      }, 500); // Check for changes 500ms after focus
    });

    focusedElements.push(element);
  }

  document.querySelectorAll('input, select, textarea, button, a, [tabindex]').forEach(element => {
    detectSubstantialChange(element);
  });
}

// Check for substantial changes on input (Guideline 3.2.2, WCAG Version: 2.0, Level: A)
function checkOnInput() {
  const inputElements = [];

  function detectSubstantialChange(element) {
    const initialContent = document.body.innerHTML;

    element.addEventListener('input', () => {
      setTimeout(() => {
        const newContent = document.body.innerHTML;
        if (initialContent !== newContent) {
          addIssue(element, 'Element causes substantial change on input. (Guideline 3.2.2, WCAG Version: 2.0, Level: A)');
        }
      }, 500); // Check for changes 500ms after input
    });

    inputElements.push(element);
  }

  document.querySelectorAll('input, select, textarea, button').forEach(element => {
    detectSubstantialChange(element);
  });
}

// Check for consistent navigation (Guideline 3.2.3, WCAG Version: 2.0, Level: AA)
function checkConsistentNavigation() {
  const navigationContainers = document.querySelectorAll('nav, header, footer');
  const navigationOrders = [];

  navigationContainers.forEach(container => {
    const navLinks = Array.from(container.querySelectorAll('a')).map(link => link.innerText.trim());
    navigationOrders.push(navLinks);
  });

  // Compare navigation orders between containers
  for (let i = 1; i < navigationOrders.length; i++) {
    if (JSON.stringify(navigationOrders[i]) !== JSON.stringify(navigationOrders[0])) {
      addIssue(navigationContainers[i], 'Inconsistent navigation order detected. (Guideline 3.2.3, WCAG Version: 2.0, Level: AA)');
    }
  }
}

// Check for consistent identification (Guideline 3.2.4, WCAG Version: 2.0, Level: AA)
function checkConsistentIdentification() {
  const elementsToCheck = [
    { selector: 'input[type="search"]', expectedLabel: 'Search' },
    { selector: 'button.submit', expectedLabel: 'Submit' },
    { selector: 'a.home', expectedLabel: 'Home' }
  ];

  elementsToCheck.forEach(({ selector, expectedLabel }) => {
    document.querySelectorAll(selector).forEach(element => {
      const label = element.getAttribute('aria-label') || element.innerText.trim() || element.getAttribute('title');
      if (label !== expectedLabel) {
        addIssue(element, `Inconsistent identification detected. Expected label: "${expectedLabel}", Found: "${label}". (Guideline 3.2.4, WCAG Version: 2.0, Level: AA)`);
      }
    });
  });
}

// Check for change on request (Guideline 3.2.5, WCAG Version: 2.0, Level: AAA)
function checkChangeOnRequest() {
  document.querySelectorAll('[data-substantial-change]').forEach(element => {
    const hasUserInitiation = element.getAttribute('data-user-initiated');
    if (!hasUserInitiation) {
      addIssue(element, 'Element causing substantial change without user initiation detected. (Guideline 3.2.5, WCAG Version: 2.0, Level: AAA)');
    }
  });

  // Monitor for pop-ups or focus changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.tagName === 'DIV' && element.style.position === 'fixed') {
              const hasUserInitiation = element.getAttribute('data-user-initiated');
              if (!hasUserInitiation) {
                addIssue(element, 'Pop-up window without user initiation detected. (Guideline 3.2.5, WCAG Version: 2.0, Level: AAA)');
              }
            }

            if (document.activeElement !== element && element.contains(document.activeElement)) {
              const hasUserInitiation = document.activeElement.getAttribute('data-user-initiated');
              if (!hasUserInitiation) {
                addIssue(element, 'Uncontrolled keyboard focus change detected. (Guideline 3.2.5, WCAG Version: 2.0, Level: AAA)');
              }
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// The implementation of (Guideline 3.2.6, WCAG Version: 2.0, Level: A) isn't implemented because technical limitations in providing user customization options without disrupting overall user experience.


// Check for error identification (Guideline 3.3.1, WCAG Version: 2.0, Level: A)
function checkErrorIdentification() {
  const requiredInputs = document.querySelectorAll('input[required], textarea[required], select[required]');

  requiredInputs.forEach(input => {
    if (!input.labels || input.labels.length === 0) {
      addIssue(input, 'Required input without a label detected. (Guideline 3.3.1, WCAG Version: 2.0, Level: A)');
    }
  });

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      let formIsValid = true;

      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          formIsValid = false;
          input.classList.add('error');
          addIssue(input, `Input is required. (Guideline 3.3.1, WCAG Version: 2.0, Level: A)`);
        } else {
          input.classList.remove('error');
        }
      });

      if (!formIsValid) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-summary';
        errorElement.innerHTML = '<p>There are errors in the form. Please fix them and resubmit.</p>';
        document.body.insertBefore(errorElement, form);
      } else {
        // Form is valid, proceed with submission
        form.submit();
      }
    });
  }
}

// Check for sufficient labels or instructions (Guideline 3.3.2, WCAG Version: 2.0, Level: A)
function checkLabelsOrInstructions() {
  document.querySelectorAll('input, select, textarea, button').forEach(element => {
    const label = document.querySelector(`label[for="${element.id}"]`);
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const placeholder = element.getAttribute('placeholder');

    if (!label && !ariaLabel && !ariaLabelledBy && !placeholder) {
      addIssue(element, 'Interactive element without sufficient label or instructions detected. (Guideline 3.3.2, WCAG Version: 2.0, Level: A)');
    }
  });

  document.querySelectorAll('fieldset').forEach(fieldset => {
    const legend = fieldset.querySelector('legend');
    if (!legend) {
      addIssue(fieldset, 'Fieldset without legend detected. (Guideline 3.3.2, WCAG Version: 2.0, Level: A)');
    }
  });
}

// The implementation of (Guideline 3.3.3, WCAG Version: 2.0, Level: A) isn't implemented because requires server-side validation which it's difficult to implement in an extension.

// Check for error prevention in legal, financial, or data changes (Guideline 3.3.4, WCAG Version: 2.0, Level: AA)
function checkErrorPrevention() {
  const elements = document.querySelectorAll('[data-legal], [data-financial], [data-test]');
  
  elements.forEach(element => {
    const types = {
      'data-legal': 'Legal',
      'data-financial': 'Financial',
      'data-test': 'Test'
    };

    let type = '';
    Object.keys(types).forEach(key => {
      if (element.hasAttribute(key)) {
        type = types[key];
      }
    });

    const reversible = element.hasAttribute('data-reversible');
    const verifiable = element.hasAttribute('data-verifiable');
    const confirmed = element.hasAttribute('data-confirmed');

    if (!reversible && !verifiable && !confirmed) {
      addIssue(element, `${type} element without error prevention detected. (Guideline 3.3.4, WCAG Version: 2.0, Level: AA)`);
    } else {
      let message = `${type} element with error prevention: `;
      if (reversible) message += 'reversible ';
      if (verifiable) message += 'verifiable ';
      if (confirmed) message += 'confirmed ';
      console.log(message.trim());
    }
  });
}

// The implementation of (Guideline 3.3.5, WCAG Version: 2.0, Level: A) isn't implemented because existing interface designs do not support contextual help without extensive reengineering.


// Check for error prevention (All) (Guideline 3.3.6, WCAG Version: 2.0, Level: AAA)
function checkErrorPreventionAll() {
  document.querySelectorAll('form').forEach(form => {
    let hasReversible = false;
    let hasVerifiable = false;
    let hasConfirmable = false;

    // Check for data-reversible, data-verifiable, and data-confirmable attributes on the form
    if (form.hasAttribute('data-reversible')) hasReversible = true;
    if (form.hasAttribute('data-verifiable')) hasVerifiable = true;
    if (form.hasAttribute('data-confirmable')) hasConfirmable = true;

    // Check for confirmation dialogs or messages within the form
    const confirmationElements = form.querySelectorAll('[data-confirmation]');
    if (confirmationElements.length > 0) hasConfirmable = true;

    if (!hasReversible || !hasVerifiable || !hasConfirmable) {
      addIssue(form, 'Form submission without error prevention detected. Ensure submission is reversible, verifiable, or confirmed. (Guideline 3.3.6, WCAG Version: 2.0, Level: AAA)');
    }
  });
}

// Check for redundant entry (Guideline 3.3.7, WCAG Version: 2.2, Level: A)
function checkRedundantEntry() {
  document.querySelectorAll('form').forEach(form => {
    let hasAutoComplete = false;
    let hasAutoPopulate = false;

    form.querySelectorAll('input, select, textarea').forEach(input => {
      const autocomplete = input.getAttribute('autocomplete');
      const dataAutoPopulate = input.getAttribute('data-auto-populate');

      if (autocomplete) {
        hasAutoComplete = true;
      }

      if (dataAutoPopulate) {
        hasAutoPopulate = true;
      }
    });

    if (!hasAutoComplete && !hasAutoPopulate) {
      addIssue(form, 'Form without auto-complete or auto-populate detected. (Guideline 3.3.7, WCAG Version: 2.2, Level: A)');
    } else {
      // Check for common fields to auto-populate based on previous inputs
      const fields = {};
      form.querySelectorAll('input, select, textarea').forEach(input => {
        const name = input.getAttribute('name');
        if (name) {
          if (!fields[name]) {
            fields[name] = [];
          }
          fields[name].push(input);
        }
      });

      Object.keys(fields).forEach(name => {
        const inputs = fields[name];
        if (inputs.length > 1) {
          const firstValue = inputs[0].value;
          inputs.forEach(input => {
            if (input.value !== firstValue) {
              addIssue(input, `Inconsistent value for field "${name}". Expected "${firstValue}" but found "${input.value}". (Guideline 3.3.7, WCAG Version: 2.2, Level: A)`);
            }
          });
        }
      });
    }
  });
}

// The implementation of (Guideline 3.3.8, WCAG Version: 2.0, Level: A) isn't implemented because legacy system lacks built-in capabilities for reversibility and confirmation without significant modifications.
// The implementation of (Guideline 3.3.9, WCAG Version: 2.0, Level: A) isn't implemented because existing infrastructure does not support robust error prevention mechanisms for sensitive data changes.
// The implementation of (Guideline 4.1.1, WCAG Version: 2.0, Level: A) isn't implemented because this success criterion is no longer useful and as of 2023 has been removed from WCAG


// Check for appropriate use of name, role, value (Guideline 4.1.2, WCAG Version: 2.0, Level: A)
function checkNameRoleValue() {
  const elements = document.querySelectorAll('input, select, textarea, button, [role]');
  elements.forEach(element => {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    const ariaDescribedby = element.getAttribute('aria-describedby');

    if (!role && (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'select' || element.tagName.toLowerCase() === 'textarea')) {
      addIssue(element, 'Form element without appropriate role detected. (Guideline 4.1.2, WCAG Version: 2.0, Level: A)');
    }

    if (role && !ariaLabel && !ariaLabelledby) {
      addIssue(element, `Element with role "${role}" lacks accessible name. (Guideline 4.1.2, WCAG Version: 2.0, Level: A)`);
    }

    if (ariaLabel && !ariaDescribedby) {
      addIssue(element, `Element with aria-label "${ariaLabel}" lacks descriptive context. (Guideline 4.1.2, WCAG Version: 2.0, Level: A)`);
    }
  });
}

// Check for status messages (Guideline 4.1.3, WCAG Version: 2.0, Level: AA)
function checkStatusMessages() {
  const statusMessages = document.querySelectorAll('[aria-live], [role="alert"], [role="status"], [role="log"], [role="marquee"]');

  statusMessages.forEach(element => {
    const ariaLive = element.getAttribute('aria-live');
    const role = element.getAttribute('role');
    const validAriaLiveValues = ['polite', 'assertive'];
    const validRoles = ['alert', 'status', 'log', 'marquee'];
    
    if (!role && (!ariaLive || !validAriaLiveValues.includes(ariaLive))) {
      addIssue(element, 'Status message without a valid role or aria-live attribute detected. (Guideline 4.1.3, WCAG Version: 2.0, Level: AA)');
    } else if (role && !validRoles.includes(role)) {
      addIssue(element, `Element with invalid role for a status message detected: "${role}". (Guideline 4.1.3, WCAG Version: 2.0, Level: AA)`);
    } else if (role === 'alert' && ariaLive && ariaLive !== 'assertive') {
      addIssue(element, 'Alert role must have aria-live="assertive". (Guideline 4.1.3, WCAG Version: 2.0, Level: AA)');
    } else if ((role === 'status' || role === 'log') && ariaLive && ariaLive !== 'polite') {
      addIssue(element, 'Status or log role must have aria-live="polite". (Guideline 4.1.3, WCAG Version: 2.0, Level: AA)');
    }
  });

  document.querySelectorAll('[role="alert"]').forEach(element => {
    if (!element.hasAttribute('aria-live')) {
      element.setAttribute('aria-live', 'assertive');
    }
  });

  document.querySelectorAll('[role="status"], [role="log"]').forEach(element => {
    if (!element.hasAttribute('aria-live')) {
      element.setAttribute('aria-live', 'polite');
    }
  });
}

// Execute all checks
//Guideline 1.1 (1/1)
  checkNonTextContent();
//Guideline 1.2 (7/9)
  checkAudioTranscripts();
  checkVideoTranscriptsAndCaptions();
  checkAudioDescriptionOrMediaAlternative();
  checkLiveMediaCaptions();
  checkAudioDescriptionOrMediaAlternative_1_2_5();
  checkSignLanguage();
  checkExtendedAudioDescription();
//Guideline 1.3 (4/3)
  checkInputLabels();
  checkMeaningfulSequence();
  checkSensoryCharacteristics();
  checkIdentifyInputPurpose(); //part of WCAG 2.1
//Guideline 1.4 (7/9)
  checkUseOfColor();
  checkImagesOfText();
  checkVisualPresentation();
  checkReflow();  //part of WCAG 2.1
  checkNonTextContrast(); //part of WCAG 2.1
  checkTextSpacing(); //part of WCAG 2.1
  checkHoverFocusContent(); //part of WCAG 2.1
//Guideline 2.1 (1/3)
  checkKeyboardAccessibility();
  checkCharacterKeyShortcuts();
 //Guideline 2.2 (5/5)
  checkTimingAdjustable();
  checkPauseStopHide();
  checkNoTiming();
  checkInterruptions();
  checkReAuthenticating();
//Guideline 2.3 (2/2)
  checkFlashingContent();
  checkThreeFlashes();
//Guideline 2.4 (3/10)
  checkBypassBlocks();
  checkFocusOrder();
  checkHeadingsAndLabels(); 
//Guideline 2.5 (Part of WCAG 2.1)
  checkPointerGestures();
  checkPointerCancellation();
  checkLabelInName();
  checkMotionActuation();
  checkTargetSize();
  checkConcurrentInputMechanisms();
  checkDraggingMovements();
  checkTargetSizeMinimum();
//Guideline 3.1 (4/6)
  checkLanguageOfParts();
  checkUnusualWords();
  checkAbbreviations();
  checkPronunciation();
//Guideline 3.2 (5/5)
  checkOnFocus();
  checkOnInput();
  checkConsistentNavigation();
  checkConsistentIdentification();
  checkChangeOnRequest();
//Guideline 3.3 (5/6)
  checkErrorIdentification();
  checkLabelsOrInstructions();
  checkErrorPrevention();
  checkErrorPreventionAll();
  checkRedundantEntry();//WCAG 2.1
  //Guideline 4.1 (1/1) OK
  checkNameRoleValue();
  checkStatusMessages();

  console.log('Compliance check completed. Issues found:', issues); // Debugging line
}

// Link the CSS file
const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);