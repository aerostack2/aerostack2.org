"""Sphinx configuration, run through scripts/build-pydocs.sh."""

import os
import re
from pathlib import Path

source = Path(os.environ["PYDOCS_INPUT"])
release = os.environ["PYDOCS_VERSION"]

project = "Aerostack2"
html_title = f"Aerostack2 {release} Python API"

# AutoAPI reads the source without importing it, so the build needs no ROS.
extensions = ["autoapi.extension"]
packages = ["as2_python_api", "as2_core", "as2_motion_reference_handlers"]
# Older releases may not have every package.
autoapi_dirs = [
    str(source / package / package)
    for package in packages
    if (source / package / package).is_dir()
]
autoapi_root = "api"
autoapi_add_toctree_entry = False  # index.rst lists it.
autoapi_ignore = ["*/test/*", "*/tests/*"]
autoapi_options = ["members", "undoc-members", "show-inheritance", "show-module-summary"]
autoapi_python_class_content = "both"
autoapi_member_order = "groupwise"

templates_path = ["_templates"]
html_theme = "furo"
html_static_path = ["_static"]
html_css_files = ["theme.css"]
html_js_files = ["site.js"]
html_show_sourcelink = False
html_copy_source = False
html_show_sphinx = False
html_sidebars = {
    "**": [
        "sidebar/search.html",
        "sidebar/scroll-start.html",
        "sidebar/navigation.html",
        "sidebar/scroll-end.html",
    ]
}

# The site's palette, from src/app/theme-linear.css.
fonts = {
    "font-stack": '"IBM Plex Sans", system-ui, sans-serif',
    "font-stack--monospace": '"IBM Plex Mono", ui-monospace, monospace',
    "font-stack--headings": '"IBM Plex Serif", Georgia, serif',
}


def palette(background, foreground, muted, muted_foreground, card, border, primary, accent):
    return {
        "color-background-primary": background,
        "color-background-secondary": card,
        "color-background-hover": accent,
        "color-background-hover--transparent": "transparent",
        "color-background-border": border,
        "color-background-item": muted,
        "color-foreground-primary": foreground,
        "color-foreground-secondary": muted_foreground,
        "color-foreground-muted": muted_foreground,
        "color-foreground-border": border,
        "color-brand-primary": primary,
        "color-brand-content": primary,
        "color-brand-visited": primary,
        "color-link": primary,
        "color-link--hover": primary,
        "color-link--visited": primary,
        "color-link-underline": "transparent",
        "color-link-underline--hover": primary,
        "color-link-underline--visited": "transparent",
        "color-sidebar-background": background,
        "color-sidebar-background-border": border,
        "color-sidebar-link-text": muted_foreground,
        "color-sidebar-link-text--top-level": muted_foreground,
        "color-sidebar-item-background--current": f"color-mix(in oklab, {primary} 10%, transparent)",
        "color-sidebar-item-background--hover": accent,
        "color-sidebar-search-background": background,
        "color-sidebar-search-border": border,
        "color-toc-background": background,
        "color-toc-title-text": foreground,
        "color-toc-item-text": muted_foreground,
        "color-toc-item-text--hover": foreground,
        "color-toc-item-text--active": primary,
        "color-header-background": background,
        "color-header-border": border,
        "color-header-text": foreground,
        "color-inline-code-background": f"color-mix(in oklab, {primary} 8%, transparent)",
        "color-code-background": card,
        "color-code-foreground": foreground,
        "color-api-background": card,
        "color-api-background-hover": accent,
        "color-api-name": foreground,
        "color-api-pre-name": muted_foreground,
        "color-api-keyword": muted_foreground,
        "color-highlight-on-target": f"color-mix(in oklab, {primary} 12%, transparent)",
    }


html_theme_options = {
    "light_css_variables": {
        **fonts,
        **palette(
            "#ffffff", "#282a30", "#f4f4f5", "#6f6e77", "#f9f8f9", "#e9e8ea", "#1348dc", "#f4f2f4"
        ),
    },
    "dark_css_variables": palette(
        "#16181d", "#edeef3", "#1f2228", "#9aa0ac", "#1a1d23", "#2d3139", "#6b96ff", "#282c34"
    ),
    "top_of_page_buttons": [],
}


def shorten_sidebar_names(app, pagename, templatename, context, doctree):
    """Show each module by its last segment, since the tree already shows its parents."""
    tree = context.get("furo_navigation_tree")
    if tree:
        context["furo_navigation_tree"] = re.sub(
            r'(<a class="[^"]*reference internal[^>]*>)(?:\w+\.)*(\w+)(</a>)',
            # <wbr> lets a long name wrap at an underscore rather than mid-word.
            lambda m: m[1] + m[2].replace("_", "_<wbr>") + m[3],
            tree,
        )


def setup(app):
    # Runs after Furo's own handler, which builds the tree.
    app.connect("html-page-context", shorten_sidebar_names, priority=1000)
