export const en = {
    translation: {
        app: {
            layout: "Layout",
            open: "Open",
            folder: "Folder",
            hide_explorer: "Hide Explorer",
            show_explorer: "Show Explorer",
            explorer: "Explorer",
            file_explorer: "File Explorer",
            function_library: "Function Library",
            notes_library: "Notes Library",
            select_file: "Select a file to edit",
            open_folder_hint: "Open a folder or file to start",
            window_controls: {
                minimize: "Minimize",
                maximize: "Maximize",
                close: "Close"
            },
            confirm_save: {
                title: "Save changes?",
                message: "The file \"{{fileName}}\" has unsaved changes.",
                save: "Save",
                cancel: "Cancel",
                discard: "Discard"
            },
            confirm_close_folder: {
                title: "Close Project?",
                message: "Are you sure you want to close the current folder? Any unsaved changes will be lost."
            },
            common: {
                delete: "Delete",
                cancel: "Cancel",
                remove: "Remove",
                save: "Save",
                discard: "Discard",
                confirm: "Confirm"
            },
            tooltips: {
                blueprints: "Blueprints Environment",
                git: "Git (Version Control)",
                settings: "Settings",
                theme_light: "Light Mode",
                theme_dark: "Dark Mode"
            },
            settings: {
                title: "Settings",
                categories: {
                    general: "General",
                    terminal: "Terminal",
                    appearance: "Appearance"
                },
                groups: {
                    files: "Files",
                    canvas: "Canvas",
                    localization: "Localization",
                    behavior: "Behavior",
                    interface: "Interface",
                    typography: "Typography"
                },
                fields: {
                    auto_save: {
                        label: "Auto Save",
                        desc: "Save changes to files instantly when editing."
                    },
                    auto_layout: {
                        label: "Auto-Layout",
                        desc: "Automatically organize nodes when generating canvas code."
                    },
                    language: {
                        label: "Language",
                        desc: "Define the language displayed in the interface."
                    },
                    terminal_copy: {
                        label: "Auto-Copy",
                        desc: "Automatically copy selected text to clipboard."
                    },
                    terminal_paste: {
                        label: "Right-Click Paste",
                        desc: "Paste clipboard content when right-clicking in terminal."
                    },
                    theme: {
                        label: "Dark Mode",
                        label_light: "Light Mode",
                        desc: "Toggle between application light and dark themes."
                    },
                    font_size: {
                        label: "Font Size",
                        desc: "Define the base font size for interface elements."
                    }
                },
                terminal_info: "These options are enabled by default to emulate professional terminal behavior (like Putty/XShell) and bypass the use of Ctrl+C for process control.",
                json_warning: "Edit settings.json manually. Changes apply after restart.",
                reset_title: "Reset Settings",
                reset_confirm: "Are you sure you want to reset all settings to defaults? This will revert theme, editor, and terminal adjustments.",
                reset_button: "Reset to Defaults"
            },
            errors: {
                generic: "Error: {{error}}",
                move: "Move error: {{error}}",
                delete_soon: "Delete functionality coming soon"
            }
        },
        note: {
            title_placeholder: "Note Title",
            text_placeholder: "Type your notes...",
            delete: "Delete",
            delete_title: "Delete Note",
            delete_confirm: "Are you sure you want to delete the note \"{{label}}\"?"
        },
        edge: {
            add_comment: "Add Comment",
            edit_comment: "Edit Comment",
            delete_connection: "Delete Connection",
            comment_prompt: "Enter comment for this connection:"
        },
        file_explorer: {
            no_folder: "No folder opened",
            open_button: "Open Folder",
            close_folder: "Close Folder",
            already_exists: "An item with this name already exists in the destination.",
            new_js: "New JS File",
            new_ts: "New TS File",
            new_folder: "New Folder",
            delete: "Delete",
            new_file_placeholder: "File name{{ext}}...",
            new_folder_placeholder: "Folder name...",
            actions: {
                new_folder: "New Folder",
                new_js: "New JS",
                new_ts: "New TS",
                new_md: "New MD Note",
                new_block: "New Block (.block)"
            },
            delete_title: "Delete Item",
            delete_confirm: "Are you sure you want to delete \"{{name}}\"? This cannot be undone.",
            delete_success: "Item deleted successfully",
            rename: "Rename",
            rename_success: "Item renamed successfully"
        },
        library: {
            search_placeholder: "Search functions...",
            new_block_note: "New Block Note",
            no_functions: "No functions found",
            dive: "Dive",
            categories: {
                logic: "Logic",
                variables: "Variables",
                loops: "Loops",
                functions: "Functions",
                native: "Native"
            },
            notes: {
                title: "File Notes",
                no_notes: "No notes found",
                search_placeholder: "Search info in notes..."
            }
        },
        recent: {
            title: "Recents",
            favorites: "Favorites",
            welcome: "Welcome!",
            empty_message: "Your recent environments will appear here.",
            welcome_back: "Welcome back",
            select_env: "Select an environment to continue working",
            open_new: "Open New Environment",
            remove: "Remove",
            favorite: "Favorite",
            tag: "Tag",
            none: "None",
            remove_title: "Remove from Recents",
            remove_confirm: "Remove {{path}} from recent history?",
            labels: {
                personal: "Personal",
                work: "Work",
                fun: "Fun",
                other: "Other"
            },
            time: {
                now: "just now",
                minutes: "minutes ago",
                hours: "hours ago",
                days: "days ago",
                months: "months ago",
                years: "years ago"
            }
        },
        git: {
            common: {
                refresh: "Refresh",
                delete: "Delete",
                cancel: "Cancel",
                unknown_author: "Unknown Author",
                days: {
                    sun: "Sun",
                    mon: "Mon",
                    tue: "Tue",
                    wed: "Wed",
                    thu: "Thu",
                    fri: "Fri",
                    sat: "Sat"
                }
            },
            status: {
                title: "Changes",
                untracked: "Untracked",
                staged: "Staged Changes",
                modified: "Modified",
                empty: "All clean, working directory clean",
                commit_placeholder: "Commit message...",
                commit_button: "Commit",
                push_tooltip: "Push changes to remote",
                pull_tooltip: "Pull changes from remote",
                refresh_tooltip: "Refresh Status",
                ignore_tooltip: "Manage .gitignore",
                template_tooltip: "Commit Templates",
                discard: "Discard",
                stage: "Stage Changes",
                unstage: "Unstage Changes",
                open: "Open File",
                stage_all: "Stage All Changes",
                unstage_all: "Unstage All",
                unstage_all_tooltip: "Remove all files from the staging area.",
                discard_all: "Discard All Changes",
                amend_label: "Amend Last Commit",
                amend_tooltip: "Merge changes into the last commit instead of creating a new one.",
                stage_all_tooltip: "Stage all modified files for commit.",
                discard_all_tooltip: "Permanently revert all unstaged changes.",
                undo_commit_tooltip: "Undo last commit (keep changes).",
                undo_commit_empty_tooltip: "No history to undo.",
                stash_tooltip: "Save current changes (Stash).",
                stash_empty_tooltip: "Nothing to stash.",
                pop_tooltip: "Restore saved changes (Pop).",
                pop_empty_tooltip: "No stashes available.",
                view_stashes_tooltip: "View all saved changes.",
                pop_confirm_title: "Restore Changes?",
                pop_confirm_desc: "Brings changes back and removes from list.",
                apply_confirm_desc: "Applies changes but keeps in list.",
                drop_confirm_title: "Permanently Delete?",
                drop_confirm_desc: "This action cannot be undone.",
                undo_confirm_title: "Undo Last Commit?",
                undo_confirm_desc: "Removes original commit but keeps files as they are (Soft Reset).",
                no_changes: "No changes to view",
                view_list: "Switch to List View",
                view_tree: "Switch to Tree View",
                history_list: "Commit List",
                history_refresh: "Refresh History",
                history_filter_placeholder: "Filter commits...",
                history_empty: "No commits found",
                history_files_changed: "Files Changed",
                history_checkout_tooltip: "Switch to this commit (Detached Head)",
                history_branch_tooltip: "Create new branch from here",
                history_tag_tooltip: "Mark this point in history (Tag)",
                history_loading_files: "Loading files...",
                history_no_files: "No files listed",
                clean_untracked_tooltip: "Remove all untracked files (Git Clean)",
                clean_untracked_label: "Clean Untracked",
                clean_confirm_title: "Clean Untracked Files",
                clean_confirm_desc: "This will PERMANENTLY delete {{count}} untracked files/folders. This action cannot be undone.",
                clean_confirm_button: "Clean All",
                action_unstage_tooltip: "Remove from staging area",
                action_stage_tooltip: "Stage for commit",
                action_discard_tooltip: "Discard changes",
                action_ignore_tooltip: "Add to .gitignore",
                ignore_confirm_title: "Ignore File",
                ignore_confirm_desc: "How would you like to ignore \"{{path}}\"?",
                ignore_confirm_this: "Ignore this File",
                ignore_confirm_all: "Ignore all {{ext}}"
            },
            detail: {
                title: "Details",
                author: "Author",
                date: "Date",
                files_changed: "Files Changed",
                no_files: "No file changes detected",
                checkout: "Checkout",
                new_branch: "New Branch",
                new_tag: "New Tag",
                branch_modal_title: "Create Branch from this Commit",
                tag_modal_title: "Create Tag on this Commit",
                branch_placeholder: "New branch name",
                tag_placeholder: "Tag name (ex: v1.0.0)"
            },
            graph: {
                title: "Commit Graph",
                author: "Author",
                date: "Date",
                hash: "Hash",
                message: "Message",
                no_commits: "No commits found in this repository."
            },
            info: {
                title: "Analytics",
                settings_tooltip: "Configure section visibility",
                sections: {
                    overview: "Overview",
                    stats: "Statistics",
                    weekly: "Weekly Activity",
                    hourly: "Peak Hours",
                    contributors: "Contributor Ranking",
                    tags: "Tags & Versions"
                },
                tooltips: {
                    overview: "Contribution Heatmap",
                    stats: "Real repository metrics",
                    weekly: "Distribution by day of week",
                    hourly: "24h productivity analysis",
                    contributors: "Commit leadership by author",
                    tags: "Repository Tag Management"
                },
                stats: {
                    branches: "Branches",
                    commits: "Commits",
                    stashes: "Stashes",
                    files: "Files",
                    git_size: ".git Size",
                    project_size: "Project",
                    tooltips: {
                        branches: "Total branches in project",
                        commits: "Total version history",
                        stashes: "Temporarily saved changes",
                        files: "Files tracked by Git",
                        git_size: "Metadata and history size",
                        project_size: "Total working folder size"
                    }
                },
                heatmap: {
                    less: "Less",
                    more: "More",
                    contributions: "contributions"
                },
                tags: {
                    empty: "No tags found in this repository.",
                    delete_title: "Delete Tag",
                    delete_confirm: "Are you sure you want to delete tag {{tag}}?",
                    delete_tooltip: "Delete Tag"
                },
                panel_config: {
                    title: "Customize Panel",
                    subtitle: "Choose which metrics to see",
                    visible: "Visible",
                    hidden: "Hidden",
                    restored: "Restored!",
                    reset: "Reset Defaults"
                }
            },
            terminal: {
                title: "Integrated Terminal",
                macros_tooltip: "Custom shortcuts for quick command execution",
                auto_copy: "Auto-Copy",
                click_paste: "Click-Paste",
                external: "External",
                external_tooltip: "Open in System Terminal",
                prompt: {
                    title: "Confirmation Required",
                    message: "The process is awaiting your response",
                    yes: "Yes",
                    no: "No"
                },
                suggestion: {
                    title: "Git Suggestion",
                    message: "Did you mean",
                    ignore: "Ignore",
                    fix: "Fix Now"
                },
                success: {
                    title: "Git Commit",
                    message: "done!",
                    undo: "Undo"
                },
                progress: {
                    npm: "NPM Install/Build...",
                    git: "Git Operation...",
                    default: "Processing Task..."
                },
                modal: {
                    title: "Configure Execution Shortcut",
                    name_label: "Shortcut Name",
                    name_placeholder: "Ex: Start Dev",
                    cmd_label: "SQL/Bash Instruction",
                    cmd_placeholder: "Ex: npm run dev",
                    interaction_label: "Interaction Mode",
                    auto_exec: {
                        title: "Automatic Execution",
                        desc: "Command is sent and processed immediately upon clicking."
                    },
                    fill_only: {
                        title: "Fill Only",
                        desc: "Inserts code into prompt, allowing review before manual execution."
                    },
                    cancel: "Cancel",
                    create: "Create Shortcut"
                }
            },
            modals: {
                ignore: {
                    title: "Edit: .gitignore",
                    desc: "Define file patterns that Git should ignore",
                    placeholder: "Ex: node_modules/\\n/dist/\\n*.log",
                    save: "Save Changes",
                    cancel: "Cancel",
                    success_toast: ".gitignore updated successfully!",
                    error_toast: "Error saving .gitignore"
                },
                template: {
                    title: "Commit Templates",
                    empty_title: "No templates saved.",
                    empty_subtitle: "Create one to speed up your commits!",
                    use: "Use Template",
                    new: "New Template",
                    name_label: "Template Name (Identifier)",
                    name_placeholder: "Ex: Daily Update, Release Notes...",
                    content_label: "Template Content",
                    add_description: "Add Description to Template",
                    subject_label: "Subject",
                    subject_placeholder: "Template subject...",
                    body_label: "Body (Description)",
                    body_placeholder: "Detailed description...",
                    collapse_description: "Collapse Description",
                    save_button: "Save Template"
                },
                author: {
                    title: "Author Identity",
                    manage_profiles: "Manage Profiles",
                    save: "Save Changes",
                    new_profile: "New Profile",
                    name_placeholder: "Full Name",
                    email_placeholder: "Email",
                    custom_tag: "Custom",
                    custom_tag_placeholder: "Flag Name (Ex: Freelance)",
                    create_profile: "Create Profile",
                    existing_profiles: "Existing Profiles",
                    no_profiles: "No profile registered.",
                    scope_label: "Configuration Scope",
                    scope_local: "Local",
                    scope_local_desc: "Only this project",
                    scope_global: "Global",
                    scope_global_desc: "All projects",
                    active_badge: "Active",
                    edit_global: "Edit Global Config",
                    quick_profiles: "Quick Profiles",
                    global_missing: "Global configuration not found. Configure your global author for all projects.",
                    name_label: "Name",
                    email_label: "Email"

                }
            }
        }
    }
};
