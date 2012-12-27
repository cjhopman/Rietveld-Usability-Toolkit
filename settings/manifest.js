this.manifest = {
    "name": "My Extension",
    "icon": "icon.png",
    "settings": [
        {
            "tab": "Options",
            "group": "patchset page",
            "name": "inlineDiff",
            "type": "checkbox",
            "label": "Enable inline diffs",
        },
        {
            "tab": "Details",
            "group": "patchset page",
            "name": "ttt",
            "type": "checkbox",
            "label": "Enable inline diffs",
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("x-characters")
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("x-characters-pw"),
            "masked": true
        },
    ],
    "alignment": [
    ]
};
