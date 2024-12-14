import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = 'prompt-collapse';
let collapsedPrompts = new Set();

// Load collapsed state from settings
function loadCollapsedState() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (extension_settings[extensionName].collapsedPrompts) {
    collapsedPrompts = new Set(extension_settings[extensionName].collapsedPrompts);
  }
}

// Save collapsed state to settings
function saveCollapsedState() {
  extension_settings[extensionName].collapsedPrompts = Array.from(collapsedPrompts);
  saveSettingsDebounced();
}

// Create collapsed prompt element
function createCollapsedElement(identifier, name) {
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
  return $(`<div class="prompt-collapsed-item" data-prompt-id="${identifier}">${initials}</div>`);
}

// Handle collapse/uncollapse
function togglePromptCollapse(promptElement, identifier) {
  const isCollapsed = collapsedPrompts.has(identifier);

  if (!isCollapsed) {
    // Collapse
    collapsedPrompts.add(identifier);
    promptElement.hide();

    let container = $('.collapsed-prompts-container');
    if (container.length === 0) {
      container = $('<div class="collapsed-prompts-container"></div>');
      $('.completion_prompt_manager_list_separator').after(container);
    }

    const name = promptElement.find('[data-pm-name]').attr('data-pm-name');
    container.append(createCollapsedElement(identifier, name));
  } else {
    // Uncollapse
    collapsedPrompts.delete(identifier);
    promptElement.show();
    $(`.prompt-collapsed-item[data-prompt-id="${identifier}"]`).remove();

    // Remove container if empty
    const container = $('.collapsed-prompts-container');
    if (container.find('.prompt-collapsed-item').length === 0) {
      container.remove();
    }
  }

  saveCollapsedState();
}

// Modified function to add collapse buttons
function addCollapseButtons() {
  $('.completion_prompt_manager_prompt').each(function() {
    const promptElement = $(this);
    const controlsElement = promptElement.find('.prompt_manager_prompt_controls');
    const identifier = promptElement.data('pm-identifier');

    // Only add if the button doesn't exist yet
    if (controlsElement.length && !controlsElement.find('.prompt-collapse-button').length) {
        const collapseButton = $(`
            <span class="prompt-collapse-button fa-solid fa-paperclip"
                  style="margin-right: 5px; cursor: pointer;">
            </span>
        `);

        // Insert at the beginning of controls
        controlsElement.prepend(collapseButton);

      collapseButton.on('click', (e) => {
          e.stopPropagation();
        togglePromptCollapse(promptElement, identifier);
      });
    }

      // Apply collapsed state if needed
      if (collapsedPrompts.has(identifier)) {
        promptElement.hide();
        const name = promptElement.find('[data-pm-name]').attr('data-pm-name');
        let container = $('.collapsed-prompts-container');
        if (container.length === 0) {
          container = $('<div class="collapsed-prompts-container"></div>');
          $('.completion_prompt_manager_list_separator').after(container);
        }
         if (!container.find(`[data-prompt-id="${identifier}"]`).length) {
            container.append(createCollapsedElement(identifier, name));
        }
      }
  });
}

// Handle clicking collapsed prompts
$(document).on('click', '.prompt-collapsed-item', function() {
  const identifier = $(this).data('prompt-id');
  const promptElement = $(`.completion_prompt_manager_prompt[data-pm-identifier="${identifier}"]`);
  togglePromptCollapse(promptElement, identifier);
});

// Modified initialization
jQuery(async () => {
    // Wait for document ready
    $(document).ready(() => {
        // Ensure prompt manager exists
        const waitForManager = setInterval(() => {
            if ($('#completion_prompt_manager_list').length) {
                clearInterval(waitForManager);
                loadCollapsedState();
                addCollapseButtons();

          // Set up observer
                const observer = new MutationObserver((mutations) => {
                    addCollapseButtons();
                });

                observer.observe(document.getElementById('completion_prompt_manager_list'), {
                    childList: true,
                    subtree: true
                });
            }
        }, 100);
    });
});
