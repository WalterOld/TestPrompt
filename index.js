import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "prompt-collapse";
const extensionSettings = extension_settings[extensionName] = extension_settings[extensionName] || {};
extensionSettings.collapsedPrompts = extensionSettings.collapsedPrompts || [];

// Add clamp buttons to prompts
function addClampButtons() {
    $('.prompt_manager_prompt_controls').each(function() {
        if (!$(this).find('.clamp-button').length) {
            $(this).prepend('<span class="clamp-button">🗜️</span>');
        }
    });
}

// Create collapsed prompt button
function createCollapsedButton(prompt) {
    const identifier = prompt.attr('data-pm-identifier');
    const name = prompt.find('.completion_prompt_manager_prompt_name a').text().trim();
    const initials = name.split(' ').map(word => word[0]).join('');

    return $(`<div class="prompt-collapsed" data-prompt-id="${identifier}">${initials}</div>`);
}

// Handle collapse/uncollapse
function togglePromptCollapse(prompt) {
    const identifier = prompt.attr('data-pm-identifier');
    const isCollapsed = prompt.hasClass('collapsed');

    if (!isCollapsed) {
        // Collapse
        prompt.addClass('collapsed');
        const collapsedBtn = createCollapsedButton(prompt);
        $('.completion_prompt_manager_list_separator').after(collapsedBtn);

        if (!extensionSettings.collapsedPrompts.includes(identifier)) {
            extensionSettings.collapsedPrompts.push(identifier);
        }
    } else {
        // Uncollapse
        prompt.removeClass('collapsed');
        $(`.prompt-collapsed[data-prompt-id="${identifier}"]`).remove();

        extensionSettings.collapsedPrompts = extensionSettings.collapsedPrompts.filter(id => id !== identifier);
    }

    saveSettingsDebounced();
}

// Restore collapsed state
function restoreCollapsedState() {
    extensionSettings.collapsedPrompts.forEach(identifier => {
        const prompt = $(`.completion_prompt_manager_prompt[data-pm-identifier="${identifier}"]`);
        if (prompt.length) {
            togglePromptCollapse(prompt);
        }
    });
}

// Event listeners
jQuery(async () => {
    // Initial setup
    addClampButtons();
    restoreCollapsedState();

    // Click handlers
    $(document).on('click', '.clamp-button', function(e) {
        e.stopPropagation();
        const prompt = $(this).closest('.completion_prompt_manager_prompt');
        togglePromptCollapse(prompt);
    });

    $(document).on('click', '.prompt-collapsed', function() {
        const identifier = $(this).attr('data-prompt-id');
        const prompt = $(`.completion_prompt_manager_prompt[data-pm-identifier="${identifier}"]`);
        togglePromptCollapse(prompt);
    });

    // Observer for dynamic updates
    const observer = new MutationObserver(() => {
        addClampButtons();
    });

    observer.observe(document.getElementById('completion_prompt_manager_list'), {
        childList: true,
        subtree: true
    });
});
