import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "prompt-collapse";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
// Keep track of the collapsed state in an object.
const defaultSettings = {
  collapsedPrompts: {}
};

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

  // Apply collapsed state on load.
  applyCollapsedState();
}

// Save the current `collapsed state`.
function saveCollapsedState() {
    saveSettingsDebounced();
}

// Function to create the collapse button
function createToggleButton(promptLi) {
    // Get prompt name.
        const promptId = $(promptLi).data('pm-identifier');
        // Get controls container.
        const controlsSpan = $(promptLi).find('.prompt_manager_prompt_controls');
        // If the button already exist, exit.
        if (controlsSpan.find('.prompt-collapse-button').length > 0) return;
        // Construct new button element
        const button = $(`<span class="prompt-collapse-button fa-solid fa-compress" title="Toggle Collapse"></span>`);
        // Event Listener to toggler
        button.on('click', function () {
                toggleCollapse(promptLi);
        });

    controlsSpan.prepend(button);
}

// Function to toggle the collapse state of a prompt.
function toggleCollapse(promptLi) {
    const promptId = $(promptLi).data('pm-identifier');
    const isCollapsed = extensionSettings.collapsedPrompts[promptId];

    if(isCollapsed) {
         unCollapsePrompt(promptLi);
    }
    else {
         collapsePrompt(promptLi);
    }

    extensionSettings.collapsedPrompts[promptId] = !isCollapsed;
    saveCollapsedState();
}

function unCollapsePrompt(promptLi) {
        const promptId = $(promptLi).data('pm-identifier');
        $(promptLi).removeClass("collapsed-prompt");

        const collapsedButton = $(promptLi).data('collapsedButton');
        if(collapsedButton) {
                collapsedButton.remove();
                $(promptLi).removeData('collapsedButton');
        }
}

function collapsePrompt(promptLi) {
        const promptId = $(promptLi).data('pm-identifier');
        const promptName = $(promptLi).find('.completion_prompt_manager_prompt_name a').text().trim();

        $(promptLi).addClass("collapsed-prompt");

        // Get the first letter of each word in the prompt name.
        const initials = promptName.split(' ').map(word => word.charAt(0).toUpperCase()).join('');

        const collapsedButton = $(`<li class="collapsed-prompt-button" title="` + promptName + `"><span>` + initials + `</span></li>`);
        // Click to un-collapse
        collapsedButton.on('click', function(){
              toggleCollapse(promptLi);
        })

         $(promptLi).data('collapsedButton', collapsedButton);
         $(promptLi).before(collapsedButton);
}

// Function to apply the collasped state when the prompt manager updates.
function applyCollapsedState() {
        // Get list of each prompt
     $('#completion_prompt_manager_list > li[data-pm-identifier]').each(function () {
             const promptId = $(this).data('pm-identifier');
            //  If is collapsed, collapse.
            if(extensionSettings.collapsedPrompts[promptId] === true) {
                collapsePrompt(this);
            }
            // Create button
            createToggleButton(this);
         });
}


jQuery(async () => {
  // Everytime the list is updated, apply the collapse
  $("#completion_prompt_manager_list").on('DOMNodeInserted', function(event){
                if (!$(event.target).hasClass('completion_prompt_manager_prompt')) return;
            applyCollapsedState();
        })

  loadSettings();
  // Append settings after all elements are loaded to make sure we can inject.
});
