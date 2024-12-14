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

// Add collapse buttons to prompts
function addCollapseButtons() {
    $('.completion_prompt_manager_prompt').each(function() {
        const promptElement = $(this);
        const identifier = promptElement.data('pm-identifier');

        if (!promptElement.find('.prompt-collapse-button').length) {
            const collapseButton = $('<span class="prompt-collapse-button fa-solid fa-paperclip"></span>');
            promptElement.find('.prompt_manager_prompt_controls').prepend(collapseButton);

            collapseButton.on('click', () => togglePromptCollapse(promptElement, identifier));
        }

        // Apply collapsed state
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

// Initialize
jQuery(async () => {
    loadCollapsedState();
    addCollapseButtons();

    // Monitor for changes in prompt manager
    const observer = new MutationObserver(() => {
        addCollapseButtons();
    });

    observer.observe(document.getElementById('completion_prompt_manager_list'), {
        childList: true,
        subtree: true
    });
});
