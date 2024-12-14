import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "prompt_collapse";
const extensionSettings = extension_settings[extensionName] = extension_settings[extensionName] || {};
extensionSettings.collapsedPrompts = extensionSettings.collapsedPrompts || [];

function addClampButtons() {
    $('.prompt_manager_prompt_controls').each(function() {
        if (!$(this).find('.clamp-button').length) {
            $(this).prepend('<span class="clamp-button">🗜️</span>');
        }
    });
}

function createCollapsedButton(promptElement) {
    const promptId = promptElement.find('[data-pm-identifier]').data('pm-identifier');
    const button = $(`<div class="prompt-button">${promptId.substring(0, 2).toUpperCase()}</div>`);

    button.on('click', () => {
        uncollapsePrompt(promptElement);
    });

    return button;
}

function collapsePrompt(promptElement) {
    const promptId = promptElement.find('[data-pm-identifier]').data('pm-identifier');
    promptElement.addClass('prompt-collapsed');

    // Create and insert collapsed button
    const collapsedButton = createCollapsedButton(promptElement);
    promptElement.before(collapsedButton);

    // Store collapsed state
    if (!extensionSettings.collapsedPrompts.includes(promptId)) {
        extensionSettings.collapsedPrompts.push(promptId);
        saveSettingsDebounced();
    }
}

function uncollapsePrompt(promptElement) {
    const promptId = promptElement.find('[data-pm-identifier]').data('pm-identifier');
    promptElement.removeClass('prompt-collapsed');

    // Remove collapsed button
    promptElement.prev('.prompt-button').remove();

    // Remove from collapsed state
    extensionSettings.collapsedPrompts = extensionSettings.collapsedPrompts.filter(id => id !== promptId);
    saveSettingsDebounced();
}

function restoreCollapsedState() {
    extensionSettings.collapsedPrompts.forEach(promptId => {
        const promptElement = $(`[data-pm-identifier="${promptId}"]`).closest('.prompt_manager_prompt');
        if (promptElement.length) {
            collapsePrompt(promptElement);
        }
    });
}

// Observer to handle dynamic updates
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            addClampButtons();
            restoreCollapsedState();
        }
    });
});

jQuery(async () => {
    // Initial setup
    addClampButtons();
    restoreCollapsedState();

    // Setup click handlers
    $(document).on('click', '.clamp-button', function() {
        const promptElement = $(this).closest('.prompt_manager_prompt');
        collapsePrompt(promptElement);
    });

    // Start observing the prompt manager for changes
    const targetNode = document.getElementById('prompt_manager_prompts');
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
    }
});
